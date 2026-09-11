"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Icosahedron, Float, Environment } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette, ChromaticAberration } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import * as THREE from "three";

/* Brand palette */
const ORCHID = new THREE.Color("#A958A4");
const AZURE = new THREE.Color("#00AEEF");
const GOLD = new THREE.Color("#E2AEDF");
const NOIR = new THREE.Color("#1D1024");

/* ──────────────────────────────────────────────────────────
   Iridescent liquid-crystal blob — custom vertex/fragment shader
   Noise-driven displacement + fresnel rim in orchid→azure
   ────────────────────────────────────────────────────────── */
const blobVertex = /* glsl */ `
  uniform float uTime;
  uniform float uAmp;
  uniform float uScroll;
  varying vec3 vNormal;
  varying vec3 vViewDir;
  varying float vDisp;

  // classic simplex-ish 3d noise (Ashima)
  vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x,289.0);}
  vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
  float snoise(vec3 v){
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod(i, 289.0);
    vec4 p = permute(permute(permute(
              i.z + vec4(0.0, i1.z, i2.z, 1.0))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 1.0/7.0;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z *ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }

  void main() {
    vNormal = normalize(normalMatrix * normal);
    float t = uTime * 0.32;
    float n = snoise(normal * (1.6 + uScroll * 1.4) + vec3(t));
    float n2 = snoise(normal * 3.4 - vec3(t * 0.7));
    float disp = (n * 0.62 + n2 * 0.24) * uAmp;
    vDisp = disp;
    vec3 pos = position + normal * disp;
    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    vViewDir = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;

const blobFragment = /* glsl */ `
  uniform vec3 uOrchid;
  uniform vec3 uAzure;
  uniform vec3 uGold;
  uniform float uTime;
  varying vec3 vNormal;
  varying vec3 vViewDir;
  varying float vDisp;

  void main() {
    float fres = pow(1.0 - max(dot(normalize(vNormal), normalize(vViewDir)), 0.0), 2.2);
    // base gradient by displacement + a shifting band
    float band = 0.5 + 0.5 * sin(vDisp * 6.0 + uTime * 0.6 + vNormal.y * 2.0);
    vec3 base = mix(uOrchid, uAzure, band);
    // iridescent gold sheen on the rim
    vec3 col = mix(base * 0.42, base, 0.62);
    col += uGold * fres * 0.55;
    col += uAzure * pow(fres, 3.5) * 0.45;
    gl_FragColor = vec4(col, 1.0);
  }
