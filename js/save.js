// Progress and difficulty, stored on this phone only.
(function (root) {
  const KEY = "botg-progress";
  const DIFFS = ["easy", "medium", "hard"];

  function blankMap() {
    return {
      best: { easy: 0, medium: 0, hard: 0 },
      wins: { easy: false, medium: false, hard: false },
    };
  }

  const Save = {
    data: { difficulty: "medium", maps: {}, tutorial: false },

    load() {
      try {
        const raw = root.localStorage.getItem(KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") this.data = parsed;
      } catch (err) {
        /* private mode or bad json */
      }
      if (!this.data.maps) this.data.maps = {};
      if (!this.data.difficulty) this.data.difficulty = "medium";
      if (this.data.tutorial == null) this.data.tutorial = false;
    },

    save() {
      try {
        root.localStorage.setItem(KEY, JSON.stringify(this.data));
      } catch (err) {
        /* private mode */
      }
    },

    map(id) {
      if (!this.data.maps[id]) this.data.maps[id] = blankMap();
      const m = this.data.maps[id];
      if (!m.best) m.best = { easy: 0, medium: 0, hard: 0 };
      if (!m.wins) m.wins = { easy: false, medium: false, hard: false };
      return m;
    },

    record(mapId, diff, round, won) {
      const d = DIFFS.indexOf(diff) >= 0 ? diff : "medium";
      const m = this.map(mapId || "maple");
      m.best[d] = Math.max(m.best[d] || 0, round || 0);
      if (won) m.wins[d] = true;
      this.save();
    },

    stars(mapId) {
      const m = this.data.maps[mapId];
      if (!m || !m.wins) return 0;
      return DIFFS.filter((d) => m.wins[d]).length;
    },

    best(mapId, diff) {
      const m = this.data.maps[mapId];
      if (!m || !m.best) return 0;
      if (diff && DIFFS.indexOf(diff) >= 0) return m.best[diff] || 0;
      return Math.max(m.best.easy || 0, m.best.medium || 0, m.best.hard || 0);
    },

    played() {
      const maps = this.data.maps || {};
      return Object.keys(maps).some((id) => {
        const best = maps[id] && maps[id].best;
        return best && ((best.easy || 0) + (best.medium || 0) + (best.hard || 0) > 0);
      });
    },

    wonAny(mapId) {
      const m = this.data.maps[mapId];
      return !!(m && m.wins && DIFFS.some((d) => m.wins[d]));
    },
  };

  Save.load();
  root.BOTGSave = Save;
})(typeof window !== "undefined" ? window : globalThis);
