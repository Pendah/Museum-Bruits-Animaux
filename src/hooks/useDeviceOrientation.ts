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

  // Vérifier la disponibilité du gyroscope au montage
  useEffect(() => {
    const checkInitialSupport = () => {
      if (typeof DeviceOrientationEvent === 'undefined') {
        setPermission("denied");
        return;
      }
      
      // Pour les navigateurs sans requestPermission, considérer comme disponible
      const DeviceOrientationEventTyped = DeviceOrientationEvent as unknown as {
        requestPermission?: () => Promise<PermissionState>;
      };
      
      if (typeof DeviceOrientationEventTyped.requestPermission !== "function") {
        setPermission("granted");
      }
    };
    
    checkInitialSupport();
  }, []);

  const requestPermission = async () => {
    // iOS 13+ nécessite une demande explicite de permission
    const DeviceOrientationEventTyped = DeviceOrientationEvent as unknown as {
      requestPermission?: () => Promise<PermissionState>;
    };
    
    if (typeof DeviceOrientationEventTyped.requestPermission === "function") {
      try {
        console.log('📱 Demande de permission DeviceOrientation...');
        const response = await DeviceOrientationEventTyped.requestPermission();
        console.log('📱 Réponse permission:', response);
        setPermission(response as "granted" | "denied");
        return response === "granted";
      } catch (error) {
        console.error("❌ Erreur demande permission orientation:", error);
        setPermission("denied");
        return false;
      }
    } else {
      // Pour les autres navigateurs/appareils, tester si l'événement est disponible
      console.log('📱 Pas de requestPermission, vérification support...');
      
      // Tester si DeviceOrientationEvent est supporté
      if (typeof DeviceOrientationEvent !== 'undefined') {
        setPermission("granted");
        return true;
      } else {
        console.warn('⚠️ DeviceOrientationEvent non supporté');
        setPermission("denied");
        return false;
      }
    }
  };

  useEffect(() => {
    const handleOrientation = (event: DeviceOrientationEvent) => {
      setOrientation({
        alpha: event.alpha,
        beta: event.beta,
        gamma: event.gamma,
      });
    };

    if (permission === "granted") {
      window.addEventListener("deviceorientation", handleOrientation);
      return () =>
        window.removeEventListener("deviceorientation", handleOrientation);
    }
  }, [permission]);

  return {
    orientation,
    permission,
    requestPermission,
  };
};
