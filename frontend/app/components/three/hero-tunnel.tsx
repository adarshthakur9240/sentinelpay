"use client";

import { useRef, useMemo, useEffect, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Preload } from "@react-three/drei";
import * as THREE from "three";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// ─── Floating Soft Clay Sculptures along Z-Spine (Strict Dual Pastel Palette) ───
function SoftClayCorridor() {
  const groupRef = useRef<THREE.Group>(null!);

  // Collection of soft clay sculptures along the Z-axis corridor (Z = +10 to -140)
  // Strictly dual pastel accents: soft rose (#F2B8C6) and soft periwinkle (#A8B5E0)
  const sculptures = useMemo(() => {
    return [
      // Hero Viewport (Z = +8 to -10)
      { type: "smooth-torus", pos: [4.5, 2.2, 0], scale: 1.4, color: "#F2B8C6", rot: [0.6, 0.4, 0.2] },
      { type: "matte-sphere", pos: [-5.2, -1.8, -4], scale: 2.1, color: "#121218", rot: [0, 0, 0] },
      { type: "pill-capsule", pos: [5.8, -3.2, -8], scale: 1.2, color: "#A8B5E0", rot: [0.8, -0.4, 0.6] },
      { type: "clay-pebble", pos: [-3.8, 3.5, -12], scale: 1.6, color: "#A8B5E0", rot: [0.3, 0.8, -0.2] },

      // Insight Viewport (Z = -20 to -50)
      { type: "smooth-torus", pos: [-4.8, 1.5, -24], scale: 1.8, color: "#161620", rot: [0.2, 0.9, 0.4] },
      { type: "matte-sphere", pos: [5.0, -2.5, -30], scale: 2.4, color: "#F2B8C6", rot: [0, 0, 0] },
      { type: "pill-capsule", pos: [-4.2, -3.0, -38], scale: 1.5, color: "#A8B5E0", rot: [-0.5, 0.3, 0.8] },
      { type: "clay-pebble", pos: [4.5, 3.0, -45], scale: 1.7, color: "#F2B8C6", rot: [0.7, -0.6, 0.1] },

      // Metrics & Architecture Viewport (Z = -55 to -95)
      { type: "smooth-torus", pos: [5.5, 1.8, -60], scale: 2.2, color: "#F2B8C6", rot: [0.9, 0.2, -0.5] },
      { type: "matte-sphere", pos: [-5.5, -2.0, -68], scale: 2.6, color: "#121218", rot: [0, 0, 0] },
      { type: "pill-capsule", pos: [4.0, -3.5, -78], scale: 1.6, color: "#A8B5E0", rot: [0.4, 0.8, -0.3] },
      { type: "clay-pebble", pos: [-4.5, 3.2, -88], scale: 2.0, color: "#F2B8C6", rot: [-0.4, 0.5, 0.6] },

      // CTA & Final Destination Viewport (Z = -100 to -145)
      { type: "smooth-torus", pos: [-4.2, 2.0, -105], scale: 2.0, color: "#F2B8C6", rot: [0.3, -0.7, 0.5] },
      { type: "matte-sphere", pos: [5.2, -1.5, -118], scale: 2.8, color: "#161620", rot: [0, 0, 0] },
      { type: "pill-capsule", pos: [-3.5, -3.2, -130], scale: 1.8, color: "#A8B5E0", rot: [0.6, 0.2, -0.8] },
      { type: "clay-pebble", pos: [4.2, 2.5, -140], scale: 2.2, color: "#A8B5E0", rot: [0.5, 0.7, -0.4] },
    ];
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (groupRef.current) {
      groupRef.current.children.forEach((child, i) => {
        child.rotation.x += 0.003 * (i % 2 === 0 ? 1 : -1);
        child.rotation.y += 0.004 * (i % 3 === 0 ? 1 : -1);
        child.position.y += Math.sin(t * 0.8 + i) * 0.002;
      });
    }
  });

  return (
    <group ref={groupRef}>
      {sculptures.map((item, idx) => (
        <group
          key={idx}
          position={item.pos as [number, number, number]}
          rotation={item.rot as [number, number, number]}
          scale={item.scale}
        >
          {item.type === "smooth-torus" && (
            <mesh>
              <torusGeometry args={[1.5, 0.5, 24, 48]} />
              <meshStandardMaterial
                color={item.color}
                roughness={0.65}
                metalness={0.12}
                transparent
                opacity={0.7}
              />
            </mesh>
          )}

          {item.type === "matte-sphere" && (
            <mesh>
              <sphereGeometry args={[1.3, 32, 32]} />
              <meshStandardMaterial
                color={item.color}
                roughness={0.75}
                metalness={0.08}
                transparent
                opacity={0.6}
              />
            </mesh>
          )}

          {item.type === "pill-capsule" && (
            <mesh>
              <capsuleGeometry args={[0.7, 1.6, 16, 32]} />
              <meshStandardMaterial
                color={item.color}
                roughness={0.6}
                metalness={0.15}
                transparent
                opacity={0.65}
              />
            </mesh>
          )}

          {item.type === "clay-pebble" && (
            <mesh>
              <icosahedronGeometry args={[1.2, 2]} />
              <meshStandardMaterial
                color={item.color}
                roughness={0.7}
                metalness={0.1}
                transparent
                opacity={0.65}
              />
            </mesh>
          )}
        </group>
      ))}
    </group>
  );
}