`;

function Blob({ scrollRef, pointerRef, offsetX = 0 }) {
  const matRef = useRef();
  const meshRef = useRef();
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uAmp: { value: 0.42 },
      uScroll: { value: 0 },
      uOrchid: { value: ORCHID.clone() },
      uAzure: { value: AZURE.clone() },
      uGold: { value: GOLD.clone() },
    }),
    []
  );

  useFrame((state, delta) => {
    const s = scrollRef.current || 0;
    const p = pointerRef.current || { x: 0, y: 0 };
    uniforms.uTime.value += delta;
    uniforms.uScroll.value = s;
    uniforms.uAmp.value = 0.42 + s * 0.5;
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.12;
      meshRef.current.rotation.z = s * 0.6;
      // gentle pointer parallax tilt
      meshRef.current.rotation.x += (p.y * 0.35 - meshRef.current.rotation.x) * 0.04;
      const sc = 1 - s * 0.28;
      meshRef.current.scale.setScalar(sc);
      meshRef.current.position.x = offsetX;
      meshRef.current.position.y = s * 1.2;
    }
  });

  return (
    <Icosahedron ref={meshRef} args={[1.3, 64]}>
      <shaderMaterial
        ref={matRef}
        vertexShader={blobVertex}
        fragmentShader={blobFragment}
        uniforms={uniforms}
      />
    </Icosahedron>
  );
}

/* Glassy wireframe shell around the blob */
function Halo({ scrollRef, offsetX = 0 }) {
  const ref = useRef();
  useFrame((state, delta) => {
    const s = scrollRef.current || 0;
    if (ref.current) {
      ref.current.rotation.y -= delta * 0.06;
      ref.current.rotation.x += delta * 0.02;
      ref.current.position.x = offsetX;
      ref.current.scale.setScalar(1.9 + s * 0.6);
      ref.current.material.opacity = 0.12 * (1 - s);
    }
  });
  return (
    <Icosahedron ref={ref} args={[1.35, 3]}>
      <meshBasicMaterial color={AZURE} wireframe transparent opacity={0.12} />
    </Icosahedron>
  );
}

/* Orbiting crystal shards */
function Shards({ scrollRef }) {
  const group = useRef();
  const shards = useMemo(() => {
    const arr = [];
    const N = 9;
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2;
      const r = 2.5 + Math.random() * 1.4;
      arr.push({
        pos: [Math.cos(a) * r, (Math.random() - 0.5) * 3, Math.sin(a) * r],
        scale: 0.1 + Math.random() * 0.16,
        speed: 0.4 + Math.random() * 0.6,
        color: i % 2 === 0 ? ORCHID : AZURE,
      });
    }
    return arr;
  }, []);

  useFrame((state, delta) => {
    const s = scrollRef.current || 0;
    if (group.current) {
      group.current.rotation.y += delta * 0.16;
      group.current.rotation.x = s * 0.5;
    }
  });

  return (
    <group ref={group}>
      {shards.map((sh, i) => (
        <Float key={i} speed={sh.speed} rotationIntensity={2} floatIntensity={2}>
          <Icosahedron args={[sh.scale, 0]} position={sh.pos}>
            <meshStandardMaterial
              color={sh.color}
              emissive={sh.color}
              emissiveIntensity={0.6}
              roughness={0.15}
              metalness={0.9}
              flatShading
            />
          </Icosahedron>
        </Float>
      ))}
    </group>
  );
}

/* Drifting stardust particle field */
function Particles({ count = 1400, scrollRef }) {
  const ref = useRef();
  const { positions, colors } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const c = new THREE.Color();
    for (let i = 0; i < count; i++) {
      const r = 3 + Math.random() * 9;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.cos(phi) * 0.6;
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
      c.copy(Math.random() > 0.5 ? ORCHID : AZURE).lerp(GOLD, Math.random() * 0.4);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    return { positions, colors };
  }, [count]);

  useFrame((state, delta) => {
    const s = scrollRef.current || 0;
    if (ref.current) {
      ref.current.rotation.y += delta * 0.03;
      ref.current.position.z = s * 4; // fly toward camera on scroll
      ref.current.material.opacity = 0.55 + s * 0.3;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={count} array={colors} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        size={0.035}
        vertexColors
        transparent
        opacity={0.6}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  );
}

/* Camera rig — pointer parallax + subtle scroll dolly */
function Rig({ pointerRef, scrollRef }) {
  const { camera } = useThree();
  useFrame(() => {
    const p = pointerRef.current || { x: 0, y: 0 };
    const s = scrollRef.current || 0;
    camera.position.x += (p.x * 0.9 - camera.position.x) * 0.05;
    camera.position.y += (-p.y * 0.6 - camera.position.y) * 0.05;
    camera.position.z = 5 - s * 1.2;
    camera.lookAt(0, s * 0.6, 0);
  });
  return null;
}

export default function Hero3DScene({ scrollRef, pointerRef, quality = "high" }) {
  const isLow = quality === "low";
  // On desktop the copy sits on the left → push the blob to the right.
  // On mobile the copy stacks below → keep it centred.
  const offsetX = isLow ? 0 : 1.15;
  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 45 }}
      dpr={isLow ? [1, 1.3] : [1, 2]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
    >
      <color attach="background" args={[NOIR]} />
      <fog attach="fog" args={[NOIR, 6, 16]} />

      <ambientLight intensity={0.6} />
      <pointLight position={[4, 3, 4]} intensity={40} color={AZURE} />
      <pointLight position={[-4, -2, 2]} intensity={30} color={ORCHID} />
      <Environment preset="night" />

      <Blob scrollRef={scrollRef} pointerRef={pointerRef} offsetX={offsetX} />
      <Halo scrollRef={scrollRef} offsetX={offsetX} />
      {!isLow && <Shards scrollRef={scrollRef} />}
      <Particles count={isLow ? 600 : 1400} scrollRef={scrollRef} />

      <Rig pointerRef={pointerRef} scrollRef={scrollRef} />

      <EffectComposer disableNormalPass multisampling={isLow ? 0 : 4}>
        <Bloom
          intensity={isLow ? 0.65 : 0.9}
          luminanceThreshold={0.32}
          luminanceSmoothing={0.9}
          mipmapBlur
        />
        {!isLow && (
          <ChromaticAberration
            blendFunction={BlendFunction.NORMAL}
            offset={[0.0006, 0.0009]}
          />
        )}
        <Vignette eskil={false} offset={0.25} darkness={0.85} />
      </EffectComposer>
    </Canvas>
  );
}
