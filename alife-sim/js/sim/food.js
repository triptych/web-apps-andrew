let _fid = 0;

/**
 * Biome definitions — four quadrant zones.
 * type:        string tag used for creature affinity bonus
 * foodWeight:  relative probability of food spawning here (higher = more food)
 * foodBonus:   extra energy multiplier for food in this biome
 */
export const BIOMES = [
  { name: 'Lush',     qx: 0, qy: 0, type: 'herbivore',  foodWeight: 2.0, foodBonus: 1.3 },
  { name: 'Desert',   qx: 1, qy: 0, type: 'camouflage', foodWeight: 0.5, foodBonus: 0.9 },
  { name: 'Hunting',  qx: 0, qy: 1, type: 'carnivore',  foodWeight: 1.0, foodBonus: 1.0 },
  { name: 'Twilight', qx: 1, qy: 1, type: 'social',     foodWeight: 1.2, foodBonus: 1.1 },
];

const _totalWeight = BIOMES.reduce((s, b) => s + b.foodWeight, 0);

/** Pick a biome by weighted random, return its quadrant coords. */
function _pickBiome() {
  let r = Math.random() * _totalWeight;
  for (const b of BIOMES) {
    r -= b.foodWeight;
    if (r <= 0) return b;
  }
  return BIOMES[BIOMES.length - 1];
}

/** Get biome for a world position. */
export function getBiomeAt(x, y, width, height) {
  const qx = x < width  / 2 ? 0 : 1;
  const qy = y < height / 2 ? 0 : 1;
  return BIOMES.find(b => b.qx === qx && b.qy === qy) ?? BIOMES[0];
}

export class Food {
  constructor(x, y, biome) {
    this.id     = _fid++;
    this.x      = x;
    this.y      = y;
    this.radius = 3;
    this.biome  = biome;
    this.energy = (0.18 + Math.random() * 0.14) * (biome?.foodBonus ?? 1);
    this.alive  = true;
    this.age    = 0;
  }

  tick() {
    this.age++;
  }
}

/**
 * Spawn food pellets using biome-weighted distribution.
 * @param {number} n
 * @param {number} width
 * @param {number} height
 * @returns {Food[]}
 */
export function spawnFood(n, width, height) {
  return Array.from({ length: n }, () => {
    const biome = _pickBiome();
    const x = (biome.qx + Math.random()) * (width  / 2);
    const y = (biome.qy + Math.random()) * (height / 2);
    return new Food(x, y, biome);
  });
}
