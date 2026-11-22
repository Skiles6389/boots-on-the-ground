
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
      id: "maple",
      name: "Maple Grove",
      theme: "grove",
      blurb: "A green lane with soft bends. The friendly first map.",
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
      pond: { x: 328, y: 522, r: 22, kind: "pond" },
      sign: { x: 78, y: 524, label: "Maple Grove" },
      // Trunks and the pond refuse towers. Canopies are just scenery.
      trunkBlock: 14,
      props: [
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
      ],
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
        cost: 230,
        blurb: "A slow bolt rifle. One heavy shot, then a long pause. Swarms walk past.",
        aim: "tough",
        base: {
          damage: 22,
          range: 160,
          rate: 0.24,
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
          damage: 5,
          range: 132,
          rate: 0.7,
          armorBite: 0.2,
          projectileSpeed: 280,
          splash: 20,
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
        hp: 460,
        speed: 22,
        cash: 80,
        armor: 0.46,
        leak: 8,
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
        hp: 1200,
        speed: 15,
        cash: 200,
        armor: 0.52,
        leak: 10,
        radius: 28,
        scale: 1.35,
        vehicle: true,
        boss: true,
        ironjaw: true,
      },
    },

    // Thirty rounds. One new trick at a time, then they stack.
    waves: [
      {
        name: "Warm-up Patrol",
        hint: "Grunts on a stroll. A Trooper between the bends covers both lanes.",
        reward: 80,
        groups: [{ type: "grunt", count: 8, interval: 0.78 }],
      },
      {
        name: "Second Patrol",
        hint: "A longer line of grunts. Two Troopers can hold the first bends.",
        reward: 90,
        groups: [{ type: "grunt", count: 14, interval: 0.52 }],
      },
      {
        name: "Scout Rush",
        hint: "Scouts are quick. A Gatling Gunner on a corner mows them down.",
        reward: 100,
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
        name: "Corner Watch",
        hint: "A thicker line. A second gun on the next bend pays off.",
        reward: 120,
        groups: [
          { type: "grunt", count: 12, interval: 0.38 },
          { type: "scout", count: 8, interval: 0.32 },
        ],
      },
      {
        name: "Moto Buzz",
        hint: "Moto Scouts sprint the lane. A Gatling on a corner catches them.",
        reward: 130,
        groups: [
          { type: "grunt", count: 6, interval: 0.42 },
          { type: "moto", count: 6, interval: 0.34 },
        ],
      },
      {
        name: "Sprint Lane",
        hint: "More bikes. Don't leave a straight stretch unwatched.",
        reward: 145,
        groups: [
          { type: "moto", count: 10, interval: 0.28 },
          { type: "scout", count: 6, interval: 0.32 },
        ],
      },
      {
        name: "Armor Up",
        hint: "Heavies shrug off light rifles. A Longshot punches clean through.",
        reward: 160,
        groups: [
          { type: "grunt", count: 8, interval: 0.42 },
          { type: "heavy", count: 4, interval: 1.05 },
        ],
      },
      {
        name: "Heavy Company",
        hint: "More armor, with scouts nipping around the heavies.",
        reward: 170,
        groups: [
          { type: "scout", count: 8, interval: 0.34 },
          { type: "heavy", count: 6, interval: 0.85 },
        ],
      },
      {
        name: "Shield Wall",
        hint: "Riot Shields block shots from the front. Hit them from the side, or bring armor-piercing.",
        reward: 180,
        groups: [
          { type: "grunt", count: 8, interval: 0.4 },
          { type: "riot", count: 4, interval: 0.7 },
        ],
      },
      {
        name: "Brace the Bend",
        hint: "Shields in the middle of a rush. A mortar shell ignores the shield.",
        reward: 190,
        groups: [
          { type: "scout", count: 6, interval: 0.32 },
          { type: "riot", count: 5, interval: 0.62 },
          { type: "grunt", count: 6, interval: 0.36 },
        ],
      },
      {
        name: "Quack Medics",
        hint: "Quack Medics patch whoever stands near them. Pop the medic first.",
        reward: 200,
        groups: [
          { type: "grunt", count: 8, interval: 0.38 },
          { type: "medic", count: 2, interval: 0.9 },
          { type: "heavy", count: 3, interval: 0.85 },
        ],
      },
      {
        name: "Field Hospital",
        hint: "Medics glued to the heavies. Focus the green cross.",
        reward: 215,
        groups: [
          { type: "medic", count: 3, interval: 0.7 },
          { type: "heavy", count: 5, interval: 0.75 },
          { type: "grunt", count: 6, interval: 0.34 },
        ],
      },
      {
        name: "Sneaks",
        hint: "Sneaks are faint until a Longshot is watching. Plant one before you send this.",
        reward: 225,
        groups: [
          { type: "grunt", count: 6, interval: 0.4 },
          { type: "sneak", count: 6, interval: 0.48 },
        ],
      },
      {
        name: "Shadows",
        hint: "Sneaks with scouts. The Longshot's range is your eyes.",
        reward: 240,
        groups: [
          { type: "sneak", count: 8, interval: 0.4 },
          { type: "scout", count: 6, interval: 0.32 },
        ],
      },
      {
        name: "Jeeps on the Lane",
        hint: "Jeeps are tough and pretty quick. Cannons and Longshots focus them.",
        reward: 255,
        groups: [
          { type: "grunt", count: 8, interval: 0.36 },
          { type: "jeep", count: 2, interval: 1.6 },
          { type: "heavy", count: 3, interval: 0.8 },
        ],
      },
      {
        name: "Convoy",
        hint: "A jeep convoy. Upgrade the armor-piercing kit if the purse allows.",
        reward: 270,
        groups: [
          { type: "scout", count: 8, interval: 0.3 },
          { type: "jeep", count: 3, interval: 1.25 },
          { type: "heavy", count: 4, interval: 0.7 },
        ],
      },
      {
        name: "Gnats Overhead",
        hint: "Gnat Copters ignore rifles. A Sky Guard or Chopper is the answer.",
        reward: 285,
        groups: [
          { type: "grunt", count: 6, interval: 0.38 },
          { type: "gnat", count: 3, interval: 0.7 },
        ],
      },
      {
        name: "Flak Weather",
        hint: "More gnats, with heavies underneath. Keep one gun pointed up.",
        reward: 300,
        groups: [
          { type: "gnat", count: 5, interval: 0.55 },
          { type: "scout", count: 6, interval: 0.3 },
          { type: "heavy", count: 2, interval: 0.9 },
        ],
      },
      {
        name: "Grimstache",
        hint: "General Grimstache's tank. Mortars and the Tread Tank crack it.",
        reward: 340,
        boss: true,
        groups: [
          { type: "heavy", count: 3, interval: 0.8 },
          { type: "jeep", count: 2, interval: 1.2 },
          { type: "tank", count: 1, interval: 0.4 },
        ],
      },
      {
        name: "Brute Line",
        hint: "Brutes are walking armor. Keep the armor-piercing guns hot.",
        reward: 340,
        groups: [
          { type: "brute", count: 6, interval: 0.7 },
          { type: "grunt", count: 8, interval: 0.32 },
        ],
      },
      {
        name: "Half-Tracks",
        hint: "Half-Tracks shrug off light fire. Splash and cannons do the work.",
        reward: 360,
        groups: [
          { type: "grunt", count: 6, interval: 0.34 },
          { type: "riot", count: 3, interval: 0.6 },
          { type: "halftrack", count: 2, interval: 1.4 },
        ],
      },
      {
        name: "Mixed Bag",
        hint: "Shields, medics, and sneaks together. Pop supports, then the line.",
        reward: 375,
        groups: [
          { type: "scout", count: 6, interval: 0.28 },
          { type: "riot", count: 4, interval: 0.55 },
          { type: "medic", count: 2, interval: 0.7 },
          { type: "sneak", count: 4, interval: 0.4 },
        ],
      },
      {
        name: "Air and Armor",
        hint: "Gnats over jeeps and brutes. One sky gun, one ground gun.",
        reward: 390,
        groups: [
          { type: "gnat", count: 4, interval: 0.5 },
          { type: "brute", count: 3, interval: 0.75 },
          { type: "jeep", count: 2, interval: 1.1 },
        ],
      },
      {
        name: "Iron Road",
        hint: "Half-Tracks with a moto screen. Slow the bikes, crack the trucks.",
        reward: 410,
        groups: [
          { type: "moto", count: 8, interval: 0.26 },
          { type: "jeep", count: 2, interval: 1.1 },
          { type: "halftrack", count: 3, interval: 1.2 },
        ],
      },
      {
        name: "Rush Hour",
        hint: "A sprint of bikes and sneaks. Corners and a Longshot.",
        reward: 420,
        groups: [
          { type: "moto", count: 12, interval: 0.22 },
          { type: "sneak", count: 6, interval: 0.36 },
          { type: "scout", count: 4, interval: 0.28 },
        ],
      },
      {
        name: "The Press",
        hint: "Brutes, shields, and half-tracks. Spend the purse before you send it.",
        reward: 440,
        groups: [
          { type: "riot", count: 4, interval: 0.5 },
          { type: "brute", count: 5, interval: 0.65 },
          { type: "halftrack", count: 2, interval: 1.3 },
        ],
      },
      {
        name: "Full Corps",
        hint: "Everything at once. Patch any bare corner, sky included.",
        reward: 470,
        groups: [
          { type: "grunt", count: 8, interval: 0.28 },
          { type: "riot", count: 3, interval: 0.55 },
          { type: "medic", count: 2, interval: 0.7 },
          { type: "gnat", count: 3, interval: 0.5 },
          { type: "jeep", count: 2, interval: 1.1 },
        ],
      },
      {
        name: "The Gate",
        hint: "One last press before Ironjaw. Gnats, brutes, and half-tracks.",
        reward: 500,
        groups: [
          { type: "moto", count: 6, interval: 0.24 },
          { type: "brute", count: 4, interval: 0.6 },
          { type: "gnat", count: 3, interval: 0.5 },
          { type: "halftrack", count: 2, interval: 1.2 },
        ],
      },
      {
        name: "Ironjaw",
        hint: "Ironjaw rolls in. Cannons and mortars crack him. Sky Guard owns the gnats.",
        reward: 640,
        boss: true,
        groups: [
          { type: "brute", count: 3, interval: 0.8 },
          { type: "gnat", count: 4, interval: 0.55 },
          { type: "moto", count: 6, interval: 0.3 },
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

  B.maps = {
    maple: B.map,
    cactus: {
      id: "cactus",
      name: "Cactus Junction",
      theme: "desert",
      blurb: "A dusty roadside. The lane doubles back between the rocks.",
      path: [
        [-28, 148],
        [318, 148],
        [318, 246],
        [64, 246],
        [64, 344],
        [336, 344],
        [336, 442],
        [420, 442],
      ],
      pathClearance: 26,
      towerGap: 40,
      hint: { x: 176, y: 196 },
      trees: [
        { x: 48, y: 96, r: 18, style: "cactus" },
        { x: 360, y: 92, r: 22, style: "cactus" },
        { x: 28, y: 300, r: 16, style: "cactus" },
        { x: 372, y: 292, r: 20, style: "cactus" },
        { x: 150, y: 508, r: 18, style: "cactus" },
        { x: 268, y: 516, r: 15, style: "cactus" },
      ],
      pond: { x: 196, y: 508, r: 18, kind: "well" },
      sign: { x: 270, y: 500, label: "Cactus Jct" },
      trunkBlock: 14,
      props: [
        { kind: "rock", x: 40, y: 196 },
        { kind: "crate", x: 370, y: 200 },
        { kind: "bags", x: 24, y: 390 },
        { kind: "rock", x: 250, y: 200 },
        { kind: "crate", x: 20, y: 470 },
        { kind: "bags", x: 300, y: 500 },
        { kind: "rock", x: 90, y: 500 },
        { kind: "bush", x: 360, y: 400 },
      ],
    },
  };

  B.setMap = function setMap(id) {
    const next = B.maps[id] || B.maps.maple;
    B.map = next;
    B.meta.mapName = next.name;
    B.route = B.buildPath(next.path);
    return next;
  };

  B.difficulties = {
    easy: { id: "easy", name: "Easy", cost: 0.8, cash: 300, lives: 45, blurb: "Cheaper kits and more lives." },
    medium: { id: "medium", name: "Medium", cost: 1, cash: 230, lives: 30, blurb: "The regular fight." },
    hard: { id: "hard", name: "Hard", cost: 1.35, cash: 180, lives: 16, blurb: "Pricier kits and fewer lives." },
  };
  B.costMul = 1;
  B.pay = function pay(n) {
    return Math.max(5, Math.round(Number(n) * (B.costMul || 1)));
  };

  B.setMap("maple");

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
  