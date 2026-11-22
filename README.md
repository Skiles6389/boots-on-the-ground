# Boots on the Ground

A cartoon tower defense. You play the green army and hold a lane against the Scowl Corps — the same soldiers, in dark red and black, with spiked helmets and red eyes. Stop them before they reach the gate.

Eight towers: Trooper, Longshot, Gatling Gunner, Mortar Crew, Tread Tank, Engineer, Sky Guard, and Chopper Pad. Tap a planted tower to spend chevrons. Each tower has three paths, and a tower can hold six chevrons in all.

Two maps, thirty rounds. Maple Grove is the green starter. Cactus Junction is the dusty roadside. Round 20 brings General Grimstache's tank. Round 30 brings Ironjaw.

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

Pick a map, tap a soldier card, then tap open ground. You cannot plant on the lane, in the pond or the well, or on top of another soldier. The first good patch pulses until you use it.

**Start Round** sends the next wave. You can send the following wave early for a small bonus. Tap a planted soldier to open the chevron paths, change who they shoot, or sell them. The **1× / 2×** button speeds the round up.

On a keyboard: `1` through `8` pick a soldier, `[` and `]` turn the shop page, `Space` starts the round, `F` changes speed, `U` buys the first affordable chevron, `X` sells, `Esc` cancels, `M` mutes. On the map screen, `1` is Maple Grove and `2` is Cactus Junction.

## What's in the folder

- `index.html` — the page
- `css/game.css` — fills the screen, including the iPhone safe area, and turns off scroll and pinch-zoom while you play
- `js/balance.js` — prices, ranges, the two maps, and the thirty rounds
- `js/paths.js` — the chevron paths for every tower
- `js/game.js` — planting, shooting, and waves
- `js/render.js` — the maps, soldiers, and buttons
- `js/audio.js` — tiny synthesized sounds, no audio files
- `js/build.js` — the corner label. The Pages workflow rewrites it with the date and commit
- `js/soldiers.js` — the cartoon soldiers (green kit for us, dark red and black for the Scowl Corps)
- `assets/sprites/` — the original toy-figure sheets, kept for reference and not drawn in the game
- `manifest.webmanifest` and `assets/icons/` — so Add to Home Screen opens full screen

The corner label and the `?v=` on each script are the cache buster. Phones request a new file whenever that stamp changes.
