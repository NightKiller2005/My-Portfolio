/*
 * interactions.js — icons, control dock, keyboard shortcuts, toast, preferences.
 */
(function () {
  "use strict";

  const PREF_KEY = "cr-agents";

  // Lucide icon paths (inline so the site works offline and from file://).
  const ICONS = {
    "arrow-up-right": '<path d="M7 7h10v10"/><path d="M7 17 17 7"/>',
    "arrow-right": '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
    mail: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
    linkedin:
      '<path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/>',
    "map-pin":
      '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
    pause: '<rect x="14" y="4" width="4" height="16" rx="1"/><rect x="6" y="4" width="4" height="16" rx="1"/>',
    play: '<polygon points="6 3 20 12 6 21 6 3"/>',
    bot: '<path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/>',
    "bot-off":
      '<path d="M13.67 8H18a2 2 0 0 1 2 2v4.33"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M22 22 2 2"/><path d="M8 8H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 1.414-.586"/><path d="M9 13v2"/><path d="M9.67 4H12v2.33"/>',
    route:
      '<circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/>',
    square: '<rect width="14" height="14" x="5" y="5" rx="1"/>',
  };

  function icon(name, cls) {
    return (
      '<svg class="icon' +
      (cls ? " " + cls : "") +
      '" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
      (ICONS[name] || "") +
      "</svg>"
    );
  }

  function savePref(on) {
    try {
      localStorage.setItem(PREF_KEY, on ? "on" : "off");
    } catch (e) {}
  }

  class Controls {
    constructor() {
      this.dock = document.getElementById("dock");
      this.status = document.getElementById("dockStatus");
      this.btnPause = document.getElementById("btnPause");
      this.btnAgents = document.getElementById("btnAgents");
      this.btnTour = document.getElementById("btnTour");
      this.toastEl = document.getElementById("toast");
      this._toastTimer = 0;
      this.touring = false;
      this.engine = null;
      this.tour = null;
      this.dock.querySelectorAll("[data-icon]").forEach((el) => {
        el.innerHTML = icon(el.getAttribute("data-icon"));
      });
    }

    bind(engine, tour) {
      this.engine = engine;
      this.tour = tour;

      this.btnPause.addEventListener("click", () => this.togglePause());
      this.btnAgents.addEventListener("click", () => this.toggleAgents());
      this.btnTour.addEventListener("click", () => this.toggleTour());

      document.addEventListener("keydown", (e) => {
        if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
        const t = e.target;
        if (
          t &&
          (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))
        )
          return;
        if (this.dock.dataset.ready !== "1") return;
        const k = e.key.toLowerCase();
        if (k === "escape") {
          if (this.tour.active) this.tour.stop("manual");
        } else if (k === "t") {
          e.preventDefault();
          this.toggleTour(true);
        } else if (k === "a") {
          e.preventDefault();
          this.toggleAgents();
        } else if (k === "p") {
          e.preventDefault();
          this.togglePause();
        }
      });

      this.syncButtons();
    }

    enable() {
      this.dock.dataset.ready = "1";
      [this.btnPause, this.btnAgents, this.btnTour].forEach((b) => (b.disabled = false));
      this.syncButtons();
    }

    togglePause() {
      const p = !this.engine.paused;
      this.engine.setPaused(p);
      this.toast(p ? "Build <b>paused</b>" : "Build <b>resumed</b>");
      this.syncButtons();
    }

    toggleAgents() {
      const on = !this.engine.enabled;
      if (on) {
        if (this.engine.paused) this.engine.setPaused(false);
        this.engine.enable();
      } else this.engine.disable();
      if (!window.matchMedia("(max-width: 767px)").matches) savePref(on);
      this.toast(on ? "Agents <b>online</b>" : "Agents <b>offline</b>");
      this.syncButtons();
    }

    toggleTour(fromKey) {
      if (this.tour.active) {
        if (!fromKey) this.tour.stop("manual");
        return;
      }
      this.toast("Starting <b>tour</b>…");
      setTimeout(() => this.tour.request(), 250);
    }

    setTour(on) {
      this.touring = on;
      this.syncButtons();
    }

    syncButtons() {
      if (!this.engine) return;
      const paused = this.engine.paused;
      this.btnPause.setAttribute("aria-pressed", String(paused));
      this.btnPause.querySelector(".dock__icon").innerHTML = icon(paused ? "play" : "pause");
      this.btnPause.querySelector(".dock__label").textContent = paused ? "Resume" : "Pause";
      this.btnPause.setAttribute("aria-label", paused ? "Resume animations (P)" : "Pause animations (P)");

      const on = this.engine.enabled;
      this.btnAgents.setAttribute("aria-pressed", String(on));
      this.btnAgents.querySelector(".dock__icon").innerHTML = icon(on ? "bot" : "bot-off");
      this.btnAgents.querySelector(".dock__label").textContent = on ? "Agents on" : "Agents off";
      this.btnAgents.setAttribute("aria-label", on ? "Turn agents off (A)" : "Turn agents on (A)");

      this.btnTour.setAttribute("aria-pressed", String(this.touring));
      this.btnTour.querySelector(".dock__icon").innerHTML = icon(this.touring ? "square" : "route");
      this.btnTour.querySelector(".dock__label").textContent = this.touring ? "Stop" : "Tour";
      this.btnTour.setAttribute("aria-label", this.touring ? "Stop tour (Esc)" : "Start tour (T)");
      this.updateStatus();
    }

    updateStatus(s) {
      if (s) this._last = s;
      s = this._last;
      if (!s || this.dock.dataset.ready !== "1") return;
      let state = "idle";
      let text;
      if (!s.enabled) {
        text = "Agents offline";
      } else if (s.paused) {
        state = "paused";
        text = "Paused · " + s.built + "/" + s.total;
      } else if (s.built >= s.total) {
        state = "done";
        text = "Build complete";
      } else if (s.active > 0) {
        state = "building";
        text = "Building " + s.built + "/" + s.total;
      } else {
        text = "Scroll · " + s.built + "/" + s.total;
      }
      if (this.touring && !s.paused) state = "touring";
      if (this.dock.dataset.state !== state) this.dock.dataset.state = state;
      if (this.status.textContent !== text) this.status.textContent = text;
    }

    toast(html) {
      const t = this.toastEl;
      t.innerHTML = html;
      t.classList.add("is-on");
      clearTimeout(this._toastTimer);
      this._toastTimer = setTimeout(() => t.classList.remove("is-on"), 1700);
    }
  }

  window.CR = window.CR || {};
  window.CR.icon = icon;
  window.CR.Controls = Controls;
})();
