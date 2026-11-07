/*
 * animations.js — decorative, scroll-linked motion that is independent of agents:
 *   - timeline markers turn red as each entry passes into view
 *   - timeline entries fade in when agents are off
 *   - subtle pointer parallax on the hero PORTFOLIO word and glow
 */
(function () {
  "use strict";

  const reduced = () =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
    !document.documentElement.classList.contains("force-motion");

  function initReveal() {
    const items = document.querySelectorAll("[data-reveal]");
    if (!items.length) return null;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            if (e.target.classList.contains("tl-item")) e.target.classList.add("is-active");
            io.unobserve(e.target);
          }
        });
      },
      { rootMargin: "0px 0px -35% 0px", threshold: 0 }
    );
    items.forEach((el) => io.observe(el));
    return io;
  }

  function initParallax() {
    const hero = document.querySelector(".hero");
    const word = document.querySelector(".hero__word");
    const glow = document.querySelector(".hero__glow");
    if (!hero || !word || !glow || reduced()) return null;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return null;

    let tx = 0;
    let ty = 0;
    let cx = 0;
    let cy = 0;
    let raf = 0;
    let inView = true;

    const step = () => {
      raf = 0;
      if (document.documentElement.classList.contains("is-paused")) return;
      cx += (tx - cx) * 0.08;
      cy += (ty - cy) * 0.08;
      word.style.marginLeft = (cx * -14).toFixed(2) + "px";
      glow.style.marginLeft = (cx * 22).toFixed(2) + "px";
      glow.style.marginTop = (cy * 16).toFixed(2) + "px";
      if (Math.abs(tx - cx) > 0.002 || Math.abs(ty - cy) > 0.002) raf = requestAnimationFrame(step);
    };

    const onMove = (e) => {
      if (!inView) return;
      tx = e.clientX / window.innerWidth - 0.5;
      ty = e.clientY / window.innerHeight - 0.5;
      if (!raf) raf = requestAnimationFrame(step);
    };

    const io = new IntersectionObserver((entries) => {
      inView = entries[0].isIntersecting;
    });
    io.observe(hero);
    window.addEventListener("pointermove", onMove, { passive: true });

    return () => {
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }

  window.CR = window.CR || {};
  window.CR.Animations = {
    init() {
      initReveal();
      initParallax();
    },
  };
})();
