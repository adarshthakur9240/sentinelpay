"use client";

import { useRef, useMemo, useEffect, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Preload } from "@react-three/drei";
import * as THREE from "three";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// ─── Floating Soft Clay Sculptures Flanking Wide Flight Path (Strict Dual Pastel Palette) ───
function SoftClayCorridor() {
  const groupRef = useRef<THREE.Group>(null!);

  // Sculptures flanking the wide winding flight corridor (Z = +10 to -150)
  const sculptures = useMemo(() => {
    return [
      // Hero Viewport (Z = +8 to -12)
      { type: "smooth-torus", pos: [14.5, 3.0, 0], scale: 1.8, color: "#F2B8C6", rot: [0.6, 0.4, 0.2] },
      { type: "matte-sphere", pos: [-15.0, -2.5, -4], scale: 2.6, color: "#121218", rot: [0, 0, 0] },
      { type: "pill-capsule", pos: [15.5, -4.0, -8], scale: 1.5, color: "#A8B5E0", rot: [0.8, -0.4, 0.6] },
      { type: "clay-pebble", pos: [-13.5, 4.0, -12], scale: 2.0, color: "#A8B5E0", rot: [0.3, 0.8, -0.2] },

      // Insight Viewport (Z = -20 to -52)
      { type: "smooth-torus", pos: [-18.5, 2.5, -24], scale: 2.3, color: "#161620", rot: [0.2, 0.9, 0.4] },
      { type: "matte-sphere", pos: [19.0, -3.0, -32], scale: 3.0, color: "#F2B8C6", rot: [0, 0, 0] },
      { type: "pill-capsule", pos: [-17.0, -3.5, -40], scale: 1.9, color: "#A8B5E0", rot: [-0.5, 0.3, 0.8] },
      { type: "clay-pebble", pos: [18.0, 3.5, -48], scale: 2.2, color: "#F2B8C6", rot: [0.7, -0.6, 0.1] },

      // Metrics & Architecture Viewport (Z = -58 to -95)
      { type: "smooth-torus", pos: [19.5, 2.5, -62], scale: 2.6, color: "#F2B8C6", rot: [0.9, 0.2, -0.5] },
      { type: "matte-sphere", pos: [-19.0, -2.5, -72], scale: 3.2, color: "#121218", rot: [0, 0, 0] },
      { type: "pill-capsule", pos: [17.5, -4.0, -82], scale: 2.0, color: "#A8B5E0", rot: [0.4, 0.8, -0.3] },
      { type: "clay-pebble", pos: [-18.0, 3.8, -92], scale: 2.4, color: "#F2B8C6", rot: [-0.4, 0.5, 0.6] },

      // CTA & Final Destination Viewport (Z = -100 to -150)
      { type: "smooth-torus", pos: [-17.0, 2.5, -108], scale: 2.5, color: "#F2B8C6", rot: [0.3, -0.7, 0.5] },
      { type: "matte-sphere", pos: [17.5, -2.2, -120], scale: 3.4, color: "#161620", rot: [0, 0, 0] },
      { type: "pill-capsule", pos: [-15.0, -3.8, -132], scale: 2.1, color: "#A8B5E0", rot: [0.6, 0.2, -0.8] },
      { type: "clay-pebble", pos: [14.5, 3.0, -145], scale: 2.5, color: "#A8B5E0", rot: [0.5, 0.7, -0.4] },
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

  // Define 6 discrete energy connection paths bridging neighboring corridor sculptures
  const arcConfigs = useMemo(() => {
    return [
      { start: [14.5, 3.0, 0], end: [-15.0, -2.5, -4], color: "#F2B8C6", interval: 3.2, offset: 0 },
      { start: [-15.0, -2.5, -4], end: [15.5, -4.0, -8], color: "#A8B5E0", interval: 3.8, offset: 1.2 },
      { start: [-18.5, 2.5, -24], end: [19.0, -3.0, -32], color: "#F2B8C6", interval: 4.1, offset: 2.1 },
      { start: [19.0, -3.0, -32], end: [-17.0, -3.5, -40], color: "#A8B5E0", interval: 3.6, offset: 0.8 },
      { start: [19.5, 2.5, -62], end: [-19.0, -2.5, -72], color: "#A8B5E0", interval: 4.5, offset: 1.8 },
      { start: [-17.0, 2.5, -108], end: [17.5, -2.2, -120], color: "#F2B8C6", interval: 4.0, offset: 2.9 },
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
          const jitterAmp = 1.1;
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
        mat.opacity = pulse * 0.55;
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

// ─── Soft Ambient Particle Cloud with Dynamic Scroll Response ─────────────────
function DynamicClayDust({
  count,
  velocityRef,
}: {
  count: number;
  velocityRef: React.MutableRefObject<number>;
}) {
  const pointsRef = useRef<THREE.Points>(null!);

  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const radius = 3.0 + Math.random() * 18.0;
      const angle = Math.random() * Math.PI * 2;
      const z = -Math.random() * 170 + 15;

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
    const vel = Math.abs(velocityRef.current);

    if (pointsRef.current) {
      pointsRef.current.rotation.z = t * 0.012;

      // Subtle dynamic particle scale & opacity modulation during fast travel
      const mat = pointsRef.current.material as THREE.PointsMaterial;
      if (mat) {
        mat.size = 0.08 + Math.min(0.06, vel * 0.00004);
        mat.opacity = 0.42 + Math.min(0.22, vel * 0.00008);
      }
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
      <directionalLight position={[10, 14, 10]} intensity={2.2} color="#F7F6F3" />
      {/* Soft Rose Fill Light */}
      <directionalLight position={[-12, -6, 5]} intensity={1.6} color="#F2B8C6" />
      {/* Soft Periwinkle Rim Light */}
      <directionalLight position={[0, -10, -20]} intensity={1.4} color="#A8B5E0" />
      {/* Mid-Tunnel Soft Periwinkle Light */}
      <pointLight position={[8, 4, -60]} intensity={2.4} color="#A8B5E0" />
      {/* Deep-Tunnel Destination Rose Light */}
      <pointLight position={[-8, -4, -110]} intensity={2.6} color="#F2B8C6" />
    </>
  );
}

// ─── Unified High-Amplitude 3D Catmull-Rom Flight Controller with Dynamic Banking ───
function FullPageCameraController({
  isMobile,
  velocityRef,
}: {
  isMobile: boolean;
  velocityRef: React.MutableRefObject<number>;
}) {
  const { camera } = useThree();

  // Unified single parametric 3D flight spline in X-Y-Z space with substantial amplitude
  const flightSpline = useMemo(() => {
    const waypoints = [
      new THREE.Vector3(0, 0, 10),           // 0.00: Hero (Start Centered)
      new THREE.Vector3(12.5, 1.8, -25.0),    // 0.20: The 0.17% Challenge (Sweeps deep Right)
      new THREE.Vector3(-13.5, -1.5, -60.0),  // 0.42: Empirical Metrics (Curves deep Left)
      new THREE.Vector3(11.0, 1.2, -95.0),   // 0.68: Architecture Grid (Sweeps back Right)
      new THREE.Vector3(-6.5, -0.8, -125.0),  // 0.85: Pre-CTA Approach (Gentle counter curve)
      new THREE.Vector3(0, 0, -150.0),       // 1.00: Concluding Destination (Settles Centered)
    ];
    return new THREE.CatmullRomCurve3(waypoints, false, "catmullrom", 0.5);
  }, []);

  useEffect(() => {
    const perspCam = camera as THREE.PerspectiveCamera;
    const baseFov = isMobile ? 80 : 62;
    perspCam.position.set(0, 0, 10);
    perspCam.fov = baseFov;
    perspCam.updateProjectionMatrix();

    if (isMobile) {
      // Gentle floating animation on mobile with subtle weave
      const tween = gsap.to(perspCam.position, {
        z: -30,
        x: 3.5,
        duration: 8,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
      });
      return () => {
        tween.kill();
      };
    }

    // Continuous GSAP ScrollTrigger driving unified Catmull-Rom 3D flight trajectory + banking
    const st = ScrollTrigger.create({
      trigger: typeof document !== "undefined" ? document.body : undefined,
      start: "top top",
      end: "bottom bottom",
      scrub: 1.2,
      onUpdate: (self) => {
        const progress = THREE.MathUtils.clamp(self.progress, 0, 1);
        const point = flightSpline.getPointAt(progress);
        const tangent = flightSpline.getTangentAt(progress).normalize();

        // 1. Move camera position exactly along the 3D parametric curve
        perspCam.position.copy(point);

        // 2. Orient camera forward along the flight trajectory via look-ahead
        const lookAheadProgress = Math.min(1, progress + 0.045);
        const lookTarget = flightSpline.getPointAt(lookAheadProgress);
        perspCam.lookAt(lookTarget);

        // 3. Apply natural banking roll into curves proportional to lateral curvature (tangent.x)
        const bankingRoll = -tangent.x * 0.28;
        perspCam.rotation.z += bankingRoll;

        // 4. Subtle FOV dilation during rapid scroll for cinematic travel feel
        const velocity = self.getVelocity();
        velocityRef.current = velocity;
        const targetFov = baseFov + Math.min(6, Math.abs(velocity) * 0.002);
        perspCam.fov = targetFov;
        perspCam.updateProjectionMatrix();
      },
    });

    return () => {
      st.kill();
    };
  }, [camera, isMobile, flightSpline, velocityRef]);

  return null;
}

// ─── Main HeroTunnel Component ─────────────────────────────────────────────────
export default function HeroTunnel() {
  const [isMobile, setIsMobile] = useState(false);
  const velocityRef = useRef<number>(0);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const particleCount = isMobile ? 400 : 1200;

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
      <FullPageCameraController isMobile={isMobile} velocityRef={velocityRef} />
      <SoftClayCorridor />
      <DelicateEnergyArcs />
      <DynamicClayDust count={particleCount} velocityRef={velocityRef} />
      <Preload all />
    </Canvas>
  );
}
