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
  RotateCcw,
  Eye,
  Check,
  X,
  Users,
  UserPlus,
  Lock,
} from 'lucide-react';
import { invitationConfig } from '../config/invitationConfig';
import {
  SceneStage,
  getPlanetIndexForStage,
} from '../camera/ImmersiveCamera';
import {
  AttendanceStatus,
  FamilyGroup,
  GlobalInvitationSettings,
  InvitationMember,
  InvitationRecord,
  isModificationAllowed,
  submitGuestRsvp,
} from '../services/invitationService';

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
  invitation: InvitationRecord;
  familyInvitations: InvitationRecord[];
  familyGroup: FamilyGroup | null;
  settings: GlobalInvitationSettings;
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
  invitation,
  familyInvitations,
  familyGroup,
  settings,
}) => {
  const [showLegend, setShowLegend] = useState(false);
  const [invitationDetailsExpanded, setInvitationDetailsExpanded] =
    useState(false);

  // Local editable RSVP state initialized from the guest's InvitationRecord
  const [draftMembers, setDraftMembers] = useState<InvitationMember[]>(
    invitation.members
  );
  const [draftPlusCount, setDraftPlusCount] = useState<number>(
    invitation.selectedPlusOnesCount
  );
  const [draftPlusNames, setDraftPlusNames] = useState<string[]>(
    invitation.plusOneNames
  );
  const [draftNotes, setDraftNotes] = useState<string>(invitation.notes ?? '');
  const [savingRsvp, setSavingRsvp] = useState(false);
  const [rsvpError, setRsvpError] = useState('');
  const [rsvpSuccess, setRsvpSuccess] = useState('');

  useEffect(() => {
    setDraftMembers(invitation.members);
    setDraftPlusCount(invitation.selectedPlusOnesCount);
    setDraftPlusNames(
      Array.from(
        { length: invitation.maxPlusOnes },
        (_, i) => invitation.plusOneNames[i] ?? ''
      )
    );
    setDraftNotes(invitation.notes ?? '');
  }, [invitation]);

  const activePlanetIdx = getPlanetIndexForStage(stage);
  const activePlanet =
    invitationConfig.planets[activePlanetIdx] ?? invitationConfig.planets[0];

  useEffect(() => {
    if (stage !== 'planet-5') {
      setInvitationDetailsExpanded(false);
    }
  }, [stage]);

  const canModify = isModificationAllowed(settings.rsvpDeadline);
  const anyMemberAttending = draftMembers.some((m) => m.status === 'attending');

  const handleSetMemberStatus = (
    memberId: string,
    status: AttendanceStatus
  ) => {
    if (!canModify) return;
    setRsvpError('');
    setRsvpSuccess('');
    setDraftMembers((prev) =>
      prev.map((m) => (m.id === memberId ? { ...m, status } : m))
    );
  };

  const handlePlusCountChange = (count: number) => {
    if (!canModify) return;
    setRsvpError('');
    setRsvpSuccess('');
    setDraftPlusCount(count);
  };

  const handlePlusNameChange = (idx: number, value: string) => {
    if (!canModify) return;
    setRsvpError('');
    setRsvpSuccess('');
    setDraftPlusNames((prev) => {
      const next = [...prev];
      next[idx] = value;
      return next;
    });
  };

  const handleSaveRsvp = async (e: React.FormEvent) => {
    e.preventDefault();
    setRsvpError('');
    setRsvpSuccess('');

    // Ensure every titular member has chosen Sí asiste or No asiste
    const hasPending = draftMembers.some((m) => m.status === 'pending');
    if (hasPending) {
      setRsvpError(
        'Por favor selecciona "Sí asiste" o "No asiste" para cada persona.'
      );
      return;
    }

    setSavingRsvp(true);
    try {
      await submitGuestRsvp(invitation.id, {
        members: draftMembers,
        selectedPlusOnesCount: anyMemberAttending ? draftPlusCount : 0,
        plusOneNames: draftPlusNames,
        notes: draftNotes,
      });
      setRsvpSuccess(
        '¡Tu confirmación ha sido guardada! Puedes modificarla hasta la fecha límite.'
      );
    } catch (err) {
      setRsvpError(
        err instanceof Error
          ? err.message
          : 'Error al guardar la confirmación.'
      );
    } finally {
      setSavingRsvp(false);
    }
  };

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

  return (
    <div className="hud-root">
      {/* Decorative Shadow Box Paper Frame Vignette */}
      <div
        className={`shadowbox-frame-border ${
          stage === 'planet-5' ? 'is-golden-finale' : ''
        }`}
        aria-hidden="true"
      />

      {/* Top Bar: Title + Guest Badge + Audio & Motion Controls */}
      <header className="hud-header">
        <div className="hud-brand">
          <span className="hud-phase-pill">
            <Sparkles size={13} />
            <span>Para: {invitation.displayTitle}</span>
          </span>
          <h1 className="hud-project-title">
            {invitationConfig.projectTitle} • <small>{sceneLabel}</small>
          </h1>
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
        <aside
          className="hud-planet-legend"
          onPointerDown={(e) => e.stopPropagation()}
        >
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
          <span className="finale-star-crown">
            ✦ Invitación especial para {invitation.displayTitle} ✦
          </span>
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
            <span className="guest-welcome-tag">
              Bienvenidos • {invitation.displayTitle}
            </span>
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
                <span>Ver invitación y confirmar asistencia</span>
              </button>
            </div>

            <span className="parallax-hint">
              Toca el botón dorado para ver horarios, mapa y confirmar tu
              asistencia
            </span>
          </div>
        ) : (
          /* ESCENA 05 — MOMENTO 2: LIBRO DE INVITACIÓN PROGRESIVO + CONFIRMACIÓN INDIVIDUAL Y FAMILIAR */
          <div className="storybook-invitation-sheet">
            <div className="invitation-sheet-header">
              <div>
                <span className="sheet-kicker">
                  Invitación para: <strong>{invitation.displayTitle}</strong>
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

            {/* Staggered Section 3: Individual Member RSVP & Plus-Ones (+1/+2/+3) */}
            <form
              onSubmit={handleSaveRsvp}
              className="invitation-rsvp-box stagger-item-4"
            >
              <div className="rsvp-section-header">
                <h4>
                  Confirmación de Asistencia • {invitation.displayTitle}
                </h4>
                <span className="deadline-pill">
                  {canModify ? (
                    <>
                      Modificable hasta:{' '}
                      <strong>
                        {settings.rsvpDeadline.replace('T', ' ')}
                      </strong>
                    </>
                  ) : (
                    <>
                      <Lock size={12} /> Fecha límite de cambios concluida
                    </>
                  )}
                </span>
              </div>

              {/* List of individual members in this invitation (e.g. Juan & María in Esposos Picapiedra) */}
              <div className="rsvp-members-checklist">
                {draftMembers.map((member) => (
                  <div key={member.id} className="rsvp-member-row">
                    <span className="rsvp-member-name">{member.name}</span>

                    <div className="rsvp-member-toggle-group">
                      <button
                        type="button"
                        disabled={!canModify}
                        className={`btn-attendance-choice is-yes ${
                          member.status === 'attending' ? 'is-selected' : ''
                        }`}
                        onClick={() =>
                          handleSetMemberStatus(member.id, 'attending')
                        }
                      >
                        <Check size={14} />
                        <span>Sí asiste</span>
                      </button>

                      <button
                        type="button"
                        disabled={!canModify}
                        className={`btn-attendance-choice is-no ${
                          member.status === 'declined' ? 'is-selected' : ''
                        }`}
                        onClick={() =>
                          handleSetMemberStatus(member.id, 'declined')
                        }
                      >
                        <X size={14} />
                        <span>No asiste</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Plus-Ones (+1 / +2 / +3) Section: ONLY shown if maxPlusOnes > 0 AND at least one member attends */}
              {invitation.maxPlusOnes > 0 && anyMemberAttending && (
                <div className="rsvp-plusones-block">
                  <div className="plusones-selector-row">
                    <label>
                      <UserPlus size={15} />
                      <span>
                        Acompañantes adicionales (hasta +{invitation.maxPlusOnes}
                        ):
                      </span>
                    </label>
                    <select
                      disabled={!canModify}
                      value={draftPlusCount}
                      onChange={(e) =>
                        handlePlusCountChange(Number(e.target.value))
                      }
                      className="rsvp-count-select"
                    >
                      <option value={0}>Sin acompañantes adicionales (0)</option>
                      {Array.from(
                        { length: invitation.maxPlusOnes },
                        (_, idx) => idx + 1
                      ).map((num) => (
                        <option key={num} value={num}>
                          +{num}{' '}
                          {num === 1 ? 'acompañante' : 'acompañantes'}
                        </option>
                      ))}
                    </select>
                  </div>

                  {draftPlusCount > 0 && (
                    <div className="plusones-names-grid">
                      {Array.from(
                        { length: draftPlusCount },
                        (_, idx) => idx
                      ).map((idx) => (
                        <input
                          key={idx}
                          type="text"
                          disabled={!canModify}
                          className="rsvp-name-input"
                          placeholder={`Nombre completo del acompañante #${
                            idx + 1
                          } (obligatorio)`}
                          value={draftPlusNames[idx] ?? ''}
                          onChange={(e) =>
                            handlePlusNameChange(idx, e.target.value)
                          }
                          required
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Optional congratulations note */}
              <input
                type="text"
                disabled={!canModify}
                className="rsvp-name-input"
                placeholder="Mensaje o felicitación para Christopher Gabriel (opcional)"
                value={draftNotes}
                onChange={(e) => setDraftNotes(e.target.value)}
              />

              {rsvpError && <p className="rsvp-alert is-error">{rsvpError}</p>}
              {rsvpSuccess && (
                <p className="rsvp-alert is-success">{rsvpSuccess}</p>
              )}

              <div className="rsvp-buttons-row">
                <button
                  type="button"
                  className="btn-secondary-journey"
                  onClick={() => onSelectStage('universe')}
                >
                  <RotateCcw size={15} />
                  <span>Reiniciar viaje</span>
                </button>

                {canModify && (
                  <button
                    type="submit"
                    className="btn-whatsapp-rsvp"
                    disabled={savingRsvp}
                  >
                    <Check size={17} />
                    <span>
                      {savingRsvp
                        ? 'Guardando...'
                        : invitation.respondedAt
                          ? 'Actualizar confirmación'
                          : 'Guardar confirmación'}
                    </span>
                  </button>
                )}
              </div>
            </form>

            {/* Staggered Section 4: FAMILY GROUP STATUS (Visible ONLY if invitation belongs to a familyGroupId) */}
            {invitation.familyGroupId && familyInvitations.length > 1 && (
              <section className="family-visibility-box stagger-item-4">
                <div className="family-box-header">
                  <Users size={16} />
                  <h4>
                    Confirmaciones en tu familia
                    {familyGroup ? ` (${familyGroup.name})` : ''}
                  </h4>
                </div>
                <p className="family-box-sub">
                  Aquí puedes ver quiénes de tu familia ya confirmaron su
                  asistencia:
                </p>

                <div className="family-siblings-grid">
                  {familyInvitations.map((sib) => (
                    <div
                      key={sib.id}
                      className={`family-sibling-card ${
                        sib.id === invitation.id ? 'is-own-card' : ''
                      }`}
                    >
                      <div className="sibling-card-title">
                        <strong>{sib.displayTitle}</strong>
                        {sib.id === invitation.id && (
                          <span className="own-tag">Tu invitación</span>
                        )}
                      </div>

                      <ul className="sibling-members-list">
                        {sib.members.map((m) => (
                          <li key={m.id}>
                            <span>{m.name}</span>
                            <span className={`status-tag is-${m.status}`}>
                              {m.status === 'attending'
                                ? '✓ Asiste'
                                : m.status === 'declined'
                                  ? '✕ No asiste'
                                  : '⏳ Pendiente'}
                            </span>
                          </li>
                        ))}
                        {sib.selectedPlusOnesCount > 0 &&
                          sib.plusOneNames.map((pName, idx) => (
                            <li key={`plus-${idx}`} className="is-plus-guest">
                              <span>+ {pName} (Acompañante)</span>
                              <span className="status-tag is-attending">
                                ✓ Asiste
                              </span>
                            </li>
                          ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </footer>
    </div>
  );
};
