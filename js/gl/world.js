import * as THREE from 'three';
import { prefersReduced } from '../util.js';

export const LAYER_BACK = 0;
export const LAYER_FRONT = 1;

/**
 * Two scenes, two contexts, one camera transform. `scene` is the room and paints
 * behind the type; `front` is a transparent plate painted on top of it. Moving a
 * piece from one to the other is how it comes THROUGH a headline instead of
 * sitting politely behind it.
 *
 * They have to be separate scenes rather than two layers of one, because a
 * shadow map and a PMREM environment belong to the context that made them: read
 * from the other renderer they resolve to nothing and every object turns black.
 */
export class World {
  constructor(backCanvas, frontCanvas, quality) {
    this.q = quality;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x06060a);
    this.fog = new THREE.FogExp2(0x06060a, 0.019);
    this.scene.fog = this.fog;

    this.front = new THREE.Scene();
    this._frontShown = null;
    this.dustAllowed = true;

    const aspect = innerWidth / innerHeight;
    this.camBack = new THREE.PerspectiveCamera(38, aspect, 0.5, 400);
    this.camFront = new THREE.PerspectiveCamera(38, aspect, 0.5, 400);

    this.rBack = this._renderer(backCanvas, false);
    this.rFront = this._renderer(frontCanvas, true);

    this.scene.add(this.camBack);
    this._light();
    this._dust();
    this._scrim();
    this._env();

