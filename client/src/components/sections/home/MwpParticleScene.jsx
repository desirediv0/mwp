"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

// WebGL stage for MwpParticleHero (light studio stage). Every bottle photo is sampled into a cloud of coloured
// particles; switching formulas swirls the cloud from one bottle into the next. Once a bottle
// has assembled, the sharp photo fades in on top, and scrolling away blows the whole bottle upward.

const CAMERA_Z = 12;
const CAMERA_FOV = 30;
const BOTTLE_ASPECT = 0.425; // width / height of the opaque area in every cutout
const BOTTLE_CURVE = 0.55; // how deep the label wraps back (1 = true half-cylinder)
const BOTTLE_FILL = 0.94; // share of the anchor height the bottle occupies
const BOTTLE_LIFT = 0.03; // matches the transparent margin under the DOM fallback image
const MORPH_SECONDS = 1.8;
const INTRO_SECONDS = 2.6;

const clamp01 = value => Math.min(1, Math.max(0, value));

/* ── Shaders ───────────────────────────────────────────── */

const particleVertex = /* glsl */ `
  attribute vec3 aTo;
  attribute vec3 aColorFrom;
  attribute vec3 aColorTo;
  attribute vec4 aSeed;
  uniform float uProgress;
  uniform float uTime;
  uniform float uSize;
  uniform float uVisible;
  uniform float uScroll;
  uniform vec3 uGlow;
  uniform float uSpread;
  varying vec3 vColor;
  varying float vAlpha;

  vec3 rotateY(vec3 p, float a) {
    float c = cos(a);
    float s = sin(a);
    return vec3(c * p.x + s * p.z, p.y, -s * p.x + c * p.z);
  }

  void main() {
    // Staggered morph: each particle leaves on its own delay and arcs out around the bottle axis.
    float t = clamp((uProgress - aSeed.x * 0.45) / 0.55, 0.0, 1.0);
    float eased = t * t * (3.0 - 2.0 * t);
    float flight = sin(t * 3.14159265);
    vec3 p = mix(position, aTo, eased);
    // Swirl outward by a fixed amount (not a multiple of the radius) so wide clouds stay on stage.
    vec3 axis = vec3(0.0, p.y, 0.0);
    vec3 radial = rotateY(p - axis, flight * (2.4 + aSeed.y * 2.2));
    float radialLength = length(radial.xz);
    vec2 direction = radialLength > 0.0001 ? radial.xz / radialLength : vec2(cos(aSeed.z * 6.2832), sin(aSeed.z * 6.2832));
    radial.xz = direction * (radialLength + flight * (0.06 + aSeed.y * 0.22) * uSpread);
    p = axis + radial;
    p += vec3(sin(aSeed.z * 6.2832), (aSeed.w - 0.5) * 0.6, cos(aSeed.z * 6.2832)) * flight * (0.06 + aSeed.y * 0.12) * uSpread;

    // Scrolling away blows the bottle upward in a widening spiral.
    float blow = smoothstep(aSeed.x * 0.45, 1.0, uScroll);
    vec3 blown = rotateY(p, blow * (1.4 + aSeed.y * 2.4));
    blown.xz *= 1.0 + blow * (1.2 + aSeed.y * 3.2);
    blown.y += blow * (0.35 + aSeed.w * 1.5);
    p = mix(p, blown, blow);

    p.xy += vec2(sin(uTime * 1.3 + aSeed.z * 40.0), cos(uTime * 1.1 + aSeed.w * 30.0)) * 0.0016;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * (0.7 + aSeed.w * 0.6) * (1.0 + flight * 0.7 + blow * 0.5) * (${CAMERA_Z.toFixed(1)} / -mv.z);

    vec3 color = mix(aColorFrom, aColorTo, eased);
    vColor = mix(color, uGlow, clamp(flight * 0.7 + blow * 0.6, 0.0, 0.85));
    // Once scrolling starts the whole cloud shows, then thins out as it drifts away.
    float scrolling = smoothstep(0.005, 0.06, uScroll) * (1.0 - smoothstep(0.55, 1.0, blow));
    vAlpha = max(uVisible, scrolling);
  }
`;

const particleFragment = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float alpha = smoothstep(0.5, 0.22, d) * vAlpha;
    if (alpha < 0.02) discard;
    gl_FragColor = vec4(vColor, alpha);
    #include <colorspace_fragment>
  }
