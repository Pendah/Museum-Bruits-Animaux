# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Museum - Bruits de la Nuit is an immersive web experience for discovering nocturnal animal sounds, developed for the Museum of Toulouse. The app provides a 360° forest environment where users can use their device's sensors to locate and discover animals through spatialized 3D audio.

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build  

# Lint code
npm run lint

# Preview production build
npm run preview
```

## Tech Stack & Architecture

- **React 19** with TypeScript in strict mode
- **Vite** for build tooling and development
- **Three.js** with @react-three/fiber for 3D rendering
- **SCSS** for styling
- **Framer Motion** for animations
- **Web Audio API** for spatialized 3D audio
- **Device Orientation API** for gyroscope/accelerometer

## Key Architectural Patterns

### State Management
The app uses React's built-in state management with a central `GameState` interface that tracks:
- Current active animal
- Discovered animals list  
- Listening state
- Modal visibility

### Custom Hooks Architecture
Two critical custom hooks handle device capabilities:

1. **`useSpatialAudio`** - Manages Web Audio API for 3D positioned sounds:
   - Creates AudioContext with spatial audio nodes
   - Handles animal sound positioning in 3D space
   - Manages background ambient forest sounds
   - Updates listener orientation based on device movement

2. **`useDeviceOrientation`** - Handles device sensor permissions and data:
   - Requests iOS permissions for DeviceOrientationEvent
   - Provides fallback for unsupported devices
   - Normalizes orientation data across platforms

### 3D Scene Architecture
- **Scene360** component renders 360° forest environment using sphere geometry
- **CameraController** translates device orientation to Three.js camera rotation  
- Fallback to OrbitControls for desktop/devices without gyroscope

## Asset Structure

Assets are organized in `public/assets/`:
- `sounds/` - MP3 audio files for animals and ambient forest sounds
- `videos/` - MP4 videos from camera traps for each animal
- `textures/` - 360° panoramic forest images

## Animal Data Structure

Animals are defined in `src/data/animals.ts` with:
- 3D position coordinates for spatial audio
- Detection radius (tolerance for user orientation)
- Associated sound and video file paths
- Localized descriptions in French

## Mobile-First Considerations

- PWA with fullscreen display mode
- Optimized for touch interfaces with disabled zoom/selection
- Automatic sensor permission handling for iOS
- Performance-optimized Three.js rendering
- Responsive design for various screen sizes

## Key Features Implementation

- **Audio Spatialization**: Uses Web Audio API PannerNode with HRTF for realistic 3D positioning
- **Device Orientation**: Direct integration with gyroscope/accelerometer with iOS permission handling
- **Animal Detection**: Vector angle calculations between user direction and animal positions
- **Progressive Discovery**: Random animal selection from undiscovered set

## Build Configuration

- TypeScript with composite project configuration
- ESLint with React hooks and TypeScript rules
- Vite with React plugin for HMR
- SCSS preprocessing
- Production builds include asset optimization