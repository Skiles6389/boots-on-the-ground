// Headless balance demo. Loads the real balance, paths, and game loop
// and plays each map on each difficulty with simple bots.
//
//   node tools/sim/run.js
//   node tools/sim/run.js --map maple --diff medium --only trooper
//
// Prints rounds cleared (30 means the bot won).

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const TOWERS = ["trooper", "longshot", "gatling", "flame", "mortar", "tread", "engineer", "tent", "sky", "chopper", "gunner"];
const MAPS = ["maple", "cactus", "frost", "atoll", "ridge", "quarter", "basin"];
const DIFFS = ["easy", "medium", "hard"];
const QUOTA = { trooper: 4, gatling: 2, flame: 2, longshot: 2, mortar: 2, sky: 2, engineer: 1, tent: 1, tread: 1, chopper: 1, gunner: 1 };
const MIX = ["gatling", "longshot", "trooper", "flame", "mortar", "sky", "engineer", "tent", "tread", "chopper", "gunner"];

function boot() {
  const g = global;
  g.window = g;
  g.self = g;
  g.devicePixelRatio = 1;
  g.performance = { now: () => Date.now() };
  g.requestAnimationFrame = function () { return 0; };
  g.cancelAnimationFrame = function () {};
  g.matchMedia = function () { return { matches: false, addEventListener: function () {} }; };
  g.addEventListener = function () {};
  g.removeEventListener = function () {};
  const mem = {
    "botg-muted": "1",
    "botg-music": "0",
    "botg-sfx": "0",
    "botg-progress": JSON.stringify({
      tutorial: true,
      difficulty: "medium",
      medals: 0,
      kits: ["field"],
      skin: "field",
      maps: {},
    }),
  };
  g.localStorage = {
    getItem: function (k) { return Object.prototype.hasOwnProperty.call(mem, k) ? mem[k] : null; },
    setItem: function (k, v) { mem[k] = String(v); },
    removeItem: function (k) { delete mem[k]; },
  };
  const ctx = new Proxy({}, { get: function () { return function () {}; } });
  const canvas = {
    width: 390,
    height: 844,
    style: {},
    getContext: function () { return ctx; },
    getBoundingClientRect: function () {
      return { width: 390, height: 844, left: 0, top: 0, right: 390, bottom: 844 };
    },
    addEventListener: function () {},
    setPointerCapture: function () {},
  };
  g.document = {
    getElementById: function (id) { return id === "game" ? canvas : { textContent: "" }; },
    addEventListener: function () {},
    documentElement: { style: {} },
  };
  g.location = { search: "?debug=1&unlockall=1", href: "http://sim.local/" };
  g.navigator = { userAgent: "node-sim" };
  const dir = path.join(__dirname, "../../js");
  ["balance.js", "paths.js", "audio.js", "save.js", "game.js"].forEach(function (file) {
    vm.runInThisContext(fs.readFileSync(path.join(dir, file), "utf8"), { filename: file });
  });
  g.BOTGAudio.muted = true;
}

function laneHits(x, y, range) {
  const B = global.BOTG_BALANCE;
  const lines = B.routes && B.routes.length ? B.routes : [B.route];
  return lines.map(function (route, li) {
    let n = 0;
    for (let d = 0; d < route.total; d += 16) {
      const p = B.pointAt(d, li);
      if (Math.hypot(p.x - x, p.y - y) <= range) n += 1;
    }
    return n;
  });
}

function cover(x, y, range) {
  return laneHits(x, y, range).reduce(function (a, b) { return a + b; }, 0);
}

function airCover() {
  const B = global.BOTG_BALANCE;
  const lines = B.routes && B.routes.length ? B.routes : [B.route];
  const totals = lines.map(function () { return 0; });
  global.BOTG.state.towers.forEach(function (tower) {
    if (!tower) return;
    const range = (B.towers[tower.type].base && B.towers[tower.type].base.range) || 100;
    laneHits(tower.x, tower.y, range).forEach(function (n, i) { totals[i] += n; });
  });
  return totals;
}

function countType(type) {
  return global.BOTG.state.towers.filter(function (t) { return t.type === type; }).length;
}

function bestSpot(type, range) {
  const bot = global.BOTG;
  let best = null;
  for (let y = 108; y <= 520; y += 20) {
    for (let x = 28; x <= 372; x += 20) {
      const check = bot.canPlace(x, y, type);
      if (!check.ok) continue;
      let score = cover(x, y, range);
      if (type === "tent") {
        global.BOTG.state.towers.forEach(function (t) {
          if (Math.hypot(t.x - x, t.y - y) < 110) score += 4;
        });
      }
      if ((type === "sky" || type === "chopper") && airCover().length > 1) {
        const have = airCover();
        const hits = laneHits(x, y, range);
        let weak = 0;
        for (let i = 1; i < have.length; i++) if (have[i] < have[weak]) weak = i;
        score = hits[weak] * 6 + score;
      }
      if (!best || score > best.score) best = { x: x, y: y, score: score };
    }
  }
  return best;
}