    this.resize();
    addEventListener('resize', () => this.resize(), { passive: true });
  }

  _renderer(canvas, alpha) {
    const r = new THREE.WebGLRenderer({
      canvas,
      alpha,
      // MSAA is a context-creation attribute, so this is decided once. Unlike
      // supersampling it does not multiply fragment shading — only coverage and
      // the resolve — which on a scene of large flat surfaces is a good trade for
      // the tile and silhouette edges. `?aa=0` and `?dpr=` override for measuring.
      antialias: this.q.aa,
      powerPreference: 'high-performance',
      stencil: false,
      depth: true,
    });
    r.setPixelRatio(this.q.dpr);
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.toneMappingExposure = 1.24;
    r.outputColorSpace = THREE.SRGBColorSpace;
    if (alpha) { r.setClearColor(0x000000, 0); r.setPixelRatio(Math.min(this.q.dpr, 1)); }
    return r;
  }

  _light() {
    // A single raking key with a long soft shadow does most of the work: it is
    // what makes an ivory piece on a dark board read as an object with weight.
    this.key = new THREE.DirectionalLight(0xfff4e2, 4.6);
    this.key.position.set(-16, 26, 12);
    this.key.layers.enableAll();
    // No shadow map. It is a whole extra scene render plus a PCF tap on every pixel
    // of a board that fills the frame, to ground five pieces that cover 1-2% of it.
    // pieces.js puts a soft contact disc under each one instead.
    this.scene.add(this.key);
    this.keyTarget = new THREE.Object3D();
    this.scene.add(this.keyTarget);
    this.key.target = this.keyTarget;

    this.back = new THREE.DirectionalLight(0x9fc4ff, 1.5);
    this.back.position.set(18, 12, -20);
    this.back.layers.enableAll();
    this.scene.add(this.back);

    // A rim spot used to live here. It was evaluated on every pixel of a board that
    // fills the frame, for a highlight that only ever landed on the 1-2% the pieces
    // occupy. The pieces get their edge from the environment instead.

    this.fill = new THREE.HemisphereLight(0x93a6c8, 0x101018, 1.15);
    this.fill.layers.enableAll();
    this.scene.add(this.fill);

    // The stage-hue lamp. The director drives colour + intensity from scroll,
    // so crossing a stage gate physically relights the room.
    this.hue = new THREE.PointLight(0x3fa57a, 0, 120, 1.7);
    this.scene.add(this.hue);

    // the front plate gets its own, shadowless copy of the same light design
    this.fKey = new THREE.DirectionalLight(0xfff4e2, 4.6);
    this.fKey.position.set(-16, 26, 12);
    this.front.add(this.fKey);
    this.fBack = new THREE.DirectionalLight(0x9fc4ff, 1.6);
    this.fBack.position.set(18, 12, -20);
    this.front.add(this.fBack);
    this.fFill = new THREE.HemisphereLight(0x93a6c8, 0x101018, 1.15);
    this.front.add(this.fFill);
    this.fHue = new THREE.PointLight(0x3fa57a, 0, 120, 1.7);
    this.front.add(this.fHue);
  }

  _env() {
    const c = document.createElement('canvas');
    c.width = 512; c.height = 256;
    const x = c.getContext('2d');
    const g = x.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0.0, '#243044');
    g.addColorStop(0.32, '#12141d');
    g.addColorStop(0.5, '#0a0a11');
    g.addColorStop(1.0, '#050508');
    x.fillStyle = g; x.fillRect(0, 0, 512, 256);
    // two soft sources so clearcoat has something to catch
    const spot = (cx, cy, r, col) => {
      const rg = x.createRadialGradient(cx, cy, 0, cx, cy, r);
      rg.addColorStop(0, col); rg.addColorStop(1, 'rgba(0,0,0,0)');
      x.fillStyle = rg; x.fillRect(0, 0, 512, 256);
    };
    spot(120, 60, 150, 'rgba(255,246,230,0.95)');
    spot(390, 96, 120, 'rgba(150,200,255,0.55)');
    const tex = new THREE.CanvasTexture(c);
    tex.mapping = THREE.EquirectangularReflectionMapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    const pmrem = new THREE.PMREMGenerator(this.rBack);
    this.envDark = pmrem.fromEquirectangular(tex).texture;
    // the front plate needs its own bake, from its own context
    const pmremF = new THREE.PMREMGenerator(this.rFront);
    this.front.environment = pmremF.fromEquirectangular(tex).texture;
    this.front.environmentIntensity = 1.35;

    // the ivory room — used when the page lifts to paper
    const c2 = document.createElement('canvas');
    c2.width = 512; c2.height = 256;
    const y = c2.getContext('2d');
    const g2 = y.createLinearGradient(0, 0, 0, 256);
    g2.addColorStop(0, '#ffffff');
    g2.addColorStop(0.55, '#e8e2d4');
    g2.addColorStop(1, '#b9b2a3');
    y.fillStyle = g2; y.fillRect(0, 0, 512, 256);
    const tex2 = new THREE.CanvasTexture(c2);
    tex2.mapping = THREE.EquirectangularReflectionMapping;
    tex2.colorSpace = THREE.SRGBColorSpace;
    this.envLight = pmrem.fromEquirectangular(tex2).texture;
    this.frontEnvLight = pmremF.fromEquirectangular(tex2).texture;
    this.frontEnvDark = this.front.environment;
    pmrem.dispose();
    pmremF.dispose();

    this.scene.environment = this.envDark;
    this.scene.environmentIntensity = 1.35;
  }

  /**
   * The dust used to be a full-viewport <video> with mix-blend-mode: screen, which
   * costs a separate compositing layer and a blend of every pixel on the screen.
   * As a camera-parented additive quad it is one textured triangle pair inside a
   * pass that was already happening, and the mask moves into the shader.
   */
  _dust() {
    const v = document.getElementById('atmos');
    if (!v) { this.dust = null; return; }
    // Downsample through a small canvas and refresh it every third frame: the
    // dust is a haze, not a subject, and a full-resolution per-frame upload is
    // the single most bandwidth-hungry thing on the page.
    const c = document.createElement('canvas');
    c.width = 384; c.height = 216;
    this.dustCtx = c.getContext('2d', { alpha: false });
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.generateMipmaps = false;
    tex.minFilter = THREE.LinearFilter;
    this.dustTex = tex;
    this.dustCanvas = c;
    this._dustTick = 0;
    // Only the top of the frame ever shows dust (the band mask fades it out below),
    // so the quad only covers the top of the frame. 30% fewer fragments in a pass
    // that is on for three quarters of the scroll.
    const geo = new THREE.PlaneGeometry(2, 1.44);
    geo.translate(0, 0.28, 0);
    this.dustMat = new THREE.ShaderMaterial({
      transparent: true, depthTest: false, depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uMap: { value: tex }, uAmt: { value: 0 } },
      // clip-space: exactly the viewport at any aspect, no frustum arithmetic and
      // nothing rasterised outside the frame
      vertexShader: `varying vec2 vUv; void main(){ vUv = uv;
        gl_Position = vec4(position.xy, 0.0, 1.0); }`,
      fragmentShader: `
        uniform sampler2D uMap; uniform float uAmt; varying vec2 vUv;
        void main(){
          vec2 uv = vUv * vec2(0.62, 0.62) + vec2(0.2, 0.3);
          vec3 c = texture2D(uMap, uv).rgb;
          // The footage has coloured bokeh in it. Desaturated toward its own warm
          // white it reads as dust in a beam; left alone it tints the board pink.
          float l = dot(c, vec3(0.34, 0.5, 0.16));
          c = mix(vec3(l) * vec3(1.0, 0.95, 0.86), c, 0.3);
          float band = smoothstep(0.0, 0.3, vUv.y) * smoothstep(1.0, 0.62, vUv.y);
          gl_FragColor = vec4(c * band * uAmt, 1.0);
        }`,
    });
    this.dust = new THREE.Mesh(geo, this.dustMat);
    this.dust.renderOrder = 998;
    this.dust.frustumCulled = false;
    this.dust.visible = false;
    this.scene.add(this.dust);
    this.dustVideo = v;
    // A reader who asked for no motion gets the haze as a still frame rather than not at
    // all: the scene's composition depends on the dust being there. Read once at build,
    // not per frame, because matchMedia in the render loop is a needless cost.
    this.dustStill = prefersReduced();
    this._dustSampled = false;
    // Under this preference nothing ever calls play(), so nothing forces the decode. On
    // Chromium `preload="auto"` reaches readyState 4 in under a second and setDust's own
    // call is enough - but a browser or data mode that defers media until playback would
    // leave the latch waiting and the reader with no haze at all, which is the one outcome
    // this item forbids. `loadeddata` is the event that says a frame exists.
    if (this.dustStill) {
      v.addEventListener('loadeddata', () => this._sampleDust(), { once: true });
      this._sampleDust();
    }
  }

  /** One frame of the atmosphere into the dust canvas. Idempotent: the latch is the point. */
  _sampleDust() {
    if (this._dustSampled || !this.dustVideo || this.dustVideo.readyState < 2) return;
    this.dustCtx.drawImage(this.dustVideo, 0, 0, 384, 216);
    this.dustTex.needsUpdate = true;
    this._dustSampled = true;
  }

  /**
   * The legibility wash used to be a fixed full-viewport DOM gradient, and the
   * grain a second one. Two more compositor layers the size of the screen, blended
   * every frame, on a machine with shared graphics memory. As a camera-parented
   * quad drawn last in the pass that was already running, both cost one quad and
   * the layer tree loses two full-viewport surfaces.
   */
  _scrim() {
    const geo = new THREE.PlaneGeometry(2, 2);
    this.scrimMat = new THREE.ShaderMaterial({
      transparent: true, depthTest: false, depthWrite: false,
      uniforms: {
        uAmt: { value: 1 },
        uLift: { value: 0 },
        uDark: { value: new THREE.Color(0x030306) },
        uPaper: { value: new THREE.Color(0xf8f5ed) },
        uGrain: { value: 0.035 },
      },
      vertexShader: `varying vec2 vUv; void main(){ vUv = uv;
        gl_Position = vec4(position.xy, 0.0, 1.0); }`,
      fragmentShader: /* glsl */`
        uniform float uAmt; uniform float uLift; uniform vec3 uDark; uniform vec3 uPaper;
        uniform float uGrain;
        varying vec2 vUv;
        float hash(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453); }
        void main(){
          // the copy side, angled the same way the CSS gradient was
          vec2 q = vec2(vUv.x, 1.0 - vUv.y);
          float diag = clamp(q.x * 0.94 + (1.0 - q.y) * 0.18, 0.0, 1.0);
          float side = 1.0 - smoothstep(0.0, 0.62, diag);
          side = mix(side * 0.9, side * 0.94, uLift) + 0.16 * (1.0 - smoothstep(0.0, 0.26, diag));
          // and a band top and bottom so the chrome always has something to sit on
          float top = 1.0 - smoothstep(0.0, 0.18, q.y);
          float bot = smoothstep(0.62, 1.0, q.y);
          float a = clamp(max(side, max(top * 0.74, bot * 0.8)), 0.0, 1.0) * uAmt;
          vec3 c = mix(uDark, uPaper, uLift);
          float g = (hash(floor(gl_FragCoord.xy * 0.5)) - 0.5) * uGrain;
          gl_FragColor = vec4(c + g, a);
        }`,
    });
    this.scrim = new THREE.Mesh(geo, this.scrimMat);
    this.scrim.renderOrder = 999;
    this.scrim.frustumCulled = false;
    this.scene.add(this.scrim);
  }

  setScrim(amount, lift) {
    if (!this.scrimMat) return;
    this.scrimMat.uniforms.uAmt.value = amount;
    this.scrimMat.uniforms.uLift.value = lift;
    this.scrimMat.uniforms.uGrain.value = 0.035 - lift * 0.022;
  }

  setDust(amount) {
    if (!this.dust) return;
    const on = amount > 0.015 && this.dustAllowed !== false;
    this.dust.visible = on;
    this.dustMat.uniforms.uAmt.value = amount * 0.95;
    // Reduced motion: the haze stops drifting but stays in the frame. One sample into the
    // canvas is what makes it a still image instead of an additive-black quad, i.e. absent;
    // after that the video stays paused and the per-frame upload never happens. The amount
    // still tracks the act, which is a scroll-driven reveal like every other one on the
    // page and not something the preference asks us to freeze.
    if (this.dustStill) {
      this._sampleDust();
      if (!this.dustVideo.paused) this.dustVideo.pause();
      return;
    }
    // Play/pause churn on a 1080p video is a ~100ms stall, and the dust window
    // opens and closes four times across the scroll. Hysteresis: stop only after
    // it has been unwanted for a while, so crossing a gap does not restart it.
    if (!on) {
      this._dustIdle = (this._dustIdle || 0) + 1;
      if (this._dustIdle > 120 && !this.dustVideo.paused) this.dustVideo.pause();
      return;
    }
    this._dustIdle = 0;
    if (this.dustVideo.paused) this.dustVideo.play().catch(() => {});
    if ((this._dustTick++ % 3) === 0 && this.dustVideo.readyState >= 2) {
      this.dustCtx.drawImage(this.dustVideo, 0, 0, 384, 216);
      this.dustTex.needsUpdate = true;
    }
  }

  /**
   * Every material variant compiles on first draw, and on Intel that is a
   * several-hundred-millisecond stall. Ours were landing mid-scroll, as each
   * piece first appeared. Warming both renderers at boot turns all of it into
   * one cost before the reader has scrolled a pixel.
   */
  async warm(extra = []) {
    // renderer.compile walks traverseVisible, so an invisible PARENT hides its
    // meshes from the warm-up entirely. Every piece lives under a hidden group,
    // which is why six shader compiles were still landing mid-scroll as ~1s
    // frames. Force the whole graph visible, compile, then put it back.
    const hidden = [];
    for (const root of [this.scene, this.front]) {
      root.traverse((o) => { if (!o.visible) { o.visible = true; hidden.push(o); } });
    }
    const compile = (r, sc, cam) => {
      try { r.compile(sc, cam); } catch { /* nothing useful to do */ }
    };
    compile(this.rBack, this.scene, this.camBack);
    // The front plate is empty at boot, so nothing compiles for it and the first
    // piece to land on it stalls. Park every piece there once — the same material
    // needs a second program without fog for this scene.
    const homes = extra.map((o) => o.parent);
    for (const o of extra) { this.front.add(o); o.visible = true; }
    compile(this.rFront, this.front, this.camFront);
    // and one real frame of each, because a compile can report ready before the
    // driver has actually linked
    this.rBack.render(this.scene, this.camBack);
    this.rFront.render(this.front, this.camFront);
    extra.forEach((o, i) => { if (homes[i]) homes[i].add(o); });
    for (const o of hidden) o.visible = false;
    for (const o of extra) o.visible = false;
    this.rFront.clear();
    this._frontShown = null;
    return {
      back: this.rBack.info.programs.length,
      front: this.rFront.info.programs.length,
    };
  }

  /** Runtime pixel-ratio change. Both renderers need a resize to take it. */
  setDpr(v) {
    this.q.dpr = v;
    this.resize();
  }

  /**
   * A pixel-ratio ceiling is the wrong unit: 1.25 on a 1440-wide window is 2.0 Mpx
   * and on a 1920-wide window it is 3.2 Mpx, and this scene is fill-bound, so the
   * same setting was 60 fps on one and 41 on the other. Budget the pixels instead
   * and let the ratio fall out of the window size.
   */
  setBudget(px) {
    this.q.budget = px;
    if (this.q.dprLocked) { this.resize(); return; }
    const area = Math.max(1, innerWidth * innerHeight);
    const dpr = Math.sqrt(px / area);
    this.setDpr(Math.max(0.6, Math.min(devicePixelRatio || 1, dpr)));
  }

  resize() {
    const w = innerWidth, h = innerHeight;
    const a = w / h;
    this.camBack.aspect = a; this.camBack.updateProjectionMatrix();
    this.camFront.aspect = a; this.camFront.updateProjectionMatrix();
    this.rBack.setSize(w, h, false);
    this.rFront.setSize(w, h, false);
    this.rBack.setPixelRatio(this.q.dpr);
    this.rFront.setPixelRatio(Math.min(this.q.dpr, 1));
  }

  /** Front camera mirrors the back camera exactly — one rig, two views. */
  sync() {
    this.camFront.position.copy(this.camBack.position);
    this.camFront.quaternion.copy(this.camBack.quaternion);
    this.camFront.fov = this.camBack.fov;
    const v = this.camBack.view;
    if (v && v.enabled) {
      this.camFront.setViewOffset(v.fullWidth, v.fullHeight, v.offsetX, v.offsetY, v.width, v.height);
    } else if (this.camFront.view && this.camFront.view.enabled) {
      this.camFront.clearViewOffset();
    }
    this.camFront.updateProjectionMatrix();
  }

  render() {
    this.sync();
    this.rBack.render(this.scene, this.camBack);
    // The front plate is empty for most of the page. A full-viewport clear and
    // draw at device resolution is not free, so skip the whole pass when there is
    // nothing on it — and clear once on the way out so the last frame does not
    // stay burned into the canvas.
    let occupied = false;
    for (const c of this.front.children) {
      if (c.isLight) continue;
      if (c.visible) { occupied = true; break; }
    }
    if (occupied) {
      if (this._frontShown !== true) {
        this.rFront.domElement.style.visibility = 'visible';
        this._frontShown = true;
      }
      this.rFront.render(this.front, this.camFront);
    } else if (this._frontShown !== false) {
      // One clear on the way out, then out of the layer tree entirely: an unused
      // full-viewport canvas is still a compositor surface the size of the screen,
      // and it is unused for about four fifths of the scroll.
      this.rFront.clear();
      this.rFront.domElement.style.visibility = 'hidden';
      this._frontShown = false;
    }
  }
}

