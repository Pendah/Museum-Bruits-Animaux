import { useState, useEffect, useRef, useCallback } from 'react';
import type { Animal } from '../types';

export const useSpatialAudio = () => {
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [audioBuffers, setAudioBuffers] = useState<Map<string, AudioBuffer>>(new Map());
  const soundNodes = useRef<Map<string, AudioBufferSourceNode>>(new Map());
  const gainNodes = useRef<Map<string, GainNode>>(new Map());
  const ambianceNode = useRef<AudioBufferSourceNode | null>(null);

  const initializeAudioContext = async () => {
    if (!audioContext) {
      const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) {
        throw new Error('AudioContext not supported');
      }
      const ctx = new AudioContextClass();
      setAudioContext(ctx);
      
      // S'assurer que l'AudioContext est actif après interaction utilisateur
      if (ctx.state === 'suspended') {
        try {
          await ctx.resume();
          console.log('✅ AudioContext resumed successfully');
        } catch (error) {
          console.error('❌ Failed to resume AudioContext:', error);
          throw error;
        }
      }
      
      return ctx;
    }
    
    // Si AudioContext existe mais est suspendu, le réactiver
    if (audioContext.state === 'suspended') {
      try {
        await audioContext.resume();
        console.log('✅ Existing AudioContext resumed');
      } catch (error) {
        console.error('❌ Failed to resume existing AudioContext:', error);
        throw error;
      }
    }
    
    return audioContext;
  };

  const loadAudioBuffer = async (url: string): Promise<AudioBuffer> => {
    if (audioBuffers.has(url)) {
      return audioBuffers.get(url)!;
    }

    const ctx = await initializeAudioContext();
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
    
    setAudioBuffers(prev => new Map(prev.set(url, audioBuffer)));
    return audioBuffer;
  };

  const playAnimalSound = async (animal: Animal, loop: boolean = true) => {
    try {
      console.log('🔊 Tentative de lecture du son:', animal.name, animal.soundFile);
      const ctx = await initializeAudioContext();
      console.log('📱 AudioContext état:', ctx.state);
      
      // Vérifier que l'AudioContext est vraiment actif
      if (ctx.state !== 'running') {
        console.warn('⚠️ AudioContext not running, état:', ctx.state);
        return false;
      }
      
      const buffer = await loadAudioBuffer(animal.soundFile);
      console.log('🎵 Buffer audio chargé:', buffer.duration, 'secondes');
      
      stopAnimalSound(animal.id);
      
      const source = ctx.createBufferSource();
      const gainNode = ctx.createGain();
      
      source.buffer = buffer;
      source.loop = loop;
      
      // Volume initial faible (sera ajusté par angle)
      gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
      
      console.log(`🎯 Animal configuré: ${animal.name} à [${animal.position.x}, ${animal.position.y}, ${animal.position.z}]`);
      
      source.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      // Gestion des événements de lecture
      source.onended = () => {
        console.log('🎵 Son terminé:', animal.name);
      };
      
      source.start();
      console.log('✅ Son démarré pour:', animal.name);
      
      soundNodes.current.set(animal.id, source);
      gainNodes.current.set(animal.id, gainNode);
      
      return true;
      
    } catch (error) {
      console.error('❌ Erreur lecture audio:', error);
      console.error('URL tentée:', animal.soundFile);
      
      // Informations de debug utiles
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          console.error('🚫 Autoplay bloqué par le navigateur');
        } else if (error.name === 'NotSupportedError') {
          console.error('🎵 Format audio non supporté');
        }
      }
      
      return false;
    }
  };

  const stopAnimalSound = (animalId: string) => {
    const source = soundNodes.current.get(animalId);
    if (source) {
      source.stop();
      soundNodes.current.delete(animalId);
      gainNodes.current.delete(animalId);
    }
  };


  const playAmbiance = async () => {
    try {
      console.log('🌲 Démarrage ambiance sonore');
      const ctx = await initializeAudioContext();
      const buffer = await loadAudioBuffer('/assets/sounds/night-forest-soundscape.mp3');
      
      if (ambianceNode.current) {
        ambianceNode.current.stop();
      }
      
      const source = ctx.createBufferSource();
      const gainNode = ctx.createGain();
      
      source.buffer = buffer;
      source.loop = true;
      
      // Volume ambiance plus faible pour ne pas couvrir les animaux
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      
      source.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      source.start();
      ambianceNode.current = source;
      
      console.log('✅ Ambiance sonore démarrée');
    } catch (error) {
      console.error('❌ Erreur ambiance sonore:', error);
    }
  };

  const stopAmbiance = () => {
    if (ambianceNode.current) {
      ambianceNode.current.stop();
      ambianceNode.current = null;
      console.log('🔇 Ambiance sonore arrêtée');
    }
  };

  const stopAllSounds = useCallback(() => {
    soundNodes.current.forEach((source) => {
      source.stop();
    });
    soundNodes.current.clear();
    gainNodes.current.clear();
    stopAmbiance();
  }, []);

  useEffect(() => {
    return () => {
      stopAllSounds();
    };
  }, [stopAllSounds]);


  const updateVolumeByAngle = useCallback((animalId: string, angularDistance: number) => {
    const gainNode = gainNodes.current.get(animalId);
    if (!gainNode || !audioContext) return;

    // Calcul du volume basé uniquement sur l'angle (0° = fort, 180° = faible)
    const maxVolume = 1.0; // Volume max quand on regarde direct (0°)
    const minVolume = 0.1; // Volume minimum plus audible
    const maxAngle = 90; // Zone d'audibilité plus restreinte (90° au lieu de 120°)
    
    // Plus l'angle est petit, plus le volume est fort avec une courbe exponentielle
    const normalizedAngle = Math.min(angularDistance, maxAngle) / maxAngle;
    const volumeRatio = Math.pow(1 - normalizedAngle, 2); // Courbe quadratique pour plus de contraste
    const volume = minVolume + (maxVolume - minVolume) * volumeRatio;

    // Transition douce du volume
    gainNode.gain.setTargetAtTime(volume, audioContext.currentTime, 0.1);
    
    // Debug du volume avec plus de détails
    console.log(`🔊 Volume: ${volume.toFixed(3)} | Angle: ${angularDistance.toFixed(1)}° | Ratio: ${volumeRatio.toFixed(3)} | Animal: ${animalId}`);
  }, [audioContext]);

  return {
    initializeAudioContext,
    playAnimalSound,
    stopAnimalSound,
    stopAllSounds,
    playAmbiance,
    stopAmbiance,
    updateVolumeByAngle,
    isReady: audioContext !== null
  };
};