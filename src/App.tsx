import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  Suspense,
  lazy,
} from 'react';
import { Canvas } from '@react-three/fiber';
import { HudOverlay } from './interactions/HudOverlay';
import { WebGLFallback } from './scenes/WebGLFallback';
import { ambientAudio } from './audio/AmbientAudio';
import { invitationConfig } from './config/invitationConfig';
import { SceneStage } from './camera/ImmersiveCamera';

const UniverseScene = lazy(() => import('./scenes/UniverseScene'));

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

  // Advance through Universe -> Planet 1 -> Planet 2 -> Planet 3 -> Planet 4 -> Planet 5 (El Destino)
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
    } else if (stage === 'planet-4') {
      setStage('planet-5');
    }
  }, [stage, isTransitioning]);

  // Step backward through the journey
  const handlePrevStage = useCallback(() => {
    if (isTransitioning) return;
    ambientAudio.playChime();
    setParallaxOffset({ x: 0, y: 0 });

    if (stage === 'planet-5') {
      setStage('planet-4');
    } else if (stage === 'planet-4') {
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

  // Keyboard navigation for desktop users
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
      if (e.key === 'ArrowRight') {
        handleNextStage();
      } else if (e.key === 'ArrowLeft') {
        handlePrevStage();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleNextStage, handlePrevStage]);

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

      <Suspense
        fallback={
          <div className="storybook-loader" role="status">
            <div className="loader-star">✦</div>
            <p>Abriendo nuestro pequeño universo...</p>
          </div>
        }
      >
        <Canvas
          shadows
          dpr={[1, 1.75]}
          gl={{
            antialias: true,
            powerPreference: 'high-performance',
          }}
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
            onSelectStage={handleSelectStage}
          />
        </Canvas>
      </Suspense>

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
      />
    </main>
  );
};

export default App;
