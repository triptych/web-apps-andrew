// ── Custom elements ───────────────────────────────────────────────────────
import './components/app-layout.js';
import './components/app-tabs.js';
import './components/app-modal.js';
import './components/sim-controls.js';
import './components/gene-pool-view.js';
import './components/stats-view.js';
import './components/creature-modal.js';

// ── Simulation core ───────────────────────────────────────────────────────
import { World }       from './sim/world.js';
import { SimRenderer } from './renderer/scene.js';
import { bus }         from './events/bus.js';

// ── Simulation config (mutable via controls) ──────────────────────────────
const config = {
  initialPopulation: 40,
  maxPopulation:     200,
  initialFood:       120,
  maxFood:           220,
  foodSpawnInterval: 8,       // ticks between food respawn checks
  foodBatchSize:     12,
  reproductionRate:  0.008,   // per-creature per-tick chance
};

// ── Bootstrap ─────────────────────────────────────────────────────────────
let world, renderer, running = false, stepsPerFrame = 1, raf;

function init() {
  const container = document.getElementById('canvas-container');
  const w = container.clientWidth  || 800;
  const h = container.clientHeight || 600;

  world    = new World({ width: w, height: h, config });
  renderer = new SimRenderer(container, world);
  world.seed();

  // Expose creatures list for gene-pool-view
  window.__alife_creatures = world.creatures;

  running = true;
  loop();
}

function loop() {
  raf = requestAnimationFrame(loop);
  if (!running) return;

  for (let i = 0; i < stepsPerFrame; i++) world.step();

  renderer.update();
  renderer.render();

  // Count deaths lazily
  world.stats.deaths = world.creatures.filter(c => !c.alive).length;
}

function reset() {
  running = false;
  cancelAnimationFrame(raf);
  renderer?.dispose();
  document.getElementById('canvas-container').innerHTML = '';
  init();
}

// ── Bus listeners ─────────────────────────────────────────────────────────
bus.on('sim:play',  () => { running = true; });
bus.on('sim:pause', () => { running = false; });
bus.on('sim:reset', () => reset());
bus.on('sim:speed', ({ detail }) => { stepsPerFrame = detail.speed; });
bus.on('sim:food-rate', ({ detail }) => {
  config.foodSpawnInterval = Math.max(1, 12 - detail.rate);
  config.foodBatchSize     = detail.rate * 2;
});

bus.on('sim:extinct', () => {
  console.warn('Extinction event — resetting...');
  setTimeout(reset, 2000);
});

// ── Creature click-picking ────────────────────────────────────────────────
document.getElementById('canvas-container').addEventListener('click', e => {
  if (!world) return;
  const rect = e.currentTarget.getBoundingClientRect();
  const mx   = e.clientX - rect.left;
  const my   = e.clientY - rect.top;

  let closest = null, bestD = 30;
  for (const c of world.creatures) {
    if (!c.alive) continue;
    const dx = c.x - mx, dy = c.y - my;
    const d  = Math.sqrt(dx*dx + dy*dy);
    if (d < bestD) { bestD = d; closest = c; }
  }
  if (closest) bus.emit('creature:inspect', { creature: closest });
});

// ── Mount creature-modal controller ──────────────────────────────────────
const ctrl = document.createElement('creature-modal-ctrl');
document.body.appendChild(ctrl);

// ── Start (defer one frame so DOM layout is complete before reading clientWidth) ──
bus.emit('app:ready');
requestAnimationFrame(() => init());
