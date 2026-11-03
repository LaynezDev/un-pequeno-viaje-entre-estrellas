import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  createPaperMaterialProps,
  getWatercolorWashTexture,
} from '../materials/paperMaterials';
import { invitationConfig } from '../config/invitationConfig';

interface EnvironmentProps {
  reducedMotion?: boolean;
}

export const ShadowBoxEnvironment: React.FC<EnvironmentProps> = ({
  reducedMotion = false,
}) => {
  const starsGroupRef = useRef<THREE.Group>(null);
  const asteroidsGroupRef = useRef<THREE.Group>(null);
  const foregroundLayerRef = useRef<THREE.Group>(null);

  const creamPaperMat = useMemo(
    () =>
      createPaperMaterialProps('#fbf5e6', {
        emissive: '#f5e6c4',
        emissiveIntensity: 0.16,
      }),
    []
  );

  const warmStarMat = useMemo(
    () =>
      createPaperMaterialProps('#ffe27a', {
        emissive: '#ffcf40',
        emissiveIntensity: 0.42,
      }),
    []
  );

  const softBluePaperMat = useMemo(
    () =>
      createPaperMaterialProps('#314870', {
        emissive: '#223556',
        emissiveIntensity: 0.15,
      }),
    []
  );

  const asteroidMat = useMemo(
    () =>
      createPaperMaterialProps('#c9b79c', {
        emissive: '#9e8c72',
        emissiveIntensity: 0.1,
      }),
    []
  );

  // Watercolor Nebula Wash Textures
  const goldNebulaTex = useMemo(
    () =>
      getWatercolorWashTexture(
        'rgba(255, 232, 166, 0.36)',
        'rgba(143, 184, 222, 0.08)'
      ),
    []
  );
  const roseNebulaTex = useMemo(
    () =>
      getWatercolorWashTexture(
        'rgba(235, 162, 176, 0.32)',
        'rgba(104, 125, 185, 0.06)'
      ),
    []
  );
  const dreamyBlueNebulaTex = useMemo(
    () =>
      getWatercolorWashTexture(
        'rgba(155, 198, 240, 0.32)',
        'rgba(40, 62, 108, 0.05)'
      ),
    []
  );

  // 3D Paper Stars distributed across multiple depth planes
  const paperStars = useMemo(() => {
    const items: Array<{
      pos: [number, number, number];
      scale: number;
      speed: number;
      phase: number;
    }> = [];
    // Deterministic pseudo-random layout for artistic composition
    for (let i = 0; i < 85; i++) {
      const seed = i * 13.37;
      const x = ((Math.sin(seed) * 10000) % 1) * 32 - 16;
      const y = ((Math.cos(seed * 1.3) * 10000) % 1) * 20 - 10;
      const z = ((Math.sin(seed * 2.1) * 10000) % 1) * 24 - 14;
      const scale = 0.05 + Math.abs(Math.sin(seed * 3.7)) * 0.14;
      items.push({
        pos: [x, y, z],
        scale,
        speed: 0.8 + (i % 5) * 0.35,
        phase: i * 0.7,
      });
    }
    return items;
  }, []);

  // Small Cut-Paper Asteroids floating in the universe
  const asteroids = useMemo(
    () => [
      { pos: [-9.2, 3.6, 2.5] as [number, number, number], scale: 0.34, rotSpeed: 0.22 },
      { pos: [-4.8, -3.9, 6.2] as [number, number, number], scale: 0.25, rotSpeed: -0.18 },
      { pos: [1.5, 4.3, -2.2] as [number, number, number], scale: 0.38, rotSpeed: 0.15 },
      { pos: [8.4, -2.8, 4.2] as [number, number, number], scale: 0.29, rotSpeed: -0.24 },
      { pos: [5.6, 4.4, -4.5] as [number, number, number], scale: 0.42, rotSpeed: 0.19 },
      { pos: [-7.5, 0.8, -5.0] as [number, number, number], scale: 0.32, rotSpeed: 0.16 },
      { pos: [0.4, -4.2, 3.8] as [number, number, number], scale: 0.22, rotSpeed: -0.21 },
    ],
    []
  );

  // Constellation / Starry Path crumbs gently hinting at the journey between planets
  const constellationCrumbs = useMemo(() => {
    const pts: THREE.Vector3[] = invitationConfig.planets.map(
      (p) => new THREE.Vector3(...p.position)
    );
    const curve = new THREE.CatmullRomCurve3(pts);
    return curve.getPoints(42);
  }, []);

  useFrame(({ clock }) => {
    if (reducedMotion) return;
    const t = clock.getElapsedTime();

    if (starsGroupRef.current) {
      starsGroupRef.current.children.forEach((child, idx) => {
        const data = paperStars[idx];
        if (!data) return;
        const pulse = 1 + Math.sin(t * data.speed + data.phase) * 0.24;
        child.scale.setScalar(data.scale * pulse);
        child.rotation.z = Math.sin(t * 0.4 + data.phase) * 0.2;
      });
    }

    if (asteroidsGroupRef.current) {
      asteroidsGroupRef.current.children.forEach((child, idx) => {
        const data = asteroids[idx];
        if (!data) return;
        child.rotation.x = t * data.rotSpeed;
        child.rotation.y = t * data.rotSpeed * 0.8;
        child.position.y =
          data.pos[1] + Math.sin(t * 0.55 + idx * 1.4) * 0.12;
      });
    }

    if (foregroundLayerRef.current) {
      foregroundLayerRef.current.position.y = Math.sin(t * 0.45) * 0.08;
    }
  });

  return (
    <group>
      {/* 1. DEEP SHADOW-BOX BACKDROP CURTAIN & LAYERED PAPER ARCHES (z = -18 to -13) */}
      <group position={[0, 0, -16]}>
        {/* Deep Night Paper Arch */}
        <mesh position={[0, 0, -2]}>
          <planeGeometry args={[48, 30]} />
          <meshStandardMaterial
            color="#192744"
            roughness={0.98}
            metalness={0}
          />
        </mesh>

        {/* Soft Watercolor Nebula Washes on overlapping planes */}
        <mesh position={[-5.5, 2.2, 2.5]}>
          <planeGeometry args={[18, 18]} />
          <meshBasicMaterial
            map={roseNebulaTex}
            transparent
            depthWrite={false}
          />
        </mesh>
        <mesh position={[5.2, -1.8, 3.5]}>
          <planeGeometry args={[20, 20]} />
          <meshBasicMaterial
            map={dreamyBlueNebulaTex}
            transparent
            depthWrite={false}
          />
        </mesh>
        <mesh position={[0.2, 1.2, 6.5]}>
          <planeGeometry args={[16, 16]} />
          <meshBasicMaterial
            map={goldNebulaTex}
            transparent
            depthWrite={false}
          />
        </mesh>
      </group>

      {/* 2. FOREGROUND SHADOW-BOX DIORAMA FRAME CLOUDS (z = +11 to +14)
          Creates strong parallax when exploring the card */}
      <group ref={foregroundLayerRef}>
        {/* Bottom-Left Cut-Paper Cloud Cluster in Close Foreground */}
        <group position={[-8.8, -5.2, 11.5]} rotation={[0, 0.15, -0.08]}>
          <mesh castShadow>
            <sphereGeometry args={[1.6, 20, 20]} />
            <meshStandardMaterial {...creamPaperMat} />
          </mesh>
          <mesh position={[1.4, -0.3, 0.2]} castShadow>
            <sphereGeometry args={[1.2, 18, 18]} />
            <meshStandardMaterial {...creamPaperMat} />
          </mesh>
          <mesh position={[-1.3, 0.4, -0.2]} castShadow>
            <sphereGeometry args={[1.25, 18, 18]} />
            <meshStandardMaterial {...softBluePaperMat} />
          </mesh>
        </group>

        {/* Bottom-Right Cut-Paper Cloud Cluster in Close Foreground */}
        <group position={[9.2, -5.0, 11.2]} rotation={[0, -0.15, 0.08]}>
          <mesh castShadow>
            <sphereGeometry args={[1.55, 20, 20]} />
            <meshStandardMaterial {...creamPaperMat} />
          </mesh>
          <mesh position={[-1.35, -0.35, 0.2]} castShadow>
            <sphereGeometry args={[1.15, 18, 18]} />
            <meshStandardMaterial {...creamPaperMat} />
          </mesh>
          <mesh position={[1.2, 0.5, -0.2]} castShadow>
            <sphereGeometry args={[1.3, 18, 18]} />
            <meshStandardMaterial {...softBluePaperMat} />
          </mesh>
        </group>

        {/* Top Hanging Paper Stars in Foreground Frame */}
        <group position={[-7.6, 5.4, 10.5]}>
          <mesh position={[0, 0.8, 0]}>
            <cylinderGeometry args={[0.01, 0.01, 1.6, 6]} />
            <meshBasicMaterial color="#f5e6c4" transparent opacity={0.35} />
          </mesh>
          <mesh rotation={[0, 0.3, 0.2]}>
            <octahedronGeometry args={[0.26, 0]} />
            <meshStandardMaterial {...warmStarMat} />
          </mesh>
        </group>

        <group position={[7.8, 5.1, 10.8]}>
          <mesh position={[0, 0.9, 0]}>
            <cylinderGeometry args={[0.01, 0.01, 1.8, 6]} />
            <meshBasicMaterial color="#f5e6c4" transparent opacity={0.35} />
          </mesh>
          <mesh rotation={[0, -0.3, -0.15]}>
            <octahedronGeometry args={[0.22, 0]} />
            <meshStandardMaterial {...warmStarMat} />
          </mesh>
        </group>
      </group>

      {/* 3. MULTI-PLANE TWINKLING 3D PAPER STARS */}
      <group ref={starsGroupRef}>
        {paperStars.map((s, idx) => (
          <mesh key={idx} position={s.pos} scale={s.scale}>
            <octahedronGeometry args={[1, 0]} />
            <meshStandardMaterial {...warmStarMat} />
          </mesh>
        ))}
      </group>

      {/* 4. HANDCRAFTED PAPER ASTEROIDS */}
      <group ref={asteroidsGroupRef}>
        {asteroids.map((a, idx) => (
          <group key={idx} position={a.pos} scale={a.scale}>
            <mesh castShadow receiveShadow>
              <dodecahedronGeometry args={[1, 1]} />
              <meshStandardMaterial {...asteroidMat} />
            </mesh>
            {/* Tiny paper crater ring */}
            <mesh position={[0.55, 0.35, 0.55]} rotation={[0.4, 0.5, 0]}>
              <torusGeometry args={[0.24, 0.06, 8, 16]} />
              <meshStandardMaterial {...asteroidMat} />
            </mesh>
          </group>
        ))}
      </group>

      {/* 5. DELICATE STARDUST PATH CONNECTING THE PLANETS IN DEPTH */}
      <group>
        {constellationCrumbs.map((pt, idx) => (
          <mesh
            key={idx}
            position={[pt.x, pt.y, pt.z]}
            scale={idx % 3 === 0 ? 0.055 : 0.032}
          >
            <sphereGeometry args={[1, 8, 8]} />
            <meshBasicMaterial
              color="#ffe9a6"
              transparent
              opacity={0.45}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
};
