import { useState, useEffect, useCallback } from "react";
import * as THREE from "three";
import { Scene360 } from "./components/Scene360";
import { GameUI } from "./components/GameUI";
import { AnimalModal } from "./components/AnimalModal";
import { useDeviceOrientation } from "./hooks/useDeviceOrientation";
import { useSpatialAudio } from "./hooks/useSpatialAudio";
import { animals } from "./data/animals";
import type { Animal, GameState } from "./types";
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

  const { orientation, permission, requestPermission } = useDeviceOrientation();
  const {
    initializeAudioContext,
    playAnimalSound,
    stopAllSounds,
    updateListenerOrientation,
    playAmbiance,
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
  }, [gameState.discoveredAnimals, initializeAudioContext, playAnimalSound, permission, requestPermission]);

  const handleDirectionChange = useCallback((direction: THREE.Vector3) => {
    setPlayerDirection(direction);
  }, []);

  const checkAnimalDetection = useCallback(() => {
    if (!currentlyPlayingAnimal || !gameState.isListening) return;

    const animalPosition = new THREE.Vector3(
      currentlyPlayingAnimal.position.x,
      currentlyPlayingAnimal.position.y,
      currentlyPlayingAnimal.position.z
    );

    const normalizedAnimalDir = animalPosition.clone().normalize();
    const normalizedPlayerDir = playerDirection.clone().normalize();
    const angle = normalizedPlayerDir.angleTo(normalizedAnimalDir);

    // Si l'angle est suffisamment petit (l'utilisateur pointe vers l'animal)
    if (angle < (currentlyPlayingAnimal.detectionRadius * Math.PI) / 180) {
      if (!gameState.discoveredAnimals.includes(currentlyPlayingAnimal.id)) {
        setGameState((prev) => ({
          ...prev,
          currentAnimal: currentlyPlayingAnimal,
          discoveredAnimals: [
            ...prev.discoveredAnimals,
            currentlyPlayingAnimal.id,
          ],
        }));
      }
    }
  }, [currentlyPlayingAnimal, playerDirection, gameState]);

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

  // Mise à jour de l'orientation de l'écouteur
  useEffect(() => {
    if (
      orientation.alpha !== null &&
      orientation.beta !== null &&
      orientation.gamma !== null
    ) {
      updateListenerOrientation(
        orientation.alpha,
        orientation.beta,
        orientation.gamma
      );
    }
  }, [orientation, updateListenerOrientation]);

  // Vérification de la détection d'animal
  useEffect(() => {
    const interval = setInterval(checkAnimalDetection, 500);
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
      />

      <GameUI
        isListening={gameState.isListening}
        currentAnimal={gameState.currentAnimal}
        discoveredAnimals={gameState.discoveredAnimals}
        onStartListening={startListening}
        onShowAnimalInfo={showAnimalInfo}
        showPermissionPrompt={false}
        onRequestPermission={requestPermission}
        useGyroscope={useGyroscope}
        onToggleNavigation={setUseGyroscope}
        gyroscopeAvailable={permission !== 'denied'}
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
