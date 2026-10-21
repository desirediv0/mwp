"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

// WebGL stage for MwpCapsuleHero, ported from the client's reference page. A gold half (Men) and a
// silver half (Women) tumble in and lock into one capsule (Power); every 12 s it opens, trust labels
// and leaves float out, then it closes again with a flash and a burst of sparks.

const LOCK = 1.55; // seconds; the headline's "Power for both." line lands on this beat
const CYCLE = 12;
const FONT = 'Neulis, "Helvetica Neue", Arial, sans-serif';
// Label canvases are a fixed size (texture dimensions must not change after upload); each pill is
// drawn at the width its text needs, keeping the reference's 54px type and 2.2 world units per 640px.
const LABEL_WIDTH = 860;
const LABEL_HEIGHT = 160;
const LABEL_SPRITE_WIDTH = 2.2 * (LABEL_WIDTH / 640);
const LABEL_EDGE = 3.2; // keep pills inside the visible canvas (world units from centre)
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
  const goldMat = track(new THREE.MeshStandardMaterial({ color: linear(0xffc04a), metalness: 1, roughness: 0.15 }));
  const silverMat = track(new THREE.MeshStandardMaterial({ color: linear(0xf6f8fb), metalness: 1, roughness: 0.12 }));
  const innerMat = track(new THREE.MeshStandardMaterial({ color: linear(0x14224a), metalness: 0.3, roughness: 0.6, side: THREE.BackSide }));
  const half = (material, dir, r, len, shift) => {
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
    group.add(cylinder, inner, cap, lip);
    return group;
  };
  const left = half(goldMat, -1, R, L, 0);
  const right = half(silverMat, 1, R * 1.035, L + 0.08, 0.08);
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

  return {
    root,
    left,
    right,
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

function CapsuleWorld({ words, pointerRef, scrollRef, playStartRef, onPlay, onOpenChange, motionOn, reduceMotion }) {
  const { invalidate } = useThree();
  const world = useMemo(() => buildWorld(words), [words]);
  useStudioEnvironment();
  useEffect(() => () => world.dispose(), [world]);

  // Redraw the labels once the display font has loaded so they don't render in a fallback face.
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
        invalidate();
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [world, invalidate]);

  const clock = useRef(null);
  const mouse = useRef({ x: 0, y: 0 });
  const roll = useRef(0);
  const wasOpen = useRef(false);

  useFrame((_, rawDelta) => {
    const dt = Math.min(rawDelta, 0.05);
    // The first frame starts the shared timeline so the headline and the capsule land together.
    if (clock.current === null) {
      if (playStartRef.current === null) {
        playStartRef.current = performance.now();
        onPlay?.();
      }
      clock.current = (performance.now() - playStartRef.current) / 1000;
    } else if (motionOn) {
      clock.current += dt;
    }
    const t = reduceMotion ? LOCK + 2 : clock.current;
    const { left, right, pill, holder, flashLight, dustPositions, dustSeeds, dustGeometry, dustMaterial, burstPositions, burstVelocity, burstGeometry, burstMaterial, labels, leaves } = world;

    // 1. Intro: halves fly in from deep space, tumbling
    const pl = easeOut((t - 0.2) / (LOCK - 0.2));
    const pr = easeOut((t - 0.75) / (LOCK - 0.75));
    left.visible = t > 0.2;
    right.visible = t > 0.75;
    left.position.set(-7 * (1 - pl), (1 - pl) * 2.2, -(1 - pl) * 8);
    right.position.set(7 * (1 - pr), -(1 - pr) * 2.2, -(1 - pr) * 8);
    left.rotation.set((1 - pl) * -7, (1 - pl) * 3, 0);
    right.rotation.set((1 - pr) * 7, -(1 - pr) * 3, 0);

    // 2. After the lock: every 12 s the capsule opens and the trust labels float out
    const k = t - LOCK;
    const c = k > 0 ? k % CYCLE : -1;
    let open = 0;
    if (k > 0 && !reduceMotion) {
      if (c > 3 && c < 3.9) open = easeInOut((c - 3) / 0.9);
      else if (c >= 3.9 && c < 9.6) open = 1;
      else if (c >= 9.6 && c < 10.4) open = 1 - easeInOut((c - 9.6) / 0.8);
    }
    const isOpen = open > 0.05;
    if (isOpen !== wasOpen.current) {
      wasOpen.current = isOpen;
      onOpenChange?.(isOpen);
    }
    if (t >= LOCK) {
      left.position.x = -open * 0.95;
      right.position.x = open * 0.95;
    }
    const since = k > 0 ? (c >= 10.4 ? c - 10.4 : k < CYCLE ? k : c + CYCLE - 10.4) : -1;
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

    labels.forEach((label, i) => {
      let f = 0;
      if (k > 0 && !reduceMotion) {
        const back = 8.9 + (labels.length - 1 - i) * 0.08;
        if (c >= 3.5 + label.delay && c < 4.6 + label.delay) f = easeOut((c - 3.5 - label.delay) / 1.1);
        else if (c >= 4.6 + label.delay && c < back) f = 1;
        else if (c >= back && c < back + 0.8) f = 1 - easeInOut((c - back) / 0.8);
      }
      // Long pills are nudged inward just enough to stay on screen.
      const halfPill = ((label.pill / LABEL_WIDTH) * LABEL_SPRITE_WIDTH) / 2;
      const slotX = Math.sign(label.slot[0]) * Math.min(Math.abs(label.slot[0]), LABEL_EDGE - halfPill);
      label.sprite.visible = f > 0.001;
      label.sprite.position.set(slotX * f, label.slot[1] * f + Math.sin(t * 1.4 + i) * 0.05 * f, 0.6 * f);
      label.sprite.scale.set(LABEL_SPRITE_WIDTH * (0.3 + 0.7 * f), 0.55 * (0.3 + 0.7 * f), 1);
      label.sprite.material.opacity = Math.min(1, f * 1.4);
    });

    // Leaves drift out and swirl
    let leafOut = 0;
    if (k > 0 && !reduceMotion) {
      if (c >= 3.4 && c < 4.8) leafOut = easeOut((c - 3.4) / 1.4);
      else if (c >= 4.8 && c < 8.8) leafOut = 1;
      else if (c >= 8.8 && c < 9.8) leafOut = 1 - easeInOut((c - 8.8) / 1);
    }
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

    // 3. Continuous tumble, pointer and scroll
    if (k > 0 && !reduceMotion && motionOn) roll.current += dt * (0.7 - open * 0.45);
    pill.rotation.x = roll.current;
    const pointer = pointerRef.current;
    mouse.current.x += (pointer.x - mouse.current.x) * 0.06;
    mouse.current.y += (pointer.y - mouse.current.y) * 0.06;
    const scrollK = reduceMotion ? 0 : scrollRef.current;
    const idle = k > 0 ? 1 : 0;
    holder.rotation.z = (0.48 + scrollK * 0.9) * (1 - open) + open * 0.22;
    holder.scale.setScalar(1 - open * 0.24);
    holder.rotation.y = mouse.current.x * 0.7 + idle * Math.sin(t * 0.45) * 0.55 * (1 - open) + open * 0.35 + scrollK * 1.2;
    holder.rotation.x = mouse.current.y * 0.5 + idle * Math.sin(t * 0.3) * 0.25 * (1 - open);
    holder.position.y = idle * Math.sin(t * 1.1) * 0.12 - scrollK * 0.6;

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
  });

  return <primitive object={world.root} />;
}

export default function MwpCapsuleScene({ inView, motionOn, reduceMotion, ...props }) {
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
