import { bus } from '../events/bus.js';

/**
 * Populates #modal-creature-body when a creature is inspected.
 */
export class CreatureModal extends HTMLElement {
  connectedCallback() {
    this._onInspect = ({ detail: { creature: c } }) => this._show(c);
    bus.on('creature:inspect', this._onInspect);
  }

  _show(c) {
    const t = c.traits;
    const col = c.color;

    const body = document.getElementById('modal-creature-body');
    if (!body) return;

    body.innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;min-width:280px">
        <div style="grid-column:1/-1;display:flex;align-items:center;gap:12px;margin-bottom:8px">
          <canvas id="mc-portrait" width="56" height="56" style="border-radius:50%;flex-shrink:0"></canvas>
          <div>
            <div style="font-size:18px;font-weight:700;color:#22d3ee">#${c.id}</div>
            <div style="font-size:12px;color:#94a3b8">Generation ${c.generation}${c.parentId !== null ? ` · parent #${c.parentId}` : ''}</div>
            <div style="font-size:12px;color:#94a3b8">Age ${c.age} · Children ${c.children}</div>
          </div>
        </div>
        ${this._row('Speed',      t.speed.toFixed(2),      '#22d3ee')}
        ${this._row('Turn Rate',  t.turnRate.toFixed(3),   '#67e8f9')}
        ${this._row('Sense Range',t.senseRange.toFixed(0), '#a78bfa')}
        ${this._row('Metabolism', t.metabolism.toFixed(4), '#fbbf24')}
        ${this._row('Size',       t.size.toFixed(2),       '#c084fc')}
        ${this._row('Aggression', (t.aggression*100).toFixed(0)+'%', '#f87171')}
        ${this._row('Sociability',(t.sociability*100).toFixed(0)+'%','#34d399')}
        ${this._row('Fearfulness',(t.fearfulness*100).toFixed(0)+'%','#60a5fa')}
        ${this._row('Fertility',  t.fertility.toFixed(2),  '#a3e635')}
        ${this._row('Longevity',  t.longevity.toFixed(0),  '#fb923c')}
        ${this._row('Mut. Rate',  t.mutationRate.toFixed(3),'#94a3b8')}
        ${this._row('Energy',     (c.energy*100).toFixed(0)+'%','#4ade80')}

        <div style="grid-column:1/-1;margin-top:10px">
          <div style="font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:#64748b;margin-bottom:6px">Raw Genome</div>
          <div style="display:flex;gap:2px;flex-wrap:wrap">
            ${[...c.genome].map(v =>
              `<div title="${v.toFixed(3)}" style="width:14px;height:14px;border-radius:2px;background:hsl(${v*360},60%,45%)" ></div>`
            ).join('')}
          </div>
        </div>
      </div>
    `;

    // draw portrait
    const cv  = body.querySelector('#mc-portrait');
    const ctx = cv.getContext('2d');
    ctx.beginPath();
    ctx.arc(28, 28, 22, 0, Math.PI*2);
    ctx.fillStyle = `hsl(${col.h},${col.s}%,${col.l}%)`;
    ctx.fill();
    ctx.save();
    ctx.translate(28, 28);
    ctx.rotate(-c.angle + Math.PI/2);
    ctx.beginPath();
    ctx.moveTo(0, -16); ctx.lineTo(-7, 8); ctx.lineTo(7, 8); ctx.closePath();
    ctx.fillStyle = `hsla(${col.h},90%,90%,0.9)`;
    ctx.fill();
    ctx.restore();

    bus.emit('modal:request-open');
  }

  _row(label, value, color) {
    return `
      <div style="background:#0f1a2e;border-radius:6px;padding:8px 10px">
        <div style="font-size:10px;text-transform:uppercase;color:#64748b;letter-spacing:.04em">${label}</div>
        <div style="font-size:15px;font-weight:600;color:${color}">${value}</div>
      </div>
    `;
  }

  disconnectedCallback() {
    bus.off('creature:inspect', this._onInspect);
  }
}

customElements.define('creature-modal-ctrl', CreatureModal);
