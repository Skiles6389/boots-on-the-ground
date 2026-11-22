
// Simulation, input, and wave flow for Boots on the Ground.
(function (root) {
  const B = root.BOTG_BALANCE;
  const audio = root.BOTGAudio;
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d", { alpha: false });
  const AIM = ["first", "last", "tough", "near"];

  function computeLayout(cssW, cssH) {
    const portrait = cssH >= cssW * 0.9;
    const vw = portrait ? 400 : 400 * (cssW / cssH);
    const vh = portrait ? 400 * (cssH / cssW) : 400;
    const headerH = portrait ? 56 : 46;
    let footerH = 0;
    let sideW = 0;
    if (portrait) {
      // Tall enough for three two-line upgrade buttons on a short phone.
      footerH = Math.round(Math.min(348, Math.max(286, vh * 0.4)));
      const minMap = 210;
      if (headerH + footerH > vh - minMap) footerH = Math.max(200, vh - headerH - minMap);
    } else {
      sideW = Math.max(270, Math.min(332, Math.round(vw * 0.36)));
      if (sideW > vw - 220) sideW = Math.max(200, vw - 220);
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
      portrait, vw, vh, headerH, footerH, sideW,
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
      shopPage: 0,
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

  function floater(x, y, text, color, life) {
    state.floaters.push({ x, y, text, color: color || "#fff6d0", t: 0, life: life || 0.9 });
    if (state.floaters.length > 24) state.floaters.splice(0, state.floaters.length - 24);
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
    const def = B.towers[tower.type];
    let n = def.cost;
    if (def.paths && tower.ranks) {
      def.paths.forEach(function (p) {
        const r = tower.ranks[p.id] || 0;
        for (let i = 0; i < r; i++) n += p.tiers[i].cost;
      });
      return n;
    }
    for (let i = 0; i < tower.rank; i++) n += def.upgrades[i].cost;
    return n;
  }

  function refund(tower) {
    return Math.round(invested(tower) * B.meta.sellRefund);
  }

  function inMap(p) {
    if (p && typeof p.insideMap === "boolean") return p.insideMap;
    return p.x >= 0 && p.x <= B.view.width && p.y >= B.view.headerH && p.y < B.view.footerY;
  }

  function canPlace(x, y, type) {
    const map = B.map;
    if (y < B.view.headerH + 16 || y > B.view.footerY - 16 || x < 18 || x > B.view.width - 18) {
      return { ok: false, reason: "Plant on the grass." };
    }
    if (B.distToRoute(x, y) < map.pathClearance) {
      return { ok: false, reason: "The lane is for marching." };
    }
    const pond = map.pond;
    if (pond && Math.hypot(x - pond.x, y - pond.y) < pond.r + 8) {
      return { ok: false, reason: pond.kind === "well" ? "That's the well." : "That's the pond." };
    }
    for (const tree of map.trees) {
      if (Math.hypot(x - tree.x, y - tree.y) < map.trunkBlock) {
        return { ok: false, reason: "A tree is in the way." };
      }
    }
    for (const t of state.towers) {
      if (Math.hypot(x - t.x, y - t.y) < map.towerGap) {
        return { ok: false, reason: "Too close to a soldier." };
      }
    }
    const cost = B.towers[type].cost;
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
    state.cash -= def.cost;
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
    });
    state.placedCount += 1;
    state.ghost = null;
    state.suppressGhost = true;
    spawnPoof(x, y + 2, 0.55, false);
    audio.play("place");
    floater(x, y - 26, `-$${def.cost}`, "#fff6d0", 0.7);
  }

  function shopTurn(dir) {
    const order = B.towerOrder || Object.keys(B.towers);
    const pages = Math.max(1, Math.ceil(order.length / 3));
    state.shopPage = ((state.shopPage || 0) + dir + pages) % pages;
    audio.play("ui");
  }

  function pick(key) {
    if (state.screen !== "play") return;
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
    if (state.cash < up.cost) {
      toast("Need $" + up.cost + ".");
      audio.play("deny");
      return;
    }
    state.cash -= up.cost;
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
        items.push({ type: g.type, at: t });
        t += g.interval;
      }
      t += 0.35;
    }
    return items;
  }

  function launch() {
    if (state.screen !== "play") return;
    if (state.launchLock > 0) return;
    if (state.started >= B.waves.length) return;
    const early = state.waveActive;
    const wave = B.waves[state.started];
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
    showBanner(`Wave ${state.started} of ${B.waves.length}`, wave.name, wave.hint, wave.boss ? "boss" : "info");
    audio.play(wave.boss ? "boss" : "wave");
    announce(`Wave ${state.started}, ${wave.name}. ${wave.hint}`);
  }

  function spawnEnemy(type) {
    const def = B.enemies[type];
    const p = B.pointAt(0);
    const enemy = {
      id: state.nextId++,
      type,
      dist: 0,
      x: p.x,
      y: p.y,
      angle: p.angle,
      hp: def.hp,
      maxHp: def.hp,
      speed: def.speed,
      armor: def.armor,
      cash: def.cash,
      leak: def.leak,
      radius: def.radius,
      phase: Math.random() * 6,
      flash: 0,
      tinkCd: 0,
      dead: false,
    };
    state.enemies.push(enemy);
    if (def.ironjaw) {
      showBanner("Scowl Corps", "Ironjaw", "The mega-tank. Cannons and mortars. His blast stuns nearby guns.", "boss");
      audio.play("boss");
      state.shake = Math.max(state.shake, 7);
      announce("Ironjaw is on the lane.");
    } else if (def.boss) {
      showBanner("Scowl Corps", "General Grimstache", "His tank is on the lane. Stop it before the gate.", "boss");
      audio.play("boss");
      state.shake = Math.max(state.shake, 5);
      announce("General Grimstache is on the lane.");
    }
  }

  function defeat(enemy) {
    if (enemy.dead) return;
    enemy.dead = true;
    enemy.dying = 0.42;
    enemy.hp = 0;
    state.cash += enemy.cash;
    const boss = !!B.enemies[enemy.type].boss;
    const scale = boss ? 2.15 : enemy.type === "jeep" ? 1.35 : enemy.type === "heavy" ? 1.15 : 1;
    spawnPoof(enemy.x, enemy.y, scale, true);
    floater(enemy.x, enemy.y - 16, `+$${enemy.cash}`, "#fff6d0", 0.85);
    spawnSparks(enemy.x, enemy.y, "#ffe56a");
    audio.play(boss ? "bossPoof" : "poof");
    if (boss) state.shake = Math.max(state.shake, state.reducedMotion ? 0 : 8);
  }

  function leak(enemy) {
    if (enemy.dead) return;
    enemy.dead = true;
    state.lives -= enemy.leak;
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
    if (def && def.shield && armorBite < 0.5 && fromFront(enemy, from)) {
      enemy.flash = 0.1;
      if (enemy.tinkCd <= 0) {
        floater(enemy.x, enemy.y - 16, "clang", "#d7e7ff", 0.35);
        enemy.tinkCd = 0.45;
      }
      return;
    }
    const resist = enemy.armor * (1 - armorBite);
    const dealt = damage * (1 - resist);
    enemy.hp -= dealt;
    enemy.flash = 0.18;
    const plink = dealt < damage * 0.6;
    spawnSparks(enemy.x, enemy.y, plink ? "#d5e6ff" : "#ffe9a0");
    if (plink && enemy.tinkCd <= 0) {
      floater(enemy.x, enemy.y - 20, "tink", "#d7e7ff", 0.45);
      enemy.tinkCd = 0.75;
    }
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
    if (tower.priority === "last") return -enemy.dist;
    if (tower.priority === "tough") return enemy.hp + enemy.maxHp * 0.01;
    if (tower.priority === "near") return -Math.hypot(enemy.x - tower.x, enemy.y - tower.y);
    return enemy.dist;
  }

  function enemySeen(enemy) {
    const def = B.enemies[enemy.type];
    if (!def || !def.stealth) return true;
    for (const tower of state.towers) {
      const stats = B.statsFor(tower.type, tower.ranks);
      if (!(stats.detect || stats.detectAura || tower.type === "longshot")) continue;
      const reach = stats.detect || stats.detectAura || tower.type === "longshot" ? stats.range || 160 : 0;
      if (Math.hypot(tower.x - enemy.x, tower.y - enemy.y) <= reach) return true;
    }
    return false;
  }

  function canTarget(tower, stats, enemy) {
    const def = B.enemies[enemy.type];
    if (!def) return true;
    if (def.air && !(stats.air || stats.role === "sky" || stats.role === "chopper")) return false;
    if (def.stealth && !enemySeen(enemy)) return false;
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
        deal(enemy, damage, armorBite);
      }
    }
    spawnPoof(x, y, 1.15, true);
    state.effects.push({ kind: "boom", x, y, t: 0, life: 0.38, r: radius });
    if (!state.reducedMotion) state.shake = Math.max(state.shake, radius > 30 ? 3.4 : 2.2);
  }

  function chopperGun(tower) {
    const a = tower.spin || 0;
    return { x: tower.x + Math.cos(a) * 16, y: tower.y - 18 + Math.sin(a) * 7 };
  }

  function shoot(tower, target, stats) {
    if (stats.role === "engineer" || stats.rate <= 0) return;
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
    if (stats.role === "mortar") {
      const travel = 0.55;
      const dest = B.pointAt(Math.min(B.route.total - 1, target.dist + target.speed * travel));
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
      const dest = B.pointAt(Math.min(B.route.total - 1, target.dist + target.speed * travel * 0.9));
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
        radius: stats.role === "gatling" ? 5 : 7,
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
          radius: 5,
          kind: stats.role,
          pierce: stats.pierce || 0,
          life: 1.15,
        });
      }
      const sound = stats.role === "gatling" ? "gatling" : stats.role === "tread" ? "cannon" : stats.role === "chopper" ? "chopper" : "rifle";
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
    tower.cooldown = 1 / stats.rate;
  }

  function step(dt) {
    if (state.screen !== "play") return;
    state.launchLock = Math.max(0, state.launchLock - dt);
    if (state.waveActive) {
      state.waveClock += dt;
      while (state.spawnQueue.length && state.spawnQueue[0].at <= state.waveClock) {
        const item = state.spawnQueue.shift();
        spawnEnemy(item.type);
        if (state.screen !== "play") return;
      }
    }

    const enemies = liveEnemies();
    for (const tower of state.towers) {
      tower.phase += dt * 4;
      tower.spin += dt * (8 + tower.rank * 4);
      tower.flash = Math.max(0, tower.flash - dt);
      tower.cooldown -= dt;
      if (tower.rocketCd) tower.rocketCd = Math.max(0, tower.rocketCd - dt);
      const stats = B.statsFor(tower.type, tower.ranks);
      if (stats.role === "engineer" && !(stats.rate > 0)) {
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
      enemy.dist += enemy.speed * (enemy.slow || 1) * dt;
      enemy.phase += dt * enemy.speed * 0.16;
      enemy.flash = Math.max(0, enemy.flash - dt);
      enemy.tinkCd = Math.max(0, enemy.tinkCd - dt);
      enemy.revealed = enemySeen(enemy);
      const edef = B.enemies[enemy.type];
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
      if (enemy.dist >= B.route.total) {
        leak(enemy);
        continue;
      }
      const p = B.pointAt(enemy.dist);
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
        purse += B.waves[state.rewarded].reward;
        state.rewarded += 1;
      }
      state.waveActive = false;
      if (purse) {
        let supply = 0;
        for (const tower of state.towers) {
          if (tower.type === "engineer") supply += B.statsFor(tower.type, tower.ranks).wavePay || 0;
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
      if (state.rewarded >= B.waves.length) win();
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

  function lose() {
    if (state.screen !== "play") return;
      state.screen = "lose";
      state.auto = false;
      state.speedOverride = 0;
      state.shots = [];
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
    state.summary = `WIN lives ${state.lives} cash ${state.cash}`;
    audio.play("win");
    announce((B.map.name || "The lane") + " holds. The Scowl Corps poofed into smoke.");
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
        const cost = p.tiers[cur].cost;
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
    state.layout = computeLayout(cssW, cssH);
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
    state.pressedId = spot ? spot.id : null;
    audio.ensure();
    updateGhost();
    e.preventDefault();
  }, { passive: false });

  canvas.addEventListener("pointermove", (e) => {
    const p = toGame(e);
    trackPointer(p, true);
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
    state.pressedId = null;
  });

  canvas.addEventListener("contextmenu", (e) => e.preventDefault());

  root.addEventListener("keydown", (e) => {
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
    if (state.screen === "maps") {
      if (e.key === "1" || e.key === "Enter") {
        e.preventDefault();
        startGame("maple");
      } else if (e.key === "2") {
        e.preventDefault();
        startGame("cactus");
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
    else if (e.key === "[") shopTurn(-1);
    else if (e.key === "]") shopTurn(1);
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

  function startGame(mapId) {
    const id = mapId || state.mapId || "maple";
    const map = B.setMap(id);
    const debug = state.debug;
    const motion = state.reducedMotion;
    state = fresh();
    state.mapId = map.id;
    state.debug = debug;
    state.reducedMotion = motion;
    state.screen = "play";
    audio.ensure();
    audio.play("wave");
    const ground = map.theme === "desert" ? "sand" : "grass";
    announce(map.name + ". Plant a Trooper on the " + ground + ", then start round 1.");
    resize();
  }

  function openMaps() {
    const debug = state.debug;
    const motion = state.reducedMotion;
    state = fresh();
    state.debug = debug;
    state.reducedMotion = motion;
    state.screen = "maps";
    announce("Pick a map. Maple Grove or Cactus Junction.");
    resize();
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
    shopTurn,
    startGame,
    openMaps,
    title,
    cycleAim,
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
    if (!state.layout || Math.abs(rect.width - state._cssW) > 0.5 || Math.abs(rect.height - state._cssH) > 0.5) resize();
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
  