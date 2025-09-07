import { useRef, useEffect, Suspense } from 'react';
import { Canvas, useFrame, useThree, useLoader } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { TextureLoader } from 'three';
import { useDeviceOrientation } from '../hooks/useDeviceOrientation';

interface Scene360Props {
  textureUrl?: string;
  onDirectionChange?: (direction: THREE.Vector3) => void;
  useGyroscope?: boolean;
}

function ForestEnvironment({ textureUrl }: { textureUrl?: string }) {
  const texture = textureUrl ? useLoader(TextureLoader, textureUrl) : null;

  useEffect(() => {
    if (texture) {
      console.log('Texture chargée avec useLoader');
      // Configuration spécifique pour les textures 360°
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;
      texture.flipY = false;
      texture.needsUpdate = true;
    }
  }, [texture]);

  return (
    <mesh>
      <sphereGeometry args={[10, 32, 32]} />
      <meshBasicMaterial 
        map={texture || undefined}
        color={texture ? "#ffffff" : "#ff0000"}
        side={THREE.BackSide}
      />
    </mesh>
  );
}

function CameraController({ 
  orientation, 
  onDirectionChange 
}: { 
  orientation: any;
  onDirectionChange?: (direction: THREE.Vector3) => void;
}) {
  const { camera } = useThree();
  const initialRotation = useRef<THREE.Euler | null>(null);

  useFrame(() => {
    if (orientation.alpha !== null && orientation.beta !== null && orientation.gamma !== null) {
      if (!initialRotation.current) {
        initialRotation.current = camera.rotation.clone();
      }

      const alpha = orientation.alpha * Math.PI / 180;
      const beta = orientation.beta * Math.PI / 180;
      const gamma = orientation.gamma * Math.PI / 180;

      camera.rotation.set(
        beta + initialRotation.current.x,
        alpha + initialRotation.current.y,
        gamma + initialRotation.current.z
      );

      if (onDirectionChange) {
        const direction = new THREE.Vector3(0, 0, -1);
        direction.applyQuaternion(camera.quaternion);
        onDirectionChange(direction);
      }
    }
  });

  return null;
}

export const Scene360: React.FC<Scene360Props> = ({ 
  textureUrl, 
  onDirectionChange,
  useGyroscope = true
}) => {
  const { orientation } = useDeviceOrientation();

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Canvas
        camera={{
          position: [0, 0, 0.1],
          fov: 90,
          near: 0.1,
          far: 1000
        }}
      >
        <Suspense fallback={null}>
          <ForestEnvironment textureUrl={textureUrl} />
          {useGyroscope && (
            <CameraController 
              orientation={orientation}
              onDirectionChange={onDirectionChange}
            />
          )}
          <OrbitControls 
            enabled={!useGyroscope || orientation.alpha === null}
            enableZoom={false}
            enablePan={false}
            rotateSpeed={0.5}
          />
        </Suspense>
      </Canvas>
    </div>
  );
};