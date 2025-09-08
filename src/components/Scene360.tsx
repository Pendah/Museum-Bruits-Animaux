import { useRef, useEffect, Suspense } from 'react';
import { Canvas, useFrame, useThree, useLoader } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { TextureLoader } from 'three';
import { useDeviceOrientation } from '../hooks/useDeviceOrientation';
import type { Animal } from '../types';

interface Scene360Props {
  textureUrl?: string;
  onDirectionChange?: (direction: THREE.Vector3) => void;
  useGyroscope?: boolean;
  animals?: Animal[];
  currentlyPlayingAnimal?: Animal | null;
  onAnimalClick?: (animal: Animal) => void;
}

function ForestEnvironment({ textureUrl }: { textureUrl?: string }) {
  const texture = useLoader(TextureLoader, textureUrl || '/assets/textures/default.jpg');

  useEffect(() => {
    if (texture && textureUrl) {
      console.log('Texture chargée avec useLoader');
      // Configuration spécifique pour les textures 360°
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;
      texture.flipY = false;
      texture.needsUpdate = true;
    }
  }, [texture, textureUrl]);

  return (
    <mesh>
      <sphereGeometry args={[10, 32, 32]} />
      <meshBasicMaterial 
        map={textureUrl ? texture : undefined}
        color={textureUrl ? "#ffffff" : "#ff0000"}
        side={THREE.BackSide}
      />
    </mesh>
  );
}

interface CameraControllerProps {
  orientation: {
    alpha: number | null;
    beta: number | null;
    gamma: number | null;
  };
  onDirectionChange?: (direction: THREE.Vector3) => void;
}

function CameraController({ 
  orientation, 
  onDirectionChange 
}: CameraControllerProps) {
  const { camera } = useThree();
  const initialRotation = useRef<THREE.Euler | null>(null);

  useFrame(() => {
    if (orientation.alpha !== null && orientation.beta !== null && orientation.gamma !== null) {
      if (!initialRotation.current) {
        initialRotation.current = camera.rotation.clone();
      }

      const alpha = orientation.alpha * Math.PI / 180;
      const beta = orientation.beta * Math.PI / 180;
      const gamma = orientation.gamma * Math.PI / 180;

      camera.rotation.set(
        beta + initialRotation.current.x,
        alpha + initialRotation.current.y,
        gamma + initialRotation.current.z
      );

      if (onDirectionChange) {
        const direction = new THREE.Vector3(0, 0, -1);
        direction.applyQuaternion(camera.quaternion);
        onDirectionChange(direction);
      }
    }
  });

  return null;
}