`;

const crispVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// The sharp photo; it fades out as scrolling blows the particles away.
const crispFragment = /* glsl */ `
  uniform sampler2D uMap;
  uniform vec4 uRect;
  uniform float uOpacity;
  uniform float uScroll;
  varying vec2 vUv;
  void main() {
    vec4 color = texture2D(uMap, uRect.xy + vUv * uRect.zw);
    color.a *= uOpacity * (1.0 - smoothstep(0.03, 0.2, uScroll));
    if (color.a < 0.004) discard;
    gl_FragColor = color;
    #include <colorspace_fragment>
  }
`;

const auraVertex = /* glsl */ `
  attribute vec3 aOrbit;
  attribute vec2 aSeed;
  uniform float uTime;
  uniform float uScroll;
  uniform float uSize;
  varying float vAlpha;
  void main() {
    float angle = aOrbit.y + uTime * (0.12 + aSeed.x * 0.22);
    float life = fract(aOrbit.z + uTime * (0.025 + aSeed.y * 0.04) + uScroll * 0.5);
    float radius = aOrbit.x * (1.0 + uScroll * 1.6);
    vec3 p = vec3(cos(angle) * radius, life * 1.35 - 0.1, sin(angle) * radius * 0.75);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * (0.4 + aSeed.y) * (${CAMERA_Z.toFixed(1)} / -mv.z);
    vAlpha = sin(life * 3.14159265) * (0.3 + aSeed.x * 0.7);
  }
`;

const auraFragment = /* glsl */ `
  uniform vec3 uGlow;
  uniform float uOpacity;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float alpha = smoothstep(0.5, 0.0, d) * vAlpha * uOpacity;
    if (alpha < 0.01) discard;
    gl_FragColor = vec4(uGlow, alpha);
    #include <colorspace_fragment>
  }
`;

const basicVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const poolFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying vec2 vUv;
  void main() {
    float d = length(vUv - 0.5) * 2.0;
    float alpha = pow(1.0 - smoothstep(0.0, 1.0, d), 1.8) * uOpacity;
    if (alpha < 0.003) discard;
    gl_FragColor = vec4(uColor, alpha);
    #include <colorspace_fragment>
  }
`;

/* ── Geometry + sampling ───────────────────────────────── */

