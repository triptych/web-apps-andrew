/**
 * Three.js renderer for the A-Life world.
 * Uses instanced meshes for performance.
 */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js';
import { BIOMES } from '../sim/food.js';

export class SimRenderer {
  /**
   * @param {HTMLElement} container
   * @param {import('../sim/world.js').World} world
   */
  constructor(container, world) {
    this.container = container;
    this.world     = world;

    this._setupThree();
    this._buildScene();
    this._ro = new ResizeObserver(() => this._onResize());
    this._ro.observe(container);
  }

  _setupThree() {
    // Guard: container may not be laid out yet — fall back to world size
    const w = this.container.clientWidth  || this.world.width;
    const h = this.container.clientHeight || this.world.height;

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(w, h);
    this.renderer.setClearColor(0x050810);
    this.container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();

    // OrthographicCamera(left, right, top, bottom, near, far)
    // top=h, bottom=0 is standard Three.js (Y up). We negate Y when placing objects
    // so world Y=0 → scene Y=h (top of screen), world Y=h → scene Y=0 (bottom).
    this.camera = new THREE.OrthographicCamera(0, w, h, 0, -100, 100);
    this.camera.position.z = 10;

    this._w = w;
    this._h = h;
  }

  _buildScene() {
    const MAX_C = 300;
    const MAX_F = 600;

    // ── Biome quadrant overlays ───────────────────────────────────────
    // Colors keyed to biome type — subtle tint, not distracting
    const biomeColors = {
      herbivore:  0x0a2e0a,  // dark green (Lush)
      desert:     0x2e1e00,  // dark amber (Desert)
      carnivore:  0x2e0a0a,  // dark red   (Hunting)
      social:     0x0a0a2e,  // dark blue  (Twilight)
    };
    this._biomeMeshes = [];
    // We'll size them on first resize; store placeholders now
    for (const biome of BIOMES) {
      const geo = new THREE.PlaneGeometry(1, 1);
      const mat = new THREE.MeshBasicMaterial({
        color:       biomeColors[biome.type] ?? 0x111111,
        transparent: true,
        opacity:     0.18,
        depthWrite:  false,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.z = -0.5;
      mesh.userData.biome = biome;
      this.scene.add(mesh);
      this._biomeMeshes.push(mesh);
    }
    this._biomeLabelsDirty = true;

    // ── Background grid ───────────────────────────────────────────────
    const gridMat   = new THREE.LineBasicMaterial({ color: 0x0f1a2e });
    const gridGeo   = new THREE.BufferGeometry();
    const gridVerts = [];
    const STEP = 60;
    for (let x = 0; x <= 2000; x += STEP) gridVerts.push(x, 0, -1, x, 2000, -1);
    for (let y = 0; y <= 2000; y += STEP) gridVerts.push(0, y, -1, 2000, y, -1);
    gridGeo.setAttribute('position', new THREE.Float32BufferAttribute(gridVerts, 3));
    this.scene.add(new THREE.LineSegments(gridGeo, gridMat));

    // ── Food (instanced) ──────────────────────────────────────────────
    const foodGeo = new THREE.CircleGeometry(1, 7);
    const foodMat = new THREE.MeshBasicMaterial({ color: 0x4ade80 });
    this._foodMesh = new THREE.InstancedMesh(foodGeo, foodMat, MAX_F);
    this._foodMesh.count = 0;
    this.scene.add(this._foodMesh);

    // ── Creature bodies (instanced, per-instance color) ───────────────
    const bodyGeo = new THREE.CircleGeometry(1, 10);
    this._creatureMesh = new THREE.InstancedMesh(
      bodyGeo,
      new THREE.MeshBasicMaterial(),
      MAX_C
    );
    this._creatureMesh.count = 0;
    // Pre-allocate instanceColor buffer (required before first setColorAt)
    this._creatureMesh.setColorAt(0, new THREE.Color(0xff00ff));
    this.scene.add(this._creatureMesh);

    // ── Direction triangles (instanced, per-instance color) ───────────
    const arrowGeo = new THREE.BufferGeometry();
    arrowGeo.setAttribute('position', new THREE.Float32BufferAttribute([
      0,    1.4, 0,
     -0.6, -0.7, 0,
      0.6, -0.7, 0,
    ], 3));
    arrowGeo.setIndex([0, 1, 2]);
    this._arrowMesh = new THREE.InstancedMesh(
      arrowGeo,
      new THREE.MeshBasicMaterial(),
      MAX_C
    );
    this._arrowMesh.count = 0;
    // Pre-allocate instanceColor buffer
    this._arrowMesh.setColorAt(0, new THREE.Color(0xffffff));
    this.scene.add(this._arrowMesh);

    this._dummy = new THREE.Object3D();
  }

  _updateBiomeQuads() {
    const w = this._w, h = this._h;
    const hw = w / 2, hh = h / 2;
    for (const mesh of this._biomeMeshes) {
      const b = mesh.userData.biome;
      mesh.scale.set(hw, hh, 1);
      mesh.position.set(hw * (b.qx + 0.5), hh * (b.qy + 0.5), -0.5);
    }
    this._biomeLabelsDirty = false;
  }

  update() {
    if (this._biomeLabelsDirty) this._updateBiomeQuads();
    const { creatures, foods } = this.world;
    const h     = this._h;
    const dummy = this._dummy;
    const color = new THREE.Color();

    // ── Food ──────────────────────────────────────────────────────────
    let fi = 0;
    for (const food of foods) {
      if (!food.alive || fi >= this._foodMesh.instanceMatrix.count) continue;
      dummy.position.set(food.x, h - food.y, 0);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.setScalar(food.radius);
      dummy.updateMatrix();
      this._foodMesh.setMatrixAt(fi, dummy.matrix);
      fi++;
    }
    this._foodMesh.count = fi;
    this._foodMesh.instanceMatrix.needsUpdate = true;

    // ── Creatures ─────────────────────────────────────────────────────
    const alive = creatures.filter(c => c.alive);
    const max   = this._creatureMesh.instanceMatrix.count;
    let ci = 0;

    for (const c of alive) {
      if (ci >= max) break;

      const col = c.color;
      const sy  = h - c.y;   // flip Y into Three.js space

      // Body circle
      dummy.position.set(c.x, sy, 1);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.setScalar(c.radius);
      dummy.updateMatrix();
      this._creatureMesh.setMatrixAt(ci, dummy.matrix);
      color.setHSL(col.h / 360, col.s / 100, col.l / 100);
      this._creatureMesh.setColorAt(ci, color);

      // Direction arrow (angle flipped too since Y is mirrored)
      dummy.position.set(c.x, sy, 2);
      dummy.rotation.set(0, 0, -c.angle + Math.PI / 2);
      dummy.scale.setScalar(c.radius);
      dummy.updateMatrix();
      this._arrowMesh.setMatrixAt(ci, dummy.matrix);
      color.setHSL(col.h / 360, 0.95, 0.88);
      this._arrowMesh.setColorAt(ci, color);

      ci++;
    }

    this._creatureMesh.count = ci;
    this._arrowMesh.count    = ci;
    this._creatureMesh.instanceMatrix.needsUpdate = true;
    this._arrowMesh.instanceMatrix.needsUpdate    = true;
    this._creatureMesh.instanceColor.needsUpdate  = true;
    this._arrowMesh.instanceColor.needsUpdate     = true;
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  _onResize() {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    if (!w || !h || (w === this._w && h === this._h)) return;
    this._w = w; this._h = h;
    this.renderer.setSize(w, h);
    this.camera.left   = 0;
    this.camera.right  = w;
    this.camera.top    = h;
    this.camera.bottom = 0;
    this.camera.updateProjectionMatrix();
    this.world.resize(w, h);
    this._biomeLabelsDirty = true;
  }

  dispose() {
    this._ro.disconnect();
    this.renderer.dispose();
  }
}