// Composant d'onde sonore animée
function SoundWave({ radius, opacity, speed }: { radius: number, opacity: number, speed: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      const time = state.clock.getElapsedTime();
      const scale = 1 + Math.sin(time * speed) * 0.3;
      meshRef.current.scale.setScalar(scale);
    }
  });
  
  return (
    <mesh ref={meshRef}>
      <ringGeometry args={[radius * 0.8, radius, 32]} />
      <meshBasicMaterial 
        color="#00ffff" 
        transparent={true}
        opacity={opacity}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// Marqueur 2D cliquable avec animation d'ondes
function ClickableAnimalMarker({ animal, onAnimalClick }: { 
  animal: Animal, 
  onAnimalClick: (animal: Animal) => void 
}) {
  const { camera } = useThree();
  const groupRef = useRef<THREE.Group>(null);
  
  // Normaliser la position pour qu'elle soit sur la sphère intérieure (rayon 5)
  const originalPos = new THREE.Vector3(animal.position.x, animal.position.y, animal.position.z);
  const normalizedPos = originalPos.normalize().multiplyScalar(5);
  
  // Faire face à la caméra en permanence
  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.lookAt(camera.position);
    }
  });
  
  const handleClick = (e: THREE.Event) => {
    e.stopPropagation();
    console.log(`🎯 Clic sur ${animal.name}`);
    onAnimalClick(animal);
  };
  
  return (
    <group 
      ref={groupRef} 
      position={[normalizedPos.x, normalizedPos.y, normalizedPos.z]}
    >
      {/* Zone de clic invisible mais large */}
      <mesh onClick={handleClick}>
        <planeGeometry args={[3, 3]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
      
      {/* Centre : petit cercle plein */}
      <mesh>
        <circleGeometry args={[0.3, 16]} />
        <meshBasicMaterial 
          color="#ff4444" 
          transparent={true}
          opacity={0.9}
        />
      </mesh>
      
      {/* Ondes sonores animées - 3 cercles concentriques */}
      <SoundWave radius={0.6} opacity={0.7} speed={2} />
      <SoundWave radius={0.9} opacity={0.5} speed={1.5} />
      <SoundWave radius={1.2} opacity={0.3} speed={1} />
      
      {/* Indicateur pulsant au centre */}
      <mesh>
        <circleGeometry args={[0.1, 8]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
    </group>
  );
}

function AnimalMarkers({ animals, currentlyPlayingAnimal, onAnimalClick }: { 
  animals: Animal[], 
  currentlyPlayingAnimal: Animal | null,
  onAnimalClick: (animal: Animal) => void
}) {
  return (
    <>
      {animals.map((animal) => {
        const isPlaying = currentlyPlayingAnimal?.id === animal.id;
        
        if (!isPlaying) return null; // Afficher seulement l'animal actuel
        
        return (
          <ClickableAnimalMarker 
            key={animal.id}
            animal={animal}
            onAnimalClick={onAnimalClick}
          />
        );
      })}
    </>
  );
}


// Composant qui track la direction de la caméra en temps réel
function CameraTracker({ onDirectionChange, useGyroscope }: {
  onDirectionChange?: (direction: THREE.Vector3) => void;
  useGyroscope: boolean;
}) {
  const { camera } = useThree();
  const frameCount = useRef(0);
  
  useFrame(() => {
    frameCount.current++;
    
    if (onDirectionChange) {
      // TEMPORAIRE: Toujours récupérer la direction pour debug
      const direction = new THREE.Vector3(0, 0, -1);
      direction.applyQuaternion(camera.quaternion);
      onDirectionChange(direction);
      
      // Debug tous les 60 frames (1 sec à 60fps) pour ne pas spammer
      if (frameCount.current % 60 === 0) {
        console.log(`📷 Caméra direction: [${direction.x.toFixed(2)}, ${direction.y.toFixed(2)}, ${direction.z.toFixed(2)}] | Mode: ${useGyroscope ? 'Gyro' : 'Tactile'}`);
      }
    }
  });

  return null;
}

export const Scene360: React.FC<Scene360Props> = ({ 
  textureUrl, 
  onDirectionChange,
  useGyroscope = true,
  animals = [],
  currentlyPlayingAnimal = null,
  onAnimalClick
}) => {
  const { orientation } = useDeviceOrientation();

  const handleAnimalClick = (animal: Animal) => {
    if (onAnimalClick) {
      onAnimalClick(animal);
    }
  };

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Canvas
        camera={{
          position: [0, 0, 0.1],
          fov: 90,
          near: 0.1,
          far: 1000
        }}
      >
        <Suspense fallback={null}>
          <ForestEnvironment textureUrl={textureUrl} />
          
          {/* Marqueurs des animaux cliquables */}
          <AnimalMarkers 
            animals={animals}
            currentlyPlayingAnimal={currentlyPlayingAnimal}
            onAnimalClick={handleAnimalClick}
          />
          
          {useGyroscope && (
            <CameraController 
              orientation={orientation}
              onDirectionChange={onDirectionChange}
            />
          )}
          {!useGyroscope && (
            <OrbitControls 
              enableZoom={false}
              enablePan={false}
              rotateSpeed={0.5}
            />
          )}
          
          {/* Tracker de direction caméra */}
          <CameraTracker 
            onDirectionChange={onDirectionChange}
            useGyroscope={useGyroscope}
          />
        </Suspense>
      </Canvas>
    </div>
  );
};