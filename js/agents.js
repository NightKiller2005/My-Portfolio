/*
 * agents.js — robot cursor agents.
 * Each Agent owns one DOM node in the agent layer and knows how to travel
 * (curved, eased path), follow a moving point, idle and exit. The build engine
 * decides where agents go; agents only handle motion and rendering.
 */
(function () {
  "use strict";

  const ROSTER = [
    { name: "Scout", color: "#38bdf8" },
    { name: "Layout", color: "#fb923c" },
    { name: "Typeset", color: "#facc15" },
    { name: "Motion", color: "#4ade80" },
    { name: "QA", color: "#f472b6" },
    { name: "Deploy", color: "#2dd4bf" },
    { name: "Copy", color: "#e4e4e7" },
    { name: "Lint", color: "#a3e635" },
    { name: "Index", color: "#67e8f9" },
    { name: "Render", color: "#fbbf24" },
    { name: "Palette", color: "#fda4af" },
    { name: "Review", color: "#93c5fd" },
  ];

  const CURSOR_SVG =
    '<svg class="agent__cursor" viewBox="0 0 18 21" aria-hidden="true">' +
    '<path d="M1.2 1.2 L1.2 16.6 L5.3 12.9 L8 19.2 L10.9 17.9 L8.3 11.8 L13.9 11.8 Z"/></svg>';

  const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  class Agent {
    constructor(def, index, layer) {
      this.name = def.name;
      this.color = def.color;
      this.index = index;
      this.x = -300;
      this.y = -300;
      this.state = "gone"; // gone | idle | travel | wait | work | exiting
      this.job = null;
      this.active = true;
      this.idleSince = 0;
      this.move = null;
      this.followPt = null;
      this.seed = Math.random() * 6283;

      const el = document.createElement("div");
      el.className = "agent";
      el.setAttribute("aria-hidden", "true");
      el.style.setProperty("--agent", def.color);
      el.style.setProperty("--blink-delay", (Math.random() * 4).toFixed(2) + "s");
      el.innerHTML =
        '<div class="agent__inner">' +
        CURSOR_SVG +
        '<div class="agent__bot"><span class="agent__head"><span class="agent__antenna"></span>' +
        '<i class="agent__eye"></i><i class="agent__eye"></i></span>' +
        '<span class="agent__tag">' +
        def.name +
        "</span></div></div>";
      layer.appendChild(el);
      this.el = el;
      this._lastTransform = "";
    }

    get visible() {
      return this.state !== "gone";
    }

    spawnAt(x, y, now) {
      this.x = x;
      this.y = y;
      this.move = null;
      this.followPt = null;
      this.state = "idle";
      this.idleSince = now;
      this.el.classList.add("is-on");
    }

    travelTo(x, y, now, state) {
      const dist = Math.hypot(x - this.x, y - this.y);
      const dur = Math.min(1150, Math.max(360, 280 + dist * 0.55));
      const side = Math.random() < 0.5 ? -1 : 1;
      this.move = {
        fx: this.x,
        fy: this.y,
        tx: x,
        ty: y,
        t0: now,
        dur: dur,
        bend: side * Math.min(80, dist * 0.16),
      };
      this.followPt = null;
      this.state = state || "travel";
      if (this.state !== "exiting") this.el.classList.add("is-on");
    }

    retarget(x, y) {
      if (this.move) {
        this.move.tx = x;
        this.move.ty = y;
      }
    }

    follow(x, y) {
      this.move = null;
      this.followPt = { x: x, y: y };
    }

    exit(x, y, now) {
      this.travelTo(x, y, now, "exiting");
      this.el.classList.remove("is-on", "is-working");
    }

    hide() {
      this.state = "gone";
      this.move = null;
      this.followPt = null;
      this.job = null;
      this.el.classList.remove("is-on", "is-working");
    }

    setWorking(on) {
      this.el.classList.toggle("is-working", !!on);
    }

    get moving() {
      return !!this.move;
    }

    update(now, dt) {
      if (this.move) {
        const m = this.move;
        const p = Math.min(1, (now - m.t0) / m.dur);
        const e = easeInOut(p);
        const dx = m.tx - m.fx;
        const dy = m.ty - m.fy;
        const len = Math.hypot(dx, dy) || 1;
        const cx = (m.fx + m.tx) / 2 - (dy / len) * m.bend;
        const cy = (m.fy + m.ty) / 2 + (dx / len) * m.bend;
        const u = 1 - e;
        this.x = u * u * m.fx + 2 * u * e * cx + e * e * m.tx;
        this.y = u * u * m.fy + 2 * u * e * cy + e * e * m.ty;
        if (p >= 1) {
          this.move = null;
          if (this.state === "exiting") this.hide();
          else if (this.state === "travel") {
            this.state = this.job ? "wait" : "idle";
            if (!this.job) this.idleSince = now;
          }
        }
      } else if (this.followPt) {
        const k = Math.min(1, dt * 0.02);
        this.x += (this.followPt.x - this.x) * k;
        this.y += (this.followPt.y - this.y) * k;
      }
    }

    render(now, vp) {
      if (this.state === "gone") return;
      if (vp) {
        // Flip the name tag to the left when the agent is close to the right edge.
        const flip = this.x - vp.sx > vp.vw - 120;
        if (flip !== this._flip) {
          this._flip = flip;
          this.el.classList.toggle("is-flip", flip);
        }
      }
      let ox = 0;
      let oy = 0;
      if (this.state === "idle" || this.state === "wait") {
        ox = Math.sin((now + this.seed) / 640) * 3;
        oy = Math.cos((now + this.seed) / 820) * 3;
      }
      const t = "translate3d(" + (this.x + ox).toFixed(1) + "px," + (this.y + oy).toFixed(1) + "px,0)";
      if (t !== this._lastTransform) {
        this.el.style.transform = t;
        this._lastTransform = t;
      }
    }

    destroy() {
      this.el.remove();
    }
  }

  window.CR = window.CR || {};
  window.CR.ROSTER = ROSTER;
  window.CR.Agent = Agent;
})();
