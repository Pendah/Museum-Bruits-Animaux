import { useState, useEffect, useCallback } from "react";
import * as THREE from "three";
import { Scene360 } from "./components/Scene360";
import { GameUI } from "./components/GameUI";
import { AnimalModal } from "./components/AnimalModal";
import { useDeviceOrientation } from "./hooks/useDeviceOrientation";
import { useSpatialAudio } from "./hooks/useSpatialAudio";
import { animals } from "./data/animals";
import type { Animal, GameState } from "./types";

interface DetectionState {
  distance: number;
  angle: number;
  isNearby: boolean;
  canClick: boolean;
  hintLevel: 'far' | 'medium' | 'close' | 'veryClose';
  showHint: boolean;
}
import "./App.scss";

function App() {
  const [gameState, setGameState] = useState<GameState>({
    currentAnimal: null,
    discoveredAnimals: [],
    isListening: false,
    showVideoModal: false,
  });

  const [currentlyPlayingAnimal, setCurrentlyPlayingAnimal] =
    useState<Animal | null>(null);
  const [playerDirection, setPlayerDirection] = useState<THREE.Vector3>(
    new THREE.Vector3(0, 0, -1)
  );
  const [useGyroscope, setUseGyroscope] = useState(true);
  const [detectionState, setDetectionState] = useState<DetectionState | null>(null);
  const [lastHintTime, setLastHintTime] = useState<number>(0);
  const [currentHintLevel, setCurrentHintLevel] = useState<string>('');

  const { permission, requestPermission } = useDeviceOrientation();
  const {
    initializeAudioContext,
    playAnimalSound,
    stopAllSounds,
    playAmbiance,
    updateVolumeByAngle,
  } = useSpatialAudio();

  const startListening = useCallback(async () => {
    // Demander les permissions d'abord si nécessaire
    if (permission !== "granted") {
      const granted = await requestPermission();
      if (!granted) {
        return; // Arrêter si permission refusée
      }
    }

    await initializeAudioContext();
    setGameState((prev) => ({ ...prev, isListening: true }));
    
    // Démarrer l'ambiance sonore
    await playAmbiance();

    // Démarrer avec le premier animal non découvert
    const undiscoveredAnimals = animals.filter(
      (animal) => !gameState.discoveredAnimals.includes(animal.id)
    );

    if (undiscoveredAnimals.length > 0) {
      const randomAnimal =
        undiscoveredAnimals[
          Math.floor(Math.random() * undiscoveredAnimals.length)
        ];
      setCurrentlyPlayingAnimal(randomAnimal);
      await playAnimalSound(randomAnimal);
    }
  }, [gameState.discoveredAnimals, initializeAudioContext, playAnimalSound, permission, requestPermission, playAmbiance]);

  const handleDirectionChange = useCallback((direction: THREE.Vector3) => {
    setPlayerDirection(direction);
  }, []);

  const checkAnimalDetection = useCallback(() => {
    if (!currentlyPlayingAnimal || !gameState.isListening) {
      setDetectionState(null);
      return;
    }

    const animalPosition = new THREE.Vector3(
      currentlyPlayingAnimal.position.x,
      currentlyPlayingAnimal.position.y,
      currentlyPlayingAnimal.position.z
    );

    // Calculer l'angle entre direction caméra et position animal
    const normalizedAnimalDir = animalPosition.clone().normalize();
    const normalizedPlayerDir = playerDirection.clone().normalize();
    const angle = normalizedPlayerDir.angleTo(normalizedAnimalDir);
    const angleDegrees = (angle * 180) / Math.PI;
    
    // Debug simple de l'angle (sera affiché à chaque détection)
    console.log(`🎯 ${currentlyPlayingAnimal.name} | Angle: ${angleDegrees.toFixed(1)}°`);


    const isNearby = angleDegrees <= 35; // Proche si dans un cône de 35°
    const canClick = angleDegrees <= 20; // Zone de clic si dans un cône de 20°

    // Déterminer le niveau d'indice par paliers basé sur l'angle (ajusté aux nouvelles zones)
    let hintLevel: 'far' | 'medium' | 'close' | 'veryClose' = 'far';
    if (angleDegrees <= 20) hintLevel = 'veryClose';      // Zone de clic élargie
    else if (angleDegrees <= 35) hintLevel = 'close';     // Zone de proximité élargie  
    else if (angleDegrees <= 70) hintLevel = 'medium';    // Se rapproche de la direction

    // Afficher indice seulement si changement de palier
    const now = Date.now();
    const HINT_DISPLAY_DURATION = 2000; // 2 secondes d'affichage
    const levelChanged = hintLevel !== currentHintLevel;
    
    // Déclencher nouveau hint seulement si niveau change
    if (levelChanged && hintLevel !== 'far') {
      setLastHintTime(now);
      setCurrentHintLevel(hintLevel);
      
      // Feedback haptique sur mobile
      if ('vibrate' in navigator) {
        const vibrationPatterns: Record<string, number[]> = {
          'medium': [100],
          'close': [100, 50, 100],
          'veryClose': [200, 100, 200]
        };
        
        const pattern = vibrationPatterns[hintLevel];
        if (pattern) {
          navigator.vibrate(pattern);
        }
      }
    }

    // Afficher hint seulement pendant une durée limitée
    const shouldShowHint = levelChanged && hintLevel !== 'far';
    const hintStillVisible = (now - lastHintTime) < HINT_DISPLAY_DURATION && currentHintLevel !== '';

    // Mettre à jour l'état de détection
    const newDetectionState: DetectionState = {
      distance: angleDegrees, // Distance angulaire
      angle: angleDegrees,
      isNearby,
      canClick,
      hintLevel,
      showHint: shouldShowHint || hintStillVisible
    };
    setDetectionState(newDetectionState);

    // Mettre à jour le volume en temps réel selon l'angle
    if (currentlyPlayingAnimal) {
      updateVolumeByAngle(currentlyPlayingAnimal.id, angleDegrees);
    }

    // Auto-découverte quand on est très proche ET dans la bonne direction
    if (canClick && !gameState.discoveredAnimals.includes(currentlyPlayingAnimal.id)) {
      console.log('🎯 Animal découvert automatiquement !', currentlyPlayingAnimal.name);
      setGameState((prev) => ({
        ...prev,
        currentAnimal: currentlyPlayingAnimal,
        discoveredAnimals: [
          ...prev.discoveredAnimals,
          currentlyPlayingAnimal.id,
        ],
      }));
    }
  }, [currentlyPlayingAnimal, playerDirection, gameState, updateVolumeByAngle, currentHintLevel, lastHintTime]);

  const showAnimalInfo = useCallback(
    (animal: Animal) => {
      stopAllSounds();
      setGameState((prev) => ({
        ...prev,
        showVideoModal: true,
        currentAnimal: animal,
      }));
    },
    [stopAllSounds]
  );

  const closeModal = useCallback(async () => {
    setGameState((prev) => ({
      ...prev,
      showVideoModal: false,
      currentAnimal: null,
    }));

    // Passer au prochain animal s'il y en a
    const undiscoveredAnimals = animals.filter(
      (animal) => !gameState.discoveredAnimals.includes(animal.id)
    );

    if (undiscoveredAnimals.length > 0) {
      const randomAnimal =
        undiscoveredAnimals[
          Math.floor(Math.random() * undiscoveredAnimals.length)
        ];
      setCurrentlyPlayingAnimal(randomAnimal);
      await playAnimalSound(randomAnimal);
    } else {
      // Tous les animaux découverts !
      setCurrentlyPlayingAnimal(null);
      setGameState((prev) => ({ ...prev, isListening: false }));
    }
  }, [gameState.discoveredAnimals, playAnimalSound]);


  // Vérification de la détection d'animal plus fréquente pour un volume réactif
  useEffect(() => {
    const interval = setInterval(checkAnimalDetection, 100); // 10x par seconde au lieu de 2x
    return () => clearInterval(interval);
  }, [checkAnimalDetection]);

  // Nettoyage à la fermeture
  useEffect(() => {
    return () => {
      stopAllSounds();
    };
  }, [stopAllSounds]);

  return (
    <div className="app">
      <Scene360
        textureUrl="/assets/textures/forest-night-360.jpg"
        onDirectionChange={handleDirectionChange}
        useGyroscope={useGyroscope}
        animals={animals}
        currentlyPlayingAnimal={currentlyPlayingAnimal}
        onAnimalClick={showAnimalInfo}
      />

      <GameUI
        isListening={gameState.isListening}
        currentAnimal={gameState.currentAnimal}
        discoveredAnimals={gameState.discoveredAnimals}
        detectionState={detectionState}
        currentlyPlayingAnimal={currentlyPlayingAnimal}
        onStartListening={startListening}
        onShowAnimalInfo={showAnimalInfo}
        showPermissionPrompt={false}
        onRequestPermission={requestPermission}
        useGyroscope={useGyroscope}
        onToggleNavigation={setUseGyroscope}
        gyroscopeAvailable={permission === 'granted'}
      />

      <AnimalModal
        animal={gameState.currentAnimal}
        isOpen={gameState.showVideoModal}
        onClose={closeModal}
      />
    </div>
  );
}

export default App;
