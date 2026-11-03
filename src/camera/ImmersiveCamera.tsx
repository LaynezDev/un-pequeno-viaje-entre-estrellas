import React, { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import gsap from 'gsap';
import { invitationConfig } from '../config/invitationConfig';

export type SceneStage =
  | 'universe'
  | 'planet-1'
  | 'planet-2'
  | 'planet-3'
  | 'planet-4'
  | 'planet-5';

export function getPlanetIndexForStage(stage: SceneStage): number {
  switch (stage) {
    case 'planet-1':
      return 0;
    case 'planet-2':
      return 1;
    case 'planet-3':
      return 2;
    case 'planet-4':
      return 3;
    case 'planet-5':
      return 4;
    default:
      return 0;
  }
}

interface ImmersiveCameraProps {
  stage: SceneStage;
  reducedMotion?: boolean;
  parallaxOffset: { x: number; y: number };
  liveCharacterPosRef?: React.MutableRefObject<THREE.Vector3>;
  onTransitionStart?: () => void;
  onTransitionComplete?: (arrivedStage: SceneStage) => void;
}

export const ImmersiveCamera: React.FC<ImmersiveCameraProps> = ({
  stage,
  reducedMotion = false,
  parallaxOffset,
  liveCharacterPosRef,
  onTransitionStart,
  onTransitionComplete,
}) => {
  const { camera, size } = useThree();
  const isPortrait = size.width < size.height;

  const basePos = useRef(
    new THREE.Vector3(
      ...(isPortrait
        ? invitationConfig.universeCamera.mobilePosition
        : invitationConfig.universeCamera.initialPosition)
    )
  );
  const baseTarget = useRef(
    new THREE.Vector3(
      ...(isPortrait
        ? invitationConfig.universeCamera.mobileTarget
        : invitationConfig.universeCamera.initialTarget)
    )
  );

  const renderedPos = useRef(basePos.current.clone());
  const renderedTarget = useRef(baseTarget.current.clone());
  const prevStage = useRef<SceneStage>(stage);
  const flightArc = useRef({
    x: 0,
    y: 0,
    z: 0,
    trackCharacterWeight: 0,
  });

  // Keep camera FOV responsive for mobile portrait vs desktop
  useEffect(() => {
    if (camera instanceof THREE.PerspectiveCamera) {
      const desiredFov = isPortrait
        ? invitationConfig.universeCamera.mobileFov
        : invitationConfig.universeCamera.fov;
      if (camera.fov !== desiredFov) {
        camera.fov = desiredFov;
        camera.updateProjectionMatrix();
      }
    }
  }, [camera, isPortrait]);

  const getStageWaypoints = (targetStage: SceneStage, portrait: boolean) => {
    if (targetStage === 'universe') {
      return {
        pos: portrait
          ? invitationConfig.universeCamera.mobilePosition
          : invitationConfig.universeCamera.initialPosition,
        target: portrait
          ? invitationConfig.universeCamera.mobileTarget
          : invitationConfig.universeCamera.initialTarget,
      };
    }

    const planetIdx = getPlanetIndexForStage(targetStage);
    const planet =
      invitationConfig.planets[planetIdx] ?? invitationConfig.planets[0];
    return {
      pos: portrait
        ? planet.cameraView.mobilePosition
        : planet.cameraView.position,
      target: portrait
        ? planet.cameraView.mobileTarget
        : planet.cameraView.target,
    };
  };

  useEffect(() => {
    const waypoints = getStageWaypoints(stage, isPortrait);
    const fromStage = prevStage.current;
    const stageChanged = fromStage !== stage;
    prevStage.current = stage;

    gsap.killTweensOf(basePos.current);
    gsap.killTweensOf(baseTarget.current);
    gsap.killTweensOf(flightArc.current);

    if (!stageChanged) {
      basePos.current.set(...waypoints.pos);
      baseTarget.current.set(...waypoints.target);
      return;
    }

    const isInterplanetaryJump =
      fromStage !== 'universe' && stage !== 'universe';
    const isGrandFinaleArrival = stage === 'planet-5';

    const duration = reducedMotion
      ? 1.5
      : isGrandFinaleArrival
        ? 4.7
        : isInterplanetaryJump
          ? 4.35
          : 4.1;
    onTransitionStart?.();

    if (isInterplanetaryJump && !reducedMotion) {
      // For Escena 05 (El Destino), the camera pulls back slightly further first to reveal the special golden planet
      const pullBackZ = isGrandFinaleArrival ? 4.2 : 2.6;
      const liftY = isGrandFinaleArrival ? 1.75 : 1.3;

      const tl = gsap.timeline();
      tl.to(
        flightArc.current,
        {
          y: liftY,
          z: pullBackZ,
          trackCharacterWeight: 0.82,
          duration: duration * 0.48,
          ease: 'sine.out',
        },
        0.2
      ).to(
        flightArc.current,
        {
          y: 0,
          z: 0,
          trackCharacterWeight: 0,
          duration: duration * 0.48,
          ease: 'power2.inOut',
        },
        duration * 0.52
      );

      gsap.to(basePos.current, {
        x: waypoints.pos[0],
        y: waypoints.pos[1],
        z: waypoints.pos[2],
        delay: 0.32,
        duration: duration - 0.32,
        ease: 'power2.inOut',
        onComplete: () => {
          onTransitionComplete?.(stage);
        },
      });

      gsap.to(baseTarget.current, {
        x: waypoints.target[0],
        y: waypoints.target[1],
        z: waypoints.target[2],
        delay: 0.32,
        duration: duration - 0.32,
        ease: 'power2.inOut',
      });
    } else {
      // Universe <-> Planet Dolly transition
      if (!reducedMotion) {
        const tl = gsap.timeline();
        tl.to(flightArc.current, {
          y: stage === 'universe' ? 0.55 : 0.85,
          x: stage === 'universe' ? 0.35 : -0.45,
          z: 0,
          trackCharacterWeight: 0,
          duration: duration * 0.45,
          ease: 'sine.out',
        }).to(flightArc.current, {
          y: 0,
          x: 0,
          z: 0,
          trackCharacterWeight: 0,
          duration: duration * 0.55,
          ease: 'power2.inOut',
        });
      }

      gsap.to(basePos.current, {
        x: waypoints.pos[0],
        y: waypoints.pos[1],
        z: waypoints.pos[2],
        duration,
        ease: 'power2.inOut',
        onComplete: () => {
          onTransitionComplete?.(stage);
        },
      });

      gsap.to(baseTarget.current, {
        x: waypoints.target[0],
        y: waypoints.target[1],
        z: waypoints.target[2],
        duration: duration * 0.92,
        ease: 'power2.inOut',
      });
    }
  }, [
    stage,
    isPortrait,
    reducedMotion,
    onTransitionStart,
    onTransitionComplete,
  ]);

  useFrame(({ clock }, delta) => {
    const t = clock.getElapsedTime();

    const isCloseUp = stage !== 'universe';
    const idleAmpX = reducedMotion ? 0 : isCloseUp ? 0.055 : 0.28;
    const idleAmpY = reducedMotion ? 0 : isCloseUp ? 0.04 : 0.18;

    const parallaxAmpX = isCloseUp ? 0.68 : 1.85;
    const parallaxAmpY = isCloseUp ? 0.42 : 1.15;

    const idleX = Math.sin(t * 0.35) * idleAmpX;
    const idleY = Math.cos(t * 0.28) * idleAmpY;

    const desiredPos = new THREE.Vector3(
      basePos.current.x +
        flightArc.current.x +
        idleX +
        parallaxOffset.x * parallaxAmpX,
      basePos.current.y +
        flightArc.current.y +
        idleY +
        parallaxOffset.y * parallaxAmpY,
      basePos.current.z + flightArc.current.z
    );

    const lookParallaxX = isCloseUp ? 0.14 : 0.38;
    const lookParallaxY = isCloseUp ? 0.1 : 0.28;

    const desiredTarget = new THREE.Vector3(
      baseTarget.current.x + parallaxOffset.x * lookParallaxX,
      baseTarget.current.y + parallaxOffset.y * lookParallaxY,
      baseTarget.current.z
    );

    if (liveCharacterPosRef && flightArc.current.trackCharacterWeight > 0.001) {
      const charTarget = liveCharacterPosRef.current.clone();
      charTarget.y += isPortrait ? -0.15 : 0.15;
      desiredTarget.lerp(charTarget, flightArc.current.trackCharacterWeight);
    }

    const damp = 1 - Math.exp(-5.0 * delta);
    renderedPos.current.lerp(desiredPos, damp);
    renderedTarget.current.lerp(desiredTarget, damp);

    camera.position.copy(renderedPos.current);
    camera.lookAt(renderedTarget.current);
  });

  return null;
};
