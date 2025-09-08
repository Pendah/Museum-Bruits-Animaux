import { motion, AnimatePresence } from "framer-motion";
import type { Animal } from "../types";
import NavigationSwitch from "./NavigationSwitch";

interface DetectionState {
  distance: number;
  angle: number;
  isNearby: boolean;
  canClick: boolean;
  hintLevel: 'far' | 'medium' | 'close' | 'veryClose';
  showHint: boolean;
}

interface GameUIProps {
  isListening: boolean;
  currentAnimal: Animal | null;
  discoveredAnimals: string[];
  detectionState: DetectionState | null;
  currentlyPlayingAnimal: Animal | null;
  onStartListening: () => void;
  onShowAnimalInfo: (animal: Animal) => void;
  showPermissionPrompt: boolean;
  onRequestPermission: () => void;
  useGyroscope: boolean;
  onToggleNavigation: (useGyroscope: boolean) => void;
  gyroscopeAvailable: boolean;
}

export const GameUI: React.FC<GameUIProps> = ({
  isListening,
  currentAnimal,
  discoveredAnimals,
  detectionState,
  currentlyPlayingAnimal,
  onStartListening,
  onShowAnimalInfo,
  showPermissionPrompt,
  onRequestPermission,
  useGyroscope,
  onToggleNavigation,
  gyroscopeAvailable,
}) => {
  return (
    <div className="game-ui">
      <AnimatePresence>
        {showPermissionPrompt && (
          <motion.div
            className="permission-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="modal-content">
              <h2>Autorisation requise</h2>
              <p>
                Cette expérience nécessite l'accès aux capteurs de mouvement de
                votre appareil pour fonctionner correctement.
              </p>
              <button onClick={onRequestPermission} className="permission-btn">
                Autoriser
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="ui-overlay">
        <header className="app-header">
          <h1>Bruits de la Nuit</h1>
          <p>Écoutez et trouvez les animaux nocturnes</p>
        </header>

        <div className="progress-indicator">
          <span>Animaux découverts: {discoveredAnimals.length}</span>
        </div>

        <NavigationSwitch
          useGyroscope={useGyroscope}
          onToggle={onToggleNavigation}
          gyroscopeAvailable={gyroscopeAvailable}
        />

        {!isListening ? (
          <div className="start-screen">
            <motion.button
              className="start-btn"
              onClick={onStartListening}
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.05 }}
            >
              Commencer l'exploration
            </motion.button>
            <p className="instruction">
              Utilisez vos écouteurs pour une meilleure expérience
            </p>
          </div>
        ) : (
          <div className="listening-ui">
            {currentAnimal ? (
              <motion.div
                className="animal-found"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <h3>Animal trouvé !</h3>
                <button
                  onClick={() => onShowAnimalInfo(currentAnimal)}
                  className="show-info-btn"
                >
                  Voir {currentAnimal.name}
                </button>
              </motion.div>
            ) : (
              <>
                <motion.div
                  className="listening-indicator"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  <div className="sound-waves">
                    <div className="wave"></div>
                    <div className="wave"></div>
                    <div className="wave"></div>
                  </div>
                  <p>Écoutez attentivement et tournez-vous vers le son...</p>
                </motion.div>

                {/* Feedback de détection par paliers */}
                <AnimatePresence>
                  {detectionState && currentlyPlayingAnimal && detectionState.showHint && (
                    <motion.div
                      className="hint-indicator"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.5 }}
                    >
                      {detectionState.hintLevel === 'medium' && (
                        <div className="hint-message">
                          🔍 <span>Vous vous rapprochez...</span>
                        </div>
                      )}
                      {detectionState.hintLevel === 'close' && (
                        <div className="hint-message">
                          🔥 <span>C'est chaud ! Continuez...</span>
                        </div>
                      )}
                      {detectionState.hintLevel === 'veryClose' && (
                        <div className="hint-message">
                          ⚡ <span>Très proche ! Écoutez bien...</span>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Zone de clic quand on est très proche */}
                <AnimatePresence>
                  {detectionState && detectionState.canClick && currentlyPlayingAnimal && (
                    <motion.div
                      className="click-zone"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => onShowAnimalInfo(currentlyPlayingAnimal)}
                    >
                      <div className="click-target">
                        <span className="animal-icon">🦉</span>
                        <p>Cliquez pour découvrir</p>
                        <p className="animal-name">{currentlyPlayingAnimal.name}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}
          </div>
        )}

        <div className="discovered-animals">
          {discoveredAnimals.map((animalId, index) => (
            <motion.div
              key={animalId}
              className="discovered-animal-badge"
              initial={{ x: -100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              🦉
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};
