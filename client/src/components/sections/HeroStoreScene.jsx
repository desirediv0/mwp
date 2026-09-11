"use client";

import { Suspense, useRef, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  useTexture,
  MeshReflectorMaterial,
  Environment,
  Float,
} from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";

/* Brand palette */
const ORCHID = new THREE.Color("#A958A4");
const AZURE = new THREE.Color("#00AEEF");
const GOLD = new THREE.Color("#E2AEDF");
const NOIR = new THREE.Color("#160B1C");

/* Fashion imagery hung along the aisle (local → no CORS) */
const FRAMES = [
  { img: "/hero-desktop-1.png", side: -1, z: 1.5 },
  { img: "/shop-banner.png", side: 1, z: -1.5 },
  { img: "/deals-hero.png", side: -1, z: -5.5 },
  { img: "/hero-desktop-2.png", side: 1, z: -8.5 },
  { img: "/founder-craft.png", side: -1, z: -12.5 },
  { img: "/shop-header.png", side: 1, z: -15.5 },
];

/* Neon doorways the camera passes through → "entering rooms" */
const ARCHES = [-0.5, -4, -7.5, -11, -14.5, -18];

useTexture.preload(FRAMES.map((f) => f.img));

/* ── A framed fashion panel on the wall, cover-fitted, spotlit ── */
function Frame({ img, side, z }) {
  const tex = useTexture(img);
  const W = 2.0;
  const H = 2.8;

  // cover-fit the texture into the portrait frame
  useMemo(() => {
    tex.colorSpace = THREE.SRGBColorSpace;
    const im = tex.image;
    if (im && im.width) {
      const frameAspect = W / H;
      const imgAspect = im.width / im.height;
      if (imgAspect > frameAspect) {
        tex.repeat.set(frameAspect / imgAspect, 1);
        tex.offset.set((1 - frameAspect / imgAspect) / 2, 0);
      } else {
        tex.repeat.set(1, imgAspect / frameAspect);
        tex.offset.set(0, (1 - imgAspect / frameAspect) / 2);
      }
    }
    return tex;
  }, [tex]);

  const x = side * 3.5;
  const rotY = side < 0 ? Math.PI / 2 - 0.5 : -(Math.PI / 2 - 0.5);
  const accent = side < 0 ? ORCHID : AZURE;

  return (
    <group position={[x, 1.7, z]} rotation={[0, rotY, 0]}>
      {/* glow border */}
      <mesh position={[0, 0, -0.06]}>
        <planeGeometry args={[W + 0.18, H + 0.18]} />
        <meshBasicMaterial color={accent} toneMapped={false} />
      </mesh>
      {/* matte mount */}
      <mesh position={[0, 0, -0.03]}>
        <planeGeometry args={[W + 0.08, H + 0.08]} />
        <meshStandardMaterial color="#0e0712" roughness={0.9} />
      </mesh>
      {/* the image */}
      <mesh>
        <planeGeometry args={[W, H]} />
        <meshStandardMaterial map={tex} roughness={0.55} metalness={0.05} />
      </mesh>
      {/* spotlight raking the artwork */}
      <spotLight
        position={[0, 3.4, 1.6]}
        target-position={[0, 0, 0]}
        angle={0.5}
        penumbra={0.8}
        intensity={38}
        distance={9}
        color={"#ffe9c6"}
      />
      {/* volumetric beam */}
      <mesh position={[0, 2.1, 0.9]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[1.1, 3.0, 24, 1, true]} />
        <meshBasicMaterial
          color={"#ffdca8"}
          transparent
          opacity={0.05}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

/* ── Glowing neon doorway ── */
function Arch({ z, i }) {
  const color = i % 2 === 0 ? AZURE : ORCHID;
  const postH = 4.6;
  const width = 8.6;
  const bar = 0.09;
  return (
    <group position={[0, 0, z]}>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * (width / 2), postH / 2, 0]}>
          <boxGeometry args={[bar, postH, bar]} />
          <meshBasicMaterial color={color} toneMapped={false} />
        </mesh>
      ))}
      <mesh position={[0, postH, 0]}>
        <boxGeometry args={[width + bar, bar, bar]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
      {/* faint fill glow so the doorway reads as a lit threshold */}
      <mesh position={[0, postH / 2, 0]}>
        <planeGeometry args={[width, postH]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.03}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

/* ── End wall — the focal point deep inside ── */
function EndWall() {
  const tex = useTexture("/deals-hero.png");
  useMemo(() => {
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, [tex]);
  return (
    <group position={[0, 2.4, -21]}>
      <mesh position={[0, 0, -0.05]}>
        <planeGeometry args={[6.4, 4.4]} />
        <meshBasicMaterial color={GOLD} toneMapped={false} />
      </mesh>
      <mesh>
        <planeGeometry args={[6.2, 4.2]} />
        <meshStandardMaterial map={tex} roughness={0.5} />
      </mesh>
      <spotLight
        position={[0, 4, 4]}
        target-position={[0, 2.4, -21]}
        angle={0.6}
        penumbra={0.9}
        intensity={60}
        distance={16}
        color={"#ffe9c6"}
      />
    </group>
  );
}

/* ── Drifting dust motes ── */
function Dust({ count = 420 }) {
  const ref = useRef();
  const positions = useMemo(() => {
    const p = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      p[i * 3] = (Math.random() - 0.5) * 12;
      p[i * 3 + 1] = Math.random() * 5;
      p[i * 3 + 2] = -20 + Math.random() * 30;
    }
    return p;
  }, [count]);
  useFrame((state) => {
    if (ref.current) ref.current.rotation.y = state.clock.elapsedTime * 0.01;
  });
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        size={0.03}
        color={"#ffdca8"}
        transparent
        opacity={0.5}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  );
}

