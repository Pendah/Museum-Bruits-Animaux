import { motion } from 'framer-motion';

interface NavigationSwitchProps {
  useGyroscope: boolean;
  onToggle: (useGyroscope: boolean) => void;
  gyroscopeAvailable: boolean;
}

const NavigationSwitch: React.FC<NavigationSwitchProps> = ({
  useGyroscope,
  onToggle,
  gyroscopeAvailable
}) => {
  if (!gyroscopeAvailable) {
    return null; // Ne pas afficher le switch si pas de gyroscope
  }

  return (
    <div className="navigation-switch">
      <div className="switch-container">
        <span className={`switch-label ${!useGyroscope ? 'active' : ''}`}>
          👆 Tactile
        </span>
        
        <motion.div
          className="switch-track"
          onClick={() => onToggle(!useGyroscope)}
          whileTap={{ scale: 0.95 }}
        >
          <motion.div
            className="switch-thumb"
            animate={{
              x: useGyroscope ? 24 : 0
            }}
            transition={{
              type: "spring",
              stiffness: 500,
              damping: 30
            }}
          />
        </motion.div>
        
        <span className={`switch-label ${useGyroscope ? 'active' : ''}`}>
          📱 Gyroscope
        </span>
      </div>
      
      <p className="switch-description">
        {useGyroscope 
          ? "Bougez votre appareil pour naviguer" 
          : "Utilisez votre doigt/souris pour naviguer"
        }
      </p>
    </div>
  );
};

export default NavigationSwitch;