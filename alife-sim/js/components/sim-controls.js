import { bus } from '../events/bus.js';

/**
 * Control panel below the simulation canvas.
 */
export class SimControls extends HTMLElement {
  connectedCallback() {
    this._shadow = this.attachShadow({ mode: 'open' });
    this._shadow.innerHTML = `
      <style>
        :host {
          display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
          padding: 8px 12px; flex-shrink: 0;
          background: var(--color-surface, #111827);
          border-top: 1px solid var(--color-border, #2d3f5a);
        }
        .group { display: flex; align-items: center; gap: 8px; }
        label { font-size: 11px; color: var(--color-muted, #94a3b8); white-space: nowrap; }
        input[type=range] { accent-color: var(--color-accent, #22d3ee); width: 90px; }
        button {
          font-size: 12px; padding: 5px 12px; border: none; border-radius: 6px;
          cursor: pointer; font-weight: 600; transition: opacity .15s;
        }
        button:hover { opacity: .85; }
        .btn-play  { background: #22d3ee; color: #000; }
        .btn-pause { background: #fbbf24; color: #000; }
        .btn-reset { background: #f87171; color: #000; }
        .sep { width: 1px; height: 22px; background: var(--color-border, #2d3f5a); }
        .pop-badge {
          font-size: 12px; color: var(--color-accent, #22d3ee);
          background: var(--color-surface2, #1e293b);
          border-radius: 6px; padding: 3px 8px;
          font-weight: 600;
        }
        .gen-badge {
          font-size: 12px; color: var(--color-accent2, #a78bfa);
          background: var(--color-surface2, #1e293b);
          border-radius: 6px; padding: 3px 8px;
          font-weight: 600;
        }
      </style>

      <button class="btn-play" id="btn-play">▶ Play</button>
      <button class="btn-pause" id="btn-pause">⏸ Pause</button>
      <button class="btn-reset" id="btn-reset">↺ Reset</button>

      <div class="sep"></div>

      <div class="group">
        <label>Speed</label>
        <input type="range" id="speed" min="1" max="8" value="1" step="1">
        <span id="speed-val" style="font-size:12px;min-width:14px;">1×</span>
      </div>

      <div class="sep"></div>

      <div class="group">
        <label>Food</label>
        <input type="range" id="food-rate" min="1" max="10" value="4" step="1">
      </div>

      <div class="sep"></div>

      <span class="pop-badge">Pop: <span id="pop">0</span></span>
      <span class="gen-badge">Gen: <span id="gen">0</span></span>
    `;

    const s = this._shadow;
    s.getElementById('btn-play').addEventListener('click', () => bus.emit('sim:play'));
    s.getElementById('btn-pause').addEventListener('click', () => bus.emit('sim:pause'));
    s.getElementById('btn-reset').addEventListener('click', () => bus.emit('sim:reset'));

    const speedEl  = s.getElementById('speed');
    const speedVal = s.getElementById('speed-val');
    speedEl.addEventListener('input', () => {
      speedVal.textContent = speedEl.value + '×';
      bus.emit('sim:speed', { speed: +speedEl.value });
    });

    const foodEl = s.getElementById('food-rate');
    foodEl.addEventListener('input', () => {
      bus.emit('sim:food-rate', { rate: +foodEl.value });
    });

    this._onStats = ({ detail }) => {
      s.getElementById('pop').textContent = detail.population;
      s.getElementById('gen').textContent = detail.maxGen;
    };
    bus.on('sim:stats', this._onStats);
  }

  disconnectedCallback() {
    bus.off('sim:stats', this._onStats);
  }
}

customElements.define('sim-controls', SimControls);
