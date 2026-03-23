import { Creature } from './creature.js';
import { Food, spawnFood } from './food.js';
import { bus } from '../events/bus.js';

/**
 * Simulation world — owns creatures + food, runs ticks.
 */
export class World {
  constructor({ width = 800, height = 600, config } = {}) {
    this.width    = width;
    this.height   = height;
    this.config   = config;

    this.creatures  = [];
    this.foods      = [];
    this.tick       = 0;
    this.generation = 0;

    this.stats = {
      population: 0,
      births: 0,
      deaths: 0,
      maxGen: 0,
      avgSpeed: 0,
      avgSize: 0,
      avgAggression: 0,
      history: [],        // [{ tick, pop }]
    };

    this._foodTimer = 0;
    this._births    = [];  // newly born this tick (for renderer)
  }

  seed() {
    const n = this.config.initialPopulation;
    for (let i = 0; i < n; i++) {
      this.creatures.push(new Creature({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
      }));
    }
    this.foods = spawnFood(this.config.initialFood, this.width, this.height);
  }

  step() {
    this.tick++;
    this._births = [];

    const cfg = this.config;
    const ctx = {
      width:     this.width,
      height:    this.height,
      creatures: this.creatures,
      foods:     this.foods,
      config:    cfg,
    };

    // ── Tick creatures ────────────────────────────────────────────────
    for (const c of this.creatures) c.tick(ctx);

    // ── Tick food ─────────────────────────────────────────────────────
    for (const f of this.foods) f.tick();

    // ── Reproduction ──────────────────────────────────────────────────
    const alive = this.creatures.filter(c => c.alive);
    if (alive.length < cfg.maxPopulation) {
      for (const c of alive) {
        if (c.energy < c.traits.fertility) continue;
        if (Math.random() > cfg.reproductionRate) continue;

        // find nearby mate of same-ish hue
        let mate = null;
        for (const other of alive) {
          if (other.id === c.id) continue;
          const dx = c.x - other.x, dy = c.y - other.y;
          if (dx*dx + dy*dy > 900) continue;  // 30 units
          if (Math.abs(other.traits.hue - c.traits.hue) < 90) {
            mate = other; break;
          }
        }

        const childGenome = c.reproduce(mate);
        c.energy -= 0.35;

        const child = new Creature({
          genome:     childGenome,
          x:          c.x + (Math.random() - 0.5) * 10,
          y:          c.y + (Math.random() - 0.5) * 10,
          generation: c.generation + 1,
          parentId:   c.id,
        });
        this.creatures.push(child);
        this._births.push(child);
        this.stats.births++;
        if (child.generation > this.stats.maxGen) {
          this.stats.maxGen = child.generation;
          this.generation   = child.generation;
        }
      }
    }

    // ── Restock food ──────────────────────────────────────────────────
    this._foodTimer++;
    if (this._foodTimer >= cfg.foodSpawnInterval) {
      this._foodTimer = 0;
      const living = this.foods.filter(f => f.alive);
      const deficit = cfg.maxFood - living.length;
      if (deficit > 0) {
        const batch = Math.min(deficit, cfg.foodBatchSize);
        const newFood = spawnFood(batch, this.width, this.height);
        // Recycle dead slots
        let ri = 0;
        for (const f of this.foods) {
          if (!f.alive && ri < newFood.length) {
            Object.assign(f, newFood[ri++]);
            f.alive = true;
          }
        }
        for (; ri < newFood.length; ri++) this.foods.push(newFood[ri]);
      }
    }

    // ── Cull dead creatures (keep array bounded) ──────────────────────
    if (this.creatures.length > cfg.maxPopulation * 3) {
      this.creatures = this.creatures.filter(c => c.alive);
    }

    // ── Update stats ──────────────────────────────────────────────────
    const pop = alive.length + this._births.length;
    this.stats.population = pop;

    if (this.tick % 60 === 0) {
      const all = [...alive, ...this._births];
      if (all.length) {
        this.stats.avgSpeed      = avg(all.map(c => c.traits.speed));
        this.stats.avgSize       = avg(all.map(c => c.traits.size));
        this.stats.avgAggression = avg(all.map(c => c.traits.aggression));
      }
      this.stats.history.push({ tick: this.tick, pop });
      if (this.stats.history.length > 200) this.stats.history.shift();
      bus.emit('sim:stats', { ...this.stats });
    }

    // ── Extinction check ──────────────────────────────────────────────
    if (pop === 0 && this.tick > 10) {
      bus.emit('sim:extinct');
    }
  }

  resize(w, h) {
    this.width  = w;
    this.height = h;
  }
}

function avg(arr) {
  return arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0;
}