function spend(mode, onlyType) {
  const B = global.BOTG_BALANCE;
  const bot = global.BOTG;
  const s = bot.state;
  const order = onlyType ? [onlyType] : MIX;
  let guard = 0;
  while (guard++ < 48) {
    let placed = false;
    for (let i = 0; i < order.length; i++) {
      const type = order[i];
      if (!onlyType && countType(type) >= (QUOTA[type] || 1)) continue;
      const def = B.towers[type];
      if (s.cash < B.pay(def.cost)) continue;
      const spot = bestSpot(type, (def.base && def.base.range) || 100);
      if (!spot || spot.score < 1) continue;
      bot.place(spot.x, spot.y, type);
      placed = true;
      break;
    }
    if (!placed) break;
  }
  if (mode !== "upgrade") return;
  let bought = true;
  let guard2 = 0;
  while (bought && guard2++ < 120) {
    bought = false;
    const towers = s.towers.slice();
    for (let i = 0; i < towers.length && !bought; i++) {
      const tower = towers[i];
      const paths = (B.towers[tower.type].paths || []);
      for (let p = 0; p < paths.length; p++) {
        const pathDef = paths[p];
        const cur = (tower.ranks && tower.ranks[pathDef.id]) || 0;
        if (cur >= pathDef.tiers.length) continue;
        const need = cur >= 3 ? 2 : 1;
        if (B.chevronsUsed(tower.type, tower.ranks) + need > B.chevronCap) continue;
        if (s.cash < B.pay(pathDef.tiers[cur].cost)) continue;
        s.selectedId = tower.id;
        bot.upgrade(pathDef.id);
        bought = true;
        break;
      }
    }
  }
}

function play(map, diff, mode, onlyType) {
  const B = global.BOTG_BALANCE;
  const bot = global.BOTG;
  bot.setDifficulty(diff);
  bot.startGame(map);
  const s = bot.state;
  s.coach = false;
  s.auto = false;
  let hops = 0;
  while (s.screen === "play" && s.rewarded < B.waves.length && hops < 80) {
    spend(mode, onlyType);
    if (!s.waveActive && s.launchLock <= 0 && s.started < B.waves.length) bot.launch();
    let t = 0;
    while (s.screen === "play" && (s.waveActive || s.launchLock > 0) && t < 70) {
      global.__BOTG.tick(0.5);
      t += 0.5;
    }
    if (s.screen === "play" && !s.waveActive) global.__BOTG.tick(0.2);
    hops += 1;
  }
  return {
    map: map,
    diff: diff,
    mode: mode,
    tower: onlyType || "mixed",
    cleared: s.screen === "win" ? B.waves.length : s.rewarded,
    screen: s.screen,
    towers: s.towers.length,
    lives: s.lives,
  };
}

function arg(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : "";
}

boot();
const onlyMap = arg("--map");
const onlyDiff = arg("--diff");
const onlyTower = arg("--only");
const onlyMode = arg("--mode");
const modes = onlyMode ? [onlyMode] : onlyTower ? ["upgrade", "plain"] : ["upgrade", "plain", "mixed"];
const maps = onlyMap ? [onlyMap] : MAPS;
const diffs = onlyDiff ? [onlyDiff] : DIFFS;
const towers = onlyTower ? [onlyTower] : TOWERS;
const rows = [];
const started = Date.now();
maps.forEach(function (map) {
  diffs.forEach(function (diff) {
    if (modes.indexOf("mixed") >= 0 && !onlyTower) {
      const row = play(map, diff, "upgrade", null);
      row.mode = "mixed";
      row.tower = "mixed";
      rows.push(row);
      console.log([row.map, row.diff, row.tower, row.mode, row.cleared, row.screen, row.towers].join("\t"));
    }
    towers.forEach(function (type) {
      ["upgrade", "plain"].forEach(function (mode) {
        if (modes.indexOf(mode) < 0) return;
        const row = play(map, diff, mode, type);
        rows.push(row);
        console.log([row.map, row.diff, row.tower, row.mode, row.cleared, row.screen, row.towers].join("\t"));
      });
    });
  });
});
const out = path.join(__dirname, "last-run.json");
fs.writeFileSync(out, JSON.stringify({ seconds: (Date.now() - started) / 1000, rows: rows }, null, 2));
console.log("wrote " + out + " in " + ((Date.now() - started) / 1000).toFixed(1) + "s");
