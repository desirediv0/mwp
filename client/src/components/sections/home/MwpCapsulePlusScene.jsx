"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

// WebGL stage for MwpCapsuleHeroPlus: the reference capsule (gold half = Men, silver half = Women,
// locked = Power) with an interaction layer. The capsule opens from one smoothed value fed by the
// 12 s cycle, scroll, the "Look inside" button and headline hover; it can be dragged to spin, its
// halves glow when their headline line is hovered, they carry a printed imprint, and formula beads
// spill out with the leaves when it opens. Every lock reports a beat so the page can pulse with it.

const LOCK = 1.55; // seconds; the headline's "Power for both." line lands on this beat
const CYCLE = 12;
const FONT = 'Neulis, "Helvetica Neue", Arial, sans-serif';
// Label canvases are a fixed size (texture dimensions must not change after upload); each pill is
// drawn at the width its text needs, keeping the reference's 54px type and 2.2 world units per 640px.
const LABEL_WIDTH = 860;
const LABEL_HEIGHT = 160;
const LABEL_SPRITE_WIDTH = 2.2 * (LABEL_WIDTH / 640);
const LABEL_EDGE = 3.2; // keep pills inside the visible canvas (world units from centre)
const TAU = Math.PI * 2;
const SLOTS = [
  [-2.05, 1.85],
  [0, 2.55],
  [2.05, 1.85],
  [2.05, -1.85],
  [0, -2.55],
  [-2.05, -1.85],
];

const clamp01 = x => Math.min(Math.max(x, 0), 1);
const easeOut = x => 1 - Math.pow(1 - clamp01(x), 4);
const easeInOut = x => {
  const v = clamp01(x);
  return v < 0.5 ? 8 * v * v * v * v : 1 - Math.pow(-2 * v + 2, 4) / 2;
};

// The reference was tuned on three r128, which treated hex colours as linear; keep that look.
const linear = hex => new THREE.Color().setRGB(((hex >> 16) & 255) / 255, ((hex >> 8) & 255) / 255, (hex & 255) / 255, THREE.LinearSRGBColorSpace);

function roundRect(context, x, y, w, h, r) {
  context.beginPath();
  context.moveTo(x + r, y);
  context.lineTo(x + w - r, y);
  context.quadraticCurveTo(x + w, y, x + w, y + r);
  context.lineTo(x + w, y + h - r);
  context.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  context.lineTo(x + r, y + h);
  context.quadraticCurveTo(x, y + h, x, y + h - r);
  context.lineTo(x, y + r);
  context.quadraticCurveTo(x, y, x + r, y);
  context.closePath();
}

// White pill with a green check, drawn to a canvas and used as a sprite texture. Returns the pill width in px.
function drawLabel(canvas, text) {
  const context = canvas.getContext("2d");
  const W = canvas.width;
  const H = canvas.height;
  context.clearRect(0, 0, W, H);
  let size = 54;
  context.font = `800 ${size}px ${FONT}`;
  while (context.measureText(text).width + 150 > W - 20 && size > 36) {
    size -= 2;
    context.font = `800 ${size}px ${FONT}`;
  }
  const w = Math.min(W - 20, context.measureText(text).width + 150);
  const x = (W - w) / 2;
  context.shadowColor = "rgba(20,34,74,.22)";
  context.shadowBlur = 22;
  context.shadowOffsetY = 8;
  roundRect(context, x, 22, w, H - 52, (H - 52) / 2);
  context.fillStyle = "#FFFFFF";
  context.fill();
  context.shadowColor = "transparent";
  context.lineWidth = 3;
  context.strokeStyle = "#E3E8E0";
  context.stroke();
  const cx = x + 56;
  const cy = 22 + (H - 52) / 2;
  context.beginPath();
  context.arc(cx, cy, 30, 0, Math.PI * 2);
  context.fillStyle = "#2F7D4F";
  context.fill();
  context.strokeStyle = "#FFFFFF";
  context.lineWidth = 7;
  context.lineCap = "round";
  context.lineJoin = "round";
  context.beginPath();
  context.moveTo(cx - 13, cy + 1);
  context.lineTo(cx - 4, cy + 11);
  context.lineTo(cx + 14, cy - 10);
  context.stroke();
  context.fillStyle = "#14224A";
  context.textBaseline = "middle";
  context.fillText(text, x + 104, cy + 2);
  return w;
}

