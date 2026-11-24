// Illustrated plates for Boots on the Ground.
// Maps are 800×1140 paintings drawn into the 400×570 world.
// Sprites are 3× cut-outs drawn at the manifest's logical size and anchor.
(function (root) {
  const VERSION = "2026-11-24k";
  const SPRITES = {
    trooper: { w: 31.0, h: 42.0, ax: 0.382, ay: 0.944 },
    longshot: { w: 52.0, h: 30.3, ax: 0.449, ay: 0.923 },
    gatling: { w: 39.3, h: 43.3, ax: 0.415, ay: 0.946 },
    mortar: { w: 36.3, h: 38.0, ax: 0.5, ay: 0.939 },
    tread: { w: 49.3, h: 45.0, ax: 0.51, ay: 0.941 },
    engineer: { w: 37.0, h: 35.0, ax: 0.527, ay: 0.933 },
    sky: { w: 32.3, h: 33.3, ax: 0.392, ay: 0.93 },
    chopper: { w: 59.0, h: 44.0, ax: 0.5, ay: 0.5, center: true },
    grunt: { w: 29.7, h: 38.0, ax: 0.455, ay: 0.939 },
    dash: { w: 31.3, h: 31.7, ax: 0.734, ay: 0.926 },
    brute: { w: 41.3, h: 44.3, ax: 0.456, ay: 0.947 },
    riot: { w: 32.3, h: 39.7, ax: 0.371, ay: 0.941 },
    bulwark: { w: 32.3, h: 37.7, ax: 0.479, ay: 0.938 },
    medic: { w: 27.7, h: 39.3, ax: 0.428, ay: 0.941 },
    sneak: { w: 26.3, h: 35.7, ax: 0.443, ay: 0.935 },
    camo: { w: 29.3, h: 40.0, ax: 0.46, ay: 0.942 },
    para: { w: 32.3, h: 42.0, ax: 0.273, ay: 0.944 },
    heavy: { w: 41.3, h: 40.7, ax: 0.363, ay: 0.943 },
    scout: { w: 28.7, h: 39.3, ax: 0.453, ay: 0.941 },
  };

  const SCARF = {
    parade: "#c6a45a",
    night: "#1c2838",
    sand: "#c4a06a",
    dress: "#3a62a8",
  };

  const maps = {};
  const frames = {};
  let readyFlag = false;
  let scratch = null;

  function src(kind, id) {
    return "assets/art/" + kind + "/" + id + ".webp?v=" + VERSION;
  }

  function loadInto(bucket, kind, id) {
    const img = new Image();
    img.decoding = "async";
    const done = new Promise(function (resolve) {
      img.onload = function () { resolve(true); };
      img.onerror = function () { resolve(false); };
    });
    img.src = src(kind, id);
    bucket[id] = img;
    return done;
  }

  const jobs = [];
  ["maple", "cactus", "frost"].forEach(function (id) { jobs.push(loadInto(maps, "maps", id)); });
  Object.keys(SPRITES).forEach(function (id) { jobs.push(loadInto(frames, "sprites", id)); });
  Promise.all(jobs).then(function () { readyFlag = true; });

  function alive(img) {
    return !!(img && img.complete && img.naturalWidth);
  }

  function skinOf(opt) {
    if (opt && opt.skin) return opt.skin;
    if (opt && opt.team === "enemy") return "field";
    const save = root.BOTGSave;
    return (save && save.skin && save.skin()) || "field";
  }

  function rankTotal(opt) {
    if (!opt || !opt.ranks) return opt && opt.rank ? opt.rank : 0;
    let n = 0;
    Object.keys(opt.ranks).forEach(function (k) { n += opt.ranks[k] || 0; });
    return n || (opt.rank || 0);
  }

  function scratchCtx(w, h) {
    const W = Math.max(1, Math.ceil(w));
    const H = Math.max(1, Math.ceil(h));
    if (!scratch) scratch = document.createElement("canvas");
    if (scratch.width !== W || scratch.height !== H) {
      scratch.width = W;
      scratch.height = H;
    }
    const g = scratch.getContext("2d");
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.globalAlpha = 1;
    g.globalCompositeOperation = "source-over";
    g.clearRect(0, 0, W, H);
    return g;
  }

  function blit(ctx, img, dx, dy, dw, dh, tint) {
    if (!tint) {
      ctx.drawImage(img, dx, dy, dw, dh);
      return;
    }
    const g = scratchCtx(dw, dh);
    g.drawImage(img, 0, 0, dw, dh);
    g.globalCompositeOperation = "source-atop";
    g.fillStyle = tint;
    g.fillRect(0, 0, Math.ceil(dw), Math.ceil(dh));
    ctx.drawImage(scratch, dx, dy, dw, dh);
  }

  function chevron(ctx, x, y, s) {
    ctx.beginPath();
    ctx.moveTo(x - 3.4 * s, y + 2.2 * s);
    ctx.lineTo(x, y - 2.4 * s);
    ctx.lineTo(x + 3.4 * s, y + 2.2 * s);
    ctx.stroke();
  }

  function drawUnit(ctx, x, y, opt) {
    opt = opt || {};
    const role = opt.role || (opt.team === "enemy" ? "grunt" : "trooper");
    const meta = SPRITES[role];
    const img = frames[role];
    if (!meta || !alive(img)) return false;

    const aim = opt.aim || 0;
    const face = Math.cos(aim) >= 0 ? 1 : -1;
    const beat = Math.sin((opt.phase || 0) * 1.15);
    const sc = opt.scale || 1;
    const flash = opt.flash || 0;
    const firing = flash > 0.02 && opt.team !== "enemy";
    const kick = firing ? Math.min(1, flash) * 4 : 0;
    const hidden = (role === "sneak" || role === "camo") && !opt.revealed;
    const sx = (1 + beat * 0.055) * (firing ? 0.94 : 1);
    const sy = (1 - beat * 0.045) * (1 + Math.min(0.12, flash * 0.2));
    const bob = beat * (opt.team === "enemy" ? 1.5 : 2.1);

    ctx.save();
    ctx.translate(x - Math.cos(aim) * kick, y - Math.sin(aim) * kick * 0.35 - bob);
    ctx.scale(face * sx * sc, sy * sc);

    if (!meta.center) {
      ctx.fillStyle = "rgba(40, 28, 16, 0.28)";
      ctx.beginPath();
      ctx.ellipse(0, 2, Math.max(6, meta.w * 0.22), 3.1, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    if (hidden) ctx.globalAlpha = role === "camo" ? 0.34 : 0.42;

    let tint = null;
    if (!hidden && opt.team === "enemy" && flash > 0.05) tint = "rgba(255,255,255,0.45)";
    else if (!hidden && opt.slow && opt.slow < 0.92) tint = "rgba(150, 190, 255, 0.22)";
    blit(ctx, img, -meta.w * meta.ax, -meta.h * meta.ay, meta.w, meta.h, tint);

    if (opt.team !== "enemy") {
      const scarf = SCARF[skinOf(opt)];
      if (scarf) {
        ctx.save();
        ctx.globalAlpha = hidden ? 0.5 : 1;
        ctx.fillStyle = scarf;
        ctx.strokeStyle = "#14100c";
        ctx.lineWidth = 1.15;
        const bw = meta.w * 0.26;
        const bh = Math.max(3.2, meta.h * 0.075);
        const bx = -bw * 0.15;
        const by = -meta.h * meta.ay * 0.46;
        ctx.fillRect(bx, by, bw, bh);
        ctx.strokeRect(bx, by, bw, bh);
        ctx.restore();
      }
      const marks = rankTotal(opt);
      if (marks > 0) {
        ctx.save();
        ctx.strokeStyle = "#2a1c10";
        ctx.fillStyle = "#e2c56a";
        ctx.lineWidth = 1.5;
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        const n = Math.min(3, marks);
        const gy = -meta.h * meta.ay + 5;
        for (let i = 0; i < n; i++) chevron(ctx, (i - (n - 1) / 2) * 6.5, gy, 0.85);
        if (marks >= 4) {
          ctx.beginPath();
          ctx.arc(meta.w * (0.5 - meta.ax) + 6, -meta.h * meta.ay * 0.72, 2.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
        ctx.restore();
      }
    }

    if (role === "chopper") {
      const spin = opt.spin || opt.phase || 0;
      ctx.save();
      ctx.rotate(spin * 1.7);
      ctx.strokeStyle = "rgba(20, 14, 10, 0.55)";
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(-meta.w * 0.42, 0);
      ctx.lineTo(meta.w * 0.42, 0);
      ctx.moveTo(0, -meta.h * 0.22);
      ctx.lineTo(0, meta.h * 0.22);
      ctx.stroke();
      ctx.restore();
    }

    if (opt.shield != null && opt.shield < 0.7 && opt.shield > 0) {
      ctx.strokeStyle = "#14100c";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(meta.w * 0.12, -meta.h * 0.55);
      ctx.lineTo(meta.w * 0.02, -meta.h * 0.28);
      ctx.stroke();
    }

    ctx.restore();
    return true;
  }

  function drawCameo(ctx, key, x, y, w, h) {
    const meta = SPRITES[key];
    const img = frames[key];
    if (!meta || !alive(img) || w < 4 || h < 4) return false;
    const sc = Math.min((w * 0.92) / meta.w, (h * 0.9) / meta.h);
    const dw = meta.w * sc;
    const dh = meta.h * sc;
    if (meta.center) {
      ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
    } else {
      ctx.drawImage(img, x + (w - dw) / 2, y + h - dh - 1, dw, dh);
    }
    return true;
  }

  root.BOTGArt = {
    ready: function () { return readyFlag; },
    has: function (id) { return !!(SPRITES[id] && alive(frames[id])); },
    mapReady: function (id) { return alive(maps[id || "maple"]); },
    mapImage: function (id) { return alive(maps[id || "maple"]) ? maps[id || "maple"] : null; },
    meta: function (id) { return SPRITES[id] || null; },
    top: function (id, scale) {
      const meta = SPRITES[id];
      if (!meta) return 40 * (scale || 1);
      return meta.h * meta.ay * (scale || 1);
    },
    drawUnit: drawUnit,
    drawCameo: drawCameo,
  };
})(typeof window !== "undefined" ? window : globalThis);
