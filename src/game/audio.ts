const SAMPLES = {
  pickup: "/audio/sfx/relic-pickup.mp3",
  win: "/audio/sfx/floor-clear.mp3",
  whoosh: "/audio/sfx/arch-descend.mp3",
  locked: "/audio/sfx/door-sealed.mp3",
  unseal: "/audio/sfx/exit-unseal.mp3",
  puzzle: "/audio/sfx/puzzle-solved.mp3",
  lever: "/audio/sfx/lever-pull.mp3",
  ambTorch: "/audio/sfx/amb-torch-loop.mp3",
  ambCave: "/audio/sfx/amb-cave-loop.mp3",
} as const;

type SampleId = keyof typeof SAMPLES;

/** Sampled dungeon SFX, with two lightweight procedural sounds for high-frequency events. Unlocked on the first user gesture. */
export class GameAudio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private sfx: GainNode | null = null;
  private music: GainNode | null = null;
  private buffers = new Map<SampleId, AudioBuffer>();
  private ambTorchSrc: AudioBufferSourceNode | null = null;
  private ambCaveSrc: AudioBufferSourceNode | null = null;
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
      this.loadSamples();
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
  }

  private loadSamples() {
    const ctx = this.ctx;
    if (!ctx) return;
    for (const id of Object.keys(SAMPLES) as SampleId[]) {
      fetch(SAMPLES[id])
        .then((res) => res.arrayBuffer())
        .then((data) => ctx.decodeAudioData(data))
        .then((buf) => this.buffers.set(id, buf))
        .catch(() => {
          /* sample unavailable, that cue stays silent */
        });
    }
  }

  private playOneShot(id: SampleId, bus: GainNode | null, gain = 1, rate = 1) {
    const ctx = this.ctx;
    const buffer = this.buffers.get(id);
    if (!ctx || !bus || !buffer) return;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.playbackRate.value = rate;
    const g = ctx.createGain();
    g.gain.value = gain;
    src.connect(g);
    g.connect(bus);
    src.start();
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
    const torch = this.buffers.get("ambTorch");
    const cave = this.buffers.get("ambCave");
    if (!torch || !cave) {
      // Samples still loading from the first gesture; try again next frame-ish.
      setTimeout(() => this.startAmbience(), 150);
      return;
    }
    this.started = true;

    const torchSrc = ctx.createBufferSource();
    torchSrc.buffer = torch;
    torchSrc.loop = true;
    const torchGain = ctx.createGain();
    torchGain.gain.value = 0.55;
    torchSrc.connect(torchGain);
    torchGain.connect(music);
    torchSrc.start();
    this.ambTorchSrc = torchSrc;

    const caveSrc = ctx.createBufferSource();
    caveSrc.buffer = cave;
    caveSrc.loop = true;
    const caveGain = ctx.createGain();
    caveGain.gain.value = 0.35;
    caveSrc.connect(caveGain);
    caveGain.connect(music);
    caveSrc.start();
    this.ambCaveSrc = caveSrc;
  }

  stopAmbience() {
    try {
      this.ambTorchSrc?.stop();
      this.ambCaveSrc?.stop();
    } catch {
      /* already stopped */
    }
    this.ambTorchSrc = null;
    this.ambCaveSrc = null;
    this.started = false;
  }

  pickup() {
    this.unlock();
    this.playOneShot("pickup", this.sfx, 0.8, 0.96 + Math.random() * 0.08);
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
    this.playOneShot("win", this.sfx, 0.85);
  }

  whoosh() {
    this.unlock();
    this.playOneShot("whoosh", this.sfx, 0.7);
  }

  locked() {
    this.unlock();
    this.playOneShot("locked", this.sfx, 0.75);
  }

  unseal() {
    this.unlock();
    this.playOneShot("unseal", this.sfx, 0.85);
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
    this.playOneShot("lever", this.sfx, 0.75, 0.95 + Math.random() * 0.1);
  }

  puzzle() {
    this.unlock();
    this.playOneShot("puzzle", this.sfx, 0.85);
  }

  dispose() {
    this.stopAmbience();
    void this.ctx?.close();
    this.ctx = null;
    this.master = null;
    this.sfx = null;
    this.music = null;
    this.buffers.clear();
  }
}
