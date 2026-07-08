// === Ambient Starfield Background ===
// Lightweight canvas-based particle system for RPG atmosphere.
// Creates a subtle starfield with drifting, twinkling stars.
// Zero dependencies. Auto-pauses when tab is hidden.

class Starfield {
  constructor(options = {}) {
    this.canvas = options.canvas || null;
    this.starCount = options.starCount || 120;
    this.baseOpacity = options.baseOpacity || 0.7;
    this.driftSpeed = options.driftSpeed || 0.15; // pixels per frame
    this.stars = [];
    this.ctx = null;
    this.animFrameId = null;
    this.isRunning = false;
    this._boundAnimate = this._animate.bind(this);
    this._boundResize = this._handleResize.bind(this);
    this._boundVisibility = this._handleVisibility.bind(this);
  }

  /**
   * Initialize and start the starfield.
   * @param {HTMLCanvasElement} [canvas] — optional, falls back to this.canvas
   */
  start(canvas) {
    if (canvas) this.canvas = canvas;
    if (!this.canvas) {
      console.warn('Starfield: no canvas element provided.');
      return;
    }

    this.ctx = this.canvas.getContext('2d');
    this._resizeCanvas();
    this._generateStars();

    // Event listeners
    window.addEventListener('resize', this._boundResize);
    document.addEventListener('visibilitychange', this._boundVisibility);

    this.isRunning = true;
    this._animate();

    console.log(`Starfield: ${this.starCount} stars initialized.`);
  }

  /** Stop and clean up */
  stop() {
    this.isRunning = false;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    window.removeEventListener('resize', this._boundResize);
    document.removeEventListener('visibilitychange', this._boundVisibility);
    if (this.ctx) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  /** Update star count dynamically */
  setStarCount(count) {
    this.starCount = Math.max(10, Math.min(300, count));
    this._generateStars();
  }

  // ========== Private ==========

  _resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = window.innerWidth * dpr;
    this.canvas.height = window.innerHeight * dpr;
    this.canvas.style.width = window.innerWidth + 'px';
    this.canvas.style.height = window.innerHeight + 'px';
    if (this.ctx) {
      this.ctx.scale(dpr, dpr);
    }
  }

  _generateStars() {
    this.stars = [];
    for (let i = 0; i < this.starCount; i++) {
      this.stars.push(this._createStar());
    }
  }

  _createStar() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    return {
      x: Math.random() * w,
      y: Math.random() * h,
      radius: Math.random() * 1.8 + 0.3,       // 0.3–2.1px
      baseAlpha: Math.random() * 0.5 + 0.3,     // 0.3–0.8
      twinkleSpeed: Math.random() * 0.02 + 0.005, // radians per frame
      twinkleOffset: Math.random() * Math.PI * 2, // random phase
      driftX: (Math.random() - 0.5) * this.driftSpeed,
      driftY: (Math.random() - 0.5) * this.driftSpeed,
      hue: Math.random() < 0.15
        ? 40 + Math.random() * 20    // 15% warm gold stars
        : 210 + Math.random() * 30,  // 85% cool blue-white stars
    };
  }

  _animate(timestamp) {
    if (!this.isRunning) return;

    const ctx = this.ctx;
    const w = window.innerWidth;
    const h = window.innerHeight;

    // Clear with slight trail for motion blur feel
    ctx.clearRect(0, 0, w, h);

    for (const star of this.stars) {
      // Twinkle via sine wave
      const twinkle = Math.sin(timestamp * star.twinkleSpeed + star.twinkleOffset);
      const alpha = star.baseAlpha * (0.5 + 0.5 * twinkle) * this.baseOpacity;

      // Draw star
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${star.hue}, 60%, 80%, ${alpha})`;
      ctx.fill();

      // Larger stars get a subtle glow
      if (star.radius > 1.2 && alpha > 0.4) {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${star.hue}, 60%, 80%, ${alpha * 0.12})`;
        ctx.fill();
      }

      // Slow drift
      star.x += star.driftX;
      star.y += star.driftY;

      // Wrap around edges
      if (star.x < -5) star.x = w + 5;
      if (star.x > w + 5) star.x = -5;
      if (star.y < -5) star.y = h + 5;
      if (star.y > h + 5) star.y = -5;
    }

    this.animFrameId = requestAnimationFrame(this._boundAnimate);
  }

  _handleResize() {
    this._resizeCanvas();
    this._generateStars();
  }

  _handleVisibility() {
    if (document.hidden) {
      // Pause animation to save resources
      if (this.animFrameId) {
        cancelAnimationFrame(this.animFrameId);
        this.animFrameId = null;
      }
    } else {
      // Resume
      if (this.isRunning && !this.animFrameId) {
        this.animFrameId = requestAnimationFrame(this._boundAnimate);
      }
    }
  }
}

// Singleton instance — created lazily
let _instance = null;

/**
 * Get or create the global starfield instance.
 * @returns {Starfield}
 */
export function getStarfield() {
  if (!_instance) {
    _instance = new Starfield();
  }
  return _instance;
}

export { Starfield };
export default Starfield;
