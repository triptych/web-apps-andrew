import { bus } from '../events/bus.js';

/**
 * Stats dashboard with live charts.
 */
export class StatsView extends HTMLElement {
  connectedCallback() {
    this._shadow = this.attachShadow({ mode: 'open' });
    this._shadow.innerHTML = `
      <style>
        :host { display: block; height: 100%; overflow: hidden; }
        .container {
          padding: 14px; overflow-y: auto; height: 100%;
          display: grid; grid-template-columns: 1fr 1fr; gap: 12px; align-content: start;
        }
        .stat-card {
          background: #1e293b; border: 1px solid #2d3f5a;
          border-radius: 8px; padding: 14px;
        }
        .stat-card h3 { font-size: 10px; text-transform: uppercase; color: #94a3b8; margin-bottom: 6px; letter-spacing:.06em; }
        .stat-value { font-size: 26px; font-weight: 700; color: #22d3ee; }
        .stat-sub   { font-size: 11px; color: #64748b; margin-top: 2px; }
        .chart-card {
          grid-column: 1 / -1;
          background: #1e293b; border: 1px solid #2d3f5a;
          border-radius: 8px; padding: 14px;
        }
        .chart-card h3 { font-size: 10px; text-transform: uppercase; color: #94a3b8; margin-bottom: 10px; letter-spacing:.06em; }
        canvas { width: 100% !important; display: block; }
        .trait-bars { display: flex; flex-direction: column; gap: 8px; }
        .tb-row { display: flex; align-items: center; gap: 8px; font-size: 11px; color: #94a3b8; }
        .tb-row span:first-child { width: 70px; }
        .tb-track { flex:1; height:8px; background:#0f1a2e; border-radius:4px; }
        .tb-fill  { height:100%; border-radius:4px; transition: width .4s; }
      </style>
      <div class="container">
        <div class="stat-card">
          <h3>Population</h3>
          <div class="stat-value" id="pop">0</div>
          <div class="stat-sub">alive creatures</div>
        </div>
        <div class="stat-card">
          <h3>Generation</h3>
          <div class="stat-value" id="gen" style="color:#a78bfa">0</div>
          <div class="stat-sub">max reached</div>
        </div>
        <div class="stat-card">
          <h3>Total Births</h3>
          <div class="stat-value" id="births" style="color:#4ade80">0</div>
          <div class="stat-sub">since start</div>
        </div>
        <div class="stat-card">
          <h3>Total Deaths</h3>
          <div class="stat-value" id="deaths" style="color:#f87171">0</div>
          <div class="stat-sub">since start</div>
        </div>

        <div class="chart-card">
          <h3>Population over Time</h3>
          <canvas id="pop-chart" height="80"></canvas>
        </div>

        <div class="chart-card" style="grid-column:1/-1">
          <h3>Average Traits</h3>
          <div class="trait-bars">
            <div class="tb-row"><span>Speed</span>    <div class="tb-track"><div class="tb-fill" id="bar-speed" style="background:#22d3ee"></div></div><span id="v-speed">-</span></div>
            <div class="tb-row"><span>Size</span>     <div class="tb-track"><div class="tb-fill" id="bar-size"  style="background:#a78bfa"></div></div><span id="v-size">-</span></div>
            <div class="tb-row"><span>Aggression</span><div class="tb-track"><div class="tb-fill" id="bar-agg"  style="background:#f87171"></div></div><span id="v-agg">-</span></div>
          </div>
        </div>
      </div>
    `;

    this._s = this._shadow;
    this._history = [];

    this._onStats = ({ detail }) => this._update(detail);
    bus.on('sim:stats', this._onStats);
  }

  _update(stats) {
    const s = this._s;
    s.getElementById('pop').textContent    = stats.population;
    s.getElementById('gen').textContent    = stats.maxGen;
    s.getElementById('births').textContent = stats.births;
    s.getElementById('deaths').textContent = stats.deaths ?? 0;

    // trait bars (speed 0-4, size 0-1.6, aggression 0-1)
    const sp = stats.avgSpeed / 4;
    const si = stats.avgSize  / 1.6;
    const ag = stats.avgAggression;

    s.getElementById('bar-speed').style.width = (sp * 100).toFixed(1) + '%';
    s.getElementById('bar-size').style.width  = (si * 100).toFixed(1) + '%';
    s.getElementById('bar-agg').style.width   = (ag * 100).toFixed(1) + '%';
    s.getElementById('v-speed').textContent   = stats.avgSpeed.toFixed(2);
    s.getElementById('v-size').textContent    = stats.avgSize.toFixed(2);
    s.getElementById('v-agg').textContent     = stats.avgAggression.toFixed(2);

    this._history = stats.history;
    this._drawChart();
  }

  _drawChart() {
    const cv = this._s.getElementById('pop-chart');
    if (!this._history.length) return;
    const dpr = window.devicePixelRatio || 1;
    const W = cv.offsetWidth || 400;
    const H = 80;
    cv.width  = W * dpr;
    cv.height = H * dpr;
    const ctx = cv.getContext('2d');
    ctx.scale(dpr, dpr);

    const hist = this._history;
    const maxPop = Math.max(1, ...hist.map(h => h.pop));

    ctx.clearRect(0, 0, W, H);

    // Gradient fill
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, 'rgba(34,211,238,0.35)');
    grad.addColorStop(1, 'rgba(34,211,238,0.02)');

    ctx.beginPath();
    hist.forEach((d, i) => {
      const x = (i / (hist.length - 1)) * W;
      const y = H - (d.pop / maxPop) * (H - 6);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    // close fill
    ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Line
    ctx.beginPath();
    hist.forEach((d, i) => {
      const x = (i / (hist.length - 1)) * W;
      const y = H - (d.pop / maxPop) * (H - 6);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth   = 1.5;
    ctx.stroke();
  }

  disconnectedCallback() {
    bus.off('sim:stats', this._onStats);
  }
}

customElements.define('stats-view', StatsView);