// Printed imprint for a capsule half, like the code on a real hard capsule. The canvas wraps around
// the cylinder (u = around, v = along the axis), so the text is rotated to run along v.
function drawImprint(canvas, text, ink) {
  const context = canvas.getContext("2d");
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = ink;
  context.textAlign = "center";
  context.textBaseline = "middle";
  // Longer words shrink so they always fit along the half (the canvas height spans its length).
  context.font = `900 120px ${FONT}`;
  const fit = (canvas.height * 0.78) / context.measureText(text).width;
  if (fit < 1) context.font = `900 ${Math.floor(120 * fit)}px ${FONT}`;
  // a long word cannot get longer, so make its letters taller instead: it reads clearly on the silver half
  const tall = fit < 1 ? 1.5 : 1;
  for (const u of [0.25, 0.75]) {
    context.save();
    context.translate(u * canvas.width, canvas.height / 2);
    context.rotate(Math.PI / 2);
    context.scale(1, tall);
    context.fillText(text, 0, 0);
    context.restore();
  }
}

function buildWorld(words) {
  const disposables = [];
  const track = item => {
    disposables.push(item);
    return item;
  };
  const root = new THREE.Group();

  // Lights (×π keeps the reference's pre-r155 light intensities)
  const key = new THREE.DirectionalLight(0xffffff, 1.2 * Math.PI);
  key.position.set(3, 5, 6);
  const ambient = new THREE.AmbientLight(0xffffff, 0.25 * Math.PI);
  const flashLight = new THREE.PointLight(linear(0xffe2a0), 0, 14, 1);
  flashLight.position.set(0, 0, 2.5);
  root.add(key, ambient, flashLight);

  // Capsule halves along the X axis
  const R = 1;
  const L = 1.35;
  // Emissive starts at 0; it rises when the half's headline line is hovered.
  const goldMat = track(new THREE.MeshStandardMaterial({ color: linear(0xffc04a), metalness: 1, roughness: 0.15, emissive: linear(0xffa516), emissiveIntensity: 0 }));
  const silverMat = track(new THREE.MeshStandardMaterial({ color: linear(0xf6f8fb), metalness: 1, roughness: 0.12, emissive: linear(0xc9d8ff), emissiveIntensity: 0 }));
  const imprints = [];
  const imprintMaterial = (text, ink) => {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 512;
    drawImprint(canvas, text, ink);
    const texture = track(new THREE.CanvasTexture(canvas));
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    imprints.push({ canvas, texture, text, ink });
    return track(
      new THREE.MeshStandardMaterial({ map: texture, emissiveMap: texture, emissive: 0xffffff, emissiveIntensity: 0.6, transparent: true, depthWrite: false, metalness: 0, roughness: 0.5, polygonOffset: true, polygonOffsetFactor: -2 })
    );
  };
  const innerMat = track(new THREE.MeshStandardMaterial({ color: linear(0x14224a), metalness: 0.3, roughness: 0.6, side: THREE.BackSide }));
  const half = (material, dir, r, len, shift, imprint) => {
    const group = new THREE.Group();
    const cylinder = new THREE.Mesh(track(new THREE.CylinderGeometry(r, r, len, 96, 1, true)), material);
    cylinder.rotation.z = Math.PI / 2;
    cylinder.position.x = (dir * len) / 2 - shift;
    const inner = new THREE.Mesh(track(new THREE.CylinderGeometry(r * 0.97, r * 0.97, len, 64, 1, true)), innerMat);
    inner.rotation.z = Math.PI / 2;
    inner.position.x = (dir * len) / 2 - shift;
    const cap = new THREE.Mesh(track(new THREE.SphereGeometry(r, 96, 48, 0, Math.PI * 2, 0, Math.PI / 2)), material);
    cap.rotation.z = (-dir * Math.PI) / 2;
    cap.position.x = dir * len - shift;
    const lip = new THREE.Mesh(track(new THREE.TorusGeometry(r * 0.985, 0.03, 16, 128)), material);
    lip.rotation.y = Math.PI / 2;
    lip.position.x = -shift;
    const band = new THREE.Mesh(track(new THREE.CylinderGeometry(r * 1.004, r * 1.004, len * 0.9, 96, 1, true)), imprint);
    band.rotation.z = Math.PI / 2;
    band.position.x = (dir * len) / 2 - shift;
    group.add(cylinder, inner, cap, lip, band);
    return group;
  };
  const left = half(goldMat, -1, R, L, 0, imprintMaterial("MWP", "#14224A"));
  const right = half(silverMat, 1, R * 1.035, L + 0.08, 0.08, imprintMaterial("SUPPLEMENTS", "#14224A"));
  const pill = new THREE.Group();
  pill.add(left, right);
  const holder = new THREE.Group();
  holder.add(pill);
  root.add(holder);

  // Round sprite for dust and sparks
  const spriteCanvas = document.createElement("canvas");
  spriteCanvas.width = spriteCanvas.height = 64;
  const spriteContext = spriteCanvas.getContext("2d");
  const gradient = spriteContext.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, "rgba(255,240,200,1)");
  gradient.addColorStop(0.35, "rgba(240,196,90,.9)");
  gradient.addColorStop(1, "rgba(201,150,46,0)");
  spriteContext.fillStyle = gradient;
  spriteContext.fillRect(0, 0, 64, 64);
  const sprite = track(new THREE.CanvasTexture(spriteCanvas));

  // Gold dust ring
  const dustCount = 280;
  const dustPositions = new Float32Array(dustCount * 3);
  const dustSeeds = Array.from({ length: dustCount }, () => ({
    a: Math.random() * Math.PI * 2,
    r: 2.6 + Math.random() * 1.6,
    y: (Math.random() - 0.5) * 3.6,
    s: 0.2 + Math.random() * 0.5,
  }));
  const dustGeometry = track(new THREE.BufferGeometry());
  dustGeometry.setAttribute("position", new THREE.BufferAttribute(dustPositions, 3));
  const dustMaterial = track(new THREE.PointsMaterial({ size: 0.14, map: sprite, transparent: true, depthWrite: false, opacity: 0 }));
  const dust = new THREE.Points(dustGeometry, dustMaterial);
  dust.rotation.z = 0.48;
  root.add(dust);

  // Sparks when the halves lock
  const burstCount = 240;
  const burstPositions = new Float32Array(burstCount * 3);
  const burstVelocity = Array.from({ length: burstCount }, () => {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const speed = 2.5 + Math.random() * 4;
    return [Math.sin(phi) * Math.cos(theta) * speed, Math.sin(phi) * Math.sin(theta) * speed, Math.cos(phi) * speed * 0.6];
  });
  const burstGeometry = track(new THREE.BufferGeometry());
  burstGeometry.setAttribute("position", new THREE.BufferAttribute(burstPositions, 3));
  const burstMaterial = track(new THREE.PointsMaterial({ size: 0.12, map: sprite, transparent: true, depthWrite: false, opacity: 0 }));
  root.add(new THREE.Points(burstGeometry, burstMaterial));

  // Trust labels that float out of the open capsule
  const labels = words.slice(0, SLOTS.length).map((text, i) => {
    const canvas = document.createElement("canvas");
    canvas.width = LABEL_WIDTH;
    canvas.height = LABEL_HEIGHT;
    const pill = drawLabel(canvas, text);
    const texture = track(new THREE.CanvasTexture(canvas));
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    const material = track(new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false, depthWrite: false, opacity: 0, toneMapped: false }));
    const label = new THREE.Sprite(material);
    label.renderOrder = 10;
    label.scale.set(LABEL_SPRITE_WIDTH, 0.55, 1);
    label.visible = false;
    root.add(label);
    return { sprite: label, canvas, texture, text, pill, slot: SLOTS[i], delay: i * 0.16 };
  });

  // Natural leaves that swirl out with the labels
  const leafShape = new THREE.Shape();
  leafShape.moveTo(0, -0.25);
  leafShape.bezierCurveTo(0.17, -0.12, 0.17, 0.14, 0, 0.28);
  leafShape.bezierCurveTo(-0.17, 0.14, -0.17, -0.12, 0, -0.25);
  const leafGeometry = track(new THREE.ShapeGeometry(leafShape, 12));
  const leafMaterials = [0x1e6b3e, 0x2a8a4c, 0x3fa35a, 0x155c34, 0x58b865].map(color =>
    track(new THREE.MeshStandardMaterial({ color: linear(color), roughness: 0.85, metalness: 0, envMapIntensity: 0.35, side: THREE.DoubleSide }))
  );
  const leaves = Array.from({ length: 46 }, (_, i) => {
    const mesh = new THREE.Mesh(leafGeometry, leafMaterials[i % leafMaterials.length]);
    const u = Math.random() * 2 - 1;
    const theta = Math.random() * Math.PI * 2;
    const radius = 1.5 + Math.random() * 1.9;
    mesh.visible = false;
    root.add(mesh);
    return {
      mesh,
      x: Math.sqrt(1 - u * u) * Math.cos(theta) * radius,
      y: u * radius * 0.85,
      z: Math.sqrt(1 - u * u) * Math.sin(theta) * radius * 0.7,
      speed: 0.25 + Math.random() * 0.5,
      rx: Math.random() * 6,
      ry: Math.random() * 6,
      spin: 0.6 + Math.random() * 1.4,
      scale: 0.7 + Math.random() * 0.9,
      delay: Math.random() * 0.4,
    };
  });

  // Formula beads (gold + cream) that spill from the seam when the capsule opens
  const beadGeometry = track(new THREE.SphereGeometry(1, 14, 10));
  const beadMaterials = [
    track(new THREE.MeshStandardMaterial({ color: linear(0xffc04a), metalness: 1, roughness: 0.25 })),
    track(new THREE.MeshStandardMaterial({ color: linear(0xfff1d2), metalness: 0.1, roughness: 0.35 })),
  ];
  const beadsPerMesh = 60;
  const beadMeshes = beadMaterials.map(material => {
    const mesh = new THREE.InstancedMesh(beadGeometry, material, beadsPerMesh);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    mesh.frustumCulled = false;
    root.add(mesh);
    return mesh;
  });
  const beads = Array.from({ length: beadsPerMesh * beadMeshes.length }, () => {
    const angle = Math.random() * TAU;
    return {
      dir: new THREE.Vector3((Math.random() - 0.5) * 0.7, Math.cos(angle), Math.sin(angle) * 0.8).normalize(),
      radius: 0.9 + Math.random() * 1.6,
      speed: (Math.random() < 0.5 ? -1 : 1) * (0.15 + Math.random() * 0.35),
      size: 0.035 + Math.random() * 0.045,
      delay: Math.random() * 0.35,
      phase: Math.random() * TAU,
    };
  });

  return {
    root,
    left,
    right,
    goldMat,
    silverMat,
    imprints,
    beadMeshes,
    beads,
    pill,
    holder,
    flashLight,
    dustPositions,
    dustSeeds,
    dustGeometry,
    dustMaterial,
    burstPositions,
    burstVelocity,
    burstGeometry,
    burstMaterial,
    labels,
    leaves,
    dispose() {
      disposables.forEach(item => item.dispose());
    },
  };
}

