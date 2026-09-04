import * as THREE from 'three';
import { LAYER_BACK } from './world.js';
import { clamp, lerp, smooth, rng } from '../util.js';
import { TILE, fileX, rankZ, SPINE_FILE } from './board.js';

/**
 * The spine is a chess file. Not a metaphor bolted on — the curriculum is
 * literally sequenced, so it gets the one axis a board already has. It fills
 * with light from rank 1 to rank 8 as the story advances, session notches
 * ignite as the fill passes them, and unit plates branch off it.
 */
export class Spine {
  constructor(world, catalog, stages, quality) {
    this.world = world;
    this.z0 = rankZ(1) + TILE * 0.5;
    this.z1 = rankZ(9) + TILE * 0.5;
    this.x = fileX(SPINE_FILE);
    this.fill = 0;

    // ---------------------------------------------------------------- groove
    const len = Math.abs(this.z1 - this.z0);
    const geo = new THREE.PlaneGeometry(TILE * 0.62, len, 1, 1);
    geo.rotateX(-Math.PI / 2);
    this.mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uFill: { value: 0 },
        uHue: { value: new THREE.Color(0x3fa57a) },
        uHead: { value: new THREE.Color(0xffffff) },
        uTime: { value: 0 },
        uDim: { value: 1 },
      },
      vertexShader: /* glsl */`
        varying vec2 vUv;
        void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }
      `,
      fragmentShader: /* glsl */`
        uniform float uFill; uniform vec3 uHue; uniform vec3 uHead;
        uniform float uTime; uniform float uDim;
        varying vec2 vUv;
        void main(){
          // uv.y runs 0 at rank 1 to 1 at rank 9
          float d = uFill - vUv.y;
          float lit = smoothstep(0.0, 0.02, d);
          float body = max(lit, 0.16);
          // the leading edge is a hot, tight line — this is what reads as motion
          float head = exp(-pow(abs(d) * 46.0, 1.7));
          float ax = abs(vUv.x - 0.5) * 2.0;
          float core = smoothstep(0.2, 0.0, ax);
          float halo = smoothstep(1.0, 0.0, ax) * 0.34;
          float edge = core + halo;
          float pulse = 0.86 + 0.14 * sin(uTime * 2.1 - vUv.y * 26.0);
          vec3 c = uHue * (lit * 1.15 * pulse + 0.13) + uHead * head * 1.35;
          gl_FragColor = vec4(c * edge * uDim, edge * (body * 0.42 + head * 0.8));
        }
      `,
    });
    this.groove = new THREE.Mesh(geo, this.mat);
    this.groove.position.set(this.x, 0.05, (this.z0 + this.z1) / 2);
    this.groove.layers.set(LAYER_BACK);
    this.groove.frustumCulled = false;
    world.scene.add(this.groove);

    const stageHue = {
      1: new THREE.Color(0x3fa57a), 2: new THREE.Color(0x4a8bd0),
      3: new THREE.Color(0x9070ce), 4: new THREE.Color(0xd2604b),
      5: new THREE.Color(0xc9a227),
    };

    // -------------------------------------------------- session notches (213)
    const sessions = catalog.sessions;
    this.n = Math.min(sessions.length, quality.ticks);
    const step = sessions.length / this.n;
    this.ticks = [];
    // Flat quads, not boxes: these are seen from above and 3,024 triangles of side
    // walls render as nothing.
    const tg = new THREE.PlaneGeometry(1, 0.075);
    tg.rotateX(-Math.PI / 2);
    this.tickMesh = new THREE.InstancedMesh(
      tg,
      new THREE.MeshBasicMaterial({
        transparent: true, blending: THREE.AdditiveBlending,
        depthWrite: false, toneMapped: false,
      }),
      this.n);
    this.tickMesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(this.n * 3), 3);
    this.tickMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.tickMesh.layers.set(LAYER_BACK);
    this.tickMesh.frustumCulled = false;
    world.scene.add(this.tickMesh);

    for (let i = 0; i < this.n; i++) {
      const s = sessions[Math.min(sessions.length - 1, Math.floor(i * step))];
      const u = i / (this.n - 1);
      this.ticks.push({
        u,
        z: lerp(this.z0, this.z1, u),
        side: s.unit % 2 === 0 ? 1 : -1,
        stage: s.stage,
        gate: s.type === 'assessment' || s.type === 'milestone',
        hue: stageHue[s.stage] || stageHue[1],
        len: s.type === 'assessment' ? 1.9 : s.type === 'review' ? 1.25 : 1,
      });
    }

    // ----------------------------------------------------- unit plates (30)
    const rand = rng(7717);
    this.units = [];
    let acc = 0;
    for (const st of stages.stages) {
      for (const un of st.units) {
        acc += un.sessions;
        this.units.push({
          u: clamp(acc / sessions.length),
          name: un.name,
          stage: st.number,
          side: this.units.length % 2 === 0 ? -1 : 1,
          reach: 5.4 + rand() * 3.4,
          hue: stageHue[st.number] || stageHue[1],
        });
      }
    }
    const sg = new THREE.PlaneGeometry(1, 0.05);
    sg.rotateX(-Math.PI / 2);
    this.stemMesh = new THREE.InstancedMesh(
      sg,
      new THREE.MeshBasicMaterial({
        transparent: true, blending: THREE.AdditiveBlending,
        depthWrite: false, toneMapped: false,
      }),
      this.units.length);
    this.stemMesh.instanceColor = new THREE.InstancedBufferAttribute(
      new Float32Array(this.units.length * 3), 3);
    this.stemMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.stemMesh.layers.set(LAYER_BACK);
    this.stemMesh.frustumCulled = false;
    world.scene.add(this.stemMesh);

    // ------------------------------------------------- rank gates (the checkpoints)
    // Nine bars, one per rank line of the board, evenly spaced because that is the
    // board's own geometry — not one per level, of which there are ten. A bar spans
    // the whole board at each line, so the reader sees gates to pass rather than a
    // bar chart, and the notch gates above carry the real checkpoint sessions.
    this.gates = [];
    const gg2 = new THREE.PlaneGeometry(TILE * 8.02, 0.16);
    gg2.rotateX(-Math.PI / 2);
    this.gateMesh = new THREE.InstancedMesh(
      gg2,
      new THREE.MeshBasicMaterial({
        transparent: true, blending: THREE.AdditiveBlending,
        depthWrite: false, toneMapped: false,
      }),
      9);
    this.gateMesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(27), 3);
    this.gateMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.gateMesh.layers.set(LAYER_BACK);
    this.gateMesh.frustumCulled = false;
    world.scene.add(this.gateMesh);
    for (let r = 1; r <= 9; r++) {
      const z = rankZ(r) - TILE * 0.5;
      this.gates.push({
        r, z,
        u: (Math.abs(z - this.z0)) / Math.abs(this.z1 - this.z0),
        stage: Math.min(5, Math.ceil(r / 2)),
        hue: stageHue[Math.min(5, Math.ceil(r / 2))],
      });
    }

    this._m = new THREE.Matrix4();
    this._v = new THREE.Vector3();
    this._q = new THREE.Quaternion();
    this._s = new THREE.Vector3();
    this._c = new THREE.Color();
    this.visible = 0;
    this._wasVisible = true;
  }

  set hue(color) { this.mat.uniforms.uHue.value.copy(color); }

  update(dt, time) {
    // 213 notches, 30 stems and 9 gates is 252 matrix writes a frame. None of it
    // is visible outside the two acts that use the file.
    if (this.visible <= 0.001) {
      if (this._wasVisible) {
        this.groove.visible = this.tickMesh.visible = this.stemMesh.visible = false;
        this.gateMesh.visible = false;
        this._wasVisible = false;
      }
      return;
    }
    this._wasVisible = true;
    this.mat.uniforms.uFill.value = this.fill;
    this.mat.uniforms.uTime.value = time;
    this.mat.uniforms.uDim.value = this.visible;
    this.groove.visible = this.visible > 0.001;

    const f = this.fill;
    for (let i = 0; i < this.ticks.length; i++) {
      const t = this.ticks[i];
      // a notch ignites as the fill crosses it, then settles to its stage hue
      const passed = clamp((f - t.u) * 42);
      const flash = Math.exp(-Math.pow(Math.abs(f - t.u) * 30, 1.6));
      const trail = Math.exp(-Math.max(0, f - t.u) * 5.5);
      // Barely there until the fill reaches them: 213 pale ticks sitting on lit tiles
      // read as scratches on the board, not as structure. The gate bars carry the
      // structure; the notches are a trail behind the head.
      const on = (0.03 + 0.97 * passed * trail) * this.visible;
      const w = (t.gate ? 2.9 : 1.15) * (0.7 + 0.3 * passed);
      this._v.set(this.x + t.side * (TILE * 0.14 + w * 0.5), 0.055, t.z);
      this._q.identity();
      this._s.set(w, 1, t.gate ? 2.2 : 1);
      this._m.compose(this._v, this._q, this._s);
      this.tickMesh.setMatrixAt(i, this._m);
      if (t.gate) this._c.copy(t.hue).multiplyScalar(on * 1.5 + flash * 1.2 * this.visible);
      else this._c.setRGB(1, 0.97, 0.9).multiplyScalar(on * 0.5 + flash * 0.9 * this.visible);
      this.tickMesh.instanceColor.setXYZ(i, this._c.r, this._c.g, this._c.b);
    }
    this.tickMesh.instanceMatrix.needsUpdate = true;
    this.tickMesh.instanceColor.needsUpdate = true;
    this.tickMesh.visible = this.visible > 0.001;

    for (let i = 0; i < this.units.length; i++) {
      const u = this.units[i];
      const grown = Math.max(0.05, smooth(clamp((f - u.u + 0.02) * 16)));
      const L = u.reach * grown;
      this._v.set(this.x + u.side * (TILE * 0.2 + L / 2), 0.09, lerp(this.z0, this.z1, u.u));
      this._q.identity();
      this._s.set(Math.max(0.001, L), 1, 1);
      this._m.compose(this._v, this._q, this._s);
      this.stemMesh.setMatrixAt(i, this._m);
      this._c.copy(u.hue).multiplyScalar(grown * 0.7 * this.visible);
      this.stemMesh.instanceColor.setXYZ(i, this._c.r, this._c.g, this._c.b);
    }
    this.stemMesh.instanceMatrix.needsUpdate = true;
    this.stemMesh.instanceColor.needsUpdate = true;
    this.stemMesh.visible = this.visible > 0.001;

    for (let i = 0; i < this.gates.length; i++) {
      const g = this.gates[i];
      const passed = clamp((f - g.u) * 26);
      const hit = Math.exp(-Math.pow(Math.abs(f - g.u) * 17, 1.6));
      this._v.set(0, 0.05, g.z);
      this._q.identity();
      this._s.set(1, 1, 1 + hit * 3.4);
      this._m.compose(this._v, this._q, this._s);
      this.gateMesh.setMatrixAt(i, this._m);
      const k = (0.06 + passed * 0.8 + hit * 2.4) * this.visible;
      this._c.copy(g.hue).multiplyScalar(k);
      this.gateMesh.instanceColor.setXYZ(i, this._c.r, this._c.g, this._c.b);
    }
    this.gateMesh.instanceMatrix.needsUpdate = true;
    this.gateMesh.instanceColor.needsUpdate = true;
    this.gateMesh.visible = this.visible > 0.001;
  }

  /** World position on the spine at fill u — the piece rides this. */
  at(u) { return new THREE.Vector3(this.x, 0, lerp(this.z0, this.z1, clamp(u))); }
}
