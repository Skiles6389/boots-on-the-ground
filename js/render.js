// Cartoon battlefield renderer for Boots on the Ground.
// Bright flat colors and thick outlines. Soldiers are drawn in soldiers.js.
(function (root) {
  const B = root.BOTG_BALANCE;
  const FONT = '"Alfa Slab One", "Libre Baskerville", "Palatino Linotype", Palatino, serif';
  const GRASS = "#7c865c";
  const INK = "#2a2118";
  const PAPER = "#f3ead4";

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

  const SHOP_BADGE = {
    trooper: "#f3e2a8",
    longshot: "#d7e2ee",
    gatling: "#e4efb0",
    mortar: "#f6d48a",
    tread: "#d5e4b4",
    engineer: "#f3d7b0",
    sky: "#d4ebf6",
    chopper: "#efe0a8",
    tent: "#e7d7b4",
    flame: "#f6c49a",
    gunner: "#d9c48a",
  };

  function drawLock(ctx, x, y, s) {
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = "#6a2424";
    ctx.fillStyle = "#d24a4a";
    ctx.lineWidth = 1.6;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(0, -s * 0.15, s * 0.32, Math.PI * 1.05, Math.PI * 1.95);
    ctx.stroke();
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(-s * 0.42, -s * 0.05, s * 0.84, s * 0.62, 2) : ctx.rect(-s * 0.42, -s * 0.05, s * 0.84, s * 0.62);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  function drawShopTile(ctx, state, spec, x, py, w, h) {
    const affordable = spec.affordable !== false;
    const selected = !!spec.active;
    const motion = !state.reducedMotion;
    const phase = spec.bob || 0;
    const bob = motion && affordable && state.pressedId !== spec.id ? Math.sin(state.time * 2.2 + phase) * 1.2 : 0;
    const tagH = Math.max(16, Math.min(18, Math.round(h * 0.26)));
    const badgeX = x + 3;
    const badgeW = w - 6;
    const badgeH = Math.max(20, h - 6);
    const badgeY = py + 3 + bob;
    const tone = SHOP_BADGE[spec.portraitKey] || "#efe6c8";
    ctx.save();
    roundPath(ctx, badgeX, badgeY, badgeW, badgeH, 7);
    ctx.clip();
    ctx.fillStyle = affordable ? tone : "#e4dfd4";
    ctx.fillRect(badgeX, badgeY, badgeW, badgeH);
    ctx.strokeStyle = affordable ? "rgba(70, 52, 24, 0.16)" : "rgba(80, 76, 68, 0.2)";
    ctx.lineWidth = 1.5;
    for (let sx = badgeX + 5; sx < badgeX + badgeW; sx += 7) {
      ctx.beginPath();
      ctx.moveTo(sx, badgeY);
      ctx.lineTo(sx, badgeY + badgeH);
      ctx.stroke();
    }
    let drew = false;
    if (root.BOTGArt && root.BOTGArt.drawBust) {
      if (!affordable) ctx.globalAlpha = 0.42;
      drew = root.BOTGArt.drawBust(ctx, spec.portraitKey, badgeX - 2, badgeY - 1, badgeW + 4, badgeH + 2);
      ctx.globalAlpha = 1;
    }
    if (!drew) {
      if (root.BOTGSoldier) {
        const sc = Math.min((badgeW * 0.7) / 28, (badgeH * 0.86) / 40);
        root.BOTGSoldier.draw(ctx, badgeX + badgeW * 0.5, badgeY + badgeH - 2, {
          team: "player",
          role: spec.portraitKey,
          aim: 0.2,
          phase: state.time * 2 + (spec.bob || 0),
          scale: sc / 1.22,
        });
      } else {
        drawPortrait(ctx, spec.portraitKey, badgeX, badgeY, badgeW, badgeH);
      }
    }
    if (motion && affordable) {
      const sweep = (state.time * 0.28 + phase) % 1;
      const sx = badgeX + sweep * (badgeW + 24) - 12;
      const g = ctx.createLinearGradient(sx, badgeY, sx + 14, badgeY + badgeH);
      g.addColorStop(0, "rgba(255,255,255,0)");
      g.addColorStop(0.5, "rgba(255,255,255,0.42)");
      g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = g;
      ctx.fillRect(badgeX, badgeY, badgeW, badgeH);
    }
    ctx.restore();
    ctx.lineWidth = selected ? 3.4 : 2.2;
    ctx.strokeStyle = selected ? "#c6a45a" : INK;
    strokeRound(ctx, badgeX, badgeY, badgeW, badgeH, 7);
    if (selected) {
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = "#fff4c8";
      strokeRound(ctx, badgeX + 2, badgeY + 2, badgeW - 4, badgeH - 4, 5);
    }
    const cost = "$" + spec.cost;
    const tagW = Math.min(w - 8, Math.max(36, w * 0.72));
    const tagX = x + (w - tagW) / 2;
    const tagY = py + h - tagH - 2;
    fillRound(ctx, tagX, tagY + 1, tagW, tagH, 3, "#8a7040");
    fillRound(ctx, tagX, tagY, tagW, tagH, 3, affordable ? "#e7c56a" : "#e07068");
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = affordable ? "#5c4018" : "#6a2424";
    strokeRound(ctx, tagX, tagY, tagW, tagH, 3);
    ctx.fillStyle = affordable ? "#f8e7b0" : "#f0b0aa";
    ctx.beginPath();
    ctx.arc(tagX + 5, tagY + tagH / 2, 1.6, 0, Math.PI * 2);
    ctx.arc(tagX + tagW - 5, tagY + tagH / 2, 1.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const ps = fitSize(ctx, cost, tagW - 16, Math.min(15, tagH - 1));
    label(ctx, cost, x + w / 2 + (affordable ? 0 : 5), tagY + tagH / 2, ps, affordable ? "#3a2808" : "#4a1414", null, 0);
    if (!affordable) drawLock(ctx, tagX + 9, tagY + tagH / 2 + 1, Math.min(11, tagH - 2));
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
    const radius = spec.radius || Math.min(14, h / 2);
    const raw = spec.disabled ? "#e4dcc8" : (hot ? "#fff6e4" : (spec.fillTop || PAPER));
    const paper = /b6f56a|2fbe3c|c8f8a4|46c85a|0e6a22/i.test(String(raw)) ? "#e6d3a8" : /ffb|ff8d|ff6/i.test(String(raw)) ? "#c48978" : raw;
    const ticket = Math.min(10, h / 3);
    ctx.save();
    fillRound(ctx, x, py + 2, w, h, ticket, "#c4b496");
    fillRound(ctx, x, py, w, h, ticket, paper);
    ctx.lineWidth = 2.4;
    ctx.strokeStyle = INK;
    strokeRound(ctx, x, py, w, h, ticket);
    ctx.lineWidth = 1;
    ctx.strokeStyle = "#8a7048";
    strokeRound(ctx, x + 3, py + 3, w - 6, h - 6, Math.max(2, ticket - 3));
    if (spec.pulse && !spec.disabled) {
      const a = 0.25 + Math.sin(state.time * 4) * 0.2;
      ctx.lineWidth = 2;
      ctx.strokeStyle = "rgba(90, 50, 20, " + a + ")";
      strokeRound(ctx, x - 2, py - 2, w + 4, h + 4, ticket + 2);
    }
    if (spec.icon) spec.icon(ctx, x, py, w, h);
    else if (spec.shopRow) {
      const ih = Math.min(40, h - 8);
      drawPortrait(ctx, spec.portraitKey, x + 4, py + (h - ih) / 2, ih, ih);
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      const name = spec.label || "";
      const ns = fitSize(ctx, name, w - ih - 62, 14);
      label(ctx, name, x + ih + 12, py + h / 2 - 1, ns, INK, null, 0);
      const cost = "$" + spec.cost;
      const affordable = spec.affordable !== false;
      font(ctx, 12);
      const cw = Math.max(36, ctx.measureText(cost).width + 12);
      const chipH = 16;
      const cx = x + w - cw - 8;
      fillRound(ctx, cx, py + (h - chipH) / 2, cw, chipH, 8, affordable ? "#ffe14a" : "#ff8d86");
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = INK;
      strokeRound(ctx, cx, py + (h - chipH) / 2, cw, chipH, 8);
      ctx.textAlign = "center";
      label(ctx, cost, cx + cw / 2, py + h / 2, 12, INK, null, 0);
    } else if (spec.shopTile) {
      drawShopTile(ctx, state, spec, x, py, w, h);
    } else if (spec.portraitKey) {
      const priceSize = h < 130 ? 11 : 12;
      const nameSize = h < 130 ? 12 : 14;
      const priceH = h < 130 ? 14 : 15;
      const chipY = py + h - priceH - 3;
      const nameY = chipY - nameSize * 0.7 - 4;
      const top = py + 3;
      const ph = Math.max(16, nameY - top - nameSize * 0.65);
      drawPortrait(ctx, spec.portraitKey, x + 4, top, w - 8, ph);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const name = spec.label || "";
      const ns = fitSize(ctx, name, w - 10, nameSize);
      label(ctx, name, x + w / 2, nameY, ns, INK, null, 0);
      const cost = "$" + spec.cost;
      const affordable = spec.affordable !== false;
      font(ctx, priceSize);
      const cw = Math.max(32, ctx.measureText(cost).width + 10);
      fillRound(ctx, x + w / 2 - cw / 2, chipY, cw, priceH, 6, affordable ? "#ffe14a" : "#ff8d86");
      ctx.lineWidth = 1.4;
      ctx.strokeStyle = INK;
      strokeRound(ctx, x + w / 2 - cw / 2, chipY, cw, priceH, 6);
      label(ctx, cost, x + w / 2, chipY + priceH / 2, priceSize, INK, null, 0);
    } else if (spec.label) {
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const ink = !spec.ink || spec.ink === "#ffffff" || spec.ink === "#fff" ? INK : spec.ink;
      const stroke = typeof spec.stroke === "string" ? spec.stroke : null;
      if (spec.sub) {
        const ls = fitSize(ctx, spec.label, w - 16, spec.labelSize || 16);
        const ss = fitSize(ctx, spec.sub, w - 16, spec.subSize || 12);
        const gap = 3;
        const block = ls + gap + ss;
        const top = py + Math.max(3, (h - block) / 2);
        label(ctx, spec.label, x + w / 2, top + ls * 0.55, ls, ink, stroke, stroke ? Math.max(2, ls * 0.12) : 0);
        label(ctx, spec.sub, x + w / 2, top + ls + gap + ss * 0.55, ss, ink, stroke, stroke ? Math.max(2, ss * 0.12) : 0);
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
    const foe = {
      grunt: "grunt", scout: "scout", heavy: "heavy", moto: "scout", brute: "brute",
      riot: "riot", medic: "medic", sneak: "sneak", camo: "camo", para: "para",
      dash: "dash", bulwark: "bulwark", gnat: "gnat",
      plate: "heavy", vex: "heavy", outrider: "dash", marksman: "camo", stick: "para",
    };
    const vehicle = key === "jeep" || key === "tank" || key === "halftrack" || key === "ironjaw" || key === "ram" || key === "blimp";
    const enemy = !!foe[key] || vehicle;
    const role = foe[key] || (key === "halftrack" ? "jeep" : key === "ironjaw" || key === "ram" ? "tank" : key === "blimp" ? "gnat" : key);
    const painted = !!(root.BOTGArt && root.BOTGArt.has(role));
    ctx.save();
    fillRound(ctx, x, y, w, h, 12, painted ? "#efe6c8" : (enemy || vehicle ? "#4a2040" : "#2f9a3c"));
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = INK;
    strokeRound(ctx, x, y, w, h, 12);
    ctx.save();
    roundPath(ctx, x + 1, y + 1, w - 2, h - 2, 11);
    ctx.clip();
    if (painted && root.BOTGArt.drawCameo(ctx, role, x, y, w, h)) {
      ctx.restore();
      ctx.restore();
      return;
    }
    if (vehicle) {
      fillRound(ctx, x + w * 0.16, y + h * 0.36, w * 0.68, h * 0.3, 6, key === "tank" || key === "ironjaw" ? "#6e342c" : "#8d3a32");
    } else if (root.BOTGSoldier) {
      const prone = key === "longshot";
      const sc = prone
        ? Math.min((w * 0.9) / 40, (h * 0.7) / 16)
        : Math.min((w * 0.88) / 28, (h * 0.94) / 40);
      root.BOTGSoldier.draw(ctx, x + w / 2, y + (prone ? h * 0.58 : h - 2), {
        team: enemy ? "enemy" : "player",
        role: role,
        aim: prone ? -0.08 : 0.12,
        scale: sc,
      });
    }
    ctx.restore();
    ctx.restore();
  }

  let terrain = null;
  let terrainId = "";
  function ensureTerrain() {
    const id = (B.map && B.map.id) || "maple";
    const painted = root.BOTGArt && root.BOTGArt.mapReady(id) ? "art" : "ink";
    const key = id + ":" + painted;
    if (terrain && terrainId === key) return;
    terrainId = key;
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

  function mapLines() {
    if (B.map && B.map.paths && B.map.paths.length) return B.map.paths;
    return [B.map.path];
  }

  function strokePath(ctx, width, color) {
    ctx.lineWidth = width;
    ctx.strokeStyle = color;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    mapLines().forEach((pts) => {
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
      ctx.stroke();
    });
  }

  function nearBlock(x, y, pad) {
    const pond = B.map.pond;
    return pond && Math.hypot(x - pond.x, y - pond.y) < pond.r + pad;
  }

  function hatch(ctx, color) {
    const rand = mulberry32(color === "snow" ? 5 : color === "sand" ? 9 : 3);
    ctx.strokeStyle = color === "snow" ? "rgba(90,110,120,0.28)" : color === "sand" ? "rgba(120,80,30,0.22)" : "rgba(40,60,20,0.28)";
    ctx.lineWidth = 1.1;
    ctx.lineCap = "round";
    for (let i = 0; i < 520; i++) {
      const x = 6 + rand() * 388;
      const y = 48 + rand() * 500;
      if (B.distToRoute(x, y) < 26) continue;
      const len = 4 + rand() * 7;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + len * 0.3, y - len);
      ctx.stroke();
    }
  }

  function fenceRun(ctx, x, y, n) {
    ctx.strokeStyle = INK;
    ctx.fillStyle = "#8a6844";
    ctx.lineWidth = 2;
    for (let i = 0; i < n; i++) {
      const px = x + i * 16;
      ctx.fillRect(px, y - 14, 3, 16);
      ctx.strokeRect(px, y - 14, 3, 16);
    }
    ctx.beginPath();
    ctx.moveTo(x, y - 10);
    ctx.lineTo(x + (n - 1) * 16, y - 6);
    ctx.moveTo(x, y - 4);
    ctx.lineTo(x + (n - 1) * 16, y - 1);
    ctx.stroke();
  }

  function bagPile(ctx, x, y) {
    for (let i = 0; i < 3; i++) {
      blobish(ctx, x + i * 8, y - (i === 1 ? 6 : 0), 6, 3.2, "#c6b48a");
    }
  }

  function blobish(ctx, x, y, rx, ry, fill) {
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.8;
    ctx.stroke();
  }

  function rockPile(ctx, x, y) {
    blobish(ctx, x, y, 10, 6, "#8a8680");
    blobish(ctx, x + 8, y + 2, 7, 4.5, "#6a6660");
    blobish(ctx, x - 6, y + 2, 5, 3.4, "#9a9690");
  }

  function farmhouse(ctx, x, y) {
    ctx.fillStyle = "#e7d7b4";
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.rect(x, y, 36, 22);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#8d3a32";
    ctx.beginPath();
    ctx.moveTo(x - 4, y);
    ctx.lineTo(x + 18, y - 16);
    ctx.lineTo(x + 40, y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#6a5030";
    ctx.fillRect(x + 14, y + 8, 8, 14);
    ctx.strokeRect(x + 14, y + 8, 8, 14);
    ctx.fillStyle = "#c5d4e0";
    ctx.fillRect(x + 4, y + 6, 7, 6);
    ctx.strokeRect(x + 4, y + 6, 7, 6);
  }

  function windmill(ctx, x, y) {
    ctx.strokeStyle = INK;
    ctx.fillStyle = "#d7c4a0";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - 8, y + 18);
    ctx.lineTo(x + 8, y + 18);
    ctx.lineTo(x + 4, y);
    ctx.lineTo(x - 4, y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y - 16);
    ctx.moveTo(x - 12, y - 8);
    ctx.lineTo(x + 12, y - 4);
    ctx.moveTo(x - 8, y - 14);
    ctx.lineTo(x + 10, y - 12);
    ctx.stroke();
  }

  function paintTerrain(ctx) {
    const id = (B.map && B.map.id) || "maple";
    const plate = root.BOTGArt && root.BOTGArt.mapImage(id);
    if (plate) {
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(plate, 0, 0, 800, 1140);
      ctx.restore();
      return;
    }
    const snow = B.map.theme === "snow";
    const desert = B.map.theme === "desert";
    const sky = ctx.createLinearGradient(0, 40, 0, 200);
    if (snow) {
      sky.addColorStop(0, "#c5d0d4");
      sky.addColorStop(1, "#e4e8e4");
    } else if (desert) {
      sky.addColorStop(0, "#e2c48a");
      sky.addColorStop(1, "#d7b48a");
    } else {
      sky.addColorStop(0, "#c5d0b0");
      sky.addColorStop(1, "#b7c49a");
    }
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, 400, 570);
    ctx.fillStyle = snow ? "#eef2f0" : desert ? "#e4c898" : "#a8b888";
    ctx.fillRect(0, 150, 400, 430);
    const fields = snow
      ? [[80, 90, 90, 22, "#f4f7f4"], [200, 78, 110, 20, "#d5e0e4"], [320, 96, 80, 18, "#e7eef2"]]
      : desert
        ? [[70, 100, 100, 22, "#c49a62"], [210, 86, 120, 20, "#d7b07a"], [330, 108, 70, 16, "#e2c48a"]]
        : [[50, 78, 80, 18, "#c6b06a"], [150, 92, 90, 16, "#8ea56a"], [260, 74, 100, 20, "#d2c08a"], [350, 100, 60, 14, "#a3b56a"]];
    fields.forEach(function (f) {
      ctx.fillStyle = f[4];
      ctx.strokeStyle = INK;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.ellipse(f[0], f[1], f[2], f[3], 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });
    if (!desert && !snow) {
      farmhouse(ctx, 18, 108);
      windmill(ctx, 250, 96);
    } else if (desert) {
      ctx.fillStyle = "#b88458";
      ctx.strokeStyle = INK;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(20, 130);
      ctx.lineTo(70, 70);
      ctx.lineTo(130, 130);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#6a5030";
      ctx.fillRect(300, 96, 5, 26);
      ctx.beginPath();
      ctx.ellipse(302, 94, 16, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else {
      windmill(ctx, 300, 100);
    }
    hatch(ctx, snow ? "snow" : desert ? "sand" : "grass");
    const noise = mulberry32(19);
    for (let i = 0; i < 900; i++) {
      const x = noise() * 400;
      const y = 50 + noise() * 500;
      if (B.distToRoute(x, y) < 22) continue;
      ctx.fillStyle = snow ? "rgba(255,255,255,0.25)" : "rgba(40,30,10," + (0.04 + noise() * 0.08) + ")";
      ctx.fillRect(x, y, 2, 2);
    }
    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    const dirt = snow ? "#d5dee4" : desert ? "#c49a62" : "#b08958";
    strokePath(ctx, 34, dirt);
    ctx.restore();
    const routes = B.routes && B.routes.length ? B.routes : [B.route];
    ctx.strokeStyle = snow ? "rgba(90,110,120,0.45)" : "rgba(90,60,30,0.4)";
    ctx.lineWidth = 1.2;
    for (let li = 0; li < routes.length; li++) {
      ctx.beginPath();
      for (let d = 0; d < routes[li].total; d += 10) {
        const p = B.pointAt(d, li);
        const nx = -Math.sin(p.angle) * 5;
        const ny = Math.cos(p.angle) * 5;
        if (d === 0) ctx.moveTo(p.x + nx, p.y + ny);
        else ctx.lineTo(p.x + nx, p.y + ny);
      }
      ctx.stroke();
      ctx.beginPath();
      for (let d = 0; d < routes[li].total; d += 10) {
        const p = B.pointAt(d, li);
        const nx = -Math.sin(p.angle) * 5;
        const ny = Math.cos(p.angle) * 5;
        if (d === 0) ctx.moveTo(p.x - nx, p.y - ny);
        else ctx.lineTo(p.x - nx, p.y - ny);
      }
      ctx.stroke();
    }
    if (!snow && !desert) {
      [[40, 200], [360, 250], [30, 360], [350, 420]].forEach(function (s) {
        if (B.distToRoute(s[0], s[1]) > 34) fenceRun(ctx, s[0], s[1], 4);
      });
      [[200, 250], [80, 430]].forEach(function (s) {
        if (B.distToRoute(s[0], s[1]) > 30) bagPile(ctx, s[0], s[1]);
      });
      [[300, 360], [50, 280]].forEach(function (s) {
        if (B.distToRoute(s[0], s[1]) > 30) rockPile(ctx, s[0], s[1]);
      });
    } else if (desert) {
      [[40, 220], [340, 300], [60, 420]].forEach(function (s) {
        if (B.distToRoute(s[0], s[1]) > 30) rockPile(ctx, s[0], s[1]);
      });
    } else {
      [[50, 200], [340, 260], [40, 400]].forEach(function (s) {
        if (B.distToRoute(s[0], s[1]) > 34) fenceRun(ctx, s[0], s[1], 3);
      });
      [[180, 300]].forEach(function (s) {
        if (B.distToRoute(s[0], s[1]) > 30) rockPile(ctx, s[0], s[1]);
      });
    }
    const pond = B.map.pond;
    if (pond && pond.kind === "well") drawWell(ctx, pond);
    else if (pond && pond.kind === "ice") drawIce(ctx, pond);
    else if (pond) drawPond(ctx, pond);
    const exit = B.pointAt(B.route.total - 16, 0);
    drawFort(ctx, exit.x, exit.y);
    const sign = B.map.sign || { x: 78, y: 524, label: B.map.name || "Normandy Shore" };
    drawSign(ctx, sign.x, sign.y, sign.label);
  }

  function drawCamp(ctx) {
    const spots = [
      { kind: "tent", x: 168, y: 70 },
      { kind: "flag", x: 250, y: 78 },
      { kind: "jeep", x: 330, y: 96 },
      { kind: "wall", x: 40, y: 150 },
    ];
    spots.forEach((s) => {
      if (B.distToRoute(s.x, s.y) < 36) return;
      if (s.kind === "tent") {
        shadow(ctx, s.x, s.y + 8, 22, 6);
        ctx.fillStyle = "#f4e2b0";
        ctx.beginPath();
        ctx.moveTo(s.x - 18, s.y + 8);
        ctx.lineTo(s.x, s.y - 16);
        ctx.lineTo(s.x + 18, s.y + 8);
        ctx.closePath();
        ctx.fill();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = INK;
        ctx.stroke();
        ctx.fillStyle = "rgba(255,255,255,0.35)";
        ctx.beginPath();
        ctx.moveTo(s.x - 8, s.y + 2);
        ctx.lineTo(s.x, s.y - 12);
        ctx.lineTo(s.x + 2, s.y + 4);
        ctx.fill();
      } else if (s.kind === "flag") {
        fillRound(ctx, s.x, s.y, 3, 28, 1, "#6a4a28");
        ctx.fillStyle = "#e23a3a";
        ctx.beginPath();
        ctx.moveTo(s.x + 3, s.y + 2);
        ctx.lineTo(s.x + 18, s.y + 7);
        ctx.lineTo(s.x + 3, s.y + 12);
        ctx.fill();
        ctx.strokeStyle = INK;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      } else if (s.kind === "jeep") {
        shadow(ctx, s.x, s.y + 6, 16, 5);
        fillRound(ctx, s.x - 14, s.y - 6, 28, 12, 4, "#3f8f4a");
        ctx.strokeStyle = INK;
        ctx.lineWidth = 2;
        strokeRound(ctx, s.x - 14, s.y - 6, 28, 12, 4);
        ctx.fillStyle = "rgba(255,255,255,0.3)";
        ctx.fillRect(s.x - 12, s.y - 5, 20, 3);
      } else if (s.kind === "wall") {
        shadow(ctx, s.x + 16, s.y + 4, 20, 5);
        for (let i = 0; i < 4; i++) pieceSafe(ctx, s.x + i * 9, s.y - (i % 2) * 3, 10, 6);
      }
    });
  }

  function pieceSafe(ctx, x, y, w, h) {
    fillRound(ctx, x, y, w, h, 2, "#e7d3a4");
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.5;
    strokeRound(ctx, x, y, w, h, 2);
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

  function drawSign(ctx, x, y, text) {
    shadow(ctx, x + 40, y + 16, 36, 6);
    fillRound(ctx, x, y, 96, 26, 8, "#fff4d2");
    ctx.lineWidth = 3;
    ctx.strokeStyle = INK;
    strokeRound(ctx, x, y, 96, 26, 8);
    fillRound(ctx, x + 44, y + 24, 6, 14, 2, "#8a5a32");
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    label(ctx, text || "Normandy Shore", x + 48, y + 14, 13, "#5c3b22", null, 0);
  }

  function drawPond(ctx, pond) {
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
  }

  function drawWell(ctx, pond) {
    shadow(ctx, pond.x, pond.y + 6, pond.r + 6, pond.r * 0.45);
    ctx.fillStyle = "#8a8e96";
    ctx.beginPath();
    ctx.ellipse(pond.x, pond.y, pond.r + 4, pond.r * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = INK;
    ctx.stroke();
    ctx.fillStyle = "#2a241c";
    ctx.beginPath();
    ctx.ellipse(pond.x, pond.y, pond.r * 0.55, pond.r * 0.28, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = "#c9a06a";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(pond.x - pond.r, pond.y - 4);
    ctx.lineTo(pond.x - pond.r, pond.y - 16);
    ctx.lineTo(pond.x + pond.r, pond.y - 16);
    ctx.lineTo(pond.x + pond.r, pond.y - 4);
    ctx.stroke();
  }

  function drawSnowCap(ctx, x, y, r) {
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(180, 210, 230, 0.45)";
    ctx.beginPath();
    ctx.ellipse(x + r * 0.2, y + r * 0.12, r * 0.45, r * 0.22, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawIce(ctx, pond) {
    shadow(ctx, pond.x, pond.y + 4, pond.r, pond.r * 0.4);
    ctx.fillStyle = "#7eb6d6";
    ctx.beginPath();
    ctx.ellipse(pond.x, pond.y, pond.r, pond.r * 0.62, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = INK;
    ctx.stroke();
    ctx.strokeStyle = "rgba(255,255,255,0.8)";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(pond.x - pond.r * 0.6, pond.y);
    ctx.lineTo(pond.x + pond.r * 0.2, pond.y - pond.r * 0.2);
    ctx.lineTo(pond.x + pond.r * 0.5, pond.y + pond.r * 0.15);
    ctx.stroke();
  }

  function drawPine(ctx, tree) {
    const r = tree.r;
    shadow(ctx, tree.x, tree.y + 4, r * 0.7, r * 0.28);
    ctx.fillStyle = "#6a4328";
    ctx.fillRect(tree.x - 3, tree.y - 4, 6, 12);
    function tier(y, w, h, fill) {
      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.moveTo(tree.x, tree.y - y - h);
      ctx.lineTo(tree.x - w, tree.y - y);
      ctx.lineTo(tree.x + w, tree.y - y);
      ctx.closePath();
      ctx.fill();
      ctx.lineWidth = 2.4;
      ctx.strokeStyle = INK;
      ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,0.82)";
      ctx.beginPath();
      ctx.moveTo(tree.x, tree.y - y - h);
      ctx.lineTo(tree.x - w * 0.45, tree.y - y - h * 0.35);
      ctx.lineTo(tree.x + w * 0.15, tree.y - y - h * 0.45);
      ctx.closePath();
      ctx.fill();
    }
    tier(r * 0.15, r * 0.95, r * 0.7, "#1f6a34");
    tier(r * 0.7, r * 0.75, r * 0.62, "#2f8a44");
    tier(r * 1.15, r * 0.5, r * 0.5, "#3caf4c");
  }

  function drawSnowman(ctx, x, y) {
    shadow(ctx, x, y + 6, 14, 5);
    ctx.fillStyle = "#f7fbff";
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(x, y, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y - 16, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#e23a3a";
    ctx.fillRect(x - 8, y - 28, 16, 4);
    ctx.fillRect(x - 2, y - 32, 4, 6);
    ctx.fillStyle = INK;
    ctx.fillRect(x - 3, y - 18, 2, 2);
    ctx.fillRect(x + 2, y - 18, 2, 2);
  }

  function drawPebble(ctx, x, y, r) {
    ctx.fillStyle = "#c4a06a";
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * 0.62, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#6a4020";
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  function drawBannerPost(ctx, x, y) {
    fillRound(ctx, x, y, 8, 28, 2, "#3a2060");
    ctx.lineWidth = 2;
    ctx.strokeStyle = INK;
    strokeRound(ctx, x, y, 8, 28, 2);
    fillRound(ctx, x + 6, y + 2, 36, 16, 4, "#8d3a32");
    ctx.strokeStyle = INK;
    strokeRound(ctx, x + 6, y + 2, 36, 16, 4);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    label(ctx, "IN", x + 24, y + 11, 11, "#ffe56a", INK, 2);
  }

  function mapProps() {
    const list = (B.map && B.map.props) || [];
    return list.filter((p) => {
      const px = p.kind === "fence" ? p.x + (p.w || 0) / 2 : p.x;
      const py = p.y;
      if (B.distToRoute(px, py) < (p.kind === "fence" ? 24 : 34)) return false;
      const pond = B.map.pond;
      if (pond && Math.hypot(px - pond.x, py - pond.y) < pond.r + 12) return false;
      return true;
    });
  }

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

  function drawTree(ctx, tree, time) {
    const sets = {
      green: ["#145c22", "#2f9a32", "#8ae85a"],
      amber: ["#8a3e08", "#e08618", "#ffe07a"],
      rust: ["#7a261c", "#d25030", "#ffb07a"],
    };
    const cols = sets[tree.style] || sets.green;
    const r = tree.r;
    const sway = Math.sin((time || 0) * 1.3 + tree.x * 0.02) * 0.08;
    shadow(ctx, tree.x, tree.y + 4, r * 0.85, r * 0.32);
    fillRound(ctx, tree.x - 5, tree.y - r * 0.2, 10, r * 0.85, 3, "#8a5a32");
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = INK;
    strokeRound(ctx, tree.x - 5, tree.y - r * 0.2, 10, r * 0.85, 3);
    ctx.save();
    ctx.translate(tree.x, tree.y);
    ctx.rotate(sway);
    ctx.translate(-tree.x, -tree.y);
    [[-r * 0.45, -r * 0.55, r * 0.72], [r * 0.42, -r * 0.5, r * 0.68], [0, -r * 0.95, r * 0.78]].forEach((c, i) => {
      ctx.fillStyle = cols[Math.min(2, i)];
      ctx.beginPath();
      ctx.arc(tree.x + c[0], tree.y + c[1], c[2], 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = INK;
      ctx.stroke();
    });
    ctx.restore();
  }

  function drawCactus(ctx, tree, time) {
    const r = tree.r;
    const sway = Math.sin((time || 0) * 1.1 + tree.x) * 1.4;
    shadow(ctx, tree.x, tree.y + 3, r * 0.55, r * 0.22);
    ctx.save();
    ctx.translate(sway, 0);
    ctx.fillStyle = "#2f9a3c";
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.5;
    fillRound(ctx, tree.x - 5, tree.y - r * 1.5, 10, r * 1.55, 5, "#3caf4c");
    strokeRound(ctx, tree.x - 5, tree.y - r * 1.5, 10, r * 1.55, 5);
    fillRound(ctx, tree.x - r * 0.85, tree.y - r * 1.15, r * 0.7, 7, 3, "#3caf4c");
    strokeRound(ctx, tree.x - r * 0.85, tree.y - r * 1.15, r * 0.7, 7, 3);
    fillRound(ctx, tree.x - r * 0.85, tree.y - r * 1.45, 8, r * 0.4, 3, "#2f9a3c");
    strokeRound(ctx, tree.x - r * 0.85, tree.y - r * 1.45, 8, r * 0.4, 3);
    fillRound(ctx, tree.x + 2, tree.y - r * 0.85, r * 0.65, 7, 3, "#57c85a");
    strokeRound(ctx, tree.x + 2, tree.y - r * 0.85, r * 0.65, 7, 3);
    ctx.fillStyle = "#145c22";
    for (let i = 0; i < 5; i++) {
      ctx.fillRect(tree.x - 3 + (i % 3), tree.y - r * 1.3 + i * r * 0.22, 1.2, 3);
    }
    ctx.restore();
  }

  function drawChevrons(ctx, state) {
    const step = 52;
    const march = state.reducedMotion ? 18 : (state.time * 46) % step;
    const routes = B.routes && B.routes.length ? B.routes : [B.route];
    for (let li = 0; li < routes.length; li++) {
    for (let d = march; d < routes[li].total - 24; d += step) {
      const p = B.pointAt(d, li);
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      ctx.globalAlpha = 0.28;
      ctx.strokeStyle = "#6a4a28";
      ctx.lineWidth = 1.2;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(-4, 0);
      ctx.lineTo(4, 0);
      ctx.stroke();
      ctx.restore();
    }
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

  function drawMuzzle(ctx, x, y, aim, amount, scale) {
    const a = Math.min(1, amount * 8);
    const s = scale || 1;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(aim || 0);
    ctx.globalAlpha = a;
    const glow = ctx.createRadialGradient(0, 0, 1, 0, 0, 12 * s);
    glow.addColorStop(0, "#ffffff");
    glow.addColorStop(0.35, "#ffe56a");
    glow.addColorStop(0.7, "#ff9a1f");
    glow.addColorStop(1, "rgba(255,120,20,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, 12 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff8d0";
    star(ctx, 0, 0, 6 * s, 0.2);
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.fillStyle = "#ffd23a";
    star(ctx, 5 * s, 0, 3.4 * s, 0.8);
    ctx.fill();
    ctx.restore();
  }

  function kitBox(ctx, x, y, w, h, fill) {
    fillRound(ctx, x, y, w, h, 2, fill);
    ctx.lineWidth = 1.7;
    ctx.strokeStyle = INK;
    strokeRound(ctx, x, y, w, h, 2);
  }

  function drawUpgradeLook(ctx, x, y, opt, phase) {
    const n = opt.chevrons || 0;
    if (n < 1 || opt.team === "enemy") return;
    const role = opt.role || "trooper";
    const face = Math.cos(opt.aim || 0) >= 0 ? 1 : -1;
    const top = n >= 5;
    if (phase === "back") {
      if (!top) return;
      ctx.save();
      ctx.translate(x, y);
      const g = ctx.createRadialGradient(0, -18, 4, 0, -18, 26);
      g.addColorStop(0, "rgba(255, 214, 90, 0.45)");
      g.addColorStop(1, "rgba(255, 170, 40, 0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, -18, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return;
    }
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(face * (opt.scale || 1), opt.scale || 1);
    if (n >= 4 && role !== "chopper") {
      kitBox(ctx, -22, -4, 18, 9, "#8d7844");
      kitBox(ctx, 4, -3, 18, 9, "#c4a15a");
    }
    if (role === "trooper" || role === "gatling" || role === "sky" || role === "gunner") {
      if (n >= 1) kitBox(ctx, -14, -18, 8, 9, "#e2b15a");
      if (n >= 2) kitBox(ctx, 10, role === "gunner" ? -16 : -22, n >= 3 ? 26 : 14, role === "gunner" ? 7 : 5, "#1a140e");
      if (n >= 3) kitBox(ctx, -8, role === "longshot" ? -16 : -38, 16, 6, "#d8c27a");
      if (n >= 2 && role === "gatling") kitBox(ctx, 10, -14, 16, 4, "#1a140e");
    } else if (role === "longshot") {
      if (n >= 1) {
        ctx.fillStyle = "#1c1814";
        ctx.beginPath();
        ctx.arc(14, -8, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.lineWidth = 1.6;
        ctx.strokeStyle = INK;
        ctx.stroke();
      }
      if (n >= 2) kitBox(ctx, 16, -10, 18, 3, "#2a241c");
      if (n >= 3) kitBox(ctx, 6, -4, 10, 3, "#3a342c");
    } else if (role === "flame") {
      if (n >= 1) {
        ctx.fillStyle = "#5c4030";
        ctx.beginPath();
        ctx.ellipse(-10, -14, 5, 7, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = INK;
        ctx.lineWidth = 1.6;
        ctx.stroke();
      }
      if (n >= 2) kitBox(ctx, 8, -16, n >= 3 ? 18 : 12, 4, "#c4373a");
    } else if (role === "mortar") {
      if (n >= 1) kitBox(ctx, -14, -10, 8, 8, "#6a5434");
      if (n >= 2) kitBox(ctx, 4, -22, 8, n >= 3 ? 16 : 10, "#3a342c");
    } else if (role === "tread") {
      if (n >= 1) kitBox(ctx, -16, -14, 8, 10, "#5c656c");
      if (n >= 2) kitBox(ctx, 12, -12, n >= 3 ? 20 : 12, 5, "#2a241c");
    } else if (role === "engineer") {
      if (n >= 1) kitBox(ctx, 8, -8, 8, 7, "#c6a25c");
      if (n >= 2) {
        ctx.strokeStyle = "#6a2424";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(-12, -6, 5, 0, Math.PI * 1.6);
        ctx.stroke();
      }
      if (n >= 3) {
        ctx.strokeStyle = "#d7e7ff";
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.arc(0, -28, 7, Math.PI, 0);
        ctx.stroke();
      }
    } else if (role === "tent") {
      if (n >= 2) {
        ctx.fillStyle = "#5e6c40";
        ctx.strokeStyle = INK;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(-8, -8);
        ctx.lineTo(2, -26);
        ctx.lineTo(14, -8);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
      if (n >= 1) kitBox(ctx, 12, -8, 7, 6, "#c6a25c");
    } else if (role === "chopper") {
      if (n >= 1) kitBox(ctx, 8, -8, 8, 5, "#6a5434");
      if (n >= 2) kitBox(ctx, -16, -10, 8, 4, "#2a241c");
      if (n >= 3) kitBox(ctx, -6, -16, 12, 4, "#6a7278");
    }
    if (top) {
      ctx.strokeStyle = "#ffe08a";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, role === "longshot" ? -8 : -18, role === "chopper" ? 18 : 14, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawSoldier(ctx, x, y, opt) {
    const player = !opt.team || opt.team === "player";
    if (player) drawUpgradeLook(ctx, x, y, opt, "back");
    const usedArt = !!(root.BOTGSoldier && root.BOTGSoldier.draw(ctx, x, y, opt));
    const role = opt.role || "trooper";
    const sc = opt.scale || 1;
    if (player) {
      drawUpgradeLook(ctx, x, y, opt, "front");
      if (opt.flash > 0 && root.BOTGMuzzle) {
        const tip = root.BOTGMuzzle(x, y, role, opt.aim || 0);
        const hot = (opt.chevrons || 0) >= 5 ? 1.7 : 1;
        drawMuzzle(ctx, tip.x, tip.y, opt.aim || 0, opt.flash, hot);
      }
    }
    if (opt.rank && !usedArt) drawRanks(ctx, x, y - (role === "longshot" ? 16 : 40) * sc, opt.rank);
  }

  function drawGnat(ctx, e) {
    ctx.save();
    ctx.translate(e.x, e.y);
    ctx.fillStyle = "rgba(20, 16, 24, 0.28)";
    ctx.beginPath();
    ctx.ellipse(0, 8, 8, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.translate(0, -12);
    fillRound(ctx, -6, -3, 12, 6, 2, "#6e342c");
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2;
    strokeRound(ctx, -6, -3, 12, 6, 2);
    const spin = (e.phase || 0) * 2.4;
    ctx.strokeStyle = "#1a120c";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(Math.cos(spin) * -10, -4 + Math.sin(spin) * 2);
    ctx.lineTo(Math.cos(spin) * 10, -4 - Math.sin(spin) * 2);
    ctx.moveTo(6, -1);
    ctx.lineTo(12, -1);
    ctx.stroke();
    ctx.fillStyle = "#ff3030";
    ctx.beginPath();
    ctx.arc(-2, -1, 1.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
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
    fillRound(ctx, -18, -9, 36, 18, 6, "#8d3a32");
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
    fillRound(ctx, -26, -12, 50, 24, 8, "#6e342c");
    ctx.lineWidth = 3;
    ctx.strokeStyle = INK;
    strokeRound(ctx, -26, -12, 50, 24, 8);
    ctx.fillStyle = "rgba(255,255,255,0.2)";
    ctx.fillRect(-22, -10, 42, 6);
    ctx.fillStyle = "#8d3a32";
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

  function drawRam(ctx, e, time) {
    ctx.save();
    ctx.translate(e.x, e.y);
    ctx.rotate(e.angle);
    ctx.scale(0.82, 0.82);
    shadow(ctx, 0, 12, 62, 14);
    ctx.fillStyle = "#1c1a18";
    fillRound(ctx, -58, -16, 108, 11, 4, "#1c1a18");
    fillRound(ctx, -58, 8, 108, 11, 4, "#1c1a18");
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.5;
    strokeRound(ctx, -58, -16, 108, 11, 4);
    strokeRound(ctx, -58, 8, 108, 11, 4);
    const roll = (time * 28) % 14;
    ctx.fillStyle = "#8a8680";
    for (let i = -48; i <= 40; i += 14) {
      ctx.fillRect(i + roll - 20, -14, 5, 7);
      ctx.fillRect(i + roll - 20, 9, 5, 7);
    }
    fillRound(ctx, -52, -13, 96, 26, 6, "#6d7278");
    ctx.lineWidth = 3;
    ctx.strokeStyle = INK;
    strokeRound(ctx, -52, -13, 96, 26, 6);
    ctx.fillStyle = "#c4373a";
    ctx.fillRect(-52, -13, 96, 4);
    ctx.fillRect(-52, 9, 96, 4);
    const plates = Math.max(0, e.plates || 0);
    const shown = plates > 0 ? 4 : 1;
    ctx.fillStyle = plates > 0 ? "#b7c0c8" : "#5c6166";
    for (let i = 0; i < shown; i++) {
      fillRound(ctx, -40 + i * 18, -8, 14, 16, 3, ctx.fillStyle);
      ctx.lineWidth = 2;
      ctx.strokeStyle = INK;
      strokeRound(ctx, -40 + i * 18, -8, 14, 16, 3);
    }
    ctx.fillStyle = "#3a3e42";
    ctx.beginPath();
    ctx.moveTo(44, -10);
    ctx.lineTo(62, 0);
    ctx.lineTo(44, 10);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#ffe08a";
    ctx.fillRect(28, -3, 8, 3);
    if (e.flash > 0) {
      ctx.fillStyle = "rgba(255,255,255," + Math.min(0.65, e.flash * 4) + ")";
      fillRound(ctx, -52, -13, 96, 26, 6, ctx.fillStyle);
    }
    ctx.restore();
  }

  function drawBlimp(ctx, e, time) {
    ctx.save();
    ctx.translate(e.x, e.y - 18);
    shadow(ctx, 6, 36, 28, 8);
    const bob = Math.sin(time * 1.6 + (e.id || 0)) * 2;
    ctx.translate(0, bob);
    ctx.fillStyle = "#8d949c";
    ctx.beginPath();
    ctx.ellipse(0, 0, 34, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = INK;
    ctx.stroke();
    ctx.fillStyle = "#c4373a";
    ctx.fillRect(-34, -3, 68, 5);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-34, -3, 68, 5);
    ctx.fillStyle = "#5c636b";
    fillRound(ctx, -10, 12, 20, 10, 3, "#5c636b");
    ctx.lineWidth = 2;
    ctx.strokeStyle = INK;
    strokeRound(ctx, -10, 12, 20, 10, 3);
    ctx.strokeStyle = "#2a2420";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-8, 12);
    ctx.lineTo(-14, 4);
    ctx.moveTo(8, 12);
    ctx.lineTo(14, 4);
    ctx.stroke();
    ctx.fillStyle = "#ff3030";
    ctx.beginPath();
    ctx.arc(-4, 16, 1.3, 0, Math.PI * 2);
    ctx.arc(3, 16, 1.3, 0, Math.PI * 2);
    ctx.fill();
    if (e.flash > 0) {
      ctx.fillStyle = "rgba(255,255,255," + Math.min(0.55, e.flash * 3) + ")";
      ctx.beginPath();
      ctx.ellipse(0, 0, 34, 16, 0, 0, Math.PI * 2);
      ctx.fill();
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

  function drawChute(ctx, e) {
    const x = e.x;
    const y = e.y - 40;
    ctx.save();
    ctx.fillStyle = "#e23b4a";
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(x, y, 18, 9, 0, Math.PI, 0, true);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#fff6e8";
    ctx.fillRect(x - 2, y - 8, 4, 8);
    ctx.strokeStyle = "rgba(255,246,232,0.9)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x - 14, y);
    ctx.lineTo(x, e.y - 8);
    ctx.moveTo(x + 14, y);
    ctx.lineTo(x, e.y - 8);
    ctx.moveTo(x, y);
    ctx.lineTo(x, e.y - 8);
    ctx.stroke();
    ctx.restore();
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
      label(ctx, def.name.toUpperCase(), e.x, y - 2, 12, "#ffe56a", INK, 3);
    }
    if (def.plates && e.plates > 0) {
      const pw = w;
      const py = y + 9;
      const pp = Math.max(0, e.plates / def.plates);
      fillRound(ctx, x - 1, py - 1, pw + 2, 6, 3, INK);
      fillRound(ctx, x, py, Math.max(3, pw * pp), 4, 2, "#c5d0da");
    }
  }

  function drawShot(ctx, s) {
    if (s.kind === "mortar" || s.kind === "flak" || s.kind === "rocket") {
      ctx.save();
      ctx.translate(s.x, s.y);
      const rad = s.kind === "mortar" ? 5 : s.kind === "rocket" ? 4 : 3.5;
      ctx.fillStyle = INK;
      ctx.beginPath();
      ctx.arc(0, 0, rad + 1.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = s.kind === "flak" ? "#ffe14a" : s.kind === "rocket" ? "#ff8a3d" : "#c8ccd0";
      ctx.beginPath();
      ctx.arc(0, 0, rad, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return;
    }
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
    } else if (fx.kind === "hit") {
      ctx.save();
      ctx.globalAlpha = 1 - k;
      ctx.strokeStyle = "#fff6d0";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(fx.x, fx.y, (fx.r || 12) * (0.4 + k), 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255," + (1 - k) * 0.45 + ")";
      ctx.beginPath();
      ctx.arc(fx.x, fx.y, 4 * (1 - k), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (fx.kind === "boom") {
      ctx.save();
      ctx.globalAlpha = 1 - k;
      const rad = 8 + k * (fx.r || 28);
      const glow = ctx.createRadialGradient(fx.x, fx.y, 2, fx.x, fx.y, rad);
      glow.addColorStop(0, "rgba(255,244,180," + (1 - k) + ")");
      glow.addColorStop(0.45, "rgba(255,140,40," + (1 - k) * 0.7 + ")");
      glow.addColorStop(1, "rgba(255,80,20,0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(fx.x, fx.y, rad, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#ffe56a";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(fx.x, fx.y, rad, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = "#ff8a3d";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(fx.x, fx.y, rad * 0.62, 0, Math.PI * 2);
      ctx.stroke();
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 + 0.2;
        ctx.fillStyle = i % 2 ? "#3a2414" : "#ffe14a";
        ctx.beginPath();
        ctx.arc(fx.x + Math.cos(a) * k * (fx.r || 26), fx.y + Math.sin(a) * k * (fx.r || 26) * 0.7, 3 + (1 - k) * 2, 0, Math.PI * 2);
        ctx.fill();
      }
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
    } else if (fx.kind === "flame") {
      ctx.save();
      ctx.translate(fx.x, fx.y);
      ctx.rotate(fx.a || 0);
      ctx.globalAlpha = 1 - k;
      const reach = (fx.r || 60) * (0.55 + k * 0.45);
      const spread = fx.cone || 0.7;
      const g = ctx.createLinearGradient(0, 0, reach, 0);
      g.addColorStop(0, "rgba(255,244,180,0.9)");
      g.addColorStop(0.45, "rgba(255,120,30,0.75)");
      g.addColorStop(1, "rgba(180,40,10,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(-spread) * reach, Math.sin(-spread) * reach * 0.55);
      ctx.lineTo(Math.cos(spread) * reach, Math.sin(spread) * reach * 0.55);
      ctx.closePath();
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
    ctx.translate(f.x, f.y - k * (f.kind === "coin" ? 34 : 26));
    ctx.scale(pop, pop);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    if (f.kind === "coin") {
      font(ctx, 13);
      const tw = Math.max(28, ctx.measureText(f.text).width + 16);
      fillRound(ctx, -tw / 2, -11, tw, 22, 11, "#ffe14a");
      ctx.lineWidth = 2;
      ctx.strokeStyle = INK;
      strokeRound(ctx, -tw / 2, -11, tw, 22, 11);
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.beginPath();
      ctx.ellipse(-tw * 0.18, -4, tw * 0.22, 4, -0.4, 0, Math.PI * 2);
      ctx.fill();
      label(ctx, f.text, 0, 1, 13, "#3a2208", null, 0);
    } else {
      label(ctx, f.text, 0, 0, f.life < 0.5 ? 13 : 16, f.color || "#fff6d0", INK, 3);
    }
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

  function drawBirds(ctx, state) {
    for (let i = 0; i < 3; i++) {
      const x = ((state.time * 26 + i * 150) % 480) - 40;
      const y = 78 + i * 28 + Math.sin(state.time * 1.4 + i) * 6;
      const flap = Math.sin(state.time * 12 + i);
      ctx.save();
      ctx.translate(x, y);
      ctx.strokeStyle = INK;
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(-7, flap * 2);
      ctx.quadraticCurveTo(-3, -5 - flap * 3, 0, 0);
      ctx.quadraticCurveTo(3, -5 - flap * 3, 7, flap * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawMotes(ctx, state) {
    const desert = B.map.theme === "desert";
    ctx.save();
    for (let i = 0; i < 8; i++) {
      const x = (i * 53 + state.time * (desert ? 10 : 6)) % 400;
      const y = 90 + ((i * 67 + state.time * 8) % 420);
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = desert ? "#f4e2b0" : "#fff6d0";
      ctx.beginPath();
      ctx.arc(x, y, desert ? 1.8 : 1.3, 0, Math.PI * 2);
      ctx.fill();
    }
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
    const order = ["grunt", "scout", "dash", "moto", "outrider", "heavy", "plate", "brute", "riot", "bulwark", "vex", "medic", "sneak", "camo", "marksman", "para", "stick", "jeep", "halftrack", "gnat", "blimp", "tank", "ram", "ironjaw"];
    return order.filter((t) => counts[t]).map((t) => ({ type: t, count: counts[t] }));
  }

  function metrics(L, inspecting) {
    const pad = 8;
    const p = L.panel;
    const inner = { x: p.x + pad, y: p.y + 6, w: p.w - pad * 2, h: p.h - 12 };
    const gap = 4;
    const speedW = L.portrait ? 48 : 56;
    let infoH;
    let startH;
    let compactStart = false;
    let pathsOnly = false;
    if (L.portrait && inspecting) {
      infoH = 40;
      startH = 40;
      compactStart = true;
      pathsOnly = true;
    } else if (L.portrait) {
      infoH = 34;
      startH = 44;
    } else if (inspecting) {
      infoH = 64;
      startH = 44;
    } else {
      infoH = Math.min(72, Math.max(52, inner.h * 0.2));
      startH = 44;
    }
    if (L.portrait && !inspecting) {
      const cardsY = inner.y + infoH + gap + startH + gap;
      return {
        info: { x: inner.x, y: inner.y, w: inner.w, h: infoH },
        start: { x: inner.x, y: inner.y + infoH + gap, w: inner.w - speedW - gap, h: startH },
        speed: { x: inner.x + inner.w - speedW, y: inner.y + infoH + gap, w: speedW, h: startH },
        cards: { x: inner.x, y: cardsY, w: inner.w, h: Math.max(44, inner.y + inner.h - cardsY) },
        compactStart: false,
        pathsOnly: false,
      };
    }
    const startY = inner.y + inner.h - startH;
    const cardsY = inner.y + infoH + gap;
    return {
      info: { x: inner.x, y: inner.y, w: inner.w, h: infoH },
      cards: { x: inner.x, y: cardsY, w: inner.w, h: Math.max(44, startY - gap - cardsY) },
      start: { x: inner.x, y: startY, w: inner.w - speedW - gap, h: startH },
      speed: { x: inner.x + inner.w - speedW, y: startY, w: speedW, h: startH },
      compactStart: compactStart,
      pathsOnly: pathsOnly,
    };
  }

  function drawHeader(ctx, state, L) {
    const h = L.headerH;
    ctx.fillStyle = "#3e4634";
    ctx.fillRect(0, 0, L.vw, h);
    ctx.fillStyle = PAPER;
    ctx.fillRect(4, 4, L.vw - 8, h - 8);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2;
    ctx.strokeRect(4, 4, L.vw - 8, h - 8);
    ctx.strokeStyle = "#8a7048";
    ctx.lineWidth = 1;
    ctx.strokeRect(7, 7, L.vw - 14, h - 14);

    const pillH = Math.min(36, h - 14);
    const py = (h - 4 - pillH) / 2;
    function pill(x, w) {
      ctx.fillStyle = "#f7f1e2";
      ctx.beginPath();
      ctx.arc(x + pillH / 2, py + pillH / 2, pillH / 2 - 1, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = INK;
      ctx.stroke();
      fillRound(ctx, x + pillH * 0.7, py + 2, w - pillH * 0.7, pillH - 4, 4, "#f7f1e2");
      ctx.strokeRect(x + pillH * 0.55, py + 2, w - pillH * 0.7, pillH - 4);
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
    label(ctx, String(state.lives), 42, py + pillH / 2 + 1, 18, INK, null, 0);

    pill(108, 112);
    drawCoin(ctx, 126, py + pillH / 2, 8);
    ctx.textAlign = "left";
    label(ctx, String(state.cash), 140, py + pillH / 2 + 1, 18, INK, null, 0);

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
    label(ctx, "ROUND", roundX + roundW / 2, py + 11, 9, "#6a5030", null, 0);
    label(ctx, num, roundX + roundW / 2, py + pillH / 2 + 6, 16, INK, null, 0);

    if (!L.portrait && roundX - 230 > 120) {
      ctx.textAlign = "center";
      label(ctx, (B.map.name || "MAP").toUpperCase(), (230 + roundX) / 2, py + pillH / 2 + 1, 16, "#fff6d0", INK, 3);
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
      const stats = B.statsFor(tower.type, tower.ranks);
      const portraitW = rect.h < 52 ? 34 : 46;
      drawPortrait(ctx, tower.type, rect.x, rect.y, portraitW, Math.max(28, rect.h - 2));
      const used = B.chevronsUsed ? B.chevronsUsed(tower.type, tower.ranks) : 0;
      const kit = (stats.badge || B.towers[tower.type].name) + "  " + used + "/6";
      const nameY = rect.h < 52 ? rect.y + 12 : rect.y + 16;
      const statY = rect.h < 52 ? rect.y + 28 : rect.y + 36;
      label(ctx, kit, rect.x + portraitW + 6, nameY, rect.h < 52 ? 13 : 15, INK, null, 0);
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      const line = "Dmg " + stats.damage + "  ·  Reach " + stats.range + "  ·  " + stats.rate.toFixed(1) + "/s";
      const statMax = Math.max(70, rect.w - portraitW - 52);
      let stat = line + "  ·  " + armorWord(stats.armorBite);
      let statSize = fitSize(ctx, stat, statMax, rect.h < 52 ? 11 : 12);
      font(ctx, statSize);
      if (ctx.measureText(stat).width > statMax) {
        stat = "Dmg " + stats.damage + "  ·  Reach " + stats.range;
        statSize = fitSize(ctx, stat, statMax, 11);
      }
      label(ctx, stat, rect.x + portraitW + 6, statY, statSize, "#5c4630", null, 0);
      const close = Math.min(40, rect.h);
      uiButton(ctx, state, {
        id: "close",
        x: rect.x + rect.w - close - 2,
        y: rect.y,
        w: close,
        h: Math.min(close, rect.h),
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
    } else if (state.placing && B.towers[state.placing]) {
      const def = B.towers[state.placing];
      const pw = Math.min(34, Math.max(24, rect.h - 4));
      drawPortrait(ctx, state.placing, rect.x, rect.y, pw, rect.h - 2);
      const tx = rect.x + pw + 6;
      const maxW = rect.w - pw - 10;
      label(ctx, def.name + "  $" + B.pay(def.cost), tx, rect.y + 12, rect.h < 56 ? 13 : 15, INK, null, 0);
      font(ctx, 11);
      ctx.fillStyle = "#5c4630";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      const lines = rect.h >= 64 ? 2 : 1;
      drawWrapped(ctx, def.blurb, tx, rect.y + (rect.h < 56 ? 24 : 30), maxW, 12, lines);
    } else {
      const idx = nextWaveIndex(state);
      const wave = idx >= 0 ? B.waves[idx] : null;
      let heading = (B.map.name || "The lane") + " is quiet";
      if (wave) {
        heading = state.placedCount === 0
          ? "First, pick a soldier"
          : state.started === 0
            ? "Ready when you are"
            : state.waveActive
              ? "Now: " + wave.name
              : "Next: " + wave.name;
      }
      label(ctx, heading, rect.x, rect.y + (rect.h < 56 ? 11 : 14), rect.h < 56 ? 13 : 15, INK, null, 0);
      const hintLines = rect.h >= 64 ? 2 : 1;
      const hintY = rect.y + rect.h - (hintLines === 2 ? 28 : 16);
      if (wave && hintY >= rect.y + 54) {
        let cx = rect.x;
        composition(wave).forEach((c) => {
          if (cx > rect.x + rect.w - 48) return;
          drawPortrait(ctx, c.type, cx, rect.y + 20, 28, 30);
          ctx.textAlign = "left";
          ctx.textBaseline = "middle";
          label(ctx, String(c.count), cx + 32, rect.y + 35, 13, INK, false, 0);
          cx += 50 + String(c.count).length * 8;
        });
      }
      font(ctx, 12);
      ctx.fillStyle = "#5c4630";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      const hint = !wave
        ? (B.map.name || "The lane") + " holds."
        : state.placedCount === 0
          ? "Tap Trooper, then the glowing mark."
          : state.started === 0
            ? "Tap Start Round. Arrows show the march."
            : wave.hint;
      font(ctx, 12);
      drawWrapped(ctx, hint, rect.x, hintY, rect.w, 13, hintLines);
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
      top = "#d5d6a0";
      bot = "#5c7a3a";
      lip = "#2c3c22";
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
      label: m.compactStart ? (disabled ? "HOLDING" : early ? "SEND NEXT" : "START ROUND") : startLabel,
      sub: m.compactStart ? "" : startSub,
      labelSize: m.compactStart ? 15 : 18,
      fillTop: top,
      fillBot: bot,
      lip: lip,
      disabled: disabled,
      pulse: state.placedCount > 0 && state.started === 0 && !m.compactStart,
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
      sub: m.compactStart ? "" : (fast ? "Normal" : "Fast"),
      labelSize: m.compactStart ? 16 : 20,
      fillTop: fast ? "#c8f8a4" : "#fff3b0",
      fillBot: fast ? "#46c85a" : "#ffc83a",
      lip: fast ? "#2c3c22" : "#a86a08",
      ink: INK,
      stroke: false,
      action: () => root.BOTG.toggleSpeed(),
    });
  }

  function drawCards(ctx, state, area) {
    const order = B.towerOrder || ["trooper", "longshot", "gatling", "mortar", "tread", "engineer", "sky", "chopper"];
    const cols = area.w >= 330 ? 6 : area.w >= 168 ? 3 : 2;
    const rows = Math.ceil(order.length / cols);
    const gap = 4;
    const tw = (area.w - gap * (cols - 1)) / cols;
    const th = (area.h - gap * (rows - 1)) / rows;
    const age = state.shopIn == null ? 1 : (state.time || 0) - state.shopIn;
    const slide = state.reducedMotion ? 0 : Math.max(0, 1 - age / 0.28);
    order.forEach(function (key, i) {
      const def = B.towers[key];
      const price = B.pay(def.cost);
      const afford = state.cash >= price;
      const on = state.placing === key;
      const drop = slide * (10 + (i % cols) * 3);
      uiButton(ctx, state, {
        id: "buy-" + key,
        x: area.x + (i % cols) * (tw + gap),
        y: area.y + Math.floor(i / cols) * (th + gap) + drop,
        w: tw,
        h: th,
        cost: price,
        affordable: afford,
        portraitKey: key,
        shopTile: true,
        bob: i * 0.7,
        fillTop: on ? "#f6e7b4" : afford ? "#efe0c4" : "#d9d4c8",
        fillBot: on ? "#e7c878" : afford ? "#e4d2a4" : "#c8c2b6",
        lip: on ? "#8a6828" : afford ? "#6a5430" : "#8a8680",
        active: on,
        action: () => root.BOTG.pick(key),
      });
    });
  }

  function drawPathButton(ctx, state, tower, p, x, y, w, h) {
    const cur = (tower.ranks && tower.ranks[p.id]) || 0;
    const next = cur < p.tiers.length ? p.tiers[cur] : null;
    const chev = !next ? "" : cur >= 3 ? " · 2 chev" : " · 1 chev";
    const tight = h < 48;
    uiButton(ctx, state, {
      id: "path-" + p.id,
      x: x,
      y: y,
      w: w,
      h: h,
      label: next ? p.name + " " + (cur + 1) : p.name + " max",
      sub: next ? next.name + "  $" + B.pay(next.cost) + chev : "Path finished",
      labelSize: tight ? 13 : 15,
      subSize: tight ? 11 : 12,
      fillTop: next ? "#c8f8b0" : "#efe6d2",
      fillBot: next ? "#5ad86a" : "#e4d8c0",
      lip: "#2c3c22",
      ink: INK,
      stroke: false,
      action: () => root.BOTG.upgrade(p.id),
    });
  }

  function drawUpgrade(ctx, state, tower, area, pathsOnly) {
    const def = B.towers[tower.type];
    const paths = def.paths || [];
    const aimNames = { first: "First", last: "Last", tough: "Toughest", near: "Nearest" };
    const n = Math.max(1, paths.length);
    if (pathsOnly) {
      const gap = 3;
      const pathH = (area.h - gap * (n - 1)) / n;
      paths.forEach(function (p, i) {
        drawPathButton(ctx, state, tower, p, area.x, area.y + i * (pathH + gap), area.w, pathH);
      });
      return;
    }
    let gap = 5;
    let sellH = 40;
    let pathH = (area.h - sellH - gap) / n - gap;
    if (pathH < 40) {
      sellH = 40;
      gap = 3;
      pathH = (area.h - sellH - gap) / n - gap;
    }
    paths.forEach(function (p, i) {
      drawPathButton(ctx, state, tower, p, area.x, area.y + i * (pathH + gap), area.w, pathH);
    });
    const y = area.y + paths.length * (pathH + gap);
    const half = (area.w - gap) / 2;
    uiButton(ctx, state, {
      id: "aim",
      x: area.x,
      y: y,
      w: half,
      h: sellH,
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
      x: area.x + half + gap,
      y: y,
      w: half,
      h: sellH,
      label: "Sell +$" + root.BOTG.refund(tower),
      labelSize: 14,
      fillTop: "#ffd0c8",
      fillBot: "#f09890",
      lip: "#a04030",
      ink: INK,
      stroke: false,
      action: () => root.BOTG.sell(),
    });
  }

  function drawUpgradeBar(ctx, state, tower, m) {
    const gap = 4;
    const y = m.start.y;
    const h = m.start.h;
    const x = m.start.x;
    const total = m.speed.x + m.speed.w - x;
    const speedW = m.speed.w;
    const aimW = Math.min(92, Math.max(70, Math.round(total * 0.22)));
    let sellW = Math.max(80, Math.round((total - aimW - speedW - gap * 3) * 0.42));
    let startW = total - aimW - sellW - speedW - gap * 3;
    if (startW < 40) {
      sellW = Math.max(72, sellW - (40 - startW));
      startW = total - aimW - sellW - speedW - gap * 3;
    }
    const aimNames = { first: "First", last: "Last", tough: "Tough", near: "Near" };
    const canSend = state.started < B.waves.length;
    const early = state.waveActive && canSend;
    let startLabel = "HOLD";
    let disabled = true;
    let top = "#d9d3c8";
    let bot = "#c9c2b6";
    let lip = "#8d867c";
    if (!state.waveActive && canSend) {
      startLabel = "START";
      disabled = false;
      top = "#d5d6a0";
      bot = "#5c7a3a";
      lip = "#2c3c22";
    } else if (early) {
      startLabel = "SEND";
      disabled = false;
      top = "#ffe08a";
      bot = "#ff9a1f";
      lip = "#a85a08";
    }
    let cursor = x;
    uiButton(ctx, state, {
      id: "aim",
      x: cursor,
      y: y,
      w: aimW,
      h: h,
      label: "Aim: " + (aimNames[tower.priority] || "First"),
      labelSize: 12,
      fillTop: "#fff8e4",
      fillBot: "#f0ddb0",
      lip: "#8a6840",
      ink: INK,
      stroke: false,
      action: () => root.BOTG.cycleAim(),
    });
    cursor += aimW + gap;
    uiButton(ctx, state, {
      id: "sell",
      x: cursor,
      y: y,
      w: sellW,
      h: h,
      label: "Sell +$" + root.BOTG.refund(tower),
      labelSize: 12,
      fillTop: "#ffd0c8",
      fillBot: "#f09890",
      lip: "#a04030",
      ink: INK,
      stroke: false,
      action: () => root.BOTG.sell(),
    });
    cursor += sellW + gap;
    uiButton(ctx, state, {
      id: "start",
      x: cursor,
      y: y,
      w: startW,
      h: h,
      label: startLabel,
      labelSize: 14,
      fillTop: top,
      fillBot: bot,
      lip: lip,
      disabled: disabled,
      action: () => root.BOTG.launch(),
    });
    const spd = B.meta.speeds[state.speedIndex];
    const fast = spd !== 1;
    uiButton(ctx, state, {
      id: "speed",
      x: m.speed.x,
      y: y,
      w: speedW,
      h: h,
      label: spd + "×",
      labelSize: 14,
      fillTop: fast ? "#c8f8a4" : "#fff3b0",
      fillBot: fast ? "#46c85a" : "#ffc83a",
      lip: fast ? "#2c3c22" : "#a86a08",
      ink: INK,
      stroke: false,
      action: () => root.BOTG.toggleSpeed(),
    });
  }

  function drawPanel(ctx, state, L) {
    const p = L.panel;
    const rad = L.portrait
      ? { tl: 16, tr: 16, br: 0, bl: 0 }
      : { tl: 16, tr: 0, br: 0, bl: 16 };
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.25)";
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = -2;
    fillRound(ctx, p.x, p.y, p.w, p.h, rad, "#3e4634");
    ctx.restore();
    ctx.lineWidth = 3;
    ctx.strokeStyle = INK;
    strokeRound(ctx, p.x, p.y, p.w, p.h, rad);
    const inset = 4;
    const ir = L.portrait
      ? { tl: 12, tr: 12, br: 0, bl: 0 }
      : { tl: 12, tr: 0, br: 0, bl: 12 };
    fillRound(ctx, p.x + inset, p.y + inset, p.w - inset * 2, p.h - inset, ir, PAPER);
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = "#8a7048";
    strokeRound(ctx, p.x + inset + 3, p.y + inset + 3, p.w - inset * 2 - 6, p.h - inset - 6, ir);
    const selected = state.towers.find((t) => t.id === state.selectedId) || null;
    const show = selected && !state.placing;
    const m = metrics(L, show);
    drawInfo(ctx, state, m.info, show ? selected : null);
    if (show && m.pathsOnly) drawUpgradeBar(ctx, state, selected, m);
    else drawStartButtons(ctx, state, m);
    if (show) drawUpgrade(ctx, state, selected, m.cards, m.pathsOnly);
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
    const boss = b.kind === "boss";
    const clear = b.kind === "clear";
    const x = L.mapBox.x + (L.mapBox.w - bw) / 2;
    const y = boss ? L.mapBox.y + L.mapBox.h - bh - 14 : L.mapBox.y + 8;
    ctx.save();
    ctx.globalAlpha = alpha;
    const pop = k < 0.16 ? 0.86 + (k / 0.16) * 0.14 : 1;
    ctx.translate(x + bw / 2, y + bh / 2);
    ctx.scale(pop, pop);
    ctx.translate(-(x + bw / 2), -(y + bh / 2));
    fillRound(ctx, x, y + 4, bw, bh, 16, "rgba(0,0,0,0.25)");
    fillRound(ctx, x, y, bw, bh, 16, boss ? "#3a1860" : clear ? "#e8ffd4" : "#fff8e6");
    ctx.lineWidth = 3;
    ctx.strokeStyle = INK;
    strokeRound(ctx, x, y, bw, bh, 16);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    label(ctx, b.kicker, x + bw / 2, y + 14, 11, boss ? "#ffb4c4" : clear ? "#1f7a32" : "#8a5a32", null, 0);
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
    g.addColorStop(0, "#a8b0a4");
    g.addColorStop(0.45, "#d8d2c0");
    g.addColorStop(0.62, GRASS);
    g.addColorStop(1, "#4a5a38");
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
      label(ctx, "BOOTS ON", L.vw / 2, 86, 40, "#ffe56a", "#2a3420", 8);
      label(ctx, "THE GROUND", L.vw / 2, 132, 36, "#ffe56a", "#2a3420", 8);
      label(ctx, "Thirty rounds. Three maps.", L.vw / 2, 168, 16, "#ffffff", INK, 3);
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
      ["Plant beside the road, never on it.", "Longshots crack armor. Gatlings own a corner.", "Tap a soldier to buy a chevron."].forEach((t, i) => {
        ctx.fillText(t, L.vw / 2, cardY + 54 + i * 18);
      });
      uiButton(ctx, state, {
        id: "play",
        x: L.vw / 2 - 120,
        y: cardY + 158,
        w: 240,
        h: 48,
        label: "PLAY",
        labelSize: 24,
        fillTop: "#d5d6a0",
        fillBot: "#5c7a3a",
        lip: "#2c3c22",
        pulse: true,
        action: () => root.BOTG.openMaps(),
      });
      uiButton(ctx, state, {
        id: "armory",
        x: L.vw / 2 - 100,
        y: cardY + 214,
        w: 200,
        h: 44,
        label: "Armory",
        labelSize: 16,
        fillTop: "#ffe08a",
        fillBot: "#f0b429",
        lip: "#a86a08",
        ink: INK,
        stroke: false,
        action: () => root.BOTG.openArmory(),
      });
      drawAudioRow(ctx, state, 16, Math.min(cardY + 268, L.vh - 46), L.vw - 32, 36);
    } else {
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      label(ctx, "BOOTS ON", 28, 78, 36, "#ffe56a", "#2a3420", 7);
      label(ctx, "THE GROUND", 28, 118, 32, "#ffe56a", "#2a3420", 7);
      label(ctx, "Thirty rounds. Three maps.", 28, 156, 16, "#ffffff", INK, 3);
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
        fillTop: "#d5d6a0",
        fillBot: "#5c7a3a",
        lip: "#2c3c22",
        pulse: true,
        action: () => root.BOTG.openMaps(),
      });
      font(ctx, 14);
      ctx.fillStyle = INK;
      ctx.textAlign = "left";
      ["Plant beside the road.", "Longshots crack armor.", "Gatlings own a corner."].forEach((t, i) => {
        ctx.fillText(t, L.vw - 250, L.vh * 0.38 + 78 + i * 18);
      });
      uiButton(ctx, state, {
        id: "armory",
        x: L.vw - 250,
        y: L.vh - 108,
        w: 210,
        h: 44,
        label: "Armory",
        labelSize: 16,
        fillTop: "#ffe08a",
        fillBot: "#f0b429",
        lip: "#a86a08",
        ink: INK,
        stroke: false,
        action: () => root.BOTG.openArmory(),
      });
      drawAudioRow(ctx, state, 16, L.vh - 48, Math.min(360, L.vw - 32), 36);
    }
  }

  function drawMiniPath(ctx, map, x, y, w, h) {
    const plate = root.BOTGArt && root.BOTGArt.mapImage(map.id);
    ctx.save();
    roundPath(ctx, x, y, w, h, 12);
    ctx.clip();
    if (plate) {
      // Playfield only: header covers y<48 and the footer starts at 552. Source plates are 2x.
      const sx = 0;
      const sy = 96;
      const sw = 800;
      const sh = 1008;
      const destAspect = w / Math.max(1, h);
      const srcAspect = sw / sh;
      let cropX = sx;
      let cropY = sy;
      let cropW = sw;
      let cropH = sh;
      if (srcAspect > destAspect) {
        cropW = sh * destAspect;
        cropX = sx + (sw - cropW) / 2;
      } else {
        cropH = sw / destAspect;
        cropY = sy + (sh - cropH) / 2;
      }
      ctx.drawImage(plate, cropX, cropY, cropW, cropH, x, y, w, h);
    } else {
      const snow = map.theme === "snow";
      const desert = map.theme === "desert";
      ctx.fillStyle = snow ? "#d5e6f4" : desert ? "#e2b15a" : "#7d8a5c";
      ctx.fillRect(x, y, w, h);
    }
    ctx.restore();
    ctx.lineWidth = 3;
    ctx.strokeStyle = INK;
    strokeRound(ctx, x, y, w, h, 12);
  }

  function drawAudioRow(ctx, state, x, y, w, h) {
    const A = root.BOTGAudio;
    const gap = 6;
    const bw = Math.floor((w - gap * 2) / 3);
    const items = [
      { id: "mute", label: A.muted ? "Muted" : "Sound", on: !A.muted, go: () => A.toggle() },
      { id: "music", label: A.music ? "Music" : "No music", on: A.music && !A.muted, go: () => A.toggleMusic() },
      { id: "sfx", label: A.sfx ? "SFX" : "No SFX", on: A.sfx && !A.muted, go: () => A.toggleSfx() },
    ];
    items.forEach((item, i) => {
      uiButton(ctx, state, {
        id: "audio-" + item.id,
        x: x + i * (bw + gap),
        y: y,
        w: bw,
        h: h,
        label: item.label,
        labelSize: 13,
        fillTop: item.on ? "#c8f8a4" : "#e7e2d8",
        fillBot: item.on ? "#46c85a" : "#c9c3b6",
        lip: item.on ? "#2c3c22" : "#8d867c",
        ink: INK,
        stroke: false,
        action: item.go,
      });
    });
  }

  function drawStars(ctx, x, y, n) {
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = i < n ? "#ffe56a" : "#e4dcc8";
      ctx.strokeStyle = INK;
      ctx.lineWidth = 1.6;
      star(ctx, x + i * 18, y, 7, -0.2);
      ctx.fill();
      ctx.stroke();
    }
  }

  function drawMaps(ctx, state, L) {
    const g = ctx.createLinearGradient(0, 0, 0, L.vh);
    g.addColorStop(0, "#a8b0a4");
    g.addColorStop(0.4, "#d8d2c0");
    g.addColorStop(1, "#4a5a38");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, L.vw, L.vh);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const Save = root.BOTGSave;
    const diffId = state.difficulty || (Save && Save.data.difficulty) || "medium";
    const unlocked = (root.BOTG && root.BOTG.unlockAll && root.BOTG.unlockAll());
    const openCactus = unlocked || (Save && Save.wonAny("maple"));
    const openFrost = unlocked || (Save && Save.wonAny("cactus"));
    label(ctx, "PICK A MAP", L.portrait ? L.vw * 0.38 : L.vw / 2, L.portrait ? 30 : 22, L.portrait ? 22 : 22, "#ffe56a", "#2a3420", 6);
    const diffY = L.portrait ? 52 : 42;
    const diffH = 40;
    const names = ["easy", "medium", "hard"];
    const dw = Math.min(112, Math.floor((L.vw - 40) / 3) - 6);
    const dx0 = (L.vw - (dw * 3 + 12)) / 2;
    names.forEach((id, i) => {
      const on = diffId === id;
      uiButton(ctx, state, {
        id: "diff-" + id,
        x: dx0 + i * (dw + 6),
        y: diffY,
        w: dw,
        h: diffH,
        label: B.difficulties[id].name,
        labelSize: 15,
        fillTop: on ? "#ffe08a" : "#fff8e4",
        fillBot: on ? "#f0b429" : "#f0ddb0",
        lip: on ? "#a86a08" : "#8a6840",
        ink: INK,
        stroke: false,
        action: () => root.BOTG.setDifficulty(id),
      });
    });
    const audioH = 36;
    const audioY = L.vh - audioH - 8;
    const armoryH = 44;
    const armoryY = audioY - armoryH - 6;
    const cardsTop = diffY + diffH + 8;
    const cardsBottom = armoryY - 8;
    const maps = [B.maps.maple, B.maps.cactus, B.maps.frost];
    function card(map, x, y, w, h) {
      const locked = (map.id === "cactus" && !openCactus) || (map.id === "frost" && !openFrost);
      const stars = Save ? Save.stars(map.id) : 0;
      const best = Save ? Save.best(map.id, diffId) : 0;
      const tight = h < 210;
      fillRound(ctx, x, y + 4, w, h, 16, "rgba(0,0,0,0.18)");
      fillRound(ctx, x, y, w, h, 16, locked ? "#efe8dc" : "#fff6df");
      ctx.lineWidth = 4;
      ctx.strokeStyle = INK;
      strokeRound(ctx, x, y, w, h, 16);
      ctx.textAlign = "center";
      const nameSize = w < 200 ? 15 : tight ? 16 : (L.portrait ? 20 : 18);
      label(ctx, map.name, x + w / 2, y + (tight ? 14 : 18), nameSize, INK, null, 0);
      drawStars(ctx, x + w / 2 - 26, y + (tight ? 30 : 38), stars);
      font(ctx, 12);
      ctx.fillStyle = "#5c4630";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const note = locked
        ? (map.id === "frost" ? "Beat Desert Outpost" : "Beat Normandy Shore")
        : (best ? "Best round " + best : "No run yet");
      ctx.fillText(note, x + w / 2, y + (tight ? 44 : 54));
      const miniY = tight ? 52 : 66;
      const mapH = Math.max(28, h - (tight ? 108 : 148));
      drawMiniPath(ctx, map, x + 14, miniY + y, w - 28, mapH);
      uiButton(ctx, state, {
        id: "map-" + map.id,
        x: x + (w - Math.min(180, w - 24)) / 2,
        y: y + h - (tight ? 46 : 52),
        w: Math.min(180, w - 24),
        h: tight ? 40 : 42,
        label: locked ? "LOCKED" : "DEFEND",
        labelSize: 18,
        fillTop: locked ? "#d9d3c8" : "#d5d6a0",
        fillBot: locked ? "#c9c2b6" : "#5c7a3a",
        lip: locked ? "#8d867c" : "#2c3c22",
        disabled: locked,
        action: () => root.BOTG.startGame(map.id),
      });
    }
    if (L.portrait) {
      const gap = 8;
      const h = Math.floor((cardsBottom - cardsTop - gap * (maps.length - 1)) / maps.length);
      maps.forEach((map, i) => card(map, 14, cardsTop + i * (h + gap), L.vw - 28, h));
    } else {
      const gap = 10;
      const w = (L.vw - 28 - gap * (maps.length - 1)) / maps.length;
      const h = cardsBottom - cardsTop;
      maps.forEach((map, i) => card(map, 14 + i * (w + gap), cardsTop, w, h));
    }
    const purse = Save ? Save.data.medals || 0 : 0;
    uiButton(ctx, state, {
      id: "armory",
      x: 10,
      y: armoryY,
      w: L.vw - 20,
      h: armoryH,
      label: "Armory · " + purse + (purse === 1 ? " medal" : " medals"),
      labelSize: 16,
      fillTop: "#ffe08a",
      fillBot: "#f0b429",
      lip: "#a86a08",
      ink: INK,
      stroke: false,
      action: () => root.BOTG.openArmory(),
    });
    uiButton(ctx, state, {
      id: "maps-back",
      x: 10,
      y: audioY,
      w: 72,
      h: audioH,
      label: "Back",
      labelSize: 14,
      fillTop: "#fff8e4",
      fillBot: "#f0ddb0",
      lip: "#8a6840",
      ink: INK,
      stroke: false,
      action: () => root.BOTG.title(),
    });
    drawAudioRow(ctx, state, 90, audioY, L.vw - 102, audioH);
  }

  function drawBossHud(ctx, state, L) {
    const boss = state.enemies.find((e) => !e.dead && B.enemies[e.type] && B.enemies[e.type].boss);
    if (!boss) return;
    const def = B.enemies[boss.type];
    const w = Math.min(300, L.mapBox.w - 20);
    const x = L.mapBox.x + (L.mapBox.w - w) / 2;
    const y = L.mapBox.y + 8;
    const pct = Math.max(0, boss.hp / boss.maxHp);
    const plated = def.plates && boss.plates > 0;
    const h = plated ? 40 : 28;
    fillRound(ctx, x, y, w, h, 10, "#2a1428");
    ctx.lineWidth = 3;
    ctx.strokeStyle = INK;
    strokeRound(ctx, x, y, w, h, 10);
    fillRound(ctx, x + 6, y + 16, Math.max(8, (w - 12) * pct), 8, 4, pct > 0.4 ? "#ff5d6c" : "#ffe14a");
    if (plated) {
      const pp = Math.max(0, boss.plates / def.plates);
      fillRound(ctx, x + 6, y + 28, Math.max(8, (w - 12) * pp), 6, 3, "#c5d0da");
    }
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    label(ctx, def.name.toUpperCase(), x + w / 2, y + 9, 12, "#ffe56a", INK, 3);
  }

  function drawCoach(ctx, state, L) {
    if (!state.coach || state.screen !== "play") return;
    const step = state.started > 0 ? 2 : state.placedCount > 0 ? 1 : 0;
    const lines = [
      "Plant a Trooper on the glowing mark.",
      "Chevrons mark the march. Tap Start Round.",
      "Tap your soldier to buy a chevron.",
    ];
    const h = 72;
    const w = Math.min(360, L.mapBox.w - 16);
    const x = L.mapBox.x + 8;
    const y = L.mapBox.y + L.mapBox.h - h - 28;
    fillRound(ctx, x, y + 3, w, h, 16, "rgba(0,0,0,0.2)");
    fillRound(ctx, x, y, w, h, 16, "#fff6df");
    ctx.lineWidth = 3;
    ctx.strokeStyle = INK;
    strokeRound(ctx, x, y, w, h, 16);
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    label(ctx, "Drill " + (step + 1) + " of 3", x + 12, y + 16, 11, "#8a6840", null, 0);
    font(ctx, 13);
    const words = lines[step];
    const maxW = w - 96;
    ctx.fillStyle = INK;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    drawWrapped(ctx, words, x + 12, y + 28, maxW, 15, 2);
    uiButton(ctx, state, {
      id: "coach-skip",
      x: x + w - 76,
      y: y + (h - 44) / 2,
      w: 64,
      h: 44,
      label: step === 2 ? "Got it" : "Skip",
      labelSize: 13,
      fillTop: "#fff8e4",
      fillBot: "#f0ddb0",
      lip: "#8a6840",
      ink: INK,
      stroke: false,
      action: () => root.BOTG.finishCoach(),
    });
  }

  function drawEnd(ctx, state, L) {
    ctx.fillStyle = "rgba(8, 20, 12, 0.55)";
    ctx.fillRect(0, 0, L.vw, L.vh);
    const win = state.screen === "win";
    const r = state.result || {
      map: B.map.name,
      diff: state.difficulty || "medium",
      round: Math.max(1, state.started),
      rounds: B.waves.length,
      lives: state.lives,
      takedowns: state.takedowns || 0,
      leaked: state.leaked || 0,
      towers: state.towers.length,
      stars: 0,
      medals: 0,
      purse: 0,
    };
    const w = Math.min(380, L.vw - 20);
    const cellH = 38;
    const statsTop = 82;
    const statsEnd = statsTop + cellH * 2 + 6;
    const medalH = win ? 32 : 0;
    const retryH = 44;
    const mapsH = 40;
    const retryTop = statsEnd + 12 + medalH + (win ? 10 : 0);
    const mapsTop = retryTop + retryH + 12;
    const h = Math.min(L.vh - 16, mapsTop + mapsH + 14);
    const x = (L.vw - w) / 2;
    const y = (L.vh - h) / 2;
    fillRound(ctx, x, y + 5, w, h, 18, "rgba(0,0,0,0.25)");
    fillRound(ctx, x, y, w, h, 18, "#fff6df");
    ctx.lineWidth = 4;
    ctx.strokeStyle = INK;
    strokeRound(ctx, x, y, w, h, 18);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    label(ctx, win ? r.map + " holds!" : "The line broke", x + w / 2, y + 22, w < 340 ? 18 : 22, win ? "#3d5a28" : "#a02840", null, 0);
    const starN = Math.max(0, Math.min(3, r.stars || 0));
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = i < starN ? "#ffe56a" : "#e4dcc8";
      ctx.strokeStyle = INK;
      ctx.lineWidth = 2;
      star(ctx, x + w / 2 - 28 + i * 28, y + 48, 9, win ? state.time + i : -0.2);
      ctx.fill();
      ctx.stroke();
    }
    font(ctx, 12);
    ctx.fillStyle = "#5c4630";
    const diffName = (B.difficulties[r.diff] && B.difficulties[r.diff].name) || "Medium";
    ctx.fillText(diffName + " · " + r.map, x + w / 2, y + 70);
    const stats = [
      ["Round", r.round + "/" + r.rounds],
      ["Takedowns", String(r.takedowns || 0)],
      ["Lives", String(r.lives)],
      ["Leaked", String(r.leaked)],
    ];
    const gap = 6;
    const cellW = (w - 28 - gap) / 2;
    stats.forEach((pair, i) => {
      const cx = x + 14 + (i % 2) * (cellW + gap);
      const cy = y + statsTop + Math.floor(i / 2) * (cellH + gap);
      fillRound(ctx, cx, cy, cellW, cellH, 10, "#fff");
      ctx.lineWidth = 2;
      ctx.strokeStyle = INK;
      strokeRound(ctx, cx, cy, cellW, cellH, 10);
      ctx.textAlign = "center";
      label(ctx, pair[1], cx + cellW / 2, cy + 14, 16, INK, null, 0);
      font(ctx, 11);
      ctx.fillStyle = "#8a6840";
      ctx.fillText(pair[0], cx + cellW / 2, cy + 28);
    });
    if (win) {
      const my = y + statsEnd + 10;
      fillRound(ctx, x + 14, my, w - 28, medalH, 10, "#ffe9a0");
      ctx.lineWidth = 2;
      ctx.strokeStyle = INK;
      strokeRound(ctx, x + 14, my, w - 28, medalH, 10);
      ctx.textAlign = "center";
      label(ctx, "+" + (r.medals || 0) + " medals  ·  purse " + (r.purse || 0), x + w / 2, my + medalH / 2, 14, "#3a2208", null, 0);
    }
    const btnW = Math.min(220, w - 36);
    uiButton(ctx, state, {
      id: "retry",
      x: x + (w - btnW) / 2,
      y: y + retryTop,
      w: btnW,
      h: retryH,
      label: win ? "Defend again" : "Try again",
      labelSize: 16,
      fillTop: "#d5d6a0",
      fillBot: "#5c7a3a",
      lip: "#2c3c22",
      action: () => root.BOTG.startGame(),
    });
    uiButton(ctx, state, {
      id: "titlescreen",
      x: x + (w - 160) / 2,
      y: y + mapsTop,
      w: 160,
      h: mapsH,
      label: "Maps",
      labelSize: 16,
      fillTop: "#fff8e4",
      fillBot: "#f0ddb0",
      lip: "#8a6840",
      ink: INK,
      stroke: false,
      action: () => root.BOTG.openMaps(),
    });
  }

  function drawArmory(ctx, state, L) {
    const g = ctx.createLinearGradient(0, 0, 0, L.vh);
    g.addColorStop(0, "#a8b0a4");
    g.addColorStop(0.35, "#d8d2c0");
    g.addColorStop(1, "#4a5a38");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, L.vw, L.vh);
    const Save = root.BOTGSave;
    const purse = Save ? Save.data.medals || 0 : 0;
    const wearing = Save ? Save.skin() : "field";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    label(ctx, "ARMORY", L.vw / 2, L.portrait ? 28 : 20, L.portrait ? 28 : 22, "#ffe56a", "#2a3420", 6);
    label(ctx, purse + (purse === 1 ? " medal" : " medals"), L.vw / 2, L.portrait ? 56 : 44, 16, "#3a2208", "#fff6d0", 3);
    const kits = B.kits || [];
    const top = L.portrait ? 78 : 62;
    const backH = 44;
    const backY = L.vh - backH - 8;
    const gap = 6;
    const rowH = Math.max(48, Math.floor((backY - 8 - top - gap * (kits.length - 1)) / Math.max(1, kits.length)));
    kits.forEach((kit, i) => {
      const y = top + i * (rowH + gap);
      const owned = Save ? Save.owns(kit.id) : kit.cost === 0;
      const on = wearing === kit.id;
      fillRound(ctx, 12, y, L.vw - 24, rowH, 14, on ? "#fff4c8" : "#fff6df");
      ctx.lineWidth = 3;
      ctx.strokeStyle = INK;
      strokeRound(ctx, 12, y, L.vw - 24, rowH, 14);
      const preview = Math.min(rowH - 8, 46);
      ctx.save();
      ctx.beginPath();
      ctx.rect(14, y + 2, preview + 16, rowH - 4);
      ctx.clip();
      drawSoldier(ctx, 30, y + rowH - 4, { team: "player", role: "trooper", aim: 0.15, phase: state.time * 2 + i, scale: Math.min(1, preview / 40), skin: kit.id });
      ctx.restore();
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      const textX = 36 + preview;
      label(ctx, kit.name, textX, y + rowH * 0.36, rowH < 64 ? 14 : 16, INK, null, 0);
      font(ctx, 12);
      ctx.fillStyle = "#5c4630";
      const bw = 88;
      const note = on ? "Wearing this kit" : owned ? "Owned" : kit.blurb;
      const maxW = L.vw - 12 - bw - 20 - textX;
      let shown = note;
      while (shown.length > 4 && ctx.measureText(shown).width > maxW) shown = shown.slice(0, -2);
      if (shown !== note) shown = shown.replace(/\s+\S*$/, "") + "…";
      ctx.fillText(shown, textX, y + rowH * 0.7);
      const bh = Math.min(44, rowH - 8);
      uiButton(ctx, state, {
        id: "kit-" + kit.id,
        x: L.vw - 12 - bw - 8,
        y: y + (rowH - bh) / 2,
        w: bw,
        h: bh,
        label: on ? "Wearing" : owned ? "Wear" : ("Buy " + kit.cost),
        labelSize: 14,
        fillTop: on ? "#d9d3c8" : owned ? "#c8f8a4" : purse >= kit.cost ? "#ffe08a" : "#e7e2d8",
        fillBot: on ? "#c9c2b6" : owned ? "#46c85a" : purse >= kit.cost ? "#f0b429" : "#c9c3b6",
        lip: on ? "#8d867c" : owned ? "#2c3c22" : "#a86a08",
        ink: INK,
        stroke: false,
        disabled: on,
        action: () => root.BOTG.buyKit(kit.id),
      });
    });
    uiButton(ctx, state, {
      id: "armory-back",
      x: 12,
      y: backY,
      w: L.vw - 24,
      h: backH,
      label: "Back",
      labelSize: 16,
      fillTop: "#fff8e4",
      fillBot: "#f0ddb0",
      lip: "#8a6840",
      ink: INK,
      stroke: false,
      action: () => root.BOTG.leaveArmory(),
    });
    if (state.toast) drawToast(ctx, state, L);
  }

  function drawMargin(ctx, L) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(L.mapBox.x, L.mapBox.y, L.mapBox.w, L.mapBox.h);
    ctx.clip();
    const painted = root.BOTGArt && B.map && root.BOTGArt.mapReady(B.map.id);
    if (painted) {
      ensureTerrain();
      const scale = L.scale || 1;
      const top = L.oy;
      const h = L.worldH * scale;
      const left = L.ox;
      const right = L.ox + L.worldW * scale;
      const sy = 96;
      const sh = 1008;
      ctx.fillStyle = B.map.theme === "desert" ? "#e2b15a" : B.map.theme === "snow" ? "#d5e6f4" : GRASS;
      ctx.fillRect(L.mapBox.x, L.mapBox.y, L.mapBox.w, L.mapBox.h);
      ctx.filter = "blur(18px)";
      if (terrain && left > L.mapBox.x) {
        ctx.drawImage(terrain, 0, sy, 36, sh, L.mapBox.x - 10, top - 12, left - L.mapBox.x + 18, h + 24);
      }
      if (terrain && right < L.mapBox.x + L.mapBox.w) {
        ctx.drawImage(terrain, 764, sy, 36, sh, right - 8, top - 12, L.mapBox.x + L.mapBox.w - right + 18, h + 24);
      }
      ctx.filter = "none";
      ctx.restore();
      return;
    }
    ctx.fillStyle = B.map.theme === "desert" ? "#e2b15a" : B.map.theme === "snow" ? "#d5e6f4" : GRASS;
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
    const snow = B.map.theme === "snow";
    const desert = B.map.theme === "desert";
    spots.forEach((s) => {
      if (snow) drawSnowCap(ctx, s[0], s[1], 10);
      else if (!desert && s[2] === "bush") drawBush(ctx, s[0], s[1], 1.15);
      else drawRock(ctx, s[0], s[1], 13);
    });
    const colors = ["#ff8ab4", "#ffe56a", "#ffffff", "#ff9a3c", "#8ad4ff"];
    function scatter(x0, x1, y0, y1, n) {
      if (x1 - x0 < 24) return;
      for (let i = 0; i < n; i++) {
        const x = x0 + ((i * 47) % Math.max(1, x1 - x0));
        const y = y0 + ((i * 83) % Math.max(1, y1 - y0));
        if (snow) {
          if (i % 2 === 0) drawSnowCap(ctx, x, y, 6);
          else drawRock(ctx, x, y, 7);
        } else if (desert) {
          if (i % 2 === 0) drawRock(ctx, x, y, 8);
          else drawPebble(ctx, x, y, 3.2);
        } else if (i % 4 === 0) drawBush(ctx, x, y, 0.72);
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
    if (state.screen === "title" || state.screen === "maps" || state.screen === "armory" || state.screen === "win" || state.screen === "lose") {
      x = L.vw - tw - 8;
      y = 6;
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
    const painted = !!(root.BOTGArt && B.map && root.BOTGArt.mapReady(B.map.id));
    if (!painted && !state.reducedMotion) {
      if (B.map.theme === "snow") {
        drawSnowCap(ctx, 80 + Math.sin(state.time) * 6, 120 + (state.time * 18) % 200, 3);
        drawSnowCap(ctx, 260, 80 + (state.time * 14) % 240, 2.4);
      } else if (B.map.theme !== "desert") {
        drawButterfly(ctx, 48, 188, state.time, "#ff8ab4");
        drawButterfly(ctx, 250, 430, state.time + 2, "#ffe56a");
      }
      drawBirds(ctx, state);
      drawMotes(ctx, state);
    }
    drawChevrons(ctx, state);

    if (state.ghost) {
      const stats = B.statsFor(state.ghost.type, 0);
      drawRange(ctx, state.ghost.x, state.ghost.y, stats.range, state.ghost.valid);
    } else if (state.screen === "play") {
      const selected = state.towers.find((t) => t.id === state.selectedId);
      if (selected && !state.placing) {
        drawRange(ctx, selected.x, selected.y, B.statsFor(selected.type, selected.ranks).range, true);
      } else if (state.hoverTowerId && !state.placing) {
        const hov = state.towers.find((t) => t.id === state.hoverTowerId);
        if (hov) drawRange(ctx, hov.x, hov.y, B.statsFor(hov.type, hov.ranks).range, true);
      }
    }

    const items = [];
    if (!painted) {
      mapProps().forEach((p) => {
        items.push({
          y: p.y,
          draw: () => {
            if (p.kind === "fence") drawFence(ctx, p.x, p.y, p.w);
            else if (p.kind === "bush") drawBush(ctx, p.x, p.y, 1);
            else if (p.kind === "rock") drawRock(ctx, p.x, p.y, 11);
            else if (p.kind === "bags") drawBags(ctx, p.x, p.y);
            else if (p.kind === "crate") drawCrate(ctx, p.x, p.y);
            else if (p.kind === "snowman") drawSnowman(ctx, p.x, p.y);
          },
        });
      });
      (B.map.trees || []).forEach((tree) => {
        items.push({
          y: tree.y,
          draw: () => (tree.style === "cactus" ? drawCactus(ctx, tree, state.time) : tree.style === "pine" ? drawPine(ctx, tree) : drawTree(ctx, tree, state.time)),
        });
      });
    }
    state.towers.forEach((tower) => {
      items.push({
        y: tower.y,
        draw: () => {
          const hot = state.selectedId === tower.id || state.hoverTowerId === tower.id;
          if (hot) drawSelect(ctx, state, tower.x, tower.y);
          const ability = B.abilityFor && B.abilityFor(tower.type, tower.ranks);
          if (ability) {
            const left = Math.max(0, tower.abilityCd || 0);
            const ready = left <= 0;
            const frac = ready ? 1 : 1 - Math.min(1, left / ability.cd);
            ctx.save();
            ctx.translate(tower.x, tower.y + 18);
            ctx.lineWidth = 3;
            ctx.strokeStyle = "rgba(40, 30, 10, 0.35)";
            ctx.beginPath();
            ctx.arc(0, 0, 20, 0, Math.PI * 2);
            ctx.stroke();
            ctx.strokeStyle = ready ? "#ffe08a" : "#f0a020";
            ctx.beginPath();
            ctx.arc(0, 0, 20, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * frac);
            ctx.stroke();
            ctx.restore();
          }
          drawSoldier(ctx, tower.x, tower.y, {
            team: "player",
            role: tower.type,
            aim: tower.aim,
            phase: tower.phase + tower.id,
            scale: 1,
            flash: tower.flash,
            spin: tower.spin,
            rank: Math.min(3, B.chevronsUsed ? B.chevronsUsed(tower.type, tower.ranks) : tower.rank || 0),
            chevrons: B.chevronsUsed ? B.chevronsUsed(tower.type, tower.ranks) : (tower.rank || 0),
            ranks: tower.ranks,
            badge: B.statsFor(tower.type, tower.ranks).badge,
            idle: !tower.targetId,
          });
        },
      });
    });
    state.enemies.forEach((e) => {
      if (e.dead && !(e.dying > 0)) return;
      items.push({
        y: e.y,
        draw: () => {
          const dying = e.dead && e.dying > 0;
          ctx.save();
          if (dying) {
            const k = 1 - e.dying / 0.42;
            ctx.translate(e.x, e.y);
            ctx.rotate(k * 1.2 * (e.id % 2 ? 1 : -1));
            ctx.scale(1 + k * 0.2, Math.max(0.2, 1 - k * 0.75));
            ctx.globalAlpha = Math.max(0, 1 - k);
            ctx.translate(-e.x, -e.y);
          }
          if (!dying && (e.type === "scout" || e.type === "dash" || e.type === "moto" || e.type === "outrider" || e.type === "jeep" || e.type === "halftrack")) drawDust(ctx, e, state.time);
          if (!dying && e.falling > 0) drawChute(ctx, e);
          if (e.type === "jeep" || e.type === "halftrack") drawJeep(ctx, e);
          else if (e.type === "tank" || e.type === "ironjaw") drawTank(ctx, e, state.time);
          else if (e.type === "ram") drawRam(ctx, e, state.time);
          else if (e.type === "blimp") drawBlimp(ctx, e, state.time);
          else if (e.type === "gnat") drawGnat(ctx, e);
          else {
            const roles = { moto: "scout", plate: "heavy", vex: "heavy", outrider: "dash", marksman: "camo", stick: "para" };
            const role = roles[e.type] || e.type;
            const illustrated = !!(root.BOTGArt && root.BOTGArt.has(role));
            const bossScale = e.type === "vex" ? 1.45 : 1;
            drawSoldier(ctx, e.x, e.y, {
              team: "enemy",
              role: role,
              aim: e.angle,
              phase: e.phase,
              scale: illustrated ? bossScale : B.enemies[e.type].scale,
              flash: e.flash,
              slow: e.slow,
              revealed: e.revealed,
              shield: e.shieldMax ? e.shieldHp / e.shieldMax : null,
            });
          }
          if (!dying && e.plates > 0) {
            ctx.strokeStyle = "rgba(190,206,218,0.85)";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(e.x, e.y - 8, (e.radius || 16) + 4, 0, Math.PI * 2);
            ctx.stroke();
          }
          if (!dying && e.shieldMax && e.shieldHp > 0) {
            const bw = 16;
            const bx = e.x - bw / 2;
            const by = e.y - 46;
            ctx.fillStyle = "rgba(20,16,12,0.45)";
            ctx.fillRect(bx, by, bw, 3);
            ctx.fillStyle = "#9ec4ff";
            ctx.fillRect(bx, by, bw * (e.shieldHp / e.shieldMax), 3);
          }
          if (!dying && e.flash > 0.05) {
            ctx.strokeStyle = "rgba(255,255,255," + Math.min(0.9, e.flash * 4) + ")";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(e.x, e.y - 10, e.radius + 3, 0, Math.PI * 2);
            ctx.stroke();
          }
          ctx.restore();
        },
      });
    });
    items.sort((a, b) => a.y - b.y);
    items.forEach((item) => item.draw());

    if (state.ghost) {
      const ring = state.ghost.valid ? "#d5d6a0" : "#ff6a6a";
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

  function drawAbilityBar(ctx, state, L) {
    const tower = state.towers.find((t) => t.id === state.selectedId);
    if (!tower || state.placing || !B.abilityFor) return;
    const spec = B.abilityFor(tower.type, tower.ranks);
    if (!spec) return;
    const cd = tower.abilityCd || 0;
    const ready = cd <= 0;
    const stamp = 148;
    const w = Math.min(220, Math.max(156, L.mapBox.w - stamp - 16));
    const h = 44;
    const x = L.mapBox.x + 8;
    const y = L.mapBox.y + L.mapBox.h - h - 8;
    uiButton(ctx, state, {
      id: "ability",
      x: x,
      y: y,
      w: w,
      h: h,
      label: spec.name,
      sub: ready ? "Tap to use" : Math.ceil(cd) + "s",
      labelSize: 16,
      subSize: 11,
      ink: "#3a2208",
      stroke: "#fff6d0",
      fillTop: ready ? "#ffe08a" : "#d9d3c8",
      fillBot: ready ? "#f0a020" : "#c9c2b6",
      lip: ready ? "#a86a08" : "#8d867c",
      pulse: ready,
      action: () => root.BOTG.useAbility(),
    });
  }

  function paperGrain(ctx, L) {
    const rand = mulberry32(7);
    ctx.save();
    ctx.globalCompositeOperation = "multiply";
    ctx.fillStyle = "rgba(118, 116, 96, 0.05)";
    ctx.fillRect(0, 0, L.vw, L.vh);
    ctx.globalCompositeOperation = "source-over";
    for (let i = 0; i < 420; i++) {
      const x = rand() * L.vw;
      const y = rand() * L.vh;
      ctx.fillStyle = "rgba(40, 44, 32, " + (0.035 + rand() * 0.06) + ")";
      ctx.fillRect(x, y, 1.5, 1.5);
    }
    const vg = ctx.createRadialGradient(L.vw / 2, L.vh / 2, L.vh * 0.28, L.vw / 2, L.vh / 2, L.vh * 0.72);
    vg.addColorStop(0, "rgba(0,0,0,0)");
    vg.addColorStop(1, "rgba(24, 28, 18, 0.14)");
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, L.vw, L.vh);
    ctx.strokeStyle = "#3a2a1c";
    ctx.lineWidth = 5;
    ctx.strokeRect(2, 2, L.vw - 4, L.vh - 4);
    ctx.lineWidth = 1.4;
    ctx.strokeRect(8, 8, L.vw - 16, L.vh - 16);
    [[14, 14, 1, 1], [L.vw - 14, 14, -1, 1], [14, L.vh - 14, 1, -1], [L.vw - 14, L.vh - 14, -1, -1]].forEach(function (c) {
      ctx.beginPath();
      ctx.moveTo(c[0], c[1] + c[3] * 10);
      ctx.quadraticCurveTo(c[0] + c[2] * 8, c[1] + c[3] * 8, c[0] + c[2] * 10, c[1]);
      ctx.stroke();
    });
    ctx.restore();
  }

  function drawLoading(ctx, L) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "#b7b09a";
    ctx.fillRect(0, 0, L.vw, L.vh);
    const w = Math.min(300, L.vw - 28);
    const h = 128;
    const x = (L.vw - w) / 2;
    const y = (L.vh - h) / 2;
    fillRound(ctx, x, y, w, h, 16, "#f3ead4");
    ctx.lineWidth = 5;
    ctx.strokeStyle = "#3a2a1c";
    strokeRound(ctx, x, y, w, h, 16);
    ctx.lineWidth = 1.4;
    strokeRound(ctx, x + 6, y + 6, w - 12, h - 12, 12);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    label(ctx, "BOOTS ON THE GROUND", L.vw / 2, y + 46, 15, "#2a2118", null, 0);
    label(ctx, "Painting the maps…", L.vw / 2, y + 82, 13, "#6a5030", null, 0);
  }

  function draw(ctx, state) {
    const L = state.layout;
    if (!L) return;
    if (root.BOTGArt && !root.BOTGArt.ready()) {
      state.hotspots = [];
      drawLoading(ctx, L);
      return;
    }
    state.hotspots = [];
    const shopping = state.screen === "play" && !state.selectedId;
    if (shopping && state._shopOn !== true) state.shopIn = state.time || 0;
    state._shopOn = shopping;
    const mag = state.reducedMotion ? 0 : Math.min(6, state.shake || 0);
    const jx = mag ? (Math.random() - 0.5) * mag * (state.cssScaleX || 1) : 0;
    const jy = mag ? (Math.random() - 0.5) * mag * (state.cssScaleY || 1) : 0;
    ctx.setTransform(state.cssScaleX || 1, 0, 0, state.cssScaleY || 1, jx, jy);
    ctx.imageSmoothingEnabled = true;
    try { ctx.imageSmoothingQuality = "high"; } catch (err) { /* ignore */ }
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    const ground = state.screen === "play" && B.map.theme === "desert" ? "#e2b15a" : state.screen === "play" && B.map.theme === "snow" ? "#d5e6f4" : GRASS;
    ctx.fillStyle = ground;
    ctx.fillRect(-30, -30, L.vw + 60, L.vh + 60);

    if (state.screen === "title") {
      drawTitle(ctx, state, L);
      drawBuild(ctx, state, L);
    } else if (state.screen === "maps") {
      drawMaps(ctx, state, L);
      drawBuild(ctx, state, L);
    } else if (state.screen === "armory") {
      drawArmory(ctx, state, L);
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
      ctx.save();
      ctx.beginPath();
      ctx.rect(L.mapBox.x, L.mapBox.y, L.mapBox.w, L.mapBox.h);
      ctx.clip();
      const cx = L.mapBox.x + L.mapBox.w / 2;
      const cy = L.mapBox.y + L.mapBox.h / 2;
      const vg = ctx.createRadialGradient(cx, cy, L.mapBox.w * 0.2, cx, cy, L.mapBox.w * 0.75);
      vg.addColorStop(0, "rgba(0,0,0,0)");
      vg.addColorStop(1, "rgba(40, 24, 12, 0.12)");
      ctx.fillStyle = vg;
      ctx.fillRect(L.mapBox.x, L.mapBox.y, L.mapBox.w, L.mapBox.h);
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
        drawCoach(ctx, state, L);
        drawAbilityBar(ctx, state, L);
        drawPanel(ctx, state, L);
        drawBanner(ctx, state, L);
        drawBossHud(ctx, state, L);
        drawToast(ctx, state, L);
      } else {
        drawEnd(ctx, state, L);
      }
      drawBuild(ctx, state, L);
    }

    paperGrain(ctx, L);

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
