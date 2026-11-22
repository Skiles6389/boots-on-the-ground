// Cartoon battlefield renderer for Boots on the Ground.
// Bright flat colors and thick outlines. Soldiers are drawn in soldiers.js.
(function (root) {
  const B = root.BOTG_BALANCE;
  const FONT = '"Lilita One", "Trebuchet MS", Verdana, sans-serif';
  const GRASS = "#4fb534";
  const INK = "#1a120c";

  function font(ctx, size) {
    ctx.font = size + "px " + FONT;
  }

  function radii(r, w, h) {
    const src = typeof r === "number" ? { tl: r, tr: r, br: r, bl: r } : (r || {});
    const cap = (n) => Math.max(0, Math.min(n || 0, w / 2, h / 2));
    return { tl: cap(src.tl), tr: cap(src.tr), br: cap(src.br), bl: cap(src.bl) };
  }

  function roundPath(ctx, x, y, w, h, r) {
    const o = radii(r, w, h);
    ctx.beginPath();
    ctx.moveTo(x + o.tl, y);
    ctx.arcTo(x + w, y, x + w, y + h, o.tr);
    ctx.arcTo(x + w, y + h, x, y + h, o.br);
    ctx.arcTo(x, y + h, x, y, o.bl);
    ctx.arcTo(x, y, x + w, y, o.tl);
    ctx.closePath();
  }

  function fillRound(ctx, x, y, w, h, r, color) {
    if (w <= 0 || h <= 0) return;
    ctx.fillStyle = color;
    roundPath(ctx, x, y, w, h, r);
    ctx.fill();
  }

  function strokeRound(ctx, x, y, w, h, r) {
    roundPath(ctx, x, y, w, h, r);
    ctx.stroke();
  }

  function label(ctx, text, x, y, size, fill, stroke, sw) {
    font(ctx, size);
    ctx.lineJoin = "round";
    ctx.miterLimit = 2;
    if (stroke) {
      ctx.lineWidth = sw || Math.max(3, size * 0.18);
      ctx.strokeStyle = stroke;
      ctx.strokeText(text, x, y);
    }
    ctx.fillStyle = fill;
    ctx.fillText(text, x, y);
  }

  function star(ctx, x, y, r, rot) {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = (rot || 0) + (i * Math.PI) / 5 - Math.PI / 2;
      const rad = i % 2 === 0 ? r : r * 0.42;
      const px = x + Math.cos(a) * rad;
      const py = y + Math.sin(a) * rad;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
  }

  function shadow(ctx, x, y, rx, ry) {
    ctx.fillStyle = "rgba(20, 50, 12, 0.28)";
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  function mulberry32(seed) {
    let a = seed >>> 0;
    return function rand() {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function pointerHot(state, x, y, w, h) {
    const p = state.pointer;
    if (!p || !p.inside) return false;
    const px = p.sx != null ? p.sx : p.x;
    const py = p.sy != null ? p.sy : p.y;
    return px >= x && px <= x + w && py >= y && py <= y + h;
  }

  function linesOf(ctx, text, maxW) {
    const words = String(text || "").split(" ");
    const lines = [];
    let line = "";
    for (const word of words) {
      const test = line ? line + " " + word : word;
      if (line && ctx.measureText(test).width > maxW) {
        lines.push(line);
        line = word;
      } else line = test;
    }
    if (line) lines.push(line);
    return lines;
  }

  function drawWrapped(ctx, text, x, y, maxW, lineH, maxLines) {
    let lines = linesOf(ctx, text, maxW);
    if (lines.length > maxLines) {
      lines = lines.slice(0, maxLines);
      let last = lines[maxLines - 1];
      while (last.length > 1 && ctx.measureText(last + "…").width > maxW) last = last.slice(0, -1);
      lines[maxLines - 1] = last + "…";
    }
    lines.forEach((ln, i) => ctx.fillText(ln, x, y + i * lineH));
  }

  function uiButton(ctx, state, spec) {
    const x = spec.x;
    const y = spec.y;
    const w = spec.w;
    const h = spec.h;
    if (w < 8 || h < 8) return;
    const pressed = state.pressedId === spec.id && !spec.disabled;
    const py = y + (pressed ? Math.min(4, h * 0.08) : 0);
    const hot = pointerHot(state, x, y, w, h);
    const radius = spec.radius || Math.min(18, h / 2);
    const lip = spec.lip || "#8a5a18";
    ctx.save();
    fillRound(ctx, x, y + 5, w, h, radius, spec.disabled ? "#b7b1a6" : lip);
    const top = spec.disabled ? "#e4dfd6" : (hot ? spec.hotTop || spec.fillTop : spec.fillTop) || "#ffe56a";
    const bot = spec.disabled ? "#d4cfc4" : (hot ? spec.hotBot || spec.fillBot : spec.fillBot) || top;
    const g = ctx.createLinearGradient(x, py, x, py + h);
    g.addColorStop(0, top);
    g.addColorStop(1, bot);
    fillRound(ctx, x, py, w, h, radius, g);
    ctx.save();
    roundPath(ctx, x, py, w, h, radius);
    ctx.clip();
    ctx.fillStyle = "rgba(255,255,255,0.28)";
    ctx.fillRect(x, py, w, h * 0.42);
    ctx.restore();
    ctx.lineWidth = spec.active ? 4 : 3;
    ctx.strokeStyle = spec.active ? "#fff4b0" : INK;
    strokeRound(ctx, x, py, w, h, radius);
    if (spec.active) {
      ctx.lineWidth = 3;
      ctx.strokeStyle = "#e09000";
      strokeRound(ctx, x + 3, py + 3, w - 6, h - 6, Math.max(4, radius - 3));
    }
    if (spec.pulse && !spec.disabled) {
      const a = 0.35 + Math.sin(state.time * 5) * 0.4;
      ctx.lineWidth = 4;
      ctx.strokeStyle = "rgba(255, 220, 60, " + a + ")";
      strokeRound(ctx, x - 3, py - 3, w + 6, h + 6, radius + 3);
    }
    if (spec.icon) spec.icon(ctx, x, py, w, h);
    else if (spec.portraitKey) {
      const ph = Math.max(24, h - 36);
      drawPortrait(ctx, spec.portraitKey, x + 6, py + 5, w - 12, ph);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const name = spec.label || "";
      font(ctx, 13);
      const ns = fitSize(ctx, name, w - 12, 15);
      label(ctx, name, x + w / 2, py + h - 22, ns, INK, null, 0);
      const cost = "$" + spec.cost;
      const affordable = spec.affordable !== false;
      font(ctx, 12);
      const cw = Math.max(36, ctx.measureText(cost).width + 14);
      fillRound(ctx, x + w / 2 - cw / 2, py + h - 16, cw, 14, 7, affordable ? "#ffe14a" : "#ff8d86");
      ctx.lineWidth = 1.6;
      ctx.strokeStyle = INK;
      strokeRound(ctx, x + w / 2 - cw / 2, py + h - 16, cw, 14, 7);
      label(ctx, cost, x + w / 2, py + h - 9, 12, INK, null, 0);
    } else if (spec.label) {
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const ink = spec.ink || "#ffffff";
      const stroke = spec.stroke == null ? INK : spec.stroke;
      if (spec.sub) {
        const ls = fitSize(ctx, spec.label, w - 16, spec.labelSize || 18);
        label(ctx, spec.label, x + w / 2, py + h / 2 - 9, ls, ink, stroke, Math.max(3, ls * 0.16));
        const ss = fitSize(ctx, spec.sub, w - 14, spec.subSize || 11);
        label(ctx, spec.sub, x + w / 2, py + h / 2 + 10, ss, ink, stroke, Math.max(2, ss * 0.14));
      } else {
        const ls = fitSize(ctx, spec.label, w - 12, spec.labelSize || 18);
        label(ctx, spec.label, x + w / 2, py + h / 2 + 1, ls, ink, stroke, Math.max(3, ls * 0.16));
      }
    }
    ctx.restore();
    state.hotspots.push({
      id: spec.id,
      x: x,
      y: y,
      w: w,
      h: h,
      action: spec.action,
      disabled: !!spec.disabled,
    });
  }

  function fitSize(ctx, text, maxW, size) {
    let s = size;
    font(ctx, s);
    while (s > 10 && ctx.measureText(text).width > maxW) {
      s -= 1;
      font(ctx, s);
    }
    return s;
  }

  function drawHeart(ctx, x, y, s) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.moveTo(0, 3.2);
    ctx.bezierCurveTo(-4.2, 0.2, -4.4, -2.6, -2.2, -3.4);
    ctx.bezierCurveTo(-0.8, -4, 0, -2.6, 0, -2.2);
    ctx.bezierCurveTo(0, -2.6, 0.8, -4, 2.2, -3.4);
    ctx.bezierCurveTo(4.4, -2.6, 4.2, 0.2, 0, 3.2);
    ctx.fill();
    ctx.fillStyle = "#ff4d5e";
    ctx.beginPath();
    ctx.moveTo(0, 2.4);
    ctx.bezierCurveTo(-3.4, -0.2, -3.5, -2.2, -1.8, -2.8);
    ctx.bezierCurveTo(-0.6, -3.3, 0, -2.2, 0, -1.8);
    ctx.bezierCurveTo(0, -2.2, 0.6, -3.3, 1.8, -2.8);
    ctx.bezierCurveTo(3.5, -2.2, 3.4, -0.2, 0, 2.4);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.beginPath();
    ctx.ellipse(-1.3, -1.6, 0.7, 0.45, -0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawCoin(ctx, x, y, r) {
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.arc(x, y + 1, r + 1.4, 0, Math.PI * 2);
    ctx.fill();
    const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 1, x, y, r);
    g.addColorStop(0, "#fff1a0");
    g.addColorStop(0.6, "#ffd23a");
    g.addColorStop(1, "#e29a12");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 1.6;
    ctx.strokeStyle = "#a86a08";
    ctx.stroke();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    label(ctx, "$", x, y + 0.5, r * 1.15, "#a86a08", null, 0);
  }

  function drawSpeaker(ctx, x, y, w, h, muted) {
    const cx = x + w / 2 - 2;
    const cy = y + h / 2;
    ctx.fillStyle = INK;
    ctx.fillRect(cx - 8, cy - 3, 5, 7);
    ctx.beginPath();
    ctx.moveTo(cx - 3, cy - 3);
    ctx.lineTo(cx + 4, cy - 8);
    ctx.lineTo(cx + 4, cy + 8);
    ctx.lineTo(cx - 3, cy + 4);
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    if (muted) {
      ctx.beginPath();
      ctx.moveTo(cx + 7, cy - 5);
      ctx.lineTo(cx + 14, cy + 5);
      ctx.moveTo(cx + 14, cy - 5);
      ctx.lineTo(cx + 7, cy + 5);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(cx + 4, cy, 6, -0.8, 0.8);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx + 4, cy, 9, -0.7, 0.7);
      ctx.stroke();
    }
  }

  function drawPortrait(ctx, key, x, y, w, h) {
    const enemy = key === "grunt" || key === "scout" || key === "heavy";
    const vehicle = key === "jeep" || key === "tank";
    ctx.save();
    fillRound(ctx, x, y, w, h, 12, enemy || vehicle ? "#4a2040" : "#2f9a3c");
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = INK;
    strokeRound(ctx, x, y, w, h, 12);
    ctx.save();
    roundPath(ctx, x + 1, y + 1, w - 2, h - 2, 11);
    ctx.clip();
    if (vehicle) {
      fillRound(ctx, x + w * 0.16, y + h * 0.36, w * 0.68, h * 0.3, 6, key === "tank" ? "#5a32b0" : "#8a5ad4");
    } else if (root.BOTGSoldier) {
      const prone = key === "longshot";
      const sc = prone
        ? Math.min((w * 0.9) / 40, (h * 0.7) / 16)
        : Math.min((w * 0.88) / 28, (h * 0.94) / 40);
      root.BOTGSoldier.draw(ctx, x + w / 2, y + (prone ? h * 0.58 : h - 2), {
        team: enemy ? "enemy" : "player",
        role: key,
        aim: prone ? -0.08 : 0.12,
        scale: sc,
      });
    }
    ctx.restore();
    ctx.restore();
  }

  let terrain = null;
  function ensureTerrain() {
    if (terrain) return;
    const S = 2;
    terrain = document.createElement("canvas");
    terrain.width = 400 * S;
    terrain.height = 570 * S;
    const g = terrain.getContext("2d");
    g.setTransform(S, 0, 0, S, 0, 0);
    g.lineCap = "round";
    g.lineJoin = "round";
    paintTerrain(g);
  }

  function tracePath(ctx) {
    const pts = B.map.path;
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  }

  function strokePath(ctx, width, color) {
    tracePath(ctx);
    ctx.lineWidth = width;
    ctx.strokeStyle = color;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
  }

  function paintTerrain(ctx) {
    ctx.fillStyle = GRASS;
    ctx.fillRect(0, 0, 400, 570);
    const blobs = [
      [70, 180, 130, 70, "#6ed84a"],
      [300, 150, 120, 60, "#3ea028"],
      [200, 300, 160, 80, "#7ae052"],
      [80, 400, 140, 70, "#369424"],
      [320, 430, 130, 64, "#62c840"],
      [180, 500, 170, 50, "#8ae85e"],
      [40, 120, 90, 40, "#3d9a2c"],
      [340, 260, 80, 48, "#2f8a24"],
    ];
    blobs.forEach((b) => {
      ctx.fillStyle = b[4];
      ctx.beginPath();
      ctx.ellipse(b[0], b[1], b[2], b[3], 0, 0, Math.PI * 2);
      ctx.fill();
    });

    const rand = mulberry32(11);
    for (let i = 0; i < 70; i++) {
      const x = 8 + rand() * 384;
      const y = 60 + rand() * 490;
      if (B.distToRoute(x, y) < 32) continue;
      const pond = B.map.pond;
      if (Math.hypot(x - pond.x, y - pond.y) < pond.r + 6) continue;
      drawTuft(ctx, x, y, 5 + rand() * 6);
    }
    const colors = ["#ff8ab4", "#ffe56a", "#ffffff", "#ff9a3c", "#8ad4ff"];
    for (let i = 0; i < 34; i++) {
      const x = 12 + rand() * 376;
      const y = 70 + rand() * 470;
      if (B.distToRoute(x, y) < 30) continue;
      const pond = B.map.pond;
      if (Math.hypot(x - pond.x, y - pond.y) < pond.r + 8) continue;
      drawFlower(ctx, x, y, 2.4 + rand() * 1.6, colors[i % colors.length]);
    }

    strokePath(ctx, 64, "rgba(36, 70, 16, 0.35)");
    strokePath(ctx, 54, "#5c3b22");
    strokePath(ctx, 46, "#e6c98a");
    strokePath(ctx, 34, "#f0d7a4");
    strokePath(ctx, 14, "rgba(255, 244, 214, 0.55)");

    ctx.fillStyle = "rgba(120, 78, 36, 0.35)";
    for (let d = 0; d < B.route.total; d += 9) {
      const p = B.pointAt(d);
      const nx = -Math.sin(p.angle);
      const ny = Math.cos(p.angle);
      ctx.fillRect(p.x + nx * 8 - 1, p.y + ny * 8 - 1, 2, 2);
      ctx.fillRect(p.x - nx * 10 - 1, p.y - ny * 10 - 1, 2, 2);
    }

    const pond = B.map.pond;
    shadow(ctx, pond.x + 2, pond.y + 4, pond.r + 4, pond.r * 0.72);
    ctx.fillStyle = "#1f8fbf";
    ctx.beginPath();
    ctx.ellipse(pond.x, pond.y, pond.r, pond.r * 0.68, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = INK;
    ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.beginPath();
    ctx.ellipse(pond.x - 6, pond.y - 4, pond.r * 0.28, pond.r * 0.12, -0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#3ecf6a";
    ctx.beginPath();
    ctx.ellipse(pond.x + 8, pond.y + 4, 6, 3, 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.4;
    ctx.stroke();

    const exit = B.pointAt(B.route.total - 16);
    drawFort(ctx, exit.x, exit.y);
    drawSign(ctx, 78, 524);

    ctx.fillStyle = "rgba(90, 40, 120, 0.0)";
    drawBannerPost(ctx, 26, 96);
  }

  function drawTuft(ctx, x, y, h) {
    ctx.fillStyle = "#21761c";
    ctx.strokeStyle = "#10280e";
    ctx.lineWidth = 1.2;
    [-3.2, 0, 3.2].forEach((dx, i) => {
      const hh = h * (i === 1 ? 1 : 0.75);
      ctx.beginPath();
      ctx.moveTo(x + dx - 1.4, y);
      ctx.quadraticCurveTo(x + dx, y - hh, x + dx + 1.6, y);
      ctx.fill();
      ctx.stroke();
    });
  }

  function drawFlower(ctx, x, y, r, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = "#10280e";
    ctx.fillStyle = "#2f8a28";
    ctx.fillRect(-0.6, 0, 1.2, r + 3);
    ctx.fillStyle = color;
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * r, Math.sin(a) * r, r * 0.72, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    ctx.fillStyle = "#ffe56a";
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.42, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  function drawFort(ctx, x, y) {
    shadow(ctx, x, y + 8, 28, 10);
    fillRound(ctx, x - 22, y - 26, 14, 36, 4, "#c4884a");
    fillRound(ctx, x + 8, y - 26, 14, 36, 4, "#c4884a");
    ctx.lineWidth = 3;
    ctx.strokeStyle = INK;
    strokeRound(ctx, x - 22, y - 26, 14, 36, 4);
    strokeRound(ctx, x + 8, y - 26, 14, 36, 4);
    fillRound(ctx, x - 24, y - 30, 48, 12, 4, "#e0a85c");
    ctx.lineWidth = 3;
    strokeRound(ctx, x - 24, y - 30, 48, 12, 4);
    ctx.fillStyle = "#2a140c";
    ctx.beginPath();
    ctx.moveTo(x - 8, y + 8);
    ctx.quadraticCurveTo(x, y - 8, x + 8, y + 8);
    ctx.fill();
    drawHeart(ctx, x, y - 32, 1.15);
  }

  function drawSign(ctx, x, y) {
    shadow(ctx, x + 40, y + 16, 36, 6);
    fillRound(ctx, x, y, 96, 26, 8, "#fff4d2");
    ctx.lineWidth = 3;
    ctx.strokeStyle = INK;
    strokeRound(ctx, x, y, 96, 26, 8);
    fillRound(ctx, x + 44, y + 24, 6, 14, 2, "#8a5a32");
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    label(ctx, "Maple Grove", x + 48, y + 14, 13, "#5c3b22", null, 0);
  }

  function drawBannerPost(ctx, x, y) {
    fillRound(ctx, x, y, 8, 28, 2, "#3a2060");
    ctx.lineWidth = 2;
    ctx.strokeStyle = INK;
    strokeRound(ctx, x, y, 8, 28, 2);
    fillRound(ctx, x + 6, y + 2, 36, 16, 4, "#6a3ec4");
    ctx.strokeStyle = INK;
    strokeRound(ctx, x + 6, y + 2, 36, 16, 4);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    label(ctx, "IN", x + 24, y + 11, 11, "#ffe56a", INK, 2);
  }

  const PROPS = [
    { kind: "fence", x: 78, y: 86, w: 150 },
    { kind: "fence", x: 250, y: 86, w: 136 },
    { kind: "bags", x: 50, y: 168 },
    { kind: "bush", x: 368, y: 164 },
    { kind: "crate", x: 26, y: 250 },
    { kind: "bags", x: 356, y: 252 },
    { kind: "rock", x: 24, y: 336 },
    { kind: "crate", x: 368, y: 336 },
    { kind: "bush", x: 22, y: 424 },
    { kind: "rock", x: 370, y: 418 },
    { kind: "bags", x: 46, y: 508 },
    { kind: "crate", x: 196, y: 516 },
    { kind: "bush", x: 300, y: 508 },
  ].filter((p) => {
    const px = p.kind === "fence" ? p.x + p.w / 2 : p.x;
    const py = p.y;
    if (B.distToRoute(px, py) < (p.kind === "fence" ? 24 : 34)) return false;
    const pond = B.map.pond;
    return Math.hypot(px - pond.x, py - pond.y) > pond.r + 12;
  });

  function drawFence(ctx, x, y, w) {
    shadow(ctx, x + w / 2, y + 4, w / 2, 5);
    const posts = Math.max(2, Math.round(w / 26));
    ctx.strokeStyle = INK;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(x, y - 12);
    ctx.lineTo(x + w, y - 12);
    ctx.moveTo(x, y - 4);
    ctx.lineTo(x + w, y - 4);
    ctx.stroke();
    ctx.strokeStyle = "#f0c36a";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x, y - 12);
    ctx.lineTo(x + w, y - 12);
    ctx.moveTo(x, y - 4);
    ctx.lineTo(x + w, y - 4);
    ctx.stroke();
    for (let i = 0; i < posts; i++) {
      const px = x + (i * w) / (posts - 1);
      fillRound(ctx, px - 3, y - 18, 6, 22, 2, "#d7a45a");
      ctx.lineWidth = 2;
      ctx.strokeStyle = INK;
      strokeRound(ctx, px - 3, y - 18, 6, 22, 2);
    }
  }

  function drawBush(ctx, x, y, s) {
    const k = s || 1;
    shadow(ctx, x, y + 4, 16 * k, 6);
    const balls = [[-8, -2, 11], [8, 0, 12], [0, -10, 13]];
    balls.forEach((b) => {
      ctx.fillStyle = "#1f7a28";
      ctx.beginPath();
      ctx.arc(x + b[0] * k, y + b[1] * k, b[2] * k, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 2.4 * k;
      ctx.strokeStyle = INK;
      ctx.stroke();
    });
    ctx.fillStyle = "#8ae85a";
    ctx.beginPath();
    ctx.arc(x - 2 * k, y - 12 * k, 5 * k, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawRock(ctx, x, y, r) {
    shadow(ctx, x + 2, y + 4, r, r * 0.45);
    ctx.fillStyle = "#9aa0a8";
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * 0.66, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = INK;
    ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.beginPath();
    ctx.ellipse(x - r * 0.25, y - r * 0.15, r * 0.28, r * 0.16, -0.4, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawBags(ctx, x, y) {
    shadow(ctx, x, y + 6, 18, 6);
    const spots = [[-10, 2], [-2, 6], [8, 3], [-6, -4], [4, -2]];
    spots.forEach((s, i) => {
      ctx.fillStyle = i % 2 ? "#e7d3a4" : "#c9ae78";
      ctx.beginPath();
      ctx.ellipse(x + s[0], y + s[1], 8, 4.2, s[0] * 0.05, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = INK;
      ctx.stroke();
      ctx.strokeStyle = "rgba(90,60,20,0.45)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x + s[0] - 3, y + s[1]);
      ctx.lineTo(x + s[0] + 3, y + s[1]);
      ctx.stroke();
    });
  }

  function drawCrate(ctx, x, y) {
    shadow(ctx, x, y + 8, 14, 5);
    fillRound(ctx, x - 13, y - 16, 26, 22, 3, "#e0a04a");
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = INK;
    strokeRound(ctx, x - 13, y - 16, 26, 22, 3);
    ctx.beginPath();
    ctx.moveTo(x - 10, y - 13);
    ctx.lineTo(x + 10, y + 3);
    ctx.moveTo(x + 10, y - 13);
    ctx.lineTo(x - 10, y + 3);
    ctx.stroke();
    ctx.strokeStyle = "rgba(255,255,255,0.45)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - 8, y - 14);
    ctx.lineTo(x + 6, y - 14);
    ctx.stroke();
  }

  function drawTree(ctx, tree) {
    const sets = {
      green: ["#145c22", "#2f9a32", "#8ae85a"],
      amber: ["#8a3e08", "#e08618", "#ffe07a"],
      rust: ["#7a261c", "#d25030", "#ffb07a"],
    };
    const cols = sets[tree.style] || sets.green;
    const r = tree.r;
    shadow(ctx, tree.x, tree.y + 4, r * 0.85, r * 0.32);
    fillRound(ctx, tree.x - 5, tree.y - r * 0.2, 10, r * 0.85, 3, "#8a5a32");
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = INK;
    strokeRound(ctx, tree.x - 5, tree.y - r * 0.2, 10, r * 0.85, 3);
    [[-r * 0.45, -r * 0.55, r * 0.72], [r * 0.42, -r * 0.5, r * 0.68], [0, -r * 0.95, r * 0.78]].forEach((c, i) => {
      ctx.fillStyle = cols[Math.min(2, i)];
      ctx.beginPath();
      ctx.arc(tree.x + c[0], tree.y + c[1], c[2], 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = INK;
      ctx.stroke();
    });
    ctx.fillStyle = "rgba(255,255,255,0.28)";
    ctx.beginPath();
    ctx.arc(tree.x - r * 0.2, tree.y - r * 1.1, r * 0.28, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawChevrons(ctx, state) {
    const step = 52;
    const march = state.reducedMotion ? 18 : (state.time * 46) % step;
    for (let d = march; d < B.route.total - 24; d += step) {
      const p = B.pointAt(d);
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      ctx.strokeStyle = INK;
      ctx.lineWidth = 5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(-7, -6);
      ctx.lineTo(2, 0);
      ctx.lineTo(-7, 6);
      ctx.stroke();
      ctx.strokeStyle = "#fff6d8";
      ctx.lineWidth = 2.4;
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawRange(ctx, x, y, r, ok) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = ok ? "rgba(255,255,255,0.14)" : "rgba(255,70,70,0.16)";
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.setLineDash([7, 6]);
    ctx.strokeStyle = ok ? "rgba(255,255,255,0.9)" : "#ff5a5a";
    ctx.stroke();
    ctx.restore();
  }

  function drawRanks(ctx, x, y, rank) {
    for (let i = 0; i < rank; i++) {
      const cx = x + (i - (rank - 1) / 2) * 13;
      ctx.fillStyle = INK;
      star(ctx, cx, y, 6.4, 0);
      ctx.fill();
      ctx.fillStyle = "#ffe56a";
      star(ctx, cx, y - 0.6, 4.6, 0);
      ctx.fill();
    }
  }

  function drawMuzzle(ctx, x, y, aim, amount) {
    const a = Math.min(1, amount * 8);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(aim || 0);
    ctx.globalAlpha = a;
    const glow = ctx.createRadialGradient(0, 0, 1, 0, 0, 12);
    glow.addColorStop(0, "#ffffff");
    glow.addColorStop(0.35, "#ffe56a");
    glow.addColorStop(0.7, "#ff9a1f");
    glow.addColorStop(1, "rgba(255,120,20,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff8d0";
    star(ctx, 0, 0, 6, 0.2);
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.fillStyle = "#ffd23a";
    star(ctx, 5, 0, 3.4, 0.8);
    ctx.fill();
    ctx.restore();
  }

  function drawSoldier(ctx, x, y, opt) {
    if (root.BOTGSoldier) root.BOTGSoldier.draw(ctx, x, y, opt);
    const role = opt.role || "trooper";
    const sc = opt.scale || 1;
    if (!opt.team || opt.team === "player") {
      if (opt.flash > 0 && root.BOTGMuzzle) {
        const tip = root.BOTGMuzzle(x, y, role, opt.aim || 0);
        drawMuzzle(ctx, tip.x, tip.y, opt.aim || 0, opt.flash);
      }
    }
    if (opt.rank) drawRanks(ctx, x, y - (role === "longshot" ? 16 : 40) * sc, opt.rank);
  }

  function drawJeep(ctx, e) {
    ctx.save();
    ctx.translate(e.x, e.y);
    ctx.rotate(e.angle);
    shadow(ctx, 0, 8, 24, 9);
    ctx.fillStyle = INK;
    [[-12, -10], [10, -10], [-12, 8], [10, 8]].forEach((w) => {
      ctx.beginPath();
      ctx.ellipse(w[0], w[1], 5, 3.4, 0, 0, Math.PI * 2);
      ctx.fill();
    });
    fillRound(ctx, -18, -9, 36, 18, 6, "#6a3ec4");
    ctx.lineWidth = 3;
    ctx.strokeStyle = INK;
    strokeRound(ctx, -18, -9, 36, 18, 6);
    ctx.fillStyle = "rgba(255,255,255,0.25)";
    ctx.fillRect(-16, -7, 32, 5);
    fillRound(ctx, 4, -6, 12, 12, 3, "#d8c8ff");
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2;
    strokeRound(ctx, 4, -6, 12, 12, 3);
    ctx.fillStyle = "#ff2a2a";
    ctx.beginPath();
    ctx.arc(8, -1, 1.5, 0, Math.PI * 2);
    ctx.arc(13, -1, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#2a1040";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(7, 2.5);
    ctx.quadraticCurveTo(10.5, 4.5, 14, 2.5);
    ctx.stroke();
    ctx.fillStyle = "#ffe56a";
    ctx.fillRect(16, -3, 4, 2.4);
    ctx.fillRect(16, 1, 4, 2.4);
    if (e.flash > 0) {
      ctx.fillStyle = "rgba(255,255,255," + Math.min(0.75, e.flash * 4) + ")";
      fillRound(ctx, -18, -9, 36, 18, 6, ctx.fillStyle);
    }
    ctx.restore();
  }

  function drawTank(ctx, e, time) {
    ctx.save();
    ctx.translate(e.x, e.y);
    ctx.rotate(e.angle);
    ctx.scale(0.75, 0.75);
    shadow(ctx, 0, 10, 34, 12);
    ctx.fillStyle = "#241433";
    fillRound(ctx, -30, -16, 60, 10, 4, "#241433");
    fillRound(ctx, -30, 6, 60, 10, 4, "#241433");
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.5;
    strokeRound(ctx, -30, -16, 60, 10, 4);
    strokeRound(ctx, -30, 6, 60, 10, 4);
    const roll = ((time * 40) % 12);
    ctx.fillStyle = "#c9b4ff";
    for (let i = -24; i <= 24; i += 12) {
      ctx.fillRect(i + roll - 18, -14, 4, 6);
      ctx.fillRect(i + roll - 18, 8, 4, 6);
    }
    fillRound(ctx, -26, -12, 50, 24, 8, "#5a32b0");
    ctx.lineWidth = 3;
    ctx.strokeStyle = INK;
    strokeRound(ctx, -26, -12, 50, 24, 8);
    ctx.fillStyle = "rgba(255,255,255,0.2)";
    ctx.fillRect(-22, -10, 42, 6);
    ctx.fillStyle = "#7a4ad4";
    ctx.beginPath();
    ctx.arc(-2, 0, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(8, 0);
    ctx.lineTo(30, 0);
    ctx.stroke();
    ctx.strokeStyle = "#d2c4ee";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = "#ffe08a";
    ctx.beginPath();
    ctx.arc(-2, -2, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.fillStyle = "#3a2060";
    ctx.beginPath();
    ctx.arc(-2, -6, 5.5, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = "#ff2a2a";
    ctx.beginPath();
    ctx.arc(-4, -2, 1.1, 0, Math.PI * 2);
    ctx.arc(0, -2, 1.1, 0, Math.PI * 2);
    ctx.fill();
    if (e.flash > 0) {
      ctx.fillStyle = "rgba(255,255,255," + Math.min(0.7, e.flash * 4) + ")";
      fillRound(ctx, -26, -12, 50, 24, 8, ctx.fillStyle);
    }
    ctx.restore();
  }

  function drawDust(ctx, e, time) {
    const a = e.angle + Math.PI;
    for (let i = 0; i < 3; i++) {
      const t = (time * 3.2 + i * 0.33) % 1;
      ctx.fillStyle = "rgba(210, 176, 120, " + (0.4 * (1 - t)) + ")";
      ctx.beginPath();
      ctx.arc(e.x + Math.cos(a) * (12 + t * 16), e.y + Math.sin(a) * (12 + t * 16), 2 + t * 3.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawHp(ctx, e) {
    const def = B.enemies[e.type];
    if (!def.boss && e.hp > e.maxHp - 0.05) return;
    const w = def.boss ? 54 : 28 + def.radius;
    const x = e.x - w / 2;
    const y = e.y - (def.boss ? 42 : def.radius + 18);
    const pct = Math.max(0, e.hp / e.maxHp);
    fillRound(ctx, x - 1, y - 1, w + 2, 8, 4, INK);
    const col = pct > 0.55 ? "#7dff6a" : pct > 0.28 ? "#ffe14a" : "#ff5d6c";
    fillRound(ctx, x, y, Math.max(4, w * pct), 6, 3, col);
    if (def.boss) {
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      label(ctx, "GRIMSTACHE", e.x, y - 2, 12, "#ffe56a", INK, 3);
    }
  }

  function drawShot(ctx, s) {
    const ang = Math.atan2(s.y - s.py, s.x - s.px);
    const gat = s.kind === "gatling";
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(ang);
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.ellipse(-2, 0, gat ? 8 : 10, gat ? 3.1 : 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = gat ? "#d6ff6a" : "#ffe56a";
    ctx.beginPath();
    ctx.ellipse(-2, 0, gat ? 5.5 : 7, gat ? 1.7 : 2.3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.ellipse(-4, -0.5, 2, 0.7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawEffect(ctx, fx) {
    const k = fx.t / fx.life;
    if (fx.kind === "poof") {
      ctx.save();
      ctx.strokeStyle = "rgba(255,255,255," + (1 - k) * 0.9 + ")";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(fx.x, fx.y, 6 + k * 34, 0, Math.PI * 2);
      ctx.stroke();
      (fx.smoke || []).forEach((s) => {
        const d = s.sp * (0.2 + k);
        const x = fx.x + Math.cos(s.a) * d;
        const y = fx.y + Math.sin(s.a) * d * 0.75 - k * 8;
        const rad = s.r * (0.6 + k);
        ctx.fillStyle = INK;
        ctx.beginPath();
        ctx.arc(x, y, rad + 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "rgba(" + (s.g | 0) + "," + (s.g | 0) + "," + (s.g | 0) + "," + (1 - k) * 0.9 + ")";
        ctx.beginPath();
        ctx.arc(x, y, rad, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "rgba(255,255,255," + (1 - k) * 0.55 + ")";
        ctx.beginPath();
        ctx.arc(x - rad * 0.25, y - rad * 0.25, rad * 0.38, 0, Math.PI * 2);
        ctx.fill();
      });
      (fx.stars || []).forEach((st) => {
        ctx.save();
        ctx.translate(fx.x + Math.cos(st.a) * st.sp * k, fx.y - 6 + Math.sin(st.a) * st.sp * k - k * 14);
        ctx.rotate((st.rot || 0) + k * 4);
        ctx.globalAlpha = 1 - k;
        ctx.fillStyle = INK;
        star(ctx, 0, 0, st.sz + 2, 0);
        ctx.fill();
        ctx.fillStyle = "#ffe56a";
        star(ctx, 0, 0, st.sz, 0);
        ctx.fill();
        ctx.restore();
      });
      ctx.restore();
    } else if (fx.kind === "spark") {
      ctx.save();
      ctx.globalAlpha = 1 - k;
      if (fx.vx) {
        ctx.strokeStyle = fx.color;
        ctx.lineWidth = 2.5;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(fx.x, fx.y);
        ctx.lineTo(fx.x - fx.vx * 0.035, fx.y - fx.vy * 0.035);
        ctx.stroke();
      }
      ctx.fillStyle = INK;
      star(ctx, fx.x, fx.y, fx.r * 2.4, k * 5);
      ctx.fill();
      ctx.fillStyle = fx.color;
      star(ctx, fx.x, fx.y, fx.r * 1.6, k * 5);
      ctx.fill();
      ctx.restore();
    } else if (fx.kind === "tracer") {
      ctx.save();
      ctx.globalAlpha = 1 - k * 0.3;
      ctx.lineCap = "round";
      ctx.strokeStyle = INK;
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.moveTo(fx.x1, fx.y1);
      ctx.lineTo(fx.x2, fx.y2);
      ctx.stroke();
      ctx.strokeStyle = "#ffe56a";
      ctx.lineWidth = 3.5;
      ctx.stroke();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1.4;
      ctx.stroke();
      drawMuzzle(ctx, fx.x2, fx.y2, 0, 0.12 * (1 - k) + 0.04);
      ctx.restore();
    }
  }

  function drawFloater(ctx, f) {
    const k = f.t / f.life;
    const pop = k < 0.18 ? 0.45 + (k / 0.18) * 0.75 : 1 + (1 - (k - 0.18) / 0.82) * 0.08;
    ctx.save();
    ctx.globalAlpha = k > 0.72 ? (1 - k) / 0.28 : 1;
    ctx.translate(f.x, f.y - k * 26);
    ctx.scale(pop, pop);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    label(ctx, f.text, 0, 0, 16, f.color || "#fff6d0", INK, 4);
    ctx.restore();
  }

  function drawSelect(ctx, state, x, y) {
    ctx.save();
    ctx.strokeStyle = "#fff4b0";
    ctx.lineWidth = 3;
    ctx.setLineDash([5, 4]);
    ctx.lineDashOffset = -state.time * 16;
    ctx.beginPath();
    ctx.ellipse(x, y + 2, 14, 5.5, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  function drawButterfly(ctx, x, y, t, color) {
    const flap = 0.4 + Math.abs(Math.sin(t * 7)) * 0.85;
    ctx.save();
    ctx.translate(x + Math.sin(t * 0.8) * 8, y + Math.sin(t * 1.3) * 5);
    ctx.fillStyle = color;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.ellipse(-4 * flap, -1, 4.2 * flap, 3.1, -0.5, 0, Math.PI * 2);
    ctx.ellipse(4 * flap, -1, 4.2 * flap, 3.1, 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = INK;
    ctx.fillRect(-0.7, -3, 1.5, 6);
    ctx.restore();
  }

  function armorWord(bite) {
    if (bite >= 0.99) return "armor-piercing";
    if (bite > 0.05) return "bites armor";
    return "light rounds";
  }

  function composition(wave) {
    const counts = {};
    wave.groups.forEach((g) => { counts[g.type] = (counts[g.type] || 0) + g.count; });
    return ["grunt", "scout", "heavy", "jeep", "tank"].filter((t) => counts[t]).map((t) => ({ type: t, count: counts[t] }));
  }

  function metrics(L) {
    const p = L.panel;
    const inner = { x: p.x + 12, y: p.y + 12, w: p.w - 24, h: p.h - 20 };
    const infoH = L.portrait
      ? Math.max(58, Math.min(74, inner.h * 0.26))
      : Math.max(78, Math.min(96, inner.h * 0.3));
    const startH = Math.max(50, Math.min(62, inner.h * 0.22));
    const gap = 8;
    const speedW = 76;
    if (L.portrait) {
      const cardsY = inner.y + infoH + gap + startH + gap;
      const cardsH = Math.max(48, inner.y + inner.h - cardsY);
      return {
        info: { x: inner.x, y: inner.y, w: inner.w, h: infoH },
        start: { x: inner.x, y: inner.y + infoH + gap, w: inner.w - speedW - 8, h: startH },
        speed: { x: inner.x + inner.w - speedW, y: inner.y + infoH + gap, w: speedW, h: startH },
        cards: { x: inner.x, y: cardsY, w: inner.w, h: cardsH },
      };
    }
    const startY = inner.y + inner.h - startH;
    const cardsY = inner.y + infoH + gap;
    return {
      info: { x: inner.x, y: inner.y, w: inner.w, h: infoH },
      cards: { x: inner.x, y: cardsY, w: inner.w, h: Math.max(48, startY - gap - cardsY) },
      start: { x: inner.x, y: startY, w: inner.w - speedW - 8, h: startH },
      speed: { x: inner.x + inner.w - speedW, y: startY, w: speedW, h: startH },
    };
  }

  function drawHeader(ctx, state, L) {
    const h = L.headerH;
    const bar = ctx.createLinearGradient(0, 0, 0, h);
    bar.addColorStop(0, "#3ecf4e");
    bar.addColorStop(1, "#127a32");
    ctx.fillStyle = bar;
    ctx.fillRect(0, 0, L.vw, h);
    ctx.fillStyle = "#08381a";
    ctx.fillRect(0, h - 4, L.vw, 4);
    ctx.fillStyle = "#ffe56a";
    ctx.fillRect(0, h - 7, L.vw, 3);

    const pillH = Math.min(36, h - 14);
    const py = (h - 4 - pillH) / 2;
    function pill(x, w) {
      fillRound(ctx, x, py, w, pillH, pillH / 2, "#0e4a22");
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = INK;
      strokeRound(ctx, x, py, w, pillH, pillH / 2);
    }
    const squeeze = state.hurt > 0 ? 1 + Math.sin(state.time * 28) * 0.06 : 1;
    pill(8, 92);
    ctx.save();
    ctx.translate(26, py + pillH / 2);
    ctx.scale(squeeze, 2 - squeeze);
    drawHeart(ctx, 0, 0, 1.7);
    ctx.restore();
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    label(ctx, String(state.lives), 42, py + pillH / 2 + 1, 18, "#ffffff", INK, 3);

    pill(108, 112);
    drawCoin(ctx, 126, py + pillH / 2, 8);
    ctx.textAlign = "left";
    label(ctx, String(state.cash), 140, py + pillH / 2 + 1, 18, "#ffffff", INK, 3);

    const snd = 44;
    const sndX = L.vw - 8 - snd;
    const roundW = 84;
    const roundX = sndX - 8 - roundW;
    pill(roundX, roundW);
    const n = B.waves.length;
    let num = "1/" + n;
    if (state.waveActive) num = state.started + "/" + n;
    else if (state.rewarded >= n && state.started > 0) num = "WIN";
    else if (state.started > 0) num = (state.started + 1) + "/" + n;
    ctx.textAlign = "center";
    label(ctx, "ROUND", roundX + roundW / 2, py + 11, 9, "#d8ffc4", null, 0);
    label(ctx, num, roundX + roundW / 2, py + pillH / 2 + 6, 16, "#ffffff", INK, 3);

    if (!L.portrait && roundX - 230 > 120) {
      ctx.textAlign = "center";
      label(ctx, "MAPLE GROVE", (230 + roundX) / 2, py + pillH / 2 + 1, 16, "#fff6d0", INK, 3);
    }

    uiButton(ctx, state, {
      id: "mute",
      x: sndX,
      y: py - 1,
      w: snd,
      h: pillH + 2,
      fillTop: "#fff8e4",
      fillBot: "#f0ddb0",
      lip: "#8a6840",
      icon: (c, x, y, w, hh) => drawSpeaker(c, x, y, w, hh, root.BOTGAudio.muted),
      action: () => root.BOTGAudio.toggle(),
    });
  }

  function nextWaveIndex(state) {
    if (state.started >= B.waves.length && !state.waveActive) return -1;
    if (state.waveActive) return Math.min(B.waves.length - 1, state.started - 1);
    return state.started;
  }

  function drawInfo(ctx, state, rect, tower) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(rect.x, rect.y, rect.w, rect.h);
    ctx.clip();
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    if (tower) {
      const stats = B.statsFor(tower.type, tower.rank);
      drawPortrait(ctx, tower.type, rect.x, rect.y, 46, rect.h - 2);
      const def = B.towers[tower.type];
      const kit = tower.rank === 0 ? def.name : def.upgrades[tower.rank - 1].name;
      label(ctx, kit, rect.x + 54, rect.y + 14, 15, INK, null, 0);
      font(ctx, 12);
      ctx.fillStyle = "#5c4630";
      const line = "Dmg " + stats.damage + "  ·  Reach " + stats.range + "  ·  " + stats.rate.toFixed(1) + "/s";
      drawWrapped(ctx, line + "  ·  " + armorWord(stats.armorBite), rect.x + 54, rect.y + 34, rect.w - 96, 14, 2);
      uiButton(ctx, state, {
        id: "close",
        x: rect.x + rect.w - 34,
        y: rect.y,
        w: 32,
        h: 28,
        label: "X",
        labelSize: 14,
        fillTop: "#fff4d4",
        fillBot: "#f0ddb0",
        lip: "#8a6840",
        ink: INK,
        stroke: false,
        action: () => {
          state.selectedId = null;
          root.BOTGAudio.play("ui");
        },
      });
    } else {
      const idx = nextWaveIndex(state);
      const wave = idx >= 0 ? B.waves[idx] : null;
      let heading = "Grove is quiet";
      if (wave) {
        heading = state.placedCount === 0
          ? "First, pick a soldier"
          : state.started === 0
            ? "Ready when you are"
            : state.waveActive
              ? "Now: " + wave.name
              : "Next: " + wave.name;
      }
      label(ctx, heading, rect.x, rect.y + 12, 15, INK, null, 0);
      if (wave) {
        let cx = rect.x;
        composition(wave).forEach((c) => {
          drawPortrait(ctx, c.type, cx, rect.y + 18, 30, 32);
          ctx.textAlign = "left";
          ctx.textBaseline = "middle";
          label(ctx, String(c.count), cx + 34, rect.y + 34, 14, INK, false, 0);
          cx += 52 + String(c.count).length * 8;
        });
      }
      font(ctx, 12);
      ctx.fillStyle = "#5c4630";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      const hint = !wave
        ? "Maple Grove holds."
        : state.placedCount === 0
          ? "Tap Trooper, then the glowing grass."
          : state.started === 0
            ? "Tap Start Round. Arrows show the march."
            : wave.hint;
      font(ctx, 12);
      drawWrapped(ctx, hint, rect.x, rect.y + Math.max(50, rect.h - 30), rect.w, 13, 2);
    }
    ctx.restore();
  }

  function drawStartButtons(ctx, state, m) {
    const canSend = state.started < B.waves.length;
    const early = state.waveActive && canSend;
    let startLabel = "HOLDING";
    let startSub = "Lane is live";
    let disabled = true;
    let top = "#d9d3c8";
    let bot = "#c9c2b6";
    let lip = "#8d867c";
    if (!state.waveActive && canSend) {
      startLabel = "START ROUND";
      startSub = "Round " + (state.started + 1) + "   +$" + B.waves[state.started].reward;
      disabled = false;
      top = "#b6f56a";
      bot = "#2fbe3c";
      lip = "#0e6a22";
    } else if (early) {
      startLabel = "SEND NEXT";
      startSub = "+$" + B.meta.earlyWaveBonus + " hurry bonus";
      disabled = false;
      top = "#ffe08a";
      bot = "#ff9a1f";
      lip = "#a85a08";
    }
    uiButton(ctx, state, {
      id: "start",
      x: m.start.x,
      y: m.start.y,
      w: m.start.w,
      h: m.start.h,
      label: startLabel,
      sub: startSub,
      fillTop: top,
      fillBot: bot,
      lip: lip,
      disabled: disabled,
      pulse: state.placedCount > 0 && state.started === 0,
      action: () => root.BOTG.launch(),
    });
    const spd = B.meta.speeds[state.speedIndex];
    const fast = spd !== 1;
    uiButton(ctx, state, {
      id: "speed",
      x: m.speed.x,
      y: m.speed.y,
      w: m.speed.w,
      h: m.speed.h,
      label: spd + "×",
      sub: fast ? "Normal" : "Fast",
      labelSize: 20,
      fillTop: fast ? "#c8f8a4" : "#fff3b0",
      fillBot: fast ? "#46c85a" : "#ffc83a",
      lip: fast ? "#0e6a22" : "#a86a08",
      ink: INK,
      stroke: false,
      action: () => root.BOTG.toggleSpeed(),
    });
  }

  function drawCards(ctx, state, area) {
    const keys = ["trooper", "longshot", "gatling"];
    const gap = 8;
    const w = (area.w - gap * 2) / 3;
    keys.forEach((key, i) => {
      const def = B.towers[key];
      const name = key === "gatling" ? "Gatling" : def.name;
      uiButton(ctx, state, {
        id: "buy-" + key,
        x: area.x + i * (w + gap),
        y: area.y,
        w: w,
        h: area.h,
        label: name,
        cost: def.cost,
        affordable: state.cash >= def.cost,
        portraitKey: key,
        fillTop: state.placing === key ? "#fff3a0" : "#fff8e4",
        fillBot: state.placing === key ? "#ffe08a" : "#f3e2bc",
        lip: "#a07840",
        active: state.placing === key,
        action: () => root.BOTG.pick(key),
      });
    });
  }

  function drawUpgrade(ctx, state, tower, area) {
    const def = B.towers[tower.type];
    const maxed = tower.rank >= def.upgrades.length;
    const up = maxed ? null : def.upgrades[tower.rank];
    const broke = up && state.cash < up.cost;
    const aimNames = { first: "First", last: "Last", tough: "Toughest", near: "Nearest" };
    const gap = 8;
    if (area.h >= 130) {
      const uh = Math.min(86, area.h - 52 - gap);
      uiButton(ctx, state, {
        id: "upgrade",
        x: area.x,
        y: area.y,
        w: area.w,
        h: uh,
        label: maxed ? "Fully kitted" : up.name,
        sub: maxed ? "Nothing left to buy" : "$" + up.cost,
        fillTop: maxed ? "#efe6d2" : broke ? "#ffe4dc" : "#c8f8b0",
        fillBot: maxed ? "#e4d8c0" : broke ? "#f3b8b0" : "#5ad86a",
        lip: maxed ? "#8a6840" : broke ? "#a04030" : "#0e6a22",
        ink: INK,
        stroke: false,
        action: () => root.BOTG.upgrade(),
      });
      const bw = (area.w - gap) / 2;
      const by = area.y + uh + gap;
      uiButton(ctx, state, {
        id: "aim",
        x: area.x,
        y: by,
        w: bw,
        h: 52,
        label: "Aim: " + (aimNames[tower.priority] || "First"),
        labelSize: 14,
        fillTop: "#fff8e4",
        fillBot: "#f0ddb0",
        lip: "#8a6840",
        ink: INK,
        stroke: false,
        action: () => root.BOTG.cycleAim(),
      });
      uiButton(ctx, state, {
        id: "sell",
        x: area.x + bw + gap,
        y: by,
        w: bw,
        h: 52,
        label: "Sell +$" + root.BOTG.refund(tower),
        labelSize: 14,
        fillTop: "#ffd0c8",
        fillBot: "#f09890",
        lip: "#a04030",
        ink: INK,
        stroke: false,
        action: () => root.BOTG.sell(),
      });
      return;
    }
    const side = Math.min(118, area.w * 0.38);
    uiButton(ctx, state, {
      id: "upgrade",
      x: area.x,
      y: area.y,
      w: area.w - side - gap,
      h: area.h,
      label: maxed ? "Fully kitted" : up.name,
      sub: maxed ? "Maxed" : "$" + up.cost,
      fillTop: maxed ? "#efe6d2" : broke ? "#ffe4dc" : "#c8f8b0",
      fillBot: maxed ? "#e4d8c0" : broke ? "#f3b8b0" : "#5ad86a",
      lip: "#0e6a22",
      ink: INK,
      stroke: false,
      action: () => root.BOTG.upgrade(),
    });
    const bh = (area.h - gap) / 2;
    uiButton(ctx, state, {
      id: "aim",
      x: area.x + area.w - side,
      y: area.y,
      w: side,
      h: bh,
      label: aimNames[tower.priority] || "First",
      labelSize: 13,
      fillTop: "#fff8e4",
      fillBot: "#f0ddb0",
      lip: "#8a6840",
      ink: INK,
      stroke: false,
      action: () => root.BOTG.cycleAim(),
    });
    uiButton(ctx, state, {
      id: "sell",
      x: area.x + area.w - side,
      y: area.y + bh + gap,
      w: side,
      h: bh,
      label: "+$" + root.BOTG.refund(tower),
      labelSize: 13,
      fillTop: "#ffd0c8",
      fillBot: "#f09890",
      lip: "#a04030",
      ink: INK,
      stroke: false,
      action: () => root.BOTG.sell(),
    });
  }

  function drawPanel(ctx, state, L) {
    const p = L.panel;
    const rad = L.portrait
      ? { tl: 22, tr: 22, br: 0, bl: 0 }
      : { tl: 22, tr: 0, br: 0, bl: 22 };
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.25)";
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = -2;
    fillRound(ctx, p.x, p.y, p.w, p.h, rad, "#0c4a22");
    ctx.restore();
    ctx.lineWidth = 4;
    ctx.strokeStyle = INK;
    strokeRound(ctx, p.x, p.y, p.w, p.h, rad);
    const inset = 6;
    const ir = L.portrait
      ? { tl: 16, tr: 16, br: 0, bl: 0 }
      : { tl: 16, tr: 0, br: 0, bl: 16 };
    fillRound(ctx, p.x + inset, p.y + inset, p.w - inset * 2, p.h - inset, ir, "#fff6df");
    const m = metrics(L);
    const selected = state.towers.find((t) => t.id === state.selectedId) || null;
    const show = selected && !state.placing;
    drawInfo(ctx, state, m.info, show ? selected : null);
    drawStartButtons(ctx, state, m);
    if (show) drawUpgrade(ctx, state, selected, m.cards);
    else drawCards(ctx, state, m.cards);
  }

  function drawBanner(ctx, state, L) {
    const b = state.banner;
    if (!b) return;
    const k = b.t / b.life;
    let alpha = 1;
    if (k < 0.12) alpha = k / 0.12;
    else if (k > 0.78) alpha = Math.max(0, (1 - k) / 0.22);
    const bw = Math.min(360, L.mapBox.w - 12);
    const bh = 78;
    const x = L.mapBox.x + (L.mapBox.w - bw) / 2;
    const y = L.mapBox.y + 8;
    const boss = b.kind === "boss";
    ctx.save();
    ctx.globalAlpha = alpha;
    fillRound(ctx, x, y + 4, bw, bh, 16, "rgba(0,0,0,0.25)");
    fillRound(ctx, x, y, bw, bh, 16, boss ? "#3a1860" : "#fff8e6");
    ctx.lineWidth = 3;
    ctx.strokeStyle = INK;
    strokeRound(ctx, x, y, bw, bh, 16);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    label(ctx, b.kicker, x + bw / 2, y + 14, 11, boss ? "#ffb4c4" : "#8a5a32", null, 0);
    label(ctx, b.title, x + bw / 2, y + 32, 16, boss ? "#ffe56a" : INK, boss ? INK : null, 3);
    font(ctx, 12);
    ctx.fillStyle = boss ? "#fff6f2" : "#5c4630";
    ctx.textAlign = "center";
    drawWrapped(ctx, b.sub, x + bw / 2, y + 50, bw - 28, 14, 2);
    ctx.restore();
    state.hotspots.push({ id: "banner", x: x, y: y, w: bw, h: bh, disabled: true });
  }

  function drawToast(ctx, state, L) {
    if (!state.toast) return;
    const k = state.toast.t / state.toast.life;
    ctx.save();
    ctx.globalAlpha = k > 0.75 ? (1 - k) / 0.25 : 1;
    font(ctx, 14);
    const tw = Math.min(L.vw - 24, ctx.measureText(state.toast.text).width + 28);
    const x = L.mapBox.x + L.mapBox.w / 2 - tw / 2;
    const y = L.portrait ? L.panel.y - 34 : L.mapBox.y + L.mapBox.h - 36;
    fillRound(ctx, x, y, tw, 26, 13, "rgba(20, 12, 8, 0.9)");
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#ffe56a";
    strokeRound(ctx, x, y, tw, 26, 13);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    label(ctx, state.toast.text, x + tw / 2, y + 13, 13, "#fff6e4", null, 0);
    ctx.restore();
  }

  function drawTitle(ctx, state, L) {
    const g = ctx.createLinearGradient(0, 0, 0, L.vh);
    g.addColorStop(0, "#8fd8ff");
    g.addColorStop(0.45, "#d7f4ff");
    g.addColorStop(0.62, GRASS);
    g.addColorStop(1, "#2f9a2a");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, L.vw, L.vh);
    const sun = ctx.createRadialGradient(L.vw * 0.82, 54, 4, L.vw * 0.82, 54, 48);
    sun.addColorStop(0, "#fff4b0");
    sun.addColorStop(1, "rgba(255,220,80,0)");
    ctx.fillStyle = sun;
    ctx.beginPath();
    ctx.arc(L.vw * 0.82, 54, 48, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffe56a";
    ctx.beginPath();
    ctx.arc(L.vw * 0.82, 54, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 3;
    ctx.stroke();

    if (L.portrait) {
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      label(ctx, "BOOTS ON", L.vw / 2, 86, 40, "#ffe56a", "#145214", 8);
      label(ctx, "THE GROUND", L.vw / 2, 132, 36, "#ffe56a", "#145214", 8);
      label(ctx, "Maple Grove", L.vw / 2, 168, 16, "#ffffff", INK, 3);
      const feet = Math.min(L.vh * 0.46, 420);
      drawSoldier(ctx, L.vw * 0.28, feet, { team: "player", role: "trooper", aim: 0.35, phase: state.time * 2, scale: 1.7 });
      drawSoldier(ctx, L.vw * 0.74, feet, { team: "enemy", role: "grunt", aim: Math.PI - 0.35, phase: state.time * 2 + 1, scale: 1.65 });
      const cardY = feet + 24;
      fillRound(ctx, 16, cardY, L.vw - 32, 150, 18, "#fff6df");
      ctx.lineWidth = 4;
      ctx.strokeStyle = INK;
      strokeRound(ctx, 16, cardY, L.vw - 32, 150, 18);
      ctx.textAlign = "center";
      label(ctx, "Hold the lane.", L.vw / 2, cardY + 28, 18, INK, null, 0);
      font(ctx, 13);
      ctx.fillStyle = "#5c4630";
      ["Plant on the grass, never on the dirt.", "Longshots crack armor. Gatlings own a corner.", "Tap a soldier to buy a kit."].forEach((t, i) => {
        ctx.fillText(t, L.vw / 2, cardY + 54 + i * 18);
      });
      uiButton(ctx, state, {
        id: "play",
        x: L.vw / 2 - 120,
        y: cardY + 168,
        w: 240,
        h: 58,
        label: "PLAY",
        labelSize: 26,
        fillTop: "#b6f56a",
        fillBot: "#2fbe3c",
        lip: "#0e6a22",
        pulse: true,
        action: () => root.BOTG.startGame(),
      });
      uiButton(ctx, state, {
        id: "title-mute",
        x: L.vw / 2 - 70,
        y: cardY + 238,
        w: 140,
        h: 36,
        label: root.BOTGAudio.muted ? "Sound off" : "Sound on",
        labelSize: 14,
        fillTop: "#fff8e4",
        fillBot: "#f0ddb0",
        lip: "#8a6840",
        ink: INK,
        stroke: false,
        action: () => root.BOTGAudio.toggle(),
      });
    } else {
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      label(ctx, "BOOTS ON", 28, 78, 36, "#ffe56a", "#145214", 7);
      label(ctx, "THE GROUND", 28, 118, 32, "#ffe56a", "#145214", 7);
      label(ctx, "Maple Grove", 28, 156, 16, "#ffffff", INK, 3);
      drawSoldier(ctx, L.vw * 0.42, L.vh * 0.62, { team: "player", role: "gatling", aim: 0.45, phase: state.time * 2, scale: 1.35 });
      drawSoldier(ctx, L.vw * 0.58, L.vh * 0.66, { team: "enemy", role: "heavy", aim: Math.PI, phase: state.time * 2, scale: 1.3 });
      uiButton(ctx, state, {
        id: "play",
        x: L.vw - 250,
        y: L.vh * 0.38,
        w: 210,
        h: 64,
        label: "PLAY",
        labelSize: 26,
        fillTop: "#b6f56a",
        fillBot: "#2fbe3c",
        lip: "#0e6a22",
        pulse: true,
        action: () => root.BOTG.startGame(),
      });
      font(ctx, 14);
      ctx.fillStyle = INK;
      ctx.textAlign = "left";
      ["Plant on the grass.", "Longshots crack armor.", "Gatlings own a corner."].forEach((t, i) => {
        ctx.fillText(t, L.vw - 250, L.vh * 0.38 + 88 + i * 22);
      });
      uiButton(ctx, state, {
        id: "title-mute",
        x: 28,
        y: L.vh - 56,
        w: 130,
        h: 36,
        label: root.BOTGAudio.muted ? "Sound off" : "Sound on",
        labelSize: 14,
        fillTop: "#fff8e4",
        fillBot: "#f0ddb0",
        lip: "#8a6840",
        ink: INK,
        stroke: false,
        action: () => root.BOTGAudio.toggle(),
      });
    }
  }

  function drawEnd(ctx, state, L) {
    ctx.fillStyle = "rgba(8, 20, 12, 0.5)";
    ctx.fillRect(0, 0, L.vw, L.vh);
    const win = state.screen === "win";
    const w = Math.min(360, L.vw - 28);
    const h = Math.min(380, L.vh - 28);
    const x = (L.vw - w) / 2;
    const y = (L.vh - h) / 2;
    fillRound(ctx, x, y + 6, w, h, 20, "rgba(0,0,0,0.25)");
    fillRound(ctx, x, y, w, h, 20, "#fff6df");
    ctx.lineWidth = 4;
    ctx.strokeStyle = INK;
    strokeRound(ctx, x, y, w, h, 20);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    if (win) {
      for (let i = 0; i < 5; i++) {
        ctx.fillStyle = "#ffe56a";
        ctx.strokeStyle = INK;
        ctx.lineWidth = 2;
        star(ctx, x + 40 + i * ((w - 80) / 4), y + 36, 10, state.time + i);
        ctx.fill();
        ctx.stroke();
      }
    }
    label(ctx, win ? "Grove holds!" : "They slipped by", x + w / 2, y + 78, 26, win ? "#1f8a32" : "#a02840", null, 0);
    font(ctx, 14);
    ctx.fillStyle = "#5c4630";
    const body = win
      ? "General Grimstache's tank went up in stars and smoke. Maple Grove is still smiling."
      : "The Scowl Corps reached the gate on wave " + Math.max(1, state.started) + ". Plant tighter on the bends and bring a Longshot for armor.";
    drawWrapped(ctx, body, x + w / 2, y + 112, w - 48, 18, 4);
    uiButton(ctx, state, {
      id: "retry",
      x: x + (w - 220) / 2,
      y: y + h - 130,
      w: 220,
      h: 54,
      label: win ? "Defend again" : "Try again",
      fillTop: "#b6f56a",
      fillBot: "#2fbe3c",
      lip: "#0e6a22",
      action: () => root.BOTG.startGame(),
    });
    uiButton(ctx, state, {
      id: "titlescreen",
      x: x + (w - 160) / 2,
      y: y + h - 64,
      w: 160,
      h: 40,
      label: "Title",
      labelSize: 16,
      fillTop: "#fff8e4",
      fillBot: "#f0ddb0",
      lip: "#8a6840",
      ink: INK,
      stroke: false,
      action: () => root.BOTG.title(),
    });
  }

  function drawMargin(ctx, L) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(L.mapBox.x, L.mapBox.y, L.mapBox.w, L.mapBox.h);
    ctx.clip();
    ctx.fillStyle = GRASS;
    ctx.fillRect(L.mapBox.x, L.mapBox.y, L.mapBox.w, L.mapBox.h);
    const scale = L.scale || 1;
    const left = L.ox - L.mapBox.x;
    const right = L.mapBox.x + L.mapBox.w - (L.ox + L.worldW * scale);
    const spots = [];
    if (left > 36) {
      spots.push([L.mapBox.x + left * 0.48, L.mapBox.y + L.mapBox.h * 0.22, "bush"]);
      spots.push([L.mapBox.x + left * 0.4, L.mapBox.y + L.mapBox.h * 0.55, "rock"]);
      spots.push([L.mapBox.x + left * 0.55, L.mapBox.y + L.mapBox.h * 0.8, "bush"]);
    }
    if (right > 36) {
      spots.push([L.ox + L.worldW * scale + right * 0.45, L.mapBox.y + L.mapBox.h * 0.28, "rock"]);
      spots.push([L.ox + L.worldW * scale + right * 0.5, L.mapBox.y + L.mapBox.h * 0.62, "bush"]);
      spots.push([L.ox + L.worldW * scale + right * 0.4, L.mapBox.y + L.mapBox.h * 0.84, "bush"]);
    }
    spots.forEach((s) => {
      if (s[2] === "bush") drawBush(ctx, s[0], s[1], 1.15);
      else drawRock(ctx, s[0], s[1], 13);
    });
    const colors = ["#ff8ab4", "#ffe56a", "#ffffff", "#ff9a3c", "#8ad4ff"];
    function scatter(x0, x1, y0, y1, n) {
      if (x1 - x0 < 24) return;
      for (let i = 0; i < n; i++) {
        const x = x0 + ((i * 47) % Math.max(1, x1 - x0));
        const y = y0 + ((i * 83) % Math.max(1, y1 - y0));
        if (i % 4 === 0) drawBush(ctx, x, y, 0.72);
        else if (i % 4 === 1) drawRock(ctx, x, y, 8);
        else drawFlower(ctx, x, y, 4.2, colors[i % colors.length]);
      }
    }
    const worldRight = L.ox + L.worldW * scale;
    scatter(L.mapBox.x + 8, L.ox - 8, L.mapBox.y + 16, L.mapBox.y + L.mapBox.h - 16, left > 48 ? 10 : 0);
    scatter(worldRight + 8, L.mapBox.x + L.mapBox.w - 8, L.mapBox.y + 16, L.mapBox.y + L.mapBox.h - 16, right > 48 ? 10 : 0);
    ctx.restore();
  }

  function drawBuild(ctx, state, L) {
    const text = String(root.BOTG_BUILD || "");
    if (!text) return;
    ctx.save();
    font(ctx, 11);
    const tw = ctx.measureText(text).width + 14;
    let x;
    let y;
    if (state.screen === "title") {
      x = 8;
      y = L.vh - 22;
    } else {
      x = L.mapBox.x + L.mapBox.w - tw - 8;
      y = L.mapBox.y + L.mapBox.h - 22;
    }
    fillRound(ctx, x, y, tw, 16, 8, "rgba(8, 28, 12, 0.55)");
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#f3ffe8";
    ctx.fillText(text, x + 7, y + 8);
    ctx.restore();
  }

  function drawWorld(ctx, state) {
    ensureTerrain();
    ctx.drawImage(terrain, 0, 0, 400, 570);
    if (!state.reducedMotion) {
      drawButterfly(ctx, 48, 188, state.time, "#ff8ab4");
      drawButterfly(ctx, 250, 430, state.time + 2, "#ffe56a");
    }
    drawChevrons(ctx, state);

    if (state.ghost) {
      const stats = B.statsFor(state.ghost.type, 0);
      drawRange(ctx, state.ghost.x, state.ghost.y, stats.range, state.ghost.valid);
    } else if (state.screen === "play") {
      const selected = state.towers.find((t) => t.id === state.selectedId);
      if (selected && !state.placing) {
        drawRange(ctx, selected.x, selected.y, B.statsFor(selected.type, selected.rank).range, true);
      } else if (state.hoverTowerId && !state.placing) {
        const hov = state.towers.find((t) => t.id === state.hoverTowerId);
        if (hov) drawRange(ctx, hov.x, hov.y, B.statsFor(hov.type, hov.rank).range, true);
      }
    }

    const items = [];
    PROPS.forEach((p) => {
      items.push({
        y: p.y,
        draw: () => {
          if (p.kind === "fence") drawFence(ctx, p.x, p.y, p.w);
          else if (p.kind === "bush") drawBush(ctx, p.x, p.y, 1);
          else if (p.kind === "rock") drawRock(ctx, p.x, p.y, 11);
          else if (p.kind === "bags") drawBags(ctx, p.x, p.y);
          else if (p.kind === "crate") drawCrate(ctx, p.x, p.y);
        },
      });
    });
    B.map.trees.forEach((tree) => {
      items.push({ y: tree.y, draw: () => drawTree(ctx, tree) });
    });
    state.towers.forEach((tower) => {
      items.push({
        y: tower.y,
        draw: () => {
          const hot = state.selectedId === tower.id || state.hoverTowerId === tower.id;
          if (hot) drawSelect(ctx, state, tower.x, tower.y);
          drawSoldier(ctx, tower.x, tower.y, {
            team: "player",
            role: tower.type,
            aim: tower.aim,
            phase: tower.phase + tower.id,
            scale: 1,
            flash: tower.flash,
            spin: tower.spin,
            rank: tower.rank,
          });
        },
      });
    });
    state.enemies.forEach((e) => {
      if (e.dead) return;
      items.push({
        y: e.y,
        draw: () => {
          if (e.type === "scout" || e.type === "jeep") drawDust(ctx, e, state.time);
          if (e.type === "jeep") drawJeep(ctx, e);
          else if (e.type === "tank") drawTank(ctx, e, state.time);
          else {
            drawSoldier(ctx, e.x, e.y, {
              team: "enemy",
              role: e.type,
              aim: e.angle,
              phase: e.phase,
              scale: B.enemies[e.type].scale,
              flash: e.flash,
            });
          }
        },
      });
    });
    items.sort((a, b) => a.y - b.y);
    items.forEach((item) => item.draw());

    if (state.ghost) {
      const ring = state.ghost.valid ? "#b6f56a" : "#ff6a6a";
      ctx.strokeStyle = ring;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(state.ghost.x, state.ghost.y + 2, 14, 5.5, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.save();
      ctx.globalAlpha = 0.8;
      drawSoldier(ctx, state.ghost.x, state.ghost.y, {
        team: "player",
        role: state.ghost.type,
        aim: B.nearestAngle(state.ghost.x, state.ghost.y),
        phase: state.time * 2,
        scale: 1,
      });
      ctx.restore();
      if (state.placedCount === 0) {
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";
        label(ctx, "PLANT HERE", state.ghost.x, state.ghost.y - 48, 13, "#fff6c0", INK, 3);
      }
      if (!state.ghost.valid && state.ghost.reason && !(state.toast && state.toast.text === state.ghost.reason)) {
        font(ctx, 12);
        const tw = ctx.measureText(state.ghost.reason).width + 16;
        fillRound(ctx, state.ghost.x - tw / 2, state.ghost.y + 16, tw, 20, 8, "rgba(40,12,12,0.88)");
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        label(ctx, state.ghost.reason, state.ghost.x, state.ghost.y + 26, 12, "#ffe0e0", null, 0);
      }
    }

    state.shots.forEach((s) => drawShot(ctx, s));
    state.effects.forEach((fx) => drawEffect(ctx, fx));
    state.enemies.forEach((e) => { if (!e.dead) drawHp(ctx, e); });
    state.floaters.forEach((f) => drawFloater(ctx, f));

    if (state.screen === "play" && state.placedCount === 0 && !state.ghost) {
      const h = B.map.hint;
      const pulse = 0.5 + Math.sin(state.time * 4) * 0.5;
      ctx.save();
      ctx.strokeStyle = "rgba(255, 214, 70, " + (0.45 + pulse * 0.55) + ")";
      ctx.lineWidth = 3;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.arc(h.x, h.y, 18 + pulse * 4, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      ctx.textAlign = "center";
      label(ctx, "PLANT HERE", h.x, h.y - 28, 13, "#fff6c0", INK, 3);
    }
  }

  function draw(ctx, state) {
    const L = state.layout;
    if (!L) return;
    state.hotspots = [];
    const mag = state.reducedMotion ? 0 : Math.min(6, state.shake || 0);
    const jx = mag ? (Math.random() - 0.5) * mag * (state.cssScaleX || 1) : 0;
    const jy = mag ? (Math.random() - 0.5) * mag * (state.cssScaleY || 1) : 0;
    ctx.setTransform(state.cssScaleX || 1, 0, 0, state.cssScaleY || 1, jx, jy);
    ctx.imageSmoothingEnabled = true;
    try { ctx.imageSmoothingQuality = "high"; } catch (err) { /* ignore */ }
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.fillStyle = GRASS;
    ctx.fillRect(-30, -30, L.vw + 60, L.vh + 60);

    if (state.screen === "title") {
      drawTitle(ctx, state, L);
      drawBuild(ctx, state, L);
    } else {
      drawMargin(ctx, L);
      ctx.save();
      ctx.beginPath();
      ctx.rect(L.mapBox.x, L.mapBox.y, L.mapBox.w, L.mapBox.h);
      ctx.clip();
      ctx.translate(L.ox, L.oy);
      ctx.scale(L.scale, L.scale);
      ctx.translate(0, -L.worldTop);
      drawWorld(ctx, state);
      ctx.restore();

      if (state.screen === "play") {
        if (state.hurt > 0) {
          ctx.save();
          ctx.beginPath();
          ctx.rect(L.mapBox.x, L.mapBox.y, L.mapBox.w, L.mapBox.h);
          ctx.clip();
          const g = ctx.createRadialGradient(L.mapBox.x + L.mapBox.w / 2, L.mapBox.y + L.mapBox.h / 2, 40, L.mapBox.x + L.mapBox.w / 2, L.mapBox.y + L.mapBox.h / 2, L.mapBox.w);
          g.addColorStop(0, "rgba(180,20,40,0)");
          g.addColorStop(1, "rgba(160, 20, 40, " + state.hurt * 0.4 + ")");
          ctx.fillStyle = g;
          ctx.fillRect(L.mapBox.x, L.mapBox.y, L.mapBox.w, L.mapBox.h);
          ctx.restore();
        }
        drawHeader(ctx, state, L);
        drawPanel(ctx, state, L);
        drawBanner(ctx, state, L);
        drawToast(ctx, state, L);
      } else {
        drawEnd(ctx, state, L);
      }
      drawBuild(ctx, state, L);
    }

    if (state.error) {
      ctx.fillStyle = "#4a1020";
      ctx.fillRect(0, L.vh - 24, L.vw, 24);
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      label(ctx, String(state.error).slice(0, 90), 8, L.vh - 12, 12, "#ffffff", null, 0);
    }
  }

  root.BOTGRender = { draw: draw };
})(typeof window !== "undefined" ? window : globalThis);
