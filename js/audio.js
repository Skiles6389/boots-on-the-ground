
// Tiny synthesized effects. No audio files, so the demo stays one folder.
(function (root) {
  const A = {
    ctx: null,
    muted: false,
    last: {},

    ensure() {
      if (!this.ctx) {
        const AC = root.AudioContext || root.webkitAudioContext;
        if (!AC) return null;
        this.ctx = new AC();
      }
      if (this.ctx.state === "suspended") this.ctx.resume();
      return this.ctx;
    },

    loadMute() {
      try {
        this.muted = root.localStorage.getItem("botg-muted") === "1";
      } catch (err) {
        this.muted = false;
      }
    },

    toggle() {
      this.muted = !this.muted;
      try {
        root.localStorage.setItem("botg-muted", this.muted ? "1" : "0");
      } catch (err) {
        /* private mode */
      }
      if (!this.muted) this.play("ui");
      return this.muted;
    },

    tone(freq, dur, type, gain, delay, slideTo) {
      const ctx = this.ensure();
      if (!ctx || this.muted) return;
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
      const ctx = this.ensure();
      if (!ctx || this.muted) return;
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
          this.tone(392, 0.1, "square", 0.04, 0);
          this.tone(523, 0.12, "square", 0.04, 0.1);
          this.tone(659, 0.16, "square", 0.04, 0.2);
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
  };

  A.loadMute();
  root.BOTGAudio = A;
})(typeof window !== "undefined" ? window : globalThis);
  