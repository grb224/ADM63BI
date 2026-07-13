/**
 * ParticleLoader — 63º BI
 * 
 * Particles scatter → converge to form "63° BI" text → hold → scatter again (loop).
 * Pure Canvas 2D, no external images needed.
 * 
 * Usage:
 *   const loader = new ParticleLoader('#container');
 *   loader.show();
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
      text: options.text || '63° BI',
      fontSize: options.fontSize || 120,
      fontFamily: options.fontFamily || "'Inter', 'Arial Black', sans-serif",
      fontWeight: options.fontWeight || '900',
      particleSize: options.particleSize || 2.5,
      sampleStep: options.sampleStep || 3,
      convergeDuration: options.convergeDuration || 2500,
      holdDuration: options.holdDuration || 2200,
      disperseDuration: options.disperseDuration || 2000,
      pauseDuration: options.pauseDuration || 600,
      bgColor: options.bgColor || '#f5f2e8',
      // Military palette for particles
      colors: options.colors || [
        { r: 61,  g: 80,  b: 22  },   // olive
        { r: 107, g: 124, b: 58  },   // olive-light
        { r: 42,  g: 56,  b: 16  },   // olive-dark
        { r: 201, g: 162, b: 39  },   // amber/gold
        { r: 232, g: 188, b: 58  },   // amber-light
        { r: 150, g: 130, b: 50  },   // muted gold
      ],
      ...options
    };

    this.canvas = null;
    this.ctx = null;
    this.particles = [];
    this.animFrame = null;
    this.phase = 'converge';
    this.phaseStart = 0;
    this.isActive = false;
    this.overlay = null;
    this.canvasW = 0;
    this.canvasH = 0;

    this._init();
  }

  _init() {
    // Create overlay
    this.overlay = document.createElement('div');
    this.overlay.className = 'particle-loader-overlay';
    this.overlay.innerHTML = `
      <canvas class="particle-loader-canvas"></canvas>
      <div class="particle-loader-subtitle">Carregando...</div>
    `;
    this.container.appendChild(this.overlay);

    this.canvas = this.overlay.querySelector('.particle-loader-canvas');
    this.ctx = this.canvas.getContext('2d');

    this._sampleText();

    // Handle resize
    this._resizeHandler = () => this._sampleText();
    window.addEventListener('resize', this._resizeHandler);
  }

  _sampleText() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.min(window.innerWidth, 900);
    const h = Math.min(window.innerHeight, 500);

    this.canvasW = w;
    this.canvasH = h;
    this.canvas.width = w * dpr;
    this.canvas.height = h * dpr;
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Render text to offscreen canvas
    const offCanvas = document.createElement('canvas');
    offCanvas.width = w;
    offCanvas.height = h;
    const offCtx = offCanvas.getContext('2d');

    // Compute responsive font size
    const baseFontSize = this.options.fontSize;
    const fontScale = Math.min(w / 600, 1);
    const fontSize = Math.max(48, Math.floor(baseFontSize * fontScale));

    offCtx.fillStyle = '#000';
    offCtx.font = `${this.options.fontWeight} ${fontSize}px ${this.options.fontFamily}`;
    offCtx.textAlign = 'center';
    offCtx.textBaseline = 'middle';
    offCtx.fillText(this.options.text, w / 2, h / 2);

    // Sample pixels
    const imageData = offCtx.getImageData(0, 0, w, h);
    const data = imageData.data;
    const step = this.options.sampleStep;
    const colors = this.options.colors;

    this.particles = [];

    for (let y = 0; y < h; y += step) {
      for (let x = 0; x < w; x += step) {
        const i = (y * w + x) * 4;
        const a = data[i + 3];
        if (a < 128) continue; // skip transparent

        // Pick a random color from the military palette
        const c = colors[Math.floor(Math.random() * colors.length)];

        // Scatter origin - random ring around center
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.max(w, h) * (0.6 + Math.random() * 0.5);
        const sx = w / 2 + Math.cos(angle) * dist;
        const sy = h / 2 + Math.sin(angle) * dist;

        this.particles.push({
          tx: x, ty: y,       // target (text pixel)
          x: sx, y: sy,       // current
          sx: sx, sy: sy,     // scatter origin
          r: c.r, g: c.g, b: c.b,
          delay: Math.random() * 0.3,
          speed: 0.7 + Math.random() * 0.3,
          wobbleAmp: 1.5 + Math.random() * 3,
          wobbleFreq: 0.8 + Math.random() * 2,
          size: this.options.particleSize * (0.6 + Math.random() * 0.8),
          angle: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 0.02,
        });
      }
    }
  }

  show() {
    if (this.isActive) return;
    this.isActive = true;
    this.overlay.classList.add('active');
    this.phase = 'converge';
    this.phaseStart = performance.now();

    // Randomize scatter positions
    const w = this.canvasW;
    const h = this.canvasH;
    this.particles.forEach(p => {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.max(w, h) * (0.6 + Math.random() * 0.5);
      p.sx = w / 2 + Math.cos(angle) * dist;
      p.sy = h / 2 + Math.sin(angle) * dist;
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

  destroy() {
    this.hide();
    window.removeEventListener('resize', this._resizeHandler);
    if (this.overlay && this.overlay.parentNode) {
      this.overlay.parentNode.removeChild(this.overlay);
    }
  }

  _animate() {
    if (!this.isActive) return;

    const now = performance.now();
    const elapsed = now - this.phaseStart;

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
          this.particles.forEach(p => {
            p.disperseFromX = p.x;
            p.disperseFromY = p.y;
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.max(this.canvasW, this.canvasH) * (0.6 + Math.random() * 0.5);
            p.sx = this.canvasW / 2 + Math.cos(angle) * dist;
            p.sy = this.canvasH / 2 + Math.sin(angle) * dist;
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
    const w = this.canvasW;
    const h = this.canvasH;
    const time = performance.now() * 0.001;

    // Clear
    ctx.fillStyle = this.options.bgColor;
    ctx.fillRect(0, 0, w, h);

    // Draw ambient floating particles in background (very subtle)
    this._drawAmbient(ctx, w, h, time);

    // Main particles
    for (const p of this.particles) {
      let alpha = 1;

      switch (this.phase) {
        case 'converge': {
          const raw = elapsed / this.options.convergeDuration;
          const adj = Math.max(0, Math.min(1, (raw - p.delay) / (1 - p.delay)));
          const progress = Math.min(1, this._easeOutQuart(adj) * p.speed);

          p.x = p.sx + (p.tx - p.sx) * progress;
          p.y = p.sy + (p.ty - p.sy) * progress;

          // Orbital wobble during flight
          if (progress > 0.01 && progress < 0.9) {
            const wobbleStrength = (1 - progress) * p.wobbleAmp;
            p.x += Math.sin(time * p.wobbleFreq + p.delay * 20) * wobbleStrength;
            p.y += Math.cos(time * p.wobbleFreq * 0.7 + p.delay * 15) * wobbleStrength * 0.7;
          }

          // Fade in as they approach
          alpha = Math.min(1, progress * 3);
          break;
        }

        case 'hold': {
          // Subtle breathing / shimmer in place
          const breathe = Math.sin(time * 2 + p.delay * 12) * 0.4;
          p.x = p.tx + breathe;
          p.y = p.ty + Math.cos(time * 1.5 + p.delay * 8) * 0.3;
          alpha = 0.85 + Math.sin(time * 3 + p.delay * 10) * 0.15;
          break;
        }

        case 'disperse': {
          const raw = elapsed / this.options.disperseDuration;
          const adj = Math.max(0, Math.min(1, (raw - p.delay * 0.4) / (1 - p.delay * 0.4)));
          const progress = this._easeInQuart(adj);

          const fx = p.disperseFromX || p.tx;
          const fy = p.disperseFromY || p.ty;
          p.x = fx + (p.sx - fx) * progress;
          p.y = fy + (p.sy - fy) * progress;

          // Spiral outward
          if (progress > 0.02) {
            const spiral = progress * p.wobbleAmp * 2.5;
            p.x += Math.sin(time * p.wobbleFreq * 2.5 + p.delay * 25) * spiral;
            p.y += Math.cos(time * p.wobbleFreq * 2.5 + p.delay * 25) * spiral;
          }

          alpha = Math.max(0, 1 - progress * 1.2);
          break;
        }

        case 'pause': {
          // Gentle drift
          p.x = p.sx + Math.sin(time * 0.4 + p.delay * 10) * 4;
          p.y = p.sy + Math.cos(time * 0.3 + p.delay * 10) * 4;
          alpha = 0.15 + Math.sin(time * 0.8 + p.delay * 5) * 0.1;
          break;
        }
      }

      // Draw particle as a small circle
      ctx.globalAlpha = Math.max(0, Math.min(1, alpha));

      // Glow during hold
      if (this.phase === 'hold') {
        ctx.shadowColor = `rgba(${p.r},${p.g},${p.b},0.5)`;
        ctx.shadowBlur = 4;
      } else {
        ctx.shadowBlur = 0;
      }

      ctx.fillStyle = `rgb(${p.r},${p.g},${p.b})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }

    // Gold underline shimmer during hold
    if (this.phase === 'hold') {
      const lineAlpha = 0.3 + Math.sin(time * 2.5) * 0.15;
      ctx.globalAlpha = lineAlpha;
      ctx.shadowBlur = 0;

      const gradient = ctx.createLinearGradient(w * 0.25, 0, w * 0.75, 0);
      gradient.addColorStop(0, 'transparent');
      gradient.addColorStop(0.3, '#c9a227');
      gradient.addColorStop(0.7, '#e8bc3a');
      gradient.addColorStop(1, 'transparent');

      ctx.strokeStyle = gradient;
      ctx.lineWidth = 2;
      const lineY = h / 2 + this.options.fontSize * 0.35;
      ctx.beginPath();
      ctx.moveTo(w * 0.25, lineY);
      ctx.lineTo(w * 0.75, lineY);
      ctx.stroke();
    }

    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  }

  _drawAmbient(ctx, w, h, time) {
    // Very subtle floating specks in the background
    ctx.globalAlpha = 0.06;
    ctx.fillStyle = '#3d5016';
    for (let i = 0; i < 20; i++) {
      const x = (w * 0.5 + Math.sin(time * 0.2 + i * 1.7) * w * 0.45);
      const y = (h * 0.5 + Math.cos(time * 0.15 + i * 2.3) * h * 0.45);
      ctx.beginPath();
      ctx.arc(x, y, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  _easeOutQuart(t) {
    return 1 - Math.pow(1 - t, 4);
  }

  _easeInQuart(t) {
    return t * t * t * t;
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
      transition: opacity 0.6s cubic-bezier(.4,0,.2,1);
    }

    .particle-loader-overlay::before {
      content: '';
      position: absolute;
      inset: 0;
      background-image:
        linear-gradient(rgba(74, 124, 89, 0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(74, 124, 89, 0.03) 1px, transparent 1px);
      background-size: 40px 40px;
      pointer-events: none;
    }

    .particle-loader-overlay.active {
      opacity: 1;
      pointer-events: auto;
    }

    .particle-loader-canvas {
      display: block;
      position: relative;
      z-index: 1;
    }

    .particle-loader-subtitle {
      position: relative;
      z-index: 1;
      margin-top: 8px;
      font-family: 'Inter', -apple-system, sans-serif;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 3px;
      text-transform: uppercase;
      color: #3d5016;
      opacity: 0;
      animation: loader-text-fade 2.5s ease-in-out infinite;
    }

    @keyframes loader-text-fade {
      0%, 100% { opacity: 0.2; }
      50% { opacity: 0.7; }
    }
  `;
  document.head.appendChild(style);
})();
