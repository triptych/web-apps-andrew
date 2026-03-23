import { randomGenome, crossover, mutate, decode } from './genome.js';

let _nextId = 0;

/**
 * A single creature in the simulation world.
 */
export class Creature {
  /**
   * @param {object} opts
   * @param {Float32Array} [opts.genome]
   * @param {number} [opts.x]
   * @param {number} [opts.y]
   * @param {number} [opts.generation]
   * @param {number} [opts.parentId]
   */
  constructor({ genome, x = 0, y = 0, generation = 0, parentId = null } = {}) {
    this.id         = _nextId++;
    this.genome     = genome ?? randomGenome();
    this.traits     = decode(this.genome);
    this.generation = generation;
    this.parentId   = parentId;

    this.x = x;
    this.y = y;
    this.angle = Math.random() * Math.PI * 2;
    this.vx = 0;
    this.vy = 0;

    this.energy     = 0.5 + Math.random() * 0.3;  // 0–1
    this.age        = 0;
    this.alive      = true;
    this.children   = 0;

    // locomotion state
    this._wobblePhase = Math.random() * Math.PI * 2;
    this._targetAngle = this.angle;
  }

  get radius() { return 3 * this.traits.size; }

  /** Colour as HSL string. */
  get color() {
    const h = this.traits.hue;
    const s = 60 + this.traits.aggression * 30;
    const l = 40 + this.traits.size * 15;
    return { h, s, l };
  }

  /**
   * Tick the creature one step.
   * @param {object} world  { width, height, creatures, foods, config }
   */
  tick(world) {
    if (!this.alive) return;

    this.age++;
    const t = this.traits;

    // ── Die of old age or starvation ──────────────────────────────────
    if (this.age > t.longevity || this.energy <= 0) {
      this.alive = false;
      return;
    }

    // ── Sense nearby entities ─────────────────────────────────────────
    const { nearestFood, nearestThreat, nearestMate } =
      this._sense(world);

    // ── Decide steering target ────────────────────────────────────────
    let steer = null;
    let flee  = false;

    if (nearestThreat && t.fearfulness > 0.3) {
      // flee
      const dx = this.x - nearestThreat.x;
      const dy = this.y - nearestThreat.y;
      steer = Math.atan2(dy, dx);
      flee  = true;
    } else if (nearestFood) {
      steer = Math.atan2(nearestFood.y - this.y, nearestFood.x - this.x);
    } else if (nearestMate && this.energy > t.fertility * 0.7) {
      steer = Math.atan2(nearestMate.y - this.y, nearestMate.x - this.x);
    }

    // ── Wobble / random walk ──────────────────────────────────────────
    this._wobblePhase += 0.12;
    const wobble = Math.sin(this._wobblePhase) * t.wobble * 0.3;

    if (steer !== null) {
      this._targetAngle = steer + wobble;
    } else {
      this._targetAngle += (Math.random() - 0.5) * t.turnRate * 3 + wobble;
    }

    // smooth turn
    const diff = _angleDiff(this._targetAngle, this.angle);
    this.angle += Math.sign(diff) * Math.min(Math.abs(diff), t.turnRate);

    // ── Move ──────────────────────────────────────────────────────────
    const speed = t.speed * (flee ? 1.4 : 1.0);
    this.vx = Math.cos(this.angle) * speed;
    this.vy = Math.sin(this.angle) * speed;
    this.x += this.vx;
    this.y += this.vy;

    // ── Boundary wrap ─────────────────────────────────────────────────
    const { width, height } = world;
    if (this.x < 0) this.x += width;
    if (this.x > width) this.x -= width;
    if (this.y < 0) this.y += height;
    if (this.y > height) this.y -= height;

    // ── Eat food ──────────────────────────────────────────────────────
    for (const food of world.foods) {
      if (!food.alive) continue;
      const d = _dist(this.x, this.y, food.x, food.y);
      if (d < this.radius + food.radius) {
        food.alive = false;
        this.energy = Math.min(1, this.energy + food.energy);
      }
    }

    // ── Eat weaker creatures (if aggressive) ─────────────────────────
    if (t.aggression > 0.6) {
      for (const other of world.creatures) {
        if (!other.alive || other.id === this.id) continue;
        if (other.traits.size >= t.size) continue;  // only eat smaller
        const d = _dist(this.x, this.y, other.x, other.y);
        if (d < this.radius + other.radius) {
          other.alive = false;
          this.energy = Math.min(1, this.energy + other.energy * 0.6);
        }
      }
    }

    // ── Metabolism ────────────────────────────────────────────────────
    this.energy -= t.metabolism;
  }

  /**
   * Produce an offspring genome (call when ready to reproduce).
   * @param {Creature} [mate]
   * @returns {Float32Array}
   */
  reproduce(mate) {
    this.children++;
    let childGenome;
    if (mate) {
      childGenome = crossover(this.genome, mate.genome);
    } else {
      childGenome = this.genome.slice();
    }
    mutate(childGenome);
    return childGenome;
  }

  /** @returns {{ nearestFood, nearestThreat, nearestMate }} */
  _sense({ creatures, foods }) {
    const t = this.traits;
    let nearestFood = null, foodDist = Infinity;
    let nearestThreat = null, threatDist = Infinity;
    let nearestMate = null, mateDist = Infinity;

    for (const food of foods) {
      if (!food.alive) continue;
      const d = _dist(this.x, this.y, food.x, food.y);
      if (d < t.senseRange && d < foodDist) {
        if (_inFOV(this.angle, this.x, this.y, food.x, food.y, t.senseAngle)) {
          nearestFood = food; foodDist = d;
        }
      }
    }

    for (const other of creatures) {
      if (!other.alive || other.id === this.id) continue;
      const d = _dist(this.x, this.y, other.x, other.y);
      if (d > t.senseRange) continue;
      if (!_inFOV(this.angle, this.x, this.y, other.x, other.y, t.senseAngle)) continue;

      // Is it a threat? Larger + aggressive
      if (other.traits.aggression > 0.5 && other.traits.size > t.size * 0.9) {
        if (d < threatDist) { nearestThreat = other; threatDist = d; }
      }

      // Is it a mate? Similar hue, enough energy
      const hueDiff = Math.abs(other.traits.hue - t.hue);
      if (hueDiff < 60 && other.energy > other.traits.fertility * 0.6) {
        if (d < mateDist) { nearestMate = other; mateDist = d; }
      }
    }

    return { nearestFood, nearestThreat, nearestMate };
  }
}

function _dist(ax, ay, bx, by) {
  const dx = ax - bx, dy = ay - by;
  return Math.sqrt(dx * dx + dy * dy);
}

function _inFOV(angle, ax, ay, bx, by, halfAngle) {
  const a = Math.atan2(by - ay, bx - ax);
  return Math.abs(_angleDiff(a, angle)) < halfAngle;
}

function _angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}
