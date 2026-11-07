/*
 * main.js — renders every section from portfolio-data.js, runs the boot
 * sequence, then wires the build engine, controls, animations and tour.
 */
(function () {
  "use strict";

  const D = window.PORTFOLIO;
  const CR = window.CR;
  const icon = CR.icon;
  const root = document.documentElement;

  const esc = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const pad = (n) => String(n).padStart(2, "0");

  /* ====================== Render ====================== */

  function renderHero() {
    const nav = [
      ["work", "Work"],
      ["stack", "Stack"],
      ["experience", "Internship"],
      ["record", "Record"],
      ["about", "About"],
      ["contact", "Contact"],
    ];
    const stats = D.heroStats
      .map(
        (s, i) =>
          '<div class="stat" data-build="pop" style="--i:' + (8 + i) + '"><dt class="label">' +
          esc(s.label) + "</dt><dd>" + esc(s.value) + "</dd></div>"
      )
      .join("");

    return (
      '<header class="topbar" data-build="pop" style="--i:0">' +
      '<a class="brand" href="#top" aria-label="' + esc(D.name) + ' — back to top">' +
      '<span class="brand__name">' + esc(D.name) + "</span></a>" +
      '<button class="menu-toggle" id="menuToggle" type="button" aria-expanded="false" aria-controls="primaryNav" aria-label="Open menu">' +
      '<span></span><span></span><span></span></button>' +
      '<nav class="topnav" id="primaryNav" aria-label="Primary">' +
      nav.map((n, i) => '<a href="#' + n[0] + '"><span>' + pad(i + 1) + "</span>" + n[1] + "</a>").join("") +
      "</nav></header>" +
      '<div class="hero__stage">' +
      '<div class="hero__glow" aria-hidden="true"></div>' +
      '<p class="hero__word" data-build="wipe" data-text="Portfolio" aria-hidden="true" style="--i:1">Portfolio</p>' +
      '<img class="hero__portrait" data-build="pop" style="--i:2" src="assets/headshot.png" width="798" height="977" ' +
      'alt="Black-and-white portrait of ' + esc(D.name) + ', wearing a white collared shirt" fetchpriority="high" decoding="async">' +
      "</div>" +
      '<div class="hero__intro">' +
      '<p class="hero__hello" data-build="type" style="--i:3">Hello, I\'m</p>' +
      '<h1 class="hero__name" data-build="wipe" style="--i:4">' + esc(D.name) + "</h1>" +
      '<p class="hero__role" data-build="type" style="--i:5">' + esc(D.role) + "</p>" +
      '<p class="hero__summary" data-build="type" style="--i:6">' + esc(D.heroSummary) + "</p>" +
      '<div class="hero__actions">' +
      '<a class="btn btn--primary" href="#work" data-build="pop" style="--i:7">View work ' + icon("arrow-up-right") + "</a>" +
      "</div></div>" +
      '<dl class="hero__stats">' + stats + "</dl>"
    );
  }

  function sectionHead(num, name, id, title, intro, stats) {
    return (
      '<header class="section-head"><div class="section-head__main">' +
      '<p class="eyebrow" data-build="type"><span class="eyebrow__num">' + num + "</span>/ " + esc(name) + "</p>" +
      '<h2 class="display" id="' + id + '" data-build="wipe">' + title + "</h2>" +
      (intro ? '<p class="lede" data-build="type">' + esc(intro) + "</p>" : "") +
      "</div>" +
      (stats
        ? '<dl class="section-stats">' +
          stats
            .map(
              (s) =>
                '<div class="stat" data-build="pop"><dd>' + esc(s.value) + '</dd><dt class="label">' + esc(s.label) + "</dt></div>"
            )
            .join("") +
          "</dl>"
        : "") +
      "</header>"
    );
  }

  function renderWork() {
    const cards = D.projects
      .map((p, i) => {
        const links = (p.links || [])
          .map(
            (l) =>
              '<a class="btn" href="' + esc(l.url) + '" target="_blank" rel="noopener">' + esc(l.label) + " " + icon("arrow-up-right") + "</a>"
          )
          .join("");
        return (
          '<li class="project" data-build="pop" data-reveal>' +
          '<span class="project__marker" aria-hidden="true"></span>' +
          '<div class="project__main">' +
          '<div class="project__top"><span class="project__index">' + pad(i + 1) + '</span><span class="project__cat">' + esc(p.category) + '</span>' +
          "</div>" +
          '<h3 class="project__title" data-build="wipe">' + esc(p.name) + "</h3>" +
          '<div class="project__tech"><span class="label">Stack</span><div class="chips">' +
          p.tech.map((t) => '<span class="chip">' + esc(t) + "</span>").join("") +
          "</div></div>" +
          '<p class="project__desc" data-build="type">' + esc(p.description) + "</p>" +
          (links ? '<div class="project__links">' + links + "</div>" : "") +
          "</div></li>"
        );
      })
      .join("");

    return (
      '<div class="container">' +
      sectionHead("01", "Projects", "work-title", "Projects", D.work.intro, D.work.stats) +
      '<ol class="projects">' + cards + "</ol></div>"
    );
  }

  function renderStack() {
    const groups = D.stack.groups;
    const bigItems = groups
      .filter((g) => ["Programming", "Frontend", "Backend", "Database & Cloud"].indexOf(g.title) >= 0)
      .reduce((acc, g) => acc.concat(g.items), []);
    const smallGroups = groups.filter((g) => ["Tools & Platforms", "AI & Machine Learning"].indexOf(g.title) >= 0);

    const bigSeq = bigItems
      .map((t) => '<span class="m-item">' + esc(t) + '</span><i class="m-sep"></i>')
      .join("");
    const smallSeq = smallGroups
      .map(
        (g) =>
          '<span class="m-cat">' + esc(g.title) + "</span>" +
          g.items.map((t) => '<span class="m-item">' + esc(t) + "</span>").join("")
      )
      .join("");

    const marquee = (cls, seq, dur, label) =>
      '<div class="marquee ' + cls + '" data-build="pop" style="--dur:' + dur + 's" role="region" aria-label="' + label + '">' +
      '<div class="marquee__track"><div class="marquee__seq">' + seq + '</div><div class="marquee__seq" aria-hidden="true">' + seq + "</div></div></div>";

    const grid = groups
      .map(
        (g) =>
          '<div class="stack-group" data-build="pop" data-reveal><div class="stack-group__head"><h3 class="stack-group__title">' +
          esc(g.title) + '</h3><span class="stack-group__count">' + pad(g.items.length) + "</span></div><ul>" +
          g.items.map((t) => "<li>" + esc(t) + "</li>").join("") + "</ul></div>"
      )
      .join("");

    return (
      '<div class="container">' +
      sectionHead("02", "Stack", "stack-title", "The toolkit", D.stack.intro) +
      "</div>" +
      marquee("marquee--big", bigSeq, 70, "Languages, frameworks and databases") +
      marquee("marquee--small", smallSeq, 80, "Tools and AI skills") +
      '<div class="container"><div class="stack-groups">' + grid + "</div></div>"
    );
  }

  function renderRecord() {
    const categories = [
      { kind: "Hackathon", title: "Hackathons" },
      { kind: "Certifications", title: "Certifications" },
      { kind: "Education", title: "Education" },
    ];
    const groups = categories
      .map((category) => {
        const items = D.record.items
          .filter((item) => item.kind === category.kind)
          .map((it) => {
            const meta =
              '<div class="tl-item__meta">' +
              (it.date ? '<span class="tl-item__date">' + esc(it.date) + "</span>" : "") +
              '<span class="tl-item__kind">' + esc(it.kind) + "</span></div>";
            const body =
              '<h3 class="tl-item__title">' + esc(it.title) + "</h3>" +
              (it.org ? '<p class="tl-item__org">' + esc(it.org) + "</p>" : "") +
              (it.meta ? '<span class="tl-item__grade">' + esc(it.meta) + "</span>" : "") +
              (it.kind === "Hackathon"
                ? '<button class="btn certificate-view hackathon-view" type="button" data-record-view="' +
                  esc(JSON.stringify(it.images || [])) + '" data-certificate-title="' + esc(it.title) + '">View</button>'
                : "") +
              (it.points ? '<ul class="tl-item__points">' + it.points.map((p) => "<li>" + esc(p) + "</li>").join("") + "</ul>" : "") +
              (it.list
                ? '<ul class="tl-item__list">' +
                  it.list
                    .map(
                      (certificate) =>
                        '<li class="certificate-entry"><span>' + esc(certificate.name) + "</span>" +
                        (certificate.image
                          ? '<button class="btn certificate-view" type="button" data-certificate-view="' + esc(certificate.image) +
                            '" data-certificate-title="' + esc(certificate.name) + '">View</button>'
                          : "") +
                        "</li>"
                    )
                    .join("") +
                  "</ul>"
                : "");
            return (
              '<li class="tl-item" data-build="pop" data-reveal><span class="tl-item__marker" aria-hidden="true"></span>' +
              meta + body + "</li>"
            );
          })
          .join("");
        if (!items) return "";
        return (
          '<section class="record-group" aria-labelledby="record-group-' + category.kind.toLowerCase() + '">' +
          '<h3 class="record-group__title" id="record-group-' + category.kind.toLowerCase() + '" data-build="wipe">' + category.title + "</h3>" +
          '<ol class="timeline">' + items + "</ol></section>"
        );
      })
      .join("");

    return (
      '<div class="container"><div class="record__grid">' +
      '<div class="record__head">' +
      '<p class="eyebrow" data-build="type"><span class="eyebrow__num">04</span>/ Record</p>' +
      '<h2 class="display" id="record-title" data-build="wipe">The record</h2>' +
      '<p class="lede" data-build="type">' + esc(D.record.intro) + "</p>" +
      "</div>" +
      '<div class="record-groups">' + groups + "</div>" +
      "</div></div>"
    );
  }

  function renderExperience() {
    const item = D.experience.item;
    return (
      '<div class="container">' +
      sectionHead("03", "Experience", "experience-title", "Experience", D.experience.intro) +
      '<article class="experience-card" data-build="pop" data-reveal>' +
      '<div class="experience-card__meta"><span class="tl-item__date">' + esc(item.date) + '</span><span class="tl-item__kind">Internship</span></div>' +
      '<h3 class="tl-item__title">' + esc(item.title) + '</h3>' +
      '<p class="tl-item__org">' + esc(item.org) + '</p>' +
      '<ul class="tl-item__points">' + item.points.map((point) => "<li>" + esc(point) + "</li>").join("") + "</ul>" +
      "</article></div>"
    );
  }

  function renderAbout() {
    const A = D.about;
    return (
      '<div class="container">' +
      sectionHead("05", "About", "about-title", "Built on fundamentals", null) +
      '<div class="about__grid">' +
      '<div class="about__text">' + A.paragraphs.map((p) => '<p data-build="type">' + esc(p) + "</p>").join("") + "</div>" +
      '<div class="about__interests"><span class="label" data-build="type">Areas of interest</span>' +
      '<ul class="interest-list">' +
      A.interests.map((t, i) => '<li data-build="pop">' + esc(t) + "<span>" + pad(i + 1) + "</span></li>").join("") +
      "</ul></div></div>" +
      '<div class="about__block"><span class="label" data-build="type">Core skills</span>' +
      '<div class="skills-grid">' +
      A.skills
        .map((s) => '<div class="skill" data-build="pop" data-reveal><span class="label">' + esc(s.group) + '</span><span class="skill__name">' + esc(s.name) + "</span></div>")
        .join("") +
      "</div></div>" +
      '<div class="about__block"><span class="label" data-build="type">Working principles</span>' +
      '<div class="principles">' +
      A.principles
        .map(
          (p, i) =>
            '<div class="principle" data-build="pop" data-reveal><span class="principle__num">' + pad(i + 1) + '</span><h3 class="principle__title">' +
            esc(p.title) + '</h3><p class="principle__text">' + esc(p.text) + "</p></div>"
        )
        .join("") +
      "</div></div></div>"
    );
  }

  function renderContact() {
    const C = D.contact;
    const words = esc(C.heading).split(" ");
    const last = words.pop();
    const socials = D.socials
      .map(
        (s) =>
          '<a class="btn social-btn" href="' + esc(s.url) + '" target="_blank" rel="noopener">' + icon(s.icon) + esc(s.label) + " " + icon("arrow-up-right") + "</a>"
      )
      .join("");
    return (
      '<div class="container"><div class="contact-card" data-build="pop">' +
      '<p class="eyebrow contact-card__eyebrow" data-build="type"><span class="eyebrow__num">06</span>/ Contact</p>' +
      '<h2 class="contact-card__title" id="contact-title" data-build="wipe">' + words.join(" ") + " <em>" + last + "</em></h2>" +
      '<p class="contact-card__text" data-build="type">' + esc(C.text) + "</p>" +
      '<div class="contact-card__actions">' +
      '<a class="mail-btn" href="mailto:' + esc(D.email) + '" data-build="pop">' + icon("mail") + "<span>" + esc(D.email) + "</span>" + icon("arrow-up-right") + "</a>" +
      '<span data-build="pop">' + socials + "</span>" +
      "</div>" +
      '<div class="contact-card__foot" data-build="pop">' +
      '<div><span class="label">Location</span><strong>' + esc(D.location) + "</strong></div>" +
      '<div><span class="label">Focus</span><strong>Full-stack · AI</strong></div>' +
      "</div>" +
      "</div></div>"
    );
  }

  function renderFooter() {
    const year = new Date().getFullYear();
    return (
      '<div class="footer__inner">' +
      '<p class="footer__name" data-build="wipe">' + esc(D.name) + "<span>" + esc(D.role) + "</span></p>" +
      '<nav class="footer__links" aria-label="Social" data-build="pop">' +
      D.socials.map((s) => '<a href="' + esc(s.url) + '" target="_blank" rel="noopener">' + esc(s.label) + "</a>").join("") +
      '<a href="mailto:' + esc(D.email) + '">Email</a><a href="#top">Back to top</a></nav>' +
      '<p class="footer__meta" data-build="type">© ' + year + " " + esc(D.name) + ". Assembled by build agents in HTML, CSS & vanilla JS.</p>" +
      "</div>"
    );
  }

  function render() {
    document.getElementById("top").innerHTML = renderHero();
    document.getElementById("work").innerHTML = renderWork();
    document.getElementById("stack").innerHTML = renderStack();
    document.getElementById("experience").innerHTML = renderExperience();
    document.getElementById("record").innerHTML = renderRecord();
    document.getElementById("about").innerHTML = renderAbout();
    document.getElementById("contact").innerHTML = renderContact();
    document.getElementById("footer").innerHTML = renderFooter();
  }

  function initMobileMenu() {
    const button = document.getElementById("menuToggle");
    const nav = document.getElementById("primaryNav");
    const close = () => {
      button.setAttribute("aria-expanded", "false");
      button.setAttribute("aria-label", "Open menu");
      document.querySelector(".topbar").classList.remove("menu-open");
    };

    button.addEventListener("click", () => {
      const open = button.getAttribute("aria-expanded") !== "true";
      button.setAttribute("aria-expanded", String(open));
      button.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      document.querySelector(".topbar").classList.toggle("menu-open", open);
    });
    nav.addEventListener("click", (event) => {
      if (event.target.closest("a")) close();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && button.getAttribute("aria-expanded") === "true") {
        close();
        button.focus();
      }
    });
  }

  function initCertificateViewer() {
    const dialog = document.getElementById("certificateDialog");
    const images = dialog.querySelector(".certificate-dialog__images");
    const emptyMessage = dialog.querySelector(".certificate-dialog__empty");
    const title = dialog.querySelector(".certificate-dialog__title");
    const closeButton = dialog.querySelector("[data-certificate-close]");

    function openViewer(button, imagePaths) {
      title.textContent = button.dataset.certificateTitle;
      images.replaceChildren();
      emptyMessage.hidden = imagePaths.length > 0;
      imagePaths.forEach((path) => {
        const image = document.createElement("img");
        image.className = "certificate-dialog__image";
        image.src = path;
        image.alt = button.dataset.certificateTitle + " image";
        images.appendChild(image);
      });
      dialog.showModal();
    }

    document.querySelectorAll("[data-certificate-view]").forEach((button) => {
      button.addEventListener("click", () => {
        openViewer(button, [button.dataset.certificateView]);
      });
    });

    document.querySelectorAll("[data-record-view]").forEach((button) => {
      button.addEventListener("click", () => {
        openViewer(button, JSON.parse(button.dataset.recordView));
      });
    });

    closeButton.addEventListener("click", () => dialog.close());
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) dialog.close();
    });
    dialog.addEventListener("close", () => {
      images.replaceChildren();
      emptyMessage.hidden = true;
    });
  }

  /* ====================== Boot ====================== */

  function boot(agentCount) {
    return new Promise((resolve) => {
      const msg = document.getElementById("bootMsg");
      const meta = document.getElementById("bootMeta");
      let quick = false;
      try {
        quick = sessionStorage.getItem("cr-booted") === "1";
        sessionStorage.setItem("cr-booted", "1");
      } catch (e) {}
      const total = quick ? 900 : 1600;
      const steps = [
        [0, "Initializing build environment"],
        [0.3, "Spawning " + agentCount + " agents"],
        [0.62, "Loading portfolio-data.js"],
        [0.88, "Ready — constructing"],
      ];
      const start = performance.now();
      let si = 0;
      const tick = (ts) => {
        const p = Math.min(1, (ts - start) / total);
        while (si < steps.length && p >= steps[si][0]) {
          msg.textContent = steps[si][1];
          si++;
        }
        const online = Math.min(agentCount, Math.round(Math.max(0, (p - 0.25) / 0.55) * agentCount));
        meta.textContent = pad(online) + " / " + pad(agentCount) + " agents online";
        if (p < 1) requestAnimationFrame(tick);
        else {
          root.classList.remove("is-booting");
          setTimeout(resolve, 420);
        }
      };
      requestAnimationFrame(tick);
    });
  }

  /* ====================== Init ====================== */

  function init() {
    const tourRequested = CR.Tour.requested();
    const params = new URLSearchParams(location.search);
    if (params.get("agents") === "on" || tourRequested) root.classList.add("force-motion");
    if (tourRequested) {
      if ("scrollRestoration" in history) history.scrollRestoration = "manual";
      window.scrollTo(0, 0);
      CR.Tour.consumeParams();
    }

    render();
    initMobileMenu();
    initCertificateViewer();

    const layer = document.createElement("div");
    layer.className = "agent-layer";
    layer.setAttribute("aria-hidden", "true");
    document.body.appendChild(layer);

    const controls = new CR.Controls();
    const engine = new CR.BuildEngine({
      layer: layer,
      onChange: (s) => controls.updateStatus(s),
    });
    const tour = new CR.Tour(engine, controls);
    controls.bind(engine, tour);
    CR.Animations.init();

    window.CR.engine = engine;
    window.CR.tour = tour;
    window.__PORTFOLIO_READY__ = true;

    const agentsOn = window.__AGENTS_INITIAL__ !== false && !root.classList.contains("build-failsafe");

    if (!agentsOn) {
      root.classList.remove("build-mode", "is-booting");
      root.classList.add("static-enter");
      engine.revealAll();
      controls.enable();
      controls.updateStatus({ enabled: false, paused: false, built: 0, total: 0, building: 0, active: 0 });
      return;
    }

    boot(CR.desiredAgentCount()).then(() => {
      engine.start();
      controls.enable();
      if (tourRequested) tour.run();
    });

    window.addEventListener("pagehide", () => tour.stop("manual"));
  }

  try {
    init();
  } catch (err) {
    // Never leave the visitor with an empty page.
    console.error(err);
    root.classList.remove("build-mode", "is-booting");
    window.__PORTFOLIO_READY__ = true;
  }
})();