// A label-shaped strip bent into an elliptical half-cylinder. U stays linear in x so the photo
// is undistorted head-on and the particles sampled from it land on the same surface.
function createBottleGeometry(segments = 56) {
  const radius = BOTTLE_ASPECT / 2;
  const positions = [];
  const normals = [];
  const uvs = [];
  const indices = [];
  for (let j = 0; j <= segments; j++) {
    const phi = -Math.PI / 2 + (Math.PI * j) / segments;
    const x = radius * Math.sin(phi);
    const z = radius * Math.cos(phi) * BOTTLE_CURVE;
    const nx = Math.sin(phi) * BOTTLE_CURVE;
    const nz = Math.cos(phi);
    const length = Math.hypot(nx, nz);
    for (const y of [0, 1]) {
      positions.push(x, y, z);
      normals.push(nx / length, 0, nz / length);
      uvs.push((Math.sin(phi) + 1) / 2, y);
    }
  }
  for (let j = 0; j < segments; j++) {
    const a = j * 2;
    indices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setIndex(indices);
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  return geometry;
}

function surfaceDepth(x) {
  const t = Math.min(1, Math.abs(x) / (BOTTLE_ASPECT / 2));
  return Math.sqrt(1 - t * t) * (BOTTLE_ASPECT / 2) * BOTTLE_CURVE;
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Could not load ${src}`));
    image.src = src;
  });
}

// Samples `count` particles (position on the curved card + sRGB colour) from a cutout's opaque pixels.
async function loadFormula(key, count, renderer) {
  const image = await loadImage(`/products/cutouts/${key}.webp`);
  const width = Math.max(1, Math.round(image.naturalWidth / 2));
  const height = Math.max(1, Math.round(image.naturalHeight / 2));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  context.drawImage(image, 0, 0, width, height);
  const { data } = context.getImageData(0, 0, width, height);

  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  const solid = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const alpha = data[(y * width + x) * 4 + 3];
      if (alpha > 24) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
      if (alpha > 160) solid.push(y * width + x);
    }
  }
  if (maxX < 0 || !solid.length) throw new Error(`${key} has no opaque pixels`);

  const spanX = maxX + 1 - minX;
  const spanY = maxY + 1 - minY;
  const rect = new THREE.Vector4(minX / width, 1 - (maxY + 1) / height, spanX / width, spanY / height);
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const color = new THREE.Color();
  for (let i = 0; i < count; i++) {
    const index = solid[(Math.random() * solid.length) | 0];
    const px = index % width;
    const py = (index / width) | 0;
    const x = ((px + Math.random() - minX) / spanX - 0.5) * BOTTLE_ASPECT;
    const y = 1 - (py + Math.random() - minY) / spanY;
    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = surfaceDepth(x) + 0.002;
    const offset = index * 4;
    color.setRGB(data[offset] / 255, data[offset + 1] / 255, data[offset + 2] / 255, THREE.SRGBColorSpace);
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }

  const texture = new THREE.Texture(image);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  texture.needsUpdate = true;
  renderer.initTexture(texture);
  return { texture, rect, positions, colors };
}

// Loose spiral cloud the very first bottle assembles out of.
function createCloud(count, glowHex) {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const glow = new THREE.Color(glowHex);
  const white = new THREE.Color(0xffffff);
  const color = new THREE.Color();
  for (let i = 0; i < count; i++) {
    const radius = 0.2 + Math.pow(Math.random(), 0.8) * 0.42;
    const angle = Math.random() * Math.PI * 2 + radius * 3;
    positions[i * 3] = Math.cos(angle) * radius;
    positions[i * 3 + 1] = -0.15 + Math.random() * 1.35;
    positions[i * 3 + 2] = Math.sin(angle) * radius * 0.6;
    color.copy(glow).lerp(white, Math.random() * 0.2);
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }
  return { positions, colors };
}

/* ── Layout ────────────────────────────────────────────── */

// Converts the DOM anchor's box into world units on the z = 0 plane.
function useAnchorLayout(anchorRef) {
  const { gl, size, invalidate } = useThree();
  const layout = useRef({ ready: false, x: 0, base: 0, h: 1, viewW: 1, viewH: 1, unitPx: 1 });

  useEffect(() => {
    const canvas = gl.domElement;
    const measure = () => {
      const anchor = anchorRef.current;
      if (!anchor) return;
      const canvasRect = canvas.getBoundingClientRect();
      const rect = anchor.getBoundingClientRect();
      if (!canvasRect.height || !rect.height) return;
      const viewH = 2 * CAMERA_Z * Math.tan(THREE.MathUtils.degToRad(CAMERA_FOV / 2));
      const unitPx = canvasRect.height / viewH;
      layout.current = {
        ready: true,
        x: (rect.left + rect.width / 2 - canvasRect.left - canvasRect.width / 2) / unitPx,
        base: (canvasRect.height / 2 - (rect.bottom - canvasRect.top)) / unitPx,
        h: rect.height / unitPx,
        viewW: canvasRect.width / unitPx,
        viewH,
        unitPx,
      };
      invalidate();
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(canvas);
    if (anchorRef.current) observer.observe(anchorRef.current);
    document.fonts?.ready.then(measure).catch(() => {});
    // Font swaps and late images can move the anchor without resizing it.
    const timer = window.setInterval(measure, 1000);
    return () => {
      observer.disconnect();
      window.clearInterval(timer);
    };
  }, [anchorRef, gl, invalidate, size.width, size.height]);

  return layout;
}

/* ── World ─────────────────────────────────────────────── */

function ParticleWorld({ formulas, activeIndex, anchorRef, pointerRef, scrollProgress, motionOn, reduceMotion, lite, onReady }) {
  const { gl, invalidate } = useThree();
  const layout = useAnchorLayout(anchorRef);
  const count = lite ? 7000 : 16000;
  const glow = useRef(new THREE.Color(formulas[activeIndex].glow));
  const glowTarget = useRef(new THREE.Color(formulas[activeIndex].glow));

  const world = useMemo(() => {
    const seeds = new Float32Array(count * 4);
    for (let i = 0; i < seeds.length; i++) seeds[i] = Math.random();
    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    particleGeometry.setAttribute("aTo", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    particleGeometry.setAttribute("aColorFrom", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    particleGeometry.setAttribute("aColorTo", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    particleGeometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 4));
    const particleMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uProgress: { value: 1 },
        uTime: { value: 0 },
        uSize: { value: 3 },
        uVisible: { value: 0 },
        uScroll: { value: 0 },
        uGlow: { value: glow.current },
        // Narrow screens get a tighter swirl so the morph stays inside the viewport.
        uSpread: { value: lite ? 0.55 : 1 },
      },
      vertexShader: particleVertex,
      fragmentShader: particleFragment,
      transparent: true,
      depthWrite: false,
    });
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    particles.frustumCulled = false;
    particles.renderOrder = 2;

    const crispGeometry = createBottleGeometry();
    const crispMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uMap: { value: null },
        uRect: { value: new THREE.Vector4(0, 0, 1, 1) },
        uOpacity: { value: 0 },
        uScroll: particleMaterial.uniforms.uScroll,
      },
      vertexShader: crispVertex,
      fragmentShader: crispFragment,
      transparent: true,
    });
    const crisp = new THREE.Mesh(crispGeometry, crispMaterial);
    crisp.renderOrder = 1;
    crisp.visible = false;

    const bottleGroup = new THREE.Group();
    bottleGroup.add(crisp, particles);

    const auraCount = lite ? 220 : 520;
    const orbit = new Float32Array(auraCount * 3);
    const auraSeeds = new Float32Array(auraCount * 2);
    for (let i = 0; i < auraCount; i++) {
      orbit[i * 3] = 0.24 + Math.pow(Math.random(), 0.6) * 0.75;
      orbit[i * 3 + 1] = Math.random() * Math.PI * 2;
      orbit[i * 3 + 2] = Math.random();
      auraSeeds[i * 2] = Math.random();
      auraSeeds[i * 2 + 1] = Math.random();
    }
    const auraGeometry = new THREE.BufferGeometry();
    auraGeometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(auraCount * 3), 3));
    auraGeometry.setAttribute("aOrbit", new THREE.BufferAttribute(orbit, 3));
    auraGeometry.setAttribute("aSeed", new THREE.BufferAttribute(auraSeeds, 2));
    const auraMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uScroll: particleMaterial.uniforms.uScroll,
        uSize: { value: 4 },
        uGlow: { value: glow.current },
        uOpacity: { value: 0 },
      },
      vertexShader: auraVertex,
      fragmentShader: auraFragment,
      transparent: true,
      depthWrite: false,
    });
    const aura = new THREE.Points(auraGeometry, auraMaterial);
    aura.frustumCulled = false;
    aura.renderOrder = 3;

    const discGeometry = new THREE.CircleGeometry(1, 64);
    const poolMaterial = new THREE.ShaderMaterial({
      uniforms: { uColor: { value: glow.current }, uOpacity: { value: 0 } },
      vertexShader: basicVertex,
      fragmentShader: poolFragment,
      transparent: true,
      depthWrite: false,
    });
    const pool = new THREE.Mesh(discGeometry, poolMaterial);
    pool.scale.setScalar(0.62);
    // Contact shadow so the bottle sits on the pale floor instead of floating.
    const shadowMaterial = new THREE.ShaderMaterial({
      uniforms: { uColor: { value: new THREE.Color("#2a2015") }, uOpacity: { value: 0 } },
      vertexShader: basicVertex,
      fragmentShader: poolFragment,
      transparent: true,
      depthWrite: false,
    });
    const shadow = new THREE.Mesh(discGeometry, shadowMaterial);
    shadow.scale.setScalar(0.27);
    shadow.position.z = 0.002;
    const shockGeometry = new THREE.RingGeometry(0.99, 1, 160);
    const shockMaterial = new THREE.MeshBasicMaterial({
      color: glow.current.clone(),
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    const shock = new THREE.Mesh(shockGeometry, shockMaterial);
    shock.position.z = 0.001;
    const floor = new THREE.Group();
    floor.add(pool, shadow, shock);

    return {
      particles,
      particleGeometry,
      particleMaterial,
      crisp,
      crispMaterial,
      bottleGroup,
      aura,
      auraMaterial,
      floor,
      poolMaterial,
      shadowMaterial,
      shock,
      shockMaterial,
      dispose() {
        particleGeometry.dispose();
        particleMaterial.dispose();
        crispGeometry.dispose();
        crispMaterial.dispose();
        auraGeometry.dispose();
        auraMaterial.dispose();
        discGeometry.dispose();
        poolMaterial.dispose();
        shadowMaterial.dispose();
        shockGeometry.dispose();
        shockMaterial.dispose();
      },
    };
  }, [count, lite]);

  useEffect(() => () => world.dispose(), [world]);

  /* Formula data + morph queue */
  const formulaData = useRef(new Map());
  const morph = useRef({ running: false, progress: 1, duration: MORPH_SECONDS, current: null, queued: null, swapped: true, pending: null, shock: 0 });
  const announced = useRef(false);

  useEffect(() => {
    const cache = formulaData.current;
    return () => {
      cache.forEach(promise => promise.then(({ texture }) => texture.dispose()).catch(() => {}));
      cache.clear();
    };
  }, []);

  useEffect(() => {
    const cache = formulaData.current;
    const load = key => {
      if (!cache.has(key)) cache.set(key, loadFormula(key, count, gl));
      return cache.get(key);
    };
    const attributes = world.particleGeometry.attributes;
    const state = morph.current;

    const showInstantly = entry => {
      attributes.position.array.set(entry.positions);
      attributes.aTo.array.set(entry.positions);
      attributes.aColorFrom.array.set(entry.colors);
      attributes.aColorTo.array.set(entry.colors);
      for (const name of ["position", "aTo", "aColorFrom", "aColorTo"]) attributes[name].needsUpdate = true;
      world.crispMaterial.uniforms.uMap.value = entry.texture;
      world.crispMaterial.uniforms.uRect.value.copy(entry.rect);
      world.crispMaterial.uniforms.uOpacity.value = 1;
      world.crisp.visible = true;
      world.particleMaterial.uniforms.uVisible.value = 0;
      state.running = false;
      state.progress = 1;
      state.swapped = true;
    };

    const start = (key, entry, intro) => {
      if (reduceMotion) {
        showInstantly(entry);
        state.current = key;
        invalidate();
        return;
      }
      if (intro) {
        const cloud = createCloud(count, formulas[activeIndex].glow);
        attributes.position.array.set(cloud.positions);
        attributes.aColorFrom.array.set(cloud.colors);
      } else {
        // The bottle currently on screen becomes the starting cloud.
        attributes.position.array.set(attributes.aTo.array);
        attributes.aColorFrom.array.set(attributes.aColorTo.array);
      }
      attributes.aTo.array.set(entry.positions);
      attributes.aColorTo.array.set(entry.colors);
      for (const name of ["position", "aTo", "aColorFrom", "aColorTo"]) attributes[name].needsUpdate = true;
      state.pending = entry;
      state.swapped = false;
      state.current = key;
      state.progress = 0;
      state.duration = intro ? INTRO_SECONDS : MORPH_SECONDS;
      state.running = true;
      world.particleMaterial.uniforms.uProgress.value = 0;
      world.particleMaterial.uniforms.uVisible.value = 1;
      invalidate();
    };

    const advance = key => {
      load(key)
        .then(entry => {
          if (state.running) {
            state.queued = key;
            return;
          }
          if (state.current === key) return;
          const intro = !announced.current;
          start(key, entry, intro);
          if (intro) {
            announced.current = true;
            onReady?.();
            // Warm the rest of the collection once the first bottle is assembling.
            window.setTimeout(() => formulas.forEach(item => load(item.key).catch(() => {})), 1500);
          }
        })
        .catch(() => {});
    };

    state.advance = advance;
    glowTarget.current.set(formulas[activeIndex].glow);
    advance(formulas[activeIndex].key);
  }, [activeIndex, count, formulas, gl, invalidate, onReady, reduceMotion, world]);

  /* Per-frame animation */
  const clock = useRef(0);
  const pointer = useRef({ x: 0, y: 0 });

  useFrame((_, rawDelta) => {
    const L = layout.current;
    if (!L.ready) return;
    const delta = Math.min(rawDelta, 1 / 20);
    const animate = motionOn && !reduceMotion;
    if (animate) clock.current += delta;
    const time = clock.current;
    const state = morph.current;
    const { particleMaterial, crispMaterial, crisp, bottleGroup, aura, auraMaterial, floor, poolMaterial, shadowMaterial, shock, shockMaterial } = world;
    const pu = particleMaterial.uniforms;

    // Colour follows the active formula
    if (reduceMotion) glow.current.copy(glowTarget.current);
    else glow.current.lerp(glowTarget.current, 1 - Math.exp(-delta * 3));
    shockMaterial.color.copy(glow.current);

    // Morph progress; the sharp photo swaps while it is fully faded out.
    if (state.running) {
      state.progress = Math.min(1, state.progress + delta / state.duration);
      pu.uProgress.value = state.progress;
      if (!state.swapped && state.progress > 0.82 && crispMaterial.uniforms.uOpacity.value < 0.02) {
        crispMaterial.uniforms.uMap.value = state.pending.texture;
        crispMaterial.uniforms.uRect.value.copy(state.pending.rect);
        crisp.visible = true;
        state.swapped = true;
      }
      if (state.progress >= 1 && state.swapped) {
        state.running = false;
        state.shock = 1;
        if (state.queued && state.queued !== state.current) {
          const next = state.queued;
          state.queued = null;
          state.advance?.(next);
        }
        state.queued = null;
      }
    }
    const crispTarget = state.running ? (state.swapped && state.progress > 0.88 ? 1 : 0) : crisp.visible ? 1 : 0;
    const crispUniform = crispMaterial.uniforms.uOpacity;
    crispUniform.value = THREE.MathUtils.damp(crispUniform.value, crispTarget, crispTarget > crispUniform.value ? 5 : 12, delta);
    // Particles hide under the photo once it is opaque again.
    const visibleTarget = state.running || crispUniform.value < 0.97 ? 1 : 0;
    pu.uVisible.value = THREE.MathUtils.damp(pu.uVisible.value, visibleTarget, visibleTarget ? 14 : 3, delta);

    // Inputs
    const input = pointerRef.current;
    pointer.current.x = THREE.MathUtils.damp(pointer.current.x, animate && input.inside ? input.x : 0, 3, delta);
    pointer.current.y = THREE.MathUtils.damp(pointer.current.y, animate && input.inside ? input.y : 0, 3, delta);
    const s = reduceMotion ? 0 : clamp01(scrollProgress?.get() ?? 0);
    pu.uScroll.value = s;

    // Bottle + aura + floor follow the DOM anchor
    const h = L.h * BOTTLE_FILL;
    const baseY = L.base + L.h * BOTTLE_LIFT;
    bottleGroup.position.set(L.x, baseY + Math.sin(time * 0.8) * h * 0.01, 0);
    bottleGroup.scale.setScalar(h);
    bottleGroup.rotation.set(pointer.current.y * 0.04, Math.sin(time * 0.45) * 0.09 + pointer.current.x * 0.22, 0);
    aura.position.set(L.x, baseY, 0);
    aura.scale.setScalar(h);
    floor.position.set(L.x, baseY, 0);
    floor.rotation.set(-Math.PI / 2 + 0.2, 0, 0);
    floor.scale.setScalar(h);

    // Point sizes scale with how large the bottle is on screen.
    const bottlePx = h * L.unitPx;
    pu.uSize.value = Math.sqrt((bottlePx * bottlePx * BOTTLE_ASPECT * 0.82) / count) * 1.6 * gl.getPixelRatio();
    pu.uTime.value = time;

    const ready = announced.current ? 1 : 0;
    auraMaterial.uniforms.uTime.value = time;
    auraMaterial.uniforms.uSize.value = 5 * gl.getPixelRatio();
    auraMaterial.uniforms.uOpacity.value = THREE.MathUtils.damp(auraMaterial.uniforms.uOpacity.value, ready * (1 - s * 0.6), 1.5, delta);
    poolMaterial.uniforms.uOpacity.value = THREE.MathUtils.damp(poolMaterial.uniforms.uOpacity.value, ready * 0.42 * (1 - s), 2, delta);
    // The shadow belongs to the solid bottle, so it fades whenever the photo does.
    shadowMaterial.uniforms.uOpacity.value = 0.3 * crispUniform.value * (1 - s);

    // Landing shockwave when a bottle finishes assembling
    if (state.shock > 0) {
      state.shock = Math.max(0, state.shock - delta / 1.1);
      const f = 1 - state.shock;
      shock.scale.setScalar(0.25 + f * 0.45);
      shockMaterial.opacity = Math.pow(state.shock, 1.6) * 0.5;
    } else {
      shockMaterial.opacity = 0;
    }

    // In "demand" mode keep frames coming until transitions settle.
    if (!animate && (state.running || state.shock > 0 || Math.abs(crispUniform.value - crispTarget) > 0.01 || Math.abs(pu.uVisible.value - visibleTarget) > 0.01)) {
      invalidate();
    }
  });

  return (
    <>
      <primitive object={world.floor} />
      <primitive object={world.bottleGroup} />
      <primitive object={world.aura} />
    </>
  );
}

export default function MwpParticleScene({ inView, motionOn, lite, ...props }) {
  const frameloop = !inView ? "never" : motionOn ? "always" : "demand";
  return (
    <Canvas
      frameloop={frameloop}
      dpr={[1, lite ? 1.5 : 1.8]}
      camera={{ position: [0, 0, CAMERA_Z], fov: CAMERA_FOV, near: 0.1, far: 80 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      flat
      style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
    >
      <ParticleWorld motionOn={motionOn} lite={lite} {...props} />
    </Canvas>
  );
}
