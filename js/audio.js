
// Tiny synthesized effects. No audio files, so the demo stays one folder.
(function (root) {
  const A = {
    ctx: null,
    muted: false,
    music: true,
    sfx: true,
    last: {},
    marching: false,
    step: 0,
    nextAt: 0,
    timer: 0,

    ensure() {
      if (!this.ctx) {
        const AC = root.AudioContext || root.webkitAudioContext;
        if (!AC) return null;
        this.ctx = new AC();
      }
      if (this.ctx.state === "suspended") this.ctx.resume();
      this.maybeMarch();
      return this.ctx;
    },

    loadSettings() {
      try {
        this.muted = root.localStorage.getItem("botg-muted") === "1";
        const music = root.localStorage.getItem("botg-music");
        const sfx = root.localStorage.getItem("botg-sfx");
        this.music = music == null ? true : music === "1";
        this.sfx = sfx == null ? true : sfx === "1";
      } catch (err) {
        this.muted = false;
        this.music = true;
        this.sfx = true;
      }
    },

    store(key, on) {
      try {
        root.localStorage.setItem(key, on ? "1" : "0");
      } catch (err) {
        /* private mode */
      }
    },

    toggle() {
      this.muted = !this.muted;
      this.store("botg-muted", this.muted);
      if (this.muted) this.stopMarch();
      else {
        this.maybeMarch();
        this.play("ui");
      }
      return this.muted;
    },

    toggleMusic() {
      this.music = !this.music;
      this.store("botg-music", this.music);
      if (!this.music || this.muted) this.stopMarch();
      else this.maybeMarch();
      if (this.sfx && !this.muted) this.play("ui");
      return this.music;
    },

    toggleSfx() {
      this.sfx = !this.sfx;
      this.store("botg-sfx", this.sfx);
      if (this.sfx && !this.muted) this.play("ui");
      return this.sfx;
    },

    tone(freq, dur, type, gain, delay, slideTo) {
      const ctx = this.ctx;
      if (!ctx || this.muted || !this.sfx) return;
      const t = ctx.currentTime + (delay || 0);
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type || "sine";
      o.frequency.setValueAtTime(Math.max(40, freq), t);
      if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(40, slideTo), t + dur);
      g.gain.setValueAtTime(gain, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g);
      g.connect(ctx.destination);
      o.start(t);
      o.stop(t + dur + 0.03);
    },

    noise(dur, gain, freq) {
      const ctx = this.ctx;
      if (!ctx || this.muted || !this.sfx) return;
      const count = Math.max(1, Math.floor(ctx.sampleRate * dur));
      const buf = ctx.createBuffer(1, count, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.value = freq || 900;
      filter.Q.value = 0.7;
      const g = ctx.createGain();
      const t = ctx.currentTime;
      g.gain.setValueAtTime(gain, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(filter);
      filter.connect(g);
      g.connect(ctx.destination);
      src.start(t);
      src.stop(t + dur + 0.02);
    },

    // Drop repeated gatling ticks so a spin-up doesn't become a buzzsaw.
    throttled(name, gap) {
      const now = performance.now();
      if (this.last[name] && now - this.last[name] < gap) return true;
      this.last[name] = now;
      return false;
    },

    play(name) {
      if (name === "gatling" && this.throttled("gatling", 55)) return;
      if (name === "rifle" && this.throttled("rifle", 40)) return;
      switch (name) {
        case "ui":
          this.tone(620, 0.07, "sine", 0.05);
          break;
        case "place":
          this.tone(523, 0.08, "triangle", 0.06, 0);
          this.tone(659, 0.09, "triangle", 0.05, 0.07);
          this.tone(784, 0.12, "triangle", 0.05, 0.14);
          break;
        case "deny":
          this.tone(196, 0.12, "square", 0.04, 0, 120);
          break;
        case "upgrade":
          this.tone(523, 0.08, "sine", 0.06, 0);
          this.tone(784, 0.14, "sine", 0.06, 0.08);
          break;
        case "sell":
          this.tone(440, 0.1, "triangle", 0.05, 0, 260);
          break;
        case "rifle":
          this.noise(0.05, 0.05, 1400);
          this.tone(380, 0.06, "square", 0.03, 0, 180);
          break;
        case "sniper":
          this.noise(0.09, 0.07, 400);
          this.tone(140, 0.16, "sawtooth", 0.04, 0, 70);
          break;
        case "gatling":
          this.noise(0.03, 0.03, 1800);
          break;
        case "mauler":
          if (this.throttled("mauler", 45)) return;
          this.noise(0.04, 0.04, 900);
          this.tone(70, 0.04, "square", 0.02);
          break;
        case "flame":
          if (this.throttled("flame", 90)) return;
          this.noise(0.12, 0.05, 400);
          this.tone(180, 0.1, "sawtooth", 0.03, 0, 90);
          break;
        case "mortar":
          this.noise(0.12, 0.07, 220);
          this.tone(90, 0.2, "sine", 0.06, 0, 50);
          break;
        case "cannon":
          this.noise(0.14, 0.08, 180);
          this.tone(70, 0.22, "sawtooth", 0.05, 0, 40);
          break;
        case "flak":
          this.noise(0.08, 0.05, 900);
          this.tone(520, 0.06, "square", 0.03, 0, 200);
          break;
        case "chopper":
          if (this.throttled("chopper", 90)) return;
          this.noise(0.05, 0.03, 700);
          this.tone(90, 0.08, "sawtooth", 0.02);
          break;
        case "wrench":
          this.tone(880, 0.05, "square", 0.03);
          this.tone(440, 0.08, "triangle", 0.03, 0.05);
          break;
        case "poof":
          this.noise(0.18, 0.05, 600);
          this.tone(660, 0.12, "sine", 0.03, 0, 220);
          break;
        case "bossPoof":
          this.noise(0.35, 0.08, 240);
          this.tone(220, 0.3, "triangle", 0.06, 0, 80);
          this.tone(520, 0.2, "sine", 0.04, 0.05);
          break;
        case "leak":
          this.tone(160, 0.18, "triangle", 0.06, 0, 90);
          break;
        case "wave":
          // Original bugle sting. Harmonic-series notes only, not a standard call.
          [523, 784, 659, 1047].forEach((f, i) => this.tone(f, i === 3 ? 0.24 : 0.08, "triangle", 0.05, i * 0.09));
          this.tone(523, 0.2, "sine", 0.02, 0.18);
          break;
        case "boss":
          this.tone(110, 0.28, "sawtooth", 0.05, 0, 70);
          this.tone(165, 0.28, "square", 0.03, 0.08);
          this.tone(98, 0.4, "triangle", 0.05, 0.16);
          break;
        case "clear":
          this.tone(523, 0.08, "sine", 0.05, 0);
          this.tone(659, 0.1, "sine", 0.05, 0.08);
          break;
        case "win":
          [523, 659, 784, 1046].forEach((f, i) => this.tone(f, 0.18, "triangle", 0.06, i * 0.12));
          break;
        case "lose":
          this.tone(311, 0.2, "triangle", 0.05, 0, 196);
          this.tone(196, 0.35, "sine", 0.05, 0.18, 110);
          break;
        default:
          break;
      }
    },

    // Boot-camp march. Eighth notes at a walking cadence. Original motif.
    maybeMarch() {
      if (!this.ctx || this.muted || !this.music || this.marching) return;
      this.marching = true;
      this.step = 0;
      this.nextAt = this.ctx.currentTime + 0.08;
      this.pump();
    },

    stopMarch() {
      this.marching = false;
      if (this.timer) root.clearTimeout(this.timer);
      this.timer = 0;
    },

    pump() {
      if (!this.marching || !this.ctx) return;
      const ahead = this.ctx.currentTime + 0.28;
      const eighth = 0.25;
      while (this.nextAt < ahead) {
        this.cadence(this.nextAt, this.step);
        this.step = (this.step + 1) % 64;
        this.nextAt += eighth;
      }
      const wait = Math.max(40, (this.nextAt - this.ctx.currentTime - 0.12) * 1000);
      this.timer = root.setTimeout(() => this.pump(), wait);
    },

    atTone(time, freq, dur, type, gain, slideTo) {
      if (!this.ctx || this.muted || !this.music) return;
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = type || "sine";
      o.frequency.setValueAtTime(Math.max(40, freq), time);
      if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(40, slideTo), time + dur);
      g.gain.setValueAtTime(gain, time);
      g.gain.exponentialRampToValueAtTime(0.0001, time + dur);
      o.connect(g);
      g.connect(this.ctx.destination);
      o.start(time);
      o.stop(time + dur + 0.02);
    },

    atNoise(time, dur, gain, freq) {
      if (!this.ctx || this.muted || !this.music) return;
      const count = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
      const buf = this.ctx.createBuffer(1, count, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      const filter = this.ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.value = freq || 1800;
      filter.Q.value = 0.8;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(gain, time);
      g.gain.exponentialRampToValueAtTime(0.0001, time + dur);
      src.connect(filter);
      filter.connect(g);
      g.connect(this.ctx.destination);
      src.start(time);
      src.stop(time + dur + 0.02);
    },

    cadence(time, step) {
      const quarter = step % 4 === 0;
      const backbeat = step % 4 === 2;
      if (quarter) this.atTone(time, 62, 0.14, "sine", 0.05, 42);
      this.atNoise(time, backbeat ? 0.05 : 0.025, backbeat ? 0.028 : 0.01, backbeat ? 2200 : 1600);
      if (backbeat) this.atTone(time, 190, 0.04, "triangle", 0.012, 140);
      if (step % 2 === 0) {
        const bugle = [392, 523, 659, 392, 523, 659, 523, 392, 392, 523, 784, 659, 523, 392, 659, 523];
        const note = bugle[(step / 2) % bugle.length];
        this.atTone(time, note, 0.2, "triangle", 0.02);
        this.atTone(time, note * 2, 0.12, "sine", 0.006);
      }
      if (step < 8 && step % 2 === 0) {
        const hup = [180, 210, 190, 240][step / 2];
        this.atNoise(time, 0.07, 0.016, 500 + hup);
        this.atTone(time, hup, 0.07, "sine", 0.012, hup * 0.8);
      }
    },
  };

  A.loadSettings();
  root.BOTGAudio = A;
})(typeof window !== "undefined" ? window : globalThis);
  