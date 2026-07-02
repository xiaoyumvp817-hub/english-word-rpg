// === Speech Manager ===
// Web Speech API wrapper — reads English words aloud.
// Zero dependencies, browser-native speech synthesis.

class SpeechManager {
  constructor() {
    this.synth = null;
    this._voices = [];
    this._selectedVoice = null;
    this._speaking = false;
    this._rate = 0.85;   // Slightly slower for learners
    this._pitch = 1.0;
    this._volume = 0.9;
  }

  /**
   * Initialize speech synthesis. Call on first user gesture.
   */
  init() {
    if (this.synth) return;
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      // Node.js or browser without speech synthesis
      return;
    }
    this.synth = window.speechSynthesis;

    // Voices load asynchronously
    this._voices = this.synth.getVoices();
    if (this._voices.length === 0) {
      this.synth.addEventListener('voiceschanged', () => {
        this._voices = this.synth.getVoices();
        this._selectBestVoice();
      });
    } else {
      this._selectBestVoice();
    }
  }

  /**
   * Select the best English voice available.
   * Priority: en-US Google > en-US > en-GB > any English > first available
   */
  _selectBestVoice() {
    const voices = this._voices;

    // Try Google en-US first (best quality on Chrome)
    let voice = voices.find(v => v.lang === 'en-US' && v.name.includes('Google'));
    if (voice) { this._selectedVoice = voice; return; }

    // Try Microsoft en-US
    voice = voices.find(v => v.lang === 'en-US' && v.name.includes('Microsoft'));
    if (voice) { this._selectedVoice = voice; return; }

    // Any en-US
    voice = voices.find(v => v.lang === 'en-US');
    if (voice) { this._selectedVoice = voice; return; }

    // en-GB
    voice = voices.find(v => v.lang === 'en-GB');
    if (voice) { this._selectedVoice = voice; return; }

    // Any English
    voice = voices.find(v => v.lang.startsWith('en'));
    if (voice) { this._selectedVoice = voice; return; }

    // Fallback
    this._selectedVoice = voices[0] || null;
  }

  /**
   * Get the name of the currently selected voice.
   */
  getVoiceName() {
    return this._selectedVoice
      ? `${this._selectedVoice.name} (${this._selectedVoice.lang})`
      : 'default';
  }

  /**
   * Check if currently speaking.
   */
  isSpeaking() {
    if (typeof window === 'undefined') return false;
    return this._speaking || (this.synth && this.synth.speaking);
  }

  /**
   * Speak the given English text.
   * @param {string} text - English word or phrase to speak
   * @returns {boolean} Whether speech was started successfully
   */
  speak(text) {
    if (!this.synth) {
      this.init();
    }
    if (!this.synth) return false;

    // Cancel any ongoing speech
    this.synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = this._selectedVoice;
    utterance.rate = this._rate;
    utterance.pitch = this._pitch;
    utterance.volume = this._volume;
    utterance.lang = this._selectedVoice ? this._selectedVoice.lang : 'en-US';

    // Track speaking state
    this._speaking = true;
    utterance.onend = () => { this._speaking = false; };
    utterance.onerror = () => { this._speaking = false; };
    utterance.onpause = () => { this._speaking = false; };

    this.synth.speak(utterance);
    return true;
  }

  /**
   * Stop any ongoing speech.
   */
  stop() {
    if (this.synth) {
      this.synth.cancel();
      this._speaking = false;
    }
  }

  /**
   * Set speech rate (0.5 - 2.0).
   */
  setRate(rate) {
    this._rate = Math.max(0.5, Math.min(2.0, rate));
  }
}

// Singleton
export const speech = new SpeechManager();
