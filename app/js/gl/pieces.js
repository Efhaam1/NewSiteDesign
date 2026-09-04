import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { LAYER_BACK, LAYER_FRONT } from './world.js';
import { clamp, lerp, smooth } from '../util.js';

const ORDER = ['pawn', 'knight', 'bishop', 'rook', 'queen'];

/**
 * A real shadow map is an extra scene render plus a PCF tap on every pixel of a
 * board that fills most of the screen. For a handful of pieces standing on a flat
 * surface, a soft dark disc under each one buys the same grounding for one quad.
 */
let contactTex = null;
function contactShadow() {
  if (!contactTex) {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const x = c.getContext('2d');
    const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0.0, 'rgba(0,0,0,0.82)');
    g.addColorStop(0.45, 'rgba(0,0,0,0.4)');
    g.addColorStop(1.0, 'rgba(0,0,0,0)');
    x.fillStyle = g;
    x.fillRect(0, 0, 128, 128);
    contactTex = new THREE.CanvasTexture(c);
    contactTex.colorSpace = THREE.SRGBColorSpace;
  }
  const geo = new THREE.PlaneGeometry(1, 1);
  geo.rotateX(-Math.PI / 2);
  const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
    map: contactTex, transparent: true, depthWrite: false, opacity: 0.9,
    toneMapped: false,
  }));
  m.position.y = 0.02;
  m.renderOrder = 2;
  return m;
}

/** Ivory, lacquered, slightly waxy — a tournament set under a raking light. */
function ivory() {
  const m = new THREE.MeshPhysicalMaterial({
    color: 0xf6efe1, roughness: 0.31, metalness: 0.0,
    clearcoat: 0.85, clearcoatRoughness: 0.22,
    envMapIntensity: 1.5,
  });
  patchDissolve(m);
  return m;
}

/**
 * Promotion has to feel like a change of state, not a crossfade. The piece
 * dissolves along its own height with a hot threshold edge, so the old form
 * burns off upward while the new one condenses downward out of the light.
 */
function patchDissolve(mat) {
  mat.userData.u = {
    uReveal: { value: 1 },
    uDir: { value: 1 },       // +1 assemble downward, -1 burn upward
    uEdge: { value: new THREE.Color(0xffe9b8) },
    uY0: { value: 0 },
    uY1: { value: 1 },
  };
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, mat.userData.u);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>\n varying vec3 vLocal;`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>\n vLocal = position;`);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', /* glsl */`#include <common>
        varying vec3 vLocal;
        uniform float uReveal; uniform float uDir; uniform vec3 uEdge;
        uniform float uY0; uniform float uY1;
        float hash31(vec3 p){ p = fract(p * 0.3183099 + vec3(0.71,0.113,0.419));
          p *= 17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
      `)
      .replace('#include <clipping_planes_fragment>', /* glsl */`
        #include <clipping_planes_fragment>
        float h = clamp((vLocal.y - uY0) / max(0.0001, uY1 - uY0), 0.0, 1.0);
        float n = hash31(floor(vLocal * 42.0));
        float field = mix(h, 1.0 - h, step(0.0, -uDir)) * 0.82 + n * 0.18;
        float thr = 1.0 - uReveal;
        if (field < thr) discard;
        float edge = 1.0 - smoothstep(0.0, 0.085, field - thr);
      `)
      .replace('#include <dithering_fragment>', /* glsl */`
        #include <dithering_fragment>
        gl_FragColor.rgb += uEdge * edge * 2.6 * (1.0 - step(0.999, uReveal));
      `);
  };
  mat.customProgramCacheKey = () => 'dissolve';
}

export class Pieces {
  constructor(world) {
    this.world = world;
    this.byName = {};
    this.ready = false;
  }

  async load(height = 3.9) {
    const loader = new GLTFLoader();
    // The king is the brand mark, not a stage. Loading it cost 45,000 triangles,
    // a normals rebuild over 22,502 verts and a scene node that is never revealed.
    const names = ORDER;
    const loaded = await Promise.all(
      names.map((n) =>
        loader.loadAsync(`/assets/pieces/${n}.glb`).then((g) => [n, g]).catch(() => [n, null])),
    );
    for (const [name, gltf] of loaded) {
      if (!gltf) continue;
      const root = new THREE.Group();
      const src = gltf.scene;
      // normalise whatever came out of the exporter: sit on y=0, centre on xz,
      // uniform height, so every piece is interchangeable on a square.
      const box = new THREE.Box3().setFromObject(src);
      const size = new THREE.Vector3(); box.getSize(size);
      const centre = new THREE.Vector3(); box.getCenter(centre);
      const k = height / Math.max(0.0001, size.y);
      const mat = ivory();
      src.traverse((o) => {
        if (o.isMesh) {
          // These GLBs ship position-only (the upstream pipeline decimated them
          // and dropped normals), which makes every lit material render pure
          // black. Rebuild smooth normals — a chess piece is a lathed solid, so
          // averaged vertex normals are the right shading for it.
          if (!o.geometry.attributes.normal) o.geometry.computeVertexNormals();
          o.material = mat;
          o.layers.set(LAYER_BACK);
        }
      });
      src.scale.setScalar(k);
      src.position.set(-centre.x * k, -box.min.y * k, -centre.z * k);
      root.add(src);
      const shade = contactShadow();
      shade.scale.setScalar(Math.max(size.x, size.z) * k * 1.9);
      root.add(shade);
      root.userData = { mat, height: height, shade };
      mat.userData.u.uY0.value = 0;
      mat.userData.u.uY1.value = height / k; // local space height
      this.byName[name] = root;
      this.world.scene.add(root);
      root.visible = false;
    }
    this.ready = true;
    return this;
  }

  get(name) { return this.byName[name]; }

  /** reveal: 1 fully present, 0 gone. dir: +1 condensing in, -1 burning off. */
  setReveal(name, reveal, dir = 1) {
    const o = this.byName[name];
    if (!o) return;
    const r = clamp(reveal);
    o.visible = r > 0.002;
    if (o.userData.shade) o.userData.shade.material.opacity = 0.9 * r * r;
    o.userData.mat.userData.u.uReveal.value = r;
    o.userData.mat.userData.u.uDir.value = dir;
  }

  /** Re-parent a piece between the room and the transparent front plate. */
  setPlate(name, front) {
    const o = this.byName[name];
    if (!o) return;
    const target = front ? this.world.front : this.world.scene;
    if (o.parent !== target) target.add(o);
  }

  place(name, x, y, z, rotY = 0, scale = 1) {
    const o = this.byName[name];
    if (!o) return;
    o.position.set(x, y, z);
    o.rotation.y = rotY;
    o.scale.setScalar(scale);
  }

  setEdge(name, color) {
    const o = this.byName[name];
    if (o) o.userData.mat.userData.u.uEdge.value.copy(color);
  }
}

export { ORDER, LAYER_FRONT };