// Studio environment so the metal has real reflections (built locally, no HDR download).
function useStudioEnvironment() {
  const { gl, scene } = useThree();
  useEffect(() => {
    const env = new THREE.Scene();
    const owned = [];
    const add = mesh => {
      owned.push(mesh.geometry, mesh.material);
      env.add(mesh);
    };
    add(new THREE.Mesh(new THREE.SphereGeometry(20, 32, 16), new THREE.MeshBasicMaterial({ color: linear(0x353a45), side: THREE.BackSide })));
    const panel = (w, h, x, y, z, color) => {
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: linear(color), side: THREE.DoubleSide }));
      mesh.position.set(x, y, z);
      mesh.lookAt(0, 0, 0);
      add(mesh);
    };
    panel(18, 7, 0, 9, 4, 0xffffff);
    panel(7, 12, -10, 1, 3, 0xffe0a0);
    panel(7, 12, 10, 0, 3, 0xffffff);
    panel(18, 4, 0, -8, 6, 0x1b1e26);
    panel(2, 14, -4, 0, 10, 0xffffff);
    panel(1.2, 14, 5, 0, 9, 0xfff4dc);
    panel(6, 6, 0, 2, 14, 0xffffff);
    const pmrem = new THREE.PMREMGenerator(gl);
    const texture = pmrem.fromScene(env, 0.04).texture;
    scene.environment = texture;
    return () => {
      scene.environment = null;
      texture.dispose();
      pmrem.dispose();
      owned.forEach(item => item.dispose());
    };
  }, [gl, scene]);
}

