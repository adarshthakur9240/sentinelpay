"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Preload } from "@react-three/drei";
import * as THREE from "three";

function FloatingClayElements() {
  const groupRef = useRef<THREE.Group>(null!);
  const particlesRef = useRef<THREE.Points>(null!);

  const [particlePositions, particleColors] = useMemo(() => {
    const count = 350;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 28;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 24;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 16 - 4;

      const isRose = Math.random() > 0.5;
      if (isRose) {
        // Soft blush rose
        col[i * 3] = 0.95;
        col[i * 3 + 1] = 0.72;
        col[i * 3 + 2] = 0.78;
      } else {
        // Soft periwinkle
        col[i * 3] = 0.66;
        col[i * 3 + 1] = 0.71;
        col[i * 3 + 2] = 0.88;
      }
    }

    return [pos, col];
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (groupRef.current) {
      groupRef.current.rotation.y = t * 0.04;
      groupRef.current.rotation.x = Math.sin(t * 0.03) * 0.08;
    }
    if (particlesRef.current) {
      particlesRef.current.rotation.y = t * 0.02;
    }
  });

  return (
    <>
      <group ref={groupRef}>
        {/* Soft Torus in Upper Corner */}
        <Float speed={1.5} rotationIntensity={0.6} floatIntensity={0.8} position={[10, 6, -6]}>
          <mesh rotation={[0.4, 0.2, 0.3]}>
            <torusGeometry args={[3.2, 0.8, 24, 64]} />
            <meshStandardMaterial
              color="#161622"
              roughness={0.65}
              metalness={0.12}
              transparent
              opacity={0.35}
            />
          </mesh>
        </Float>

        {/* Soft Rounded Clay Icosahedron in Lower Left */}
        <Float speed={1.8} rotationIntensity={0.8} floatIntensity={0.9} position={[-11, -7, -8]}>
          <mesh rotation={[0.2, 0.5, 0.1]}>
            <icosahedronGeometry args={[2.8, 1]} />
            <meshStandardMaterial
              color="#121218"
              roughness={0.6}
              metalness={0.15}
              transparent
              opacity={0.35}
            />
          </mesh>
        </Float>
      </group>

      {/* Ambient Particle Field */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[particlePositions, 3]}
          />
          <bufferAttribute
            attach="attributes-color"
            args={[particleColors, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.06}
          vertexColors
          transparent
          opacity={0.32}
          sizeAttenuation
          depthWrite={false}
        />
      </points>
    </>
  );
}

export default function AmbientClayBackground() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden opacity-40">
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 14], fov: 50 }}
        gl={{ antialias: false, powerPreference: "high-performance", alpha: true }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.45} />
        <directionalLight position={[10, 10, 5]} intensity={1.5} color="#F2B8C6" />
        <directionalLight position={[-10, -10, -5]} intensity={1.2} color="#A8B5E0" />
        <FloatingClayElements />
        <Preload all />
      </Canvas>
    </div>
  );
}
