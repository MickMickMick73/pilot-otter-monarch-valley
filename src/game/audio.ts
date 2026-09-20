/** Procedural dungeon SFX. Unlocked on the first user gesture. */
export class GameAudio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private sfx: GainNode | null = null;
  private music: GainNode | null = null;
  private drone: OscillatorNode | null = null;
  private drone2: OscillatorNode | null = null;
  muted = false;
  private started = false;

  unlock() {
    if (!this.ctx) {
      const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new Ctor({ latencyHint: "interactive" });
      this.master = this.ctx.createGain();
      this.sfx = this.ctx.createGain();
      this.music = this.ctx.createGain();
      this.master.gain.value = 0.7;
      this.sfx.gain.value = 0.9;
      this.music.gain.value = 0.14;
      this.sfx.connect(this.master);
      this.music.connect(this.master);
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
  }

  setMuted(next: boolean) {
    this.muted = next;
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(next ? 0 : 0.7, this.ctx.currentTime, 0.04);
    }
  }

  startAmbience() {
    this.unlock();
    const ctx = this.ctx;
    const music = this.music;
    if (!ctx || !music || this.started) return;
    this.started = true;

    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = 73;
    const g = ctx.createGain();
    g.gain.value = 0.22;
    const filt = ctx.createBiquadFilter();
    filt.type = "lowpass";
    filt.frequency.value = 280;
    osc.connect(g);
    g.connect(filt);
    filt.connect(music);
    osc.start();
    this.drone = osc;

    const osc2 = ctx.createOscillator();
    osc2.type = "triangle";
    osc2.frequency.value = 110;
    const g2 = ctx.createGain();
    g2.gain.value = 0.08;
    osc2.connect(g2);
    g2.connect(music);
    osc2.start();
    this.drone2 = osc2;
  }

  stopAmbience() {
    try {
      this.drone?.stop();
      this.drone2?.stop();
    } catch {
      /* already stopped */
    }
    this.drone = null;
    this.drone2 = null;
    this.started = false;
  }

  pickup() {
    this.unlock();
    const ctx = this.ctx;
    const sfx = this.sfx;
    if (!ctx || !sfx) return;
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99];
    notes.forEach((f, i) => {
      const osc = ctx.createOscillator();
      osc.type = "triangle";
      osc.frequency.value = f * (0.98 + Math.random() * 0.04);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(0.18, now + 0.02 + i * 0.04);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.28 + i * 0.05);
      osc.connect(g);
      g.connect(sfx);
      osc.start(now + i * 0.04);
      osc.stop(now + 0.4 + i * 0.05);
    });
  }

  footstep() {
    this.unlock();
    const ctx = this.ctx;
    const sfx = this.sfx;
    if (!ctx || !sfx) return;
    const now = ctx.currentTime;
    const dur = 0.07;
    const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.playbackRate.value = 0.7 + Math.random() * 0.3;
    const filt = ctx.createBiquadFilter();
    filt.type = "lowpass";
    filt.frequency.value = 420 + Math.random() * 180;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.16, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    src.connect(filt);
    filt.connect(g);
    g.connect(sfx);
    src.start(now);
  }

  win() {
    this.unlock();
    const ctx = this.ctx;
    const sfx = this.sfx;
    if (!ctx || !sfx) return;
    const now = ctx.currentTime;
    const notes = [261.63, 329.63, 392.0, 523.25, 659.25];
    notes.forEach((f, i) => {
      const osc = ctx.createOscillator();
      osc.type = i % 2 ? "triangle" : "sine";
      osc.frequency.value = f;
      const g = ctx.createGain();
      const t = now + i * 0.11;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.2, t + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
      osc.connect(g);
      g.connect(sfx);
      osc.start(t);
      osc.stop(t + 0.6);
    });
  }

  whoosh() {
    this.unlock();
    const ctx = this.ctx;
    const sfx = this.sfx;
    if (!ctx || !sfx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.35);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.08, now + 0.04);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);
    const filt = ctx.createBiquadFilter();
    filt.type = "lowpass";
    filt.frequency.value = 640;
    osc.connect(filt);
    filt.connect(g);
    g.connect(sfx);
    osc.start(now);
    osc.stop(now + 0.42);
  }

  locked() {
    this.unlock();
    const ctx = this.ctx;
    const sfx = this.sfx;
    if (!ctx || !sfx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = "square";
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(70, now + 0.18);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.12, now + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
    const filt = ctx.createBiquadFilter();
    filt.type = "lowpass";
    filt.frequency.value = 380;
    osc.connect(filt);
    filt.connect(g);
    g.connect(sfx);
    osc.start(now);
    osc.stop(now + 0.24);
  }

  unseal() {
    this.unlock();
    const ctx = this.ctx;
    const sfx = this.sfx;
    if (!ctx || !sfx) return;
    const now = ctx.currentTime;
    const notes = [392.0, 523.25, 659.25];
    notes.forEach((f, i) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = f;
      const g = ctx.createGain();
      const t = now + i * 0.07;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.16, t + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
      osc.connect(g);
      g.connect(sfx);
      osc.start(t);
      osc.stop(t + 0.45);
    });
  }

  talk() {
    this.unlock();
    const ctx = this.ctx;
    const sfx = this.sfx;
    if (!ctx || !sfx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(220 + Math.random() * 80, now);
    osc.frequency.exponentialRampToValueAtTime(160, now + 0.12);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.1, now + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
    osc.connect(g);
    g.connect(sfx);
    osc.start(now);
    osc.stop(now + 0.18);
  }

  lever() {
    this.unlock();
    const ctx = this.ctx;
    const sfx = this.sfx;
    if (!ctx || !sfx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = "square";
    osc.frequency.setValueAtTime(90, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.1);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.1, now + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);
    const filt = ctx.createBiquadFilter();
    filt.type = "lowpass";
    filt.frequency.value = 420;
    osc.connect(filt);
    filt.connect(g);
    g.connect(sfx);
    osc.start(now);
    osc.stop(now + 0.16);
  }

  puzzle() {
    this.unlock();
    const ctx = this.ctx;
    const sfx = this.sfx;
    if (!ctx || !sfx) return;
    const now = ctx.currentTime;
    const notes = [329.63, 415.3, 493.88, 659.25];
    notes.forEach((f, i) => {
      const osc = ctx.createOscillator();
      osc.type = "triangle";
      osc.frequency.value = f;
      const g = ctx.createGain();
      const t = now + i * 0.06;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.14, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);
      osc.connect(g);
      g.connect(sfx);
      osc.start(t);
      osc.stop(t + 0.36);
    });
  }

  dispose() {
    this.stopAmbience();
    void this.ctx?.close();
    this.ctx = null;
    this.master = null;
    this.sfx = null;
    this.music = null;
  }
}
