
// Simulation, input, and wave flow for Boots on the Ground.
(function (root) {
  const B = root.BOTG_BALANCE;
  const audio = root.BOTGAudio;
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d", { alpha: false });
  const AIM = ["first", "last", "tough", "near"];

  function computeLayout(cssW, cssH, inspecting) {
    const portrait = cssH >= cssW * 0.9;
    const vw = portrait ? 400 : 400 * (cssW / cssH);
    const vh = portrait ? 400 * (cssH / cssW) : 400;
    const headerH = portrait ? 56 : 46;
    let footerH = 0;
    let sideW = 0;
    if (portrait) {
      // Shop bar is about a third slimmer than the old 40% footer.
      // Selecting a tower grows it just enough for three 40px path buttons.
      const shop = Math.round(Math.min(252, Math.max(210, vh * 0.28)));
      const upgrade = 232;
      footerH = inspecting ? Math.max(shop, upgrade) : shop;
      const minMap = 230;
      if (headerH + footerH > vh - minMap) footerH = Math.max(176, vh - headerH - minMap);
    } else {
      sideW = Math.round(Math.min(210, Math.max(186, vw * 0.24)));
      if (sideW > vw - 240) sideW = Math.max(160, vw - 240);
    }
    const mapBox = {
      x: 0,
      y: headerH,
      w: vw - sideW,
      h: vh - headerH - footerH,
    };
    const worldTop = B.view.headerH;
    const worldH = B.view.footerY - worldTop;
    const worldW = B.view.width;
    const scale = Math.min(mapBox.w / worldW, mapBox.h / worldH);
    const drawnW = worldW * scale;
    const drawnH = worldH * scale;
    const ox = mapBox.x + (mapBox.w - drawnW) / 2;
    const oy = mapBox.y + (mapBox.h - drawnH) / 2;
    const panel = portrait
      ? { x: 0, y: vh - footerH, w: vw, h: footerH }
      : { x: vw - sideW, y: headerH, w: sideW, h: vh - headerH };
    return {
      portrait, vw, vh, headerH, footerH, sideW, inspecting: !!inspecting,
      mapBox, scale, ox, oy, worldTop, worldW, worldH, panel,
    };
  }

  function aimOrigin(x, y, role) {
    if (root.BOTGAimOrigin) return root.BOTGAimOrigin(x, y, role);
    return { x, y: y - (role === "longshot" ? 0 : 40) };
  }

  function muzzleTip(x, y, role, aim) {
    if (root.BOTGMuzzle) return root.BOTGMuzzle(x, y, role, aim);
    const o = aimOrigin(x, y, role);
    const len = role === "longshot" ? 70 : 30;
    return { x: o.x + Math.cos(aim) * len, y: o.y + Math.sin(aim) * len };
  }

  function fresh() {
    return {
      screen: "title",
      mapId: "maple",
      time: 0,
      cash: B.meta.startingCash,
      lives: B.meta.startingLives,
      speedIndex: 0,
      speedOverride: 0,
      towers: [],
      enemies: [],
      shots: [],
      effects: [],
      floaters: [],
      banner: null,
      toast: null,
      selectedId: null,
      placing: null,
      ghost: null,
      pointer: { x: 200, y: 160, sx: 200, sy: 320, inside: false, insideMap: false },
      pressedId: null,
      hoverTowerId: null,
      started: 0,
      rewarded: 0,
      waveActive: false,
      waveClock: 0,
      launchLock: 0,
      spawnQueue: [],
      hurt: 0,
      shake: 0,
      hotspots: [],
      nextId: 1,
      placedCount: 0,
      laneCursor: 0,
      takedowns: 0,
      leaked: 0,
      coach: false,
      suppressGhost: false,
      auto: false,
      autoTimer: 0,
      debug: false,
      reducedMotion: false,
      error: "",
      summary: "",
      viewScale: 1,
    };
  }

  let state = fresh();

  function reducedMotion() {
    return root.matchMedia && root.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function announce(text) {
    const el = document.getElementById("live");
    if (el) el.textContent = text;
  }

  function speedMul() {
    if (state.speedOverride) return state.speedOverride;
    return B.meta.speeds[state.speedIndex] || 1;
  }

  function toast(text) {
    state.toast = { text, t: 0, life: 1.35 };
  }

  function floater(x, y, text, color, life, kind) {
    state.floaters.push({ x, y, text, color: color || "#fff6d0", t: 0, life: life || 0.9, kind: kind || "text" });
    if (state.floaters.length > 36) state.floaters.splice(0, state.floaters.length - 36);
  }

  function tutorialPending() {
    const save = root.BOTGSave;
    if (!save) return false;
    if (save.data.tutorial) return false;
    if (save.played && save.played()) return false;
    return true;
  }

  function finishCoach() {
    state.coach = false;
    if (root.BOTGSave) {
      root.BOTGSave.data.tutorial = true;
      root.BOTGSave.save();
    }
  }

  function spawnPoof(x, y, scale, withStars) {
    const smoke = [];
    for (let i = 0; i < 6; i++) {
      smoke.push({
        a: (i / 6) * Math.PI * 2 + Math.random() * 0.3,
        sp: (18 + Math.random() * 24) * scale,
        r: (5 + Math.random() * 5) * scale,
        g: 205 + Math.random() * 45,
      });
    }
    const stars = [];
    if (withStars) {
      for (let i = 0; i < 4; i++) {
        stars.push({
          a: -1 + i * 0.55,
          sp: (26 + Math.random() * 28) * scale,
          rot: Math.random() * 6,
          sz: (4 + Math.random() * 3) * Math.max(0.8, scale),
        });
      }
    }
    state.effects.push({ kind: "poof", x, y, t: 0, life: 0.48 + scale * 0.12, smoke, stars });
    if (state.effects.length > 56) state.effects.splice(0, state.effects.length - 56);
  }

  function spawnSparks(x, y, color) {
    for (let i = 0; i < 8; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 40 + Math.random() * 90;
      state.effects.push({
        kind: "spark",
        x,
        y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 20,
        t: 0,
        life: 0.32 + Math.random() * 0.12,
        color,
        r: 2.2 + Math.random() * 2.2,
      });
    }
  }

  function showBanner(kicker, title, sub, kind) {
    state.banner = { kicker, title, sub, t: 0, life: kind === "boss" ? 3.4 : 2.8, kind: kind || "info" };
  }

  function invested(tower) {
    if (tower.spent != null) return tower.spent;
    const def = B.towers[tower.type];
    let n = def.cost;
    if (def.paths && tower.ranks) {
      def.paths.forEach(function (p) {
        const r = tower.ranks[p.id] || 0;
        for (let i = 0; i < r; i++) n += p.tiers[i].cost;
      });
      return B.pay(n);
    }
    for (let i = 0; i < tower.rank; i++) n += def.upgrades[i].cost;
    return B.pay(n);
  }

  function refund(tower) {
    const perk = currentPerk();
    const rate = perk && perk.refund ? perk.refund : B.meta.sellRefund;
    return Math.round(invested(tower) * rate);
  }

  function unlockAll() {
    return new URLSearchParams(root.location.search).has("unlockall");
  }

  function mapOpen(id) {
    if (unlockAll()) return true;
    const map = B.maps[id] || B.maps.maple;
    if (!map.requires) return true;
    return !!(root.BOTGSave && root.BOTGSave.wonAny(map.requires));
  }

  function remember(won) {
    if (!root.BOTGSave) return;
    const round = won ? B.waves.length : Math.max(0, state.started);
    root.BOTGSave.record(state.mapId || "maple", state.difficulty || "medium", round, !!won);
  }

  function inMap(p) {
    if (p && typeof p.insideMap === "boolean") return p.insideMap;
    return p.x >= 0 && p.x <= B.view.width && p.y >= B.view.headerH && p.y < B.view.footerY;
  }

  function blockReason(kind) {
    const name = kind || "";
    if (name.indexOf("horizon") === 0) return "That's the horizon.";
    if (name.indexOf("pond") >= 0) return "That's the ice.";
    if (name.indexOf("fence") >= 0) return "The fence is in the way.";
    if (name.indexOf("pine") >= 0 || name.indexOf("hedgerow") >= 0) return "The brush is in the way.";
    return "That's in the way.";
  }

  function playerXp() {
    return root.BOTGSave ? root.BOTGSave.xp() : 0;
  }

  function towerOpen(type) {
    if (unlockAll()) return true;
    if (state.challenge === "snipers") return type === "longshot";
    if (B.towerUnlocked) return B.towerUnlocked(type, playerXp());
    return true;
  }

  function lockReason(type) {
    if (state.challenge === "snipers" && type !== "longshot") return "Snipers only.";
    const ranks = B.ranks || [];
    for (let i = 0; i < ranks.length; i++) {
      if (ranks[i].towers.indexOf(type) >= 0) return "Unlocks at " + ranks[i].name + ".";
    }
    return "Locked.";
  }

  function grantRankKits() {
    if (!root.BOTGSave || !B.ranks) return;
    const xp = playerXp();
    B.ranks.forEach(function (r) {
      if (xp >= r.xp && r.skin) root.BOTGSave.own(r.skin);
    });
  }

  function currentPerk() {
    return B.perkFor ? B.perkFor(playerXp()) : null;
  }

  function canPlace(x, y, type) {
    if (!towerOpen(type)) return { ok: false, reason: lockReason(type) };
    const map = B.map;
    if (y > B.view.footerY - 16 || x < 18 || x > B.view.width - 18) {
      return { ok: false, reason: "Plant beside the road." };
    }
    if (B.distToRoute(x, y) < map.pathClearance) {
      return { ok: false, reason: "The lane is for marching." };
    }
    for (const block of map.blocks || []) {
      if (x >= block.x && x <= block.x + block.w && y >= block.y && y <= block.y + block.h) {
        return { ok: false, reason: blockReason(block.kind) };
      }
    }
    for (const t of state.towers) {
      if (Math.hypot(x - t.x, y - t.y) < map.towerGap) {
        return { ok: false, reason: "Too close to a soldier." };
      }
    }
    const cost = B.pay(B.towers[type].cost);
    if (state.cash < cost) return { ok: false, reason: `Need $${cost}.` };
    return { ok: true, reason: "" };
  }

  function updateGhost() {
    if (state.screen !== "play" || !state.placing) {
      state.ghost = null;
      return;
    }
    // After a plant, hide the ghost until the pointer is back over the grass
    // so a red "too close" ring doesn't stick to the soldier you just placed.
    if (!state.pointer.insideMap) {
      if (state.placedCount === 0 && !state.suppressGhost) {
        const check = canPlace(B.map.hint.x, B.map.hint.y, state.placing);
        state.ghost = {
          x: B.map.hint.x,
          y: B.map.hint.y,
          valid: check.ok,
          reason: check.reason,
          type: state.placing,
        };
      } else {
        state.ghost = null;
      }
      return;
    }
    state.suppressGhost = false;
    const check = canPlace(state.pointer.x, state.pointer.y, state.placing);
    state.ghost = {
      x: state.pointer.x,
      y: state.pointer.y,
      valid: check.ok,
      reason: check.reason,
      type: state.placing,
    };
  }

  function towerAt(p) {
    let best = null;
    let bestD = 1e9;
    for (const t of state.towers) {
      const dx = Math.abs(t.x - p.x);
      if (dx > 26) continue;
      const top = t.type === "longshot" ? t.y - 16 : t.y - 46;
      if (p.y > t.y + 12 || p.y < top) continue;
      const d = dx + Math.abs(Math.min(0, p.y - t.y)) * 0.25;
      if (d < bestD) {
        best = t;
        bestD = d;
      }
    }
    return best;
  }

  function place(x, y, type) {
    const def = B.towers[type];
    const paid = B.pay(def.cost);
    state.cash -= paid;
    const aim = B.nearestAngle(x, y);
    state.towers.push({
      id: state.nextId++,
      type,
      rank: 0,
      ranks: {},
      x,
      y,
      aim,
      idleAim: aim,
      phase: Math.random() * 6,
      spin: 0,
      cooldown: 0.15,
      flash: 0,
      targetId: null,
      priority: def.aim,
      spent: paid,
    });
    state.placedCount += 1;
    state.ghost = null;
    state.suppressGhost = true;
    spawnPoof(x, y + 2, 0.55, false);
    audio.play("place");
    if (type === "engineer") audio.play("wrench");
    if (type === "tent") audio.play("tent");
    floater(x, y - 26, `-$${paid}`, "#fff6d0", 0.7);
  }

  function pick(key) {
    if (state.screen !== "play") return;
    if (!towerOpen(key)) {
      toast(lockReason(key));
      audio.play("deny");
      return;
    }
    if (state.placing === key) {
      state.placing = null;
      audio.play("ui");
      return;
    }
    state.placing = key;
    state.selectedId = null;
    audio.play("ui");
  }

  function selectedTower() {
    return state.towers.find((t) => t.id === state.selectedId) || null;
  }

  function upgrade(pathId) {
    const tower = selectedTower();
    if (!tower) return;
    const def = B.towers[tower.type];
    if (!def.paths) return;
    const path = def.paths.find(function (p) { return p.id === pathId; });
    if (!path) return;
    if (!tower.ranks) tower.ranks = {};
    const cur = tower.ranks[path.id] || 0;
    if (cur >= path.tiers.length) {
      toast("That path is finished.");
      return;
    }
    const need = cur >= 3 ? 2 : 1;
    const used = B.chevronsUsed(tower.type, tower.ranks);
    if (used + need > (B.chevronCap || 6)) {
      toast("Chevron cap is 6.");
      audio.play("deny");
      return;
    }
    const up = path.tiers[cur];
    const price = B.pay(up.cost);
    if (state.cash < price) {
      toast("Need $" + price + ".");
      audio.play("deny");
      return;
    }
    state.cash -= price;
    tower.spent = (tower.spent || 0) + price;
    tower.ranks[path.id] = cur + 1;
    tower.rank = B.chevronsUsed(tower.type, tower.ranks);
    audio.play("upgrade");
    floater(tower.x, tower.y - 30, up.name, "#d8ffc4", 1);
  }

  function sell() {
    const tower = selectedTower();
    if (!tower) return;
    const pay = refund(tower);
    state.cash += pay;
    spawnPoof(tower.x, tower.y, 0.7, false);
    floater(tower.x, tower.y - 20, `+$${pay}`, "#fff6d0", 0.8);
    state.towers = state.towers.filter((t) => t.id !== tower.id);
    state.selectedId = null;
    audio.play("sell");
  }

  function cycleAim() {
    const tower = selectedTower();
    if (!tower) return;
    const i = AIM.indexOf(tower.priority);
    tower.priority = AIM[(i + 1) % AIM.length];
    audio.play("ui");
  }

  function toggleSpeed() {
    state.speedIndex = (state.speedIndex + 1) % B.meta.speeds.length;
    audio.play("ui");
  }

  function queueWave(wave) {
    const items = [];
    let t = 0.4;
    for (const g of wave.groups) {
      for (let i = 0; i < g.count; i++) {
        const item = { type: g.type, at: t };
        if (typeof g.hp === "number") item.hp = g.hp;
        if (typeof g.speed === "number") item.speed = g.speed;
        items.push(item);
        t += g.interval;
      }
      t += 0.35;
    }
    return items;
  }

  function freeWave(round) {
    const bump = Math.max(1, round - B.waves.length);
    const groups = [
      { type: "grunt", count: 8 + bump, interval: Math.max(0.32, 0.62 - bump * 0.02), hp: 8 + bump * 2 },
    ];
    if (bump > 1) groups.push({ type: "scout", count: 4 + Math.floor(bump / 2), interval: 0.4 });
    if (bump > 3) groups.push({ type: "heavy", count: 2 + Math.floor(bump / 3), interval: 0.85 });
    if (bump > 5) groups.push({ type: "gnat", count: 2, interval: 0.8 });
    if (round % 10 === 0) groups.push({ type: round % 20 === 0 ? "ram" : "vex", count: 1, interval: 0.4 });
    return {
      name: "Freeplay " + round,
      hint: "The Corps does not stop. Hold as long as you can.",
      reward: 36 + bump * 4,
      boss: round % 10 === 0,
      groups: groups,
    };
  }

  function launch() {
    if (state.screen !== "play") return;
    if (state.launchLock > 0) return;
    if (state.started >= B.waves.length && !state.freeplay) return;
    const early = state.waveActive;
    const wave = state.started >= B.waves.length ? freeWave(state.started + 1) : B.waves[state.started];
    const items = queueWave(wave);
    if (early) {
      const base = state.waveClock + 0.3;
      for (const item of items) state.spawnQueue.push({ type: item.type, at: item.at + base });
      state.spawnQueue.sort((a, b) => a.at - b.at);
      state.cash += B.meta.earlyWaveBonus;
      floater(200, 250, `Early send +$${B.meta.earlyWaveBonus}`, "#ffe56a", 1.1);
    } else {
      state.waveClock = 0;
      state.spawnQueue = items;
      state.waveActive = true;
    }
    state.started += 1;
    state.launchLock = 0.45;
    const cap = state.freeplay ? "freeplay" : String(B.waves.length);
    showBanner("Wave " + state.started + (state.freeplay ? "" : " of " + cap), wave.name, wave.hint, wave.boss ? "boss" : "info");
    audio.play(wave.boss ? "boss" : "wave");
    announce(`Wave ${state.started}, ${wave.name}. ${wave.hint}`);
  }

  function spawnEnemy(type, opt) {
    const def = B.enemies[type];
    const lanes = (B.routes && B.routes.length) || 1;
    let lane = 0;
    if (lanes > 1 && !def.boss) {
      lane = state.laneCursor || 0;
      state.laneCursor = (lane + 1) % lanes;
    }
    const dropping = !!(def.drop || (opt && opt.drop));
    const dropFrac = opt && typeof opt.drop === "number"
      ? opt.drop
      : (typeof def.drop === "number" ? def.drop : 0.46);
    const frac = dropping ? dropFrac : 0;
    const lanePick = opt && opt.lane != null ? opt.lane : lane;
    const route = B.routeFor(lanePick);
    const p = B.pointAt(dropping ? route.total * frac : (opt && typeof opt.dist === "number" ? opt.dist : 0), lanePick);
    const fall = dropping ? def.dropTime || 1.25 : 0;
    const mul = state.challenge === "double" ? 2 : 1;
    const baseHp = opt && typeof opt.hp === "number" ? opt.hp : def.hp;
    const hp = Math.round(baseHp * mul);
    const enemy = {
      id: state.nextId++,
      type,
      lane: lanePick,
      dist: opt && typeof opt.dist === "number" ? opt.dist : (dropping ? route.total * frac : 0),
      x: p.x,
      y: p.y - (dropping ? 78 : 0),
      angle: p.angle,
      hp: hp,
      maxHp: hp,
      speed: opt && typeof opt.speed === "number" ? opt.speed : def.speed,
      armor: def.armor,
      cash: def.cash,
      leak: def.leak,
      radius: def.radius,
      phase: Math.random() * 6,
      flash: 0,
      tinkCd: 0,
      dead: false,
      falling: fall,
      fall: fall,
      airborne: dropping || !!def.air,
      air: !!def.air,
      shieldHp: (def.shield ? def.shieldHp || 14 : 0) * mul,
      shieldMax: (def.shield ? def.shieldHp || 14 : 0) * mul,
      plates: (def.plates || 0) * mul,
      callsLeft: def.calls || 0,
      callCd: def.callEvery || 0,
      dropsLeft: def.drops || 0,
      dropCd: def.dropEvery || 0,
      supCd: 1.2,
    };
    state.enemies.push(enemy);
    if (dropping) floater(p.x, p.y - 70, "DROP", "#ffd0d8", 0.8);
    if (def.ironjaw) {
      showBanner("Scowl Corps", "Ironjaw", "The mega-tank. Cannons and mortars. His blast stuns nearby guns.", "boss");
      audio.play("boss");
      state.shake = Math.max(state.shake, 7);
      announce("Ironjaw is on the lane.");
    } else if (type === "vex") {
      showBanner("Scowl Corps", "Captain Vex", "His shield drinks rifle fire. Shells crack it. Then he calls a squad.", "boss");
      audio.play("boss");
      state.shake = Math.max(state.shake, 5);
      announce("Captain Vex is on the lane.");
    } else if (type === "ram") {
      showBanner("Scowl Corps", "The Ram", "Armor plates shrug off rifles. Explosives crack the plates.", "boss");
      audio.play("boss");
      state.shake = Math.max(state.shake, 6);
      announce("The Ram is on the lane.");
    } else if (type === "blimp") {
      showBanner("Scowl Corps", "Grey Blimp", "It sails overhead and drops troops. Sky guns own it.", "boss");
      audio.play("boss");
      state.shake = Math.max(state.shake, 5);
      announce("The Grey Blimp is overhead.");
    } else if (def.boss) {
      showBanner("Scowl Corps", def.name, "A boss is on the lane.", "boss");
      audio.play("boss");
      state.shake = Math.max(state.shake, 5);
      announce(def.name + " is on the lane.");
    }
  }

  function defeat(enemy) {
    if (enemy.dead) return;
    enemy.dead = true;
    enemy.dying = 0.42;
    enemy.hp = 0;
    state.cash += enemy.cash;
    state.takedowns = (state.takedowns || 0) + 1;
    const boss = !!B.enemies[enemy.type].boss;
    const scale = boss ? 2.15 : enemy.type === "jeep" ? 1.35 : enemy.type === "heavy" ? 1.15 : 1;
    spawnPoof(enemy.x, enemy.y, scale, true);
    floater(enemy.x, enemy.y - 22, "+$" + enemy.cash, "#ffe14a", 0.9, "coin");
    spawnSparks(enemy.x, enemy.y, "#ffe56a");
    audio.play(boss ? "bossPoof" : "down");
    if (boss) state.shake = Math.max(state.shake, state.reducedMotion ? 0 : 8);
  }

  function leak(enemy) {
    if (enemy.dead) return;
    enemy.dead = true;
    state.leaked = (state.leaked || 0) + 1;
    state.lives -= enemy.leak;
    if (state.challenge === "noleak") state.lives = 0;
    state.hurt = 1;
    if (!state.reducedMotion) state.shake = Math.max(state.shake, B.enemies[enemy.type].boss ? 7 : 3.5);
    audio.play("leak");
    floater(
      Math.min(360, Math.max(40, enemy.x)),
      enemy.y - 10,
      enemy.leak === 1 ? "−1 life" : `−${enemy.leak} lives`,
      "#ffd0d0",
      1
    );
    if (state.lives <= 0) {
      state.lives = 0;
      lose();
    }
  }

  function fromFront(enemy, from) {
    if (!from) return false;
    const dx = from.x - enemy.x;
    const dy = from.y - enemy.y;
    return Math.cos(enemy.angle) * dx + Math.sin(enemy.angle) * dy > 6;
  }

  function deal(enemy, damage, armorBite, from) {
    if (!enemy || enemy.dead) return;
    const def = B.enemies[enemy.type];
    if (def && def.camo && !enemySeen(enemy)) return;
    const explosive = (armorBite || 0) >= 0.5 || (from && from.explosive);
    if (def && def.plates && enemy.plates > 0 && !explosive) {
      enemy.flash = 0.08;
      if (enemy.tinkCd <= 0) {
        floater(enemy.x, enemy.y - 22, "PLATE", "#d7e7ff", 0.35);
        enemy.tinkCd = 0.45;
      }
      return;
    }
    if (def && def.plates && enemy.plates > 0 && explosive) {
      enemy.plates -= damage;
      enemy.flash = 0.14;
      if (enemy.plates <= 0) {
        enemy.plates = 0;
        floater(enemy.x, enemy.y - 24, "PLATES CRACK", "#ffe56a", 0.8);
      }
      return;
    }
    if (def && def.smallArms && (armorBite || 0) < 0.45 && !(from && (from.explosive || from.burn))) {
      enemy.flash = 0.06;
      if (enemy.tinkCd <= 0) {
        floater(enemy.x, enemy.y - 16, "plink", "#d7e7ff", 0.28);
        enemy.tinkCd = 0.45;
      }
      return;
    }
    if (def && def.shield && enemy.shieldHp > 0 && armorBite < 0.5 && fromFront(enemy, from)) {
      enemy.shieldHp -= damage;
      enemy.flash = 0.1;
      if (enemy.shieldHp <= 0) {
        const overflow = -enemy.shieldHp;
        enemy.shieldHp = 0;
        floater(enemy.x, enemy.y - 18, "CRACK", "#d7e7ff", 0.55);
        enemy.tinkCd = 0.35;
        if (overflow <= 0) return;
        damage = overflow;
      } else {
        if (enemy.tinkCd <= 0) {
          floater(enemy.x, enemy.y - 16, "clang", "#d7e7ff", 0.35);
          enemy.tinkCd = 0.35;
        }
        return;
      }
    }
    const resist = enemy.armor * (1 - armorBite);
    const dealt = damage * (1 - resist);
    enemy.hp -= dealt;
    enemy.flash = 0.18;
    if (from && from.quiet) {
      if (enemy.hp <= 0) defeat(enemy);
      return;
    }
    const plink = dealt < damage * 0.6;
    const shown = Math.max(1, Math.round(dealt));
    spawnSparks(enemy.x, enemy.y, plink ? "#d5e6ff" : "#ffe9a0");
    state.effects.push({ kind: "hit", x: enemy.x, y: enemy.y - 10, t: 0, life: 0.2, r: (enemy.radius || 12) + 4 });
    if (dealt >= 1) floater(enemy.x + ((enemy.id % 2) ? 6 : -6), enemy.y - 26, String(shown), plink ? "#d7e7ff" : "#fff6d0", 0.7);
    if (enemy.hp <= 0) defeat(enemy);
  }

  function angDelta(a, b) {
    let d = b - a;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    return d;
  }

  function distPointSeg(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len2 = dx * dx + dy * dy || 1;
    let t = ((px - x1) * dx + (py - y1) * dy) / len2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (x1 + dx * t), py - (y1 + dy * t));
  }

  function liveEnemies() {
    return state.enemies.filter((e) => !e.dead);
  }

  function targetScore(tower, enemy) {
    const def = B.enemies[enemy.type];
    let score;
    if (tower.priority === "last") score = -enemy.dist;
    else if (tower.priority === "tough") score = enemy.hp + enemy.maxHp * 0.01;
    else if (tower.priority === "near") score = -Math.hypot(enemy.x - tower.x, enemy.y - tower.y);
    else score = enemy.dist;
    if ((tower.type === "sky" || tower.type === "chopper") && def && (def.air || enemy.air)) score += 100000;
    return score;
  }

  function enemySeen(enemy) {
    const def = B.enemies[enemy.type];
    if (!def || (!def.stealth && !def.camo)) return true;
    for (const tower of state.towers) {
      const stats = B.statsFor(tower.type, tower.ranks);
      const recon = !!(stats.detect || stats.detectAura);
      const eyes = def.camo ? recon : recon || tower.type === "longshot";
      if (!eyes) continue;
      const reach = stats.range || 160;
      if (Math.hypot(tower.x - enemy.x, tower.y - enemy.y) <= reach) return true;
    }
    return false;
  }

  function canTarget(tower, stats, enemy) {
    const def = B.enemies[enemy.type];
    if (!def) return true;
    const flying = !!(def.air || enemy.airborne);
    if (flying && !(stats.air || stats.role === "sky" || stats.role === "chopper")) return false;
    if ((def.stealth || def.camo) && !enemySeen(enemy)) return false;
    return true;
  }

  function acquire(tower, stats, enemies) {
    let best = null;
    let bestScore = null;
    for (const enemy of enemies) {
      if (!canTarget(tower, stats, enemy)) continue;
      const d = Math.hypot(enemy.x - tower.x, enemy.y - tower.y);
      if (d > stats.range) continue;
      const score = targetScore(tower, enemy);
      if (bestScore === null || score > bestScore) {
        best = enemy;
        bestScore = score;
      }
    }
    return best;
  }

  function splashDamage(x, y, radius, damage, armorBite, ignoreId) {
    for (const enemy of liveEnemies()) {
      if (ignoreId && enemy.id === ignoreId) continue;
      if (Math.hypot(enemy.x - x, enemy.y - y) <= radius + (enemy.radius || 0) * 0.35) {
        deal(enemy, damage, armorBite, { x: x, y: y });
      }
    }
    spawnPoof(x, y, 1.15, true);
    audio.play("boom");
    state.effects.push({ kind: "boom", x, y, t: 0, life: 0.38, r: radius });
    if (!state.reducedMotion) state.shake = Math.max(state.shake, radius > 30 ? 3.4 : 2.2);
  }

  function chopperGun(tower) {
    const a = tower.spin || 0;
    return { x: tower.x + Math.cos(a) * 16, y: tower.y - 18 + Math.sin(a) * 7 };
  }

  function supportMods(tower) {
    let rate = 1;
    let damage = 1;
    for (const other of state.towers) {
      if (other === tower || other.type !== "tent") continue;
      const os = B.statsFor(other.type, other.ranks);
      if (Math.hypot(other.x - tower.x, other.y - tower.y) > (os.range || 0)) continue;
      if (os.aid) rate = Math.max(rate, os.aid);
      if (os.kit) damage += os.kit;
    }
    return { rate: rate, damage: damage };
  }

  function ignite(enemy, stats, from) {
    enemy.burn = Math.max(enemy.burn || 0, stats.burn || 1.6);
    enemy.burnDps = Math.max(enemy.burnDps || 0, stats.burnDps || 3);
    enemy.burnBite = Math.max(enemy.burnBite || 0, stats.armorBite || 0);
    enemy.burnFrom = from || { x: enemy.x, y: enemy.y };
    if (stats.burnSlow) enemy.hobble = Math.max(enemy.hobble || 0, 0.45);
  }

  function shoot(tower, target, stats) {
    if (stats.role === "engineer" || stats.role === "tent" || stats.rate <= 0) return;
    const mods = supportMods(tower);
    if (mods.damage !== 1 || mods.rate !== 1) {
      stats = Object.assign({}, stats, {
        damage: (stats.damage || 0) * mods.damage,
        burnDps: (stats.burnDps || 0) * mods.damage,
        rate: (stats.rate || 0) * mods.rate,
      });
    }
    const origin = stats.role === "chopper" ? chopperGun(tower) : aimOrigin(tower.x, tower.y, stats.role);
    const aim = Math.atan2(target.y - origin.y, target.x - origin.x);
    tower.aim = aim;
    tower.flash = 0.14;
    tower.shotsFired = (tower.shotsFired || 0) + 1;
    if (stats.ace && tower.shotsFired % 5 === 0) stats = Object.assign({}, stats, { damage: stats.damage * stats.ace });
    if (stats.grenadeEvery && tower.shotsFired % stats.grenadeEvery === 0) {
      splashDamage(target.x, target.y, stats.splash || 28, stats.damage, stats.armorBite || 0);
    }
    if (stats.slowOnHit) target.hobble = Math.max(target.hobble || 0, 0.8);
    if (stats.knock) target.dist = Math.max(0, target.dist - stats.knock);
    const tip = stats.role === "chopper" ? origin : muzzleTip(tower.x, tower.y, stats.role, aim);
    const mx = tip.x;
    const my = tip.y;
    if (stats.role === "flame") {
      const cone = stats.cone || 0.8;
      let hit = 0;
      for (const enemy of liveEnemies()) {
        if (!canTarget(tower, stats, enemy)) continue;
        const dx = enemy.x - tower.x;
        const dy = enemy.y - tower.y;
        if (Math.hypot(dx, dy) > stats.range + (enemy.radius || 0) * 0.25) continue;
        if (enemy !== target && Math.abs(angDelta(tower.aim, Math.atan2(dy, dx))) > cone) continue;
        ignite(enemy, stats, { x: tower.x, y: tower.y });
        hit += 1;
      }
      if (hit) {
        state.effects.push({ kind: "flame", x: mx, y: my, a: tower.aim, r: stats.range, cone: cone, t: 0, life: 0.16 });
        audio.play("flame");
      }
      tower.cooldown = 1 / Math.max(0.25, stats.rate);
      return;
    }
    if (stats.role === "mortar") {
      const travel = 0.55;
      const laneRoute = B.routeFor(target.lane);
      const dest = B.pointAt(Math.min(laneRoute.total - 1, target.dist + target.speed * travel), target.lane);
      state.shots.push({
        kind: "mortar",
        x: tower.x,
        y: tower.y - 18,
        x0: tower.x,
        y0: tower.y - 18,
        tx: dest.x,
        ty: dest.y,
        t: 0,
        flight: 0.62,
        damage: stats.damage,
        armorBite: stats.armorBite,
        splash: stats.splash || 34,
        life: 1,
      });
      audio.play("mortar");
      tower.cooldown = 1 / stats.rate;
      return;
    }
    if (stats.role === "sky") {
      state.shots.push({
        kind: "flak",
        x: mx,
        y: my,
        x0: mx,
        y0: my,
        px: mx,
        py: my,
        tx: target.x,
        ty: target.y,
        vx: 0,
        vy: 0,
        t: 0,
        flight: 0.28,
        damage: stats.damage * (target.air ? stats.airBonus || 1 : 1),
        armorBite: stats.armorBite,
        splash: stats.splash || 24,
        life: 1,
      });
      audio.play("flak");
      tower.cooldown = 1 / stats.rate;
      return;
    }
    if (stats.role === "tread") {
      deal(target, stats.damage, stats.armorBite);
      splashDamage(target.x, target.y, stats.splash || 22, Math.max(1, stats.damage * 0.35), stats.armorBite, target.id);
      state.effects.push({ kind: "tracer", x1: mx, y1: my, x2: target.x, y2: target.y, t: 0, life: 0.18 });
      audio.play("cannon");
      if (!state.reducedMotion) state.shake = Math.max(state.shake, 2.6);
      tower.cooldown = 1 / stats.rate;
      return;
    }
    if (stats.projectileSpeed <= 0) {
      deal(target, stats.damage, stats.armorBite);
      state.effects.push({
        kind: "tracer",
        x1: mx,
        y1: my,
        x2: target.x,
        y2: target.y,
        t: 0,
        life: 0.22,
      });
      audio.play("sniper");
    } else {
      const travel = Math.hypot(target.x - mx, target.y - my) / stats.projectileSpeed;
      const laneRoute = B.routeFor(target.lane);
      const dest = B.pointAt(Math.min(laneRoute.total - 1, target.dist + target.speed * travel * 0.9), target.lane);
      const dx = dest.x - mx;
      const dy = dest.y - my;
      const mag = Math.hypot(dx, dy) || 1;
      state.shots.push({
        x: mx,
        y: my,
        px: mx,
        py: my,
        vx: (dx / mag) * stats.projectileSpeed,
        vy: (dy / mag) * stats.projectileSpeed,
        damage: stats.damage,
        armorBite: stats.armorBite,
        radius: stats.role === "gatling" || stats.role === "gunner" ? 4 : 7,
        burn: stats.burn || 0,
        burnDps: stats.burnDps || 0,
        kind: stats.role,
        pierce: stats.pierce || 0,
        life: 1.15,
      });
      const extra = stats.extra || 0;
      for (let n = 0; n < extra; n++) {
        const spread = (n + 1) * 0.12 * (n % 2 === 0 ? 1 : -1);
        const ang = Math.atan2(dy, dx) + spread;
        state.shots.push({
          x: mx,
          y: my,
          px: mx,
          py: my,
          vx: Math.cos(ang) * stats.projectileSpeed,
          vy: Math.sin(ang) * stats.projectileSpeed,
          damage: stats.damage,
          armorBite: stats.armorBite,
          radius: 4,
          burn: stats.burn || 0,
          burnDps: stats.burnDps || 0,
          kind: stats.role,
          pierce: stats.pierce || 0,
          life: 1.15,
        });
      }
      const sound = stats.role === "gunner" ? "mauler" : stats.role === "gatling" ? "gatling" : stats.role === "tread" ? "cannon" : stats.role === "chopper" ? "chopper" : "rifle";
      if (stats.role === "chopper" && tower.rocketCd == null) tower.rocketCd = 0;
      if (stats.role === "chopper" && stats.splash && tower.rocketCd <= 0) {
        state.shots.push({
          kind: "rocket",
          x: mx,
          y: my,
          x0: mx,
          y0: my,
          px: mx,
          py: my,
          tx: target.x,
          ty: target.y,
          t: 0,
          flight: 0.35,
          damage: stats.damage * 3,
          armorBite: stats.armorBite,
          splash: stats.splash,
          life: 1,
        });
        tower.rocketCd = 1.6;
        audio.play("mortar");
      }
      audio.play(sound);
    }
    const haste = tower.buff > 0 ? 1.7 : 1;
    tower.cooldown = 1 / (stats.rate * haste);
  }

  function useAbility() {
    const tower = selectedTower();
    if (!tower || !B.abilityFor) return;
    const spec = B.abilityFor(tower.type, tower.ranks);
    if (!spec) return;
    if ((tower.abilityCd || 0) > 0) {
      toast(Math.ceil(tower.abilityCd) + "s");
      audio.play("deny");
      return;
    }
    tower.abilityCd = spec.cd;
    const stats = B.statsFor(tower.type, tower.ranks);
    const enemies = liveEnemies();
    function inReach(en, extra) {
      return Math.hypot(en.x - tower.x, en.y - tower.y) <= stats.range + (extra || 0);
    }
    if (spec.id === "rally" || spec.id === "storm") {
      const reach = spec.id === "rally" ? 150 : 1;
      state.towers.forEach(function (t) {
        if (spec.id === "storm" && t !== tower) return;
        if (Math.hypot(t.x - tower.x, t.y - tower.y) <= reach) t.buff = spec.id === "rally" ? 6 : 5;
      });
      floater(tower.x, tower.y - 28, spec.name.toUpperCase(), "#ffe56a", 1);
    } else if (spec.id === "deadeye") {
      let best = null;
      enemies.forEach(function (en) {
        if (!inReach(en, 0)) return;
        if (!best || en.hp > best.hp) best = en;
      });
      if (best) deal(best, 80, 1, { x: tower.x, y: tower.y });
      state.shake = Math.max(state.shake, 3);
    } else if (spec.id === "thunder") {
      let best = null;
      enemies.forEach(function (en) {
        if (!inReach(en, 0)) return;
        if (!best || en.hp > best.hp) best = en;
      });
      const x = best ? best.x : tower.x;
      const y = best ? best.y : tower.y;
      splashDamage(x, y, 48, 36, 1);
      state.shake = Math.max(state.shake, 4);
    } else if (spec.id === "blast") {
      enemies.forEach(function (en) {
        if (!inReach(en, 10)) return;
        deal(en, 12, 0.4, { x: tower.x, y: tower.y });
        en.hobble = Math.max(en.hobble || 0, 2.5);
      });
      spawnPoof(tower.x, tower.y, 1.4, true);
    } else if (spec.id === "triage") {
      state.towers.forEach(function (t) {
        if (Math.hypot(t.x - tower.x, t.y - tower.y) <= (stats.range || 90) + 16) t.buff = 4;
      });
      floater(tower.x, tower.y - 28, "TRIAGE", "#d8ffc4", 0.9);
    } else if (spec.id === "belch") {
      enemies.forEach(function (en) {
        if (!inReach(en, 6) || !canTarget(tower, stats, en)) return;
        ignite(en, {
          burn: 2.6,
          burnDps: (stats.burnDps || 5) * 1.4,
          armorBite: stats.armorBite,
          burnSlow: stats.burnSlow,
        }, { x: tower.x, y: tower.y });
      });
      state.effects.push({ kind: "flame", x: tower.x, y: tower.y - 8, a: tower.aim, r: stats.range + 6, cone: Math.PI * 0.85, t: 0, life: 0.32 });
      audio.play("flame");
    } else if (spec.id === "overdrive") {
      tower.buff = 4.5;
      floater(tower.x, tower.y - 28, "OVERDRIVE", "#ffe56a", 0.9);
    } else {
      let n = 0;
      const routes = B.routes && B.routes.length ? B.routes : [B.route];
      for (let li = 0; li < routes.length && n < 6; li++) {
        for (let d = 0; d < routes[li].total && n < 6; d += routes.length > 1 ? 120 : 70) {
        const p = B.pointAt(d, li);
        if (Math.hypot(p.x - tower.x, p.y - tower.y) > stats.range + 30) continue;
        state.shots.push({
          kind: "mortar",
          x: tower.x,
          y: tower.y - 18,
          x0: tower.x,
          y0: tower.y - 18,
          tx: p.x,
          ty: p.y,
          t: n * 0.1,
          flight: 0.5,
          damage: spec.id === "strike" ? 16 : 12,
          armorBite: 0.55,
          splash: spec.id === "swarm" ? 22 : 34,
          life: 1,
        });
        n += 1;
        }
      }
      if (!n) splashDamage(tower.x, tower.y + 20, 30, 14, 0.4);
    }
    showBanner("Ability", spec.name, spec.blurb, "info");
    audio.play(spec.id === "rally" || spec.id === "storm" || spec.id === "triage" || spec.id === "overdrive" ? "wave" : spec.id === "belch" ? "flame" : "cannon");
    announce(spec.name + ". " + spec.blurb);
  }

  function step(dt) {
    if (state.screen !== "play") return;
    state.launchLock = Math.max(0, state.launchLock - dt);
    if (state.waveActive) {
      state.waveClock += dt;
      while (state.spawnQueue.length && state.spawnQueue[0].at <= state.waveClock) {
        const item = state.spawnQueue.shift();
        spawnEnemy(item.type, item);
        if (state.screen !== "play") return;
      }
    }

    const enemies = liveEnemies();
    for (const tower of state.towers) {
      tower.phase += dt * 4;
      tower.spin += dt * (8 + tower.rank * 4);
      tower.flash = Math.max(0, tower.flash - dt);
      tower.suppress = Math.max(0, (tower.suppress || 0) - dt);
      tower.cooldown -= dt * (tower.suppress > 0 ? 0.45 : 1);
      tower.abilityCd = Math.max(0, (tower.abilityCd || 0) - dt);
      tower.buff = Math.max(0, (tower.buff || 0) - dt);
      if (tower.rocketCd) tower.rocketCd = Math.max(0, tower.rocketCd - dt);
      const stats = B.statsFor(tower.type, tower.ranks);
      if ((stats.role === "engineer" || stats.role === "tent") && !(stats.rate > 0)) {
        tower.aim = tower.idleAim;
        continue;
      }
      let target = enemies.find((e) => e.id === tower.targetId) || null;
      if (target && Math.hypot(target.x - tower.x, target.y - tower.y) > stats.range) target = null;
      if (!target) target = acquire(tower, stats, enemies);
      tower.targetId = target ? target.id : null;
      const origin = aimOrigin(tower.x, tower.y, stats.role);
      const desired = target
        ? Math.atan2(target.y - origin.y, target.x - origin.x)
        : tower.idleAim + Math.sin(state.time * 0.8 + tower.phase) * 0.28;
      tower.aim += angDelta(tower.aim, desired) * Math.min(1, dt * 10);
      if (target && tower.cooldown <= 0) shoot(tower, target, stats);
    }

    for (const enemy of enemies) enemy.slow = 1;
    for (const tower of state.towers) {
      if (tower.type !== "engineer") continue;
      const stats = B.statsFor(tower.type, tower.ranks);
      for (const enemy of enemies) {
        if (Math.hypot(enemy.x - tower.x, enemy.y - tower.y) <= stats.range) {
          enemy.slow = Math.min(enemy.slow, stats.slow || 0.7);
        }
      }
    }

    for (const shot of state.shots) {
      if (shot.kind === "mortar" || shot.kind === "flak" || shot.kind === "rocket") {
        shot.t += dt;
        const u = Math.min(1, shot.t / shot.flight);
        const arc = shot.kind === "mortar" ? 36 : shot.kind === "rocket" ? 14 : 8;
        shot.px = shot.x;
        shot.py = shot.y;
        shot.x = shot.x0 + (shot.tx - shot.x0) * u;
        shot.y = shot.y0 + (shot.ty - shot.y0) * u - Math.sin(u * Math.PI) * arc;
        if (u >= 1) {
          splashDamage(shot.tx, shot.ty, shot.splash || 24, shot.damage, shot.armorBite);
          shot.life = 0;
        }
        continue;
      }
      shot.life -= dt;
      shot.px = shot.x;
      shot.py = shot.y;
      shot.x += shot.vx * dt;
      shot.y += shot.vy * dt;
      if (shot.life <= 0) continue;
      for (const enemy of enemies) {
        if (enemy.dead) continue;
        if (distPointSeg(enemy.x, enemy.y, shot.px, shot.py, shot.x, shot.y) <= enemy.radius + shot.radius) {
          deal(enemy, shot.damage, shot.armorBite, { x: shot.x, y: shot.y });
          if (shot.burnDps && !enemy.dead) ignite(enemy, { burn: shot.burn, burnDps: shot.burnDps, armorBite: shot.armorBite }, { x: shot.x, y: shot.y });
          if (shot.pierce > 0) shot.pierce -= 1;
          else shot.life = 0;
          break;
        }
      }
    }
    state.shots = state.shots.filter((s) => s.life > 0);

    for (const enemy of state.enemies) {
      if (enemy.dead) {
        enemy.dying = (enemy.dying || 0) - dt;
        continue;
      }
      if (enemy.hobble > 0) {
        enemy.hobble -= dt;
        enemy.slow = Math.min(enemy.slow || 1, 0.62);
      }
      if (enemy.burn > 0) {
        enemy.burn -= dt;
        enemy.burnTick = (enemy.burnTick || 0) - dt;
        if (enemy.burnTick <= 0) {
          enemy.burnTick = 0.35;
          const from = enemy.burnFrom || { x: enemy.x, y: enemy.y };
          deal(enemy, (enemy.burnDps || 0) * 0.35, enemy.burnBite || 0, {
            burn: true,
            quiet: true,
            x: from.x,
            y: from.y,
          });
          if (enemy.dead) continue;
        }
      }
      if (enemy.falling > 0) {
        enemy.falling -= dt;
        enemy.airborne = true;
        enemy.air = true;
        const p = B.pointAt(enemy.dist, enemy.lane);
        const u = 1 - Math.max(0, enemy.falling) / (enemy.fall || 1);
        enemy.x = p.x;
        enemy.y = p.y - (1 - u) * 78;
        enemy.angle = p.angle;
        enemy.phase += dt * 4;
        enemy.flash = Math.max(0, enemy.flash - dt);
        enemy.tinkCd = Math.max(0, enemy.tinkCd - dt);
        enemy.revealed = enemySeen(enemy);
        if (enemy.falling <= 0) {
          enemy.falling = 0;
          enemy.airborne = false;
          enemy.air = false;
          enemy.x = p.x;
          enemy.y = p.y;
        }
        continue;
      }
      enemy.dist += enemy.speed * (enemy.slow || 1) * dt;
      enemy.phase += dt * enemy.speed * 0.16;
      enemy.flash = Math.max(0, enemy.flash - dt);
      enemy.tinkCd = Math.max(0, enemy.tinkCd - dt);
      enemy.revealed = enemySeen(enemy);
      const edef = B.enemies[enemy.type];
      if (edef.calls && enemy.callsLeft > 0 && !enemy.dead) {
        enemy.callCd -= dt;
        if (enemy.callCd <= 0) {
          enemy.callCd = edef.callEvery || 3.4;
          enemy.callsLeft -= 1;
          spawnEnemy("grunt", { dist: Math.max(0, enemy.dist - 36), lane: enemy.lane });
          floater(enemy.x, enemy.y - 28, "SQUAD", "#ffd0d0", 0.7);
        }
      }
      if (edef.drops && enemy.dropsLeft > 0 && !enemy.dead) {
        enemy.dropCd -= dt;
        if (enemy.dropCd <= 0) {
          enemy.dropCd = edef.dropEvery || 5;
          enemy.dropsLeft -= 1;
          const route = B.routeFor(enemy.lane);
          const frac = route.total ? Math.min(0.82, enemy.dist / route.total + 0.04) : 0.5;
          spawnEnemy("stick", { drop: frac, lane: enemy.lane });
        }
      }
      if (edef.suppress && !enemy.revealed && !enemy.dead) {
        enemy.supCd -= dt;
        if (enemy.supCd <= 0) {
          enemy.supCd = 3.6;
          let best = null;
          let bestD = 170;
          for (const tower of state.towers) {
            const d = Math.hypot(tower.x - enemy.x, tower.y - enemy.y);
            if (d < bestD) {
              bestD = d;
              best = tower;
            }
          }
          if (best) {
            best.suppress = 2.4;
            floater(best.x, best.y - 30, "PINNED", "#ffd0d0", 0.6);
          }
        }
      }
      if (edef.medic) {
        let jammed = false;
        for (const tower of state.towers) {
          const st = B.statsFor(tower.type, tower.ranks);
          if (st.healBlock && Math.hypot(tower.x - enemy.x, tower.y - enemy.y) <= st.range) jammed = true;
        }
        if (!jammed) {
          for (const other of state.enemies) {
            if (other.dead || other === enemy) continue;
            if (Math.hypot(other.x - enemy.x, other.y - enemy.y) < 46) {
              other.hp = Math.min(other.maxHp, other.hp + 7 * dt);
            }
          }
        }
      }
      if (edef.ironjaw) {
        enemy.stunCd = (enemy.stunCd == null ? 3.2 : enemy.stunCd) - dt;
        if (enemy.stunCd <= 0) {
          enemy.stunCd = 4.2;
          state.shake = Math.max(state.shake, 6);
          for (const tower of state.towers) {
            if (Math.hypot(tower.x - enemy.x, tower.y - enemy.y) < 120) tower.cooldown += 1.3;
          }
          floater(enemy.x, enemy.y - 28, "BOOM", "#ffb4a0", 0.7);
          audio.play("cannon");
        }
      }
      const laneRoute = B.routeFor(enemy.lane);
      if (enemy.dist >= laneRoute.total) {
        leak(enemy);
        continue;
      }
      const p = B.pointAt(enemy.dist, enemy.lane);
      enemy.x = p.x;
      enemy.y = p.y;
      enemy.angle = p.angle;
    }
    if (state.screen !== "play") {
      state.enemies = state.enemies.filter((e) => !e.dead);
      return;
    }
    state.enemies = state.enemies.filter((e) => !e.dead || e.dying > 0);
    const laneClear = state.enemies.every((e) => e.dead);

    if (state.waveActive && state.spawnQueue.length === 0 && laneClear) {
      let purse = 0;
      while (state.rewarded < state.started) {
        const cleared = state.rewarded < B.waves.length ? B.waves[state.rewarded] : freeWave(state.rewarded + 1);
        purse += cleared.reward || 0;
        state.rewarded += 1;
        if (root.BOTGSave) root.BOTGSave.addXp(8);
      }
      state.waveActive = false;
      if (purse) {
        let supply = 0;
        for (const tower of state.towers) {
          supply += B.statsFor(tower.type, tower.ranks).wavePay || 0;
        }
        state.cash += purse + supply;
        floater(200, 240, supply ? `Wave purse +$${purse + supply}` : `Wave purse +$${purse}`, "#ffe56a", 1.2);
        audio.play("clear");
        let livesBack = 0;
        for (const tower of state.towers) {
          livesBack += B.statsFor(tower.type, tower.ranks).lifeOnClear || 0;
        }
        if (livesBack) state.lives += livesBack;
        if (supply) audio.play("wrench");
        if (state.rewarded < B.waves.length) {
          showBanner(
            "Lane clear",
            "Round " + state.rewarded + " holds",
            "Purse +$" + (purse + supply) + ". Plant or upgrade, then send the next one.",
            "clear"
          );
        }
      }
      if (state.rewarded >= B.waves.length && !state.freeplay) win();
    }
  }

  function tickFx(dt) {
    for (const fx of state.effects) {
      fx.t += dt;
      if (fx.kind === "spark") {
        fx.x += fx.vx * dt;
        fx.y += fx.vy * dt;
        fx.vy += 40 * dt;
      }
    }
    state.effects = state.effects.filter((fx) => fx.t < fx.life);
    for (const f of state.floaters) f.t += dt;
    state.floaters = state.floaters.filter((f) => f.t < f.life);
    if (state.banner) {
      state.banner.t += dt;
      if (state.banner.t >= state.banner.life) state.banner = null;
    }
    if (state.toast) {
      state.toast.t += dt;
      if (state.toast.t >= state.toast.life) state.toast = null;
    }
    state.hurt = Math.max(0, state.hurt - dt * 1.4);
    state.shake = Math.max(0, state.shake - dt * 16);
  }

  function stampResult(won) {
    remember(won);
    const stars = root.BOTGSave ? root.BOTGSave.stars(state.mapId) : (won ? 1 : 0);
    const diff = state.difficulty || "medium";
    let medals = won ? ((B.medalPay && B.medalPay[diff]) || 20) : 0;
    if (won && state.challenge === "snipers") medals += 12;
    if (won && state.challenge === "double") medals += 12;
    if (won && state.challenge === "noleak" && !(state.leaked > 0)) medals += 18;
    const xpGain = won ? 40 : 0;
    if (root.BOTGSave) {
      if (medals) root.BOTGSave.award(medals);
      if (xpGain) root.BOTGSave.addXp(xpGain);
      if (won) root.BOTGSave.markChallenge(state.mapId, state.challenge);
      grantRankKits();
    }
    state.result = {
      won: !!won,
      map: (B.map && B.map.name) || "The lane",
      diff: diff,
      round: won ? B.waves.length : Math.max(1, state.started),
      rounds: B.waves.length,
      lives: state.lives,
      takedowns: state.takedowns || 0,
      leaked: state.leaked || 0,
      towers: state.towers.length,
      stars: stars,
      medals: medals,
      xp: xpGain,
      rank: B.rankFor ? B.rankFor(playerXp()).name : "",
      purse: root.BOTGSave ? root.BOTGSave.data.medals : medals,
    };
  }

  function lose() {
    if (state.screen !== "play") return;
    state.screen = "lose";
    state.auto = false;
    state.speedOverride = 0;
    state.shots = [];
    state.coach = false;
    stampResult(false);
    state.summary = `LOSE wave ${state.started} lives ${state.lives} cash ${state.cash}`;
    audio.play("lose");
    announce(`The Scowl Corps reached the gate on wave ${state.started}.`);
  }

  function win() {
    if (state.screen !== "play") return;
    state.screen = "win";
    state.auto = false;
    state.speedOverride = 0;
    state.shots = [];
    state.coach = false;
    stampResult(true);
    state.summary = `WIN lives ${state.lives} cash ${state.cash}`;
    audio.play("win");
    announce((B.map.name || "The lane") + " holds. The Scowl Corps fell back.");
  }

  function continueFreeplay() {
    if (state.screen !== "win") return;
    state.screen = "play";
    state.freeplay = true;
    state.waveActive = false;
    state.launchLock = 0;
    state.shots = [];
    showBanner("Freeplay", "Past round " + B.waves.length, "The Corps keeps coming. Send the next file.", "info");
    audio.play("wave");
    resize();
  }

  function setChallenge(id) {
    const known = (B.challenges || []).some(function (c) { return c.id === id; });
    if (!known) return;
    state.challenge = id;
    if (root.BOTGSave) root.BOTGSave.setChallenge(id);
    audio.play("ui");
  }

  const PLAN = [
    ["trooper", 150, 160],
    ["trooper", 236, 160],
    ["longshot", 188, 248],
    ["gatling", 128, 248],
    ["trooper", 250, 336],
    ["longshot", 168, 336],
    ["trooper", 210, 424],
    ["gatling", 300, 160],
  ];

  function autoStep() {
    if (!state.auto || state.screen !== "play") return;
    for (const spot of PLAN) {
      const [type, x, y] = spot;
      if (state.towers.some((t) => Math.hypot(t.x - x, t.y - y) < 8)) continue;
      if (canPlace(x, y, type).ok) {
        place(x, y, type);
        return;
      }
    }
    const order = ["longshot", "gatling", "trooper"];
    const towers = state.towers.slice().sort((a, b) => order.indexOf(a.type) - order.indexOf(b.type));
    for (const tower of towers) {
      const def = B.towers[tower.type];
      if (!def.paths || !tower.ranks) continue;
      for (const p of def.paths) {
        const cur = tower.ranks[p.id] || 0;
        if (cur >= 2) continue;
        const need = 1;
        if (B.chevronsUsed(tower.type, tower.ranks) + need > B.chevronCap) continue;
        const cost = B.pay(p.tiers[cur].cost);
        if (state.cash >= cost && state.towers.length >= 2) {
          state.selectedId = tower.id;
          upgrade(p.id);
          return;
        }
      }
    }
    if (!state.waveActive && state.launchLock <= 0 && state.started < B.waves.length && state.towers.length >= 2) {
      launch();
    }
  }

  function update(dt) {
    state.time += dt;
    tickFx(dt);
    if (state.screen === "play" && state.coach && state.rewarded >= 1) finishCoach();
    if (state.screen !== "play") return;
    if (state.auto) {
      state.autoTimer -= dt;
      if (state.autoTimer <= 0) {
        autoStep();
        state.autoTimer = 0.35;
      }
    }
    const slices = Math.max(1, Math.ceil(dt / (1 / 48)));
    const h = dt / slices;
    for (let i = 0; i < slices; i++) {
      if (state.screen !== "play") break;
      step(h);
    }
    updateGhost();
    const p = state.pointer;
    state.hoverTowerId = null;
    if (!state.placing && p.insideMap && state.screen === "play") {
      const tower = towerAt(p);
      if (tower) state.hoverTowerId = tower.id;
    }
  }

  function resize() {
    const dpr = Math.min(2, root.devicePixelRatio || 1);
    const rect = canvas.getBoundingClientRect();
    const cssW = Math.max(1, rect.width);
    const cssH = Math.max(1, rect.height);
    const w = Math.max(1, Math.round(cssW * dpr));
    const h = Math.max(1, Math.round(cssH * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    const inspecting = state.screen === "play" && !!state.selectedId && !state.placing;
    state.layout = computeLayout(cssW, cssH, inspecting);
    state.cssScaleX = w / state.layout.vw;
    state.cssScaleY = h / state.layout.vh;
    state.viewScale = state.cssScaleX;
    state._cssW = cssW;
    state._cssH = cssH;
  }

  function toGame(e) {
    const rect = canvas.getBoundingClientRect();
    const L = state.layout || computeLayout(Math.max(1, rect.width), Math.max(1, rect.height));
    const sx = ((e.clientX - rect.left) / (rect.width || 1)) * L.vw;
    const sy = ((e.clientY - rect.top) / (rect.height || 1)) * L.vh;
    const scale = L.scale || 1;
    const wx = (sx - L.ox) / scale;
    const wy = (sy - L.oy) / scale + L.worldTop;
    const insideMap = sx >= L.ox && sx <= L.ox + L.worldW * scale
      && sy >= L.oy && sy <= L.oy + L.worldH * scale
      && wx >= 0 && wx <= L.worldW
      && wy >= L.worldTop && wy <= L.worldTop + L.worldH;
    return { x: wx, y: wy, sx, sy, insideMap };
  }

  function hit(p) {
    const x = p.sx != null ? p.sx : p.x;
    const y = p.sy != null ? p.sy : p.y;
    const list = state.hotspots || [];
    for (let i = list.length - 1; i >= 0; i--) {
      const s = list[i];
      if (x >= s.x && x <= s.x + s.w && y >= s.y && y <= s.y + s.h) return s;
    }
    return null;
  }

  function trackPointer(p, inside) {
    state.pointer.x = p.x;
    state.pointer.y = p.y;
    state.pointer.sx = p.sx;
    state.pointer.sy = p.sy;
    state.pointer.inside = inside;
    state.pointer.insideMap = !!p.insideMap;
  }

  function mapTap(p) {
    if (state.screen !== "play" || !inMap(p)) return;
    const tower = towerAt(p);
    if (state.placing) {
      if (tower) {
        state.selectedId = tower.id;
        state.placing = null;
        audio.play("ui");
        return;
      }
      const check = canPlace(p.x, p.y, state.placing);
      if (!check.ok) {
        toast(check.reason);
        audio.play("deny");
        return;
      }
      place(p.x, p.y, state.placing);
      return;
    }
    state.selectedId = tower ? tower.id : null;
    if (tower) audio.play("ui");
  }

  let down = null;

  canvas.addEventListener("pointerdown", (e) => {
    canvas.setPointerCapture?.(e.pointerId);
    const p = toGame(e);
    trackPointer(p, true);
    const spot = hit(p);
    down = { sx: p.sx, sy: p.sy, id: spot ? spot.id : null };
    state._mapDragY = p.sy;
    state.pressedId = spot ? spot.id : null;
    audio.ensure();
    updateGhost();
    e.preventDefault();
  }, { passive: false });

  canvas.addEventListener("pointermove", (e) => {
    const p = toGame(e);
    trackPointer(p, true);
    if (state.screen === "maps" && down) {
      const dy = p.sy - (state._mapDragY == null ? down.sy : state._mapDragY);
      state._mapDragY = p.sy;
      state.mapScroll = (state.mapScroll || 0) - dy;
    }
    updateGhost();
  });

  canvas.addEventListener("pointerleave", () => {
    state.pointer.inside = false;
    state.pointer.insideMap = false;
  });

  root.addEventListener("pointerup", (e) => {
    if (!down) return;
    const p = toGame(e);
    const moved = Math.hypot(p.sx - down.sx, p.sy - down.sy);
    const spot = hit(p);
    if (moved < 36 && spot && spot.id === down.id && !spot.disabled && spot.action) spot.action();
    else if (moved < 36 && down.id == null && !spot) mapTap(p);
    down = null;
    state._mapDragY = null;
    state.pressedId = null;
  });

  canvas.addEventListener("contextmenu", (e) => e.preventDefault());
  canvas.addEventListener("wheel", (e) => {
    if (state.screen !== "maps") return;
    state.mapScroll = (state.mapScroll || 0) + e.deltaY;
    e.preventDefault();
  }, { passive: false });

  root.addEventListener("keydown", (e) => {
    audio.ensure();
    if (e.repeat) return;
    if (e.key === "m" || e.key === "M") {
      audio.toggle();
      return;
    }
    if (state.screen === "title" && (e.key === " " || e.key === "Enter")) {
      e.preventDefault();
      openMaps();
      return;
    }
    if (state.screen === "armory" && e.key === "Escape") {
      leaveArmory();
      return;
    }
    if (state.screen === "maps") {
      if (e.key === "1" || e.key === "Enter") {
        e.preventDefault();
        startGame("maple");
      } else if (e.key === "2") {
        e.preventDefault();
        startGame("cactus");
      } else if (e.key === "3") {
        e.preventDefault();
        startGame("frost");
      } else if (e.key === "Escape") {
        title();
      }
      return;
    }
    if ((state.screen === "win" || state.screen === "lose") && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      startGame();
      return;
    }
    if (state.screen !== "play") return;
    if (e.key === "1") pick("trooper");
    else if (e.key === "2") pick("longshot");
    else if (e.key === "3") pick("gatling");
    else if (e.key === "4") pick("mortar");
    else if (e.key === "5") pick("tread");
    else if (e.key === "6") pick("engineer");
    else if (e.key === "7") pick("sky");
    else if (e.key === "8") pick("chopper");
    else if (e.key === "f" || e.key === "F") toggleSpeed();
    else if (e.key === "Escape") {
      state.placing = null;
      state.selectedId = null;
    } else if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      launch();
    } else if (e.key === "u" || e.key === "U") upgrade();
    else if (e.key === "x" || e.key === "X") sell();
  });

  function setDifficulty(id) {
    if (!B.difficulties[id]) return;
    state.difficulty = id;
    if (root.BOTGSave) {
      root.BOTGSave.data.difficulty = id;
      root.BOTGSave.save();
    }
    audio.play("ui");
  }

  function startGame(mapId) {
    const id = mapId || state.mapId || "maple";
    if (!mapOpen(id)) {
      const need = B.maps[id] && B.maps[id].requires && B.maps[B.maps[id].requires];
      state.toast = { text: need ? "Beat " + need.name + " first." : "That map is locked.", t: 0, life: 1.8 };
      audio.play("deny");
      return;
    }
    const diffId = (root.BOTGSave && root.BOTGSave.data.difficulty) || state.difficulty || "medium";
    const diff = B.difficulties[diffId] || B.difficulties.medium;
    const map = B.setMap(id);
    const debug = state.debug;
    const motion = state.reducedMotion;
    state = fresh();
    state.mapId = map.id;
    state.difficulty = diff.id;
    B.costMul = diff.cost;
    state.cash = diff.cash;
    state.lives = diff.lives;
    state.challenge = (root.BOTGSave && root.BOTGSave.challenge()) || "normal";
    state.freeplay = false;
    const perk = currentPerk();
    if (perk && perk.cash) state.cash += perk.cash;
    if (perk && perk.lives) state.lives += perk.lives;
    grantRankKits();
    state.debug = debug;
    state.reducedMotion = motion;
    state.screen = "play";
    audio.ensure();
    audio.play("wave");
    state.coach = tutorialPending();
    announce(map.name + ", " + diff.name + ". Plant a Trooper on the glowing mark, then start round 1.");
    resize();
  }

  function openMaps() {
    const debug = state.debug;
    const motion = state.reducedMotion;
    state = fresh();
    state.debug = debug;
    state.reducedMotion = motion;
    state.difficulty = (root.BOTGSave && root.BOTGSave.data.difficulty) || "medium";
    state.screen = "maps";
    announce("Pick a map and a difficulty.");
    resize();
  }

  function openArmory() {
    state.armoryBack = state.screen === "title" ? "title" : "maps";
    state.screen = "armory";
    announce("The armory. Medals buy a new kit.");
    resize();
  }

  function leaveArmory() {
    if (state.armoryBack === "title") title();
    else openMaps();
  }

  function buyKit(id) {
    const kit = (B.kits || []).filter(function (k) { return k.id === id; })[0];
    const save = root.BOTGSave;
    if (!kit || !save) return;
    if (save.owns(id)) {
      save.equip(id);
      audio.play("ui");
      return;
    }
    if (!save.spend(kit.cost)) {
      state.toast = { text: "Need " + kit.cost + " medals.", t: 0, life: 1.6 };
      audio.play("deny");
      return;
    }
    save.own(id);
    save.equip(id);
    audio.play("upgrade");
  }

  function title() {
    const debug = state.debug;
    const motion = state.reducedMotion;
    state = fresh();
    state.debug = debug;
    state.reducedMotion = motion;
    state.screen = "title";
    resize();
  }

  function jump(waveNumber) {
    const debug = state.debug;
    const motion = state.reducedMotion;
    const mapId = state.mapId || "maple";
    B.setMap(mapId);
    const keepTowers = state.towers.map((t) => Object.assign({}, t));
    state = fresh();
    state.mapId = mapId;
    state.debug = debug;
    state.reducedMotion = motion;
    state.screen = "play";
    state.towers = keepTowers;
    state.placedCount = keepTowers.length;
    state.cash = Math.max(state.cash, 400);
    const index = Math.max(1, Math.min(B.waves.length, waveNumber | 0));
    state.started = index - 1;
    state.rewarded = index - 1;
    resize();
    launch();
  }

  root.BOTG = {
    get state() {
      return state;
    },
    launch,
    toggleSpeed,
    upgrade,
    refund,
    sell,
    pick,
    startGame,
    openMaps,
    mapOpen,
    towerOpen,
    setChallenge,
    continueFreeplay,
    openArmory,
    leaveArmory,
    buyKit,
    title,
    cycleAim,
    setDifficulty,
    unlockAll,
    useAbility,
    finishCoach,
    canPlace: canPlace,
    place: place,
  };

  const params = new URLSearchParams(root.location.search);
  state.debug = params.has("debug");
  state.reducedMotion = reducedMotion();
  if (state.debug) {
    root.__BOTG = {
      get state() {
        return state;
      },
      cash(n) {
        state.cash += n;
      },
      lives(n) {
        state.lives = n;
      },
      jump,
      auto() {
        if (state.screen !== "play") startGame();
        state.auto = true;
        state.speedOverride = 8;
        state.autoTimer = 0.05;
      },
      stop() {
        state.auto = false;
        state.speedOverride = 0;
      },
      spam(type) {
        for (let y = 72; y <= 530; y += 42) {
          for (let x = 32; x <= 368; x += 42) {
            if (canPlace(x, y, type).ok) place(x, y, type);
          }
        }
        return state.towers.length;
      },
      send() {
        if (state.screen === "play" && !state.waveActive && state.launchLock <= 0 && state.started < B.waves.length) launch();
      },
      tick(seconds) {
        let left = seconds;
        while (left > 0 && state.screen === "play") {
          const h = Math.min(1 / 30, left);
          update(h);
          left -= h;
        }
        return state.screen;
      },
      summary() {
        return state.summary || `${state.screen} wave ${state.started} lives ${state.lives} cash ${state.cash} towers ${state.towers.length}`;
      },
    };
  }

  root.addEventListener("resize", resize);
  root.addEventListener("orientationchange", () => setTimeout(resize, 60));
  if (root.visualViewport) root.visualViewport.addEventListener("resize", resize);
  root.addEventListener("gesturestart", (e) => e.preventDefault());
  root.addEventListener("touchmove", (e) => e.preventDefault(), { passive: false });
  root.addEventListener("error", (ev) => {
    state.error = ev.message || "Something broke";
  });

  let last = performance.now();
  function frame(now) {
    const rect = canvas.getBoundingClientRect();
    const inspecting = state.screen === "play" && !!state.selectedId && !state.placing;
    if (!state.layout || Math.abs(rect.width - state._cssW) > 0.5 || Math.abs(rect.height - state._cssH) > 0.5 || !!state.layout.inspecting !== inspecting) resize();
    const real = Math.min(0.05, (now - last) / 1000) || 0;
    last = now;
    try {
      const dt = real * (state.screen === "play" ? speedMul() : 1);
      update(dt);
      if (!state.placing) updateGhost();
      root.BOTGRender.draw(ctx, state);
    } catch (err) {
      state.error = err && err.message ? err.message : String(err);
      console.error(err);
    }
    requestAnimationFrame(frame);
  }

  resize();
  requestAnimationFrame(frame);
})(typeof window !== "undefined" ? window : globalThis);
  