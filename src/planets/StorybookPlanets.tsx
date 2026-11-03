import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PlanetConfig } from '../config/invitationConfig';
import { createPaperMaterialProps } from '../materials/paperMaterials';

interface PlanetProps {
  config: PlanetConfig;
  reducedMotion?: boolean;
  isFocused?: boolean;
}

/**
 * Helper to create a 5-pointed cut-cardboard star shape for dioramas
 */
function createStarShape(outerRadius = 0.22, innerRadius = 0.1): THREE.Shape {
  const shape = new THREE.Shape();
  const spikes = 5;
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? outerRadius : innerRadius;
    const angle = (i * Math.PI) / spikes - Math.PI / 2;
    const x = Math.cos(angle) * r;
    const y = Math.sin(angle) * r;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  return shape;
}

/**
 * Helper to create a cut-paper heart shape for the Planet of Love
 */
function createHeartShape(scale = 0.014): THREE.Shape {
  const x = 0;
  const y = 0;
  const heartShape = new THREE.Shape();
  heartShape.moveTo(x + 5 * scale, y + 5 * scale);
  heartShape.bezierCurveTo(
    x + 5 * scale,
    y + 5 * scale,
    x + 4 * scale,
    y,
    x,
    y
  );
  heartShape.bezierCurveTo(
    x - 6 * scale,
    y,
    x - 6 * scale,
    y + 7 * scale,
    x - 6 * scale,
    y + 7 * scale
  );
  heartShape.bezierCurveTo(
    x - 6 * scale,
    y + 11 * scale,
    x - 3 * scale,
    y + 15.4 * scale,
    x + 5 * scale,
    y + 19 * scale
  );
  heartShape.bezierCurveTo(
    x + 12 * scale,
    y + 15.4 * scale,
    x + 16 * scale,
    y + 11 * scale,
    x + 16 * scale,
    y + 7 * scale
  );
  heartShape.bezierCurveTo(
    x + 16 * scale,
    y + 7 * scale,
    x + 16 * scale,
    y,
    x + 10 * scale,
    y
  );
  heartShape.bezierCurveTo(
    x + 7 * scale,
    y,
    x + 5 * scale,
    y + 5 * scale,
    x + 5 * scale,
    y + 5 * scale
  );
  return heartShape;
}