const smoothstep = (a, b, x) => {
  const v = clamp01((x - a) / (b - a));
  return v * v * (3 - 2 * v);
};

// Auto-open schedule inside one 12 s cycle (same beats as the reference).
function cycleOpen(c) {
  if (c > 3 && c < 3.9) return easeInOut((c - 3) / 0.9);
  if (c >= 3.9 && c < 9.6) return 1;
  if (c >= 9.6 && c < 10.4) return 1 - easeInOut((c - 9.6) / 0.8);
  return 0;
}

function CapsuleWorld({ words, pointerRef, scrollRef, interactionRef, floorRef, playStartRef, onPlay, onOpenChange, onBeat, motionOn, reduceMotion }) {
  const { invalidate } = useThree();
  const world = useMemo(() => buildWorld(words), [words]);
  useStudioEnvironment();
  useEffect(() => () => world.dispose(), [world]);

  // The page pokes the canvas when it changes something while the render loop is idle (paused / reduced motion).
  useEffect(() => {
    const interaction = interactionRef.current;
    interaction.invalidate = invalidate;
    return () => {
      interaction.invalidate = null;
    };
  }, [interactionRef, invalidate]);

  // Redraw the labels and imprints once the display font has loaded so they don't render in a fallback face.
  useEffect(() => {
    let cancelled = false;
    document.fonts
      ?.load(`800 54px ${FONT}`)
      .then(() => {
        if (cancelled) return;
        world.labels.forEach(label => {
          label.pill = drawLabel(label.canvas, label.text);
          label.texture.needsUpdate = true;
        });
        world.imprints.forEach(imprint => {
          drawImprint(imprint.canvas, imprint.text, imprint.ink);
          imprint.texture.needsUpdate = true;
        });
        invalidate();
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [world, invalidate]);

  const state = useRef({
    clock: null,
    open: 0,
    armed: false,
    locked: false,
    since: -1,
    cycleStart: LOCK,
    roll: 0,
    mouse: { x: 0, y: 0 },
    spin: { x: 0, y: 0, vx: 0, vy: 0 },
    glow: { gold: 0, silver: 0 },
    wasOpen: false,
    manual: false,
    shadow: 1,
  });
  const matrix = useMemo(() => new THREE.Matrix4(), []);
  const quaternion = useMemo(() => new THREE.Quaternion(), []);
  const position = useMemo(() => new THREE.Vector3(), []);
  const scale = useMemo(() => new THREE.Vector3(), []);
  const axisX = useMemo(() => new THREE.Vector3(1, 0, 0), []);

  useFrame((_, rawDelta) => {
    const dt = Math.min(rawDelta, 0.05);
    const S = state.current;
    const interaction = interactionRef.current;
    const animate = motionOn && !reduceMotion;

    // The first frame starts the shared timeline so the headline and the capsule land together.
    if (S.clock === null) {
      if (playStartRef.current === null) {
        playStartRef.current = performance.now();
        onPlay?.();
      }
      S.clock = (performance.now() - playStartRef.current) / 1000;
    } else if (animate) {
      S.clock += dt;
    }
    const t = reduceMotion ? LOCK + 2 : S.clock;
    const { left, right, pill, holder, flashLight, goldMat, silverMat, dustPositions, dustSeeds, dustGeometry, dustMaterial, burstPositions, burstVelocity, burstGeometry, burstMaterial, labels, leaves, beads, beadMeshes } =
      world;

    // 1. Intro: halves fly in from deep space, tumbling
    const pl = easeOut((t - 0.2) / (LOCK - 0.2));
    const pr = easeOut((t - 0.75) / (LOCK - 0.75));
    left.visible = t > 0.2;
    right.visible = t > 0.75;
    left.position.set(-7 * (1 - pl), (1 - pl) * 2.2, -(1 - pl) * 8);
    right.position.set(7 * (1 - pr), -(1 - pr) * 2.2, -(1 - pr) * 8);
    left.rotation.set((1 - pl) * -7, (1 - pl) * 3, 0);
    right.rotation.set((1 - pr) * 7, -(1 - pr) * 3, 0);

    // 2. One open value, fed by the auto cycle, scroll, the "Look inside" button and headline hover
    const k = t - LOCK;
    const scrollK = reduceMotion ? 0 : scrollRef.current;
    // Closing by hand also parks the auto cycle in its closed phase, so "Close capsule" always closes it.
    if (S.manual && !interaction.manualOpen) S.cycleStart = t - 10.4;
    S.manual = interaction.manualOpen;
    let target = 0;
    if (k > 0) {
      const c = (((t - S.cycleStart) % CYCLE) + CYCLE) % CYCLE;
      const auto = reduceMotion ? 0 : cycleOpen(c);
      const scrolled = reduceMotion ? 0 : smoothstep(0.15, 0.6, scrollK);
      const manual = interaction.manualOpen ? 1 : 0;
      const peek = interaction.focus === "both" ? 0.16 : 0;
      target = Math.max(auto, scrolled, manual, peek);
    }
    S.open = reduceMotion ? target : THREE.MathUtils.damp(S.open, target, target > S.open ? 5 : 4, dt);
    if (Math.abs(S.open - target) < 0.0005) S.open = target;
    const open = S.open;
    const isOpen = open > 0.3;
    if (isOpen !== S.wasOpen) {
      S.wasOpen = isOpen;
      onOpenChange?.(isOpen);
    }

    // Lock beats: the first lock, then every time the capsule closes again after opening fully.
    if (k > 0 && !S.locked) {
      S.locked = true;
      S.since = 0;
      onBeat?.();
    }
    if (open > 0.6) S.armed = true;
    if (S.armed && open < 0.03) {
      S.armed = false;
      S.since = 0;
      // Restart the cycle from its closed phase so the next auto-open is a full beat away.
      S.cycleStart = t - 10.4;
      onBeat?.();
    }
    if (S.since >= 0 && !reduceMotion) S.since += dt;
    const since = reduceMotion ? -1 : S.since;

    // Headline hover lights up the matching half and nudges it outward.
    const focus = interaction.focus;
    S.glow.gold = THREE.MathUtils.damp(S.glow.gold, focus === "men" || focus === "both" ? 1 : 0, 6, dt);
    S.glow.silver = THREE.MathUtils.damp(S.glow.silver, focus === "women" || focus === "both" ? 1 : 0, 6, dt);
    goldMat.emissiveIntensity = S.glow.gold * 0.16;
    silverMat.emissiveIntensity = S.glow.silver * 0.12;
    if (t >= LOCK) {
      left.position.x = -open * 0.95 - S.glow.gold * 0.12 * (1 - open);
      right.position.x = open * 0.95 + S.glow.silver * 0.12 * (1 - open);
      left.scale.setScalar(1 + S.glow.gold * 0.05);
      right.scale.setScalar(1 + S.glow.silver * 0.05);
    }

    const bump = since >= 0 && since < 1.5 ? Math.exp(-since * 6) * Math.sin(since * 28) * 0.06 : 0;
    pill.scale.setScalar(1 + bump);
    flashLight.intensity = since >= 0 ? Math.max(0, 6 * Math.PI * Math.exp(-since * 3.5)) : 0;
    if (since >= 0 && since < 2.2) {
      burstMaterial.opacity = Math.max(0, 1 - since / 2.2);
      const spread = 1 - Math.exp(-since * 2.2);
      for (let b = 0; b < burstVelocity.length; b++) {
        burstPositions[b * 3] = burstVelocity[b][0] * spread;
        burstPositions[b * 3 + 1] = burstVelocity[b][1] * spread;
        burstPositions[b * 3 + 2] = burstVelocity[b][2] * spread;
      }
      burstGeometry.attributes.position.needsUpdate = true;
    } else {
      burstMaterial.opacity = 0;
    }

    // Trust labels follow the open value, staggered so they peel out one after another.
    labels.forEach((label, i) => {
      const f = easeOut((open - 0.35 - i * 0.05) / 0.4);
      const halfPill = ((label.pill / LABEL_WIDTH) * LABEL_SPRITE_WIDTH) / 2;
      const slotX = Math.sign(label.slot[0]) * Math.min(Math.abs(label.slot[0]), LABEL_EDGE - halfPill);
      label.sprite.visible = f > 0.001;
      label.sprite.position.set(slotX * f, label.slot[1] * f + Math.sin(t * 1.4 + i) * 0.05 * f, 0.6 * f);
      label.sprite.scale.set(LABEL_SPRITE_WIDTH * (0.3 + 0.7 * f), 0.55 * (0.3 + 0.7 * f), 1);
      label.sprite.material.opacity = Math.min(1, f * 1.4);
    });

    // Leaves drift out and swirl
    const leafOut = clamp01((open - 0.3) / 0.6);
    leaves.forEach((leaf, i) => {
      const f = clamp01((leafOut - leaf.delay) / (1 - leaf.delay));
      const angle = t * leaf.speed;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      leaf.mesh.visible = f > 0.001;
      leaf.mesh.position.set((leaf.x * cos - leaf.z * sin) * f, leaf.y * f + Math.sin(t + i) * 0.1 * f, (leaf.x * sin + leaf.z * cos) * f - 0.3);
      leaf.mesh.rotation.set(leaf.rx + t * leaf.spin, leaf.ry + t * leaf.spin * 0.7, t * 0.5);
      leaf.mesh.scale.setScalar(leaf.scale * f + 0.0001);
    });

    // Formula beads spill from the seam and orbit it
    const beadOut = clamp01((open - 0.15) / 0.7);
    beads.forEach((bead, i) => {
      const f = easeOut((beadOut - bead.delay) / (1 - bead.delay));
      const mesh = beadMeshes[i % beadMeshes.length];
      const index = Math.floor(i / beadMeshes.length);
      position.copy(bead.dir).multiplyScalar(0.25 + bead.radius * f);
      position.applyAxisAngle(axisX, t * bead.speed + bead.phase * (1 - f));
      position.y += Math.sin(t * 1.3 + bead.phase) * 0.06 * f;
      quaternion.identity();
      scale.setScalar(bead.size * f + 0.00001);
      matrix.compose(position, quaternion, scale);
      mesh.setMatrixAt(index, matrix);
    });
    beadMeshes.forEach(mesh => {
      mesh.instanceMatrix.needsUpdate = true;
    });

    // 3. Continuous tumble, pointer, drag-to-spin and scroll
    if (k > 0 && animate) S.roll += dt * (0.7 - open * 0.45);
    pill.rotation.x = S.roll;
    const pointer = pointerRef.current;
    S.mouse.x += (pointer.x - S.mouse.x) * 0.06;
    S.mouse.y += (pointer.y - S.mouse.y) * 0.06;

    const drag = interaction.drag;
    const spin = S.spin;
    if (drag.active) {
      const dy = drag.dx * 0.012;
      const dx = drag.dy * 0.008;
      spin.y += dy;
      spin.x = Math.max(-0.9, Math.min(0.9, spin.x + dx));
      spin.vy = Math.max(-14, Math.min(14, dy / Math.max(dt, 1 / 120)));
      spin.vx = Math.max(-6, Math.min(6, dx / Math.max(dt, 1 / 120)));
      drag.dx = 0;
      drag.dy = 0;
    } else {
      spin.y += spin.vy * dt;
      spin.x += spin.vx * dt;
      spin.vy *= Math.exp(-dt * 2.2);
      spin.vx *= Math.exp(-dt * 3);
      // Once the throw slows down, settle back on the nearest full turn so the pose returns.
      if (Math.abs(spin.vy) < 0.4) spin.y = THREE.MathUtils.damp(spin.y, Math.round(spin.y / TAU) * TAU, 1.6, dt);
      spin.x = THREE.MathUtils.damp(spin.x, 0, 2.2, dt);
    }

    const idle = k > 0 ? 1 : 0;
    holder.rotation.z = (0.48 + scrollK * 0.9) * (1 - open) + open * 0.22;
    holder.scale.setScalar(1 - open * 0.24);
    holder.rotation.y = S.mouse.x * 0.7 + idle * Math.sin(t * 0.45) * 0.55 * (1 - open) + open * 0.35 + scrollK * 1.2 + spin.y;
    holder.rotation.x = S.mouse.y * 0.5 + idle * Math.sin(t * 0.3) * 0.25 * (1 - open) + spin.x;
    holder.position.y = idle * Math.sin(t * 1.1) * 0.12 - scrollK * 0.6;

    // Contact shadow tightens as the capsule floats up and widens as it sinks.
    const shadow = Math.max(0.8, Math.min(1.25, 1 - holder.position.y * 0.6 - open * 0.12));
    if (floorRef.current && Math.abs(shadow - S.shadow) > 0.002) {
      S.shadow = shadow;
      floorRef.current.style.setProperty("--mcp-shadow", shadow.toFixed(3));
    }

    // Dust ring
    dustMaterial.opacity = clamp01((t - 1.4) / 1.2) * 0.9;
    for (let i = 0; i < dustSeeds.length; i++) {
      const seed = dustSeeds[i];
      const angle = seed.a + t * seed.s * 0.35;
      dustPositions[i * 3] = Math.cos(angle) * seed.r;
      dustPositions[i * 3 + 1] = seed.y + Math.sin(t * 0.6 + seed.a) * 0.15;
      dustPositions[i * 3 + 2] = Math.sin(angle) * seed.r * 0.55;
    }
    dustGeometry.attributes.position.needsUpdate = true;

    // When the loop is idle (paused / reduced motion) keep rendering until interactions settle.
    if (!animate) {
      const settling =
        drag.active ||
        Math.abs(spin.vy) > 0.01 ||
        Math.abs(spin.x) > 0.002 ||
        Math.abs(spin.y - Math.round(spin.y / TAU) * TAU) > 0.002 ||
        Math.abs(open - target) > 0.001 ||
        Math.abs(S.glow.gold - (focus === "men" || focus === "both" ? 1 : 0)) > 0.005 ||
        Math.abs(S.glow.silver - (focus === "women" || focus === "both" ? 1 : 0)) > 0.005 ||
        (since >= 0 && since < 2.2);
      if (settling) invalidate();
    }
  });

  return <primitive object={world.root} />;
}

export default function MwpCapsulePlusScene({ inView, motionOn, reduceMotion, ...props }) {
  const frameloop = !inView ? "never" : motionOn && !reduceMotion ? "always" : "demand";
  return (
    <Canvas
      frameloop={frameloop}
      dpr={[1, 2]}
      camera={{ position: [0, 0, 13], fov: 30, near: 0.1, far: 100 }}
      gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.15 }}
      style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
    >
      <CapsuleWorld motionOn={motionOn} reduceMotion={reduceMotion} {...props} />
    </Canvas>
  );
}
