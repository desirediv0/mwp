"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

// WebGL stage for MwpOrbitHero: the active bottle on a curved card, orbiting capsules,
// softgels, orbit rings, a glowing floor pad and drifting dust. Layout follows a DOM
// anchor so CSS stays in charge of where the bottle sits at every breakpoint.

const CAMERA_Z = 12;
const CAMERA_FOV = 30;
const BOTTLE_ASPECT = 0.425; // width / height of the opaque area in every cutout
const BOTTLE_CURVE = 0.6; // how deep the label wraps back (1 = true half-cylinder)
const BOTTLE_FILL = 0.92; // share of the anchor height the bottle occupies
const BOTTLE_LIFT = 0.035; // matches the transparent margin under the DOM fallback image
const TRANSITION_SECONDS = 1.25;
const INTRO_SECONDS = 2.2;
const CREAM = new THREE.Color("#f7f1e6");
const SHADOW = new THREE.Color("#1d160c");

const clamp01 = value => Math.min(1, Math.max(0, value));
const easeInOut = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = t => 1 - Math.pow(1 - t, 3);
const easeOutBack = t => 1 + 2.2 * Math.pow(t - 1, 3) + 1.2 * Math.pow(t - 1, 2);

function seeded(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randomAxis(rand) {
  return new THREE.Vector3(rand() - 0.5, rand() - 0.5, rand() - 0.5).normalize();
}

/* ── Shaders ───────────────────────────────────────────── */

const bottleVertex = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormal;
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Two bottle textures dissolve into each other through a noise front with a glowing edge.
const bottleFragment = /* glsl */ `
  uniform sampler2D uMapA;
  uniform sampler2D uMapB;
  uniform vec4 uRectA;
  uniform vec4 uRectB;
  uniform float uHasA;
  uniform float uHasB;
  uniform float uMix;
  uniform vec3 uGlow;
  uniform float uSheen;
  uniform float uReflection;
  varying vec2 vUv;
  varying vec3 vNormal;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
  }
  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 4; i++) {
      value += amplitude * noise(p);
      p *= 2.03;
      amplitude *= 0.5;
    }
    return value;
  }

  void main() {
    vec4 a = texture2D(uMapA, uRectA.xy + vUv * uRectA.zw) * uHasA;
    vec4 b = texture2D(uMapB, uRectB.xy + vUv * uRectB.zw) * uHasB;

    float field = fbm(vUv * vec2(4.0, 9.0)) * 0.65 + vUv.y * 0.35;
    float threshold = uMix * 1.24 - 0.12;
    float reveal = smoothstep(threshold + 0.02, threshold - 0.02, field);
    vec4 color = mix(a, b, reveal);

    float edge = 1.0 - smoothstep(0.0, 0.05, abs(field - threshold));
    edge *= step(0.0005, uMix) * step(uMix, 0.9995) * max(a.a, b.a);

    float sheen = smoothstep(0.24, 0.0, abs(vNormal.x - 0.45)) * uSheen;
    color.rgb += sheen * color.a;
    color.rgb = mix(color.rgb, mix(uGlow, vec3(1.0), 0.35) * 1.4, edge);
    color.a = max(color.a, edge);

    if (uReflection > 0.5) color.a *= (1.0 - smoothstep(0.0, 0.32, vUv.y)) * 0.16;
    if (color.a < 0.004) discard;
    gl_FragColor = color;
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

const radialFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uPower;
  varying vec2 vUv;
  void main() {
    float d = length(vUv - 0.5) * 2.0;
    float alpha = pow(1.0 - smoothstep(0.0, 1.0, d), uPower) * uOpacity;
    if (alpha < 0.003) discard;
    gl_FragColor = vec4(uColor, alpha);
    #include <colorspace_fragment>
  }
`;

const ringFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uDash;
  varying vec2 vUv;
  void main() {
    if (uDash > 0.0 && fract(vUv.x * uDash) > 0.42) discard;
    gl_FragColor = vec4(uColor, uOpacity);
    #include <colorspace_fragment>
  }
`;

const dustVertex = /* glsl */ `
  attribute float aSeed;
  uniform float uTime;
  uniform float uScroll;
  uniform float uSize;
  uniform vec2 uView;
  varying float vAlpha;
  void main() {
    vec3 p = position;
    float rise = uTime * (0.03 + aSeed * 0.05) + uScroll * (0.35 + aSeed * 0.4);
    p.y = fract(p.y + rise) - 0.5;
    p.x += sin(uTime * 0.35 + aSeed * 31.0) * 0.012;
    vec4 mv = modelViewMatrix * vec4(p.x * uView.x, p.y * uView.y, p.z, 1.0);
    gl_PointSize = uSize * (0.45 + aSeed) * (${CAMERA_Z.toFixed(1)} / -mv.z);
    vAlpha = 0.25 + aSeed * 0.55;
    gl_Position = projectionMatrix * mv;
  }
`;

const dustFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float alpha = smoothstep(0.5, 0.1, d) * vAlpha * uOpacity;
    if (alpha < 0.01) discard;
    gl_FragColor = vec4(uColor, alpha);
    #include <colorspace_fragment>
  }
`;

/* ── Geometry ──────────────────────────────────────────── */

// A label-shaped strip bent into an elliptical half-cylinder. U stays linear in x so,
// seen head-on, the bottle photo is undistorted; tilting it reveals the curve.
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

// Two lathe halves: a slightly wider cap that overlaps the body, like a real hard capsule.
function createCapsuleGeometries() {
  const steps = 10;
  const straight = 0.72;
  const capRadius = 0.52;
  const bodyRadius = 0.5;
  const cap = [new THREE.Vector2(capRadius, -0.16), new THREE.Vector2(capRadius, straight)];
  for (let i = 1; i <= steps; i++) {
    const a = (i / steps) * (Math.PI / 2);
    cap.push(new THREE.Vector2(Math.max(0.0001, capRadius * Math.cos(a)), straight + capRadius * Math.sin(a)));
  }
  const body = [];
  for (let i = 0; i <= steps; i++) {
    const a = -Math.PI / 2 + (i / steps) * (Math.PI / 2);
    body.push(new THREE.Vector2(Math.max(0.0001, bodyRadius * Math.cos(a)), -straight + bodyRadius * Math.sin(a)));
  }
  body.push(new THREE.Vector2(bodyRadius, 0.34));
  return { cap: new THREE.LatheGeometry(cap, 28), body: new THREE.LatheGeometry(body, 28) };
}

function createCapsules(lite) {
  const rand = seeded(11);
  const belt = lite ? 11 : 16;
  const floaters = lite ? 5 : 10;
  const list = [];
  for (let i = 0; i < belt; i++) {
    list.push({
      kind: "belt",
      angle: (i / belt) * Math.PI * 2 + (rand() - 0.5) * 0.3,
      radius: 1 + (rand() - 0.5) * 0.24,
      lift: (rand() - 0.5) * 0.14,
      size: 0.85 + rand() * 0.35,
      axis: randomAxis(rand),
      spin: 0.35 + rand() * 0.7,
      phase: rand() * Math.PI * 2,
      variant: i % 3,
      scatter: 0.5 + rand() * 1.2,
    });
  }
  for (let i = 0; i < floaters; i++) {
    list.push({
      kind: "float",
      fx: 0.04 + rand() * 0.92,
      fy: 0.06 + rand() * 0.88,
      z: -2.6 + rand() * 3.4,
      size: 1 + rand() * 0.5,
      axis: randomAxis(rand),
      spin: 0.15 + rand() * 0.35,
      phase: rand() * Math.PI * 2,
      variant: (i + 1) % 3,
      scatter: 0.4 + rand() * 0.9,
    });
  }
  return list;
}

function createSoftgels(lite) {
  const rand = seeded(23);
  const count = lite ? 5 : 8;
  return Array.from({ length: count }, (_, i) => ({
    angle: (i / count) * Math.PI * 2 + rand() * 0.4,
    radius: 1 + (rand() - 0.5) * 0.16,
    size: 0.8 + rand() * 0.45,
    axis: randomAxis(rand),
    spin: 0.3 + rand() * 0.5,
    phase: rand() * Math.PI * 2,
    scatter: 0.6 + rand(),
  }));
}

/* ── Textures ──────────────────────────────────────────── */

const EMPTY_TEXTURE = new THREE.DataTexture(new Uint8Array([0, 0, 0, 0]), 1, 1);
EMPTY_TEXTURE.needsUpdate = true;

// Opaque bounds of a cutout as (u0, v0, uSpan, vSpan), so every bottle fills the card the same way.
function measureOpaqueRect(image) {
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
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] > 24) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return new THREE.Vector4(0, 0, 1, 1);
  const top = minY / height;
  const bottom = (maxY + 1) / height;
  return new THREE.Vector4(minX / width, 1 - bottom, (maxX + 1 - minX) / width, bottom - top);
}

