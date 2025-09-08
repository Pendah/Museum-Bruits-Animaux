import { motion } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import type { Animal } from '../types';

interface AnimalModalProps {
  animal: Animal | null;
  isOpen: boolean;
  onClose: () => void;
}

const VideoPlayer: React.FC<{ videoSrc: string }> = ({ videoSrc }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const toggleFullscreen = async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      if (!document.fullscreenElement) {
        await video.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (error) {
      console.error('Erreur plein écran:', error);
    }
  };

  const handleFullscreenChange = () => {
    setIsFullscreen(!!document.fullscreenElement);
  };

  useEffect(() => {
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  return (
    <div className="custom-video-player">
      <video
        ref={videoRef}
        src={videoSrc}
        autoPlay
        muted
        loop
        playsInline
        className="animal-video"
      >
        Votre navigateur ne supporte pas la lecture vidéo.
      </video>
      <button 
        className="fullscreen-btn" 
        onClick={toggleFullscreen}
        aria-label={isFullscreen ? "Quitter le plein écran" : "Plein écran"}
      >
        {isFullscreen ? '⤺' : '⛶'}
      </button>
    </div>
  );
};

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
            <VideoPlayer videoSrc={animal.videoFile} />
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