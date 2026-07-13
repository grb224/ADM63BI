/**
 * ParticleLoader — 63º BI
 * 
 * Creates a premium particle animation from the logo.png image.
 * Particles scatter → converge to form the logo → hold → scatter again (loop).
 * 
 * Usage:
 *   const loader = new ParticleLoader('#container');
 *   loader.show();
 *   // ...later...
 *   loader.hide();
 */

class ParticleLoader {
  constructor(containerSelector, options = {}) {
    this.container = typeof containerSelector === 'string'
      ? document.querySelector(containerSelector)
      : containerSelector;

    if (!this.container) {
      console.warn('[ParticleLoader] Container not found');
      return;
    }

    this.options = {
      logoSrc: options.logoSrc || '../assets/logo.png',
      particleSize: options.particleSize || 2.2,
      sampleStep: options.sampleStep || 3,        // lower = more particles, slower
      convergeDuration: options.convergeDuration || 2800,
      holdDuration: options.holdDuration || 1800,
      disperseDuration: options.disperseDuration || 2200,
      pauseDuration: options.pauseDuration || 600,
      maxCanvasSize: options.maxCanvasSize || 400,
      bgColor: options.bgColor || '#f5f2e8',
      ...options
    };

    this.canvas = null;
    this.ctx = null;
    this.particles = [];
    this.animFrame = null;
    this.phase = 'converge'; // converge | hold | disperse | pause
    this.phaseStart = 0;
    this.isActive = false;
    this.overlay = null;
    this.logoImageData = null;

    this._init();
  }

  async _init() {
    // Create overlay
    this.overlay = document.createElement('div');
    this.overlay.className = 'particle-loader-overlay';
    this.overlay.innerHTML = `
      <canvas class="particle-loader-canvas"></canvas>
      <div class="particle-loader-text">Carregando...</div>
    `;
    this.container.appendChild(this.overlay);

    this.canvas = this.overlay.querySelector('.particle-loader-canvas');
    this.ctx = this.canvas.getContext('2d');

    // Load and sample the logo
    try {
      await this._loadLogo();
    } catch (e) {
      console.error('[ParticleLoader] Failed to load logo:', e);
    }
  }

  _loadLogo() {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        this._sampleImage(img);
        resolve();
      };
      img.onerror = reject;