/* ── Reflective showroom floor ── */
function Floor({ isLow }) {
  if (isLow) {
    return (
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -8]}>
        <planeGeometry args={[40, 60]} />
        <meshStandardMaterial color={"#1a0f22"} roughness={0.35} metalness={0.8} />
      </mesh>
    );
  }
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -8]}>
      <planeGeometry args={[40, 60]} />
      <MeshReflectorMaterial
        resolution={512}
        mixBlur={1}
        mixStrength={28}
        roughness={0.6}
        depthScale={1.1}
        minDepthThreshold={0.4}
        maxDepthThreshold={1.4}
        color="#150b1b"
        metalness={0.7}
        blur={[400, 120]}
      />
    </mesh>
  );
}

/* ── Camera walks the aisle on scroll ── */
function Walker({ scrollRef, pointerRef }) {
  const { camera } = useThree();
  useFrame((state) => {
    const s = scrollRef.current || 0;
    const p = pointerRef.current || { x: 0, y: 0 };
    const targetZ = THREE.MathUtils.lerp(9.5, -18.5, s);
    camera.position.z += (targetZ - camera.position.z) * 0.09;
    camera.position.x += (p.x * 0.6 - camera.position.x) * 0.04;
    camera.position.y = 1.55 + Math.sin(state.clock.elapsedTime * 0.5) * 0.04;
    camera.lookAt(p.x * 0.7, 1.35, camera.position.z - 6);
  });
  return null;
}

function SceneContents({ scrollRef, pointerRef, isLow }) {
  return (
    <>
      <color attach="background" args={[NOIR]} />
      <fog attach="fog" args={[NOIR, 6, 30]} />

      <ambientLight intensity={0.28} />
      {/* warm key + brand accent lights */}
      <pointLight position={[0, 4.4, 2]} intensity={16} color={"#ffdca8"} />
      <pointLight position={[-5, 2, -6]} intensity={22} color={ORCHID} />
      <pointLight position={[5, 2, -12]} intensity={22} color={AZURE} />
      <Environment preset="night" />

      <Floor isLow={isLow} />

      {ARCHES.map((z, i) => (
        <Arch key={i} z={z} i={i} />
      ))}

      {FRAMES.map((f, i) => (
        <Frame key={i} {...f} />
      ))}

      <EndWall />

      {!isLow && <Dust />}

      <Walker scrollRef={scrollRef} pointerRef={pointerRef} />
    </>
  );
}

export default function HeroStoreScene({ scrollRef, pointerRef, quality = "high" }) {
  const isLow = quality === "low";
  return (
    <Canvas
      camera={{ position: [0, 1.55, 9.5], fov: 58 }}
      dpr={isLow ? [1, 1.3] : [1, 2]}
      gl={{ antialias: true, powerPreference: "high-performance" }}
    >
      <Suspense fallback={null}>
        <SceneContents scrollRef={scrollRef} pointerRef={pointerRef} isLow={isLow} />
      </Suspense>

      <EffectComposer disableNormalPass multisampling={isLow ? 0 : 4}>
        <Bloom
          intensity={isLow ? 0.55 : 0.85}
          luminanceThreshold={0.3}
          luminanceSmoothing={0.9}
          mipmapBlur
        />
        <Vignette eskil={false} offset={0.28} darkness={0.9} />
      </EffectComposer>
    </Canvas>
  );
}
