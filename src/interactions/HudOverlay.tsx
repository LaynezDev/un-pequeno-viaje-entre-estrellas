import React, { useState } from 'react';
import {
  Volume2,
  VolumeX,
  Sparkles,
  Pause,
  Play,
  Compass,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';
import { invitationConfig } from '../config/invitationConfig';
import {
  SceneStage,
  getPlanetIndexForStage,
} from '../camera/ImmersiveCamera';

interface HudOverlayProps {
  stage: SceneStage;
  isTransitioning: boolean;
  soundEnabled: boolean;
  onToggleSound: () => void;
  paused: boolean;
  onTogglePause: () => void;
  onNextStage: () => void;
  onPrevStage: () => void;
  onSelectStage: (targetStage: SceneStage) => void;
  phase4NoticeOpen: boolean;
  onClosePhase4Notice: () => void;
}

const STAGE_BY_PLANET_INDEX: SceneStage[] = [
  'planet-1',
  'planet-2',
  'planet-3',
  'planet-4',
];

export const HudOverlay: React.FC<HudOverlayProps> = ({
  stage,
  isTransitioning,
  soundEnabled,
  onToggleSound,
  paused,
  onTogglePause,
  onNextStage,
  onPrevStage,
  onSelectStage,
  phase4NoticeOpen,
  onClosePhase4Notice,
}) => {
  const [showLegend, setShowLegend] = useState(false);

  const activePlanetIdx = getPlanetIndexForStage(stage);
  const activePlanet =
    invitationConfig.planets[activePlanetIdx] ?? invitationConfig.planets[0];

  const sceneLabel =
    stage === 'universe'
      ? 'Escena 01 • El Universo'
      : stage === 'planet-1'
        ? 'Escena 02 • El Pequeño Planeta'
        : `Escena 04 • ${activePlanet.name}`;

  const flightMessage =
    stage === 'universe'
      ? 'Regresando a la vista del Universo...'
      : `Viajando hacia ${activePlanet.name}...`;

  return (
    <div className="hud-root">
      {/* Decorative Shadow Box Paper Frame Vignette */}
      <div className="shadowbox-frame-border" aria-hidden="true" />

      {/* Top Bar: Title + Audio & Motion Controls */}
      <header className="hud-header">
        <div className="hud-brand">
          <span className="hud-phase-pill">
            <Sparkles size={13} />
            <span>{sceneLabel}</span>
          </span>
          <h1 className="hud-project-title">{invitationConfig.projectTitle}</h1>
        </div>

        <div className="hud-controls">
          <button
            type="button"
            className="hud-icon-btn"
            onClick={() => setShowLegend((v) => !v)}
            title="Ver mapa de planetas en el universo"
            aria-label="Mapa de planetas"
          >
            <Compass size={17} />
            <span className="hud-btn-label">Destinos</span>
          </button>

          <button
            type="button"
            className="hud-icon-btn"
            onClick={onTogglePause}
            title={
              paused
                ? 'Reanudar movimiento ambiental'
                : 'Pausar movimiento ambiental'
            }
            aria-label={paused ? 'Reanudar animación' : 'Pausar animación'}
          >
            {paused ? <Play size={17} /> : <Pause size={17} />}
          </button>

          <button
            type="button"
            className={`hud-icon-btn ${soundEnabled ? 'is-active' : ''}`}
            onClick={onToggleSound}
            title={
              soundEnabled
                ? 'Silenciar música ambiental'
                : 'Activar música ambiental'
            }
            aria-label="Alternar sonido"
          >
            {soundEnabled ? <Volume2 size={17} /> : <VolumeX size={17} />}
            <span className="hud-btn-label">
              {soundEnabled ? 'Sonido On' : 'Sonido'}
            </span>
          </button>
        </div>
      </header>

      {/* Interactive Planet Legend Overlay */}
      {showLegend && (
        <aside className="hud-planet-legend">
          <div className="legend-title">Mundos en este Universo</div>
          <ul>
            {invitationConfig.planets.map((p, idx) => {
              const targetStage = STAGE_BY_PLANET_INDEX[idx];
              const isCurrent = stage !== 'universe' && activePlanetIdx === idx;
              const isSelectable = Boolean(targetStage);
              return (
                <li
                  key={p.id}
                  className={`${isCurrent ? 'is-current-planet' : ''} ${
                    isSelectable ? 'is-selectable-planet' : ''
                  }`}
                  onClick={() => {
                    if (targetStage && !isTransitioning) {
                      onSelectStage(targetStage);
                      setShowLegend(false);
                    }
                  }}
                >
                  <span
                    className="legend-dot"
                    style={{ backgroundColor: p.palette.primary }}
                  />
                  <div>
                    <strong>
                      {p.order}. {p.name}
                    </strong>
                    <small>{p.subtitle}</small>
                  </div>
                </li>
              );
            })}
          </ul>
        </aside>
      )}

      {/* Flight status pill shown subtly while camera is moving */}
      {isTransitioning && (
        <div className="camera-flight-pill" aria-live="polite">
          <Sparkles size={14} />
          <span>{flightMessage}</span>
        </div>
      )}

      {/* Bottom Narrative Storybook Card — Fades out smoothly during camera flight */}
      <footer
        className={`hud-footer ${isTransitioning ? 'is-hidden-during-flight' : ''}`}
      >
        {stage === 'universe' ? (
          <div className="storybook-card">
            <p className="storybook-quote">
              “{invitationConfig.openingQuote}”
            </p>

            <div className="storybook-actions">
              <button
                type="button"
                className="btn-start-journey"
                onClick={onNextStage}
                disabled={isTransitioning}
              >
                <span>Comenzar viaje</span>
                <Sparkles size={16} />
              </button>
            </div>

            <span className="parallax-hint">
              Desliza con tu dedo para explorar la profundidad del cuento
            </span>
          </div>
        ) : (
          <div className="storybook-card is-planet-card">
            <div className="planet-card-header-row">
              <span
                className="planet-card-tag"
                style={{
                  backgroundColor: `${activePlanet.palette.primary}38`,
                  borderColor: activePlanet.palette.secondary,
                }}
              >
                {activePlanet.order}. {activePlanet.name}
              </span>

              {/* Step progress dots for the 4 narrative planets */}
              <div className="planet-step-dots" aria-label="Progreso del viaje">
                {STAGE_BY_PLANET_INDEX.map((st, idx) => (
                  <button
                    key={st}
                    type="button"
                    className={`step-dot ${
                      activePlanetIdx === idx ? 'is-active' : ''
                    }`}
                    onClick={() => !isTransitioning && onSelectStage(st)}
                    aria-label={`Ir al planeta ${idx + 1}`}
                  />
                ))}
              </div>
            </div>

            <p className="storybook-quote">“{activePlanet.narrativeText}”</p>

            <div className="storybook-actions storybook-actions-dual">
              <button
                type="button"
                className="btn-secondary-journey"
                onClick={onPrevStage}
                disabled={isTransitioning}
              >
                <ArrowLeft size={16} />
                <span>{stage === 'planet-1' ? 'Universo' : 'Anterior'}</span>
              </button>

              <button
                type="button"
                className="btn-start-journey"
                onClick={onNextStage}
                disabled={isTransitioning}
              >
                <span>
                  {stage === 'planet-4'
                    ? 'Hacia el Destino'
                    : 'Continuar viaje'}
                </span>
                <ArrowRight size={16} />
              </button>
            </div>

            <span className="parallax-hint">
              Desliza suavemente para descubrir los detalles en capas de{' '}
              {activePlanet.name}
            </span>
          </div>
        )}
      </footer>

      {/* Phase 4 Validation Modal when clicking "Hacia el Destino" on Planet 4 */}
      {phase4NoticeOpen && (
        <div className="phase-modal-backdrop" onClick={onClosePhase4Notice}>
          <div
            className="phase-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="phase-modal-badge">FASE 4 COMPLETADA</span>
            <h2>Los Planetas de la Historia están listos</h2>
            <p>
              Ya puedes recorrer con el Principito y su zorro los cuatro mundos
              narrativos: <strong>El Pequeño Planeta</strong>,{' '}
              <strong>Planeta del Amor</strong>,{' '}
              <strong>Planeta de los Sueños</strong> y{' '}
              <strong>Planeta de la Fe</strong> (sin fondos blancos detrás de
              los personajes).
            </p>
            <p className="phase-modal-sub">
              Al validar esta Fase 4, avanzaremos a la{' '}
              <strong>Fase 5 (Invitación — Escena 05: El Destino)</strong>: la
              revelación dorada del planeta de{' '}
              <strong>CHRISTOPHER GABRIEL</strong> con todos los datos del
              bautizo, primer cumpleaños, Google Maps y confirmación de
              asistencia.
            </p>
            <div className="modal-actions-row">
              <button
                type="button"
                className="btn-secondary-journey"
                onClick={() => {
                  onClosePhase4Notice();
                  onSelectStage('planet-1');
                }}
              >
                Recorrer desde el planeta 1
              </button>
              <button
                type="button"
                className="btn-start-journey"
                onClick={onClosePhase4Notice}
              >
                Seguir contemplando
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
