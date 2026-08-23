"use client";

import { useRef, useMemo, useEffect, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Preload } from "@react-three/drei";
import * as THREE from "three";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// ─── Deep Corridor Particle Cloud ──────────────────────────────────────────────
// 3,200 transaction nodes distributed continuously along a 180-unit Z corridor
interface ParticleSystemProps {
  count: number;
}

function ParticleSystem({ count }: ParticleSystemProps) {
  const meshRef = useRef<THREE.Points>(null!);
  const flaggedRef = useRef<THREE.Points>(null!);

  const [positions, colors, flaggedPositions] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const flaggedCount = Math.floor(count * 0.05); // ~5% flagged transactions
    const flaggedPos = new Float32Array(flaggedCount * 3);

    const rng = (min: number, max: number) => Math.random() * (max - min) + min;

    let fi = 0;
    for (let i = 0; i < count; i++) {
      const angle = rng(0, Math.PI * 2);
      const radius = rng(1.8, 8.5);
      // Continuous deep corridor from z = 15 down to z = -170
      const z = rng(-160, 15);

      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;

      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;

      // Warm ambient particle color: warm cream/gold and subtle slate
      const isWarm = Math.random() > 0.4;
      if (isWarm) {
        col[i * 3] = 0.79;     // #C9A24D r
        col[i * 3 + 1] = 0.64; // g
        col[i * 3 + 2] = 0.30; // b
      } else {
        col[i * 3] = 0.35;
        col[i * 3 + 1] = 0.38;
        col[i * 3 + 2] = 0.55;
      }

      if (fi < flaggedCount && Math.random() < 0.08) {
        flaggedPos[fi * 3] = x * 0.9;
        flaggedPos[fi * 3 + 1] = y * 0.9;
        flaggedPos[fi * 3 + 2] = z;
        fi++;
      }
    }

    return [pos, col, flaggedPos];
  }, [count]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    if (meshRef.current) {
      meshRef.current.rotation.z = t * 0.02;
    }

    if (flaggedRef.current) {
      // Breathing pulse between amber and dusty rose
      const pulse = 0.5 + 0.5 * Math.sin(t * 3.0);
      const mat = flaggedRef.current.material as THREE.PointsMaterial;
      mat.opacity = 0.5 + pulse * 0.5;
      flaggedRef.current.rotation.z = t * 0.02;
    }
  });

  return (
    <group>
      {/* Legitimate transaction particles */}
      <points ref={meshRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[positions, 3]}
          />
          <bufferAttribute
            attach="attributes-color"
            args={[colors, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.07}
          vertexColors
          transparent
          opacity={0.65}
          sizeAttenuation
          depthWrite={false}
        />
      </points>

      {/* Flagged anomalous transactions — pulsing warm gold/coral */}
      <points ref={flaggedRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[flaggedPositions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.24}
          color={new THREE.Color("#C4707A")}
          transparent
          opacity={0.9}
          sizeAttenuation
          depthWrite={false}
        />
      </points>
    </group>
  );
}

// ─── Glass Panels along the Deep Corridor ──────────────────────────────────────
function GlassPanels() {
  const count = 36;
  const panels = useMemo(() => {
    const result = [];
    for (let i = 0; i < count; i++) {
      const angle = (i / 6) * Math.PI * 2 + (i % 2) * 0.3;
      const radius = 5.5 + Math.random() * 2.0;
      // Stretched along the whole Z-spine
      const z = -i * 4.2 + 5;
      const rotX = (Math.random() - 0.5) * 0.4;
      const rotY = angle + (Math.random() - 0.5) * 0.4;
      const scale = 0.8 + Math.random() * 1.2;
      result.push({ angle, radius, z, rotX, rotY, scale });
    }
    return result;
  }, []);

  return (
    <group>
      {panels.map((p, i) => (
        <mesh
          key={i}
          position={[
            Math.cos(p.angle) * p.radius,
            Math.sin(p.angle) * p.radius,
            p.z,
          ]}
          rotation={[p.rotX, p.rotY, 0]}
          scale={[p.scale * 1.6, p.scale, 1]}
        >
          <planeGeometry args={[1.4, 0.9]} />
          <meshPhysicalMaterial
            color="#C9A24D"
            transparent
            opacity={0.035}
            roughness={0.15}
            metalness={0.3}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}

// ─── Concentric Corridor Rings ────────────────────────────────────────────────
function TunnelRings() {
  const rings = useMemo(() => {
    return Array.from({ length: 38 }, (_, i) => ({
      z: -i * 4.4 + 10,
      radius: 6.2 + Math.sin(i * 0.35) * 0.8,
    }));
  }, []);

  return (
    <group>
      {rings.map((r, i) => (
        <mesh key={i} position={[0, 0, r.z]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[r.radius, 0.022, 8, 80]} />
          <meshBasicMaterial
            color={i % 4 === 0 ? "#C9A24D" : "#242436"}
            transparent
            opacity={i % 4 === 0 ? 0.28 : 0.12}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}

// ─── Single Full-Page Scroll Controller ────────────────────────────────────────
// Spans the entire document height (0% to 100%) to drive camera Z from 10 to -145
function FullPageCameraController({ isMobile }: { isMobile: boolean }) {
  const { camera } = useThree();

  useEffect(() => {
    const perspCam = camera as THREE.PerspectiveCamera;
    perspCam.position.set(0, 0, 10);
    perspCam.fov = isMobile ? 80 : 65;
    perspCam.updateProjectionMatrix();

    if (isMobile) {
      // Mobile: subtle drift
      const tween = gsap.to(perspCam.position, {
        z: -30,
        duration: 8,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
      });
      return () => {
        tween.kill();
      };
    }

    // Desktop: ONE GSAP ScrollTrigger spanning the entire page height
    const st = ScrollTrigger.create({
      trigger: typeof document !== "undefined" ? document.body : undefined,
      start: "top top",
      end: "bottom bottom",
      scrub: 1.2,
      onUpdate: (self) => {
        const progress = self.progress; // 0.0 to 1.0
        // Linearly traverse from z = +10 down to z = -145
        perspCam.position.z = 10 - progress * 155;
        // Subtle organic sway during descent
        perspCam.position.x = Math.sin(progress * Math.PI * 2) * 0.75;
        perspCam.position.y = Math.cos(progress * Math.PI * 2) * -0.4;
      },
    });

    return () => {
      st.kill();
    };
  }, [camera, isMobile]);

  return null;
}

// ─── Warm Corridor Ambient Lights ──────────────────────────────────────────────
function Lights() {
  return (
    <>
      <ambientLight intensity={0.25} />
      <pointLight position={[0, 0, 8]} intensity={2.5} color="#C9A24D" />
      <pointLight position={[4, 2, -35]} intensity={2.0} color="#E6C875" />
      <pointLight position={[-4, -2, -80]} intensity={2.0} color="#C4707A" />
      <pointLight position={[3, 3, -125]} intensity={2.5} color="#C9A24D" />
    </>
  );
}

// ─── Main HeroTunnel Component ─────────────────────────────────────────────────
export default function HeroTunnel() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const particleCount = isMobile ? 800 : 3200;

  return (
    <Canvas
      dpr={[1, isMobile ? 1.5 : 2]}
      camera={{ position: [0, 0, 10], fov: 65 }}
      gl={{
        antialias: !isMobile,
        powerPreference: "high-performance",
        alpha: true,
      }}
      style={{ background: "transparent" }}
      frameloop="always"
    >
      <Lights />
      <FullPageCameraController isMobile={isMobile} />
      <ParticleSystem count={particleCount} />
      <GlassPanels />
      <TunnelRings />
      <Preload all />
    </Canvas>
  );
}
