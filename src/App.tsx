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
  hintLevel: "far" | "medium" | "close" | "veryClose";
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
  const [useGyroscope, setUseGyroscope] = useState(true);
  const [detectionState, setDetectionState] = useState<DetectionState | null>(
    null
  );

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
  }, [
    gameState.discoveredAnimals,
    initializeAudioContext,
    playAnimalSound,
    permission,
    requestPermission,
    playAmbiance,
  ]);


  const handleDetectionUpdate = useCallback((state: DetectionState | null) => {
    setDetectionState(state);
  }, []);

  const handleAnimalDiscovered = useCallback((animal: Animal) => {
    setGameState((prev) => ({
      ...prev,
      currentAnimal: animal,
      discoveredAnimals: [
        ...prev.discoveredAnimals,
        animal.id,
      ],
    }));
  }, []);

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
        useGyroscope={useGyroscope}
        animals={animals}
        currentlyPlayingAnimal={currentlyPlayingAnimal}
        onAnimalClick={showAnimalInfo}
        onDetectionUpdate={handleDetectionUpdate}
        updateVolumeByAngle={updateVolumeByAngle}
        gameState={gameState}
        onAnimalDiscovered={handleAnimalDiscovered}
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
        gyroscopeAvailable={permission === "granted"}
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
