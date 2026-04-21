import { randomGenome, crossover, mutate, decode } from './genome.js';
import { getBiomeAt } from './food.js';

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

    // Baldwin effect: track lifetime fitness score
    this._lifetimeEnergyGained = 0;
    this._lifetimeEnergyLost   = 0;

    // Autopoiesis: self-repair state
    this._idleTicks = 0;  // consecutive ticks without threat/active pursuit

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

    // ── Biome affinity bonus ──────────────────────────────────────────
    // Creatures whose traits match the local biome get an efficiency boost.
    const biome = getBiomeAt(this.x, this.y, world.width, world.height);
    let biomeBonus = 1.0;
    if (biome.type === 'herbivore'  && t.diet        < 0.4) biomeBonus = 1.25;
    if (biome.type === 'carnivore'  && t.diet        > 0.6) biomeBonus = 1.20;
    if (biome.type === 'camouflage' && t.camouflage  > 0.6) biomeBonus = 1.30;
    if (biome.type === 'social'     && t.sociability > 0.6) biomeBonus = 1.20;

    // ── Eat food ──────────────────────────────────────────────────────
    // Diet gene: herbivores (diet < 0.5) get a bonus on plant food efficiency
    const herbivoreBonus = biomeBonus * (1 + (1 - t.diet) * 0.5);  // 1.0–1.5× for herbivores
    for (const food of world.foods) {
      if (!food.alive) continue;
      const d = _dist(this.x, this.y, food.x, food.y);
      if (d < this.radius + food.radius) {
        food.alive = false;
        const foodGain = food.energy * herbivoreBonus;
        this._lifetimeEnergyGained += foodGain;
        this.energy = Math.min(1, this.energy + foodGain);
      }
    }

    // ── Eat weaker creatures (if aggressive) ─────────────────────────
    // Noise robustness: prey takes an energy bite each tick of contact;
    // only dies when energy is fully drained — no instant annihilation.
    if (t.aggression > 0.6) {
      for (const other of world.creatures) {
        if (!other.alive || other.id === this.id) continue;
        if (other.traits.size >= t.size) continue;  // only eat smaller
        const d = _dist(this.x, this.y, other.x, other.y);
        if (d < this.radius + other.radius) {
          // Camouflage reduces predation — stealthy prey is harder to catch
          const catchChance = 1 - other.traits.camouflage * 0.6;
          if (Math.random() > catchChance) continue;
          // Diet gene: carnivores (diet > 0.5) get bonus predation efficiency
          const carnivoreBonus = 0.5 + t.diet * 0.5;  // 0.5–1.0
          const bite = Math.min(other.energy, 0.08 + t.aggression * 0.12);
          other.energy -= bite;
          this.energy = Math.min(1, this.energy + bite * carnivoreBonus);
          if (other.energy <= 0) other.alive = false;
        }
      }
    }

    // ── Autopoiesis: self-repair when calm ────────────────────────────
    // Creatures that are not fleeing and have no active target recover slowly.
    // Recovery scales with longevity gene — long-lived organisms self-maintain better.
    if (!flee && steer === null && this.energy > 0.2) {
      this._idleTicks++;
      if (this._idleTicks > 20) {
        const repairRate = (t.longevity / 4000) * 0.001;  // up to 0.001/tick
        this.energy = Math.min(1, this.energy + repairRate);
      }
    } else {
      this._idleTicks = 0;
    }

    // ── Metabolism ────────────────────────────────────────────────────
    this._lifetimeEnergyLost += t.metabolism;
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

    // Baldwin effect: if this creature was highly successful (gained >> lost),
    // nudge the child genome slightly toward the parent's own values.
    // This simulates phenotypic plasticity feeding back into the gene pool.
    const fitnessScore = this._lifetimeEnergyGained /
      (this._lifetimeEnergyLost + 0.001);
    if (fitnessScore > 2.0) {
      const nudge = Math.min(0.04, (fitnessScore - 2.0) * 0.01);
      for (let i = 0; i < childGenome.length; i++) {
        childGenome[i] = Math.max(0, Math.min(1,
          childGenome[i] + (this.genome[i] - childGenome[i]) * nudge
        ));
      }
    }

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
