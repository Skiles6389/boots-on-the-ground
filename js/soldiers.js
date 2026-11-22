// Cartoon soldiers for Boots on the Ground.
// Real people in a bright cel-shaded style. The toy-army flavor is the
// green helmet and uniform, and the classic kneel / prone / gunner poses.
// Nothing here is a plastic figure: no molded one-color body, no display base.
(function (root) {
  const INK = "#1a120c";

  const FRIEND = {
    skin: "#f3c59a",
    skinHi: "#ffe6c8",
    skinSh: "#d39662",
    jacket: "#3caf4c",
    jacketSh: "#1f7a34",
    jacketHi: "#9aeb78",
    pants: "#2c8640",
    helmet: "#2f9e44",
    helmetHi: "#c6f6a4",
    helmetSh: "#176632",
    boot: "#6a4324",
    belt: "#f0c85a",
    strap: "#c4964a",
    gun: "#3a424a",
    gunHi: "#aeb6be",
    eye: "#241c14",
    mouth: "#a85048",
    brow: "#3a2818",
  };

  const FOE = {
    skin: "#e8b48c",
    skinHi: "#ffd8b4",
    skinSh: "#c48860",
    jacket: "#5a1838",
    jacketSh: "#2c0c1c",
    jacketHi: "#a04068",
    pants: "#2a1020",
    helmet: "#2a1428",
    helmetHi: "#7a4868",
    helmetSh: "#120810",
    boot: "#1a1014",
    belt: "#e23a3a",
    strap: "#8a2030",
    gun: "#24161c",
    gunHi: "#8a7078",
    eye: "#ff2e2e",
    mouth: "#4a1020",
    brow: "#14080c",
    spike: "#d8d0dc",
  };

  function palFor(team, role) {
    if (team !== "enemy") return FRIEND;
    const pal = Object.assign({}, FOE);
    if (role === "scout") {
      pal.jacket = "#7a2850";
      pal.jacketHi = "#c45a80";
      pal.helmet = "#3a1834";
    }
    if (role === "heavy") {
      pal.jacket = "#3a1028";
      pal.jacketSh = "#180810";
      pal.jacketHi = "#7a2848";
      pal.pants = "#1a0c14";
    }
    return pal;
  }

  function piece(ctx, x, y, w, h, r, fill, shade) {
    ctx.beginPath();
    const rr = Math.max(0, Math.min(r, w / 2, h / 2));
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    if (shade) {
      ctx.save();
      ctx.clip();
      ctx.fillStyle = shade;
      ctx.fillRect(x, y + h * 0.52, w, h * 0.55);
      ctx.restore();
    }
    ctx.lineWidth = 2;
    ctx.strokeStyle = INK;
    ctx.stroke();
  }

  function disk(ctx, x, y, r, fill, shade) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
    if (shade) {
      ctx.save();
      ctx.clip();
      ctx.fillStyle = shade;
      ctx.beginPath();
      ctx.arc(x + r * 0.2, y + r * 0.35, r * 0.85, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.lineWidth = 2;
    ctx.strokeStyle = INK;
    ctx.stroke();
  }

  function limb(ctx, x1, y1, x2, y2, color, width) {
    ctx.lineCap = "round";
    ctx.strokeStyle = INK;
    ctx.lineWidth = width + 3.2;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke();
  }

  function paintFace(ctx, x, y, r, pal, enemy) {
    disk(ctx, x, y, r, pal.skin, pal.skinSh);
    ctx.fillStyle = pal.skinHi;
    ctx.beginPath();
    ctx.ellipse(x - r * 0.28, y - r * 0.32, r * 0.32, r * 0.2, -0.5, 0, Math.PI * 2);
    ctx.fill();
    const ey = y + r * 0.22;
    if (enemy) {
      ctx.fillStyle = "#fff6f4";
      ctx.beginPath();
      ctx.ellipse(x - 2.4, ey, 2.05, 1.7, 0, 0, Math.PI * 2);
      ctx.ellipse(x + 2.5, ey, 2.05, 1.7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = INK;
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.fillStyle = pal.eye;
      ctx.beginPath();
      ctx.arc(x - 2.1, ey + 0.25, 1.15, 0, Math.PI * 2);
      ctx.arc(x + 2.8, ey + 0.25, 1.15, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = pal.brow;
      ctx.lineWidth = 1.8;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(x - 4.6, ey - 2.5);
      ctx.lineTo(x - 0.4, ey - 1.1);
      ctx.moveTo(x + 4.7, ey - 2.5);
      ctx.lineTo(x + 0.6, ey - 1.1);
      ctx.stroke();
      ctx.strokeStyle = "#2a0810";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(x - 2.2, y + r * 0.62);
      ctx.quadraticCurveTo(x + 0.3, y + r * 0.28, x + 2.8, y + r * 0.64);
      ctx.stroke();
    } else {
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.ellipse(x - 2.3, ey, 1.9, 2, 0, 0, Math.PI * 2);
      ctx.ellipse(x + 2.5, ey, 1.9, 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = INK;
      ctx.lineWidth = 1.15;
      ctx.stroke();
      ctx.fillStyle = pal.eye;
      ctx.beginPath();
      ctx.arc(x - 1.7, ey + 0.25, 1, 0, Math.PI * 2);
      ctx.arc(x + 3.1, ey + 0.25, 1, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.fillRect(x - 2.2, ey - 0.45, 0.8, 0.8);
      ctx.fillRect(x + 2.6, ey - 0.45, 0.8, 0.8);
      ctx.strokeStyle = pal.brow;
      ctx.lineWidth = 1.5;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(x - 4.3, ey - 2.3);
      ctx.lineTo(x - 0.6, ey - 2.8);
      ctx.moveTo(x + 4.5, ey - 2.3);
      ctx.lineTo(x + 0.8, ey - 2.8);
      ctx.stroke();
      ctx.strokeStyle = pal.mouth;
      ctx.lineWidth = 1.45;
      ctx.beginPath();
      ctx.moveTo(x - 1.5, y + r * 0.5);
      ctx.quadraticCurveTo(x + 0.6, y + r * 0.72, x + 2.6, y + r * 0.46);
      ctx.stroke();
    }
  }

  function helmet(ctx, x, y, r, pal, spikes) {
    const brow = y - r * 0.05;
    ctx.save();
    ctx.beginPath();
    ctx.rect(x - r - 8, y - r - 10, r * 2 + 16, brow - (y - r - 10));
    ctx.clip();
    disk(ctx, x, y, r + 1.3, pal.helmet, pal.helmetSh);
    ctx.fillStyle = pal.helmetHi;
    ctx.beginPath();
    ctx.ellipse(x - r * 0.28, y - r * 0.55, r * 0.42, r * 0.2, -0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    piece(ctx, x - r - 2, brow - 1.6, r * 2 + 4, 2.3, 1, pal.helmet, pal.helmetSh);
    if (spikes) {
      const n = spikes;
      for (let i = 0; i < n; i++) {
        const t = n === 1 ? 0.5 : i / (n - 1);
        const a = Math.PI + t * Math.PI;
        const sx = x + Math.cos(a) * (r + 0.2);
        const sy = y - 0.4 + Math.sin(a) * (r + 0.2);
        ctx.save();
        ctx.translate(sx, sy);
        ctx.rotate(a - Math.PI / 2);
        piece(ctx, -1.3, -5.2, 2.6, 5.2, 1.1, pal.spike || "#ddd6e4", "#9a92a4");
        ctx.restore();
      }
    }
  }

  function boot(ctx, x, y, pal, w) {
    piece(ctx, x, y, w || 7, 4.2, 1.6, pal.boot, "#00000055");
  }

  function rifle(ctx, len, pal) {
    piece(ctx, -6, -2.2, 8, 4.4, 1.3, "#6b4a2c", "#4a3018");
    piece(ctx, 1.5, -1.35, len, 2.7, 1, pal.gun, "#00000066");
    ctx.fillStyle = pal.gunHi;
    ctx.fillRect(3, -1.15, Math.max(2, len - 5), 0.9);
    piece(ctx, len * 0.38, 0.8, 2.8, 3.6, 0.7, pal.gun, null);
  }

  function gatling(ctx, len, pal) {
    piece(ctx, -3, -3.4, 9, 6.8, 1.6, pal.gun, "#00000066");
    [-2.4, 0, 2.4].forEach((oy) => {
      ctx.lineCap = "butt";
      ctx.strokeStyle = INK;
      ctx.lineWidth = 3.3;
      ctx.beginPath();
      ctx.moveTo(5, oy);
      ctx.lineTo(len, oy);
      ctx.stroke();
      ctx.strokeStyle = pal.gunHi;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(6, oy - 0.45);
      ctx.lineTo(len - 1, oy - 0.45);
      ctx.stroke();
    });
    piece(ctx, 1, 3.2, 7, 2.1, 1, pal.strap, null);
  }

  function groundShadow(ctx, rx, ry) {
    ctx.fillStyle = "rgba(20, 50, 16, 0.28)";
    ctx.beginPath();
    ctx.ellipse(1, 2, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  function kneel(ctx, pal, enemy, bulk) {
    const b = bulk || 1;
    groundShadow(ctx, 11 * b, 4.2);
    const hipY = -12;
    limb(ctx, -1, hipY, -8, -3, pal.pants, 4.2 * b);
    boot(ctx, -11, -4, pal);
    limb(ctx, 1, hipY, 6, -2, pal.pants, 4.2 * b);
    boot(ctx, 5, -3.2, pal, 7.5);
    piece(ctx, -7 * b, -27, 14 * b, 16, 4, pal.jacket, pal.jacketSh);
    ctx.fillStyle = pal.jacketHi;
    ctx.fillRect(-5 * b, -26, 5, 4);
    piece(ctx, -6 * b, -15, 12 * b, 3.2, 1.2, pal.belt, null);
    piece(ctx, -2, -22, 3.2, 7, 1, pal.strap, null);
    limb(ctx, -4, -22, -8, -16, pal.jacket, 3.4);
    limb(ctx, 3, -22, 6, -17, pal.jacketSh, 3.6);
    paintFace(ctx, 1.5, -32, 6.1, pal, enemy);
    helmet(ctx, 1.5, -33, 6.4, pal, enemy ? (bulk > 1.05 ? 4 : 3) : 0);
  }

  function stand(ctx, pal, enemy, phase, bulk) {
    const b = bulk || 1;
    const swing = Math.sin(phase || 0) * (enemy ? 5 : 1.2);
    groundShadow(ctx, 9 * b, 3.6);
    const hip = -13;
    limb(ctx, -1, hip, -4 + swing, -1, pal.pants, 4 * b);
    boot(ctx, -7 + swing, -3.4, pal);
    limb(ctx, 1, hip, 4 - swing, -1, pal.pants, 4 * b);
    boot(ctx, 2 - swing * 0.3, -3.2, pal);
    piece(ctx, -6.5 * b, -28, 13 * b, 16, 4, pal.jacket, pal.jacketSh);
    ctx.fillStyle = pal.jacketHi;
    ctx.fillRect(-4.5 * b, -27, 4.5, 3.5);
    piece(ctx, -5.5 * b, -15.5, 11 * b, 3, 1.2, pal.belt, null);
    limb(ctx, -3, -22, -7, -15, pal.jacket, 3.3);
    limb(ctx, 3, -22, 6, -16, pal.jacketSh, 3.4);
    paintFace(ctx, 0.5, -33, enemy && bulk < 0.95 ? 5.4 : 6, pal, enemy);
    helmet(ctx, 0.5, -34, enemy && bulk < 0.95 ? 5.6 : 6.3, pal, enemy ? 3 : 0);
  }

  function prone(ctx, pal) {
    groundShadow(ctx, 18, 5.5);
    boot(ctx, -20, -3.1, pal, 6.5);
    boot(ctx, -20, 1.4, pal, 6.5);
    limb(ctx, -14, 0, -6, 0, pal.pants, 4.6);
    piece(ctx, -10, -4.6, 18, 9.2, 3.6, pal.jacket, pal.jacketSh);
    ctx.fillStyle = pal.jacketHi;
    ctx.fillRect(-8, -4, 7, 2.2);
    piece(ctx, -4, 1.6, 8, 2.2, 1, pal.belt, null);
    limb(ctx, 6, -0.4, 11, -0.8, pal.jacket, 3.2);
    paintFace(ctx, 10, -0.6, 4.6, pal, false);
    helmet(ctx, 9.4, -1.8, 4.8, pal, 0);
    ctx.save();
    ctx.translate(12, -0.8);
    piece(ctx, -2, -1.3, 5, 2.6, 0.8, "#6b4a2c", "#4a3018");
    piece(ctx, 2.5, -1.05, 16, 2.1, 0.8, pal.gun, "#00000066");
    piece(ctx, 6, -2.8, 6.5, 1.8, 0.7, "#2c343c", null);
    ctx.fillStyle = pal.gunHi;
    ctx.fillRect(4, -0.85, 11, 0.7);
    ctx.restore();
  }

  function draw(ctx, x, y, opt) {
    const role = opt.role || (opt.team === "enemy" ? "grunt" : "trooper");
    const team = opt.team || "player";
    const enemy = team === "enemy";
    const pal = palFor(team, role);
    const aim = opt.aim || 0;
    const face = Math.cos(aim) >= 0 ? 1 : -1;
    const sc = opt.scale || 1;
    const bob = enemy ? Math.abs(Math.sin(opt.phase || 0)) * 2.2 * sc : Math.sin((opt.phase || 0) * 0.7) * 0.6 * sc;
    const gunAngle = Math.max(-1.05, Math.min(1.05, Math.atan2(Math.sin(aim), Math.abs(Math.cos(aim)))));

    if (!enemy && role === "longshot") {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(aim);
      ctx.scale(sc, sc);
      prone(ctx, pal);
      ctx.restore();
      return;
    }

    ctx.save();
    ctx.translate(x, y - bob);
    ctx.scale(face * sc, sc);
    if (role === "mortar") {
      kneel(ctx, pal, false, 1);
      ctx.save();
      ctx.translate(5, -20);
      ctx.rotate(-0.85);
      piece(ctx, -2, -2.2, 16, 4.4, 1.4, pal.gun, "#00000066");
      disk(ctx, 14, 0, 2.2, pal.gunHi, null);
      ctx.restore();
    } else if (role === "tread") {
      groundShadow(ctx, 14, 5);
      piece(ctx, -14, -6, 26, 8, 2, "#2f8a3c", "#1c5c28");
      piece(ctx, -16, -8, 8, 12, 2, "#245c30", null);
      piece(ctx, 6, -8, 8, 12, 2, "#245c30", null);
      disk(ctx, -2, -8, 5, "#3caf4c", "#1f7a34");
      ctx.save();
      ctx.translate(-2, -8);
      ctx.rotate(gunAngle);
      piece(ctx, 2, -1.6, 14, 3.2, 1, pal.gun, null);
      ctx.restore();
      paintFace(ctx, -2, -16, 4.2, pal, false);
      helmet(ctx, -2, -17, 4.4, pal, 0);
    } else if (role === "engineer") {
      stand(ctx, pal, false, opt.phase || 0, 1);
      piece(ctx, -12, -3, 8, 4, 1.2, "#d7b56a", "#a8843e");
      piece(ctx, 6, -3, 8, 4, 1.2, "#e6c98a", "#b8924a");
      ctx.save();
      ctx.translate(8, -18);
      ctx.rotate(-0.4);
      piece(ctx, 0, -1.2, 8, 2.4, 0.8, "#c0c6cc", null);
      ctx.restore();
    } else if (role === "sky") {
      stand(ctx, pal, false, 0, 1);
      ctx.save();
      ctx.translate(4, -24);
      ctx.rotate(-1.05);
      piece(ctx, 0, -2.4, 14, 4.8, 1.2, pal.gun, "#00000066");
      piece(ctx, 10, -4.2, 4, 8.4, 1, pal.gunHi, null);
      ctx.restore();
    } else if (role === "chopper") {
      groundShadow(ctx, 10, 4);
      piece(ctx, -10, -3, 20, 5, 2, "#6a5430", "#3e3018");
      const ang = (opt.spin || 0) * 0.15;
      ctx.save();
      ctx.translate(Math.cos(ang) * 12, -16 + Math.sin(ang) * 5);
      piece(ctx, -7, -3, 14, 6, 2, pal.jacket, pal.jacketSh);
      piece(ctx, 6, -1.2, 7, 2.4, 1, pal.jacketSh, null);
      limb(ctx, -8, -3, 8, -3, "#1a120c", 1.4);
      paintFace(ctx, -1, -6, 3.4, pal, false);
      helmet(ctx, -1, -6.6, 3.5, pal, 0);
      ctx.restore();
    } else if (role === "gatling") {
      kneel(ctx, pal, false, 1.08);
      ctx.save();
      ctx.translate(6, -16);
      ctx.rotate(gunAngle);
      gatling(ctx, 18, pal);
      ctx.restore();
    } else if (role === "heavy") {
      kneel(ctx, pal, true, 1.18);
      ctx.save();
      ctx.translate(7, -15);
      ctx.rotate(gunAngle);
      rifle(ctx, 13, pal);
      ctx.restore();
    } else if (role === "trooper") {
      kneel(ctx, pal, false, 1);
      ctx.save();
      ctx.translate(6, -18);
      ctx.rotate(gunAngle);
      rifle(ctx, 12, pal);
      ctx.restore();
    } else if (role === "scout") {
      stand(ctx, pal, true, (opt.phase || 0) * 1.4, 0.9);
      ctx.save();
      ctx.translate(5, -17);
      ctx.rotate(gunAngle * 0.35);
      rifle(ctx, 10, pal);
      ctx.restore();
    } else {
      stand(ctx, pal, enemy, opt.phase || 0, 1);
      ctx.save();
      ctx.translate(5, -17);
      ctx.rotate(enemy ? gunAngle * 0.45 : gunAngle);
      rifle(ctx, 11, pal);
      ctx.restore();
    }
    if (opt.flash > 0.03) {
      ctx.save();
      ctx.globalAlpha = Math.min(0.8, opt.flash * 4.5);
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.arc(1, role === "scout" ? -33 : -32, 8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }

  root.BOTGSoldier = { draw: draw };

  root.BOTGAimOrigin = function (x, y, role) {
    if (role === "longshot") return { x: x, y: y - 1 };
    if (role === "gatling") return { x: x, y: y - 16 };
    return { x: x, y: y - 17 };
  };

  root.BOTGMuzzle = function (x, y, role, aim) {
    const len = role === "longshot" ? 24 : role === "gatling" ? 20 : 16;
    const o = root.BOTGAimOrigin(x, y, role);
    const face = Math.cos(aim) >= 0 ? 1 : -1;
    if (role === "longshot") {
      return { x: o.x + Math.cos(aim) * len, y: o.y + Math.sin(aim) * len };
    }
    const handX = o.x + face * 6;
    const gun = Math.max(-1.05, Math.min(1.05, Math.atan2(Math.sin(aim), Math.abs(Math.cos(aim)))));
    const world = face === 1 ? gun : Math.PI - gun;
    return { x: handX + Math.cos(world) * len, y: o.y + Math.sin(world) * len };
  };
})(typeof window !== "undefined" ? window : globalThis);
