import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  invitationConfig,
  getCharacterPlanetTransform,
} from '../config/invitationConfig';
import { StorybookPlanet } from '../planets/StorybookPlanets';
import { ShadowBoxEnvironment } from './ShadowBoxEnvironment';
import {
  ImmersiveCamera,
  SceneStage,
  getPlanetIndexForStage,
} from '../camera/ImmersiveCamera';
import { LittlePrinceAndFox } from '../characters/LittlePrinceAndFox';

interface UniverseSceneProps {
  stage: SceneStage;
  reducedMotion?: boolean;
  parallaxOffset: { x: number; y: number };
  onTransitionStart?: () => void;
  onTransitionComplete?: (arrivedStage: SceneStage) => void;
}

export const UniverseScene: React.FC<UniverseSceneProps> = ({
  stage,
  reducedMotion = false,
  parallaxOffset,
  onTransitionStart,
  onTransitionComplete,
}) => {
  const initialCharPos = getCharacterPlanetTransform(
    invitationConfig.planets[0]
  ).position;
  const liveCharacterPosRef = useRef(new THREE.Vector3(...initialCharPos));

  const ambientLightRef = useRef<THREE.AmbientLight>(null);
  const keyLightRef = useRef<THREE.DirectionalLight>(null);

  const normalAmbientColor = useMemo(() => new THREE.Color('#f5ebd6'), []);
  const goldenAmbientColor = useMemo(() => new THREE.Color('#ffe9b5'), []);
  const normalKeyColor = useMemo(() => new THREE.Color('#ffe8b8'), []);
  const goldenKeyColor = useMemo(() => new THREE.Color('#ffd97d'), []);

  const currentPlanetIndex = getPlanetIndexForStage(stage);
  const isDestinationScene = stage === 'planet-5';

  // Gradually shift scene lighting to warm golden tones on Escena 05 (El Destino)
  useFrame((_, delta) => {
    const damp = 1 - Math.exp(-2.2 * delta);
    if (ambientLightRef.current) {
      ambientLightRef.current.color.lerp(
        isDestinationScene ? goldenAmbientColor : normalAmbientColor,
        damp
      );
      ambientLightRef.current.intensity = THREE.MathUtils.lerp(
        ambientLightRef.current.intensity,
        isDestinationScene ? 1.05 : 0.85,
        damp
      );
    }
    if (keyLightRef.current) {
      keyLightRef.current.color.lerp(
        isDestinationScene ? goldenKeyColor : normalKeyColor,
        damp
      );
      keyLightRef.current.intensity = THREE.MathUtils.lerp(
        keyLightRef.current.intensity,
        isDestinationScene ? 1.65 : 1.35,
        damp
      );
    }
  });

  return (
    <>
      <color attach="background" args={['#1a2744']} />
      <fog attach="fog" args={['#1a2744', 18, 42]} />

      {/* Camera Controller for FASE 1 to FASE 5 */}
      <ImmersiveCamera
        stage={stage}
        reducedMotion={reducedMotion}
        parallaxOffset={parallaxOffset}
        liveCharacterPosRef={liveCharacterPosRef}
        onTransitionStart={onTransitionStart}
        onTransitionComplete={onTransitionComplete}
      />

      {/* Storybook Shadow Box Lighting (gradually shifts to warm gold in Scene 05) */}
      <ambientLight ref={ambientLightRef} intensity={0.85} color="#f5ebd6" />
      <hemisphereLight
        color="#fff3d6"
        groundColor="#2c3e66"
        intensity={0.75}
      />
      <directionalLight
        ref={keyLightRef}
        position={[8, 14, 12]}
        intensity={1.35}
        color="#ffe8b8"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0005}
      />
      <directionalLight
        position={[-10, -6, 8]}
        intensity={0.45}
        color="#9bbce0"
      />

      {/* Multi-layered Shadow Box Environment */}
      <ShadowBoxEnvironment reducedMotion={reducedMotion} />

      {/* El Principito y su Zorro (Continuous 3D actors that leap between all 5 planets) */}
      <LittlePrinceAndFox
        currentPlanetIndex={currentPlanetIndex}
        reducedMotion={reducedMotion}
        isFocused={stage !== 'universe'}
        liveWorldPosRef={liveCharacterPosRef}
      />

      {/* All Storybook Planets distributed in depth across the complete universe */}
      <group>
        {invitationConfig.planets.map((planet, idx) => (
          <StorybookPlanet
            key={planet.id}
            config={planet}
            reducedMotion={reducedMotion}
            isFocused={stage !== 'universe' && idx === currentPlanetIndex}
          />
        ))}
      </group>
    </>
  );
};
