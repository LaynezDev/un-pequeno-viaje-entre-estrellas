import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import gsap from 'gsap';
import { createPaperMaterialProps } from '../materials/paperMaterials';
import {
  invitationConfig,
  getCharacterPlanetTransform,
} from '../config/invitationConfig';

interface CharactersProps {
  currentPlanetIndex: number;
  reducedMotion?: boolean;
  isFocused?: boolean;
  liveWorldPosRef?: React.MutableRefObject<THREE.Vector3>;
}

export const LittlePrinceAndFox: React.FC<CharactersProps> = ({
  currentPlanetIndex,
  reducedMotion = false,
  isFocused = false,
  liveWorldPosRef,
}) => {
  const initialTransform = useMemo(
    () =>
      getCharacterPlanetTransform(
        invitationConfig.planets[currentPlanetIndex] ??
          invitationConfig.planets[0]
      ),
    []
  );

  const rootGroupRef = useRef<THREE.Group>(null);
  const postureGroupRef = useRef<THREE.Group>(null);
  const princeHeadRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const scarfTailRef = useRef<THREE.Mesh>(null);
  const scarfTail2Ref = useRef<THREE.Mesh>(null);
  const foxTailRef = useRef<THREE.Group>(null);
  const foxHeadRef = useRef<THREE.Group>(null);
  const jumpTrailRef = useRef<THREE.Group>(null);

  // Animated state for continuous 3D interplanetary jump
  const animatedBasePos = useRef(
    new THREE.Vector3(...initialTransform.position)
  );
  const animatedScale = useRef({ value: initialTransform.scale });
  const jumpState = useRef({
    arcHeight: 0,
    crouchY: 0,
    tiltX: 0,
    tiltZ: 0,
    inAir: 0,
  });
  const prevPlanetIdx = useRef(currentPlanetIndex);

  // Trail breadcrumbs in world space during jumps
  const trailPositions = useRef<THREE.Vector3[]>(
    Array.from(
      { length: 12 },
      () => new THREE.Vector3(...initialTransform.position)
    )
  );

  // Materials with matte paper texture
  const skinMat = useMemo(
    () =>
      createPaperMaterialProps('#ffdfc4', {
        emissive: '#ffcca3',
        emissiveIntensity: 0.14,
      }),
    []
  );
  const blushMat = useMemo(
    () =>
      createPaperMaterialProps('#f4978e', {
        emissive: '#f4978e',
        emissiveIntensity: 0.2,
      }),
    []
  );
  const hairMat = useMemo(
    () =>
      createPaperMaterialProps('#f6c957', {
        emissive: '#f4b942',
        emissiveIntensity: 0.18,
      }),
    []
  );
  const coatMat = useMemo(
    () =>
      createPaperMaterialProps('#5fa883', {
        emissive: '#418061',
        emissiveIntensity: 0.1,
      }),
    []
  );
  const scarfMat = useMemo(
    () =>
      createPaperMaterialProps('#f7d050', {
        emissive: '#f7b830',
        emissiveIntensity: 0.22,
      }),
    []
  );
  const trousersMat = useMemo(
    () =>
      createPaperMaterialProps('#f5f1e6', {
        emissive: '#e6dec8',
        emissiveIntensity: 0.1,
      }),
    []
  );
  const bootsMat = useMemo(
    () =>
      createPaperMaterialProps('#6c5346', {
        emissive: '#4a372d',
        emissiveIntensity: 0.08,
      }),
    []
  );
  const smileMat = useMemo(
    () =>
      createPaperMaterialProps('#4a3128', {
        emissive: '#2e1d17',
        emissiveIntensity: 0.08,
      }),
    []
  );
  const foxOrangeMat = useMemo(
    () =>
      createPaperMaterialProps('#e57c44', {
        emissive: '#d96b34',
        emissiveIntensity: 0.14,
      }),
    []
  );
  const foxCreamMat = useMemo(
    () =>
      createPaperMaterialProps('#fbf4e4', {
        emissive: '#f2e4c8',
        emissiveIntensity: 0.15,
      }),
    []
  );
  const darkEyeMat = useMemo(
    () =>
      createPaperMaterialProps('#2a2222', {
        emissive: '#1a1414',
        emissiveIntensity: 0.05,
      }),
    []
  );

  // Trigger continuous 3D parabolic jump whenever currentPlanetIndex changes
  useEffect(() => {
    const targetPlanet =
      invitationConfig.planets[currentPlanetIndex] ??
      invitationConfig.planets[0];
    const dest = getCharacterPlanetTransform(targetPlanet);

    if (prevPlanetIdx.current === currentPlanetIndex) {
      animatedBasePos.current.set(...dest.position);
      animatedScale.current.value = dest.scale;
      if (liveWorldPosRef) {
        liveWorldPosRef.current.set(...dest.position);
      }
      return;
    }

    const fromPlanet =
      invitationConfig.planets[prevPlanetIdx.current] ??
      invitationConfig.planets[0];
    prevPlanetIdx.current = currentPlanetIndex;

    gsap.killTweensOf(animatedBasePos.current);
    gsap.killTweensOf(animatedScale.current);
    gsap.killTweensOf(jumpState.current);

    if (reducedMotion) {
      gsap.to(animatedBasePos.current, {
        x: dest.position[0],
        y: dest.position[1],
        z: dest.position[2],
        duration: 1.4,
        ease: 'power2.inOut',
      });
      gsap.to(animatedScale.current, {
        value: dest.scale,
        duration: 1.4,
        ease: 'power2.inOut',
      });
      return;
    }

    const dx = dest.position[0] - fromPlanet.position[0];
    const flightDuration = 3.5;

    const tl = gsap.timeline();

    // 1. Anticipation crouch on the current planet (0.0s -> 0.42s)
    tl.to(jumpState.current, {
      crouchY: -0.14,
      tiltX: 0.14,
      duration: 0.42,
      ease: 'power2.out',
    });

    // 2. Launch into parabolic starlight leap (0.42s -> 3.92s)
    tl.to(
      animatedBasePos.current,
      {
        x: dest.position[0],
        y: dest.position[1],
        z: dest.position[2],
        duration: flightDuration,
        ease: 'power2.inOut',
      },
      0.42
    );

    tl.to(
      animatedScale.current,
      {
        value: dest.scale,
        duration: flightDuration,
        ease: 'power2.inOut',
      },
      0.42
    );

    // Parabolic jump arc height + mid-air posture
    tl.to(
      jumpState.current,
      {
        crouchY: 0,
        arcHeight: 2.35,
        inAir: 1,
        tiltZ: dx >= 0 ? -0.15 : 0.15,
        tiltX: 0.18,
        duration: flightDuration * 0.48,
        ease: 'sine.out',
      },
      0.42
    ).to(
      jumpState.current,
      {
        arcHeight: 0,
        inAir: 0,
        tiltZ: 0,
        tiltX: 0,
        duration: flightDuration * 0.52,
        ease: 'sine.inOut',
      },
      0.42 + flightDuration * 0.48
    );

    // 3. Soft landing cushion on arrival planet (3.92s -> 4.35s)
    tl.to(jumpState.current, {
      crouchY: -0.1,
      duration: 0.18,
      ease: 'power2.out',
    }).to(jumpState.current, {
      crouchY: 0,
      duration: 0.28,
      ease: 'back.out(2)',
    });
  }, [currentPlanetIndex, reducedMotion, liveWorldPosRef]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const targetPlanet =
      invitationConfig.planets[currentPlanetIndex] ??
      invitationConfig.planets[0];
    const phase = targetPlanet.order * 1.7;

    // Match the planet's gentle floating bob when standing on it
    const bobAmplitude = isFocused ? 0.018 : 0.085;
    const planetBobY = reducedMotion
      ? 0
      : Math.sin(t * 0.65 + phase) *
        bobAmplitude *
        (1 - jumpState.current.inAir);

    const breatheY = reducedMotion
      ? 0
      : Math.sin(t * 1.5) * 0.016 * (1 - jumpState.current.inAir);

    const worldX = animatedBasePos.current.x;
    const worldY =
      animatedBasePos.current.y +
      planetBobY +
      breatheY +
      jumpState.current.crouchY +
      jumpState.current.arcHeight;
    const worldZ = animatedBasePos.current.z;

    if (rootGroupRef.current) {
      rootGroupRef.current.position.set(worldX, worldY, worldZ);
      const s = animatedScale.current.value;
      const stretchY = 1 - jumpState.current.crouchY * 0.45;
      const squashXZ = 1 + jumpState.current.crouchY * 0.25;
      rootGroupRef.current.scale.set(s * squashXZ, s * stretchY, s * squashXZ);
    }

    if (postureGroupRef.current) {
      postureGroupRef.current.rotation.x = 0.06 + jumpState.current.tiltX;
      postureGroupRef.current.rotation.z = -0.03 + jumpState.current.tiltZ;
    }

    if (liveWorldPosRef) {
      liveWorldPosRef.current.set(worldX, worldY, worldZ);
    }

    // Update stardust trail following the jump
    if (jumpTrailRef.current) {
      for (let i = trailPositions.current.length - 1; i > 0; i--) {
        trailPositions.current[i].lerp(trailPositions.current[i - 1], 0.38);
      }
      trailPositions.current[0].set(worldX, worldY + 0.25, worldZ);

      jumpTrailRef.current.children.forEach((starMesh, idx) => {
        const p = trailPositions.current[idx];
        if (!p) return;
        starMesh.position.copy(p);
        const visibleScale =
          jumpState.current.inAir *
          (1 - idx / trailPositions.current.length) *
          0.11;
        starMesh.scale.setScalar(Math.max(0.0001, visibleScale));
        starMesh.rotation.z = t * 2 + idx;
      });
    }

    if (reducedMotion) return;

    if (princeHeadRef.current) {
      princeHeadRef.current.rotation.z = Math.sin(t * 1.1) * 0.04;
      princeHeadRef.current.rotation.y = isFocused
        ? Math.sin(t * 0.85) * 0.12
        : Math.sin(t * 0.7) * 0.07;
    }

    if (rightArmRef.current && leftArmRef.current) {
      if (jumpState.current.inAir > 0.1) {
        rightArmRef.current.rotation.z =
          -0.95 + Math.sin(t * 5) * 0.15 * jumpState.current.inAir;
        leftArmRef.current.rotation.z =
          0.85 - Math.sin(t * 5) * 0.15 * jumpState.current.inAir;
      } else if (isFocused) {
        rightArmRef.current.rotation.z = -0.56 + Math.sin(t * 2.2) * 0.12;
        leftArmRef.current.rotation.z = 0.38;
      } else {
        rightArmRef.current.rotation.z = -0.42 + Math.sin(t * 1.2) * 0.04;
        leftArmRef.current.rotation.z = 0.38;
      }
    }

    const scarfFreq = jumpState.current.inAir > 0.1 ? 5.2 : 2.4;
    if (scarfTailRef.current) {
      scarfTailRef.current.rotation.z = 0.28 + Math.sin(t * scarfFreq) * 0.16;
      scarfTailRef.current.rotation.y = Math.cos(t * 1.8) * 0.1;
    }
    if (scarfTail2Ref.current) {
      scarfTail2Ref.current.rotation.z =
        0.42 + Math.sin(t * scarfFreq - 0.7) * 0.2;
    }

    if (foxTailRef.current) {
      const tailSpeed =
        jumpState.current.inAir > 0.1 ? 4.5 : isFocused ? 2.6 : 2.0;
      foxTailRef.current.rotation.z = -0.45 + Math.sin(t * tailSpeed) * 0.16;
      foxTailRef.current.rotation.x = Math.cos(t * 1.5) * 0.06;
    }
    if (foxHeadRef.current) {
      foxHeadRef.current.rotation.z = -0.06 + Math.sin(t * 1.3 + 1) * 0.06;
      foxHeadRef.current.rotation.y = -0.2 + Math.sin(t * 0.9) * 0.1;
    }
  });

  return (
    <>
      {/* Stardust Jump Trail in World Space */}
      <group ref={jumpTrailRef}>
        {trailPositions.current.map((_, idx) => (
          <mesh key={idx} scale={0.0001}>
            <octahedronGeometry args={[1, 0]} />
            <meshBasicMaterial color="#ffe484" />
          </mesh>
        ))}
      </group>

      {/* Main Character Group in World Space (No white backing plates behind characters!) */}
      <group ref={rootGroupRef}>
        <group ref={postureGroupRef} rotation={[0.06, 0.08, -0.03]}>
          {/* ==================== EL PRINCIPITO (Caricatura 3D / Storybook Chibi) ==================== */}
          <group position={[-0.22, 0, 0]}>
            {/* Small Boots */}
            <mesh position={[-0.085, 0.09, 0.02]} castShadow>
              <capsuleGeometry args={[0.052, 0.08, 8, 12]} />
              <meshStandardMaterial {...bootsMat} />
            </mesh>
            <mesh position={[0.085, 0.09, 0.02]} castShadow>
              <capsuleGeometry args={[0.052, 0.08, 8, 12]} />
              <meshStandardMaterial {...bootsMat} />
            </mesh>

            {/* White Storybook Trousers */}
            <mesh position={[-0.08, 0.21, 0]} castShadow>
              <cylinderGeometry args={[0.058, 0.05, 0.16, 12]} />
              <meshStandardMaterial {...trousersMat} />
            </mesh>
            <mesh position={[0.08, 0.21, 0]} castShadow>
              <cylinderGeometry args={[0.058, 0.05, 0.16, 12]} />
              <meshStandardMaterial {...trousersMat} />
            </mesh>

            {/* Rounded Green Overcoat / Tunic */}
            <mesh position={[0, 0.42, 0]} castShadow>
              <cylinderGeometry args={[0.15, 0.24, 0.34, 18]} />
              <meshStandardMaterial {...coatMat} />
            </mesh>

            {/* Coat Lapels / Gold Buttons */}
            <mesh position={[-0.06, 0.44, 0.16]}>
              <sphereGeometry args={[0.022, 10, 10]} />
              <meshStandardMaterial {...scarfMat} />
            </mesh>
            <mesh position={[0.06, 0.44, 0.16]}>
              <sphereGeometry args={[0.022, 10, 10]} />
              <meshStandardMaterial {...scarfMat} />
            </mesh>

            {/* Left Arm */}
            <group
              ref={leftArmRef}
              position={[-0.18, 0.48, 0.02]}
              rotation={[0, 0, 0.38]}
            >
              <mesh position={[0, -0.08, 0]} castShadow>
                <capsuleGeometry args={[0.048, 0.13, 8, 12]} />
                <meshStandardMaterial {...coatMat} />
              </mesh>
              <mesh position={[0, -0.17, 0]}>
                <sphereGeometry args={[0.045, 12, 12]} />
                <meshStandardMaterial {...skinMat} />
              </mesh>
            </group>

            {/* Right Arm */}
            <group
              ref={rightArmRef}
              position={[0.18, 0.48, 0.04]}
              rotation={[0.2, 0, -0.42]}
            >
              <mesh position={[0, -0.08, 0]} castShadow>
                <capsuleGeometry args={[0.048, 0.13, 8, 12]} />
                <meshStandardMaterial {...coatMat} />
              </mesh>
              <mesh position={[0, -0.17, 0]}>
                <sphereGeometry args={[0.045, 12, 12]} />
                <meshStandardMaterial {...skinMat} />
              </mesh>
            </group>

            {/* Iconic Golden Scarf around neck + fluttering ribbon */}
            <group position={[0, 0.58, 0]}>
              <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
                <torusGeometry args={[0.145, 0.048, 12, 24]} />
                <meshStandardMaterial {...scarfMat} />
              </mesh>
              <mesh
                ref={scarfTailRef}
                position={[0.24, 0.02, -0.03]}
                rotation={[0.1, 0, 0.28]}
                castShadow
              >
                <boxGeometry args={[0.32, 0.085, 0.028]} />
                <meshStandardMaterial {...scarfMat} />
              </mesh>
              <mesh
                ref={scarfTail2Ref}
                position={[0.45, 0.08, -0.06]}
                rotation={[0.15, 0.1, 0.42]}
                castShadow
              >
                <boxGeometry args={[0.24, 0.075, 0.024]} />
                <meshStandardMaterial {...scarfMat} />
              </mesh>
            </group>

            {/* Slightly Larger Storybook Head (Chibi proportion) */}
            <group ref={princeHeadRef} position={[0, 0.83, 0.02]}>
              <mesh castShadow>
                <sphereGeometry args={[0.245, 24, 24]} />
                <meshStandardMaterial {...skinMat} />
              </mesh>

              {/* Little Ears */}
              <mesh position={[-0.23, -0.02, 0]}>
                <sphereGeometry args={[0.05, 12, 12]} />
                <meshStandardMaterial {...skinMat} />
              </mesh>
              <mesh position={[0.23, -0.02, 0]}>
                <sphereGeometry args={[0.05, 12, 12]} />
                <meshStandardMaterial {...skinMat} />
              </mesh>

              {/* Delicate Expressive Eyes */}
              <mesh position={[-0.082, 0.025, 0.222]}>
                <sphereGeometry args={[0.029, 14, 14]} />
                <meshStandardMaterial {...darkEyeMat} />
              </mesh>
              <mesh position={[0.082, 0.025, 0.222]}>
                <sphereGeometry args={[0.029, 14, 14]} />
                <meshStandardMaterial {...darkEyeMat} />
              </mesh>
              {/* Eye Sparkles */}
              <mesh position={[-0.072, 0.036, 0.245]}>
                <sphereGeometry args={[0.0095, 8, 8]} />
                <meshBasicMaterial color="#ffffff" />
              </mesh>
              <mesh position={[0.092, 0.036, 0.245]}>
                <sphereGeometry args={[0.0095, 8, 8]} />
                <meshBasicMaterial color="#ffffff" />
              </mesh>

              {/* Soft Warm Eyebrows */}
              <mesh
                position={[-0.085, 0.088, 0.218]}
                rotation={[0, 0, 0.12]}
              >
                <capsuleGeometry args={[0.008, 0.045, 4, 8]} />
                <meshStandardMaterial {...bootsMat} />
              </mesh>
              <mesh
                position={[0.085, 0.088, 0.218]}
                rotation={[0, 0, -0.12]}
              >
                <capsuleGeometry args={[0.008, 0.045, 4, 8]} />
                <meshStandardMaterial {...bootsMat} />
              </mesh>

              {/* Tiny Button Nose */}
              <mesh position={[0, -0.008, 0.244]}>
                <sphereGeometry args={[0.022, 10, 10]} />
                <meshStandardMaterial {...skinMat} />
              </mesh>

              {/* Rosy Watercolor Cheeks */}
              <mesh
                position={[-0.132, -0.032, 0.2]}
                rotation={[0, -0.4, 0]}
                scale={[1.25, 0.85, 0.35]}
              >
                <sphereGeometry args={[0.04, 12, 12]} />
                <meshStandardMaterial {...blushMat} />
              </mesh>
              <mesh
                position={[0.132, -0.032, 0.2]}
                rotation={[0, 0.4, 0]}
                scale={[1.25, 0.85, 0.35]}
              >
                <sphereGeometry args={[0.04, 12, 12]} />
                <meshStandardMaterial {...blushMat} />
              </mesh>

              {/* CLEAR UPWARD HAPPY STORYBOOK SMILE */}
              <mesh
                position={[0, -0.048, 0.236]}
                rotation={[-0.12, 0, Math.PI]}
              >
                <torusGeometry args={[0.044, 0.009, 10, 24, Math.PI]} />
                <meshStandardMaterial {...smileMat} />
              </mesh>

              {/* Sculpted Fluffy Golden Storybook Hair */}
              <group position={[0, 0.07, 0]}>
                <mesh position={[0, 0.07, -0.02]} castShadow>
                  <sphereGeometry args={[0.24, 18, 18]} />
                  <meshStandardMaterial {...hairMat} />
                </mesh>
                <mesh
                  position={[-0.11, 0.11, 0.15]}
                  rotation={[0.3, 0.2, -0.5]}
                  castShadow
                >
                  <coneGeometry args={[0.095, 0.24, 12]} />
                  <meshStandardMaterial {...hairMat} />
                </mesh>
                <mesh
                  position={[0.05, 0.14, 0.17]}
                  rotation={[0.35, -0.1, -0.65]}
                  castShadow
                >
                  <coneGeometry args={[0.105, 0.27, 12]} />
                  <meshStandardMaterial {...hairMat} />
                </mesh>
                <mesh
                  position={[0.18, 0.09, 0.11]}
                  rotation={[0.2, -0.3, -0.8]}
                  castShadow
                >
                  <coneGeometry args={[0.085, 0.22, 12]} />
                  <meshStandardMaterial {...hairMat} />
                </mesh>
                <mesh
                  position={[-0.19, 0.06, 0.06]}
                  rotation={[0.1, 0.3, 0.7]}
                  castShadow
                >
                  <coneGeometry args={[0.085, 0.2, 12]} />
                  <meshStandardMaterial {...hairMat} />
                </mesh>
              </group>
            </group>
          </group>

          {/* ==================== EL ZORRO (Caricatura 3D / Storybook Companion) ==================== */}
          <group position={[0.32, 0.02, 0.08]} rotation={[0, -0.25, 0]}>
            {/* Seated Rounded Body */}
            <mesh position={[0, 0.16, 0]} castShadow>
              <capsuleGeometry args={[0.115, 0.12, 10, 16]} />
              <meshStandardMaterial {...foxOrangeMat} />
            </mesh>

            {/* Cream Chest Tuft */}
            <mesh position={[0, 0.18, 0.095]} scale={[0.85, 1.0, 0.5]}>
              <sphereGeometry args={[0.095, 12, 12]} />
              <meshStandardMaterial {...foxCreamMat} />
            </mesh>

            {/* Tiny Front Paws */}
            <mesh position={[-0.055, 0.05, 0.08]}>
              <sphereGeometry args={[0.038, 10, 10]} />
              <meshStandardMaterial {...bootsMat} />
            </mesh>
            <mesh position={[0.055, 0.05, 0.08]}>
              <sphereGeometry args={[0.038, 10, 10]} />
              <meshStandardMaterial {...bootsMat} />
            </mesh>

            {/* Expressive Storybook Fox Head */}
            <group ref={foxHeadRef} position={[0, 0.37, 0.04]}>
              <mesh scale={[1.12, 0.95, 1.0]} castShadow>
                <sphereGeometry args={[0.155, 18, 18]} />
                <meshStandardMaterial {...foxOrangeMat} />
              </mesh>

              {/* Cream Cheeks & Snout */}
              <mesh position={[-0.08, -0.04, 0.08]} scale={[1.1, 0.75, 0.8]}>
                <sphereGeometry args={[0.075, 12, 12]} />
                <meshStandardMaterial {...foxCreamMat} />
              </mesh>
              <mesh position={[0.08, -0.04, 0.08]} scale={[1.1, 0.75, 0.8]}>
                <sphereGeometry args={[0.075, 12, 12]} />
                <meshStandardMaterial {...foxCreamMat} />
              </mesh>
              <mesh
                position={[0, -0.03, 0.145]}
                rotation={[Math.PI / 2, 0, 0]}
              >
                <coneGeometry args={[0.058, 0.11, 12]} />
                <meshStandardMaterial {...foxCreamMat} />
              </mesh>
              <mesh position={[0, -0.02, 0.205]}>
                <sphereGeometry args={[0.02, 10, 10]} />
                <meshStandardMaterial {...darkEyeMat} />
              </mesh>

              {/* Cute Upward Smile on Fox */}
              <mesh
                position={[0, -0.042, 0.176]}
                rotation={[-0.1, 0, Math.PI]}
              >
                <torusGeometry args={[0.022, 0.005, 8, 16, Math.PI]} />
                <meshStandardMaterial {...smileMat} />
              </mesh>

              {/* Delicate Fox Eyes */}
              <mesh position={[-0.058, 0.022, 0.138]}>
                <sphereGeometry args={[0.02, 12, 12]} />
                <meshStandardMaterial {...darkEyeMat} />
              </mesh>
              <mesh position={[0.058, 0.022, 0.138]}>
                <sphereGeometry args={[0.02, 12, 12]} />
                <meshStandardMaterial {...darkEyeMat} />
              </mesh>
              <mesh position={[-0.052, 0.03, 0.154]}>
                <sphereGeometry args={[0.007, 8, 8]} />
                <meshBasicMaterial color="#ffffff" />
              </mesh>
              <mesh position={[0.064, 0.03, 0.154]}>
                <sphereGeometry args={[0.007, 8, 8]} />
                <meshBasicMaterial color="#ffffff" />
              </mesh>

              {/* Oversized Storybook Ears */}
              <group position={[-0.1, 0.14, 0]} rotation={[0, 0, 0.32]}>
                <mesh castShadow>
                  <coneGeometry args={[0.068, 0.19, 12]} />
                  <meshStandardMaterial {...foxOrangeMat} />
                </mesh>
                <mesh position={[0, -0.01, 0.022]} scale={[0.65, 0.75, 0.5]}>
                  <coneGeometry args={[0.068, 0.19, 12]} />
                  <meshStandardMaterial {...foxCreamMat} />
                </mesh>
              </group>
              <group position={[0.1, 0.14, 0]} rotation={[0, 0, -0.32]}>
                <mesh castShadow>
                  <coneGeometry args={[0.068, 0.19, 12]} />
                  <meshStandardMaterial {...foxOrangeMat} />
                </mesh>
                <mesh position={[0, -0.01, 0.022]} scale={[0.65, 0.75, 0.5]}>
                  <coneGeometry args={[0.068, 0.19, 12]} />
                  <meshStandardMaterial {...foxCreamMat} />
                </mesh>
              </group>
            </group>

            {/* Fluffy Storybook Fox Tail with White Tip */}
            <group
              ref={foxTailRef}
              position={[0.1, 0.12, -0.08]}
              rotation={[0.2, 0.3, -0.45]}
            >
              <mesh
                position={[0.09, 0.08, 0]}
                rotation={[0, 0, -0.7]}
                castShadow
              >
                <capsuleGeometry args={[0.068, 0.16, 8, 12]} />
                <meshStandardMaterial {...foxOrangeMat} />
              </mesh>
              <mesh position={[0.19, 0.17, 0]} rotation={[0, 0, -0.7]}>
                <coneGeometry args={[0.068, 0.14, 12]} />
                <meshStandardMaterial {...foxCreamMat} />
              </mesh>
            </group>
          </group>
        </group>
      </group>
    </>
  );
};
