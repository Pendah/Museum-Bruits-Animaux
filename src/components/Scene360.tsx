import { useRef, useEffect, Suspense } from "react";
import { Canvas, useFrame, useThree, useLoader } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { TextureLoader } from "three";
import { useDeviceOrientation } from "../hooks/useDeviceOrientation";
import type { Animal } from "../types";

interface DetectionState {
  distance: number;
  angle: number;
  isNearby: boolean;
  canClick: boolean;
  hintLevel: 'far' | 'medium' | 'close' | 'veryClose';
  showHint: boolean;
}

interface Scene360Props {
  textureUrl?: string;
  useGyroscope?: boolean;
  animals?: Animal[];
  currentlyPlayingAnimal?: Animal | null;
  onAnimalClick?: (animal: Animal) => void;
  onDetectionUpdate?: (state: DetectionState | null) => void;
  updateVolumeByAngle?: (animalId: string, angleDegrees: number) => void;
  gameState?: {
    discoveredAnimals: string[];
    isListening: boolean;
  };
  onAnimalDiscovered?: (animal: Animal) => void;
}

// Composant pour le bouton de recalibration
function CalibrationButton({ onRecalibrate }: { onRecalibrate: () => void }) {
  return (
    <div style={{
      position: 'absolute',
      top: '20px',
      left: '20px',
      zIndex: 100
    }}>
      <button
        onClick={onRecalibrate}
        style={{
          background: 'rgba(0, 0, 0, 0.7)',
          border: 'none',
          color: 'white',
          padding: '8px 12px',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '12px'
        }}
      >
        📍 Recalibrer
      </button>
    </div>
  );
}

