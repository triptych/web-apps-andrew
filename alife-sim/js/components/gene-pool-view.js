import { bus } from '../events/bus.js';

/**
 * Renders a visual gene-pool grid showing live creatures.
 */
export class GenePoolView extends HTMLElement {
  connectedCallback() {
    this._shadow = this.attachShadow({ mode: 'open' });
    this._shadow.innerHTML = `
      <style>
        :host { display: block; height: 100%; overflow: hidden; }
        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
          gap: 10px; padding: 14px; overflow-y: auto; height: 100%;
        }
        .card {
          background: #1e293b; border: 1px solid #2d3f5a;
          border-radius: 8px; padding: 10px 8px;
          text-align: center; cursor: pointer;
          transition: border-color .15s, transform .15s;
        }
        .card:hover { border-color: #22d3ee; transform: translateY(-2px); }
        canvas { display: block; margin: 0 auto 6px; border-radius: 50%; }
        .name { font-size: 10px; color: #94a3b8; }
        .gen  { font-size: 12px; font-weight: 600; color: #e2e8f0; }
        .bars { margin-top: 6px; display: flex; flex-direction: column; gap: 3px; }
        .bar-row { display: flex; align-items: center; gap: 4px; font-size: 9px; color: #64748b; }
        .bar-track { flex:1; height:4px; background:#0f1a2e; border-radius:2px; }
        .bar-fill  { height:100%; border-radius:2px; }
      </style>
      <div class="grid" id="grid"></div>
    `;

    this._grid = this._shadow.getElementById('grid');
    this._onStats = ({ detail }) => this._refresh(detail);
    bus.on('sim:stats', this._onStats);
    bus.on('sim:creatures', ({ detail }) => { this._creatures = detail; });
  }

  _refresh(stats) {
    // We need direct access to creature list — stored by main.js
    const creatures = window.__alife_creatures;
    if (!creatures) return;
    const alive = creatures.filter(c => c.alive).slice(0, 60);

    // Re-render cards
    const frag = document.createDocumentFragment();
    for (const c of alive) {
      const card = document.createElement('div');
      card.className = 'card';
      card.dataset.id = c.id;

      // Mini canvas portrait
      const cv = document.createElement('canvas');
      cv.width = cv.height = 40;
      const ctx = cv.getContext('2d');
      const col = c.color;
      const cx = 20, cy = 20, r = 14 * c.traits.size * 0.6;
      ctx.beginPath();
      ctx.arc(cx, cy, Math.min(r, 18), 0, Math.PI * 2);
      ctx.fillStyle = `hsl(${col.h},${col.s}%,${col.l}%)`;
      ctx.fill();
      // direction indicator
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(-c.angle + Math.PI / 2);
      ctx.beginPath();
      ctx.moveTo(0, -r * 0.8);
      ctx.lineTo(-r * 0.3, r * 0.4);
      ctx.lineTo(r * 0.3, r * 0.4);
      ctx.closePath();
      ctx.fillStyle = `hsla(${col.h},90%,90%,0.9)`;
      ctx.fill();
      ctx.restore();

      const bars = [
        { label: 'Spd', val: c.traits.speed / 4,   color: '#22d3ee' },
        { label: 'Agg', val: c.traits.aggression,  color: '#f87171' },
        { label: 'Eng', val: c.energy,              color: '#4ade80' },
      ];

      card.innerHTML = `
        <div class="gen">Gen ${c.generation}</div>
        <div class="name">#${c.id}</div>
        <div class="bars">
          ${bars.map(b => `
            <div class="bar-row">
              <span>${b.label}</span>
              <div class="bar-track"><div class="bar-fill" style="width:${(b.val*100).toFixed(0)}%;background:${b.color}"></div></div>
            </div>
          `).join('')}
        </div>
      `;
      card.prepend(cv);

      card.addEventListener('click', () => {
        bus.emit('creature:inspect', { creature: c });
      });

      frag.appendChild(card);
    }

    this._grid.innerHTML = '';
    this._grid.appendChild(frag);
  }

  disconnectedCallback() {
    bus.off('sim:stats', this._onStats);
  }
}

customElements.define('gene-pool-view', GenePoolView);
