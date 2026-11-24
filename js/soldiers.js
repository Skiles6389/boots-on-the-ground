// Fallback ink soldiers, used only if a plate is missing. Big heads, field caps,
// and a different silhouette for every tower and every Scowl Corps type.
(function (root) {
  const INK = "#14100c";
  const GLOVE = "#f6f1e6";
  const SKIN = "#efc39a";

  const FRIEND = { cloth: "#5c6a3c", clothDk: "#3c4a28", helm: "#4d5a34", belt: "#c6a25c", boot: "#3a2a1c" };
  const FOE = { cloth: "#8d3a32", clothDk: "#5c221c", helm: "#241810", belt: "#c6a25c", boot: "#24160f" };
  const KITS = {
    parade: { cloth: "#6d7a38", clothDk: "#465028", helm: "#5a642e", belt: "#e2c56a" },
    night: { cloth: "#2c3c2e", clothDk: "#182018", helm: "#243028", belt: "#8a7048" },
    sand: { cloth: "#b59262", clothDk: "#7a5e3c", helm: "#8d6a42", belt: "#5c4030" },
    dress: { cloth: "#3a5278", clothDk: "#24344e", helm: "#2c4060", belt: "#e2c56a" },
  };

  function palFor(team, role, skinId) {
    const id = skinId || ((root.BOTGSave && root.BOTGSave.skin && root.BOTGSave.skin()) || "field");
    const pal = Object.assign({}, team === "enemy" ? FOE : FRIEND, team === "enemy" ? null : KITS[id]);
    return pal;
  }

  function qPts(x0, y0, cx, cy, x1, y1, n) {
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const u = 1 - t;
      pts.push({ x: u * u * x0 + 2 * u * t * cx + t * t * x1, y: u * u * y0 + 2 * u * t * cy + t * t * y1 });
    }
    return pts;
  }

  function hose(ctx, x0, y0, cx, cy, x1, y1, w, fill) {
    const pts = qPts(x0, y0, cx, cy, x1, y1, 8);
    ctx.beginPath();
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      const q = pts[Math.min(pts.length - 1, i + 1)];
      const dx = q.x - p.x;
      const dy = q.y - p.y;
      const len = Math.hypot(dx, dy) || 1;
      const taper = 0.42 + 0.7 * Math.sin((i / (pts.length - 1)) * Math.PI);
      const ww = w * taper;
      const x = p.x + (-dy / len) * ww;
      const y = p.y + (dx / len) * ww;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    for (let i = pts.length - 1; i >= 0; i--) {
      const p = pts[i];
      const q = pts[Math.min(pts.length - 1, i + 1)];
      const dx = q.x - p.x;
      const dy = q.y - p.y;
      const len = Math.hypot(dx, dy) || 1;
      const taper = 0.42 + 0.7 * Math.sin((i / (pts.length - 1)) * Math.PI);
      const ww = w * taper;
      ctx.lineTo(p.x - (-dy / len) * ww, p.y - (dx / len) * ww);
    }
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.4;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.stroke();
  }

  function blob(ctx, x, y, rx, ry, fill, rot) {
    ctx.beginPath();
    ctx.ellipse(x, y, Math.max(0.6, rx), Math.max(0.6, ry), rot || 0, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.3;
    ctx.stroke();
  }

  function glove(ctx, x, y, s) {
    blob(ctx, x, y, 3.4 * s, 2.8 * s, GLOVE, 0);
    ctx.fillStyle = GLOVE;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.4;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.ellipse(x - 1.8 * s + i * 1.6 * s, y - 2.6 * s, 0.75 * s, 1.45 * s, -0.3 + i * 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  }

  function eye(ctx, x, y, r, angry) {
    ctx.fillStyle = "#f7f1e4";
    ctx.beginPath();
    ctx.ellipse(x, y, r * 1.15, r, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.arc(x + (angry ? 0.4 : 0.6), y + 0.2, r * 0.55, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#f7f1e4";
    ctx.beginPath();
    ctx.arc(x + r * 0.15, y - r * 0.2, r * 0.18, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    if (angry) {
      ctx.moveTo(x - r * 1.3, y - r * 1.1);
      ctx.quadraticCurveTo(x, y - r * 0.2, x + r * 1.3, y - r * 0.9);
    } else {
      ctx.moveTo(x - r * 1.2, y - r * 0.7);
      ctx.quadraticCurveTo(x, y - r * 1.5, x + r * 1.2, y - r * 0.6);
    }
    ctx.stroke();
  }

  function m1(ctx, x, y, r, pal) {
    blob(ctx, x, y + r * 0.15, r * 1.25, r * 0.38, pal.helm, 0);
    blob(ctx, x, y - r * 0.45, r, r * 0.85, pal.helm, 0);
    ctx.fillStyle = "rgba(244, 236, 214, 0.55)";
    ctx.beginPath();
    ctx.ellipse(x - r * 0.28, y - r * 0.7, r * 0.38, r * 0.16, -0.7, 0, Math.PI * 2);
    ctx.fill();
  }

  function fieldCap(ctx, x, y) {
    ctx.fillStyle = "#1a120c";
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - 11, y + 1);
    ctx.quadraticCurveTo(x - 9, y - 9, x - 1, y - 2);
    ctx.quadraticCurveTo(x + 8, y - 10, x + 12, y + 1);
    ctx.quadraticCurveTo(x, y + 4, x - 11, y + 1);
    ctx.fill();
    ctx.stroke();
    blob(ctx, x + 1, y - 1, 1.6, 1.6, "#c6a25c", 0);
  }

  function kepi(ctx, x, y) {
    blob(ctx, x, y + 1, 6.5, 1.8, "#2a2118", 0);
    blob(ctx, x + 1, y - 3, 4.2, 3.2, "#3a2a1c", -0.2);
  }

  function hood(ctx, x, y) {
    blob(ctx, x, y - 2, 8.2, 7.4, "#3a221c", 0);
    ctx.fillStyle = "#2a1814";
    ctx.beginPath();
    ctx.ellipse(x, y + 1, 5, 3.2, 0, 0, Math.PI);
    ctx.fill();
  }

  function face(ctx, x, y, r, enemy) {
    blob(ctx, x, y, r, r * 0.95, SKIN, 0);
    eye(ctx, x - r * 0.34, y - r * 0.08, r * 0.28, enemy);
    eye(ctx, x + r * 0.32, y - r * 0.02, r * 0.26, enemy);
    ctx.strokeStyle = enemy ? INK : "#a85a48";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    if (enemy) {
      ctx.moveTo(x - r * 0.35, y + r * 0.42);
      ctx.quadraticCurveTo(x, y + r * 0.15, x + r * 0.4, y + r * 0.4);
      ctx.moveTo(x - r * 0.55, y + r * 0.15);
      ctx.quadraticCurveTo(x, y + r * 0.45, x + r * 0.6, y + r * 0.12);
    } else {
      ctx.arc(x, y + r * 0.38, r * 0.28, 0.2, Math.PI - 0.2);
    }
    ctx.stroke();
    if (enemy) {
      ctx.fillStyle = INK;
      ctx.beginPath();
      ctx.ellipse(x, y + r * 0.55, r * 0.55, r * 0.18, 0.05, 0, Math.PI);
      ctx.fill();
    }
  }

  function shadow(ctx, rx) {
    ctx.fillStyle = "rgba(40, 28, 16, 0.28)";
    ctx.beginPath();
    ctx.ellipse(1, 3, rx, 4, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  function legs(ctx, pal, phase, spread) {
    const s = Math.sin(phase);
    const sp = spread || 1;
    hose(ctx, -2, -8, -5 - s * 3 * sp, -3, -5 - s * 5 * sp, 1, 2.4, pal.clothDk);
    hose(ctx, 2, -8, 6 + s * 3 * sp, -3, 5 + s * 5 * sp, 1, 2.4, pal.cloth);
    blob(ctx, -5 - s * 5 * sp, 2, 3.6, 2.2, pal.boot, 0.2);
    blob(ctx, 5 + s * 5 * sp, 2, 3.6, 2.2, pal.boot, -0.1);
  }

  function gun(ctx, len, tilt) {
    ctx.save();
    ctx.rotate(tilt || 0);
    ctx.fillStyle = "#2c2824";
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -1.6);
    ctx.quadraticCurveTo(len * 0.55, -2.6, len, -0.7);
    ctx.lineTo(len, 1.3);
    ctx.quadraticCurveTo(len * 0.4, 2, 0, 1.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#5a5348";
    ctx.fillRect(len * 0.35, -2.6, len * 0.22, 1.4);
    ctx.restore();
  }

  function torso(ctx, pal, rx, ry) {
    blob(ctx, 0, -16, rx, ry, pal.cloth, 0);
    ctx.fillStyle = pal.clothDk;
    ctx.beginPath();
    ctx.ellipse(-rx * 0.25, -ry * 0.3 - 14, rx * 0.35, ry * 0.4, -0.4, 0, Math.PI * 2);
    ctx.fill();
    blob(ctx, 0, -16 + ry * 0.55, rx * 0.85, 1.7, pal.belt, 0);
  }

  function person(ctx, pal, enemy, phase, opt) {
    const bulk = opt.bulk || 1;
    const hat = opt.hat || (enemy ? "fieldCap" : "m1");
    shadow(ctx, 9 * bulk);
    legs(ctx, pal, phase, opt.stride || 1);
    if (opt.belly) blob(ctx, 2, -12, 6.5 * bulk, 5.2 * bulk, pal.clothDk, 0.2);
    torso(ctx, pal, 7.4 * bulk, 8.4 * (opt.tall ? 1.15 : 1));
    const swing = Math.sin(phase);
    hose(ctx, -5, -18, -12, -14 + swing * 2, -9, -9, 2.1, pal.cloth);
    glove(ctx, -9, -9, 0.9);
    if (!opt.noGunArm) {
      hose(ctx, 5, -18, 10, -16 - swing, 12, -12, 2.1, pal.clothDk);
      glove(ctx, 12, -12, 0.9);
    }
    const hy = opt.tall ? -30 : -26;
    const hr = opt.head || (enemy ? 7.2 : 6.8);
    face(ctx, 0.5, hy, hr, enemy);
    if (hat === "fieldCap") fieldCap(ctx, 0.5, hy - hr * 0.85);
    else if (hat === "kepi") kepi(ctx, 0.6, hy - hr * 0.7);
    else if (hat === "hood") hood(ctx, 0.5, hy - 1);
    else if (hat === "m1") m1(ctx, 0.5, hy - hr * 0.15, hr * 0.95, pal);
    if (opt.pack) blob(ctx, -6, -18, 3.2, 4, "#c6b48a", 0.2);
    if (opt.cross) {
      ctx.strokeStyle = "#f4efe4";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-6, -18);
      ctx.lineTo(-6, -12);
      ctx.moveTo(-9, -15);
      ctx.lineTo(-3, -15);
      ctx.stroke();
    }
    if (opt.leaves) {
      ctx.fillStyle = "#4a6238";
      [[-8, -20], [7, -22], [-6, -12], [8, -14], [0, -28]].forEach(function (p) {
        ctx.beginPath();
        ctx.ellipse(p[0], p[1], 3.2, 1.6, p[0] * 0.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = INK;
        ctx.lineWidth = 1.3;
        ctx.stroke();
      });
    }
    if (opt.shield) {
      const big = opt.shield > 1;
      blob(ctx, 9, -16, big ? 5 : 3.6, big ? 10 : 7.5, "#d9d3c4", 0.08);
      if (opt.shield < 0.7) {
        ctx.strokeStyle = INK;
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.moveTo(7, -22);
        ctx.quadraticCurveTo(11, -16, 8, -10);
        ctx.stroke();
      }
    }
  }

  function gearMarks(ctx, ranks) {
    if (!ranks) return;
    let total = 0;
    Object.keys(ranks).forEach(function (k) { total += ranks[k] || 0; });
    if (total >= 1) blob(ctx, -8, -14, 2.4, 1.8, "#c6a25c", 0.4);
    if (total >= 3) {
      ctx.strokeStyle = "#e2c56a";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, -30, 7, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();
    }
    if (total >= 5) blob(ctx, 7, -24, 1.8, 1.8, "#e2c56a", 0);
  }

  function draw(ctx, x, y, opt) {
    if (root.BOTGArt && root.BOTGArt.drawUnit(ctx, x, y, opt)) return true;
    const role = opt.role || (opt.team === "enemy" ? "grunt" : "trooper");
    const team = opt.team || "player";
    const enemy = team === "enemy";
    const pal = palFor(team, role, opt.skin);
    const aim = opt.aim || 0;
    const faceDir = Math.cos(aim) >= 0 ? 1 : -1;
    const sc = (opt.scale || 1) * 1.22;
    const ph = opt.phase || 0;
    const beat = Math.sin(ph * 1.15);
    const hidden = (role === "sneak" || role === "camo") && !opt.revealed;
    ctx.save();
    ctx.translate(x, y - beat * (enemy ? 1.4 : 2));
    ctx.scale(faceDir * sc * (1 + beat * 0.06) * (opt.flash > 0.02 ? 0.92 : 1), sc * (1 - beat * 0.05) * (1 + (opt.flash || 0) * 0.12));
    if (hidden) ctx.globalAlpha = role === "camo" ? 0.32 : 0.42;

    if (!enemy && role === "longshot") {
      shadow(ctx, 18);
      hose(ctx, -10, -5, 0, -2, 10, -4, 2.6, pal.cloth);
      blob(ctx, 0, -7, 9, 3.6, pal.cloth, 0.04);
      face(ctx, 8, -10, 5.2, false);
      m1(ctx, 8, -12, 5, pal);
      ctx.save();
      ctx.translate(6, -7);
      gun(ctx, 24, -0.04);
      ctx.restore();
      glove(ctx, 10, -6, 0.75);
    } else if (!enemy && role === "gatling") {
      shadow(ctx, 12);
      legs(ctx, pal, ph * 0.35, 0.6);
      torso(ctx, pal, 8.2, 7);
      face(ctx, -1, -26, 6.4, false);
      m1(ctx, -1, -28, 6.2, pal);
      ctx.save();
      ctx.translate(6, -16);
      gun(ctx, 8, -0.35);
      gun(ctx, 13, 0);
      gun(ctx, 8, 0.35);
      ctx.restore();
      glove(ctx, 7, -14, 0.85);
    } else if (!enemy && role === "mortar") {
      shadow(ctx, 11);
      legs(ctx, pal, ph * 0.25, 0.7);
      blob(ctx, -1, -12, 8, 6, pal.cloth, 0.15);
      face(ctx, -2, -22, 6.2, false);
      m1(ctx, -2, -24, 6, pal);
      ctx.save();
      ctx.translate(3, -16);
      gun(ctx, 13, -1.15);
      blob(ctx, 2, -11, 3.4, 2.4, "#6a5434", 0);
      ctx.restore();
    } else if (!enemy && role === "tread") {
      shadow(ctx, 16);
      blob(ctx, -10, -3, 6, 3.6, "#2c2824", 0);
      blob(ctx, 10, -3, 6, 3.6, "#2c2824", 0);
      blob(ctx, 0, -10, 13, 6.2, pal.cloth, 0);
      face(ctx, -5, -16, 5, false);
      m1(ctx, -5, -18, 4.8, pal);
      ctx.save();
      ctx.translate(4, -11);
      gun(ctx, 16, -0.12);
      ctx.restore();
    } else if (!enemy && role === "engineer") {
      person(ctx, pal, false, ph, { hat: "m1", head: 6.6 });
      blob(ctx, -10, -6, 3.6, 2.4, "#c6a25c", 0.3);
      blob(ctx, 9, -6, 3.4, 2.2, "#d8c49a", -0.2);
      hose(ctx, 4, -18, 11, -20, 13, -15, 1.8, pal.cloth);
      blob(ctx, 14, -15, 2.6, 1.3, "#8a8680", 0.7);
    } else if (!enemy && role === "sky") {
      person(ctx, pal, false, ph * 0.4, { hat: "m1", tall: true, head: 6.4 });
      ctx.save();
      ctx.translate(4, -26);
      gun(ctx, 12, -1.25);
      gun(ctx, 10, -0.9);
      ctx.restore();
    } else if (!enemy && role === "tent") {
      shadow(ctx, 16);
      ctx.fillStyle = "#6d7a48";
      ctx.strokeStyle = INK;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(-20, -1);
      ctx.lineTo(-4, -22);
      ctx.lineTo(12, -1);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#c4373a";
      ctx.fillRect(-20, -6, 32, 3);
      blob(ctx, 10, -2, 4.2, 2.6, "#c6a25c", 0);
      ctx.save();
      ctx.translate(14, 4);
      ctx.scale(0.62, 0.62);
      person(ctx, pal, false, ph * 0.35, { hat: "m1", head: 6.2, stride: 0.25 });
      ctx.restore();
    } else if (!enemy && role === "flame") {
      person(ctx, pal, false, ph * 0.5, { hat: "m1", head: 6.4 });
      blob(ctx, -8, -8, 3.4, 4.2, "#5c4030", 0.2);
      ctx.save();
      ctx.translate(6, -16);
      ctx.rotate(-0.35);
      ctx.fillStyle = INK;
      ctx.fillRect(0, -1.4, 14, 2.8);
      ctx.fillStyle = "#c4373a";
      ctx.fillRect(10, -2.2, 4, 4.4);
      if (opt.flash > 0.02) {
        ctx.fillStyle = "rgba(255,140,40," + Math.min(0.9, opt.flash * 5) + ")";
        ctx.beginPath();
        ctx.moveTo(14, 0);
        ctx.lineTo(26, -6);
        ctx.lineTo(24, 6);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    } else if (!enemy && role === "gunner") {
      shadow(ctx, 14);
      legs(ctx, pal, ph * 0.3, 0.45);
      blob(ctx, 0, -14, 11, 8, pal.cloth, 0);
      face(ctx, -2, -28, 6.6, false);
      m1(ctx, -2, -30, 6.4, pal);
      ctx.save();
      ctx.translate(4, -16);
      gun(ctx, 10, -0.2);
      gun(ctx, 16, -0.05);
      gun(ctx, 22, 0.12);
      ctx.fillStyle = "#c6a25c";
      ctx.fillRect(-2, 2, 8, 2);
      ctx.restore();
      blob(ctx, -9, -10, 3.2, 4, "#6a5434", 0.4);
    } else if (!enemy && role === "chopper") {
      shadow(ctx, 11);
      blob(ctx, 0, -4, 10, 2.6, "#6a5434", 0);
      const spin = opt.spin || ph;
      const bx = Math.cos(spin) * 5;
      blob(ctx, bx, -20, 9, 4.6, pal.cloth, 0);
      face(ctx, bx, -26, 4.8, false);
      m1(ctx, bx, -28, 4.6, pal);
      ctx.strokeStyle = INK;
      ctx.lineWidth = 2.6;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(bx - 18, -34);
      ctx.quadraticCurveTo(bx, -38, bx + 18, -32);
      ctx.moveTo(bx - 16, -30);
      ctx.quadraticCurveTo(bx, -26, bx + 16, -31);
      ctx.stroke();
    } else if (!enemy) {
      person(ctx, pal, false, ph, { hat: "m1", head: 7 });
      ctx.save();
      ctx.translate(8, -18);
      gun(ctx, 13, -0.12);
      ctx.restore();
    } else if (role === "brute") {
      person(ctx, pal, true, ph * 0.6, { hat: "kepi", bulk: 1.35, head: 6.2, stride: 0.7 });
    } else if (role === "heavy") {
      person(ctx, pal, true, ph * 0.7, { hat: "fieldCap", belly: true, bulk: 1.12, head: 7 });
    } else if (role === "riot") {
      person(ctx, pal, true, ph, { hat: "kepi", shield: opt.shield == null ? 1 : opt.shield, head: 6.8 });
    } else if (role === "bulwark") {
      person(ctx, pal, true, ph * 0.8, { hat: "fieldCap", shield: opt.shield == null ? 1.4 : opt.shield, bulk: 1.18, head: 6.6 });
    } else if (role === "medic") {
      person(ctx, pal, true, ph, { hat: "kepi", cross: true, head: 6.8 });
    } else if (role === "sneak") {
      person(ctx, pal, true, ph * 0.8, { hat: "hood", head: 6.4 });
    } else if (role === "camo") {
      person(ctx, pal, true, ph * 0.7, { hat: "hood", leaves: true, head: 6.2 });
    } else if (role === "para") {
      person(ctx, pal, true, ph * 0.6, { hat: "kepi", pack: true, head: 6.6 });
    } else if (role === "dash") {
      person(ctx, pal, true, ph * 1.8, { hat: "kepi", stride: 1.4, bulk: 0.86, head: 6.2 });
      ctx.strokeStyle = INK;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(-14, -20);
      ctx.lineTo(-20, -18);
      ctx.moveTo(-13, -15);
      ctx.lineTo(-19, -13);
      ctx.stroke();
    } else if (role === "scout" || role === "moto") {
      person(ctx, pal, true, ph * 1.4, { hat: "kepi", bulk: 0.84, stride: 1.2, head: 6 });
    } else {
      person(ctx, pal, true, ph, { hat: "fieldCap", head: 7.2 });
    }

    if (!hidden) gearMarks(ctx, opt.ranks);
    ctx.restore();
  }

  root.BOTGSoldier = { draw: draw };

  root.BOTGAimOrigin = function (x, y, role) {
    if (role === "longshot") return { x: x + 10, y: y - 8 };
    if (role === "gatling") return { x: x + 4, y: y - 16 };
    if (role === "mortar") return { x: x + 2, y: y - 18 };
    if (role === "tread") return { x: x + 4, y: y - 11 };
    if (role === "sky") return { x: x + 2, y: y - 24 };
    if (role === "chopper") return { x: x, y: y - 20 };
    if (role === "flame") return { x: x + 6, y: y - 16 };
    if (role === "gunner") return { x: x + 6, y: y - 16 };
    if (role === "tent") return { x: x, y: y - 10 };
    return { x: x + 4, y: y - 18 };
  };

  root.BOTGMuzzle = function (x, y, role, aim) {
    const meta = root.BOTGArt && root.BOTGArt.meta && root.BOTGArt.meta(role);
    if (meta && root.BOTGArt.has(role)) {
      const face = Math.cos(aim || 0) >= 0 ? 1 : -1;
      return {
        x: x + face * meta.w * Math.max(0.2, 1 - meta.ax) * 0.82,
        y: y - meta.h * meta.ay * (role === "chopper" ? 0.15 : 0.42),
      };
    }
    const len = role === "longshot" ? 28 : role === "gatling" ? 16 : role === "mortar" ? 10 : 16;
    const o = root.BOTGAimOrigin(x, y, role);
    return { x: o.x + Math.cos(aim) * len, y: o.y + Math.sin(aim) * len * 0.35 };
  };
})(typeof window !== "undefined" ? window : globalThis);
