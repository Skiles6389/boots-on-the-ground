# Boots on the Ground

A cartoon tower defense. You play the green plastic army men and hold the dirt lane through Maple Grove. The Scowl Corps — the same soldiers, cast in purple with spiked helmets and red eyes — march in from the left. Stop them before they reach the gate.

There are three towers:

- **Trooper** — cheap rifle, steady shots.
- **Gatling** — a short-range stream of light rounds. Park one on a corner.
- **Longshot** — slow shots that punch through armor. Heavies, jeeps, and the tank care about this one.

Ten rounds. The last one brings General Grimstache's tank.

## Play it on a phone

After this is merged to `main` and GitHub Pages is turned on, the game lives at:

**https://skiles6389.github.io/boots-on-the-ground/**

Open that link in Safari or Chrome. Add it to the Home Screen if you want it full screen, like an app. Every push to `main` publishes a new build, and the little date in the corner of the battlefield changes so the phone does not keep an old copy.

### One GitHub setting (required once)

This project cannot flip that switch by itself. GitHub's deploy token is not allowed to create the Pages site.

1. Open the repo on GitHub → **Settings** → **Pages**.
2. Under **Build and deployment**, set **Source** to **GitHub Actions**.
3. If the first **Deploy GitHub Pages** workflow failed before you did that, open **Actions** and run it again.

The workflow file is `.github/workflows/pages.yml`.

## Play it on this computer

The game is plain files. No install step and no build step.

```bash
python3 -m http.server 8080
```

Then open http://localhost:8080 . Use a local server rather than double-clicking `index.html`. The soldier pictures are real image files, and some browsers will not draw those from a `file://` page.

## How to play

Tap a soldier card, then tap the grass. You cannot plant on the dirt, in the pond, or on top of another soldier. The first good patch pulses until you use it.

**Start Round** sends the next wave. You can send the following wave early for a small bonus. Tap a planted soldier to upgrade, change who they shoot, or sell them. The **1× / 2×** button speeds the round up.

On a keyboard: `1` `2` `3` pick a soldier, `Space` starts the round, `F` changes speed, `U` upgrades, `X` sells, `Esc` cancels, `M` mutes.

## What's in the folder

- `index.html` — the page
- `css/game.css` — fills the screen, including the iPhone safe area, and turns off scroll and pinch-zoom while you play
- `js/balance.js` — prices, ranges, and the ten rounds
- `js/game.js` — planting, shooting, and waves
- `js/render.js` — the map, soldiers, and buttons
- `js/audio.js` — tiny synthesized sounds, no audio files
- `js/build.js` — the corner label. The Pages workflow rewrites it with the date and commit
- `assets/sprites/` — Trooper, Gatling, Longshot, Grunt, Scout, and Heavy
- `manifest.webmanifest` and `assets/icons/` — so Add to Home Screen opens full screen

The corner label and the `?v=` on each script are the cache buster. Phones request a new file whenever that stamp changes.
