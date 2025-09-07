import { useState, useEffect, useRef } from 'react';
import type { Animal } from '../types';

export const useSpatialAudio = () => {
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [audioBuffers, setAudioBuffers] = useState<Map<string, AudioBuffer>>(new Map());
  const soundNodes = useRef<Map<string, AudioBufferSourceNode>>(new Map());
  const panners = useRef<Map<string, PannerNode>>(new Map());

  const initializeAudioContext = async () => {
    if (!audioContext) {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      setAudioContext(ctx);
      
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }
      
      return ctx;
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
      const ctx = await initializeAudioContext();
      const buffer = await loadAudioBuffer(animal.soundFile);
      
      stopAnimalSound(animal.id);
      
      const source = ctx.createBufferSource();
      const panner = ctx.createPanner();
      
      source.buffer = buffer;
      source.loop = loop;
      
      panner.panningModel = 'HRTF';
      panner.distanceModel = 'inverse';
      panner.refDistance = 1;
      panner.maxDistance = 10000;
      panner.rolloffFactor = 1;
      panner.coneInnerAngle = 360;
      panner.coneOuterAngle = 0;
      panner.coneOuterGain = 0;
      
      panner.positionX.setValueAtTime(animal.position.x, ctx.currentTime);
      panner.positionY.setValueAtTime(animal.position.y, ctx.currentTime);
      panner.positionZ.setValueAtTime(animal.position.z, ctx.currentTime);
      
      source.connect(panner);
      panner.connect(ctx.destination);
      
      source.start();
      
      soundNodes.current.set(animal.id, source);
      panners.current.set(animal.id, panner);
      
    } catch (error) {
      console.error('Error playing spatial audio:', error);
    }
  };

  const stopAnimalSound = (animalId: string) => {
    const source = soundNodes.current.get(animalId);
    if (source) {
      source.stop();
      soundNodes.current.delete(animalId);
      panners.current.delete(animalId);
    }
  };

  const updateListenerOrientation = (alpha: number, beta: number, gamma: number) => {
    if (!audioContext?.listener) return;
    
    const alphaRad = alpha * Math.PI / 180;
    const betaRad = beta * Math.PI / 180;
    const gammaRad = gamma * Math.PI / 180;
    
    const forwardX = Math.sin(alphaRad) * Math.cos(betaRad);
    const forwardY = -Math.sin(betaRad);
    const forwardZ = -Math.cos(alphaRad) * Math.cos(betaRad);
    
    const upX = Math.sin(alphaRad) * Math.sin(betaRad) * Math.sin(gammaRad) - Math.cos(alphaRad) * Math.cos(gammaRad);
    const upY = Math.cos(betaRad) * Math.sin(gammaRad);
    const upZ = -Math.cos(alphaRad) * Math.sin(betaRad) * Math.sin(gammaRad) - Math.sin(alphaRad) * Math.cos(gammaRad);
    
    if (audioContext.listener.forwardX) {
      audioContext.listener.forwardX.setValueAtTime(forwardX, audioContext.currentTime);
      audioContext.listener.forwardY.setValueAtTime(forwardY, audioContext.currentTime);
      audioContext.listener.forwardZ.setValueAtTime(forwardZ, audioContext.currentTime);
      audioContext.listener.upX.setValueAtTime(upX, audioContext.currentTime);
      audioContext.listener.upY.setValueAtTime(upY, audioContext.currentTime);
      audioContext.listener.upZ.setValueAtTime(upZ, audioContext.currentTime);
    }
  };

  const stopAllSounds = () => {
    soundNodes.current.forEach((source, id) => {
      source.stop();
    });
    soundNodes.current.clear();
    panners.current.clear();
  };

  useEffect(() => {
    return () => {
      stopAllSounds();
    };
  }, []);

  return {
    initializeAudioContext,
    playAnimalSound,
    stopAnimalSound,
    updateListenerOrientation,
    stopAllSounds,
    isReady: audioContext !== null
  };
};