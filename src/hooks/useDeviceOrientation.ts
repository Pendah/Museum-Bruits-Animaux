import { useState, useEffect } from "react";
import type { DeviceOrientationData } from "../types";

export const useDeviceOrientation = () => {
  const [orientation, setOrientation] = useState<DeviceOrientationData>({
    alpha: null,
    beta: null,
    gamma: null,
  });
  const [permission, setPermission] = useState<
    "granted" | "denied" | "default"
  >("default");

  // Détecter iOS/Safari
  const isIOS = () => {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
           (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  };

  // Vérifier si on est en HTTPS (requis pour iOS 13+)
  const isHTTPS = () => {
    return location.protocol === 'https:' || location.hostname === 'localhost';
  };

  // Vérifier la disponibilité du gyroscope au montage
  useEffect(() => {
    const checkInitialSupport = () => {
      console.log('🔍 Vérification support gyroscope...');
      console.log('📱 iOS détecté:', isIOS());
      console.log('🔒 HTTPS:', isHTTPS());
      
      if (typeof DeviceOrientationEvent === 'undefined') {
        console.warn('❌ DeviceOrientationEvent non supporté');
        setPermission("denied");
        return;
      }

      // Vérification HTTPS pour iOS 13+
      if (isIOS() && !isHTTPS()) {
        console.warn('⚠️ HTTPS requis pour gyroscope sur iOS');
        setPermission("denied");
        return;
      }
      
      // Pour les navigateurs sans requestPermission, considérer comme disponible
      if (typeof (DeviceOrientationEvent as any).requestPermission !== "function") {
        console.log('✅ Gyroscope disponible (pas de requestPermission)');
        setPermission("granted");
      } else {
        console.log('📋 requestPermission disponible, demande requise');
      }
    };
    
    checkInitialSupport();
  }, []);

  const requestPermission = async () => {
    console.log('🚀 Demande de permission gyroscope...');
    console.log('🌐 User Agent:', navigator.userAgent);
    console.log('🔧 DeviceOrientationEvent:', typeof DeviceOrientationEvent);
    
    // Vérification préalable HTTPS pour iOS
    if (isIOS() && !isHTTPS()) {
      console.error('❌ HTTPS requis pour gyroscope sur iOS 13+');
      console.error('🔗 URL actuelle:', window.location.href);
      setPermission("denied");
      return false;
    }

    // iOS 13+ nécessite une demande explicite de permission
    if (typeof (DeviceOrientationEvent as any).requestPermission === "function") {
      try {
        console.log('📱 iOS Safari détecté - Demande permission DeviceOrientation...');
        
        // IMPORTANT: DeviceOrientationEvent.requestPermission() doit être appelé directement
        const orientationResponse = await (DeviceOrientationEvent as any).requestPermission();
        console.log('📋 Permission DeviceOrientation:', orientationResponse);
        
        // Demander aussi DeviceMotion si disponible
        if (typeof (DeviceMotionEvent as any).requestPermission === "function") {
          console.log('📱 Demande permission DeviceMotion...');
          const motionResponse = await (DeviceMotionEvent as any).requestPermission();
          console.log('📋 Permission DeviceMotion:', motionResponse);
        }
        
        const isGranted = orientationResponse === "granted";
        
        if (isGranted) {
          console.log('✅ Permissions gyroscope accordées');
          setPermission("granted");
          
          // Sur iOS, attacher les événements immédiatement après la permission
          if (isIOS()) {
            console.log('🔄 Initialisation immédiate des événements iOS');
            window.addEventListener("deviceorientation", handleOrientationImmediate);
          }
        } else {
          console.warn('⚠️ Permission gyroscope refusée');
          setPermission("denied");
        }
        
        return isGranted;
      } catch (error) {
        console.error("❌ Erreur demande permission gyroscope:", error);
        setPermission("denied");
        return false;
      }
    } else {
      // Pour les autres navigateurs/appareils, tester si l'événement est disponible
      console.log('📱 Pas de requestPermission - Test de support...');
      
      // Tester si DeviceOrientationEvent est supporté
      if (typeof DeviceOrientationEvent !== 'undefined') {
        console.log('✅ DeviceOrientationEvent supporté');
        setPermission("granted");
        return true;
      } else {
        console.warn('⚠️ DeviceOrientationEvent non supporté');
        setPermission("denied");
        return false;
      }
    }
  };

  // Handler immédiat pour iOS après permission
  const handleOrientationImmediate = (event: DeviceOrientationEvent) => {
    console.log('📱 iOS données gyroscope reçues immédiatement:', {
      alpha: event.alpha?.toFixed(1),
      beta: event.beta?.toFixed(1), 
      gamma: event.gamma?.toFixed(1)
    });
    
    setOrientation({
      alpha: event.alpha,
      beta: event.beta,
      gamma: event.gamma,
    });
  };

  useEffect(() => {
    const handleOrientation = (event: DeviceOrientationEvent) => {
      // Debug pour non-iOS uniquement (iOS utilise handleOrientationImmediate)
      if (!isIOS() && (event.alpha || event.beta || event.gamma)) {
        console.log('🤖 Android/autres données gyroscope reçues:', {
          alpha: event.alpha?.toFixed(1),
          beta: event.beta?.toFixed(1), 
          gamma: event.gamma?.toFixed(1)
        });
      }
      
      setOrientation({
        alpha: event.alpha,
        beta: event.beta,
        gamma: event.gamma,
      });
    };

    if (permission === "granted") {
      // Sur iOS, ne pas ajouter de listener ici car il est déjà ajouté dans requestPermission
      if (!isIOS()) {
        console.log('📡 Activation listener deviceorientation (non-iOS)');
        window.addEventListener("deviceorientation", handleOrientation);
      }
      
      // Test après 2 secondes si on reçoit des données
      const timeoutId = setTimeout(() => {
        if (!orientation.alpha && !orientation.beta && !orientation.gamma) {
          console.warn('⚠️ Aucune donnée gyroscope reçue après 2s');
          console.log('💡 Vérifiez que les permissions sont bien accordées et que l\'appareil bouge');
        }
      }, 2000);
      
      return () => {
        clearTimeout(timeoutId);
        if (!isIOS()) {
          console.log('📡 Désactivation listener deviceorientation (non-iOS)');
          window.removeEventListener("deviceorientation", handleOrientation);
        }
      };
    }
  }, [permission]);

  // Nettoyage des listeners au démontage
  useEffect(() => {
    return () => {
      if (isIOS()) {
        window.removeEventListener("deviceorientation", handleOrientationImmediate);
      }
    };
  }, []);

  return {
    orientation,
    permission,
    requestPermission,
  };
};