// ─── Delicate Pastel Energy Arcs / Lightning Visual Accent ─────────────────────
function DelicateEnergyArcs() {
  const groupRef = useRef<THREE.Group>(null!);

  // Define 6 discrete energy connection paths between neighboring corridor regions
  const arcConfigs = useMemo(() => {
    return [
      { start: [4.5, 2.2, 0], end: [-5.2, -1.8, -4], color: "#F2B8C6", interval: 3.2, offset: 0 },
      { start: [-5.2, -1.8, -4], end: [5.8, -3.2, -8], color: "#A8B5E0", interval: 3.8, offset: 1.2 },
      { start: [-4.8, 1.5, -24], end: [5.0, -2.5, -30], color: "#F2B8C6", interval: 4.1, offset: 2.1 },
      { start: [5.0, -2.5, -30], end: [-4.2, -3.0, -38], color: "#A8B5E0", interval: 3.6, offset: 0.8 },
      { start: [5.5, 1.8, -60], end: [-5.5, -2.0, -68], color: "#A8B5E0", interval: 4.5, offset: 1.8 },
      { start: [-4.2, 2.0, -105], end: [5.2, -1.5, -118], color: "#F2B8C6", interval: 4.0, offset: 2.9 },
    ];
  }, []);

  // Pre-generate Three.js Line objects with jagged vertices
  const arcLines = useMemo(() => {
    return arcConfigs.map((config) => {
      const pStart = new THREE.Vector3(...(config.start as [number, number, number]));
      const pEnd = new THREE.Vector3(...(config.end as [number, number, number]));
      const points: THREE.Vector3[] = [];
      const segments = 8;

      for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const pt = new THREE.Vector3().lerpVectors(pStart, pEnd, t);
        if (i > 0 && i < segments) {
          const jitterAmp = 0.65;
          pt.x += (Math.random() - 0.5) * jitterAmp;
          pt.y += (Math.random() - 0.5) * jitterAmp;
          pt.z += (Math.random() - 0.5) * jitterAmp;
        }
        points.push(pt);
      }

      const geom = new THREE.BufferGeometry().setFromPoints(points);
      const mat = new THREE.LineBasicMaterial({
        color: new THREE.Color(config.color),
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
      });

      return new THREE.Line(geom, mat);
    });
  }, [arcConfigs]);

  // Subtle pulsing animation for each arc
  useFrame((state) => {
    const time = state.clock.elapsedTime;
    arcLines.forEach((line, i) => {
      const config = arcConfigs[i];
      if (!config) return;

      const mat = line.material as THREE.LineBasicMaterial;
      const cycleTime = (time + config.offset) % config.interval;

      // Flash pulse for 0.4s during each cycle
      if (cycleTime < 0.4) {
        const pulse = Math.sin((cycleTime / 0.4) * Math.PI);
        mat.opacity = pulse * 0.48;
      } else {
        mat.opacity = 0;
      }
    });
  });

  return (
    <group ref={groupRef}>
      {arcLines.map((line, idx) => (
        <primitive key={idx} object={line} />
      ))}
    </group>
  );
}

