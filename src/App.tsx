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
import { NotFound404 } from './pages/NotFound404';
import { DashboardPage } from './pages/DashboardPage';
import {
  FamilyGroup,
  GlobalInvitationSettings,
  InvitationRecord,
  subscribeToInvitationByToken,
} from './services/invitationService';

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

/**
 * Resolves the current route:
 * - `/mi_dashboard` -> Dashboard protected by Firebase PIN
 * - `/?t=TOKEN`, `/?token=TOKEN`, `/i/TOKEN` -> Guest Invitation by Token
 * - `/` (root without token) -> 404 Not Found
 */
function resolveRouteFromLocation(): {
  type: 'dashboard' | 'invitation' | 'not-found';
  token?: string;
} {
  const path = window.location.pathname.replace(/\/+$/, '') || '/';
  const params = new URLSearchParams(window.location.search);

  if (path === '/mi_dashboard') {
    return { type: 'dashboard' };
  }

  const queryToken = params.get('t') || params.get('token');
  if (queryToken && queryToken.trim()) {
    return { type: 'invitation', token: queryToken.trim() };
  }

  if (path.startsWith('/i/') || path.startsWith('/invitacion/')) {
    const parts = path.split('/').filter(Boolean);
    const pathToken = parts[1];
    if (pathToken) {
      return { type: 'invitation', token: decodeURIComponent(pathToken) };
    }
  }

  // Root `/` without token or any unknown path -> 404 screen
  return { type: 'not-found' };
}

export const App: React.FC = () => {
  const [route] = useState(resolveRouteFromLocation);
  const [webglSupported, setWebglSupported] = useState(true);
  const [stage, setStage] = useState<SceneStage>('universe');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [paused, setPaused] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [parallaxOffset, setParallaxOffset] = useState({ x: 0, y: 0 });

  // Invitation Token State from Firebase / Service
  const [loadingToken, setLoadingToken] = useState(
    route.type === 'invitation'
  );
  const [invitation, setInvitation] = useState<InvitationRecord | null>(null);
  const [familyInvitations, setFamilyInvitations] = useState<
    InvitationRecord[]
  >([]);
  const [familyGroup, setFamilyGroup] = useState<FamilyGroup | null>(null);
  const [settings, setSettings] = useState<GlobalInvitationSettings>({
    dashboardPin: '2026',
    rsvpDeadline: '2026-11-25T23:59',
    updatedAt: '',
  });

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

  // Subscribe to invitation token if on an invitation route
  useEffect(() => {
    if (route.type !== 'invitation' || !route.token) {
      setLoadingToken(false);
      return;
    }

    setLoadingToken(true);
    const unsub = subscribeToInvitationByToken(route.token, (data) => {
      setInvitation(data.invitation);
      setFamilyInvitations(data.familyInvitations);
      setFamilyGroup(data.familyGroup);
      setSettings(data.settings);
      setLoadingToken(data.loading);
    });

    return () => unsub();
  }, [route]);

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

  useEffect(() => {
    if (route.type !== 'invitation') return;
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
  }, [route.type, handleNextStage, handlePrevStage]);

  const handleTransitionStart = useCallback(() => {
    setIsTransitioning(true);
  }, []);

  const handleTransitionComplete = useCallback((arrivedStage: SceneStage) => {
    setIsTransitioning(false);
    if (arrivedStage !== 'universe') {
      ambientAudio.playLandingChime();
    }
  }, []);

  // 1. Route: /mi_dashboard
  if (route.type === 'dashboard') {
    return <DashboardPage />;
  }

  // 2. Route: Root `/` without token -> 404 screen
  if (route.type === 'not-found') {
    return <NotFound404 />;
  }

  // 3. Loading token from Firebase
  if (loadingToken) {
    return (
      <div className="storybook-loader" role="status">
        <div className="loader-star">✦</div>
        <p>Verificando tu invitación estelar...</p>
      </div>
    );
  }

  // 4. Invalid / non-existent token -> 404 screen
  if (!invitation) {
    return <NotFound404 />;
  }

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
        invitation={invitation}
        familyInvitations={familyInvitations}
        familyGroup={familyGroup}
        settings={settings}
      />
    </main>
  );
};

export default App;
