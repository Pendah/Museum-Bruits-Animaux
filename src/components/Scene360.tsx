import { useRef, useEffect, Suspense } from "react";
import { Canvas, useFrame, useThree, useLoader } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { TextureLoader } from "three";
import type { Animal } from "../types";

interface DetectionState {
  distance: number;
  angle: number;
  isNearby: boolean;
  canClick: boolean;
  hintLevel: "far" | "medium" | "close" | "veryClose";
  showHint: boolean;
}

interface Scene360Props {
  textureUrl?: string;
  useGyroscope?: boolean;
  animals?: Animal[];
  currentlyPlayingAnimal?: Animal | null;
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
    <div
      style={{
        position: "absolute",
        top: "20px",
        left: "20px",
        zIndex: 100,
      }}
    >
      <button
        onClick={onRecalibrate}
        style={{
          background: "rgba(0, 0, 0, 0.7)",
          border: "none",
          color: "white",
          padding: "8px 12px",
          borderRadius: "6px",
          cursor: "pointer",
          fontSize: "12px",
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
  onDirectionChange?: (direction: THREE.Vector3) => void;
  recalibrateRef?: React.MutableRefObject<(() => void) | null>;
}

function CameraController({
  onDirectionChange,
  recalibrateRef,
}: CameraControllerProps) {
  const { camera } = useThree();
  const initialOrientation = useRef<{ alpha: number; beta: number } | null>(null);
  
  const recalibrate = () => {
    initialOrientation.current = null;
  };

  if (recalibrateRef) {
    recalibrateRef.current = recalibrate;
  }

  // Approche directe comme l'exemple 2020
  useEffect(() => {
    if (typeof window.DeviceOrientationEvent === 'undefined') {
      console.warn('DeviceOrientationEvent not supported');
      return;
    }

    const deviceOrientationHandler = (eventData: DeviceOrientationEvent) => {
      if (eventData.alpha === null || eventData.beta === null) return;
      
      // Première fois - calibrer
      if (!initialOrientation.current) {
        initialOrientation.current = {
          alpha: eventData.alpha,
          beta: eventData.beta
        };
        return;
      }

      // Calculer la différence depuis la calibration
      let deltaAlpha = eventData.alpha - initialOrientation.current.alpha;
      const deltaBeta = eventData.beta - initialOrientation.current.beta;
      
      // Gérer le wraparound 0-360°
      if (deltaAlpha > 180) deltaAlpha -= 360;
      if (deltaAlpha < -180) deltaAlpha += 360;

      // Convertir en rotation Three.js (inverser les contrôles pour iOS)
      const yaw = (deltaAlpha * Math.PI) / 180; // Inversé
      const pitch = (deltaBeta * Math.PI) / 180; // Inversé
      
      // Limiter le pitch pour éviter les retournements
      const clampedPitch = Math.max(-Math.PI/3, Math.min(Math.PI/3, pitch));
      
      // Lissage léger pour éviter les sauts
      const currentRotation = camera.rotation.clone();
      const targetRotation = new THREE.Euler(clampedPitch, yaw, 0, 'YXZ');
      
      // Interpolation simple pour lisser
      const smoothing = 0.8; // Plus proche de 1 = plus direct
      const smoothedX = currentRotation.x * (1 - smoothing) + targetRotation.x * smoothing;
      const smoothedY = currentRotation.y * (1 - smoothing) + targetRotation.y * smoothing;
      
      // Appliquer la rotation lissée à la caméra
      camera.rotation.set(smoothedX, smoothedY, 0, 'YXZ');
      

      if (onDirectionChange) {
        const direction = new THREE.Vector3(0, 0, -1);
        direction.applyQuaternion(camera.quaternion);
        onDirectionChange(direction);
      }
    };

    window.addEventListener('deviceorientation', deviceOrientationHandler, false);
    
    return () => {
      window.removeEventListener('deviceorientation', deviceOrientationHandler);
    };
  }, [camera, onDirectionChange]);

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

// Marqueur 2D avec animation d'ondes (non cliquable)
function AnimalMarker({ animal }: { animal: Animal }) {
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

  return (
    <group
      ref={groupRef}
      position={[normalizedPos.x, normalizedPos.y, normalizedPos.z]}
    >
      {/* Centre : petit cercle cyan */}
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
}: {
  animals: Animal[];
  currentlyPlayingAnimal: Animal | null;
}) {
  return (
    <>
      {animals.map((animal) => {
        const isPlaying = currentlyPlayingAnimal?.id === animal.id;

        if (!isPlaying) return null; // Afficher seulement l'animal actuel

        return <AnimalMarker key={animal.id} animal={animal} />;
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
}: {
  currentlyPlayingAnimal: Animal | null;
  onDetectionUpdate?: (state: DetectionState | null) => void;
  updateVolumeByAngle?: (animalId: string, angleDegrees: number) => void;
  gameState?: { discoveredAnimals: string[]; isListening: boolean };
  onAnimalDiscovered?: (animal: Animal) => void;
}) {
  const { camera } = useThree();
  const frameCount = useRef(0);
  const lastHintTime = useRef(0);
  const currentHintLevel = useRef("");

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

    const isNearby = angleDegrees <= 35;
    const canClick = angleDegrees <= 20;

    // Déterminer le niveau d'indice
    let hintLevel: "far" | "medium" | "close" | "veryClose" = "far";
    if (angleDegrees <= 20) hintLevel = "veryClose";
    else if (angleDegrees <= 35) hintLevel = "close";
    else if (angleDegrees <= 70) hintLevel = "medium";

    // Gestion des hints (logique simplifiée)
    const now = Date.now();
    const levelChanged = hintLevel !== currentHintLevel.current;
    if (levelChanged && hintLevel !== "far") {
      lastHintTime.current = now;
      currentHintLevel.current = hintLevel;

      // Feedback haptique
      if ("vibrate" in navigator) {
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

    const shouldShowHint = levelChanged && hintLevel !== "far";
    const hintStillVisible =
      now - lastHintTime.current < 2000 && currentHintLevel.current !== "";

    // État de détection
    const detectionState: DetectionState = {
      distance: angleDegrees,
      angle: angleDegrees,
      isNearby,
      canClick,
      hintLevel,
      showHint: shouldShowHint || hintStillVisible,
    };

    if (onDetectionUpdate) {
      onDetectionUpdate(detectionState);
    }

    // Mettre à jour le volume
    if (updateVolumeByAngle) {
      updateVolumeByAngle(currentlyPlayingAnimal.id, angleDegrees);
    }

    // Auto-découverte
    if (
      canClick &&
      gameState &&
      !gameState.discoveredAnimals.includes(currentlyPlayingAnimal.id)
    ) {
      console.log(
        "🎯 Animal découvert automatiquement !",
        currentlyPlayingAnimal.name
      );
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
  onDetectionUpdate,
  updateVolumeByAngle,
  gameState,
  onAnimalDiscovered,
}) => {
  const recalibrateRef = useRef<(() => void) | null>(null);


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

          {/* Marqueurs des animaux (indicateurs visuels) */}
          <AnimalMarkers
            animals={animals}
            currentlyPlayingAnimal={currentlyPlayingAnimal}
          />

          {useGyroscope && (
            <CameraController
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
          />
        </Suspense>
      </Canvas>
    </div>
  );
};
