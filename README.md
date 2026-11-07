# Chandru R — AI-Agent Portfolio

A cinematic personal portfolio built with **plain HTML5, CSS3 and vanilla JavaScript**.
A crew of robot-cursor "build agents" visibly constructs every section of the page:
each agent flies to an element, draws a blue wireframe around it, and types, pops or
wipes the content into place.

No frameworks, no build step, no `npm install`.

---

## Project structure

```
my-portfolio/
├── index.html              Page shell, boot screen, dock, build-mode bootstrap
├── css/
│   ├── style.css           Tokens, base, typography, buttons, footer, boot, toast
│   ├── hero.css            Full-screen hero (PORTFOLIO type, portrait, stats)
│   ├── sections.css        Work, Stack, Record, About, Contact
│   ├── agents.css          Robot cursors and wireframes
│   ├── animations.css      Build-mode visibility + keyframes
│   ├── dock.css            Floating control dock
│   └── responsive.css      Tablet and mobile layouts
├── js/
│   ├── portfolio-data.js   All personal content (edit this to update the site)
│   ├── main.js             Renders sections, boot sequence, wiring
│   ├── agents.js           Robot cursor agent (motion + rendering)
│   ├── build-engine.js     Scheduler: assigns elements to agents, one rAF loop
│   ├── animations.js       Timeline markers, hero parallax
│   ├── tour.js             Automatic tour mode
│   └── interactions.js     Dock, keyboard shortcuts, icons, preferences
├── assets/
│   ├── headshot.png
│   └── resume.pdf          Local reference only — excluded from git and Vercel
└── README.md
```

## Open it locally

Double-click `index.html` — it works straight from the file system.

### VS Code Live Server

1. Install the **Live Server** extension (Ritwick Dey).
2. Open the `my-portfolio` folder in VS Code.
3. Right-click `index.html` → **Open with Live Server**.

## Agent mode

| How | Effect |
| --- | --- |
| Dock → **Agents** button, or press **A** | Toggle agents on/off (saved in `localStorage`) |
| `index.html?agents=on` | Force agents on (overrides saved preference and reduced-motion) |
| `index.html?agents=off` | Disable agents for this visit |

If the visitor's system asks for reduced motion, agents start off unless `?agents=on` is used.
Turning agents back on rebuilds everything from the current screen down.

## Tour mode

Press **T** or click **Tour** in the dock. The page reloads with `?tour=1`, the agents
build the hero, then the page scrolls through every section, pausing while each screen is
built, and finishes at the footer. Scrolling, touching or pressing **Esc** stops it.
The tour parameter is removed from the address bar immediately, so refreshing never loops.

## Keyboard shortcuts

| Key | Action |
| --- | --- |
| `T` | Start tour |
| `A` | Toggle agents |
| `P` | Pause / resume all animation |
| `Esc` | Stop tour |

Shortcuts are ignored while typing in a form field.

## Editing content

All text lives in `js/portfolio-data.js`. Every element marked with `data-build="type" | "pop" | "wipe"`
is picked up by the build engine automatically.

## Deploy to GitHub Pages

1. Push this folder to your GitHub repository:
   ```bash
   git remote add origin https://github.com/NightKiller2005/My-Portfolio.git
   git push -u origin main
   ```
   (`assets/resume.pdf` is ignored via `.gitignore`.)
2. In the repository, open **Settings → Pages** and set the source to **GitHub Actions**.
3. Every push to `main` will deploy the site. It will be available at `https://NightKiller2005.github.io/My-Portfolio/`.

## Deploy to Vercel

1. Go to vercel.com → **Add New → Project** → import the GitHub repository.
2. Framework preset: **Other**. Leave build command and output directory empty.
3. Deploy. (`.vercelignore` keeps `assets/resume.pdf` out of the deployment.)

Or with the CLI: `npx vercel` from inside the folder.
