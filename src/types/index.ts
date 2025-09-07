export interface Animal {
  id: string;
  name: string;
  description: string;
  soundFile: string;
  videoFile: string;
  position: {
    x: number;
    y: number;
    z: number;
  };
  detectionRadius: number;
}

export interface DeviceOrientationData {
  alpha: number | null;
  beta: number | null;
  gamma: number | null;
}

export interface GameState {
  currentAnimal: Animal | null;
  discoveredAnimals: string[];
  isListening: boolean;
  showVideoModal: boolean;
}

export interface SpatialAudioContext {
  context: AudioContext;
  listener: AudioListener;
  sounds: Map<string, AudioBufferSourceNode>;
}