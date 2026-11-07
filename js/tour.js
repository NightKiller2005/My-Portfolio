/*
 * tour.js — automatic cinematic presentation.
 *
 * request(): marks a fresh tour session and reloads with ?tour=1&agents=on.
 * run():     waits for the hero to finish building, then scrolls section by
 *            section with an accelerate / cruise / decelerate profile, holding
 *            at each stop until the agents have built what is on screen.
 * The tour stops on manual scroll (wheel, touch, keys), Escape or the Stop button.
 * The URL parameter is removed on load, so refreshing never loops the tour.
 */
(function () {
  "use strict";

  const SESSION_KEY = "cr-tour-session";
  const STOP_KEYS = ["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "];

  // Trapezoidal velocity: accelerate for the first 22%, cruise, decelerate for the last 22%.
  function cruise(p) {
    const a = 0.22;
    if (p <= 0) return 0;
    if (p >= 1) return 1;
    const k = 2 * a * (1 - a);
    if (p < a) return (p * p) / k;
    if (p < 1 - a) return (p - a / 2) / (1 - a);
    return 1 - ((1 - p) * (1 - p)) / k;
  }

  class Tour {
    constructor(engine, ui) {
      this.engine = engine;
      this.ui = ui;
      this.active = false;
      this.raf = 0;
      this._onWheel = () => this.stop("manual");
      this._onTouch = () => this.stop("manual");
      this._onKey = (e) => {
        if (STOP_KEYS.indexOf(e.key) >= 0) this.stop("manual");
      };
    }

    static requested() {
      return new URLSearchParams(location.search).get("tour") === "1";
    }

    /** Remove tour params from the address bar so a refresh never restarts the tour. */
    static consumeParams() {
      const url = new URL(location.href);
      url.searchParams.delete("tour");
      url.searchParams.delete("agents");
      history.replaceState(null, "", url.pathname + url.search + url.hash);
      try {
        sessionStorage.removeItem(SESSION_KEY);
      } catch (e) {}
    }

    request() {
      try {
        sessionStorage.setItem(SESSION_KEY, String(Date.now()));
      } catch (e) {}
      const url = new URL(location.href);
      url.searchParams.set("tour", "1");
      url.searchParams.set("agents", "on");
      url.hash = "";
      location.assign(url.toString());
    }

    async run() {
      if (this.active) return;
      this.active = true;
      this.ui.setTour(true);
      window.addEventListener("wheel", this._onWheel, { passive: true });
      window.addEventListener("touchmove", this._onTouch, { passive: true });
      window.addEventListener("keydown", this._onKey);

      // Wait for everything visible in the first screen (the hero) to be built.
      await this._waitFor(() => this.engine.viewportSettled(), 14000);
      await this._hold(1100);

      const stops = this._stops();
      for (const y of stops) {
        if (!this.active) return;
        await this._scrollTo(y);
        if (!this.active) return;
        await this._waitFor(() => this.engine.viewportSettled(), 7000);
        await this._hold(750);
      }
      if (this.active) this.stop("complete");
    }

    stop(reason) {
      if (!this.active) return;
      this.active = false;
      if (this.raf) cancelAnimationFrame(this.raf);
      this.raf = 0;
      window.removeEventListener("wheel", this._onWheel);
      window.removeEventListener("touchmove", this._onTouch);
      window.removeEventListener("keydown", this._onKey);
      this.ui.setTour(false);
      this.ui.toast(reason === "complete" ? "Tour <b>complete</b>" : "Tour <b>stopped</b>");
    }

    _stops() {
      const vh = window.innerHeight;
      const max = Math.max(0, document.documentElement.scrollHeight - vh);
      const ids = ["top", "work", "stack", "experience", "record", "about", "contact"];
      const out = [];
      ids.forEach((id) => {
        const s = document.getElementById(id);
        if (!s) return;
        const top = s.getBoundingClientRect().top + window.scrollY;
        const bottom = top + s.offsetHeight;
        let y = top;
        out.push(y);
        const step = vh * 0.72;
        while (y + step < bottom - vh * 0.6) {
          y += step;
          out.push(y);
        }
      });
      out.push(max); // finish at the footer
      return out
        .map((y) => Math.min(max, Math.max(0, Math.round(y))))
        .filter((y, i, arr) => i === 0 || y - arr[i - 1] > 40);
    }

    _scrollTo(target) {
      return new Promise((resolve) => {
        const start = window.scrollY;
        const dist = target - start;
        if (Math.abs(dist) < 2) return resolve();
        const dur = Math.min(3000, Math.max(1000, 650 + Math.abs(dist) * 1.05));
        let t = 0;
        let last = 0;
        const step = (ts) => {
          if (!this.active) return resolve();
          const dt = last ? Math.min(ts - last, 50) : 16;
          last = ts;
          if (!this.engine.paused) t += dt;
          const p = Math.min(1, t / dur);
          window.scrollTo({ top: start + dist * cruise(p), left: 0, behavior: "instant" });
          if (p < 1) this.raf = requestAnimationFrame(step);
          else {
            this.raf = 0;
            resolve();
          }
        };
        this.raf = requestAnimationFrame(step);
      });
    }

    _hold(ms) {
      return new Promise((resolve) => {
        let t = 0;
        let last = performance.now();
        const tick = () => {
          if (!this.active) return resolve();
          const n = performance.now();
          if (!this.engine.paused) t += n - last;
          last = n;
          if (t >= ms) resolve();
          else setTimeout(tick, 60);
        };
        setTimeout(tick, 60);
      });
    }

    _waitFor(pred, maxMs) {
      return new Promise((resolve) => {
        let t = 0;
        let last = performance.now();
        const tick = () => {
          if (!this.active) return resolve(false);
          if (pred()) return resolve(true);
          const n = performance.now();
          if (!this.engine.paused) t += n - last;
          last = n;
          if (t >= maxMs) resolve(false);
          else setTimeout(tick, 120);
        };
        tick();
      });
    }
  }

  window.CR = window.CR || {};
  window.CR.Tour = Tour;
})();
