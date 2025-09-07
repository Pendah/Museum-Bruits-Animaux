import { motion } from 'framer-motion';
import type { Animal } from '../types';

interface AnimalModalProps {
  animal: Animal | null;
  isOpen: boolean;
  onClose: () => void;
}

export const AnimalModal: React.FC<AnimalModalProps> = ({
  animal,
  isOpen,
  onClose
}) => {
  if (!animal || !isOpen) return null;

  return (
    <motion.div
      className="animal-modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="animal-modal"
        initial={{ scale: 0.8, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.8, y: 50 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>{animal.name}</h2>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>
        
        <div className="modal-content">
          <div className="video-container">
            <video
              src={animal.videoFile}
              controls
              autoPlay
              muted
              playsInline
              className="animal-video"
            >
              Votre navigateur ne supporte pas la lecture vidéo.
            </video>
          </div>
          
          <div className="animal-info">
            <p>{animal.description}</p>
          </div>
          
          <button className="continue-btn" onClick={onClose}>
            Continuer l'exploration
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};