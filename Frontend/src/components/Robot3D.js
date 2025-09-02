import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Box, Sphere, Cylinder } from '@react-three/drei';
import { gsap } from 'gsap';
import * as THREE from 'three';

// Robot Component
function Robot({ position = [0, 0, 0] }) {
  const robotRef = useRef();
  const headRef = useRef();
  const leftArmRef = useRef();
  const rightArmRef = useRef();
  const eyesRef = useRef();
  
  useEffect(() => {
    // GSAP animations for robot movements
    const tl = gsap.timeline({ repeat: -1, yoyo: true });
    
    // Breathing animation
    tl.to(robotRef.current.scale, {
      duration: 2,
      y: 1.05,
      ease: "power2.inOut"
    });
    
    // Head rotation
    gsap.to(headRef.current.rotation, {
      duration: 4,
      y: Math.PI * 0.2,
      repeat: -1,
      yoyo: true,
      ease: "power2.inOut"
    });
    
    // Arm movements
    gsap.to(leftArmRef.current.rotation, {
      duration: 3,
      z: Math.PI * 0.1,
      repeat: -1,
      yoyo: true,
      ease: "power2.inOut"
    });
    
    gsap.to(rightArmRef.current.rotation, {
      duration: 3.5,
      z: -Math.PI * 0.1,
      repeat: -1,
      yoyo: true,
      ease: "power2.inOut"
    });
    
    // Eye glow animation
    gsap.to(eyesRef.current.material, {
      duration: 1.5,
      emissiveIntensity: 0.8,
      repeat: -1,
      yoyo: true,
      ease: "power2.inOut"
    });
    
  }, []);

  useFrame((state) => {
    // Subtle floating animation
    if (robotRef.current) {
      robotRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime) * 0.1;
    }
  });

  return (
    <group ref={robotRef} position={position}>
      {/* Robot Body */}
      <Box ref={robotRef} args={[1.2, 2, 0.8]} position={[0, 0, 0]}>
        <meshStandardMaterial 
          color="#1a1a1a" 
          metalness={0.8} 
          roughness={0.2}
          envMapIntensity={1}
        />
      </Box>
      
      {/* Robot Head */}
      <group ref={headRef} position={[0, 1.5, 0]}>
        <Box args={[1, 1, 0.8]}>
          <meshStandardMaterial 
            color="#2a2a2a" 
            metalness={0.9} 
            roughness={0.1}
          />
        </Box>
        
        {/* Eyes */}
        <group ref={eyesRef}>
          <Sphere args={[0.1]} position={[-0.25, 0.1, 0.4]}>
            <meshStandardMaterial 
              color="#00ffff" 
              emissive="#00ffff"
              emissiveIntensity={0.5}
            />
          </Sphere>
          <Sphere args={[0.1]} position={[0.25, 0.1, 0.4]}>
            <meshStandardMaterial 
              color="#00ffff" 
              emissive="#00ffff"
              emissiveIntensity={0.5}
            />
          </Sphere>
        </group>
        
        {/* Mouth/Display */}
        <Box args={[0.6, 0.1, 0.05]} position={[0, -0.2, 0.4]}>
          <meshStandardMaterial 
            color="#00ffff" 
            emissive="#00ffff"
            emissiveIntensity={0.3}
          />
        </Box>
      </group>
      
      {/* Left Arm */}
      <group ref={leftArmRef} position={[-0.8, 0.5, 0]}>
        <Cylinder args={[0.15, 0.15, 1.5]} rotation={[0, 0, Math.PI / 2]}>
          <meshStandardMaterial 
            color="#1a1a1a" 
            metalness={0.8} 
            roughness={0.2}
          />
        </Cylinder>
        
        {/* Left Hand */}
        <Sphere args={[0.2]} position={[-0.8, 0, 0]}>
          <meshStandardMaterial 
            color="#2a2a2a" 
            metalness={0.9} 
            roughness={0.1}
          />
        </Sphere>
      </group>
      
      {/* Right Arm */}
      <group ref={rightArmRef} position={[0.8, 0.5, 0]}>
        <Cylinder args={[0.15, 0.15, 1.5]} rotation={[0, 0, Math.PI / 2]}>
          <meshStandardMaterial 
            color="#1a1a1a" 
            metalness={0.8} 
            roughness={0.2}
          />
        </Cylinder>
        
        {/* Right Hand */}
        <Sphere args={[0.2]} position={[0.8, 0, 0]}>
          <meshStandardMaterial 
            color="#2a2a2a" 
            metalness={0.9} 
            roughness={0.1}
          />
        </Sphere>
      </group>
      
      {/* Legs */}
      <Cylinder args={[0.2, 0.2, 1.5]} position={[-0.3, -1.5, 0]}>
        <meshStandardMaterial 
          color="#1a1a1a" 
          metalness={0.8} 
          roughness={0.2}
        />
      </Cylinder>
      <Cylinder args={[0.2, 0.2, 1.5]} position={[0.3, -1.5, 0]}>
        <meshStandardMaterial 
          color="#1a1a1a" 
          metalness={0.8} 
          roughness={0.2}
        />
      </Cylinder>
      
      {/* Feet */}
      <Box args={[0.4, 0.2, 0.6]} position={[-0.3, -2.4, 0.1]}>
        <meshStandardMaterial 
          color="#2a2a2a" 
          metalness={0.9} 
          roughness={0.1}
        />
      </Box>
      <Box args={[0.4, 0.2, 0.6]} position={[0.3, -2.4, 0.1]}>
        <meshStandardMaterial 
          color="#2a2a2a" 
          metalness={0.9} 
          roughness={0.1}
        />
      </Box>
    </group>
  );
}



// Main 3D Scene Component
function Robot3DScene() {
  return (
    <div className="w-full h-96 bg-black rounded-3xl overflow-hidden border border-white/10">
      <Canvas
        camera={{ position: [0, 1, 6], fov: 50 }}
        style={{ background: 'linear-gradient(135deg, #000000 0%, #0a0a0a 50%, #111111 100%)' }}
      >
        {/* Lighting */}
        <ambientLight intensity={0.2} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} />
        <pointLight position={[0, 5, 0]} color="#00ffff" intensity={0.6} />
        <spotLight position={[0, 8, 0]} angle={0.4} penumbra={1} intensity={1} />
        
        {/* Robot Only */}
        <Robot position={[0, -1, 0]} />
        
        {/* Environment - Simple Platform */}
        <Box args={[8, 0.2, 8]} position={[0, -3.5, 0]}>
          <meshStandardMaterial color="#0a0a1a" metalness={0.9} roughness={0.1} />
        </Box>
        
        {/* Subtle Floating Particles */}
        {[...Array(8)].map((_, i) => (
          <Sphere
            key={i}
            args={[0.03]}
            position={[
              (Math.random() - 0.5) * 6,
              Math.random() * 3 + 1,
              (Math.random() - 0.5) * 6
            ]}
          >
            <meshStandardMaterial 
              color="#00ffff" 
              emissive="#00ffff"
              emissiveIntensity={0.4}
            />
          </Sphere>
        ))}
        
        <OrbitControls 
          enableZoom={false} 
          enablePan={false} 
          maxPolarAngle={Math.PI / 2}
          minPolarAngle={Math.PI / 4}
          autoRotate={true}
          autoRotateSpeed={0.5}
        />
      </Canvas>
      

    </div>
  );
}

export default Robot3DScene;