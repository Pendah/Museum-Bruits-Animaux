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

  const requestPermission = async () => {
    if (typeof (DeviceOrientationEvent as any).requestPermission === "function") {
      try {
        const response = await (DeviceOrientationEvent as any).requestPermission();
        setPermission(response);
        return response === "granted";
      } catch (error) {
        console.error("Error requesting device orientation permission:", error);
        setPermission("denied");
        return false;
      }
    } else {
      setPermission("granted");
      return true;
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