      // Resolve logo path relative to current page
      const basePath = this.options.logoSrc;
      img.src = basePath;
    });
  }

  _sampleImage(img) {
    const maxSize = this.options.maxCanvasSize;
    const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
    const w = Math.floor(img.width * scale);
    const h = Math.floor(img.height * scale);

    // Use an offscreen canvas to read pixel data
    const offCanvas = document.createElement('canvas');
    offCanvas.width = w;
    offCanvas.height = h;
    const offCtx = offCanvas.getContext('2d');
    offCtx.drawImage(img, 0, 0, w, h);

    const imageData = offCtx.getImageData(0, 0, w, h);
    const data = imageData.data;

    // Set the main canvas size
    const canvasSize = Math.max(w, h) + 120;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = canvasSize * dpr;
    this.canvas.height = canvasSize * dpr;
    this.canvas.style.width = canvasSize + 'px';
    this.canvas.style.height = canvasSize + 'px';
    this.ctx.scale(dpr, dpr);
    this.canvasSize = canvasSize;

    // Offset to center the logo in the canvas
    const offsetX = (canvasSize - w) / 2;
    const offsetY = (canvasSize - h) / 2;

    // Sample pixels to create particles
    this.particles = [];
    const step = this.options.sampleStep;

    for (let y = 0; y < h; y += step) {
      for (let x = 0; x < w; x += step) {
        const i = (y * w + x) * 4;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];

        // Skip transparent or near-white pixels
        if (a < 100) continue;
        if (r > 240 && g > 240 && b > 240) continue;

        const targetX = x + offsetX;
        const targetY = y + offsetY;

        // Random scatter position (circular)
        const angle = Math.random() * Math.PI * 2;
        const dist = canvasSize * 0.5 + Math.random() * canvasSize * 0.4;
        const scatterX = canvasSize / 2 + Math.cos(angle) * dist;
        const scatterY = canvasSize / 2 + Math.sin(angle) * dist;

        this.particles.push({
          // Target position (logo pixel)
          tx: targetX,
          ty: targetY,
          // Current position (scattered)
          x: scatterX,
          y: scatterY,
          // Scatter position (saved for disperse phase)
          sx: scatterX,
          sy: scatterY,
          // Color from logo
          color: `rgba(${r},${g},${b},${(a / 255).toFixed(2)})`,
          r, g, b, a,
          // Per-particle randomness for organic motion
          delay: Math.random() * 0.35,
          speed: 0.6 + Math.random() * 0.4,
          wobbleAmp: 1 + Math.random() * 3,
          wobbleFreq: 0.5 + Math.random() * 2,
          size: this.options.particleSize * (0.7 + Math.random() * 0.6),
        });
      }
    }

    console.log(`[ParticleLoader] Sampled ${this.particles.length} particles from logo`);
  }

  show() {
    if (this.isActive) return;
    this.isActive = true;
    this.overlay.classList.add('active');
    this.phase = 'converge';
    this.phaseStart = performance.now();

    // Randomize scatter positions each time we show
    this.particles.forEach(p => {
      const angle = Math.random() * Math.PI * 2;
      const dist = this.canvasSize * 0.5 + Math.random() * this.canvasSize * 0.4;
      p.sx = this.canvasSize / 2 + Math.cos(angle) * dist;
      p.sy = this.canvasSize / 2 + Math.sin(angle) * dist;
      p.x = p.sx;
      p.y = p.sy;
    });

    this._animate();
  }

  hide() {
    this.isActive = false;
    this.overlay.classList.remove('active');
    if (this.animFrame) {
      cancelAnimationFrame(this.animFrame);
      this.animFrame = null;
    }
  }

  _animate() {
    if (!this.isActive) return;

    const now = performance.now();
    const elapsed = now - this.phaseStart;

    // Phase machine
    switch (this.phase) {
      case 'converge':
        if (elapsed >= this.options.convergeDuration) {
          this.phase = 'hold';
          this.phaseStart = now;
        }
        break;
      case 'hold':
        if (elapsed >= this.options.holdDuration) {
          this.phase = 'disperse';
          this.phaseStart = now;
          // Save current positions as starting point for disperse
          this.particles.forEach(p => {
            p.disperseFromX = p.x;
            p.disperseFromY = p.y;
            // New random scatter target
            const angle = Math.random() * Math.PI * 2;
            const dist = this.canvasSize * 0.5 + Math.random() * this.canvasSize * 0.4;
            p.sx = this.canvasSize / 2 + Math.cos(angle) * dist;
            p.sy = this.canvasSize / 2 + Math.sin(angle) * dist;
          });
        }
        break;
      case 'disperse':
        if (elapsed >= this.options.disperseDuration) {
          this.phase = 'pause';
          this.phaseStart = now;
        }
        break;
      case 'pause':
        if (elapsed >= this.options.pauseDuration) {
          this.phase = 'converge';
          this.phaseStart = now;
        }
        break;
    }

    this._draw(elapsed);
    this.animFrame = requestAnimationFrame(() => this._animate());
  }

  _draw(elapsed) {
    const ctx = this.ctx;
    const size = this.canvasSize;

    // Clear with semi-transparent bg for subtle trail effect
    ctx.fillStyle = this.options.bgColor;
    ctx.fillRect(0, 0, size, size);

    const time = performance.now() * 0.001; // seconds for wobble

    for (const p of this.particles) {
      let progress;

      switch (this.phase) {
        case 'converge': {
          const raw = elapsed / this.options.convergeDuration;
          // Per-particle staggered progress
          const adjusted = Math.max(0, Math.min(1, (raw - p.delay) / (1 - p.delay)));
          progress = this._easeInOutCubic(adjusted) * p.speed;
          progress = Math.min(1, progress);

          p.x = p.sx + (p.tx - p.sx) * progress;
          p.y = p.sy + (p.ty - p.sy) * progress;

          // Add wobble during flight
          if (progress > 0 && progress < 0.95) {
            const wobble = Math.sin(time * p.wobbleFreq + p.delay * 20) * p.wobbleAmp * (1 - progress);
            p.x += wobble;
            p.y += wobble * 0.6;
          }
          break;
        }

        case 'hold': {
          // Gentle breathing at target
          const breathe = Math.sin(time * 1.5 + p.delay * 10) * 0.5;
          p.x = p.tx + breathe;
          p.y = p.ty + breathe * 0.4;
          break;
        }

        case 'disperse': {
          const raw = elapsed / this.options.disperseDuration;
          const adjusted = Math.max(0, Math.min(1, (raw - p.delay * 0.5) / (1 - p.delay * 0.5)));
          progress = this._easeInCubic(adjusted);

          const fromX = p.disperseFromX || p.tx;
          const fromY = p.disperseFromY || p.ty;
          p.x = fromX + (p.sx - fromX) * progress;
          p.y = fromY + (p.sy - fromY) * progress;

          // Spiral wobble during disperse
          if (progress > 0.05 && progress < 1) {
            const spiral = progress * p.wobbleAmp * 2;
            p.x += Math.sin(time * p.wobbleFreq * 2 + p.delay * 30) * spiral;
            p.y += Math.cos(time * p.wobbleFreq * 2 + p.delay * 30) * spiral;
          }
          break;
        }

        case 'pause': {
          // Particles drift gently at scattered positions
          p.x = p.sx + Math.sin(time * 0.5 + p.delay * 10) * 3;
          p.y = p.sy + Math.cos(time * 0.4 + p.delay * 10) * 3;
          break;
        }
      }

      // Draw particle
      const alpha = this.phase === 'disperse'
        ? Math.max(0.15, 1 - (elapsed / this.options.disperseDuration))
        : (this.phase === 'pause' ? 0.4 : 1);

      ctx.globalAlpha = alpha * (p.a / 255);

      // Glow effect for converged state
      if (this.phase === 'hold') {
        ctx.shadowColor = `rgba(${p.r},${p.g},${p.b},0.4)`;
        ctx.shadowBlur = 3;
      } else {
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
      }

      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw golden shimmer ring during hold phase
    if (this.phase === 'hold') {
      const shimmerAlpha = 0.15 + Math.sin(time * 2) * 0.1;
      ctx.globalAlpha = shimmerAlpha;
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#c9a227';
      ctx.lineWidth = 1.5;
      const cx = size / 2;
      const cy = size / 2;
      const radius = size * 0.32 + Math.sin(time * 1.5) * 4;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.globalAlpha = 1;
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
  }

  _easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  _easeInCubic(t) {
    return t * t * t;
  }
}

// Auto-inject styles
(function() {
  if (document.getElementById('particle-loader-styles')) return;
  const style = document.createElement('style');
  style.id = 'particle-loader-styles';
  style.textContent = `
    .particle-loader-overlay {
      position: fixed;
      inset: 0;
      z-index: 99999;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: #f5f2e8;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.5s ease;
    }

    .particle-loader-overlay.active {
      opacity: 1;
      pointer-events: auto;
    }

    .particle-loader-canvas {
      display: block;
    }

    .particle-loader-text {
      margin-top: 16px;
      font-family: 'Inter', -apple-system, sans-serif;
      font-size: 13px;
      font-weight: 600;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: #3d5016;
      opacity: 0.7;
      animation: loader-text-pulse 2s ease-in-out infinite;
    }

    @keyframes loader-text-pulse {
      0%, 100% { opacity: 0.4; }
      50% { opacity: 0.9; }
    }
  `;
  document.head.appendChild(style);
})();
