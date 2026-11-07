/*
 * build-engine.js — schedules [data-build] elements and assigns them to agents.
 *
 * Lifecycle of one element ("job"):
 *   travel -> agent flies to the element
 *   wait   -> agent is there, waiting for one of the MAX_BUILDING slots
 *   frame  -> blue wireframe draws its four edges and corner handles
 *   build  -> content is revealed (type / pop / wipe) while the agent tracks it
 *   settle -> wireframe fades; the agent is already free for its next target
 *
 * One shared requestAnimationFrame loop drives all motion and scheduling.
 * Engine time only advances while not paused, so pausing freezes everything.
 */
(function () {
  "use strict";

  const MAX_BUILDING = 6;
  const TICK_MS = 110;
  const FRAME_MS = 320;
  const SETTLE_MS = 420;
  const POP_MS = 620;
  const WIPE_MS = 900;
  const ASSIGN_PER_TICK = 3;
  const IDLE_EXIT_MS = 2400;

  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  function desiredAgentCount() {
    const w = window.innerWidth;
    if (w >= 1024) return 12;
    if (w >= 768) return 8;
    return 6;
  }

  /* ---------- Type helpers ---------- */

  function prepareType(el) {
    const html = el.innerHTML;
    const chars = [];
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach((node) => {
      const text = node.data;
      if (!text.trim()) return;
      const frag = document.createDocumentFragment();
      let buf = "";
      for (const ch of text) {
        if (/\s/.test(ch)) {
          buf += ch;
          continue;
        }
        if (buf) {
          frag.appendChild(document.createTextNode(buf));
          buf = "";
        }
        const span = document.createElement("span");
        span.className = "ch";
        span.textContent = ch;
        frag.appendChild(span);
        chars.push(span);
      }
      if (buf) frag.appendChild(document.createTextNode(buf));
      node.parentNode.replaceChild(frag, node);
    });
    return { html: html, chars: chars, shown: 0 };
  }

  /* ---------- Wireframe ---------- */

  function createWire(layer, label) {
    const w = document.createElement("div");
    w.className = "wire";
    w.setAttribute("aria-hidden", "true");
    w.innerHTML =
      '<i class="wire__fill"></i>' +
      '<i class="wire__e wire__e--t"></i><i class="wire__e wire__e--r"></i>' +
      '<i class="wire__e wire__e--b"></i><i class="wire__e wire__e--l"></i>' +
      '<i class="wire__h wire__h--tl"></i><i class="wire__h wire__h--tr"></i>' +
      '<i class="wire__h wire__h--br"></i><i class="wire__h wire__h--bl"></i>' +
      '<span class="wire__label"></span><span class="wire__size"></span>';
    w.querySelector(".wire__label").textContent = label;
    layer.appendChild(w);
    return w;
  }

  class BuildEngine {
    constructor(opts) {
      this.root = document.documentElement;
      this.layer = opts.layer;
      this.onChange = opts.onChange || function () {};
      this.targets = Array.from(document.querySelectorAll("[data-build]"));
      this.sectionOf = new Map();
      this.targets.forEach((el) => this.sectionOf.set(el, el.closest("[data-section]")));
      this.visibleSections = new Set();
      this.jobs = [];
      this.jobByEl = new Map();
      this.agents = [];
      this.enabled = false;
      this.paused = false;
      this.time = 0;
      this.last = 0;
      this.raf = 0;
      this.lastTick = -1e9;
      this.pendingInView = 0;
      this.lastCandidateAt = 0;
      this._lastStatus = "";
      this._frame = this._frame.bind(this);

      this.io = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) this.visibleSections.add(e.target);
            else this.visibleSections.delete(e.target);
          });
          this.wake();
        },
        { rootMargin: "0px 0px -6% 0px", threshold: 0 }
      );
      document.querySelectorAll("[data-section]").forEach((s) => this.io.observe(s));

      this._onScroll = () => this.wake();
      this._onResize = () => {
        this._syncAgentCount();
        this.wake();
      };
      this._onVisibility = () => {
        if (!document.hidden) this.wake();
      };
      window.addEventListener("scroll", this._onScroll, { passive: true });
      window.addEventListener("resize", this._onResize);
      document.addEventListener("visibilitychange", this._onVisibility);
    }

    /* ---------- Public API ---------- */

    start() {
      this.enabled = true;
      this.root.classList.add("build-mode");
      this._syncAgentCount();
      this.wake();
      this._emit(true);
    }

    /** Turn agents on mid-session: rebuild everything from the current viewport down. */
    enable() {
      if (this.enabled) return;
      this.targets.forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.bottom > 0) el.classList.remove("is-built");
      });
      this.root.classList.remove("static-enter");
      this.start();
    }

    /** Turn agents off: reveal everything instantly and send agents home. */
    disable() {
      this.enabled = false;
      this.jobs.slice().forEach((j) => this._cancelJob(j, true));
      this.targets.forEach((el) => this._markBuilt(el));
      this.agents.forEach((a) => a.hide());
      this.root.classList.remove("build-mode");
      this._stop();
      this._emit(true);
    }

    revealAll() {
      this.jobs.slice().forEach((j) => this._cancelJob(j, true));
      this.targets.forEach((el) => this._markBuilt(el));
    }

    setPaused(p) {
      this.paused = !!p;
      this.root.classList.toggle("is-paused", this.paused);
      if (!this.paused) this.wake();
      this._emit(true);
    }

    isBuilt(el) {
      return el.classList.contains("is-built");
    }

    isContainerBuilt(container) {
      if (!this.enabled) return true;
      return this.targets.every((el) => !container.contains(el) || this.isBuilt(el));
    }

    /** True when nothing currently in the viewport is still waiting to be built. */
    viewportSettled() {
      if (!this.enabled) return true;
      const vh = window.innerHeight;
      for (const el of this.targets) {
        if (this.isBuilt(el)) continue;
        const r = el.getBoundingClientRect();
        if (r.top < vh * 0.94 && r.bottom > 0 && r.height > 0) return false;
      }
      return true;
    }

    progress() {
      let built = 0;
      this.targets.forEach((el) => {
        if (this.isBuilt(el)) built++;
      });
      return { built: built, total: this.targets.length };
    }

    wake() {
      if (this.raf || !this.enabled || this.paused || document.hidden) return;
      this.last = 0;
      this.raf = requestAnimationFrame(this._frame);
    }

    destroy() {
      this._stop();
      this.io.disconnect();
      window.removeEventListener("scroll", this._onScroll);
      window.removeEventListener("resize", this._onResize);
      document.removeEventListener("visibilitychange", this._onVisibility);
      this.agents.forEach((a) => a.destroy());
      this.agents = [];
    }

    /* ---------- Loop ---------- */

    _stop() {
      if (this.raf) cancelAnimationFrame(this.raf);
      this.raf = 0;
      this.last = 0;
    }

    _frame(ts) {
      this.raf = 0;
      if (!this.enabled || this.paused || document.hidden) {
        this.last = 0;
        return;
      }
      const dt = this.last ? Math.min(ts - this.last, 50) : 16;
      this.last = ts;
      this.time += dt;
      const now = this.time;

      if (now - this.lastTick >= TICK_MS) {
        this.lastTick = now;
        this._schedule(now);
      }
      this._updateJobs(now, dt);
      const vp = this._viewport();
      for (const a of this.agents) {
        a.update(now, dt);
        a.render(now, vp);
      }
      this._emit(false);

      const busy =
        this.jobs.length > 0 || this.pendingInView > 0 || this.agents.some((a) => a.visible);
      if (busy) this.raf = requestAnimationFrame(this._frame);
      else this.last = 0;
    }

    _emit(force) {
      const p = this.progress();
      const building = this.jobs.filter((j) => j.phase === "frame" || j.phase === "build").length;
      const key = [this.enabled, this.paused, p.built, p.total, building, this.jobs.length].join("|");
      if (!force && key === this._lastStatus) return;
      this._lastStatus = key;
      this.onChange({
        enabled: this.enabled,
        paused: this.paused,
        built: p.built,
        total: p.total,
        building: building,
        active: this.jobs.length,
      });
    }

    /* ---------- Agents ---------- */

    _syncAgentCount() {
      const want = desiredAgentCount();
      const roster = window.CR.ROSTER;
      while (this.agents.length < want) {
        const i = this.agents.length;
        this.agents.push(new window.CR.Agent(roster[i % roster.length], i, this.layer));
      }
      this.agents.forEach((a, i) => {
        a.active = i < want;
        if (!a.active && !a.job && a.visible) a.hide();
      });
    }

    _viewport() {
      return {
        sx: window.scrollX,
        sy: window.scrollY,
        vw: document.documentElement.clientWidth,
        vh: window.innerHeight,
      };
    }

    _pickAgent(tx, ty, vp) {
      let best = null;
      let bestScore = Infinity;
      for (const a of this.agents) {
        if (!a.active || a.job) continue;
        const onScreen =
          a.visible && a.y > vp.sy - 40 && a.y < vp.sy + vp.vh + 40;
        const score = onScreen ? Math.hypot(a.x - tx, a.y - ty) : 1800 + Math.random() * 200;
        if (score < bestScore) {
          bestScore = score;
          best = a;
        }
      }
      return best;
    }

    _spawnPoint(tx, ty, vp) {
      const left = tx < vp.sx + vp.vw / 2;
      const x = left ? vp.sx - 40 : vp.sx + vp.vw + 20;
      const y = clamp(ty + (Math.random() - 0.5) * 260, vp.sy + 30, vp.sy + vp.vh - 60);
      return { x: x, y: y };
    }

    /* ---------- Scheduling ---------- */

    _schedule(now) {
      const vp = this._viewport();
      const candidates = [];

      for (const el of this.targets) {
        if (this.isBuilt(el)) continue;
        const job = this.jobByEl.get(el);
        const r = el.getBoundingClientRect();
        const hidden = r.width === 0 && r.height === 0;
        // Scrolled past (or not rendered): reveal instantly.
        if (r.bottom < 0 || hidden) {
          if (job) this._cancelJob(job, true);
          else this._markBuilt(el);
          continue;
        }
        if (job) continue;
        const section = this.sectionOf.get(el);
        if (section && !this.visibleSections.has(section)) continue;
        if (r.top < vp.vh * 0.94 && r.bottom > 0) candidates.push({ el: el, r: r });
      }

      this.pendingInView = candidates.length;
      if (candidates.length) this.lastCandidateAt = now;

      // Reading order: row first (rounded), then left to right.
      candidates.sort((a, b) => {
        const dy = Math.round(a.r.top / 24) - Math.round(b.r.top / 24);
        return dy !== 0 ? dy : a.r.left - b.r.left;
      });

      let assigned = 0;
      for (const c of candidates) {
        if (assigned >= ASSIGN_PER_TICK) break;
        const type = c.el.getAttribute("data-build") || "pop";
        const rect = {
          x: c.r.left + vp.sx,
          y: c.r.top + vp.sy,
          w: c.r.width,
          h: c.r.height,
        };
        const anchor = this._anchor(type, rect, vp);
        const agent = this._pickAgent(anchor.x, anchor.y, vp);
        if (!agent) break;
        const onScreen = agent.visible && agent.y > vp.sy - 40 && agent.y < vp.sy + vp.vh + 40;
        if (!onScreen) {
          const sp = this._spawnPoint(anchor.x, anchor.y, vp);
          agent.spawnAt(sp.x, sp.y, now);
        }
        const job = {
          el: c.el,
          type: type,
          agent: agent,
          phase: "travel",
          t0: now,
          dur: 0,
          rect: rect,
          wire: null,
          typeState: null,
        };
        agent.job = job;
        agent.travelTo(anchor.x, anchor.y, now);
        this.jobs.push(job);
        this.jobByEl.set(c.el, job);
        assigned++;
      }

      this._manageIdle(now, vp);
    }

    _manageIdle(now, vp) {
      const visibleIdle = this.agents.filter((a) => a.state === "idle" && !a.moving);
      for (const a of visibleIdle) {
        // Scrolled away from it: vanish quietly.
        if (a.y < vp.sy - 80 || a.y > vp.sy + vp.vh + 80) {
          a.hide();
          continue;
        }
        // Nothing left to do: leave through the nearest side.
        if (this.pendingInView === 0 && now - a.idleSince > IDLE_EXIT_MS + a.index * 90) {
          const left = a.x < vp.sx + vp.vw / 2;
          a.exit(left ? vp.sx - 60 : vp.sx + vp.vw + 40, a.y + (Math.random() - 0.5) * 80, now);
          continue;
        }
        // Avoid stacking on top of another agent.
        for (const b of this.agents) {
          if (b === a || !b.visible) continue;
          if (Math.abs(b.x - a.x) < 36 && Math.abs(b.y - a.y) < 30) {
            const nx = clamp(a.x + (a.x >= b.x ? 46 : -46), vp.sx + 10, vp.sx + vp.vw - 80);
            const ny = clamp(a.y + (a.y >= b.y ? 28 : -28), vp.sy + 10, vp.sy + vp.vh - 40);
            a.travelTo(nx, ny, now, "travel");
            break;
          }
        }
      }
    }

    _anchor(type, rect, vp) {
      const minY = vp.sy + 16;
      const maxY = vp.sy + vp.vh - 70;
      if (type === "type") {
        return { x: rect.x - 2, y: clamp(rect.y + Math.min(rect.h, 30) * 0.55, minY, maxY) };
      }
      if (type === "wipe") {
        return { x: rect.x, y: clamp(rect.y + rect.h * 0.55, minY, maxY) };
      }
      return {
        x: rect.x + rect.w - 6,
        y: clamp(rect.y + rect.h - 6, minY, maxY),
      };
    }

    /* ---------- Jobs ---------- */

    _updateJobs(now, dt) {
      if (!this.jobs.length) return;
      const vp = this._viewport();
      let building = 0;
      for (const j of this.jobs) if (j.phase === "frame" || j.phase === "build") building++;

      // Pass 1 — reads.
      for (const j of this.jobs) {
        const r = j.el.getBoundingClientRect();
        j.rect = { x: r.left + vp.sx, y: r.top + vp.sy, w: r.width, h: r.height };
        j.charRect = null;
        if (j.phase === "build" && j.type === "type" && j.typeState) {
          const ts = j.typeState;
          const p = clamp((now - j.t0) / j.dur, 0, 1);
          const k = Math.max(1, Math.ceil(p * ts.chars.length));
          const span = ts.chars[Math.min(k, ts.chars.length) - 1];
          if (span) {
            const cr = span.getBoundingClientRect();
            j.charRect = { x: cr.right + vp.sx, y: cr.top + vp.sy, h: cr.height };
          }
        }
      }

      // Pass 2 — writes.
      for (const j of this.jobs.slice()) {
        const a = j.agent;

        if (j.phase === "travel") {
          const an = this._anchor(j.type, j.rect, vp);
          a.retarget(an.x, an.y);
          if (!a.moving) j.phase = "wait";
        }

        if (j.phase === "wait") {
          if (building < MAX_BUILDING) {
            building++;
            j.phase = "frame";
            j.t0 = now;
            a.state = "work";
            a.setWorking(true);
            j.wire = createWire(
              this.layer,
              a.name + " · " + j.el.tagName.toLowerCase() + "." + j.type
            );
          } else {
            a.state = "wait";
          }
        }

        if (j.phase === "frame") {
          const p = clamp((now - j.t0) / FRAME_MS, 0, 1);
          this._placeWire(j, p, 1);
          if (p >= 1) {
            j.phase = "build";
            j.t0 = now;
            this._beginBuild(j);
          }
        }

        if (j.phase === "build") {
          const p = clamp((now - j.t0) / j.dur, 0, 1);
          this._applyBuild(j, p);
          this._placeWire(j, 1, 1);
          this._followBuild(j, p, vp);
          if (p >= 1) {
            this._finishBuild(j);
            j.phase = "settle";
            j.t0 = now;
            a.job = null;
            a.setWorking(false);
            a.followPt = null;
            a.state = "idle";
            a.idleSince = now;
          }
        }

        if (j.phase === "settle") {
          const p = clamp((now - j.t0) / SETTLE_MS, 0, 1);
          this._placeWire(j, 1, 1 - p);
          if (p >= 1) this._removeJob(j);
        }
      }
    }

    _placeWire(j, d, o) {
      if (!j.wire) return;
      const pad = 6;
      const s = j.wire.style;
      s.transform =
        "translate3d(" + (j.rect.x - pad).toFixed(1) + "px," + (j.rect.y - pad).toFixed(1) + "px,0)";
      s.width = (j.rect.w + pad * 2).toFixed(1) + "px";
      s.height = (j.rect.h + pad * 2).toFixed(1) + "px";
      s.setProperty("--d", d.toFixed(3));
      s.setProperty("--o", o.toFixed(3));
      if (!j.sizeWritten) {
        j.wire.querySelector(".wire__size").textContent =
          Math.round(j.rect.w) + " × " + Math.round(j.rect.h);
        j.sizeWritten = true;
      }
    }

    _beginBuild(j) {
      const el = j.el;
      if (j.type === "type") {
        j.typeState = prepareType(el);
        j.dur = clamp(j.typeState.chars.length * 24, 420, 1800);
      } else if (j.type === "wipe") {
        j.dur = WIPE_MS;
        el.style.clipPath = "inset(-20% 100% -20% -3%)";
      } else {
        j.dur = POP_MS;
        el.style.opacity = "0";
        el.style.scale = "0.92";
      }
      el.classList.add("is-building");
    }

    _applyBuild(j, p) {
      const el = j.el;
      if (j.type === "type") {
        const ts = j.typeState;
        const k = Math.ceil(p * ts.chars.length);
        for (let i = ts.shown; i < k; i++) ts.chars[i].classList.add("on");
        ts.shown = Math.max(ts.shown, k);
      } else if (j.type === "wipe") {
        const e = easeInOut(p);
        el.style.clipPath = "inset(-20% " + ((1 - e) * 100).toFixed(2) + "% -20% -3%)";
      } else {
        const e = easeOut(p);
        el.style.opacity = e.toFixed(3);
        el.style.scale = (0.92 + 0.08 * e).toFixed(4);
      }
    }

    _followBuild(j, p, vp) {
      const a = j.agent;
      const minY = vp.sy + 16;
      const maxY = vp.sy + vp.vh - 70;
      if (j.type === "type" && j.charRect) {
        a.follow(j.charRect.x + 1, clamp(j.charRect.y + j.charRect.h * 0.55, minY, maxY));
      } else if (j.type === "wipe") {
        const e = easeInOut(p);
        a.follow(j.rect.x + j.rect.w * e, clamp(j.rect.y + j.rect.h * 0.55, minY, maxY));
      } else {
        const e = easeOut(p);
        a.follow(
          j.rect.x + j.rect.w * (0.92 + 0.08 * e) - 6,
          clamp(j.rect.y + j.rect.h * (0.92 + 0.08 * e) - 6, minY, maxY)
        );
      }
    }

    _finishBuild(j) {
      const el = j.el;
      if (j.typeState) {
        el.innerHTML = j.typeState.html;
        j.typeState = null;
      }
      el.style.opacity = "";
      el.style.scale = "";
      el.style.clipPath = "";
      el.classList.remove("is-building");
      el.classList.add("is-built");
    }

    _markBuilt(el) {
      el.classList.remove("is-building");
      el.classList.add("is-built");
    }

    _cancelJob(j, reveal) {
      if (j.phase !== "settle") {
        this._finishBuild(j);
        if (!reveal) j.el.classList.remove("is-built");
        if (j.agent && j.agent.job === j) {
          j.agent.job = null;
          j.agent.setWorking(false);
          j.agent.followPt = null;
          if (j.agent.visible) {
            j.agent.state = "idle";
            j.agent.move = null;
            j.agent.idleSince = this.time;
          }
        }
      }
      this._removeJob(j);
    }

    _removeJob(j) {
      if (j.wire) j.wire.remove();
      j.wire = null;
      const i = this.jobs.indexOf(j);
      if (i >= 0) this.jobs.splice(i, 1);
      if (this.jobByEl.get(j.el) === j) this.jobByEl.delete(j.el);
    }
  }

  window.CR = window.CR || {};
  window.CR.BuildEngine = BuildEngine;
  window.CR.desiredAgentCount = desiredAgentCount;
})();
