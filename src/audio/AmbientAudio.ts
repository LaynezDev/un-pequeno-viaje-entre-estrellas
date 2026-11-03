/**
 * Delicate procedural Music-Box / Celesta & Starlight Ambient Soundscape
 * Built with Web Audio API so it requires zero heavy external audio files and never fails to load.
 */
class AmbientSoundEngine {
  private ctx: AudioContext | null = null;
  private isPlaying = false;
  private intervalId: number | null = null;
  private masterGain: GainNode | null = null;

  // Pentatonic lullaby notes (C5, D5, E5, G5, A5, C6, D6, E6)
  private readonly notes = [
    523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66, 1318.51,
  ];
  private step = 0;
  private readonly melodyPattern = [0, 2, 4, 5, 4, 2, 1, 3, 4, 7, 5, 4, 2, 0];

  public toggle(): boolean {
    if (this.isPlaying) {
      this.stop();
      return false;
    } else {
      this.start();
      return true;
    }
  }

  public start(): void {
    if (this.isPlaying) return;

    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!this.ctx) {
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.16;
      this.masterGain.connect(this.ctx.destination);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    this.isPlaying = true;
    this.playCelestaNote(this.notes[0], 2.4);

    this.intervalId = window.setInterval(() => {
      if (!this.isPlaying || !this.ctx) return;
      const noteIdx =
        this.melodyPattern[this.step % this.melodyPattern.length];
      const freq = this.notes[noteIdx];
      this.playCelestaNote(freq, 2.8);
      this.step++;
    }, 1350);
  }

  public stop(): void {
    this.isPlaying = false;
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  public playChime(): void {
    if (!this.isPlaying || !this.ctx || !this.masterGain) return;
    this.playCelestaNote(1046.5, 1.8);
    setTimeout(() => {
      if (this.isPlaying) this.playCelestaNote(1318.51, 2.2);
    }, 140);
  }

  /** Soft cascading starlight arpeggio when arriving at a planet */
  public playLandingChime(): void {
    if (!this.isPlaying || !this.ctx || !this.masterGain) return;
    const chord = [659.25, 783.99, 1046.5, 1318.51];
    chord.forEach((freq, idx) => {
      setTimeout(() => {
        if (this.isPlaying) this.playCelestaNote(freq, 2.5);
      }, idx * 120);
    });
  }

  private playCelestaNote(freq: number, duration: number): void {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const overtone = this.ctx.createOscillator();
    const noteGain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    overtone.type = 'triangle';
    overtone.frequency.setValueAtTime(freq * 2, now);

    const overtoneGain = this.ctx.createGain();
    overtoneGain.gain.setValueAtTime(0.08, now);

    noteGain.gain.setValueAtTime(0.001, now);
    noteGain.gain.exponentialRampToValueAtTime(0.32, now + 0.06);
    noteGain.gain.exponentialRampToValueAtTime(0.0008, now + duration);

    osc.connect(noteGain);
    overtone.connect(overtoneGain);
    overtoneGain.connect(noteGain);
    noteGain.connect(this.masterGain);

    osc.start(now);
    overtone.start(now);
    osc.stop(now + duration);
    overtone.stop(now + duration);
  }
}

export const ambientAudio = new AmbientSoundEngine();
