/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Points, PointMaterial, MeshDistortMaterial, Sphere, Torus, Environment } from '@react-three/drei';
import * as THREE from 'three';

const DataParticles = () => {
  const count = 200;
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 15;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 15;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }
    return pos;
  }, []);

  const ref = useRef<THREE.Points>(null);

  useFrame((state) => {
    if (ref.current) {
        const t = state.clock.getElapsedTime();
        ref.current.rotation.x = t * 0.05;
        ref.current.rotation.y = t * 0.03;
    }
  });

  return (
    <Points ref={ref} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color="#000000"
        size={0.03}
        sizeAttenuation={true}
        depthWrite={false}
        opacity={0.8}
      />
    </Points>
  );
};

const MarketCycleRing = ({ radius, rotationSpeed, color }: { radius: number, rotationSpeed: number, color: string }) => {
  const ref = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (ref.current) {
       const t = state.clock.getElapsedTime();
       ref.current.rotation.x = Math.PI / 2 + Math.sin(t * 0.2) * 0.1;
       ref.current.rotation.z = t * rotationSpeed;
    }
  });

  return (
    <Torus ref={ref} args={[radius, 0.01, 16, 100]} rotation={[Math.PI / 2, 0, 0]}>
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0} transparent opacity={0.5} />
    </Torus>
  );
}

const CoreEntity = () => {
    const ref = useRef<THREE.Mesh>(null);
    useFrame((state) => {
        if (ref.current) {
            const t = state.clock.getElapsedTime();
            ref.current.rotation.y = t * 0.2;
        }
    });
    return (
        <Sphere ref={ref} args={[0.8, 64, 64]}>
             <MeshDistortMaterial
                color="#ffffff"
                envMapIntensity={1}
                clearcoat={1}
                clearcoatRoughness={0.1}
                metalness={0.1}
                roughness={0.1}
                distort={0.4}
                speed={1.5}
                wireframe
            />
        </Sphere>
    )
}

export const HeroScene: React.FC = () => {
  return (
    <div className="absolute inset-0 z-0 opacity-100 pointer-events-none grayscale">
      <Canvas camera={{ position: [0, 0, 8], fov: 45 }}>
        <color attach="background" args={['#ffffff']} />
        <ambientLight intensity={1} />
        <pointLight position={[10, 10, 10]} intensity={1} color="#000" />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#000" />
        
        <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
          <CoreEntity />
          <MarketCycleRing radius={2} rotationSpeed={0.1} color="#000000" />
          <MarketCycleRing radius={3.5} rotationSpeed={-0.05} color="#666666" />
        </Float>
        
        <DataParticles />
        <Environment preset="studio" />
      </Canvas>
    </div>
  );
};