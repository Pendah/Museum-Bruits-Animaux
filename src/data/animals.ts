import type { Animal } from '../types';

export const animals: Animal[] = [
  {
    id: 'martre',
    name: 'Martre des pins',
    description: 'La martre des pins est un petit carnivore nocturne de la famille des mustélidés. Elle émet des cris aigus et des glapissements pour communiquer, particulièrement active durant les nuits d\'été.',
    soundFile: '/assets/sounds/martre.mp3',
    videoFile: '/assets/videos/martre.mp4',
    position: { x: -12, y: 2, z: -8 },
    detectionRadius: 4
  },
  {
    id: 'fox',
    name: 'Renard roux',
    description: 'Le renard roux est un mammifère carnivore très adaptable. La nuit, il émet différents cris pour communiquer avec ses congénères. Son glapissement aigu peut porter sur de longues distances.',
    soundFile: '/assets/sounds/fox.mp3',
    videoFile: '/assets/videos/fox.mp4',
    position: { x: 10, y: 0, z: -12 },
    detectionRadius: 4
  },
  {
    id: 'wildboar',
    name: 'Sanglier',
    description: 'Le sanglier est un mammifère omnivore nocturne très présent dans les forêts européennes. Il émet des grognements sourds et des soufflements, surtout lors de ses déplacements en groupe la nuit.',
    soundFile: '/assets/sounds/wildboar.mp3',
    videoFile: '/assets/videos/wildboar.mp4',
    position: { x: 8, y: 0, z: 14 },
    detectionRadius: 4
  },
  {
    id: 'deer',
    name: 'Chevreuil',
    description: 'Le chevreuil est un cervidé élégant et discret qui habite les forêts et les lisières. La nuit, il émet des aboiements courts et aigus pour communiquer avec ses congénères ou signaler un danger.',
    soundFile: '/assets/sounds/deer.mp3',
    videoFile: '/assets/videos/deer.mp4',
    position: { x: -8, y: 1, z: 12 },
    detectionRadius: 4
  },
  {
    id: 'genet',
    name: 'Genette commune',
    description: 'La genette commune est un petit carnivore nocturne aux allures de chat sauvage. Elle émet des miaulements, des grognements et des cris aigus pour marquer son territoire et communiquer, principalement active la nuit.',
    soundFile: '/assets/sounds/genet.mp3',
    videoFile: '/assets/videos/genet.jpg',
    position: { x: 12, y: 1, z: -6 },
    detectionRadius: 4
  }
];