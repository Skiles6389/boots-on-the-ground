// Rubber-hose soldiers for Boots on the Ground.
// 1930s hand-inked cartoon: noodle limbs, pie-cut eyes, white gloves,
// thick-thin outlines. No studio characters. Skins tint the friendly cloth.
(function (root) {
  const INK = "#2a2118";
  const GLOVE = "#f4efe4";
  const SKIN = "#f0c9a0";

  const FRIEND = {
    cloth: "#5d6b3a",
    clothDk: "#3e4a28",
    helm: "#4a5530",
    belt: "#c4a15a",
    boot: "#4a3424",
  };
  const FOE = {
    cloth: "#8d3a32",
    clothDk: "#5c241e",
    helm: "#2c241c",
    belt: "#c4a15a",
    boot: "#2a1c16",
  };

  const KITS = {
    parade: { cloth: "#6e7a3a", clothDk: "#4a5428", helm: "#5a6230", belt: "#e2c56a" },
    night: { cloth: "#2e4030", clothDk: "#1c2820", helm: "#243028", belt: "#8a7048" },
    sand: { cloth: "#b59262", clothDk: "#7a6240", helm: "#8a6844", belt: "#5c4030" },
    dress: { cloth: "#3a5278", clothDk: "#24344e", helm: "#2a3c58", belt: "#e2c56a" },
  };

  function palFor(team, role, skinId) {
    const base = team === "enemy" ? FOE : FRIEND;
    const id = skinId || ((root.BOTGSave && root.BOTGSave.skin && root.BOTGSave.skin()) || "field");
    const extra = team === "enemy" ? null : KITS[id];
    const pal = Object.assign({}, base, extra || {});
    if (team === "enemy" && (role === "heavy" || role === "brute" || role === "bulwark")) {
      pal.cloth = "#6e2c28";
      pal.clothDk = "#401816";
    }
    if (team === "enemy" && role === "camo") {
      pal.cloth = "#5a6238";
      pal.clothDk = "#3a4024";
    }
    return pal;
  }

  function qPts(x0, y0, cx, cy, x1, y1, n) {
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const u = 1 - t;
      pts.push({
        x: u * u * x0 + 2 * u * t * cx + t * t * x1,
        y: u * u * y0 + 2 * u * t * cy + t * t * y1,
      });
    }
    return pts;
  }

  function hose(ctx, x0, y0, cx, cy, x1, y1, w, fill) {
    const pts = qPts(x0, y0, cx, cy, x1, y1, 7);
    const left = [];
    const right = [];
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      const q = pts[Math.min(pts.length - 1, i + 1)];
      const dx = q.x - p.x;
      const dy = q.y - p.y;
      const len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len;
      const ny = dx / len;
      const taper = 0.55 + 0.45 * Math.sin((i / (pts.length - 1)) * Math.PI);
      const ww = w * taper;
      left.push([p.x + nx * ww, p.y + ny * ww]);
      right.push([p.x - nx * ww, p.y - ny * ww]);
    }
    ctx.beginPath();
    ctx.moveTo(left[0][0], left[0][1]);
    for (let i = 1; i < left.length; i++) ctx.lineTo(left[i][0], left[i][1]);
    for (let i = right.length - 1; i >= 0; i--) ctx.lineTo(right[i][0], right[i][1]);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.7;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.stroke();
  }

  function blob(ctx, x, y, rx, ry, fill, rot) {
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, rot || 0, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.8;
    ctx.stroke();
  }

  function glove(ctx, x, y, s) {
    blob(ctx, x, y, 3.2 * s, 2.6 * s, GLOVE, 0);
    ctx.fillStyle = GLOVE;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.ellipse(x - 1.6 * s + i * 1.5 * s, y - 2.4 * s, 0.7 * s, 1.3 * s, -0.2 + i * 0.15, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  }

  function boot(ctx, x, y, pal) {
    blob(ctx, x, y, 3.4, 2.1, pal.boot, 0.2);
  }

  function pieEye(ctx, x, y, r, angry) {
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#f7f1e4";
    ctx.beginPath();
    ctx.moveTo(x, y);
    const a0 = angry ? -0.2 : 0.15;
    const a1 = angry ? 1.15 : 1.35;
    ctx.arc(x, y, r + 0.2, a0, a1);
    ctx.closePath();
    ctx.fill();
  }

  function brow(ctx, x, y, angry) {
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.3;
    ctx.lineCap = "round";
    ctx.beginPath();
    if (angry) {
      ctx.moveTo(x - 3.2, y - 1.2);
      ctx.quadraticCurveTo(x, y + 1.4, x + 3.2, y - 0.4);
    } else {
      ctx.moveTo(x - 3, y);
      ctx.quadraticCurveTo(x, y - 1.6, x + 3, y - 0.2);
    }
    ctx.stroke();
  }

  function head(ctx, x, y, r, pal, enemy) {
    blob(ctx, x, y - r - 1.2, r + 1.6, r * 0.72, pal.helm, 0);
    blob(ctx, x, y, r, r * 0.92, SKIN, 0);
    if (enemy) {
      ctx.strokeStyle = INK;
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(x - r * 0.7, y + r * 0.15);
      ctx.quadraticCurveTo(x, y + r * 0.55, x + r * 0.75, y + r * 0.1);
      ctx.stroke();
      ctx.fillStyle = INK;
      ctx.beginPath();
      ctx.ellipse(x - r * 0.15, y + r * 0.42, r * 0.55, r * 0.22, 0.1, 0, Math.PI);
      ctx.fill();
    } else {
      ctx.strokeStyle = "#a85a48";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(x, y + r * 0.35, r * 0.28, 0.15, Math.PI - 0.15);
      ctx.stroke();
    }
    pieEye(ctx, x - r * 0.32, y - r * 0.08, r * 0.28, enemy);
    pieEye(ctx, x + r * 0.32, y - r * 0.05, r * 0.26, enemy);
    brow(ctx, x - r * 0.32, y - r * 0.42, enemy);
    brow(ctx, x + r * 0.32, y - r * 0.4, enemy);
  }

  function shadow(ctx, rx) {
    ctx.fillStyle = "rgba(60, 40, 20, 0.22)";
    ctx.beginPath();
    ctx.ellipse(0, 2, rx, 3.2, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  function body(ctx, pal, bulk) {
    blob(ctx, 0, -14, 7.2 * bulk, 8.2, pal.cloth, 0);
    ctx.fillStyle = pal.clothDk;
    ctx.beginPath();
    ctx.ellipse(-2.2, -16, 2.4, 3.2, -0.4, 0, Math.PI * 2);
    ctx.fill();
    blob(ctx, 0, -8.5, 6.2 * bulk, 1.5, pal.belt, 0);
  }

  function legs(ctx, pal, phase, enemy) {
    const s = Math.sin(phase * (enemy ? 1.4 : 1));
    hose(ctx, -2, -6, -6 - s * 3, -2, -4 - s * 4, 0, 2.1, pal.clothDk);
    hose(ctx, 2, -6, 6 + s * 3, -2, 4 + s * 4, 0, 2.1, pal.cloth);
    boot(ctx, -4 - s * 4, 1, pal);
    boot(ctx, 4 + s * 4, 1, pal);
  }

  function arms(ctx, pal, phase, enemy) {
    const s = Math.sin(phase);
    hose(ctx, -4, -16, -10, -12 + s * 2, -8, -8, 1.8, pal.cloth);
    glove(ctx, -8, -8, 0.85);
    hose(ctx, 4, -16, 9, -14 - s, 11, -10, 1.8, pal.clothDk);
    glove(ctx, 11, -10, 0.85);
  }

  function gun(ctx, len, up) {
    ctx.save();
    ctx.rotate(up || 0);
    ctx.fillStyle = "#3a342c";
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, -1.3);
    ctx.quadraticCurveTo(len * 0.5, -2.2, len, -0.6);
    ctx.lineTo(len, 1.1);
    ctx.quadraticCurveTo(len * 0.4, 1.6, 0, 1.3);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  function gearMarks(ctx, ranks) {
    if (!ranks) return;
    const keys = Object.keys(ranks);
    let total = 0;
    keys.forEach(function (k) { total += ranks[k] || 0; });
    if (!total) return;
    if (total >= 1) blob(ctx, -6, -12, 2.2, 1.6, "#c4a15a", 0.4);
    if (total >= 3) {
      ctx.strokeStyle = "#e2c56a";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(0, -24, 6.2, Math.PI * 1.1, Math.PI * 1.9);
      ctx.stroke();
    }
    if (total >= 5) {
      ctx.fillStyle = "#e2c56a";
      ctx.strokeStyle = INK;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(6, -20);
      ctx.lineTo(7.2, -17.2);
      ctx.lineTo(6, -17.8);
      ctx.lineTo(4.8, -17.2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    if (total >= 7) blob(ctx, -7, -18, 2.4, 3, "#6a5434", 0);
  }

  function standFigure(ctx, pal, enemy, phase, bulk) {
    shadow(ctx, 8 * (bulk || 1));
    legs(ctx, pal, phase, enemy);
    body(ctx, pal, bulk || 1);
    arms(ctx, pal, phase, enemy);
    head(ctx, 0.4, -24, enemy ? 6.4 : 6.1, pal, enemy);
  }

  function draw(ctx, x, y, opt) {
    const role = opt.role || (opt.team === "enemy" ? "grunt" : "trooper");
    const team = opt.team || "player";
    const enemy = team === "enemy";
    const pal = palFor(team, role, opt.skin);
    const aim = opt.aim || 0;
    const face = Math.cos(aim) >= 0 ? 1 : -1;
    const sc = opt.scale || 1;
    const ph = opt.phase || 0;
    const beat = Math.sin(ph * 1.2);
    const squash = 1 + beat * (enemy ? 0.07 : 0.1);
    const stretch = 1 - beat * (enemy ? 0.05 : 0.08);
    const recoil = opt.flash > 0.02 ? 1 - opt.flash * 0.35 : 1;
    const hidden = (role === "sneak" || role === "camo") && !opt.revealed;

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(face * sc * squash * recoil, sc * stretch * (1 + (opt.flash || 0) * 0.2));
    if (hidden) ctx.globalAlpha = role === "camo" ? 0.28 : 0.4;

    if (!enemy && role === "longshot") {
      shadow(ctx, 16);
      hose(ctx, -8, -4, -2, -2, 8, -3, 2.4, pal.cloth);
      blob(ctx, -2, -6, 8, 3.2, pal.cloth, 0.05);
      head(ctx, 6, -8, 4.6, pal, false);
      ctx.save();
      ctx.translate(4, -6);
      gun(ctx, 22, -0.05);
      ctx.restore();
      glove(ctx, 8, -5, 0.7);
    } else if (!enemy && role === "gatling") {
      shadow(ctx, 11);
      legs(ctx, pal, ph * 0.4, false);
      blob(ctx, 0, -12, 8, 6, pal.cloth, 0);
      head(ctx, -1, -20, 5.4, pal, false);
      ctx.save();
      ctx.translate(4, -14);
      for (let i = -1; i <= 1; i++) {
        ctx.save();
        ctx.rotate(i * 0.18);
        gun(ctx, 14, 0);
        ctx.restore();
      }
      ctx.restore();
      glove(ctx, 6, -12, 0.8);
    } else if (!enemy && role === "mortar") {
      shadow(ctx, 10);
      legs(ctx, pal, ph * 0.3, false);
      blob(ctx, -1, -11, 7, 5.5, pal.cloth, 0.2);
      head(ctx, -2, -18, 5.2, pal, false);
      ctx.save();
      ctx.translate(2, -14);
      gun(ctx, 12, -1.05);
      blob(ctx, 4, -10, 3.2, 2.2, "#6a5434", 0);
      ctx.restore();
    } else if (!enemy && role === "tread") {
      shadow(ctx, 14);
      blob(ctx, -8, -2, 5, 3.2, "#3a342c", 0);
      blob(ctx, 8, -2, 5, 3.2, "#3a342c", 0);
      blob(ctx, 0, -8, 12, 5.5, pal.cloth, 0);
      head(ctx, -4, -14, 4.4, pal, false);
      ctx.save();
      ctx.translate(2, -9);
      gun(ctx, 14, -0.15);
      ctx.restore();
    } else if (!enemy && role === "engineer") {
      standFigure(ctx, pal, false, ph, 0.95);
      blob(ctx, -9, -4, 3.4, 2.2, "#c4a15a", 0.3);
      blob(ctx, 8, -4, 3.2, 2, "#d2b48a", -0.2);
      hose(ctx, 4, -16, 10, -18, 12, -14, 1.5, pal.cloth);
      blob(ctx, 13, -14, 2.4, 1.2, "#8a8680", 0.6);
    } else if (!enemy && role === "sky") {
      standFigure(ctx, pal, false, ph * 0.5, 1);
      ctx.save();
      ctx.translate(2, -22);
      gun(ctx, 11, -1.2);
      gun(ctx, 9, -0.85);
      ctx.restore();
    } else if (!enemy && role === "chopper") {
      shadow(ctx, 10);
      blob(ctx, 0, -3, 9, 2.4, "#6a5434", 0);
      const spin = opt.spin || ph;
      const bx = Math.cos(spin) * 4;
      blob(ctx, bx, -18, 8, 4.2, pal.cloth, 0);
      head(ctx, bx, -24, 4.4, pal, false);
      ctx.strokeStyle = INK;
      ctx.lineWidth = 2.2;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(bx - 16, -30);
      ctx.quadraticCurveTo(bx, -34, bx + 16, -28);
      ctx.moveTo(bx - 14, -26);
      ctx.quadraticCurveTo(bx, -22, bx + 14, -27);
      ctx.stroke();
    } else if (!enemy && role === "trooper") {
      standFigure(ctx, pal, false, ph, 1);
      ctx.save();
      ctx.translate(6, -16);
      gun(ctx, 12, -0.15);
      ctx.restore();
    } else if (role === "riot" || role === "bulwark") {
      standFigure(ctx, pal, true, ph, role === "bulwark" ? 1.15 : 1.02);
      const frac = opt.shield == null ? 1 : opt.shield;
      if (frac > 0.02) {
        blob(ctx, 8, -16, role === "bulwark" ? 4.2 : 3, role === "bulwark" ? 9 : 7, "#d7d2c6", 0.1);
        if (frac < 0.66) {
          ctx.strokeStyle = INK;
          ctx.lineWidth = 1.1;
          ctx.beginPath();
          ctx.moveTo(6, -20);
          ctx.quadraticCurveTo(9, -16, 7, -11);
          ctx.stroke();
        }
      }
    } else if (role === "medic") {
      standFigure(ctx, pal, true, ph, 1);
      ctx.strokeStyle = "#f4efe4";
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(-1, -18);
      ctx.lineTo(-1, -12);
      ctx.moveTo(-4, -15);
      ctx.lineTo(2, -15);
      ctx.stroke();
    } else if (role === "dash") {
      standFigure(ctx, pal, true, ph * 1.7, 0.86);
      ctx.strokeStyle = "#e2c56a";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-4, -12);
      ctx.quadraticCurveTo(0, -14, 5, -11);
      ctx.stroke();
      ctx.strokeStyle = INK;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-12, -18);
      ctx.lineTo(-18, -17);
      ctx.moveTo(-11, -14);
      ctx.lineTo(-17, -12);
      ctx.stroke();
    } else if (role === "para") {
      standFigure(ctx, pal, true, ph * 0.6, 1);
      ctx.strokeStyle = "#f4efe4";
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(-3, -28);
      ctx.quadraticCurveTo(0, -34, 3, -28);
      ctx.stroke();
    } else if (role === "scout" || role === "moto") {
      standFigure(ctx, pal, true, ph * 1.5, 0.82);
    } else if (role === "heavy" || role === "brute") {
      standFigure(ctx, pal, true, ph * 0.7, 1.2);
    } else {
      standFigure(ctx, pal, enemy, ph, enemy ? 1 : 1);
      if (!enemy) {
        ctx.save();
        ctx.translate(6, -16);
        gun(ctx, 11, -0.1);
        ctx.restore();
      }
    }

    if (!hidden) gearMarks(ctx, opt.ranks);
    if (role === "camo" && opt.revealed) {
      ctx.fillStyle = "#6a7048";
      ctx.beginPath();
      ctx.ellipse(-2, -14, 3, 2, 0.4, 0, Math.PI * 2);
      ctx.ellipse(3, -10, 2.4, 1.6, -0.3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  root.BOTGSoldier = { draw: draw };

  root.BOTGAimOrigin = function (x, y, role) {
    if (role === "longshot") return { x: x + 8, y: y - 6 };
    if (role === "gatling") return { x: x, y: y - 14 };
    if (role === "mortar") return { x: x, y: y - 16 };
    if (role === "tread") return { x: x, y: y - 9 };
    if (role === "sky") return { x: x, y: y - 20 };
    if (role === "chopper") return { x: x, y: y - 16 };
    return { x: x, y: y - 16 };
  };

  root.BOTGMuzzle = function (x, y, role, aim) {
    const len = role === "longshot" ? 26 : role === "gatling" ? 16 : role === "mortar" ? 8 : 14;
    const o = root.BOTGAimOrigin(x, y, role);
    return { x: o.x + Math.cos(aim) * len, y: o.y + Math.sin(aim) * len * 0.35 };
  };
})(typeof window !== "undefined" ? window : globalThis);