function ForestEnvironment({ textureUrl }: { textureUrl?: string }) {
  const texture = useLoader(
    TextureLoader,
    textureUrl || "/assets/textures/default.jpg"
  );

  useEffect(() => {
    if (texture && textureUrl) {
      console.log("Texture chargée avec useLoader");
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
  recalibrateRef?: React.MutableRefObject<(() => void) | null>;
}

function CameraController({
  orientation,
  onDirectionChange,
  recalibrateRef,
}: CameraControllerProps) {
  const { camera } = useThree();
  const initialOrientation = useRef<{ alpha: number; beta: number; gamma: number } | null>(null);
  const smoothedRotation = useRef(new THREE.Euler());
  
  // Fonction de recalibration
  const recalibrate = () => {
    if (orientation.alpha !== null && orientation.beta !== null && orientation.gamma !== null) {
      initialOrientation.current = {
        alpha: orientation.alpha,
        beta: orientation.beta,
        gamma: orientation.gamma
      };
      // Reset la rotation lissée
      smoothedRotation.current.set(0, 0, 0);
      console.log('🧭 Gyroscope recalibré');
    }
  };
  
  // Exposer la fonction de recalibration
  if (recalibrateRef) {
    recalibrateRef.current = recalibrate;
  }
  
  useFrame(() => {
    if (
      orientation.alpha !== null &&
      orientation.beta !== null &&
      orientation.gamma !== null
    ) {
      // Calibration initiale - définir l'orientation de départ
      if (!initialOrientation.current) {
        initialOrientation.current = {
          alpha: orientation.alpha,
          beta: orientation.beta,
          gamma: orientation.gamma
        };
        return; // Skip le premier frame pour la calibration
      }

      // Calculer les deltas par rapport à la position initiale
      const deltaAlpha = orientation.alpha - initialOrientation.current.alpha;
      const deltaBeta = orientation.beta - initialOrientation.current.beta;
      const deltaGamma = orientation.gamma - initialOrientation.current.gamma;
      
      // Gestion du wrap-around pour alpha (0-360°)
      let normalizedAlpha = deltaAlpha;
      if (normalizedAlpha > 180) normalizedAlpha -= 360;
      if (normalizedAlpha < -180) normalizedAlpha += 360;

      // Conversion en radians avec mapping amélioré
      const yaw = -(normalizedAlpha * Math.PI) / 180; // Rotation horizontale (Y)
      const pitch = -(deltaBeta * Math.PI) / 180; // Rotation verticale (X)
      const roll = (deltaGamma * Math.PI) / 180; // Roulis (Z) - optionnel

      // Clamping pour éviter les rotations extrêmes
      const clampedPitch = Math.max(-Math.PI/3, Math.min(Math.PI/3, pitch));
      
      // Lissage des mouvements pour éviter les secousses
      const smoothingFactor = 0.1;
      const targetRotation = new THREE.Euler(clampedPitch, yaw, 0, 'YXZ');
      
      smoothedRotation.current.x = THREE.MathUtils.lerp(smoothedRotation.current.x, targetRotation.x, smoothingFactor);
      smoothedRotation.current.y = THREE.MathUtils.lerp(smoothedRotation.current.y, targetRotation.y, smoothingFactor);
      
      // Appliquer la rotation à la caméra
      camera.rotation.copy(smoothedRotation.current);

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
function SoundWave({
  radius,
  opacity,
  speed,
}: {
  radius: number;
  opacity: number;
  speed: number;
}) {
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
function ClickableAnimalMarker({
  animal,
  onAnimalClick,
}: {
  animal: Animal;
  onAnimalClick: (animal: Animal) => void;
}) {
  const { camera } = useThree();
  const groupRef = useRef<THREE.Group>(null);

  // Normaliser la position pour qu'elle soit sur la sphère intérieure (rayon 5)
  const originalPos = new THREE.Vector3(
    animal.position.x,
    animal.position.y,
    animal.position.z
  );
  const normalizedPos = originalPos.normalize().multiplyScalar(5);

  // Faire face à la caméra en permanence
  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.lookAt(camera.position);
    }
  });

  const handleClick = (e: any) => {
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
        <meshBasicMaterial color="#000000" transparent opacity={0} />
      </mesh>

      {/* Centre : petit cercle noir */}
      <mesh>
        <circleGeometry args={[0.2, 16]} />
        <meshBasicMaterial color="#00ffff" transparent={true} opacity={0.8} />
      </mesh>

      {/* Une seule onde sonore animée */}
      <SoundWave radius={0.7} opacity={0.6} speed={1.5} />
    </group>
  );
}

function AnimalMarkers({
  animals,
  currentlyPlayingAnimal,
  onAnimalClick,
}: {
  animals: Animal[];
  currentlyPlayingAnimal: Animal | null;
  onAnimalClick: (animal: Animal) => void;
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

// Composant qui gère la détection d'animaux directement avec la caméra
function AnimalDetector({
  currentlyPlayingAnimal,
  onDetectionUpdate,
  updateVolumeByAngle,
  gameState,
  onAnimalDiscovered,
  useGyroscope,
}: {
  currentlyPlayingAnimal: Animal | null;
  onDetectionUpdate?: (state: DetectionState | null) => void;
  updateVolumeByAngle?: (animalId: string, angleDegrees: number) => void;
  gameState?: { discoveredAnimals: string[]; isListening: boolean };
  onAnimalDiscovered?: (animal: Animal) => void;
  useGyroscope: boolean;
}) {
  const { camera } = useThree();
  const frameCount = useRef(0);
  const lastHintTime = useRef(0);
  const currentHintLevel = useRef('');

  useFrame(() => {
    frameCount.current++;

    if (!currentlyPlayingAnimal || !gameState?.isListening) {
      if (onDetectionUpdate) {
        onDetectionUpdate(null);
      }
      return;
    }

    // Récupérer la direction de la caméra directement
    const cameraDirection = new THREE.Vector3(0, 0, -1);
    cameraDirection.applyQuaternion(camera.quaternion);

    // Position de l'animal
    const animalPosition = new THREE.Vector3(
      currentlyPlayingAnimal.position.x,
      currentlyPlayingAnimal.position.y,
      currentlyPlayingAnimal.position.z
    );

    // Calculer l'angle
    const normalizedAnimalDir = animalPosition.clone().normalize();
    const normalizedCameraDir = cameraDirection.clone().normalize();
    const angle = normalizedCameraDir.angleTo(normalizedAnimalDir);
    const angleDegrees = (angle * 180) / Math.PI;

    // Debug simple de l'angle
    if (frameCount.current % 60 === 0) {
      console.log(`🎯 ${currentlyPlayingAnimal.name} | Angle: ${angleDegrees.toFixed(1)}°`);
    }

    const isNearby = angleDegrees <= 35;
    const canClick = angleDegrees <= 20;

    // Déterminer le niveau d'indice
    let hintLevel: 'far' | 'medium' | 'close' | 'veryClose' = 'far';
    if (angleDegrees <= 20) hintLevel = 'veryClose';
    else if (angleDegrees <= 35) hintLevel = 'close';
    else if (angleDegrees <= 70) hintLevel = 'medium';

    // Gestion des hints (logique simplifiée)
    const now = Date.now();
    const levelChanged = hintLevel !== currentHintLevel.current;
    if (levelChanged && hintLevel !== 'far') {
      lastHintTime.current = now;
      currentHintLevel.current = hintLevel;

      // Feedback haptique
      if ('vibrate' in navigator) {
        const vibrationPatterns: Record<string, number[]> = {
          medium: [100],
          close: [100, 50, 100],
          veryClose: [200, 100, 200],
        };
        const pattern = vibrationPatterns[hintLevel];
        if (pattern) {
          navigator.vibrate(pattern);
        }
      }
    }

    const shouldShowHint = levelChanged && hintLevel !== 'far';
    const hintStillVisible = (now - lastHintTime.current) < 2000 && currentHintLevel.current !== '';

    // État de détection
    const detectionState: DetectionState = {
      distance: angleDegrees,
      angle: angleDegrees,
      isNearby,
      canClick,
      hintLevel,
      showHint: shouldShowHint || hintStillVisible
    };

    if (onDetectionUpdate) {
      onDetectionUpdate(detectionState);
    }

    // Mettre à jour le volume
    if (updateVolumeByAngle) {
      updateVolumeByAngle(currentlyPlayingAnimal.id, angleDegrees);
    }

    // Auto-découverte
    if (canClick && gameState && !gameState.discoveredAnimals.includes(currentlyPlayingAnimal.id)) {
      console.log('🎯 Animal découvert automatiquement !', currentlyPlayingAnimal.name);
      if (onAnimalDiscovered) {
        onAnimalDiscovered(currentlyPlayingAnimal);
      }
    }
  });

  return null;
}

export const Scene360: React.FC<Scene360Props> = ({
  textureUrl,
  useGyroscope = true,
  animals = [],
  currentlyPlayingAnimal = null,
  onAnimalClick,
  onDetectionUpdate,
  updateVolumeByAngle,
  gameState,
  onAnimalDiscovered,
}) => {
  const { orientation } = useDeviceOrientation();
  const recalibrateRef = useRef<(() => void) | null>(null);

  const handleAnimalClick = (animal: Animal) => {
    if (onAnimalClick) {
      onAnimalClick(animal);
    }
  };

  const handleRecalibrate = () => {
    if (recalibrateRef.current) {
      recalibrateRef.current();
    }
  };

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
      {/* Bouton de recalibration gyroscope */}
      {useGyroscope && gameState?.isListening && (
        <CalibrationButton onRecalibrate={handleRecalibrate} />
      )}
      <Canvas
        camera={{
          position: [0, 0, 0.1],
          fov: 90,
          near: 0.1,
          far: 1000,
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
              onDirectionChange={() => {}} // Plus besoin
              recalibrateRef={recalibrateRef}
            />
          )}
          {!useGyroscope && (
            <OrbitControls
              enableZoom={false}
              enablePan={false}
              rotateSpeed={0.5}
            />
          )}

          {/* Détecteur d'animaux avec accès direct à la caméra */}
          <AnimalDetector
            currentlyPlayingAnimal={currentlyPlayingAnimal}
            onDetectionUpdate={onDetectionUpdate}
            updateVolumeByAngle={updateVolumeByAngle}
            gameState={gameState}
            onAnimalDiscovered={onAnimalDiscovered}
            useGyroscope={useGyroscope}
          />
        </Suspense>
      </Canvas>
    </div>
  );
};