function loadBottle(src, renderer) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => {
      const texture = new THREE.Texture(image);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
      texture.needsUpdate = true;
      renderer.initTexture(texture);
      resolve({ texture, rect: measureOpaqueRect(image) });
    };
    image.onerror = () => reject(new Error(`Could not load ${src}`));
    image.src = src;
  });
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

function OrbitWorld({ formulas, activeIndex, anchorRef, pointerRef, scrollProgress, motionOn, reduceMotion, lite, onReady }) {
  const { gl, scene, invalidate } = useThree();
  const layout = useAnchorLayout(anchorRef);

  const capsules = useMemo(() => createCapsules(lite), [lite]);
  const softgels = useMemo(() => createSoftgels(lite), [lite]);
  const glow = useRef(new THREE.Color(formulas[activeIndex].glow));
  const glowTarget = useRef(new THREE.Color(formulas[activeIndex].glow));

  const bottleUniforms = useMemo(
    () => ({
      uMapA: { value: EMPTY_TEXTURE },
      uMapB: { value: EMPTY_TEXTURE },
      uRectA: { value: new THREE.Vector4(0, 0, 1, 1) },
      uRectB: { value: new THREE.Vector4(0, 0, 1, 1) },
      uHasA: { value: 0 },
      uHasB: { value: 0 },
      uMix: { value: 0 },
      uGlow: { value: glow.current },
      uSheen: { value: 0.12 },
      uReflection: { value: 0 },
    }),
    []
  );

  const world = useMemo(() => {
    const bottleGeometry = createBottleGeometry();
    const bottleMaterial = new THREE.ShaderMaterial({
      uniforms: bottleUniforms,
      vertexShader: bottleVertex,
      fragmentShader: bottleFragment,
      transparent: true,
    });
    const reflectionMaterial = new THREE.ShaderMaterial({
      uniforms: { ...bottleUniforms, uReflection: { value: 1 } },
      vertexShader: bottleVertex,
      fragmentShader: bottleFragment,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const bottle = new THREE.Mesh(bottleGeometry, bottleMaterial);
    bottle.renderOrder = 2;
    const reflection = new THREE.Mesh(bottleGeometry, reflectionMaterial);
    reflection.scale.y = -1;
    reflection.position.y = -0.004;
    reflection.renderOrder = 2;
    const bottleGroup = new THREE.Group();
    bottleGroup.add(bottle, reflection);

    const radialMaterial = (color, opacity, power) =>
      new THREE.ShaderMaterial({
        uniforms: { uColor: { value: color.clone() }, uOpacity: { value: opacity }, uPower: { value: power } },
        vertexShader: basicVertex,
        fragmentShader: radialFragment,
        transparent: true,
        depthWrite: false,
      });
    const discGeometry = new THREE.CircleGeometry(1, 64);
    const pad = new THREE.Mesh(discGeometry, radialMaterial(glow.current, 0.5, 1.6));
    pad.scale.setScalar(0.62);
    const shadow = new THREE.Mesh(discGeometry, radialMaterial(SHADOW, 0.32, 2.2));
    shadow.scale.setScalar(0.27);
    shadow.position.z = 0.002;
    const rippleGeometry = new THREE.RingGeometry(0.985, 1, 128);
    const ripples = Array.from({ length: 3 }, () => {
      const ripple = new THREE.Mesh(
        rippleGeometry,
        new THREE.MeshBasicMaterial({ color: glow.current.clone(), transparent: true, opacity: 0, depthWrite: false })
      );
      ripple.position.z = 0.001;
      return ripple;
    });
    const floor = new THREE.Group();
    floor.add(pad, shadow, ...ripples);
    floor.children.forEach(child => {
      child.renderOrder = 0;
    });

    const ringMaterial = (opacity, dash) =>
      new THREE.ShaderMaterial({
        uniforms: { uColor: { value: glow.current.clone() }, uOpacity: { value: opacity }, uDash: { value: dash } },
        vertexShader: basicVertex,
        fragmentShader: ringFragment,
        transparent: true,
      });
    const ringGeometry = new THREE.TorusGeometry(1, 0.0055, 6, 220);
    const ringA = new THREE.Mesh(ringGeometry, ringMaterial(0.5, 0));
    const ringB = new THREE.Mesh(ringGeometry, ringMaterial(0.38, 160));
    ringA.renderOrder = 1;
    ringB.renderOrder = 1;
    const satelliteGeometry = new THREE.SphereGeometry(1, 16, 12);
    const satelliteMaterial = new THREE.MeshBasicMaterial({ color: glow.current.clone() });
    const satellites = [new THREE.Mesh(satelliteGeometry, satelliteMaterial), new THREE.Mesh(satelliteGeometry, satelliteMaterial)];

    const { cap, body } = createCapsuleGeometries();
    const capMaterial = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.26, clearcoat: 1, clearcoatRoughness: 0.08 });
    const bodyMaterial = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.34, clearcoat: 0.9, clearcoatRoughness: 0.14 });
    const capMesh = new THREE.InstancedMesh(cap, capMaterial, capsules.length);
    const bodyMesh = new THREE.InstancedMesh(body, bodyMaterial, capsules.length);
    const white = new THREE.Color(0xffffff);
    capsules.forEach((_, i) => {
      capMesh.setColorAt(i, white);
      bodyMesh.setColorAt(i, white);
    });
    for (const mesh of [capMesh, bodyMesh]) {
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      mesh.frustumCulled = false;
    }

    const softgelGeometry = new THREE.SphereGeometry(0.5, 28, 18);
    softgelGeometry.scale(1.45, 1, 1);
    const softgelMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      roughness: 0.08,
      clearcoat: 1,
      clearcoatRoughness: 0.04,
      emissive: new THREE.Color(0x000000),
    });
    const softgelMesh = new THREE.InstancedMesh(softgelGeometry, softgelMaterial, softgels.length);
    softgelMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    softgelMesh.frustumCulled = false;

    const dustCount = lite ? 70 : 160;
    const rand = seeded(5);
    const dustPositions = new Float32Array(dustCount * 3);
    const dustSeeds = new Float32Array(dustCount);
    for (let i = 0; i < dustCount; i++) {
      dustPositions[i * 3] = rand() - 0.5;
      dustPositions[i * 3 + 1] = rand();
      dustPositions[i * 3 + 2] = -3.5 + rand() * 4.5;
      dustSeeds[i] = rand();
    }
    const dustGeometry = new THREE.BufferGeometry();
    dustGeometry.setAttribute("position", new THREE.BufferAttribute(dustPositions, 3));
    dustGeometry.setAttribute("aSeed", new THREE.BufferAttribute(dustSeeds, 1));
    const dustMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uScroll: { value: 0 },
        uSize: { value: 4 },
        uView: { value: new THREE.Vector2(1, 1) },
        uColor: { value: glow.current.clone() },
        uOpacity: { value: 0.8 },
      },
      vertexShader: dustVertex,
      fragmentShader: dustFragment,
      transparent: true,
      depthWrite: false,
    });
    const dust = new THREE.Points(dustGeometry, dustMaterial);
    dust.frustumCulled = false;
    dust.renderOrder = 3;

    return {
      bottleGroup,
      floor,
      pad,
      ripples,
      ringA,
      ringB,
      satellites,
      capMesh,
      bodyMesh,
      softgelMesh,
      dust,
      dispose() {
        bottleGeometry.dispose();
        bottleMaterial.dispose();
        reflectionMaterial.dispose();
        discGeometry.dispose();
        rippleGeometry.dispose();
        ringGeometry.dispose();
        satelliteGeometry.dispose();
        satelliteMaterial.dispose();
        cap.dispose();
        body.dispose();
        capMaterial.dispose();
        bodyMaterial.dispose();
        softgelGeometry.dispose();
        softgelMaterial.dispose();
        dustGeometry.dispose();
        dustMaterial.dispose();
        [pad, ...floor.children, ringA, ringB].forEach(mesh => mesh.material.dispose());
        capMesh.dispose();
        bodyMesh.dispose();
        softgelMesh.dispose();
      },
    };
  }, [bottleUniforms, capsules, softgels, lite]);

  useEffect(() => () => world.dispose(), [world]);

  // Studio reflections for the glossy capsules, generated locally (no HDR download).
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const room = new RoomEnvironment();
    const environment = pmrem.fromScene(room, 0.04).texture;
    scene.environment = environment;
    return () => {
      scene.environment = null;
      environment.dispose();
      room.dispose();
      pmrem.dispose();
    };
  }, [gl, scene]);

  /* Bottle textures + dissolve transitions */
  const textures = useRef(new Map());
  const transition = useRef({ target: null, shown: null, progress: 1, running: false, direction: 1 });
  const lastIndex = useRef(activeIndex);
  const announced = useRef(false);
  const intro = useRef(reduceMotion ? 1 : 0);
  const boost = useRef(0);

  useEffect(() => {
    const cache = textures.current;
    return () => {
      cache.forEach(promise => promise.then(({ texture }) => texture.dispose()).catch(() => {}));
      cache.clear();
    };
  }, []);

  useEffect(() => {
    const cache = textures.current;
    const load = key => {
      if (!cache.has(key)) cache.set(key, loadBottle(`/products/cutouts/${key}.webp`, gl));
      return cache.get(key);
    };
    const formula = formulas[activeIndex];
    const state = transition.current;
    const step = activeIndex - lastIndex.current;
    state.direction = step === 0 ? 1 : Math.sign(Math.abs(step) > formulas.length / 2 ? -step : step);
    lastIndex.current = activeIndex;
    state.target = formula.key;
    // Recolour right away so the 3D accents stay in step with the page theme; the bottle follows once loaded.
    glowTarget.current.set(formula.glow);
    let cancelled = false;

    load(formula.key)
      .then(({ texture, rect }) => {
        if (cancelled || state.target !== formula.key) return;
        if (state.shown === formula.key && !state.running) return;
        // Whatever is mostly on screen becomes the "from" texture.
        if (state.running && state.progress > 0.5) {
          bottleUniforms.uMapA.value = bottleUniforms.uMapB.value;
          bottleUniforms.uRectA.value.copy(bottleUniforms.uRectB.value);
          bottleUniforms.uHasA.value = bottleUniforms.uHasB.value;
        }
        bottleUniforms.uMapB.value = texture;
        bottleUniforms.uRectB.value.copy(rect);
        bottleUniforms.uHasB.value = 1;
        bottleUniforms.uMix.value = 0;
        state.progress = 0;
        state.running = true;
        state.shown = formula.key;
        boost.current = 1;
        if (!announced.current) {
          announced.current = true;
          onReady?.();
          // Warm the rest of the collection once the first bottle is on screen.
          window.setTimeout(() => formulas.forEach(item => load(item.key).catch(() => {})), 1200);
        }
        invalidate();
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [activeIndex, bottleUniforms, formulas, gl, invalidate, onReady]);

  /* Per-frame animation */
  const clock = useRef(0);
  const pointer = useRef({ x: 0, y: 0 });
  const offsets = useMemo(() => capsules.map(() => new THREE.Vector2()), [capsules]);
  const temp = useMemo(
    () => ({
      matrix: new THREE.Matrix4(),
      position: new THREE.Vector3(),
      local: new THREE.Vector3(),
      quaternion: new THREE.Quaternion(),
      scale: new THREE.Vector3(),
      ringA: new THREE.Quaternion(),
      ringB: new THREE.Quaternion(),
      euler: new THREE.Euler(),
      color: new THREE.Color(),
      deep: new THREE.Color(),
      light: new THREE.Color(),
      softgel: new THREE.Color(),
    }),
    []
  );
  const colorsDirty = useRef(true);

  useFrame((_, rawDelta) => {
    const L = layout.current;
    if (!L.ready) return;
    const delta = Math.min(rawDelta, 1 / 20);
    const animate = motionOn && !reduceMotion;
    if (animate) clock.current += delta;
    const time = clock.current;
    const state = transition.current;

    // Inputs
    const input = pointerRef.current;
    pointer.current.x = THREE.MathUtils.damp(pointer.current.x, animate && input.inside ? input.x : 0, 3.5, delta);
    pointer.current.y = THREE.MathUtils.damp(pointer.current.y, animate && input.inside ? input.y : 0, 3.5, delta);
    const px = pointer.current.x;
    const py = pointer.current.y;
    const s = reduceMotion ? 0 : clamp01(scrollProgress?.get() ?? 0);

    // Intro + dissolve progress (transitions still play while paused; they are user-initiated)
    if (announced.current && intro.current < 1) {
      intro.current = reduceMotion ? 1 : Math.min(1, intro.current + delta / INTRO_SECONDS);
    }
    if (state.running) {
      state.progress = reduceMotion ? 1 : Math.min(1, state.progress + delta / TRANSITION_SECONDS);
      bottleUniforms.uMix.value = easeInOut(state.progress);
      if (state.progress >= 1) {
        bottleUniforms.uMapA.value = bottleUniforms.uMapB.value;
        bottleUniforms.uRectA.value.copy(bottleUniforms.uRectB.value);
        bottleUniforms.uHasA.value = 1;
        bottleUniforms.uMix.value = 0;
        state.running = false;
      }
    }
    boost.current = THREE.MathUtils.damp(boost.current, 0, 1.6, delta);
    const introK = easeOut(intro.current);

    // Colour follows the active formula
    if (glow.current.getHex() !== glowTarget.current.getHex()) {
      if (reduceMotion) glow.current.copy(glowTarget.current);
      else glow.current.lerp(glowTarget.current, 1 - Math.exp(-delta * 3.2));
      if (Math.abs(glow.current.r - glowTarget.current.r) + Math.abs(glow.current.g - glowTarget.current.g) + Math.abs(glow.current.b - glowTarget.current.b) < 0.003) {
        glow.current.copy(glowTarget.current);
      }
      colorsDirty.current = true;
    }

    // Bottle
    const h = L.h * BOTTLE_FILL;
    const baseY = L.base + L.h * BOTTLE_LIFT;
    const centerY = baseY + h * 0.5;
    const spin = Math.sin(clamp01(state.progress) * Math.PI) * 0.42 * state.direction * (state.running ? 1 : 0);
    const { bottleGroup, floor, pad, ripples, ringA, ringB, satellites, capMesh, bodyMesh, softgelMesh, dust } = world;
    bottleGroup.position.set(L.x, baseY + Math.sin(time * 0.9) * h * 0.012 + s * h * 0.14, 0);
    bottleGroup.scale.setScalar(h * (1 + s * 0.06));
    bottleGroup.rotation.set(py * 0.05, Math.sin(time * 0.55) * 0.1 + px * 0.32 + spin + s * 0.7, 0);

    // Floor pad + ripples (tilted toward camera so the ellipse reads)
    floor.position.set(L.x, baseY + s * h * 0.14, 0);
    floor.rotation.set(-Math.PI / 2 + 0.22, 0, 0);
    floor.scale.setScalar(h);
    pad.material.uniforms.uOpacity.value = 0.5 * introK * (1 - s);
    ripples.forEach((ripple, i) => {
      const f = (time * 0.2 + i / ripples.length) % 1;
      ripple.scale.setScalar(0.3 + f * 0.75);
      ripple.material.opacity = Math.pow(1 - f, 1.6) * 0.55 * introK * (1 - s) * (animate ? 1 : 0.6);
    });

    // Orbits
    const R = Math.min(h * 0.62, L.viewW * 0.45);
    const spread = (1 + (1 - introK) * 1.4) * (1 + s * 1.5);
    if (animate) {
      state.ringAngleA = (state.ringAngleA ?? 0) + delta * 0.22 * (1 + boost.current * 3.5);
      state.ringAngleB = (state.ringAngleB ?? 0) - delta * 0.16 * (1 + boost.current * 3);
    }
    const angleA = state.ringAngleA ?? 0;
    const angleB = state.ringAngleB ?? 0;
    // Orbits live in the torus' XY plane; tilting past 90° drops the near side below centre.
    temp.ringA.setFromEuler(temp.euler.set(Math.PI / 2 + 0.36 - py * 0.12 + s * 0.45, 0, -0.16 - px * 0.08));
    temp.ringB.setFromEuler(temp.euler.set(Math.PI / 2 + 0.62 + py * 0.08 - s * 0.3, 0.2, 0.52 + px * 0.06));

    ringA.position.set(L.x, centerY + s * h * 0.3, 0);
    ringA.quaternion.copy(temp.ringA);
    ringA.scale.setScalar(R * spread);
    ringA.material.uniforms.uOpacity.value = 0.5 * introK * (1 - s);
    ringB.position.copy(ringA.position);
    ringB.quaternion.copy(temp.ringB);
    ringB.scale.setScalar(R * 0.84 * spread);
    ringB.material.uniforms.uOpacity.value = 0.38 * introK * (1 - s);

    satellites.forEach((satellite, i) => {
      const quaternion = i === 0 ? temp.ringA : temp.ringB;
      const radius = (i === 0 ? R : R * 0.84) * spread;
      const angle = i === 0 ? angleA * 1.8 + 1.2 : angleB * 2.2 + 4;
      temp.local.set(Math.cos(angle) * radius, Math.sin(angle) * radius, 0).applyQuaternion(quaternion);
      satellite.position.copy(ringA.position).add(temp.local);
      satellite.scale.setScalar(h * 0.011 * introK);
    });

    // Pointer in world units for the capsule repel
    const pointerWorldX = (input.px - (L.viewW * L.unitPx) / 2) / L.unitPx;
    const pointerWorldY = ((L.viewH * L.unitPx) / 2 - input.py) / L.unitPx;
    const repelRadius = h * 0.42;
    const damping = 1 - Math.exp(-delta * 7);
    const capsuleSize = h * 0.046;

    capsules.forEach((capsule, i) => {
      const appear = reduceMotion ? 1 : easeOutBack(clamp01(intro.current * 2.2 - i * 0.045));
      if (capsule.kind === "belt") {
        const angle = capsule.angle + angleA;
        const radius = R * capsule.radius * spread * (1 + s * capsule.scatter * 0.6);
        temp.local.set(Math.cos(angle) * radius, Math.sin(angle) * radius, capsule.lift * h).applyQuaternion(temp.ringA);
        temp.position.set(L.x, centerY, 0).add(temp.local);
        temp.position.y += s * h * (0.3 + capsule.scatter * 0.55);
      } else {
        // Floaters stay inside the stage's box so they never sit behind the headline or body copy.
        const zoneLeft = Math.max(-L.viewW / 2, L.x - h * 0.85);
        const zoneRight = Math.min(L.viewW / 2, L.x + h * 0.85);
        let x = zoneLeft + capsule.fx * (zoneRight - zoneLeft);
        const dx = x - L.x;
        const gap = h * 0.34;
        // Only floaters in front of the bottle need to keep clear of it; the rest are occluded by depth.
        if (capsule.z > -0.4 && Math.abs(dx) < gap) x = L.x + Math.sign(dx || 1) * (gap + Math.abs(dx) * 0.6);
        const depth = (capsule.z + 3) / 3.4;
        temp.position.set(
          x + px * depth * h * 0.08,
          baseY - h * 0.1 + capsule.fy * h * 1.2 + Math.sin(time * 0.6 + capsule.phase) * h * 0.03 - py * depth * h * 0.05 + s * L.viewH * (0.25 + capsule.scatter * 0.35),
          capsule.z
        );
      }

      // Push away from the cursor
      const offset = offsets[i];
      let targetX = 0;
      let targetY = 0;
      if (animate && input.inside) {
        const dx = temp.position.x - pointerWorldX;
        const dy = temp.position.y - pointerWorldY;
        const distance = Math.hypot(dx, dy);
        if (distance < repelRadius && distance > 0.0001) {
          const push = Math.pow(1 - distance / repelRadius, 2) * h * 0.32;
          targetX = (dx / distance) * push;
          targetY = (dy / distance) * push;
        }
      }
      offset.x += (targetX - offset.x) * damping;
      offset.y += (targetY - offset.y) * damping;
      temp.position.x += offset.x;
      temp.position.y += offset.y;

      temp.quaternion.setFromAxisAngle(capsule.axis, capsule.phase + time * capsule.spin * (1 + boost.current * 2));
      const sizeK = capsule.kind === "belt" ? 1 : 1.25;
      temp.scale.setScalar(capsuleSize * capsule.size * sizeK * Math.max(0, appear));
      temp.matrix.compose(temp.position, temp.quaternion, temp.scale);
      capMesh.setMatrixAt(i, temp.matrix);
      bodyMesh.setMatrixAt(i, temp.matrix);
    });
    capMesh.instanceMatrix.needsUpdate = true;
    bodyMesh.instanceMatrix.needsUpdate = true;

    softgels.forEach((softgel, i) => {
      const appear = reduceMotion ? 1 : easeOutBack(clamp01(intro.current * 2 - 0.3 - i * 0.05));
      const angle = softgel.angle + angleB;
      const radius = R * 0.84 * softgel.radius * spread * (1 + s * softgel.scatter * 0.5);
      temp.local.set(Math.cos(angle) * radius, Math.sin(angle) * radius, 0).applyQuaternion(temp.ringB);
      temp.position.set(L.x, centerY + s * h * (0.25 + softgel.scatter * 0.4), 0).add(temp.local);
      temp.quaternion.setFromAxisAngle(softgel.axis, softgel.phase + time * softgel.spin);
      temp.scale.setScalar(h * 0.04 * softgel.size * Math.max(0, appear));
      temp.matrix.compose(temp.position, temp.quaternion, temp.scale);
      softgelMesh.setMatrixAt(i, temp.matrix);
    });
    softgelMesh.instanceMatrix.needsUpdate = true;

    // Recolour everything that follows the formula accent
    if (colorsDirty.current) {
      colorsDirty.current = false;
      const accent = glow.current;
      temp.deep.copy(accent).multiplyScalar(0.62);
      temp.light.copy(accent).lerp(CREAM, 0.55);
      capsules.forEach((capsule, i) => {
        const capColor = capsule.variant === 2 ? CREAM : capsule.variant === 1 ? temp.deep : accent;
        const bodyColor = capsule.variant === 2 ? accent : capsule.variant === 1 ? temp.light : CREAM;
        capMesh.setColorAt(i, capColor);
        bodyMesh.setColorAt(i, bodyColor);
      });
      capMesh.instanceColor.needsUpdate = true;
      bodyMesh.instanceColor.needsUpdate = true;
      temp.softgel.copy(accent).lerp(CREAM, 0.25);
      softgelMesh.material.color.copy(temp.softgel);
      softgelMesh.material.emissive.copy(accent).multiplyScalar(0.22);
      pad.material.uniforms.uColor.value.copy(accent);
      ripples.forEach(ripple => ripple.material.color.copy(accent));
      ringA.material.uniforms.uColor.value.copy(accent);
      ringB.material.uniforms.uColor.value.copy(accent);
      satellites[0].material.color.copy(accent);
      temp.color.copy(accent).lerp(CREAM, 0.35);
      dust.material.uniforms.uColor.value.copy(temp.color);
    }

    // Dust
    const dustUniforms = dust.material.uniforms;
    dustUniforms.uTime.value = time;
    dustUniforms.uScroll.value = s;
    dustUniforms.uView.value.set(L.viewW, L.viewH);
    dustUniforms.uSize.value = 3.2 * gl.getPixelRatio();
    dustUniforms.uOpacity.value = 0.85 * introK;

    // In "demand" mode keep frames coming until transitions settle.
    if (!animate && (state.running || (announced.current && intro.current < 1) || boost.current > 0.01)) invalidate();
  });

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[4, 6, 8]} intensity={2.1} />
      <directionalLight position={[-6, -2, 4]} intensity={0.55} color="#fff1dc" />
      <primitive object={world.floor} />
      <primitive object={world.ringA} />
      <primitive object={world.ringB} />
      {world.satellites.map((satellite, i) => (
        <primitive key={i} object={satellite} />
      ))}
      <primitive object={world.capMesh} />
      <primitive object={world.bodyMesh} />
      <primitive object={world.softgelMesh} />
      <primitive object={world.bottleGroup} />
      <primitive object={world.dust} />
    </>
  );
}

export default function MwpOrbitScene({ inView, motionOn, lite, ...props }) {
  const frameloop = !inView ? "never" : motionOn ? "always" : "demand";
  return (
    <Canvas
      frameloop={frameloop}
      dpr={[1, lite ? 1.5 : 1.8]}
      camera={{ position: [0, 0, CAMERA_Z], fov: CAMERA_FOV, near: 0.1, far: 80 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance", toneMapping: THREE.NeutralToneMapping }}
      style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
    >
      <OrbitWorld motionOn={motionOn} lite={lite} {...props} />
    </Canvas>
  );
}
