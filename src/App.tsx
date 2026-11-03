import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { UniverseScene } from './scenes/UniverseScene';
import { HudOverlay } from './interactions/HudOverlay';
import { WebGLFallback } from './scenes/WebGLFallback';
import { ambientAudio } from './audio/AmbientAudio';
import { invitationConfig } from './config/invitationConfig';
import { SceneStage } from './camera/ImmersiveCamera';

function checkWebGLAvailable(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch {
    return false;
  }
}

export const App: React.FC = () => {
  const [webglSupported, setWebglSupported] = useState(true);
  const [stage, setStage] = useState<SceneStage>('universe');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [paused, setPaused] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [parallaxOffset, setParallaxOffset] = useState({ x: 0, y: 0 });
  const [phase4NoticeOpen, setPhase4NoticeOpen] = useState(false);

  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    setWebglSupported(checkWebGLAvailable());

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleMotionChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };
    mediaQuery.addEventListener('change', handleMotionChange);
    return () => mediaQuery.removeEventListener('change', handleMotionChange);
  }, []);

  // Desktop mouse / mobile touch parallax
  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (prefersReducedMotion || paused) return;
      if (e.pointerType === 'touch') {
        if (!touchStartRef.current) return;
        const dx =
          (e.clientX - touchStartRef.current.x) / (window.innerWidth * 0.42);
        const dy =
          -(e.clientY - touchStartRef.current.y) / (window.innerHeight * 0.42);
        setParallaxOffset({
          x: Math.max(-1, Math.min(1, dx)),
          y: Math.max(-1, Math.min(1, dy)),
        });
        return;
      }
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = -(e.clientY / window.innerHeight) * 2 + 1;
      setParallaxOffset({ x: nx, y: ny });
    },
    [prefersReducedMotion, paused]
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.pointerType === 'touch') {
        touchStartRef.current = { x: e.clientX, y: e.clientY };
      }
    },
    []
  );

  const handlePointerUp = useCallback(() => {
    touchStartRef.current = null;
    setParallaxOffset({ x: 0, y: 0 });
  }, []);

  const handleToggleSound = useCallback(() => {
    const nowPlaying = ambientAudio.toggle();
    setSoundEnabled(nowPlaying);
  }, []);

  const handleTogglePause = useCallback(() => {
    setPaused((prev) => !prev);
  }, []);

  // Advance through Universe -> Planet 1 -> Planet 2 (Amor) -> Planet 3 (Sueños) -> Planet 4 (Fe)
  const handleNextStage = useCallback(() => {
    if (isTransitioning) return;
    ambientAudio.playChime();
    setParallaxOffset({ x: 0, y: 0 });

    if (stage === 'universe') {
      setStage('planet-1');
    } else if (stage === 'planet-1') {
      setStage('planet-2');
    } else if (stage === 'planet-2') {
      setStage('planet-3');
    } else if (stage === 'planet-3') {
      setStage('planet-4');
    } else {
      setPhase4NoticeOpen(true);
    }
  }, [stage, isTransitioning]);

  // Step backward through the journey
  const handlePrevStage = useCallback(() => {
    if (isTransitioning) return;
    ambientAudio.playChime();
    setParallaxOffset({ x: 0, y: 0 });

    if (stage === 'planet-4') {
      setStage('planet-3');
    } else if (stage === 'planet-3') {
      setStage('planet-2');
    } else if (stage === 'planet-2') {
      setStage('planet-1');
    } else if (stage === 'planet-1') {
      setStage('universe');
    }
  }, [stage, isTransitioning]);

  const handleSelectStage = useCallback(
    (targetStage: SceneStage) => {
      if (isTransitioning || targetStage === stage) return;
      ambientAudio.playChime();
      setParallaxOffset({ x: 0, y: 0 });
      setStage(targetStage);
    },
    [stage, isTransitioning]
  );

  const handleTransitionStart = useCallback(() => {
    setIsTransitioning(true);
  }, []);

  const handleTransitionComplete = useCallback((arrivedStage: SceneStage) => {
    setIsTransitioning(false);
    if (arrivedStage !== 'universe') {
      ambientAudio.playLandingChime();
    }
  }, []);

  if (!webglSupported) {
    return <WebGLFallback />;
  }

  const reducedMotion = prefersReducedMotion || paused;

  return (
    <main
      className="experience-viewport"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* Subtle Paper Grain Overlay for Authentic Illustrated Storybook Feel */}
      <div className="paper-texture-overlay" aria-hidden="true" />

      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{
          position: invitationConfig.universeCamera.initialPosition,
          fov: invitationConfig.universeCamera.fov,
          near: 0.1,
          far: 100,
        }}
      >
        <UniverseScene
          stage={stage}
          reducedMotion={reducedMotion}
          parallaxOffset={parallaxOffset}
          onTransitionStart={handleTransitionStart}
          onTransitionComplete={handleTransitionComplete}
        />
      </Canvas>

      <HudOverlay
        stage={stage}
        isTransitioning={isTransitioning}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        paused={paused}
        onTogglePause={handleTogglePause}
        onNextStage={handleNextStage}
        onPrevStage={handlePrevStage}
        onSelectStage={handleSelectStage}
        phase4NoticeOpen={phase4NoticeOpen}
        onClosePhase4Notice={() => setPhase4NoticeOpen(false)}
      />
    </main>
  );
};

export default App;
