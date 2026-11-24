
// Boots on the Ground — every tunable number lives here.
// Classic script (no modules) so the demo opens from a file:// page.
(function (root) {
  root.BOTG_BALANCE = {
    meta: {
      title: "Boots on the Ground",
      mapName: "Normandy Shore",
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
      name: "Normandy Shore",
      theme: "grove",
      blurb: "A beach road through the bocage. The first landing.",
      // Dirt lane. Coordinates are game pixels. Internal id stays maple.
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
      // Trees, props, and the pond are the footprints painted into assets/art/maps.
      hint: { x: 188, y: 160 },
      sign: { x: 78, y: 524, label: "Normandy" },
      // Painted obstacles from the WW2 plate. Craters are not in this list.
      blocks: [
        { kind: "horizon_beach_strip", x: 0, y: 48, w: 400, h: 44 },
        { kind: "pillbox", x: 45, y: 63, w: 47, h: 35 },
        { kind: "sandbag_wall", x: 0, y: 66, w: 46, h: 32 },
        { kind: "hedgerow_bank_left", x: 0, y: 118, w: 36, h: 114 },
        { kind: "hedgerow_bank_right", x: 364, y: 63, w: 36, h: 119 },
        { kind: "hedgehog", x: 49, y: 129, w: 32, h: 32 },
        { kind: "hedgehog", x: 322, y: 104, w: 27, h: 29 },
        { kind: "hedgehog", x: 334, y: 191, w: 43, h: 43 },
        { kind: "hedgehog", x: 14, y: 247, w: 32, h: 39 },
        { kind: "hedgehog", x: 351, y: 313, w: 40, h: 39 },
        { kind: "hedgehog", x: 348, y: 390, w: 50, h: 39 },
        { kind: "hedgehog", x: 136, y: 497, w: 46, h: 73 },
        { kind: "barbed_wire_posts", x: 0, y: 452, w: 98, h: 118 },
      ],
    },

    towers: {
      trooper: {
        name: "Trooper",
        cost: 65,
        blurb: "Rifleman in olive drab. Medium range, steady shots.",
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
            blurb: "Faster cycle and a longer view down the lane.",
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
        blurb: "Slows the lane and spots infiltrators nearby. Pays a little each wave.",
        aim: "near",
        base: {
          damage: 0,
          range: 96,
          rate: 0,
          armorBite: 0,
          projectileSpeed: 0,
          slow: 0.64,
          wavePay: 18,
          detect: 1,
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
          damage: 2,
          range: 112,
          rate: 2.0,
          armorBite: 0.1,
          projectileSpeed: 340,
          role: "chopper",
        },
        upgrades: [
          { name: "Rocket Pods", cost: 150, blurb: "Every few shots a rocket splashes.", set: { damage: 3, splash: 18 } },
          { name: "Heavy Gunship", cost: 200, blurb: "The chain gun bites armor.", set: { damage: 4, splash: 18, armorBite: 0.5, rate: 2.3 } },
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
        speed: 88,
        cash: 7,
        armor: 0,
        leak: 1,
        radius: 11,
        scale: 0.86,
        vehicle: false,
      },
      dash: {
        name: "Dash Scout",
        hp: 5,
        speed: 100,
        cash: 6,
        armor: 0,
        leak: 1,
        radius: 10,
        scale: 0.8,
        vehicle: false,
        fast: true,
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
        name: "Scowl Tank",
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
        speed: 86,
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
        shieldHp: 14,
      },
      bulwark: {
        name: "Bulwark",
        hp: 30,
        speed: 26,
        cash: 14,
        armor: 0.2,
        leak: 2,
        radius: 15,
        scale: 1.12,
        vehicle: false,
        shield: true,
        shieldHp: 36,
      },
      medic: {
        name: "Corps Medic",
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
      camo: {
        name: "Infiltrator",
        hp: 16,
        speed: 50,
        cash: 11,
        armor: 0,
        leak: 2,
        radius: 12,
        scale: 1,
        vehicle: false,
        camo: true,
      },
      para: {
        name: "Paratrooper",
        hp: 14,
        speed: 48,
        cash: 10,
        armor: 0,
        leak: 2,
        radius: 12,
        scale: 1,
        vehicle: false,
        drop: 0.46,
        dropTime: 1.25,
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
      plate: {
        name: "Plate Coat",
        hp: 24,
        speed: 30,
        cash: 12,
        armor: 0.1,
        leak: 2,
        radius: 14,
        scale: 1.05,
        vehicle: false,
        smallArms: true,
      },
      outrider: {
        name: "Outrider",
        hp: 4,
        speed: 124,
        cash: 7,
        armor: 0,
        leak: 1,
        radius: 10,
        scale: 0.82,
        vehicle: false,
        fast: true,
      },
      marksman: {
        name: "Grey Marksman",
        hp: 14,
        speed: 40,
        cash: 12,
        armor: 0,
        leak: 2,
        radius: 11,
        scale: 1,
        vehicle: false,
        camo: true,
        suppress: true,
      },
      stick: {
        name: "Stick Trooper",
        hp: 12,
        speed: 50,
        cash: 9,
        armor: 0,
        leak: 2,
        radius: 11,
        scale: 0.95,
        vehicle: false,
        drop: 0.72,
        dropTime: 1.05,
      },
      vex: {
        name: "Captain Vex",
        hp: 260,
        speed: 24,
        cash: 70,
        armor: 0.08,
        leak: 6,
        radius: 16,
        scale: 1.3,
        vehicle: false,
        boss: true,
        shield: true,
        shieldHp: 80,
        calls: 6,
        callEvery: 3.4,
      },
      ram: {
        name: "The Ram",
        hp: 560,
        speed: 16,
        cash: 100,
        armor: 0.3,
        leak: 8,
        radius: 30,
        scale: 1.2,
        vehicle: true,
        boss: true,
        plates: 140,
      },
      blimp: {
        name: "Grey Blimp",
        hp: 400,
        speed: 26,
        cash: 110,
        armor: 0,
        leak: 8,
        radius: 30,
        scale: 1.3,
        vehicle: false,
        air: true,
        boss: true,
        drops: 4,
        dropEvery: 5,
      },
    },

    // Thirty rounds. Early files are slow and spaced. Each new trick
    // gets a round of its own, then one more, before it mixes in.
    // hp and speed on a group are a one-wave pace, not a new enemy.
    waves: [
      {
        name: "First File",
        hint: "Four green recruits, walking slow. One Trooper on the glowing mark is enough.",
        reward: 50,
        groups: [{ type: "grunt", count: 4, interval: 4.2, hp: 4, speed: 20 }],
      },
      {
        name: "Still Walking",
        hint: "Five more, a little quicker. The same rifle still has time.",
        reward: 55,
        groups: [{ type: "grunt", count: 5, interval: 2.6, hp: 5, speed: 24 }],
      },
      {
        name: "Longer File",
        hint: "Five recruits, still with room between them. The same rifle keeps up.",
        reward: 60,
        groups: [{ type: "grunt", count: 5, interval: 2.05, hp: 5, speed: 24 }],
      },
      {
        name: "Picking Up",
        hint: "Six of them, a step quicker. Two rifles make this boring, in a good way.",
        reward: 65,
        groups: [{ type: "grunt", count: 6, interval: 1.95, hp: 6, speed: 26 }],
      },
      {
        name: "Grunt Line",
        hint: "A short file of grunts, still spaced out. One rifle on the mark can finish it. Two lanes want two rifles.",
        reward: 75,
        groups: [{ type: "grunt", count: 5, interval: 2.1, hp: 6, speed: 28 }],
      },
      {
        name: "Scouts",
        hint: "Scouts are new, and quicker. A few of them, nothing else. A second rifle or a Gatling helps.",
        reward: 85,
        groups: [{ type: "scout", count: 5, interval: 1.2, speed: 70 }],
      },
      {
        name: "Scout File",
        hint: "More scouts, at full jog, with a few grunts behind them.",
        reward: 95,
        groups: [
          { type: "scout", count: 7, interval: 0.85 },
          { type: "grunt", count: 4, interval: 1.05 },
        ],
      },
      {
        name: "Armor",
        hint: "Heavies are new. Rifles tickle the coats. A Longshot or a shell punches through.",
        reward: 110,
        groups: [
          { type: "heavy", count: 3, interval: 1.9 },
          { type: "grunt", count: 4, interval: 1.1 },
        ],
      },
      {
        name: "Heavy Company",
        hint: "Heavies again, with scouts running past them. Deal with the armor, then the jog.",
        reward: 120,
        groups: [
          { type: "heavy", count: 4, interval: 1.35 },
          { type: "scout", count: 5, interval: 0.8 },
        ],
      },
      {
        name: "Captain Vex",
        hint: "His shield drinks rifle fire. A shell cracks it, then he calls a squad.",
        reward: 200,
        boss: true,
        groups: [
          { type: "grunt", count: 4, interval: 0.9 },
          { type: "vex", count: 1, interval: 0.4 },
          { type: "heavy", count: 2, interval: 1.2 },
        ],
      },
      {
        name: "Shields",
        hint: "Riot shields are new. Rifle fire from the front hits the shield. A shell goes around it.",
        reward: 140,
        groups: [
          { type: "riot", count: 4, interval: 1.25 },
          { type: "grunt", count: 4, interval: 1.0 },
        ],
      },
      {
        name: "Shield Wall",
        hint: "More shields, and the scouts you already know slipping past.",
        reward: 150,
        groups: [
          { type: "riot", count: 6, interval: 0.95 },
          { type: "scout", count: 4, interval: 0.7 },
        ],
      },
      {
        name: "Bikes",
        hint: "Moto Scouts are new and fast. A Gatling on a corner catches the sprint.",
        reward: 160,
        groups: [{ type: "moto", count: 5, interval: 0.95 }],
      },
      {
        name: "Outriders",
        hint: "Outriders are faster still. You met the bikes last round. These are the ones that blur.",
        reward: 170,
        groups: [
          { type: "moto", count: 4, interval: 0.7 },
          { type: "outrider", count: 3, interval: 0.85 },
          { type: "grunt", count: 4, interval: 0.8 },
        ],
      },
      {
        name: "Sneaks",
        hint: "Sneaks are faint until a Longshot is watching. This round is only them.",
        reward: 180,
        groups: [{ type: "sneak", count: 5, interval: 1.15 }],
      },
      {
        name: "More Shadows",
        hint: "Sneaks again, with scouts you can see. The rifle finds the scouts. The Longshot finds the rest.",
        reward: 190,
        groups: [
          { type: "sneak", count: 6, interval: 0.8 },
          { type: "scout", count: 4, interval: 0.65 },
        ],
      },
      {
        name: "Infiltrators",
        hint: "Infiltrators stay hidden. A Longshot is not enough. An Engineer or a recon upgrade sees them.",
        reward: 200,
        groups: [
          { type: "camo", count: 4, interval: 1.15 },
          { type: "grunt", count: 4, interval: 0.9 },
        ],
      },
      {
        name: "Marksmen",
        hint: "Grey Marksmen hide like infiltrators, and they pin a gun until someone spots them.",
        reward: 210,
        groups: [
          { type: "marksman", count: 3, interval: 1.2 },
          { type: "camo", count: 3, interval: 0.9 },
          { type: "grunt", count: 4, interval: 0.75 },
        ],
      },
      {
        name: "Jeeps",
        hint: "Jeeps are new. Tough, and quicker than a heavy. Cannons and Longshots focus them.",
        reward: 230,
        groups: [
          { type: "jeep", count: 2, interval: 2.1 },
          { type: "grunt", count: 5, interval: 0.7 },
          { type: "heavy", count: 2, interval: 1.2 },
        ],
      },
      {
        name: "The Ram",
        hint: "Armor plates shrug off rifles. Explosives crack the plates, then the train.",
        reward: 340,
        boss: true,
        groups: [
          { type: "heavy", count: 2, interval: 1.0 },
          { type: "jeep", count: 1, interval: 1.4 },
          { type: "ram", count: 1, interval: 0.5 },
        ],
      },
      {
        name: "Plate Coats",
        hint: "Plate coats are new. Rifles plink. An armor-piercing upgrade or a shell gets through.",
        reward: 250,
        groups: [
          { type: "plate", count: 4, interval: 1.15 },
          { type: "grunt", count: 5, interval: 0.7 },
        ],
      },
      {
        name: "Plate Line",
        hint: "More plate coats, with scouts using them as cover.",
        reward: 265,
        groups: [
          { type: "plate", count: 6, interval: 0.9 },
          { type: "scout", count: 5, interval: 0.55 },
        ],
      },
      {
        name: "Gnats",
        hint: "Gnat Copters are new, and rifles cannot touch them. A Sky Guard or a Chopper can.",
        reward: 280,
        groups: [
          { type: "gnat", count: 3, interval: 1.3 },
          { type: "grunt", count: 5, interval: 0.75 },
        ],
      },
      {
        name: "More Gnats",
        hint: "Gnats again, over a few heavies. One sky gun, one ground gun.",
        reward: 295,
        groups: [
          { type: "gnat", count: 5, interval: 0.85 },
          { type: "heavy", count: 2, interval: 1.1 },
          { type: "grunt", count: 4, interval: 0.6 },
        ],
      },
      {
        name: "Paratroopers",
        hint: "Paratroopers are new. They drop onto the middle of the lane. A gun on the first bend never sees them.",
        reward: 310,
        groups: [
          { type: "para", count: 4, interval: 1.15 },
          { type: "grunt", count: 4, interval: 0.7 },
        ],
      },
      {
        name: "Stick Drop",
        hint: "Stick troopers drop even later. You already know the chute. Watch the far bend.",
        reward: 325,
        groups: [
          { type: "stick", count: 3, interval: 1.05 },
          { type: "para", count: 3, interval: 0.9 },
          { type: "gnat", count: 2, interval: 1.0 },
        ],
      },
      {
        name: "Corps Medics",
        hint: "Corps Medics are new. They patch whoever stands near them. Drop the medic first.",
        reward: 340,
        groups: [
          { type: "medic", count: 3, interval: 1.0 },
          { type: "heavy", count: 3, interval: 1.0 },
          { type: "grunt", count: 5, interval: 0.55 },
        ],
      },
      {
        name: "Brutes",
        hint: "Brutes are new, thicker armor than a heavy. Keep the armor-piercing guns hot.",
        reward: 360,
        groups: [
          { type: "brute", count: 4, interval: 1.05 },
          { type: "riot", count: 3, interval: 0.8 },
          { type: "grunt", count: 6, interval: 0.45 },
        ],
      },
      {
        name: "The Press",
        hint: "Half-tracks, bulwarks, and a sprint of dash scouts. Everything you have practiced, at once.",
        reward: 400,
        groups: [
          { type: "dash", count: 6, interval: 0.4 },
          { type: "bulwark", count: 2, interval: 1.0 },
          { type: "halftrack", count: 2, interval: 1.4 },
          { type: "gnat", count: 3, interval: 0.7 },
          { type: "camo", count: 3, interval: 0.65 },
        ],
      },
      {
        name: "Grey Blimp",
        hint: "The blimp sails over the lane and drops troops. Sky guns own it. Ironjaw still rolls.",
        reward: 640,
        boss: true,
        groups: [
          { type: "blimp", count: 1, interval: 0.3 },
          { type: "gnat", count: 2, interval: 0.8 },
          { type: "ironjaw", count: 1, interval: 2.6 },
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
      name: "Desert Outpost",
      theme: "desert",
      blurb: "A dusty street between the houses. The lane doubles back.",
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
      sign: { x: 270, y: 500, label: "Outpost" },
      blocks: [
        { kind: "horizon_town_strip", x: 0, y: 48, w: 400, h: 8 },
        { kind: "market_stall", x: 0, y: 57, w: 96, h: 57 },
        { kind: "burned_car", x: 100, y: 65, w: 66, h: 33 },
        { kind: "hesco_row", x: 217, y: 57, w: 97, h: 35 },
        { kind: "house_and_stall", x: 317, y: 52, w: 83, h: 71 },
        { kind: "house_right", x: 348, y: 228, w: 52, h: 74 },
        { kind: "wall_stub", x: 0, y: 357, w: 14, h: 35 },
        { kind: "house_bottom_left", x: 0, y: 400, w: 114, h: 114 },
        { kind: "hesco_and_barrels", x: 65, y: 448, w: 106, h: 84 },
        { kind: "sandbags", x: 26, y: 504, w: 53, h: 45 },
      ],
    },
    frost: {
      id: "frost",
      name: "Ardennes Woods",
      theme: "snow",
      blurb: "Two snowy lanes that meet at the village gate.",
      path: [
        [-28, 110],
        [300, 110],
        [300, 190],
        [50, 190],
        [50, 250],
        [340, 250],
        [340, 500],
        [430, 500],
      ],
      paths: [
        [
          [-28, 110],
          [300, 110],
          [300, 190],
          [50, 190],
          [50, 250],
          [340, 250],
          [340, 500],
          [430, 500],
        ],
        [
          [-28, 330],
          [220, 330],
          [220, 410],
          [40, 410],
          [40, 490],
          [300, 490],
          [300, 410],
          [340, 410],
          [340, 500],
          [430, 500],
        ],
      ],
      pathClearance: 24,
      towerGap: 40,
      hint: { x: 176, y: 220 },
      sign: { x: 180, y: 536, label: "Ardennes" },
      blocks: [
        { kind: "horizon_village_strip", x: 0, y: 48, w: 400, h: 26 },
        { kind: "sandbags", x: 200, y: 74, w: 53, h: 18 },
        { kind: "fence", x: 343, y: 83, w: 57, h: 35 },
        { kind: "rock", x: 48, y: 135, w: 31, h: 23 },
        { kind: "rock", x: 348, y: 130, w: 52, h: 32 },
        { kind: "pillbox_tank_trap", x: 343, y: 174, w: 49, h: 49 },
        { kind: "pine", x: 0, y: 157, w: 18, h: 44 },
        { kind: "log_foxhole", x: 0, y: 278, w: 62, h: 45 },
        { kind: "rock", x: 78, y: 278, w: 23, h: 23 },
        { kind: "hedgehog_ball", x: 139, y: 274, w: 36, h: 27 },
        { kind: "frozen_pond", x: 240, y: 283, w: 61, h: 44 },
        { kind: "pine_cluster", x: 378, y: 287, w: 22, h: 122 },
        { kind: "rock", x: 261, y: 348, w: 40, h: 18 },
        { kind: "rock", x: 87, y: 358, w: 27, h: 17 },
        { kind: "fence", x: 130, y: 448, w: 58, h: 31 },
        { kind: "rock_tank_trap", x: 200, y: 430, w: 53, h: 32 },
        { kind: "tank_trap_pile", x: 30, y: 517, w: 71, h: 41 },
        { kind: "hedgehog", x: 126, y: 526, w: 27, h: 23 },
        { kind: "rock", x: 217, y: 526, w: 45, h: 40 },
        { kind: "rock", x: 309, y: 530, w: 49, h: 40 },
        { kind: "pine", x: 0, y: 504, w: 18, h: 62 },
      ],
    },
  };

  B.setMap = function setMap(id) {
    const next = B.maps[id] || B.maps.maple;
    B.map = next;
    B.meta.mapName = next.name;
    const lines = next.paths && next.paths.length ? next.paths : [next.path];
    B.routes = lines.map(function (pts) { return B.buildPath(pts); });
    B.route = B.routes[0];
    return next;
  };

  B.routeFor = function routeFor(lane) {
    if (B.routes && B.routes[lane || 0]) return B.routes[lane || 0];
    return B.route;
  };

  B.difficulties = {
    easy: { id: "easy", name: "Easy", cost: 0.8, cash: 300, lives: 45, blurb: "Cheaper kits and more lives." },
    medium: { id: "medium", name: "Medium", cost: 1, cash: 230, lives: 30, blurb: "The regular fight." },
    hard: { id: "hard", name: "Hard", cost: 1.35, cash: 180, lives: 16, blurb: "Pricier kits and fewer lives." },
  };
  B.costMul = 1;
  B.kits = [
    { id: "field", name: "Olive drab", cost: 0, blurb: "The kit every recruit is issued." },
    { id: "parade", name: "Khaki flash", cost: 15, blurb: "A khaki cloth and a brass belt." },
    { id: "night", name: "Night drill", cost: 25, blurb: "Darker cloth for the late rounds." },
    { id: "sand", name: "Desert tan", cost: 30, blurb: "Tan cloth for the dry maps." },
    { id: "dress", name: "Dress blue", cost: 40, blurb: "Blue jackets for the review." },
  ];

  B.medalPay = { easy: 12, medium: 20, hard: 32 };

  B.pay = function pay(n) {
    return Math.max(5, Math.round(Number(n) * (B.costMul || 1)));
  };

  B.setMap("maple");

  B.pointAt = function pointAt(dist, lane) {
    const route = B.routeFor(lane);
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
    const routes = B.routes && B.routes.length ? B.routes : [B.route];
    for (let r = 0; r < routes.length; r++) {
      for (const s of routes[r].segs) best = Math.min(best, distToSeg(x, y, s.a, s.b).d);
    }
    return best;
  };

  B.nearestAngle = function nearestAngle(x, y) {
    let best = Infinity;
    let angle = 0;
    const routes = B.routes && B.routes.length ? B.routes : [B.route];
    for (let r = 0; r < routes.length; r++) {
      for (const s of routes[r].segs) {
        const hit = distToSeg(x, y, s.a, s.b);
        if (hit.d < best) {
          best = hit.d;
          angle = Math.atan2(s.b.y - s.a.y, s.b.x - s.a.x);
        }
      }
    }
    return angle;
  };
})(typeof window !== "undefined" ? window : globalThis);
  