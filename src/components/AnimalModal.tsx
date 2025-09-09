import { motion } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import type { Animal } from "../types";

interface AnimalModalProps {
  animal: Animal | null;
  isOpen: boolean;
  onClose: () => void;
}

const VideoPlayer: React.FC<{ videoSrc: string }> = ({ videoSrc }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Détecter iOS/Safari
  const isIOS = () => {
    return (
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
    );
  };

  const toggleFullscreen = async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      // Check si on est déjà en fullscreen
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement || (document as any).webkitFullscreenElement
      );

      if (!isCurrentlyFullscreen) {
        // Entrer en fullscreen
        if (isIOS() && (video as any).webkitEnterFullscreen) {
          // iOS Safari - utiliser webkitEnterFullscreen
          console.log("📱 iOS détecté - utilisation webkitEnterFullscreen");
          (video as any).webkitEnterFullscreen();
          setIsFullscreen(true);
        } else if (video.requestFullscreen) {
          // Standard API
          await video.requestFullscreen();
          setIsFullscreen(true);
        } else if ((video as any).webkitRequestFullscreen) {
          // WebKit fallback
          await (video as any).webkitRequestFullscreen();
          setIsFullscreen(true);
        } else {
          console.warn("⚠️ Fullscreen non supporté sur cet appareil");
        }
      } else {
        // Sortir du fullscreen
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        }
        setIsFullscreen(false);
      }
    } catch (error) {
      console.error("❌ Erreur plein écran:", error);
    }
  };

  const handleFullscreenChange = () => {
    const isCurrentlyFullscreen = !!(
      document.fullscreenElement || (document as any).webkitFullscreenElement
    );
    setIsFullscreen(isCurrentlyFullscreen);
  };

  const handleOrientationChange = () => {
    // Force un recalcul des dimensions après changement d'orientation
    const isCurrentlyFullscreen = !!(
      document.fullscreenElement || (document as any).webkitFullscreenElement
    );

    if (videoRef.current && isCurrentlyFullscreen) {
      setTimeout(() => {
        const video = videoRef.current;
        if (video) {
          video.style.width = "100vw";
          video.style.height = "100vh";
        }
      }, 100);
    }
  };

  useEffect(() => {
    const video = videoRef.current;

    // Événements fullscreen standard
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);

    // Événements spécifiques iOS pour webkitEnterFullscreen
    if (video && isIOS()) {
      video.addEventListener("webkitbeginfullscreen", () =>
        setIsFullscreen(true)
      );
      video.addEventListener("webkitendfullscreen", () =>
        setIsFullscreen(false)
      );
    }

    // Écouter les changements d'orientation
    window.addEventListener("orientationchange", handleOrientationChange);
    window.addEventListener("resize", handleOrientationChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener(
        "webkitfullscreenchange",
        handleFullscreenChange
      );
      document.removeEventListener(
        "mozfullscreenchange",
        handleFullscreenChange
      );

      if (video && isIOS()) {
        video.removeEventListener("webkitbeginfullscreen", () =>
          setIsFullscreen(true)
        );
        video.removeEventListener("webkitendfullscreen", () =>
          setIsFullscreen(false)
        );
      }

      window.removeEventListener("orientationchange", handleOrientationChange);
      window.removeEventListener("resize", handleOrientationChange);
    };
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
        {isFullscreen ? "⤺" : "⛶"}
      </button>
    </div>
  );
};

export const AnimalModal: React.FC<AnimalModalProps> = ({
  animal,
  isOpen,
  onClose,
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
            {animal.videoFile.endsWith(".mp4") ? (
              <VideoPlayer videoSrc={animal.videoFile} />
            ) : (
              <img
                width="100%"
                src={animal.videoFile}
                alt={animal.name}
                className="animal-image"
              />
            )}
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
