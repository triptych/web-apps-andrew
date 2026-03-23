let _fid = 0;

export class Food {
  constructor(x, y) {
    this.id     = _fid++;
    this.x      = x;
    this.y      = y;
    this.radius = 3;
    this.energy = 0.18 + Math.random() * 0.14;
    this.alive  = true;
    this.age    = 0;
  }

  tick() {
    this.age++;
  }
}

/**
 * Spawn food pellets randomly in the world.
 * @param {number} n
 * @param {number} width
 * @param {number} height
 * @returns {Food[]}
 */
export function spawnFood(n, width, height) {
  return Array.from({ length: n }, () =>
    new Food(Math.random() * width, Math.random() * height)
  );
}
