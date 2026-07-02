// === Audio Manager ===
// Pure Web Audio API sound effects — zero audio files.
// All sounds are synthesized from oscillators and noise.

const SETTINGS_KEY = 'englishRpgAudio';

class AudioManager {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this._muted = false;
    this._volume = 0.6;
    this._initialized = false;

    // Load saved settings
    this._loadSettings();
  }

  // ========== Initialization ==========

  /**
   * Initialize AudioContext. Must be called after a user gesture.
   */
  init() {
    if (this._initialized) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this._muted ? 0 : this._volume;
      this.masterGain.connect(this.ctx.destination);
      this._initialized = true;
    } catch (e) {
      console.warn('AudioContext not supported:', e.message);
    }
  }

  /**
   * Ensure context is resumed (handles browser autoplay policy).
   */
  _ensureResumed() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // ========== Settings ==========

  _loadSettings() {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        this._muted = s.muted || false;
        this._volume = s.volume != null ? s.volume : 0.6;
      }
    } catch (e) { /* ignore */ }
  }

  _saveSettings() {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify({
        muted: this._muted,
        volume: this._volume
      }));
    } catch (e) { /* ignore */ }
  }

  get muted() { return this._muted; }
  get volume() { return this._volume; }

  toggleMute() {
    this._muted = !this._muted;
    if (this.masterGain) {
      this.masterGain.gain.value = this._muted ? 0 : this._volume;
    }
    this._saveSettings();
    return this._muted;
  }

  setVolume(v) {
    this._volume = Math.max(0, Math.min(1, v));
    if (this.masterGain && !this._muted) {
      this.masterGain.gain.value = this._volume;
    }
    this._saveSettings();
  }

  // ========== Core Synth Helpers ==========

  /**
   * Create a gain envelope node.
   */
  _gainEnvelope(startTime, peakTime, peakValue, releaseTime, finalValue = 0) {
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(peakValue, startTime + peakTime);
    gain.gain.linearRampToValueAtTime(finalValue, startTime + releaseTime);
    return gain;
  }

  /**
   * Play a simple tone.
   */
  _tone(freq, duration, type = 'sine', volume = 0.3, attack = 0.01) {
    if (!this._initialized || this._muted) return;
    this._ensureResumed();

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this._gainEnvelope(now, attack, volume, duration, 0);

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + duration);
  }

  /**
   * Play a frequency sweep.
   */
  _sweep(startFreq, endFreq, duration, type = 'sawtooth', volume = 0.2) {
    if (!this._initialized || this._muted) return;
    this._ensureResumed();

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this._gainEnvelope(now, 0.01, volume, duration, 0);

    osc.type = type;
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.linearRampToValueAtTime(endFreq, now + duration);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + duration);
  }

  /**
   * Play multiple tones as a chord.
   */
  _chord(freqs, duration, type = 'sine', volume = 0.15) {
    if (!this._initialized || this._muted) return;
    this._ensureResumed();

    const now = this.ctx.currentTime;
    freqs.forEach(freq => {
      const osc = this.ctx.createOscillator();
      const gain = this._gainEnvelope(now, 0.03, volume, duration, 0);
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + duration);
    });
  }

  /**
   * Play a sequence of tones (arpeggio).
   */
  _arpeggio(freqs, noteDuration, type = 'sine', volume = 0.2) {
    if (!this._initialized || this._muted) return;
    this._ensureResumed();

    const now = this.ctx.currentTime;
    freqs.forEach((freq, i) => {
      const start = now + i * noteDuration;
      const osc = this.ctx.createOscillator();
      const gain = this._gainEnvelope(start, 0.01, volume, noteDuration * 1.2, 0);
      osc.type = type;
      osc.frequency.setValueAtTime(freq, start);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(start);
      osc.stop(start + noteDuration * 1.5);
    });
  }

  /**
   * Play a noise burst (for impacts, swooshes).
   */
  _noise(duration, volume = 0.15) {
    if (!this._initialized || this._muted) return;
    this._ensureResumed();

    const now = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;

    const bandpass = this.ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.value = 2000;

    const gain = this._gainEnvelope(now, 0.005, volume, duration, 0);
    source.connect(bandpass);
    bandpass.connect(gain);
    gain.connect(this.masterGain);
    source.start(now);
    source.stop(now + duration);
  }

  /**
   * Play an impact sound (noise + tone).
   */
  _impact(freq, duration = 0.15, vol = 0.25) {
    this._tone(freq, duration, 'triangle', vol, 0.005);
    this._noise(duration * 0.5, vol * 0.5);
  }

  // ========== Combat Sounds ==========

  /** Player attack hits monster — sharp rising tone */
  attackHit() {
    this._sweep(440, 880, 0.12, 'sawtooth', 0.2);
    this._tone(660, 0.08, 'square', 0.1);
  }

  /** Player gets answer correct — cheerful ping */
  correct() {
    this._arpeggio([523, 659, 784], 0.06, 'sine', 0.2);
  }

  /** Monster attacks player — low thud */
  monsterAttack() {
    this._sweep(200, 80, 0.18, 'sawtooth', 0.25);
    this._tone(100, 0.12, 'triangle', 0.15);
  }

  /** Critical hit — powerful impact */
  critical() {
    this._impact(200, 0.2, 0.35);
    setTimeout(() => {
      this._tone(1200, 0.15, 'square', 0.15);
      this._tone(1600, 0.1, 'sine', 0.1);
    }, 50);
  }

  /** Defend — metallic clank */
  defend() {
    this._tone(800, 0.08, 'square', 0.15);
    this._tone(600, 0.12, 'triangle', 0.12);
    this._noise(0.05, 0.08);
  }

  /** Flee attempt — whoosh */
  flee() {
    this._sweep(600, 100, 0.25, 'sawtooth', 0.18);
    this._noise(0.2, 0.1);
  }

  /** Timer tick (last 3 seconds) — short beep */
  timerTick() {
    this._tone(1000, 0.05, 'square', 0.12);
  }

  /** Timer expired — low buzz */
  timeout() {
    this._tone(150, 0.35, 'sawtooth', 0.25);
  }

  /** Streak hot (x3) — short flair */
  streakHot() {
    this._arpeggio([660, 880], 0.05, 'sine', 0.15);
  }

  /** Streak fire (x5) — more intense */
  streakFire() {
    this._arpeggio([660, 880, 1100], 0.04, 'sine', 0.18);
  }

  /** Streak godlike (x10) — epic */
  streakGodlike() {
    this._arpeggio([523, 659, 784, 1047], 0.04, 'square', 0.2);
  }

  // ========== Victory / Defeat ==========

  /** Normal victory — cheerful fanfare */
  victory() {
    this._arpeggio([523, 659, 784], 0.12, 'sine', 0.2);
    setTimeout(() => this._chord([523, 659, 784], 0.4, 'sine', 0.12), 400);
  }

  /** Boss victory — epic full scale */
  bossVictory() {
    const scale = [523, 587, 659, 698, 784, 880, 988, 1047];
    this._arpeggio(scale, 0.08, 'square', 0.22);
    setTimeout(() => this._chord([523, 659, 784, 1047], 0.8, 'sine', 0.15), 700);
  }

  /** Defeat — descending sad tones */
  defeat() {
    this._arpeggio([784, 659, 523], 0.18, 'triangle', 0.2);
    this._tone(200, 0.3, 'sawtooth', 0.12);
  }

  /** Level up — rising arpeggio + glow */
  levelUp() {
    const notes = [523, 659, 784, 1047, 1319];
    this._arpeggio(notes, 0.08, 'sine', 0.22);
    setTimeout(() => this._chord([523, 784, 1047], 0.5, 'sine', 0.12), 450);
  }

  // ========== UI Sounds ==========

  /** Button hover — very soft */
  hover() {
    this._tone(600, 0.03, 'sine', 0.06);
  }

  /** Button click — crisp tap */
  click() {
    this._tone(800, 0.04, 'square', 0.1);
  }

  /** Page/screen transition — soft swoosh */
  transition() {
    this._noise(0.12, 0.06);
  }

  /** Coin pickup — high ding */
  coin() {
    this._sweep(1200, 1600, 0.1, 'sine', 0.15);
  }

  /** Buy success — two-tone ding-dong */
  buy() {
    this._tone(880, 0.08, 'sine', 0.15);
    setTimeout(() => this._tone(660, 0.12, 'sine', 0.12), 100);
  }

  /** Error / can't buy — low buzz */
  error() {
    this._tone(200, 0.12, 'square', 0.15);
  }

  // ========== Monster Sounds ==========

  /** Normal monster appears — low rumble */
  monsterAppear() {
    this._sweep(80, 150, 0.25, 'sawtooth', 0.18);
    this._noise(0.1, 0.08);
  }

  /** Boss appears — deep, long, menacing */
  bossAppear() {
    this._sweep(40, 100, 0.7, 'sawtooth', 0.25);
    this._tone(60, 0.6, 'square', 0.15);
    setTimeout(() => this._tone(120, 0.3, 'sawtooth', 0.1), 500);
  }

  /** Monster defeated — crumbling */
  monsterDeath() {
    this._sweep(400, 50, 0.35, 'sawtooth', 0.2);
    this._noise(0.15, 0.1);
  }

  // ========== Equipment Sounds ==========

  /** Equip weapon — unsheathe */
  equipWeapon() {
    this._sweep(600, 1200, 0.08, 'sawtooth', 0.15);
    this._tone(1000, 0.06, 'square', 0.1);
  }

  /** Equip armor — heavy clunk */
  equipArmor() {
    this._tone(300, 0.12, 'triangle', 0.2);
    this._noise(0.06, 0.08);
  }

  /** Equip accessory — magic sparkle */
  equipAccessory() {
    this._arpeggio([1200, 1600, 2000], 0.04, 'sine', 0.12);
  }

  /** Equip legendary item — epic reveal */
  equipLegendary() {
    this._chord([523, 659, 784, 1047], 0.5, 'sine', 0.18);
    this._arpeggio([1047, 1319, 1568], 0.06, 'sine', 0.15);
  }

  // ========== Misc ==========

  /** New game start — hopeful tone */
  newGame() {
    this._arpeggio([523, 659, 784, 1047], 0.1, 'sine', 0.18);
  }

  /** Save game — subtle confirm */
  save() {
    this._tone(1000, 0.05, 'sine', 0.08);
    setTimeout(() => this._tone(1200, 0.05, 'sine', 0.06), 60);
  }
}

// Singleton
export const audio = new AudioManager();
