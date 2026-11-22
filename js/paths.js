// Chevron Cap upgrades. Each tower holds 6 chevrons.
// Tiers 1–3 cost 1 chevron. Tier 4 costs 2 and needs tier 3 on that path.
(function (root) {
  const B = root.BOTG_BALANCE;
  const MULT = [0.6, 1.2, 3.5, 12];

  function path(id, name, base, tiers) {
    return {
      id: id,
      name: name,
      tiers: tiers.map(function (t, i) {
        return {
          name: t[0],
          blurb: t[1],
          set: t[2],
          cost: Math.max(15, Math.round(base * MULT[i])),
        };
      }),
    };
  }

  const book = {
    trooper: [
      path("marksman", "Marksman", 65, [
        ["Steady Aim", "Watches a wider patch of lane.", { range: 128 }],
        ["Long Scope", "Hits harder and farther.", { damage: 2, range: 146 }],
        ["AP Rounds", "The rifle punches armor.", { damage: 2, armorBite: 1, range: 146 }],
        ["Ace Shot", "Every 5th shot hits like a cannon.", { damage: 3, armorBite: 1, range: 160, ace: 8 }],
      ]),
      path("fireteam", "Fireteam", 65, [
        ["Buddy", "A second rifle joins the volley.", { extra: 1 }],
        ["Fireteam", "Three rifles, spread across the lane.", { extra: 2, rate: 1.7 }],
        ["Squad Leader", "Nearby guns pick up the pace.", { extra: 2, aura: 0.15 }],
        ["Rally Call", "The whole fireteam pours it on.", { extra: 3, rate: 2.2, aura: 0.15 }],
      ]),
      path("grenadier", "Grenadier", 65, [
        ["Rifle Grenade", "Every 4th shot splashes.", { grenadeEvery: 4, splash: 28 }],
        ["Frag Shells", "The splash reaches farther.", { grenadeEvery: 4, splash: 40, damage: 2 }],
        ["Sticky Charge", "Grenades bite vehicles.", { grenadeEvery: 3, splash: 40, armorBite: 0.45 }],
        ["Thunder Grenadier", "A volley that staggers the lane.", { grenadeEvery: 2, splash: 48, damage: 3, slowOnHit: 0.55 }],
      ]),
    ],
    longshot: [
      path("deadeye", "Deadeye", 230, [
        ["Crosshair", "Heavier rounds.", { damage: 22 }],
        ["Hollow Point", "Soft targets feel it.", { damage: 28, range: 200 }],
        ["Rapid Bolt", "The bolt cycles quicker.", { damage: 28, rate: 0.62 }],
        ["One-Shot Legend", "A single enormous shot.", { damage: 48, rate: 0.7, ace: 2 }],
      ]),
      path("spotter", "Spotter", 230, [
        ["Binoculars", "Sees through stealth.", { detect: 1, range: 200 }],
        ["Mark Target", "Marked foes take extra damage.", { detect: 1, mark: 0.2, range: 210 }],
        ["Field Intel", "Neighbors can see sneaks too.", { detect: 1, detectAura: 1, mark: 0.2 }],
        ["Overwatch", "Marks several targets at once.", { detect: 1, detectAura: 1, mark: 0.35, extra: 2 }],
      ]),
      path("antimateriel", "Anti-Materiel", 230, [
        ["Heavy Barrel", "Armor crumples.", { armorBite: 1, damage: 26 }],
        ["Engine Shot", "Vehicles crawl after a hit.", { armorBite: 1, damage: 30, slowOnHit: 0.6 }],
        ["Disabler", "A hit nearly stops a vehicle.", { armorBite: 1, damage: 34, slowOnHit: 0.35 }],
        ["Rail Rifle", "The shot keeps going down the lane.", { armorBite: 1, damage: 40, pierce: 4 }],
      ]),
    ],
    gatling: [
      path("belt", "Belt Feed", 115, [
        ["Bigger Belt", "The barrels spin faster.", { rate: 9.5 }],
        ["Twin Guns", "A second gun joins in.", { rate: 10, extra: 1 }],
        ["Overdrive", "No pause, just lead.", { rate: 12, extra: 1 }],
        ["Bullet Storm", "A roaring cloud of fire.", { rate: 14, extra: 2 }],
      ]),
      path("suppress", "Suppression", 115, [
        ["Pin Down", "Hits slow the march.", { slowOnHit: 0.85 }],
        ["Cover Fire", "A wider, heavier slow.", { slowOnHit: 0.7, range: 96 }],
        ["Hold the Line", "Scouts lose their sprint.", { slowOnHit: 0.6, range: 104 }],
        ["Wall of Lead", "Anything in range crawls.", { slowAura: 0.5, range: 110 }],
      ]),
      path("tracer", "Tracer", 115, [
        ["Tracers", "Rounds keep flying.", { pierce: 1 }],
        ["Steel Core", "Light armor is no longer safe.", { pierce: 1, armorBite: 0.55 }],
        ["Long Barrel", "The lane looks closer.", { pierce: 2, armorBite: 0.55, range: 112 }],
        ["Hailfire", "A piercing stream.", { pierce: 4, armorBite: 0.8, rate: 11 }],
      ]),
    ],
    mortar: [
      path("heavy", "Heavy Shell", 175, [
        ["Big Shell", "A wider crater.", { splash: 48, damage: 12 }],
        ["HE Rounds", "The blast hits harder.", { splash: 48, damage: 16 }],
        ["Bunker Buster", "Armor in the crater suffers.", { splash: 52, damage: 18, armorBite: 1 }],
        ["Big Bertha", "A huge shell on a slow clock.", { splash: 64, damage: 28, rate: 0.45, armorBite: 1 }],
      ]),
      path("battery", "Battery", 175, [
        ["Quick Load", "The tube cycles faster.", { rate: 0.75 }],
        ["Second Tube", "Two shells leave together.", { rate: 0.75, extra: 1 }],
        ["Barrage", "Four shells walk the lane.", { rate: 0.8, extra: 3 }],
        ["Rolling Barrage", "The barrage keeps rolling.", { rate: 0.9, extra: 4, splash: 40 }],
      ]),
      path("smoke", "Smoke & Signal", 175, [
        ["Smoke Shell", "The cloud slows the march.", { slowOnHit: 0.75, splash: 42 }],
        ["Flare", "Stealth shows up in the smoke.", { slowOnHit: 0.75, detect: 1, splash: 46 }],
        ["Chaff", "Flyers hate this cloud.", { slowOnHit: 0.7, detect: 1, airBonus: 1.6 }],
        ["Blackout", "Nothing in the cloud gets a tonic.", { slowOnHit: 0.6, detect: 1, healBlock: 1, splash: 50 }],
      ]),
    ],
    tread: [
      path("bore", "Big Bore", 240, [
        ["Bigger Gun", "The cannon hits harder.", { damage: 30 }],
        ["Sabot Round", "The shot keeps going.", { damage: 34, pierce: 2 }],
        ["Twin Cannon", "Two barrels, one angry tank.", { damage: 34, pierce: 2, extra: 1 }],
        ["Thunder Cannon", "A rare, enormous shell.", { damage: 50, pierce: 2, ace: 3, splash: 30 }],
      ]),
      path("patrol", "Patrol", 240, [
        ["Treads", "A little more reach.", { range: 140 }],
        ["Ram Plow", "Hits shove the line back.", { range: 140, knock: 18 }],
        ["Long Patrol", "The cannon watches farther.", { range: 160, knock: 18 }],
        ["Juggernaut", "Grunts in the blast pop.", { range: 160, knock: 28, splash: 30, damage: 36 }],
      ]),
      path("coax", "Coax", 240, [
        ["Coax MG", "A machine gun on the turret.", { extra: 1, rate: 0.55 }],
        ["Smoke Launcher", "Nearby foes slow down.", { extra: 1, slowAura: 0.75 }],
        ["Air Guard", "The coax can swat flyers.", { extra: 1, air: 1, slowAura: 0.75 }],
        ["Command Tank", "Friends nearby hit harder.", { extra: 1, air: 1, auraDamage: 0.1 }],
      ]),
    ],
    engineer: [
      path("fort", "Fortifier", 140, [
        ["Sandbags", "A deeper slow on the lane.", { slow: 0.55, range: 108 }],
        ["Sticky Mines", "The bags bite passersby.", { slow: 0.55, mine: 6, range: 108 }],
        ["Steel Wall", "Even heavies have to crawl.", { slow: 0.42, mine: 8, range: 116 }],
        ["Fortress Line", "A little turret joins the bags.", { slow: 0.42, mine: 10, extra: 1, damage: 2, rate: 1.2, range: 120 }],
      ]),
      path("quarter", "Quartermaster", 140, [
        ["Supply Crate", "A bit more cash each clear.", { wavePay: 28 }],
        ["Discount Desk", "Shows what the next buy saves.", { wavePay: 36 }],
        ["Logistics", "A real purse at wave's end.", { wavePay: 55 }],
        ["War Chest", "The crate gets heavy.", { wavePay: 80 }],
      ]),
      path("radar", "Radar", 140, [
        ["Radar Dish", "Stealth can't hide nearby.", { detect: 1, range: 120 }],
        ["Signal Boost", "Friends see a little farther.", { detect: 1, auraRange: 0.1, range: 120 }],
        ["Jammer", "Medics in range stop pouring tonic.", { detect: 1, healBlock: 1, auraRange: 0.1 }],
        ["Command Uplink", "The whole pocket fires faster.", { detect: 1, healBlock: 1, aura: 0.15, range: 130 }],
      ]),
    ],
    sky: [
      path("flak", "Flak Burst", 190, [
        ["Wide Burst", "The puff is bigger.", { splash: 36, damage: 8 }],
        ["Proximity Fuse", "It pops harder.", { splash: 36, damage: 11 }],
        ["Quad Flak", "Four barrels.", { splash: 40, damage: 11, rate: 1.15, extra: 1 }],
        ["Skyshield", "Flyers in range drag.", { splash: 44, damage: 12, airBonus: 2.6, slowAura: 0.6 }],
      ]),
      path("missile", "Missile", 190, [
        ["Homing Missile", "A missile that finds them.", { damage: 10, splash: 22 }],
        ["Twin Rack", "Two missiles.", { damage: 10, extra: 1, splash: 22 }],
        ["Tank Buster", "Missiles hurt ground armor.", { damage: 14, extra: 1, armorBite: 0.8, splash: 24 }],
        ["Swarm Pod", "A handful of missiles.", { damage: 12, extra: 4, splash: 20, rate: 0.7 }],
      ]),
      path("dual", "Dual-Purpose", 190, [
        ["Lower Elevation", "Ground troops are fair game.", { damage: 8 }],
        ["AP Flak", "Light armor doesn't shrug it off.", { damage: 9, armorBite: 0.7 }],
        ["Range Finder", "The sky looks bigger.", { damage: 9, armorBite: 0.7, range: 180 }],
        ["Sky and Ground", "Full effort at both.", { damage: 12, armorBite: 0.85, range: 180, airBonus: 2 }],
      ]),
    ],
    chopper: [
      path("gunship", "Gunship", 260, [
        ["Door Gun", "The door gun chatters.", { rate: 3.2, damage: 4 }],
        ["Rocket Pods", "Rockets splash the lane.", { rate: 3.2, damage: 4, splash: 22 }],
        ["Heavy Gunship", "The chain gun is armor-piercing.", { rate: 3.4, damage: 5, splash: 22, armorBite: 0.85 }],
        ["Sky Titan", "A second chopper joins the orbit.", { rate: 3.4, damage: 5, splash: 22, armorBite: 0.85, extra: 1 }],
      ]),
      path("strike", "Airstrike", 260, [
        ["Strike Call", "Every few seconds a bomb falls.", { strike: 8, strikeDmg: 14 }],
        ["Faster Turnaround", "The jets come back sooner.", { strike: 12, strikeDmg: 16 }],
        ["Carpet Run", "A longer, hotter line.", { strike: 14, strikeDmg: 22, splash: 30 }],
        ["Thunder Run", "Three bombs in a row.", { strike: 16, strikeDmg: 18, extra: 2, splash: 28 }],
      ]),
      path("recon", "Recon & Supply", 260, [
        ["Spotlight", "The chopper spots sneaks.", { detect: 1, range: 140 }],
        ["Supply Drop", "Cash falls with the rotors.", { detect: 1, wavePay: 24 }],
        ["Medevac", "A cleared wave gives a life back sometimes.", { detect: 1, wavePay: 24, lifeOnClear: 1 }],
        ["Airlift", "The pad pays for itself.", { detect: 1, wavePay: 40, lifeOnClear: 1, range: 150 }],
      ]),
    ],
  };

  Object.keys(book).forEach(function (id) {
    if (B.towers[id]) B.towers[id].paths = book[id];
  });

  B.chevronCap = 6;

  B.chevronsUsed = function (type, ranks) {
    const def = B.towers[type];
    let n = 0;
    (def.paths || []).forEach(function (p) {
      const r = (ranks && ranks[p.id]) || 0;
      for (let i = 0; i < r; i++) n += i >= 3 ? 2 : 1;
    });
    return n;
  };

  const oldStats = B.statsFor;
  B.statsFor = function statsFor(type, ranks) {
    const def = B.towers[type];
    if (!def.paths || !ranks || typeof ranks !== "object") return oldStats(type, ranks || 0);
    const stats = Object.assign({ name: def.name }, def.base);
    let badge = "";
    let best = 0;
    def.paths.forEach(function (p) {
      const r = ranks[p.id] || 0;
      for (let i = 0; i < r; i++) Object.assign(stats, p.tiers[i].set || {});
      if (r > best) {
        best = r;
        badge = p.name;
      }
    });
    stats.badge = badge;
    stats.blurb = def.blurb;
    stats.rankName = badge || def.name;
    return stats;
  };
})(typeof window !== "undefined" ? window : globalThis);
