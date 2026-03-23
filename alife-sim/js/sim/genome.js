/**
 * Genome — encodes all heritable traits of a creature.
 * Each gene is a float in [0, 1] unless otherwise noted.
 *
 * Layout (fixed-length array, 16 genes):
 *  0  speed         max velocity
 *  1  turnRate      angular agility
 *  2  senseRange    detection radius
 *  3  senseAngle    field-of-view half-angle (0=narrow,1=wide)
 *  4  metabolism    energy burn rate
 *  5  size          body radius scale
 *  6  hue           body colour hue (0–1 → 0–360°)
 *  7  aggression    tendency to chase others
 *  8  sociability   attraction to same-ish hue
 *  9  fearfulness   flee response strength
 * 10  fertility     reproduction threshold
 * 11  longevity     lifespan scalar
 * 12  mutationRate  chance each gene mutates on offspring
 * 13  wobble        locomotion wiggle amplitude
 * 14  r1            reserved / future use
 * 15  r2            reserved / future use
 */

export const GENOME_LENGTH = 16;

/** Create a random genome. */
export function randomGenome() {
  return Float32Array.from({ length: GENOME_LENGTH }, () => Math.random());
}

/**
 * Crossover two parent genomes (uniform crossover).
 * @param {Float32Array} a
 * @param {Float32Array} b
 * @returns {Float32Array}
 */
export function crossover(a, b) {
  const child = new Float32Array(GENOME_LENGTH);
  for (let i = 0; i < GENOME_LENGTH; i++) {
    child[i] = Math.random() < 0.5 ? a[i] : b[i];
  }
  return child;
}

/**
 * Mutate a genome in-place.
 * @param {Float32Array} g
 * @param {number} rate  per-gene mutation probability (uses gene[12] if not provided)
 */
export function mutate(g, rate) {
  const r = rate ?? g[12] * 0.15 + 0.01;
  for (let i = 0; i < GENOME_LENGTH; i++) {
    if (Math.random() < r) {
      // Gaussian-like perturbation
      const delta = (Math.random() + Math.random() - 1) * 0.25;
      g[i] = Math.max(0, Math.min(1, g[i] + delta));
    }
  }
}

/** Read named genes with convenient scaling. */
export function decode(g) {
  return {
    speed:       0.5 + g[0] * 3.5,          // 0.5 – 4.0
    turnRate:    0.02 + g[1] * 0.08,         // 0.02 – 0.10 rad/tick
    senseRange:  20  + g[2] * 120,           // 20 – 140 units
    senseAngle:  0.3 + g[3] * 2.2,          // 0.3 – 2.5 rad
    metabolism:  0.003 + g[4] * 0.012,      // energy/tick
    size:        0.4 + g[5] * 1.2,          // radius scale 0.4 – 1.6
    hue:         g[6] * 360,
    aggression:  g[7],
    sociability: g[8],
    fearfulness: g[9],
    fertility:   0.4 + g[10] * 0.5,         // energy threshold to reproduce
    longevity:   800 + g[11] * 3200,        // max age ticks
    mutationRate:g[12] * 0.15 + 0.01,
    wobble:      g[13] * 1.4,
  };
}
