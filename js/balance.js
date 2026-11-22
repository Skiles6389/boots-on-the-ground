
// Boots on the Ground — every tunable number lives here.
// Classic script (no modules) so the demo opens from a file:// page.
(function (root) {
  root.BOTG_BALANCE = {
    meta: {
      title: "Boots on the Ground",
      mapName: "Maple Grove",
      startingCash: 230,
      startingLives: 30,
      sellRefund: 0.7,
      earlyWaveBonus: 30,
      speeds: [1, 2],
    },

    view: {
      width: 400,
      height: 780,
      headerH: 48,
      footerY: 552,
    },

    map: {
      // Dirt lane through the grove. Coordinates are game pixels.
      path: [
        [-28, 116],
        [292, 116],
        [292, 204],
        [92, 204],
        [92, 292],
        [308, 292],
        [308, 380],
        [72, 380],
        [72, 468],
        [408, 468],
      ],
      // Half-width of the walkable dirt. Towers must sit farther out than this.
      pathClearance: 26,
      towerGap: 40,
      // A friendly first spot, in the grass between the first two bends.
      hint: { x: 188, y: 160 },
      trees: [
        { x: 358, y: 98, r: 26, style: "amber" },
        { x: 30, y: 250, r: 20, style: "green" },
        { x: 372, y: 338, r: 18, style: "rust" },
        { x: 34, y: 432, r: 16, style: "amber" },
        { x: 150, y: 526, r: 22, style: "green" },
        { x: 236, y: 530, r: 16, style: "rust" },
      ],
      pond: { x: 328, y: 522, r: 22 },
      // Trunks and the pond refuse towers. Canopies are just scenery.
      trunkBlock: 14,
    },

    towers: {
      trooper: {
        name: "Trooper",
        cost: 65,
        blurb: "Cheap rifleman. Medium range, steady shots.",
        // first = farthest along the lane, last, tough, near
        aim: "first",
        base: {
          damage: 1,
          range: 102,
          rate: 1.45,
          armorBite: 0,
          projectileSpeed: 360,
          role: "trooper",
        },
        upgrades: [
          {
            name: "Keen Eye",
            cost: 75,
            blurb: "Hits harder and watches a wider patch of lane.",
            set: { damage: 2, range: 116, rate: 1.55 },
          },
          {
            name: "Veteran's Rifle",
            cost: 130,
            blurb: "A quicker rifle for when the lane gets crowded.",
            set: { damage: 2, range: 124, rate: 2.05 },
          },
        ],
      },
      longshot: {
        name: "Longshot",
        cost: 165,
        blurb: "Slow, far shots that punch straight through armor.",
        aim: "tough",
        base: {
          damage: 16,
          range: 176,
          rate: 0.42,
          armorBite: 1,
          projectileSpeed: 0,
          role: "longshot",
        },
        upgrades: [
          {
            name: "Match Rifle",
            cost: 140,
            blurb: "Heavier rounds. Heavies and jeeps feel these.",
            set: { damage: 28, range: 190, rate: 0.48 },
          },
          {
            name: "Eagle Post",
            cost: 220,
            blurb: "Faster cycle and a longer view of the grove.",
            set: { damage: 42, range: 214, rate: 0.58 },
          },
        ],
      },
      gatling: {
        name: "Gatling Gunner",
        cost: 115,
        blurb: "A short-range storm of light rounds. Park on a corner.",
        aim: "first",
        base: {
          damage: 1,
          range: 78,
          rate: 7.2,
          armorBite: 0,
          projectileSpeed: 460,
          role: "gatling",
        },
        upgrades: [
          {
            name: "Spin-Up",
            cost: 95,
            blurb: "The barrels turn faster. Scouts hate this corner.",
            set: { damage: 1, range: 84, rate: 10 },
          },
          {
            name: "Hardened Belts",
            cost: 160,
            blurb: "The rounds finally bite into armor.",
            set: { damage: 1, range: 90, rate: 11, armorBite: 0.62 },
          },
        ],
      },
      mortar: {
        name: "Mortar Crew",
        short: "Mortar",
        cost: 175,
        blurb: "Lobs a shell that splashes the lane. Armor hates the arc.",
        aim: "tough",
        base: {
          damage: 9,
          range: 168,
          rate: 0.55,
          armorBite: 0.55,
          projectileSpeed: 0,
          splash: 36,
          role: "mortar",
        },
        upgrades: [
          { name: "Big Shell", cost: 110, blurb: "A wider blast.", set: { damage: 12, splash: 46 } },
          { name: "Quick Load", cost: 150, blurb: "The crew drops shells faster.", set: { damage: 12, splash: 46, rate: 0.8 } },
        ],
      },
      tread: {
        name: "Tread Tank",
        short: "Tank",
        cost: 240,
        blurb: "A slow cannon that punches armor and splashes.",
        aim: "tough",
        base: {
          damage: 22,
          range: 124,
          rate: 0.42,
          armorBite: 1,
          projectileSpeed: 0,
          splash: 22,
          role: "tread",
        },
        upgrades: [
          { name: "Bigger Gun", cost: 160, blurb: "The barrel hits harder.", set: { damage: 32, splash: 26 } },
          { name: "Coax Gun", cost: 180, blurb: "A machine gun joins the cannon.", set: { damage: 32, splash: 26, rate: 0.62 } },
        ],
      },
      engineer: {
        name: "Engineer",
        short: "Engineer",
        cost: 140,
        blurb: "Sandbags slow the lane nearby and pay a little each wave.",
        aim: "near",
        base: {
          damage: 0,
          range: 96,
          rate: 0,
          armorBite: 0,
          projectileSpeed: 0,
          slow: 0.64,
          wavePay: 18,
          role: "engineer",
        },
        upgrades: [
          { name: "Deeper Bags", cost: 90, blurb: "The lane nearby crawls.", set: { slow: 0.5, range: 110 } },
          { name: "Supply Crate", cost: 120, blurb: "A fatter purse at the end of each wave.", set: { slow: 0.5, range: 110, wavePay: 32 } },
        ],
      },
      sky: {
        name: "Sky Guard",
        short: "Sky Guard",
        cost: 190,
        blurb: "Flak bursts. Deadly to anything overhead, splashy on the ground.",
        aim: "first",
        base: {
          damage: 6,
          range: 140,
          rate: 0.85,
          armorBite: 0.2,
          projectileSpeed: 280,
          splash: 26,
          airBonus: 2.2,
          role: "sky",
        },
        upgrades: [
          { name: "Wide Burst", cost: 120, blurb: "The flak blooms wider.", set: { splash: 36, damage: 7 } },
          { name: "Quad Flak", cost: 170, blurb: "Four barrels, a quicker cycle.", set: { splash: 36, damage: 8, rate: 1.15 } },
        ],
      },
      chopper: {
        name: "Chopper Pad",
        short: "Chopper",
        cost: 260,
        blurb: "A helicopter orbits the pad and stitches the lane with fire.",
        aim: "first",
        base: {
          damage: 3,
          range: 118,
          rate: 2.4,
          armorBite: 0.15,
          projectileSpeed: 340,
          role: "chopper",
        },
        upgrades: [
          { name: "Rocket Pods", cost: 150, blurb: "Every few shots a rocket splashes.", set: { damage: 4, splash: 20 } },
          { name: "Heavy Gunship", cost: 200, blurb: "The chain gun bites armor.", set: { damage: 5, splash: 20, armorBite: 0.7, rate: 2.8 } },
        ],
      },
    },

    enemies: {
      grunt: {
        name: "Grunt",
        hp: 8,
        speed: 46,
        cash: 5,
        armor: 0,
        leak: 1,
        radius: 13,
        scale: 1,
        vehicle: false,
      },
      scout: {
        name: "Scout",
        hp: 5,
        speed: 78,
        cash: 7,
        armor: 0,
        leak: 1,
        radius: 11,
        scale: 0.86,
        vehicle: false,
      },
      heavy: {
        name: "Heavy",
        hp: 30,
        speed: 32,
        cash: 14,
        armor: 0.62,
        leak: 2,
        radius: 16,
        scale: 1.16,
        vehicle: false,
      },
      jeep: {
        name: "Jeep",
        hp: 68,
        speed: 58,
        cash: 22,
        armor: 0.28,
        leak: 3,
        radius: 18,
        scale: 1,
        vehicle: true,
      },
      tank: {
        name: "Grim Tank",
        hp: 860,
        speed: 24,
        cash: 90,
        armor: 0.46,
        leak: 30,
        radius: 26,
        scale: 1,
        vehicle: true,
        boss: true,
      },
      moto: {
        name: "Moto Scout",
        hp: 5,
        speed: 96,
        cash: 6,
        armor: 0,
        leak: 1,
        radius: 11,
        scale: 0.9,
        vehicle: false,
        fast: true,
      },
      brute: {
        name: "Brute",
        hp: 36,
        speed: 30,
        cash: 12,
        armor: 0.5,
        leak: 2,
        radius: 15,
        scale: 1.2,
        vehicle: false,
      },
      riot: {
        name: "Riot Shield",
        hp: 22,
        speed: 34,
        cash: 10,
        armor: 0.15,
        leak: 2,
        radius: 13,
        scale: 1.05,
        vehicle: false,
        shield: true,
      },
      medic: {
        name: "Quack Medic",
        hp: 14,
        speed: 40,
        cash: 9,
        armor: 0,
        leak: 1,
        radius: 12,
        scale: 1,
        vehicle: false,
        medic: true,
      },
      sneak: {
        name: "Sneak",
        hp: 12,
        speed: 52,
        cash: 8,
        armor: 0,
        leak: 1,
        radius: 11,
        scale: 0.95,
        vehicle: false,
        stealth: true,
      },
      halftrack: {
        name: "Half-Track",
        hp: 110,
        speed: 36,
        cash: 28,
        armor: 0.72,
        leak: 4,
        radius: 18,
        scale: 1,
        vehicle: true,
      },
      gnat: {
        name: "Gnat Copter",
        hp: 28,
        speed: 62,
        cash: 12,
        armor: 0,
        leak: 2,
        radius: 12,
        scale: 0.9,
        vehicle: false,
        air: true,
      },
      ironjaw: {
        name: "Ironjaw",
        hp: 980,
        speed: 16,
        cash: 160,
        armor: 0.5,
        leak: 12,
        radius: 28,
        scale: 1.35,
        vehicle: true,
        boss: true,
        ironjaw: true,
      },
    },

    // About ten waves. Groups spawn in order.
    waves: [
      {
        name: "Warm-up Patrol",
        hint: "Grunts on a stroll. A Trooper between the bends covers both lanes.",
        reward: 75,
        groups: [{ type: "grunt", count: 8, interval: 0.78 }],
      },
      {
        name: "Second Patrol",
        hint: "A longer line of grunts. Two Troopers can hold the grove.",
        reward: 85,
        groups: [{ type: "grunt", count: 14, interval: 0.52 }],
      },
      {
        name: "Scout Rush",
        hint: "Scouts are quick. A Gatling Gunner on a corner mows them down.",
        reward: 95,
        groups: [
          { type: "grunt", count: 6, interval: 0.48 },
          { type: "scout", count: 8, interval: 0.4 },
        ],
      },
      {
        name: "Double Time",
        hint: "Scouts mixed through the grunts. Keep every corner watched.",
        reward: 110,
        groups: [
          { type: "scout", count: 10, interval: 0.36 },
          { type: "grunt", count: 8, interval: 0.4 },
        ],
      },
      {
        name: "Armor Up",
        hint: "Heavies shrug off light rifles. Longshots punch clean through.",
        reward: 125,
        groups: [
          { type: "grunt", count: 8, interval: 0.42 },
          { type: "heavy", count: 4, interval: 1.05 },
        ],
      },
      {
        name: "Heavy Company",
        hint: "More armor, with scouts nipping around the heavies.",
        reward: 140,
        groups: [
          { type: "scout", count: 8, interval: 0.34 },
          { type: "heavy", count: 6, interval: 0.85 },
        ],
      },
      {
        name: "Jeeps on the Lane",
        hint: "Jeeps are tough and pretty quick. Focus them before the gate.",
        reward: 155,
        groups: [
          { type: "grunt", count: 8, interval: 0.38 },
          { type: "jeep", count: 2, interval: 1.7 },
          { type: "heavy", count: 3, interval: 0.8 },
        ],
      },
      {
        name: "Convoy",
        hint: "A jeep convoy. Upgrade a Longshot if the purse allows.",
        reward: 170,
        groups: [
          { type: "scout", count: 10, interval: 0.3 },
          { type: "jeep", count: 3, interval: 1.3 },
          { type: "heavy", count: 4, interval: 0.7 },
        ],
      },
      {
        name: "Full Corps",
        hint: "The whole Scowl Corps at once. Patch any bare corner.",
        reward: 190,
        groups: [
          { type: "grunt", count: 10, interval: 0.32 },
          { type: "riot", count: 3, interval: 0.7 },
          { type: "medic", count: 2, interval: 0.8 },
          { type: "jeep", count: 2, interval: 1.2 },
        ],
      },
      {
        name: "Grimstache",
        hint: "General Grimstache's tank. Stop it before the gate.",
        reward: 260,
        boss: true,
        groups: [
          { type: "heavy", count: 3, interval: 0.8 },
          { type: "sneak", count: 3, interval: 0.45 },
          { type: "gnat", count: 3, interval: 0.55 },
          { type: "tank", count: 1, interval: 0.4 },
        ],
      },
      {
        name: "Ironjaw",
        hint: "Ironjaw rolls in. Cannons and mortars crack him. Sky Guard owns the gnats.",
        reward: 340,
        boss: true,
        groups: [
          { type: "brute", count: 3, interval: 0.9 },
          { type: "gnat", count: 3, interval: 0.6 },
          { type: "moto", count: 6, interval: 0.35 },
          { type: "ironjaw", count: 1, interval: 0.3 },
        ],
      },
    ],
  };

  const B = root.BOTG_BALANCE;

  B.towerOrder = ["trooper", "longshot", "gatling", "mortar", "tread", "engineer", "sky", "chopper"];

  B.statsFor = function statsFor(type, rank) {
    const def = B.towers[type];
    const stats = Object.assign({ name: def.name }, def.base);
    const r = Math.max(0, Math.min(rank, def.upgrades.length));
    for (let i = 0; i < r; i++) Object.assign(stats, def.upgrades[i].set);
    stats.rankName = r === 0 ? def.name : def.upgrades[r - 1].name;
    stats.blurb = r === 0 ? def.blurb : def.upgrades[r - 1].blurb;
    return stats;
  };

  B.buildPath = function buildPath(points) {
    const segs = [];
    let total = 0;
    for (let i = 1; i < points.length; i++) {
      const a = { x: points[i - 1][0], y: points[i - 1][1] };
      const b = { x: points[i][0], y: points[i][1] };
      const len = Math.hypot(b.x - a.x, b.y - a.y) || 0.0001;
      segs.push({ a, b, len, start: total });
      total += len;
    }
    return { segs, total };
  };

  B.route = B.buildPath(B.map.path);

  B.pointAt = function pointAt(dist) {
    const route = B.route;
    const d = Math.max(0, Math.min(route.total, dist));
    for (let i = 0; i < route.segs.length; i++) {
      const s = route.segs[i];
      if (d <= s.start + s.len || i === route.segs.length - 1) {
        const t = Math.max(0, Math.min(1, (d - s.start) / s.len));
        return {
          x: s.a.x + (s.b.x - s.a.x) * t,
          y: s.a.y + (s.b.y - s.a.y) * t,
          angle: Math.atan2(s.b.y - s.a.y, s.b.x - s.a.x),
        };
      }
    }
    const last = route.segs[route.segs.length - 1];
    return { x: last.b.x, y: last.b.y, angle: 0 };
  };

  function distToSeg(px, py, a, b) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len2 = dx * dx + dy * dy || 1;
    let t = ((px - a.x) * dx + (py - a.y) * dy) / len2;
    t = Math.max(0, Math.min(1, t));
    const x = a.x + dx * t;
    const y = a.y + dy * t;
    return { d: Math.hypot(px - x, py - y), x, y, t };
  }

  B.distToRoute = function distToRoute(x, y) {
    let best = Infinity;
    for (const s of B.route.segs) best = Math.min(best, distToSeg(x, y, s.a, s.b).d);
    return best;
  };

  B.nearestAngle = function nearestAngle(x, y) {
    let best = Infinity;
    let angle = 0;
    for (const s of B.route.segs) {
      const hit = distToSeg(x, y, s.a, s.b);
      if (hit.d < best) {
        best = hit.d;
        angle = Math.atan2(s.b.y - s.a.y, s.b.x - s.a.x);
      }
    }
    return angle;
  };
})(typeof window !== "undefined" ? window : globalThis);
  