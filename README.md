# Museum - Bruits de la Nuit

Une expérience web immersive pour découvrir les bruits nocturnes des animaux, développée pour le Muséum de Toulouse.

## 🎯 Concept

Cette application propose une expérience 360° où les utilisateurs :
- Évoluent dans un environnement forestier nocturne
- Écoutent des sons d'animaux spatialisés en 3D
- Utilisent les capteurs de leur téléphone/tablette pour s'orienter
- Découvrent des vidéos d'animaux captés par des pièges photographiques

## 🚀 Installation et démarrage

```bash
# Installation des dépendances
npm install

# Démarrage en mode développement
npm run dev

# Build de production
npm run build
```

## 📱 Optimisations mobiles

- **PWA** : Installation possible sur l'écran d'accueil
- **Capteurs** : Utilisation du gyroscope et de l'accéléromètre
- **Audio spatial** : Positionnement 3D des sons
- **Interface tactile** : Optimisée pour les écrans tactiles
- **Performance** : Rendu optimisé avec Three.js

## 🔧 Technologies utilisées

- **React 18** + **TypeScript**
- **Vite** pour le build et le développement
- **Three.js** + **@react-three/fiber** pour le rendu 3D
- **SCSS** pour les styles
- **Framer Motion** pour les animations
- **Web Audio API** pour l'audio spatialisé
- **Device Orientation API** pour les capteurs

## 📁 Structure du projet

```
src/
├── components/          # Composants React
│   ├── Scene360.tsx    # Environnement 3D
│   ├── GameUI.tsx      # Interface utilisateur
│   └── AnimalModal.tsx # Modal d'information
├── hooks/              # Hooks personnalisés
│   ├── useDeviceOrientation.ts
│   └── useSpatialAudio.ts
├── types/              # Types TypeScript
├── data/               # Données des animaux
└── assets/             # Médias (sons, vidéos, textures)
    ├── sounds/         # Fichiers audio des animaux
    ├── videos/         # Vidéos des pièges photo
    ├── textures/       # Textures 360°
    └── images/         # Images des animaux
```

## 🎵 Assets requis

Pour que l'expérience fonctionne complètement, vous devez ajouter :

### Sons (format MP3 ou OGG) dans `public/assets/sounds/` :
- `owl.mp3` - Cri de chouette hulotte
- `fox.mp3` - Glapissement de renard
- `bat.mp3` - Ultrasons de chauve-souris (rendus audibles)
- `deer.mp3` - Brame du cerf
- `wolf.mp3` - Hurlement de loup

### Vidéos (format MP4) dans `public/assets/videos/` :
- `owl.mp4` - Vidéo de chouette hulotte
- `fox.mp4` - Vidéo de renard roux  
- `bat.mp4` - Vidéo de chauve-souris
- `deer.mp4` - Vidéo de cerf élaphe
- `wolf.mp4` - Vidéo de loup gris

### Texture 360° dans `public/assets/textures/` :
- `forest-night-360.jpg` - Photo panoramique 360° de forêt nocturne

### Icônes PWA dans `public/` :
- `icon-192.png` - Icône 192x192px
- `icon-512.png` - Icône 512x512px

## 🌟 Fonctionnalités

### Audio spatial 3D
- Positionnement des sons dans l'espace 3D
- Adaptation automatique selon l'orientation de l'appareil
- Support des écouteurs stéréo et du son surround

### Détection d'orientation
- Utilisation du gyroscope et de l'accéléromètre
- Demande d'autorisation automatique sur iOS
- Fallback sur contrôles tactiles si non supporté

### Interface immersive
- Environnement 360° avec Three.js
- Animations fluides avec Framer Motion
- Design adaptatif pour tous les écrans

## 🎮 Utilisation

1. **Démarrage** : Appuyer sur "Commencer l'exploration"
2. **Écoute** : Un son d'animal commence à jouer
3. **Recherche** : Tourner avec le téléphone pour localiser l'origine du son
4. **Découverte** : Quand l'orientation est correcte, l'animal est détecté
5. **Information** : Affichage de la vidéo et des informations sur l'animal
6. **Progression** : Passer à l'animal suivant jusqu'à tous les découvrir

## 📋 Notes de développement

- Les permissions pour les capteurs sont gérées automatiquement
- L'audio nécessite une interaction utilisateur pour démarrer (contrainte navigateur)
- Les performances sont optimisées pour les appareils mobiles
- Le rendu 3D s'adapte automatiquement aux capacités de l'appareil

## 🐛 Debug

Pour tester sans capteurs (sur ordinateur) :
- Les contrôles de caméra OrbitControls sont activés automatiquement
- La détection fonctionne avec la souris et les clics

## 📄 Licence

Développé pour le Muséum de Toulouse - Usage éducatif