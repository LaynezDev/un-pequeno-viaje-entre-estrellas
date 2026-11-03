import React, { useState, useEffect } from 'react';
import {
  Volume2,
  VolumeX,
  Sparkles,
  Pause,
  Play,
  Compass,
  ArrowLeft,
  ArrowRight,
  Calendar,
  Clock,
  MapPin,
  Church,
  PartyPopper,
  MessageCircleHeart,
  RotateCcw,
  Eye,
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
}

const STAGE_BY_PLANET_INDEX: SceneStage[] = [
  'planet-1',
  'planet-2',
  'planet-3',
  'planet-4',
  'planet-5',
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
}) => {
  const [showLegend, setShowLegend] = useState(false);
  const [invitationDetailsExpanded, setInvitationDetailsExpanded] =
    useState(false);
  const [guestName, setGuestName] = useState('');
  const [guestCount, setGuestCount] = useState('2 personas');

  const activePlanetIdx = getPlanetIndexForStage(stage);
  const activePlanet =
    invitationConfig.planets[activePlanetIdx] ?? invitationConfig.planets[0];

  // Reset expanded invitation card whenever leaving Scene 05
  useEffect(() => {
    if (stage !== 'planet-5') {
      setInvitationDetailsExpanded(false);
    }
  }, [stage]);

  const sceneLabel =
    stage === 'universe'
      ? 'Escena 01 • El Universo'
      : stage === 'planet-1'
        ? 'Escena 02 • El Pequeño Planeta'
        : stage === 'planet-5'
          ? 'Escena 05 • El Destino'
          : `Escena 04 • ${activePlanet.name}`;

  const flightMessage =
    stage === 'universe'
      ? 'Regresando a la vista del Universo...'
      : stage === 'planet-5'
        ? 'Llegando al Mundo de la Celebración de Christopher Gabriel...'
        : `Viajando hacia ${activePlanet.name}...`;

  const buildWhatsAppRsvpUrl = () => {
    const { rsvpPhone, rsvpMessage } = invitationConfig.eventDetails;
    const extraInfo = guestName.trim()
      ? `\nInvitado: ${guestName.trim()} (${guestCount})`
      : `\nAsistentes confirmados: ${guestCount}`;
    const fullText = encodeURIComponent(`${rsvpMessage}${extraInfo}`);
    return `https://wa.me/${rsvpPhone}?text=${fullText}`;
  };

  return (
    <div className="hud-root">
      {/* Decorative Shadow Box Paper Frame Vignette */}
      <div
        className={`shadowbox-frame-border ${
          stage === 'planet-5' ? 'is-golden-finale' : ''
        }`}
        aria-hidden="true"
      />

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
              return (
                <li
                  key={p.id}
                  className={`${isCurrent ? 'is-current-planet' : ''} is-selectable-planet`}
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

      {/* ESCENA 05 — PROGRESSIVE PROTAGONIST REVEAL BANNER IN THE SKY */}
      {stage === 'planet-5' && !isTransitioning && !invitationDetailsExpanded && (
        <section
          className="finale-sky-protagonist-reveal"
          aria-live="polite"
        >
          <span className="finale-star-crown">✦ El Destino de Nuestro Viaje ✦</span>
          <h2 className="finale-protagonist-name">
            {invitationConfig.protagonistName}
          </h2>
          <p className="finale-event-subtitle">{invitationConfig.eventTitle}</p>
        </section>
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
        onPointerDown={(e) => e.stopPropagation()}
        onPointerMove={(e) => e.stopPropagation()}
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
        ) : stage !== 'planet-5' ? (
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
                    ? 'Llegar al Destino'
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
        ) : !invitationDetailsExpanded ? (
          /* ESCENA 05 — MOMENTO 1: CONTEMPLACIÓN DEL PLANETA DORADO Y CITA DE CIERRE */
          <div className="storybook-card is-finale-intro-card">
            <div className="finale-date-pill">
              <Calendar size={14} />
              <span>{invitationConfig.eventDetails.date}</span>
            </div>

            <p className="storybook-quote">
              “{invitationConfig.closingQuote}”
            </p>

            <div className="storybook-actions storybook-actions-dual">
              <button
                type="button"
                className="btn-secondary-journey"
                onClick={onPrevStage}
              >
                <ArrowLeft size={16} />
                <span>Anterior</span>
              </button>

              <button
                type="button"
                className="btn-start-journey is-golden-pulse"
                onClick={() => setInvitationDetailsExpanded(true)}
              >
                <Sparkles size={16} />
                <span>Ver detalles de la invitación</span>
              </button>
            </div>

            <span className="parallax-hint">
              Toca el botón dorado para ver horarios, mapa y confirmar tu
              asistencia
            </span>
          </div>
        ) : (
          /* ESCENA 05 — MOMENTO 2: LIBRO DE INVITACIÓN PROGRESIVO (BAUTIZO, RECEPCIÓN, MAPS Y RSVP) */
          <div className="storybook-invitation-sheet">
            <div className="invitation-sheet-header">
              <div>
                <span className="sheet-kicker">
                  {invitationConfig.eventTitle}
                </span>
                <h3 className="sheet-protagonist">
                  {invitationConfig.protagonistName}
                </h3>
              </div>

              <button
                type="button"
                className="btn-minimize-sheet"
                onClick={() => setInvitationDetailsExpanded(false)}
                title="Contemplar el planeta"
              >
                <Eye size={15} />
                <span>Ver planeta</span>
              </button>
            </div>

            {/* Staggered Section 1: Date */}
            <div className="invitation-date-banner stagger-item-1">
              <Calendar size={16} />
              <strong>{invitationConfig.eventDetails.date}</strong>
            </div>

            {/* Staggered Section 2: Baptism & Reception Grid */}
            <div className="invitation-events-grid">
              {/* Ceremonia de Bautizo */}
              <article className="event-detail-box stagger-item-2">
                <div className="event-box-title">
                  <Church size={16} />
                  <span>Ceremonia de Bautizo</span>
                </div>
                <div className="event-time-row">
                  <Clock size={14} />
                  <strong>{invitationConfig.eventDetails.baptismTime}</strong>
                </div>
                <p className="event-place-name">
                  {invitationConfig.eventDetails.baptismPlace}
                </p>
                <p className="event-place-address">
                  {invitationConfig.eventDetails.baptismAddress}
                </p>
                <a
                  href={invitationConfig.eventDetails.baptismMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-maps-link"
                >
                  <MapPin size={14} />
                  <span>Ubicación en Google Maps</span>
                </a>
              </article>

              {/* Recepción y Primer Cumpleaños */}
              <article className="event-detail-box stagger-item-3">
                <div className="event-box-title">
                  <PartyPopper size={16} />
                  <span>Recepción y Celebración</span>
                </div>
                <div className="event-time-row">
                  <Clock size={14} />
                  <strong>{invitationConfig.eventDetails.receptionTime}</strong>
                </div>
                <p className="event-place-name">
                  {invitationConfig.eventDetails.receptionPlace}
                </p>
                <p className="event-place-address">
                  {invitationConfig.eventDetails.receptionAddress}
                </p>
                <a
                  href={invitationConfig.eventDetails.receptionMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-maps-link"
                >
                  <MapPin size={14} />
                  <span>Ubicación en Google Maps</span>
                </a>
              </article>
            </div>

            {/* Staggered Section 3: RSVP Confirmation via WhatsApp */}
            <div className="invitation-rsvp-box stagger-item-4">
              <div className="rsvp-inputs-row">
                <input
                  type="text"
                  className="rsvp-name-input"
                  placeholder="Tu nombre o familia (opcional)"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                />
                <select
                  className="rsvp-count-select"
                  value={guestCount}
                  onChange={(e) => setGuestCount(e.target.value)}
                  aria-label="Número de asistentes"
                >
                  <option value="1 persona">1 persona</option>
                  <option value="2 personas">2 personas</option>
                  <option value="3 personas">3 personas</option>
                  <option value="4 personas">4 personas</option>
                  <option value="Familia completa">Familia completa</option>
                </select>
              </div>

              <div className="rsvp-buttons-row">
                <button
                  type="button"
                  className="btn-secondary-journey"
                  onClick={() => onSelectStage('universe')}
                >
                  <RotateCcw size={15} />
                  <span>Reiniciar viaje</span>
                </button>

                <a
                  href={buildWhatsAppRsvpUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-whatsapp-rsvp"
                >
                  <MessageCircleHeart size={17} />
                  <span>Confirmar asistencia</span>
                </a>
              </div>
            </div>
          </div>
        )}
      </footer>
    </div>
  );
};