/** Picks a quality tier up front, then downgrades if frames get expensive. */
export function detectQuality() {
  const qs = new URLSearchParams(location.search);
  const mem = navigator.deviceMemory || 8;
  const cores = navigator.hardwareConcurrency || 8;
  const touch = matchMedia('(hover: none) and (pointer: coarse)').matches;
  const small = innerWidth < 820;
  const weak = touch || small || cores <= 4 || mem <= 4;
  const aa = qs.has('aa') ? qs.get('aa') !== '0' : true;
  const dprOverride = qs.has('dpr') ? Number(qs.get('dpr')) : null;
  return {
    tier: weak ? 'low' : 'high',
    aa,
    // Measured on an Iris Xe with 4x MSAA on: ~2.3 Mpx of back buffer holds 60 fps,
    // 3.2 Mpx drops to ~41. MSAA itself is close to free here — it supersamples
    // coverage, not shading — and it is what keeps the tile edges and the piece
    // silhouettes from stair-stepping, so the budget goes on resolution instead.
    budget: weak ? 1500000 : 2300000,
    dpr: dprOverride || 1,
    dprLocked: !!dprOverride,


    tiles: weak ? 8 : 8,
    debris: weak ? 34 : 88,
    ticks: weak ? 90 : 213,
  };
}
