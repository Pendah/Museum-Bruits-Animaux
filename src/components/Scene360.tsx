import { useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Sphere, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useDeviceOrientation } from '../hooks/useDeviceOrientation';

interface Scene360Props {
  textureUrl?: string;
  onDirectionChange?: (direction: THREE.Vector3) => void;
}

function ForestEnvironment({ textureUrl }: { textureUrl?: string }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useEffect(() => {
    if (textureUrl) {
      const loader = new THREE.TextureLoader();
      loader.load(textureUrl, (texture) => {
        if (meshRef.current) {
          (meshRef.current.material as THREE.MeshBasicMaterial).map = texture;
        }
      });
    }
  }, [textureUrl]);

  return (
    <Sphere ref={meshRef} args={[500, 60, 40]} scale={[-1, 1, 1]}>
      <meshBasicMaterial 
        side={THREE.BackSide}
        color={textureUrl ? 'white' : '#1a2f1a'}
      />
    </Sphere>
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
  onDirectionChange 
}) => {
  const { orientation } = useDeviceOrientation();

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Canvas
        camera={{
          position: [0, 0, 0],
          fov: 75,
          near: 0.1,
          far: 1000
        }}
      >
        <ambientLight intensity={0.6} />
        <ForestEnvironment textureUrl={textureUrl} />
        <CameraController 
          orientation={orientation}
          onDirectionChange={onDirectionChange}
        />
        <OrbitControls 
          enabled={orientation.alpha === null}
          enableZoom={false}
          enablePan={false}
          rotateSpeed={0.5}
        />
      </Canvas>
    </div>
  );
};