export const StorybookPlanet: React.FC<PlanetProps> = ({
  config,
  reducedMotion = false,
  isFocused = false,
}) => {
  const rootGroupRef = useRef<THREE.Group>(null);
  const dioramaOrbitRef = useRef<THREE.Group>(null);
  const paperCloudsRef = useRef<THREE.Group>(null);
  const roseGlowRef = useRef<THREE.Mesh>(null);
  const floatingHeartsRef = useRef<THREE.Group>(null);
  const dreamMoonRef = useRef<THREE.Group>(null);
  const dreamPinwheelRef = useRef<THREE.Group>(null);
  const faithDoveRef = useRef<THREE.Group>(null);

  const primaryMat = useMemo(
    () =>
      createPaperMaterialProps(config.palette.primary, {
        emissive: config.palette.primary,
        emissiveIntensity: 0.1,
      }),
    [config.palette.primary]
  );

  const secondaryMat = useMemo(
    () =>
      createPaperMaterialProps(config.palette.secondary, {
        emissive: config.palette.secondary,
        emissiveIntensity: 0.08,
      }),
    [config.palette.secondary]
  );

  const accentMat = useMemo(
    () =>
      createPaperMaterialProps(config.palette.accent, {
        emissive: config.palette.accent,
        emissiveIntensity: 0.22,
      }),
    [config.palette.accent]
  );

  const paperRimMat = useMemo(
    () =>
      createPaperMaterialProps(config.palette.paperRim, {
        emissive: config.palette.glow,
        emissiveIntensity: 0.15,
      }),
    [config.palette.paperRim, config.palette.glow]
  );

  const warmGoldMat = useMemo(
    () =>
      createPaperMaterialProps('#f6cf65', {
        emissive: '#f4b938',
        emissiveIntensity: 0.28,
      }),
    []
  );

  const roseRedMat = useMemo(
    () =>
      createPaperMaterialProps('#e65368', {
        emissive: '#d93850',
        emissiveIntensity: 0.25,
      }),
    []
  );

  const leafGreenMat = useMemo(
    () =>
      createPaperMaterialProps('#639a76', {
        emissive: '#457556',
        emissiveIntensity: 0.1,
      }),
    []
  );

  const woodWarmMat = useMemo(
    () =>
      createPaperMaterialProps('#b88b68', {
        emissive: '#8c6548',
        emissiveIntensity: 0.1,
      }),
    []
  );

  const starGeo = useMemo(() => {
    const shape = createStarShape(0.24, 0.11);
    return new THREE.ExtrudeGeometry(shape, {
      depth: 0.05,
      bevelEnabled: true,
      bevelThickness: 0.015,
      bevelSize: 0.015,
      bevelSegments: 2,
    });
  }, []);

  const heartGeo = useMemo(() => {
    const shape = createHeartShape(0.016);
    return new THREE.ExtrudeGeometry(shape, {
      depth: 0.04,
      bevelEnabled: true,
      bevelThickness: 0.012,
      bevelSize: 0.012,
      bevelSegments: 2,
    });
  }, []);

  useFrame(({ clock }, delta) => {
    if (reducedMotion) return;
    const t = clock.getElapsedTime();
    const phase = config.order * 1.7;

    if (rootGroupRef.current) {
      const bobAmplitude = isFocused ? 0.018 : 0.085;
      const targetY =
        config.position[1] + Math.sin(t * 0.65 + phase) * bobAmplitude;
      rootGroupRef.current.position.y = THREE.MathUtils.lerp(
        rootGroupRef.current.position.y,
        targetY,
        1 - Math.exp(-4 * delta)
      );
      rootGroupRef.current.rotation.z =
        Math.sin(t * 0.35 + phase) * (isFocused ? 0.01 : 0.025);
    }

    if (dioramaOrbitRef.current) {
      dioramaOrbitRef.current.rotation.y = t * 0.18 + phase;
    }

    if (paperCloudsRef.current) {
      paperCloudsRef.current.rotation.y = -t * 0.07 + phase;
    }

    if (roseGlowRef.current) {
      const s = 1 + Math.sin(t * 2.2) * 0.08;
      roseGlowRef.current.scale.setScalar(s);
    }

    // Planet 2 (Amor): Gentle floating hearts animation
    if (floatingHeartsRef.current) {
      floatingHeartsRef.current.children.forEach((child, idx) => {
        child.position.y =
          1.15 + idx * 0.18 + Math.sin(t * 1.6 + idx * 1.4) * 0.08;
        child.rotation.y = Math.sin(t * 0.9 + idx) * 0.25;
      });
    }

    // Planet 3 (Sueños): Gentle rocking moon mobile & spinning pinwheel
    if (dreamMoonRef.current) {
      dreamMoonRef.current.rotation.z = 0.22 + Math.sin(t * 1.1) * 0.08;
    }
    if (dreamPinwheelRef.current) {
      dreamPinwheelRef.current.rotation.z = -t * 0.95;
    }

    // Planet 4 (Fe): Gentle hovering dove above chapel
    if (faithDoveRef.current) {
      faithDoveRef.current.position.y = 1.98 + Math.sin(t * 1.8) * 0.05;
      faithDoveRef.current.rotation.y = Math.sin(t * 0.8) * 0.15;
    }
  });

  return (
    <group
      ref={rootGroupRef}
      position={config.position}
      scale={config.scale}
    >
      {/* 1. MAIN WATERCOLOR PLANET CORE + LAYERED PAPER BANDS (No flat white backing discs!) */}
      <mesh castShadow receiveShadow>
        <sphereGeometry args={[1.0, 32, 32]} />
        <meshStandardMaterial {...primaryMat} />
      </mesh>

      {/* Overlapping cut-paper hill collar (Shadow Box depth layer on planet equator) */}
      <mesh
        position={[0, -0.14, 0.05]}
        rotation={[0.12, 0, -0.08]}
        scale={[1.03, 0.72, 1.03]}
        castShadow
        receiveShadow
      >
        <sphereGeometry args={[1.0, 28, 24]} />
        <meshStandardMaterial {...secondaryMat} />
      </mesh>

      {/* Soft paper cutout clouds orbiting planet */}
      <group ref={paperCloudsRef}>
        <mesh
          position={[-1.15, 0.25, 0.45]}
          rotation={[0, 0.3, 0.1]}
          castShadow
        >
          <boxGeometry args={[0.48, 0.18, 0.06]} />
          <meshStandardMaterial {...paperRimMat} />
        </mesh>
        <mesh position={[-1.22, 0.33, 0.48]} castShadow>
          <cylinderGeometry args={[0.14, 0.14, 0.06, 16]} />
          <meshStandardMaterial {...paperRimMat} />
        </mesh>
        <mesh
          position={[1.18, -0.2, 0.35]}
          rotation={[0, -0.3, -0.1]}
          castShadow
        >
          <boxGeometry args={[0.42, 0.15, 0.06]} />
          <meshStandardMaterial {...paperRimMat} />
        </mesh>
      </group>

      {/* ==================== PLANETA 1: EL PEQUEÑO PLANETA (B-612) ==================== */}
      {config.id === 'pequeno-planeta' && (
        <group>
          <pointLight
            position={[0.2, 1.65, 1.1]}
            color="#ffe9ad"
            intensity={isFocused ? 1.45 : 0.55}
            distance={5.5}
          />

          {/* BACKGROUND LAYER: Layered Paper Mountains / Tiny Volcanoes */}
          <group position={[-0.58, 0.72, -0.28]} rotation={[0, 0, 0.52]}>
            <mesh castShadow>
              <coneGeometry args={[0.26, 0.48, 16]} />
              <meshStandardMaterial {...secondaryMat} />
            </mesh>
            <mesh position={[0, 0.16, 0.02]}>
              <coneGeometry args={[0.11, 0.18, 12]} />
              <meshStandardMaterial {...paperRimMat} />
            </mesh>
          </group>

          <group position={[0.66, 0.64, -0.25]} rotation={[0, 0, -0.56]}>
            <mesh castShadow>
              <coneGeometry args={[0.22, 0.42, 16]} />
              <meshStandardMaterial {...secondaryMat} />
            </mesh>
            <mesh position={[0, 0.14, 0.02]}>
              <coneGeometry args={[0.09, 0.14, 12]} />
              <meshStandardMaterial {...paperRimMat} />
            </mesh>
          </group>

          {/* Tiny Storybook Cozy Home in Background Plane */}
          <group
            position={[-0.36, 0.88, -0.32]}
            rotation={[-0.16, 0.15, 0.28]}
          >
            <mesh position={[0, 0.12, 0]} castShadow>
              <boxGeometry args={[0.26, 0.24, 0.18]} />
              <meshStandardMaterial {...paperRimMat} />
            </mesh>
            <mesh
              position={[0, 0.29, 0]}
              rotation={[0, Math.PI / 4, 0]}
              castShadow
            >
              <coneGeometry args={[0.23, 0.18, 4]} />
              <meshStandardMaterial {...accentMat} />
            </mesh>
            <mesh position={[0.08, 0.33, -0.02]}>
              <boxGeometry args={[0.045, 0.1, 0.045]} />
              <meshStandardMaterial {...paperRimMat} />
            </mesh>
            <mesh position={[0, 0.13, 0.095]}>
              <planeGeometry args={[0.075, 0.085]} />
              <meshBasicMaterial color="#ffe58f" />
            </mesh>
            <group position={[0.19, 0.04, 0.08]}>
              <mesh position={[0, 0.09, 0]}>
                <cylinderGeometry args={[0.008, 0.01, 0.18, 6]} />
                <meshStandardMaterial {...secondaryMat} />
              </mesh>
              <mesh position={[0, 0.19, 0]}>
                <sphereGeometry args={[0.028, 10, 10]} />
                <meshBasicMaterial color="#ffea9f" />
              </mesh>
            </group>
          </group>

          {/* MIDGROUND LAYER: The Iconic Rose + Stepping Stones */}
          <group position={[-0.54, 0.77, 0.36]} rotation={[0.18, 0.1, 0.4]}>
            <mesh position={[0, 0.14, 0]}>
              <cylinderGeometry args={[0.016, 0.018, 0.28, 8]} />
              <meshStandardMaterial {...leafGreenMat} />
            </mesh>
            <mesh
              position={[-0.04, 0.12, 0]}
              rotation={[0, 0, 0.8]}
              scale={[1, 0.4, 0.3]}
            >
              <sphereGeometry args={[0.055, 8, 8]} />
              <meshStandardMaterial {...leafGreenMat} />
            </mesh>
            <mesh
              position={[0.04, 0.16, 0]}
              rotation={[0, 0, -0.8]}
              scale={[1, 0.4, 0.3]}
            >
              <sphereGeometry args={[0.055, 8, 8]} />
              <meshStandardMaterial {...leafGreenMat} />
            </mesh>
            <mesh position={[0, 0.29, 0]} castShadow>
              <dodecahedronGeometry args={[0.078, 1]} />
              <meshStandardMaterial {...roseRedMat} />
            </mesh>
            <mesh ref={roseGlowRef} position={[0, 0.29, 0]}>
              <sphereGeometry args={[0.11, 12, 12]} />
              <meshBasicMaterial color="#ffccd5" transparent opacity={0.25} />
            </mesh>
            <mesh position={[0, 0.17, 0]}>
              <capsuleGeometry args={[0.115, 0.16, 12, 16]} />
              <meshStandardMaterial
                color="#fff8e8"
                transparent
                opacity={0.22}
                roughness={0.3}
              />
            </mesh>
          </group>

          {/* Tiny Paper Stepping Stones */}
          {[
            [-0.22, 0.96, 0.25],
            [-0.1, 0.98, 0.34],
            [0.04, 0.97, 0.42],
          ].map((pos, i) => (
            <mesh
              key={i}
              position={pos as [number, number, number]}
              rotation={[0.25, 0, 0]}
              scale={[1.2, 0.3, 0.9]}
            >
              <cylinderGeometry args={[0.045, 0.05, 0.025, 8]} />
              <meshStandardMaterial {...paperRimMat} />
            </mesh>
          ))}

          {/* FOREGROUND SHADOW-BOX CUTOUT LAYERS */}
          <mesh
            position={[0.02, 0.68, 0.72]}
            rotation={[0.55, 0, 0]}
            scale={[0.62, 0.18, 0.06]}
            castShadow
          >
            <sphereGeometry args={[1, 18, 14]} />
            <meshStandardMaterial {...secondaryMat} />
          </mesh>

          {[
            { pos: [0.34, 0.73, 0.62], rot: [0.45, 0, -0.25], scale: 1.0 },
            { pos: [-0.15, 0.79, 0.64], rot: [0.42, 0, 0.12], scale: 1.15 },
            { pos: [0.56, 0.54, 0.66], rot: [0.48, 0, -0.42], scale: 0.95 },
            { pos: [-0.42, 0.62, 0.68], rot: [0.5, 0, 0.35], scale: 0.9 },
            { pos: [0.12, 0.64, 0.82], rot: [0.6, 0, -0.1], scale: 1.1 },
          ].map((f, idx) => (
            <group
              key={idx}
              position={f.pos as [number, number, number]}
              rotation={f.rot as [number, number, number]}
              scale={f.scale}
            >
              <mesh castShadow>
                <cylinderGeometry args={[0.052, 0.052, 0.022, 6]} />
                <meshStandardMaterial
                  {...(idx % 2 === 0 ? paperRimMat : accentMat)}
                />
              </mesh>
              <mesh position={[0, 0.018, 0]}>
                <sphereGeometry args={[0.024, 8, 8]} />
                <meshStandardMaterial {...warmGoldMat} />
              </mesh>
            </group>
          ))}

          <mesh
            geometry={starGeo}
            position={[0.78, 1.25, 0.85]}
            rotation={[0, -0.25, 0.15]}
            scale={0.38}
          >
            <meshStandardMaterial {...warmGoldMat} />
          </mesh>
          <mesh
            geometry={starGeo}
            position={[-0.82, 1.38, 0.65]}
            rotation={[0, 0.25, -0.2]}
            scale={0.3}
          >
            <meshStandardMaterial {...warmGoldMat} />
          </mesh>
        </group>
      )}

      {/* ==================== PLANETA 2: PLANETA DEL AMOR (LA FAMILIA Y LOS ABRAZOS) ==================== */}
      {config.id === 'planeta-amor' && (
        <group>
          <pointLight
            position={[0.1, 1.7, 1.0]}
            color="#ffd6cc"
            intensity={isFocused ? 1.45 : 0.45}
            distance={5.5}
          />

          {/* BACKGROUND LAYER: Warm Paper Archway of Family Embrace + Cozy Family Silhouettes */}
          <mesh
            position={[0, 0.94, -0.32]}
            rotation={[0, 0, 0]}
            castShadow
          >
            <torusGeometry args={[0.52, 0.048, 12, 32, Math.PI]} />
            <meshStandardMaterial {...accentMat} />
          </mesh>

          {/* Two Loving Stylized Paper Silhouettes Embracing in the Background Garden */}
          <group position={[-0.28, 0.92, -0.28]} rotation={[0, 0.2, 0.14]}>
            <mesh position={[-0.06, 0.14, 0]} castShadow>
              <capsuleGeometry args={[0.055, 0.16, 8, 12]} />
              <meshStandardMaterial {...secondaryMat} />
            </mesh>
            <mesh position={[-0.05, 0.31, 0]}>
              <sphereGeometry args={[0.065, 12, 12]} />
              <meshStandardMaterial {...paperRimMat} />
            </mesh>
            <mesh
              position={[0.06, 0.12, 0.02]}
              rotation={[0, 0, -0.15]}
              castShadow
            >
              <capsuleGeometry args={[0.05, 0.14, 8, 12]} />
              <meshStandardMaterial {...accentMat} />
            </mesh>
            <mesh position={[0.04, 0.28, 0.02]}>
              <sphereGeometry args={[0.06, 12, 12]} />
              <meshStandardMaterial {...paperRimMat} />
            </mesh>
          </group>

          {/* MIDGROUND LAYER: Cut-Paper Heart Trees & Garden Bench */}
          <group position={[-0.52, 0.8, 0.05]} rotation={[0, 0.18, 0.38]}>
            <mesh position={[0, 0.14, 0]}>
              <cylinderGeometry args={[0.025, 0.035, 0.28, 8]} />
              <meshStandardMaterial {...woodWarmMat} />
            </mesh>
            <mesh
              geometry={heartGeo}
              position={[-0.08, 0.44, -0.02]}
              rotation={[0, 0, Math.PI]}
              scale={1.18}
              castShadow
            >
              <meshStandardMaterial {...roseRedMat} />
            </mesh>
          </group>

          <group position={[0.52, 0.78, 0.08]} rotation={[0, -0.18, -0.38]}>
            <mesh position={[0, 0.12, 0]}>
              <cylinderGeometry args={[0.022, 0.03, 0.24, 8]} />
              <meshStandardMaterial {...woodWarmMat} />
            </mesh>
            <mesh
              geometry={heartGeo}
              position={[-0.07, 0.38, 0]}
              rotation={[0, 0, Math.PI]}
              scale={1.08}
              castShadow
            >
              <meshStandardMaterial {...accentMat} />
            </mesh>
          </group>

          {/* Small Paper Garden Bench next to landing spot */}
          <group position={[-0.32, 0.88, 0.32]} rotation={[0.25, 0.3, 0.22]}>
            <mesh position={[0, 0.06, 0]} castShadow>
              <boxGeometry args={[0.22, 0.025, 0.09]} />
              <meshStandardMaterial {...woodWarmMat} />
            </mesh>
            <mesh position={[0, 0.11, -0.035]} castShadow>
              <boxGeometry args={[0.22, 0.06, 0.02]} />
              <meshStandardMaterial {...woodWarmMat} />
            </mesh>
          </group>

          {/* Floating Paper Hearts Rising Gently */}
          <group ref={floatingHeartsRef}>
            {[
              [-0.36, 1.25, 0.22],
              [0.38, 1.32, 0.18],
              [0.05, 1.48, -0.15],
            ].map((pos, i) => (
              <mesh
                key={i}
                geometry={heartGeo}
                position={pos as [number, number, number]}
                rotation={[0, 0, Math.PI]}
                scale={0.55 + (i % 2) * 0.15}
              >
                <meshStandardMaterial
                  {...(i % 2 === 0 ? roseRedMat : warmGoldMat)}
                />
              </mesh>
            ))}
          </group>

          {/* FOREGROUND PARALLAX LAYER: Layered Rose-Taupe Hill & Flowers */}
          <mesh
            position={[0.0, 0.68, 0.72]}
            rotation={[0.55, 0, 0]}
            scale={[0.58, 0.16, 0.06]}
          >
            <sphereGeometry args={[1, 16, 12]} />
            <meshStandardMaterial {...secondaryMat} />
          </mesh>

          {[
            [-0.28, 0.72, 0.65],
            [0.26, 0.74, 0.64],
            [0.02, 0.64, 0.78],
          ].map((pos, idx) => (
            <group
              key={idx}
              position={pos as [number, number, number]}
              rotation={[0.48, 0, (idx - 1) * 0.2]}
            >
              <mesh>
                <cylinderGeometry args={[0.048, 0.048, 0.02, 6]} />
                <meshStandardMaterial {...accentMat} />
              </mesh>
              <mesh position={[0, 0.015, 0]}>
                <sphereGeometry args={[0.022, 8, 8]} />
                <meshStandardMaterial {...warmGoldMat} />
              </mesh>
            </group>
          ))}

          {/* Orbiting Paper Ribbon Ring */}
          <mesh rotation={[Math.PI * 0.42, 0.2, 0]}>
            <torusGeometry args={[1.38, 0.032, 10, 48]} />
            <meshStandardMaterial {...accentMat} />
          </mesh>
        </group>
      )}

      {/* ==================== PLANETA 3: PLANETA DE LOS SUEÑOS (PRIMER AÑO Y CURIOSIDAD) ==================== */}
      {config.id === 'planeta-suenos' && (
        <group>
          <pointLight
            position={[0.1, 1.75, 1.0]}
            color="#cfe2ff"
            intensity={isFocused ? 1.45 : 0.45}
            distance={5.5}
          />

          {/* BACKGROUND LAYER: Giant Golden Crescent Moon Mobile & Hanging Star */}
          <group
            ref={dreamMoonRef}
            position={[-0.18, 1.15, -0.32]}
            rotation={[0, 0, 0.22]}
          >
            <mesh castShadow>
              <torusGeometry args={[0.42, 0.095, 14, 28, Math.PI * 1.35]} />
              <meshStandardMaterial {...warmGoldMat} />
            </mesh>
            {/* Hanging thread & star */}
            <mesh position={[0.26, -0.02, 0.02]}>
              <cylinderGeometry args={[0.006, 0.006, 0.22, 6]} />
              <meshBasicMaterial color="#fff3d1" />
            </mesh>
            <mesh
              geometry={starGeo}
              position={[0.26, -0.16, 0.04]}
              scale={0.62}
            >
              <meshStandardMaterial {...warmGoldMat} />
            </mesh>
          </group>

          {/* MIDGROUND LAYER: Storybook Toy Blocks (1st Year) & Origami Paper Boat */}
          {/* Stacked Discovery Cubes on Left */}
          <group position={[-0.44, 0.85, 0.14]} rotation={[0.1, 0.25, 0.35]}>
            <mesh position={[0, 0.08, 0]} castShadow>
              <boxGeometry args={[0.16, 0.16, 0.16]} />
              <meshStandardMaterial {...accentMat} />
            </mesh>
            <mesh
              position={[0.02, 0.22, 0]}
              rotation={[0, 0.35, 0]}
              castShadow
            >
              <boxGeometry args={[0.13, 0.13, 0.13]} />
              <meshStandardMaterial {...paperRimMat} />
            </mesh>
            <mesh position={[0.02, 0.34, 0]} castShadow>
              <coneGeometry args={[0.09, 0.14, 4]} />
              <meshStandardMaterial {...roseRedMat} />
            </mesh>
          </group>

          {/* Little Paper Boat sailing on a cloud on Right */}
          <group position={[0.46, 0.84, 0.18]} rotation={[0.12, -0.2, -0.34]}>
            {/* Boat Hull */}
            <mesh
              position={[0, 0.06, 0]}
              rotation={[0, 0, Math.PI]}
              scale={[1.6, 0.6, 0.7]}
              castShadow
            >
              <coneGeometry args={[0.11, 0.14, 4]} />
              <meshStandardMaterial {...paperRimMat} />
            </mesh>
            {/* Paper Sail */}
            <mesh position={[0, 0.16, 0]} scale={[1.0, 1.2, 0.2]} castShadow>
              <coneGeometry args={[0.1, 0.18, 3]} />
              <meshStandardMaterial {...warmGoldMat} />
            </mesh>
          </group>

          {/* FOREGROUND PARALLAX LAYER: Spinning Paper Pinwheel & Layered Clouds */}
          <group position={[-0.28, 0.76, 0.62]} rotation={[0.38, 0, 0.18]}>
            <mesh position={[0, 0.12, 0]}>
              <cylinderGeometry args={[0.012, 0.012, 0.24, 8]} />
              <meshStandardMaterial {...woodWarmMat} />
            </mesh>
            <group ref={dreamPinwheelRef} position={[0, 0.24, 0.02]}>
              {[0, 1, 2, 3].map((b) => (
                <mesh
                  key={b}
                  rotation={[0, 0, (b * Math.PI) / 2]}
                  position={[
                    Math.cos((b * Math.PI) / 2) * 0.055,
                    Math.sin((b * Math.PI) / 2) * 0.055,
                    0,
                  ]}
                >
                  <coneGeometry args={[0.045, 0.11, 3]} />
                  <meshStandardMaterial
                    {...(b % 2 === 0 ? warmGoldMat : roseRedMat)}
                  />
                </mesh>
              ))}
              <mesh position={[0, 0, 0.015]}>
                <sphereGeometry args={[0.02, 8, 8]} />
                <meshStandardMaterial {...paperRimMat} />
              </mesh>
            </group>
          </group>

          {/* Soft Layered Clouds around the Equator */}
          {[0, 1, 2, 3].map((i) => {
            const angle = (i * Math.PI) / 2 + 0.4;
            return (
              <group
                key={i}
                position={[
                  Math.cos(angle) * 0.85,
                  0.45,
                  Math.sin(angle) * 0.85,
                ]}
                rotation={[0, -angle + Math.PI / 2, 0]}
              >
                <mesh castShadow>
                  <sphereGeometry args={[0.21, 14, 14]} />
                  <meshStandardMaterial {...secondaryMat} />
                </mesh>
                <mesh position={[0.15, -0.04, 0.02]} castShadow>
                  <sphereGeometry args={[0.15, 12, 12]} />
                  <meshStandardMaterial {...paperRimMat} />
                </mesh>
                <mesh position={[-0.15, -0.05, 0.02]} castShadow>
                  <sphereGeometry args={[0.14, 12, 12]} />
                  <meshStandardMaterial {...paperRimMat} />
                </mesh>
              </group>
            );
          })}
        </group>
      )}

      {/* ==================== PLANETA 4: PLANETA DE LA FE (EL BAUTIZO Y LA LUZ CÁLIDA) ==================== */}
      {config.id === 'planeta-fe' && (
        <group>
          <pointLight
            position={[0, 1.85, 1.1]}
            color="#ffea9f"
            intensity={isFocused ? 1.65 : 0.65}
            distance={6.0}
          />

          {/* BACKGROUND LAYER: Handcrafted Paper Chapel / Little Church */}
          <group position={[-0.08, 0.92, -0.26]}>
            {/* Chapel Nave */}
            <mesh position={[0, 0.22, 0]} castShadow>
              <boxGeometry args={[0.44, 0.42, 0.34]} />
              <meshStandardMaterial {...paperRimMat} />
            </mesh>
            {/* Pitched Roof */}
            <mesh
              position={[0, 0.52, 0]}
              rotation={[0, Math.PI / 4, 0]}
              castShadow
            >
              <coneGeometry args={[0.38, 0.28, 4]} />
              <meshStandardMaterial {...secondaryMat} />
            </mesh>
            {/* Bell Tower */}
            <mesh position={[0, 0.68, 0.04]} castShadow>
              <boxGeometry args={[0.18, 0.36, 0.18]} />
              <meshStandardMaterial {...paperRimMat} />
            </mesh>
            <mesh
              position={[0, 0.95, 0.04]}
              rotation={[0, Math.PI / 4, 0]}
              castShadow
            >
              <coneGeometry args={[0.16, 0.24, 4]} />
              <meshStandardMaterial {...warmGoldMat} />
            </mesh>
            {/* Little Golden Cross on Spire */}
            <group position={[0, 1.12, 0.04]}>
              <mesh>
                <boxGeometry args={[0.03, 0.16, 0.03]} />
                <meshStandardMaterial {...warmGoldMat} />
              </mesh>
              <mesh position={[0, 0.03, 0]}>
                <boxGeometry args={[0.1, 0.03, 0.03]} />
                <meshStandardMaterial {...warmGoldMat} />
              </mesh>
            </group>
            {/* Warm Stained-Glass Rose Window & Arched Door */}
            <mesh position={[0, 0.28, 0.175]}>
              <circleGeometry args={[0.08, 16]} />
              <meshBasicMaterial color="#ffe58f" />
            </mesh>
            <mesh position={[0, 0.09, 0.175]}>
              <planeGeometry args={[0.09, 0.15]} />
              <meshBasicMaterial color="#ffd97d" />
            </mesh>
          </group>

          {/* Slender Olive / Cypress Paper Trees flanking the Chapel */}
          <group position={[-0.48, 0.82, -0.05]} rotation={[0, 0, 0.34]}>
            <mesh position={[0, 0.22, 0]} castShadow>
              <coneGeometry args={[0.11, 0.42, 12]} />
              <meshStandardMaterial {...leafGreenMat} />
            </mesh>
          </group>
          <group position={[0.46, 0.82, -0.05]} rotation={[0, 0, -0.34]}>
            <mesh position={[0, 0.2, 0]} castShadow>
              <coneGeometry args={[0.1, 0.38, 12]} />
              <meshStandardMaterial {...leafGreenMat} />
            </mesh>
          </group>

          {/* MIDGROUND LAYER: White Paper Dove of Peace & Baptismal Font */}
          <group ref={faithDoveRef} position={[0.24, 1.98, 0.05]}>
            {/* Dove Body */}
            <mesh rotation={[0, 0.3, 0.1]} scale={[1.4, 0.8, 0.8]}>
              <sphereGeometry args={[0.06, 12, 12]} />
              <meshStandardMaterial {...paperRimMat} />
            </mesh>
            {/* Outspread Paper Wings */}
            <mesh position={[-0.02, 0.04, -0.05]} rotation={[0.5, 0.2, 0.3]}>
              <boxGeometry args={[0.14, 0.015, 0.08]} />
              <meshStandardMaterial {...paperRimMat} />
            </mesh>
            <mesh position={[-0.02, 0.04, 0.05]} rotation={[-0.5, -0.2, 0.3]}>
              <boxGeometry args={[0.14, 0.015, 0.08]} />
              <meshStandardMaterial {...paperRimMat} />
            </mesh>
          </group>

          {/* Small Baptismal Font of Warm Light next to landing spot */}
          <group position={[-0.3, 0.9, 0.3]} rotation={[0.22, 0, 0.22]}>
            <mesh position={[0, 0.08, 0]} castShadow>
              <cylinderGeometry args={[0.085, 0.06, 0.14, 12]} />
              <meshStandardMaterial {...paperRimMat} />
            </mesh>
            <mesh position={[0, 0.16, 0]}>
              <sphereGeometry args={[0.065, 12, 12]} />
              <meshBasicMaterial color="#ffefb3" transparent opacity={0.75} />
            </mesh>
          </group>

          {/* Golden Baptismal Halo of Paper Stars */}
          <group ref={dioramaOrbitRef} position={[0, 1.35, -0.18]}>
            {[0, 1, 2, 3, 4].map((i) => {
              const a = (i * Math.PI * 2) / 5;
              return (
                <mesh
                  key={i}
                  geometry={starGeo}
                  position={[
                    Math.cos(a) * 0.88,
                    Math.sin(a * 2) * 0.12,
                    Math.sin(a) * 0.88,
                  ]}
                  scale={0.48}
                >
                  <meshStandardMaterial {...warmGoldMat} />
                </mesh>
              );
            })}
          </group>

          {/* FOREGROUND PARALLAX LAYER: Glowing Baptismal Candles & White Lilies */}
          {[
            [-0.28, 0.72, 0.65],
            [0.32, 0.7, 0.64],
          ].map((pos, idx) => (
            <group
              key={idx}
              position={pos as [number, number, number]}
              rotation={[0.45, 0, idx === 0 ? 0.2 : -0.2]}
            >
              <mesh position={[0, 0.06, 0]}>
                <cylinderGeometry args={[0.025, 0.028, 0.12, 10]} />
                <meshStandardMaterial {...paperRimMat} />
              </mesh>
              <mesh position={[0, 0.14, 0]}>
                <coneGeometry args={[0.018, 0.05, 8]} />
                <meshBasicMaterial color="#ffe270" />
              </mesh>
            </group>
          ))}
        </group>
      )}

      {/* ==================== PLANETA 5: EL DESTINO (CELEBRACIÓN CHRISTOPHER GABRIEL) ==================== */}
      {config.id === 'planeta-destino' && (
        <group>
          <mesh rotation={[Math.PI * 0.4, 0.18, -0.1]}>
            <torusGeometry args={[1.48, 0.05, 12, 64]} />
            <meshStandardMaterial {...paperRimMat} />
          </mesh>
          <mesh rotation={[Math.PI * 0.45, -0.22, 0.12]}>
            <torusGeometry args={[1.72, 0.03, 12, 64]} />
            <meshStandardMaterial {...warmGoldMat} />
          </mesh>

          <group position={[0, 1.02, -0.18]}>
            <mesh position={[0, 0.14, 0]} castShadow>
              <cylinderGeometry args={[0.38, 0.44, 0.26, 20]} />
              <meshStandardMaterial {...paperRimMat} />
            </mesh>
            <mesh position={[0, 0.34, 0]} castShadow>
              <cylinderGeometry args={[0.26, 0.32, 0.22, 20]} />
              <meshStandardMaterial {...accentMat} />
            </mesh>
            <mesh
              geometry={starGeo}
              position={[0, 0.68, 0]}
              scale={1.35}
              castShadow
            >
              <meshStandardMaterial
                {...warmGoldMat}
                emissive="#ffd659"
                emissiveIntensity={0.48}
              />
            </mesh>
          </group>

          <pointLight
            position={[0, 1.5, 0.8]}
            color="#ffe596"
            intensity={1.6}
            distance={9}
          />
        </group>
      )}
    </group>
  );
};