// ─── Soft Ambient Matte Particle Cloud ─────────────────────────────────────────
function SoftClayDust({ count }: { count: number }) {
  const pointsRef = useRef<THREE.Points>(null!);

  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const radius = 2.5 + Math.random() * 8.5;
      const angle = Math.random() * Math.PI * 2;
      const z = -Math.random() * 160 + 15;

      pos[i * 3] = Math.cos(angle) * radius;
      pos[i * 3 + 1] = Math.sin(angle) * radius;
      pos[i * 3 + 2] = z;

      const isRose = Math.random() > 0.5;
      if (isRose) {
        // Soft blush rose (#F2B8C6)
        col[i * 3] = 0.95;
        col[i * 3 + 1] = 0.72;
        col[i * 3 + 2] = 0.78;
      } else {
        // Soft periwinkle (#A8B5E0)
        col[i * 3] = 0.66;
        col[i * 3 + 1] = 0.71;
        col[i * 3 + 2] = 0.88;
      }
    }

    return [pos, col];
  }, [count]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (pointsRef.current) {
      pointsRef.current.rotation.z = t * 0.012;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.08}
        vertexColors
        transparent
        opacity={0.42}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

// ─── Studio Lighting Setup (Dual Pastel Theme) ─────────────────────────────────
function StudioLights() {
  return (
    <>
      <ambientLight intensity={0.48} />
      {/* Warm Key Light */}
      <directionalLight position={[8, 12, 10]} intensity={2.2} color="#F7F6F3" />
      {/* Soft Rose Fill Light */}
      <directionalLight position={[-8, -6, 5]} intensity={1.6} color="#F2B8C6" />
      {/* Soft Periwinkle Rim Light */}
      <directionalLight position={[0, -10, -20]} intensity={1.4} color="#A8B5E0" />
      {/* Mid-Tunnel Soft Periwinkle Light */}
      <pointLight position={[5, 4, -60]} intensity={2.2} color="#A8B5E0" />
      {/* Deep-Tunnel Destination Rose Light */}
      <pointLight position={[-5, -4, -110]} intensity={2.4} color="#F2B8C6" />
    </>
  );
}

// ─── Combined X + Z Camera Motion (Winding Corridor Journey) ────────────────────
function FullPageCameraController({ isMobile }: { isMobile: boolean }) {
  const { camera } = useThree();

  useEffect(() => {
    const perspCam = camera as THREE.PerspectiveCamera;
    perspCam.position.set(0, 0, 10);
    perspCam.fov = isMobile ? 80 : 62;
    perspCam.updateProjectionMatrix();

    if (isMobile) {
      // Gentle floating animation on mobile with subtle X/Z weave
      const tween = gsap.to(perspCam.position, {
        z: -30,
        x: 1.5,
        duration: 8,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
      });
      return () => {
        tween.kill();
      };
    }

    // Continuous GSAP ScrollTrigger driving combined X+Z winding trajectory
    const st = ScrollTrigger.create({
      trigger: typeof document !== "undefined" ? document.body : undefined,
      start: "top top",
      end: "bottom bottom",
      scrub: 1.2,
      onUpdate: (self) => {
        const progress = self.progress; // 0.0 -> 1.0

        // Forward Z travel along the corridor (+10 down to -145)
        perspCam.position.z = 10 - progress * 155;

        // Elegant winding S-curve lateral drift (X-axis) tied to scroll
        const dampingFactor = 1 - Math.pow(progress, 3) * 0.45;
        const driftX = Math.sin(progress * Math.PI * 3.5) * 2.8 * dampingFactor;
        perspCam.position.x = driftX;

        // Subtle vertical elevation contour (Y-axis)
        const driftY = Math.cos(progress * Math.PI * 2.5) * 1.1 * dampingFactor;
        perspCam.position.y = driftY;

        // Subtle natural camera roll and banking on curves
        perspCam.rotation.z = -Math.cos(progress * Math.PI * 3.5) * 0.032 * dampingFactor;
        perspCam.rotation.y = -Math.cos(progress * Math.PI * 3.5) * 0.04 * dampingFactor;
      },
    });

    return () => {
      st.kill();
    };
  }, [camera, isMobile]);

  return null;
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

  const particleCount = isMobile ? 400 : 1100;

  return (
    <Canvas
      dpr={[1, isMobile ? 1.5 : 2]}
      camera={{ position: [0, 0, 10], fov: 62 }}
      gl={{
        antialias: !isMobile,
        powerPreference: "high-performance",
        alpha: true,
      }}
      style={{ background: "transparent" }}
      frameloop="always"
    >
      <StudioLights />
      <FullPageCameraController isMobile={isMobile} />
      <SoftClayCorridor />
      <DelicateEnergyArcs />
      <SoftClayDust count={particleCount} />
      <Preload all />
    </Canvas>
  );
}
