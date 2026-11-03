import React, { useState, useEffect, useMemo } from 'react';
import {
  Lock,
  Plus,
  Trash2,
  Copy,
  Check,
  ExternalLink,
  Users,
  UserPlus,
  Settings,
  Database,
  Calendar,
  Sparkles,
  Share2,
  Edit3,
  LogOut,
} from 'lucide-react';
import {
  FamilyGroup,
  GlobalInvitationSettings,
  InvitationMember,
  InvitationRecord,
  deleteFamilyGroup,
  deleteInvitationRecord,
  generateInvitationToken,
  seedPicapiedraExampleToDatabase,
  subscribeToDashboardData,
  updateGlobalSettings,
  upsertFamilyGroup,
  upsertInvitationRecord,
  verifyDashboardPin,
} from '../services/invitationService';
import {
  getFirebaseCredentials,
  isFirebaseConnected,
  saveRuntimeFirebaseCredentials,
} from '../config/firebaseConfig';
import { invitationConfig } from '../config/invitationConfig';

const SESSION_AUTH_KEY = 'cg_dashboard_unlocked_v1';

export const DashboardPage: React.FC = () => {
  const [unlocked, setUnlocked] = useState<boolean>(() => {
    return sessionStorage.getItem(SESSION_AUTH_KEY) === 'true';
  });
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [verifyingPin, setVerifyingPin] = useState(false);

  // Real-time Dashboard State
  const [settings, setSettings] = useState<GlobalInvitationSettings>({
    dashboardPin: '2026',
    rsvpDeadline: '2026-11-25T23:59',
    updatedAt: '',
  });
  const [families, setFamilies] = useState<FamilyGroup[]>([]);
  const [invitations, setInvitations] = useState<InvitationRecord[]>([]);
  const [activeTab, setActiveTab] = useState<
    'invitations' | 'families' | 'settings'
  >('invitations');
  const [familyFilter, setFamilyFilter] = useState<string>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Create / Edit Invitation Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [displayTitle, setDisplayTitle] = useState('');
  const [selectedFamilyId, setSelectedFamilyId] = useState<string>('');
  const [maxPlusOnes, setMaxPlusOnes] = useState<0 | 1 | 2 | 3>(0);
  const [customToken, setCustomToken] = useState('');
  const [memberNames, setMemberNames] = useState<string[]>(['']);
  const [formFeedback, setFormFeedback] = useState('');

  // Create Family Form State
  const [newFamilyName, setNewFamilyName] = useState('');

  // Settings Form State
  const [deadlineInput, setDeadlineInput] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [settingsSavedMsg, setSettingsSavedMsg] = useState('');

  // Firebase Runtime Credentials Form State
  const existingCreds = getFirebaseCredentials();
  const [fbApiKey, setFbApiKey] = useState(existingCreds?.apiKey ?? '');
  const [fbProjectId, setFbProjectId] = useState(
    existingCreds?.projectId ?? ''
  );
  const [fbAuthDomain, setFbAuthDomain] = useState(
    existingCreds?.authDomain ?? ''
  );
  const [fbAppId, setFbAppId] = useState(existingCreds?.appId ?? '');

  useEffect(() => {
    if (!unlocked) return;
    const unsub = subscribeToDashboardData((data) => {
      setSettings(data.settings);
      setDeadlineInput(data.settings.rsvpDeadline);
      setNewPinInput(data.settings.dashboardPin);
      setFamilies(data.families);
      setInvitations(data.invitations);
    });
    return () => unsub();
  }, [unlocked]);

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError('');
    setVerifyingPin(true);
    try {
      const ok = await verifyDashboardPin(pinInput);
      if (ok) {
        sessionStorage.setItem(SESSION_AUTH_KEY, 'true');
        setUnlocked(true);
      } else {
        setPinError('PIN incorrecto. Verifica el PIN en Firebase.');
      }
    } catch {
      setPinError('Error al verificar el PIN.');
    } finally {
      setVerifyingPin(false);
    }
  };

  // Summary metrics
  const stats = useMemo(() => {
    let totalMembers = 0;
    let attendingMembers = 0;
    let declinedMembers = 0;
    let pendingMembers = 0;
    let totalPlusOnesConfirmed = 0;

    invitations.forEach((inv) => {
      let anyAttending = false;
      inv.members.forEach((m) => {
        totalMembers++;
        if (m.status === 'attending') {
          attendingMembers++;
          anyAttending = true;
        } else if (m.status === 'declined') {
          declinedMembers++;
        } else {
          pendingMembers++;
        }
      });
      if (anyAttending && inv.selectedPlusOnesCount > 0) {
        totalPlusOnesConfirmed += inv.selectedPlusOnesCount;
      }
    });

    return {
      totalInvitations: invitations.length,
      totalMembers,
      attendingTotal: attendingMembers + totalPlusOnesConfirmed,
      attendingMembers,
      totalPlusOnesConfirmed,
      declinedMembers,
      pendingMembers,
    };
  }, [invitations]);

  const resetInvitationForm = () => {
    setEditingId(null);
    setDisplayTitle('');
    setSelectedFamilyId('');
    setMaxPlusOnes(0);
    setCustomToken('');
    setMemberNames(['']);
  };

  const handleLoadInvitationForEdit = (inv: InvitationRecord) => {
    setEditingId(inv.id);
    setDisplayTitle(inv.displayTitle);
    setSelectedFamilyId(inv.familyGroupId ?? '');
    setMaxPlusOnes(inv.maxPlusOnes);
    setCustomToken(inv.token);
    setMemberNames(inv.members.map((m) => m.name));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = displayTitle.trim();
    const cleanedNames = memberNames.map((n) => n.trim()).filter(Boolean);

    if (!cleanTitle) {
      setFormFeedback('Ingresa el título visible de la invitación (ej. Esposos Picapiedra).');
      return;
    }
    if (cleanedNames.length === 0) {
      setFormFeedback('Agrega al menos 1 persona titular en la invitación.');
      return;
    }

    const existing = editingId
      ? invitations.find((i) => i.id === editingId)
      : null;

    const finalToken =
      customToken.trim() ||
      existing?.token ||
      generateInvitationToken(cleanTitle);

    const members: InvitationMember[] = cleanedNames.map((name, idx) => {
      const prevMember = existing?.members[idx];
      return {
        id: prevMember?.id || `m-${Date.now()}-${idx}`,
        name,
        status: prevMember?.status || 'pending',
      };
    });

    const record: InvitationRecord = {
      id: existing?.id || `inv-${Date.now()}`,
      token: finalToken,
      displayTitle: cleanTitle,
      familyGroupId: selectedFamilyId || null,
      members,
      maxPlusOnes,
      selectedPlusOnesCount: existing?.selectedPlusOnesCount ?? 0,
      plusOneNames: existing?.plusOneNames ?? [],
      notes: existing?.notes ?? '',
      respondedAt: existing?.respondedAt ?? null,
      createdAt: existing?.createdAt || new Date().toISOString(),
    };

    await upsertInvitationRecord(record);
    setFormFeedback(
      editingId
        ? '¡Invitación actualizada correctamente!'
        : '¡Invitación creada correctamente!'
    );
    resetInvitationForm();
    setTimeout(() => setFormFeedback(''), 3000);
  };

  const handleCreateFamily = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFamilyName.trim()) return;
    const fam: FamilyGroup = {
      id: `fam-${Date.now()}`,
      name: newFamilyName.trim(),
      createdAt: new Date().toISOString(),
    };
    await upsertFamilyGroup(fam);
    setNewFamilyName('');
  };

  const handleSaveGlobalSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateGlobalSettings({
      rsvpDeadline: deadlineInput,
      dashboardPin: newPinInput.trim() || '2026',
    });
    setSettingsSavedMsg('Parámetros guardados en la base de datos.');
    setTimeout(() => setSettingsSavedMsg(''), 3000);
  };

  const handleSaveFirebaseCreds = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fbApiKey.trim() || !fbProjectId.trim()) {
      saveRuntimeFirebaseCredentials(null);
      window.location.reload();
      return;
    }
    saveRuntimeFirebaseCredentials({
      apiKey: fbApiKey.trim(),
      projectId: fbProjectId.trim(),
      authDomain:
        fbAuthDomain.trim() || `${fbProjectId.trim()}.firebaseapp.com`,
      appId: fbAppId.trim(),
    });
    window.location.reload();
  };

  const buildInvitationUrl = (token: string) => {
    return `${window.location.origin}/?t=${encodeURIComponent(token)}`;
  };

  const handleCopyLink = (inv: InvitationRecord) => {
    const url = buildInvitationUrl(inv.token);
    navigator.clipboard.writeText(url);
    setCopiedId(inv.id);
    setTimeout(() => setCopiedId(null), 2200);
  };

  const handleShareWhatsApp = (inv: InvitationRecord) => {
    const url = buildInvitationUrl(inv.token);
    const text = `✨ Hola *${inv.displayTitle}*, te compartimos tu invitación personal e interactiva para el Bautizo y Primer Cumpleaños de *${invitationConfig.protagonistName}*:\n\n👉 ${url}`;
    window.open(
      `https://wa.me/?text=${encodeURIComponent(text)}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  const filteredInvitations = useMemo(() => {
    if (familyFilter === 'ALL') return invitations;
    if (familyFilter === 'NONE')
      return invitations.filter((i) => !i.familyGroupId);
    return invitations.filter((i) => i.familyGroupId === familyFilter);
  }, [invitations, familyFilter]);

  // ==================== PIN LOCK SCREEN ====================
  if (!unlocked) {
    return (
      <div className="dashboard-pin-screen">
        <div className="dashboard-pin-card">
          <div className="pin-icon-badge">
            <Lock size={26} />
          </div>
          <h1>Panel de Invitaciones</h1>
          <p className="pin-subtitle">
            {invitationConfig.protagonistName} • /mi_dashboard
          </p>

          <form onSubmit={handlePinSubmit} className="pin-form">
            <label htmlFor="dashboard-pin-input">
              Ingresa el PIN de seguridad
            </label>
            <input
              id="dashboard-pin-input"
              type="password"
              inputMode="numeric"
              placeholder="••••"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              autoFocus
            />
            {pinError && <p className="pin-error-msg">{pinError}</p>}

            <button
              type="submit"
              className="btn-start-journey"
              disabled={verifyingPin}
            >
              <Sparkles size={16} />
              <span>{verifyingPin ? 'Verificando...' : 'Ingresar al Panel'}</span>
            </button>
          </form>
          <small className="pin-hint">
            PIN inicial por defecto en base de datos: <strong>2026</strong>
          </small>
        </div>
      </div>
    );
  }

  // ==================== UNLOCKED DASHBOARD ====================
  return (
    <div className="dashboard-page">
      <header className="dashboard-topbar">
        <div>
          <span className="dashboard-kicker">
            Administración • {invitationConfig.protagonistName}
          </span>
          <h1>Gestión de Invitaciones y Familias</h1>
        </div>

        <div className="dashboard-topbar-actions">
          <span
            className={`db-status-pill ${
              isFirebaseConnected() ? 'is-connected' : 'is-local'
            }`}
          >
            <Database size={14} />
            <span>
              {isFirebaseConnected()
                ? 'Firebase Firestore Conectado'
                : 'Modo Local / Demo (Configurable en Ajustes)'}
            </span>
          </span>

          <button
            type="button"
            className="btn-secondary-journey"
            onClick={() => {
              sessionStorage.removeItem(SESSION_AUTH_KEY);
              setUnlocked(false);
            }}
          >
            <LogOut size={15} />
            <span>Salir</span>
          </button>
        </div>
      </header>

      {/* Real-time KPI Metrics */}
      <section className="dashboard-stats-grid">
        <div className="stat-card">
          <span>Invitaciones (Tokens)</span>
          <strong>{stats.totalInvitations}</strong>
          <small>{families.length} familias registradas</small>
        </div>
        <div className="stat-card is-attending">
          <span>Total Confirmados (Asisten)</span>
          <strong>{stats.attendingTotal}</strong>
          <small>
            {stats.attendingMembers} titulares + {stats.totalPlusOnesConfirmed}{' '}
            acompañantes (+1/+2/+3)
          </small>
        </div>
        <div className="stat-card is-declined">
          <span>No Asisten</span>
          <strong>{stats.declinedMembers}</strong>
          <small>Confirmaron inasistencia</small>
        </div>
        <div className="stat-card is-pending">
          <span>Pendientes de Responder</span>
          <strong>{stats.pendingMembers}</strong>
          <small>Límite: {settings.rsvpDeadline.replace('T', ' ')}</small>
        </div>
      </section>

      {/* Navigation Tabs */}
      <nav className="dashboard-tabs">
        <button
          type="button"
          className={activeTab === 'invitations' ? 'is-active' : ''}
          onClick={() => setActiveTab('invitations')}
        >
          <UserPlus size={16} />
          <span>Invitaciones ({invitations.length})</span>
        </button>
        <button
          type="button"
          className={activeTab === 'families' ? 'is-active' : ''}
          onClick={() => setActiveTab('families')}
        >
          <Users size={16} />
          <span>Grupos Familiares ({families.length})</span>
        </button>
        <button
          type="button"
          className={activeTab === 'settings' ? 'is-active' : ''}
          onClick={() => setActiveTab('settings')}
        >
          <Settings size={16} />
          <span>Fecha Límite, PIN y Firebase</span>
        </button>
      </nav>

      {/* ==================== TAB 1: INVITATIONS ==================== */}
      {activeTab === 'invitations' && (
        <div className="dashboard-content-columns">
          {/* Left Column: Create / Edit Invitation Form */}
          <section className="dashboard-panel">
            <h2>
              {editingId ? 'Editar Invitación' : 'Nueva Invitación con Token'}
            </h2>
            <p className="panel-helper">
              Para papás/esposos pon el título (ej.{' '}
              <em>Esposos Picapiedra</em>) y agrega los nombres de ambos para
              que cada uno confirme su asistencia individual.
            </p>

            <form onSubmit={handleSaveInvitation} className="dashboard-form">
              <div className="form-group">
                <label>Título que dirá la invitación</label>
                <input
                  type="text"
                  placeholder="Ej. Esposos Picapiedra o Pedro Picapiedra"
                  value={displayTitle}
                  onChange={(e) => setDisplayTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>Grupo Familiar (para ver quiénes confirman)</label>
                  <select
                    value={selectedFamilyId}
                    onChange={(e) => setSelectedFamilyId(e.target.value)}
                  >
                    <option value="">Sin grupo familiar (Individual)</option>
                    {families.map((fam) => (
                      <option key={fam.id} value={fam.id}>
                        {fam.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Acompañantes extra permitidos (+1/+2/+3)</label>
                  <select
                    value={maxPlusOnes}
                    onChange={(e) =>
                      setMaxPlusOnes(Number(e.target.value) as 0 | 1 | 2 | 3)
                    }
                  >
                    <option value={0}>
                      Sin acompañantes (+0, solo titulares)
                    </option>
                    <option value={1}>Permitir +1 acompañante</option>
                    <option value={2}>Permitir hasta +2 acompañantes</option>
                    <option value={3}>Permitir hasta +3 acompañantes</option>
                  </select>
                </div>
              </div>

              {/* Members List inside this single invitation */}
              <div className="form-group">
                <label>
                  Nombres de las personas en esta invitación (selección
                  individual)
                </label>
                <div className="members-inputs-stack">
                  {memberNames.map((name, idx) => (
                    <div key={idx} className="member-input-row">
                      <input
                        type="text"
                        placeholder={`Nombre persona #${idx + 1} (ej. ${
                          idx === 0 ? 'Juan Picapiedra' : 'María Picapiedra'
                        })`}
                        value={name}
                        onChange={(e) => {
                          const copy = [...memberNames];
                          copy[idx] = e.target.value;
                          setMemberNames(copy);
                        }}
                        required
                      />
                      {memberNames.length > 1 && (
                        <button
                          type="button"
                          className="btn-icon-danger"
                          onClick={() =>
                            setMemberNames(
                              memberNames.filter((_, i) => i !== idx)
                            )
                          }
                          title="Quitar persona"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  className="btn-add-member-line"
                  onClick={() => setMemberNames([...memberNames, ''])}
                >
                  <Plus size={14} />
                  <span>
                    Agregar otra persona titular a esta misma invitación (ej.
                    Esposa/Esposo)
                  </span>
                </button>
              </div>

              <div className="form-group">
                <label>Token único (opcional, se autogenera si se deja vacío)</label>
                <input
                  type="text"
                  placeholder="Ej. esposos-picapiedra"
                  value={customToken}
                  onChange={(e) => setCustomToken(e.target.value)}
                />
              </div>

              {formFeedback && (
                <div className="form-feedback-banner">{formFeedback}</div>
              )}

              <div className="form-actions">
                {editingId && (
                  <button
                    type="button"
                    className="btn-secondary-journey"
                    onClick={resetInvitationForm}
                  >
                    Cancelar edición
                  </button>
                )}
                <button type="submit" className="btn-start-journey">
                  <Plus size={16} />
                  <span>
                    {editingId ? 'Guardar cambios' : 'Crear invitación'}
                  </span>
                </button>
              </div>
            </form>
          </section>

          {/* Right Column: Invitations List */}
          <section className="dashboard-panel">
            <div className="panel-header-with-filter">
              <h2>Invitaciones Generadas</h2>
              <select
                value={familyFilter}
                onChange={(e) => setFamilyFilter(e.target.value)}
                className="family-filter-select"
              >
                <option value="ALL">Todas las familias e individuales</option>
                <option value="NONE">Solo individuales sin familia</option>
                {families.map((fam) => (
                  <option key={fam.id} value={fam.id}>
                    {fam.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="invitations-cards-list">
              {filteredInvitations.map((inv) => {
                const famName = families.find(
                  (f) => f.id === inv.familyGroupId
                )?.name;
                return (
                  <article key={inv.id} className="inv-admin-card">
                    <div className="inv-admin-card-top">
                      <div>
                        <div className="inv-badges-row">
                          {famName ? (
                            <span className="badge-family">{famName}</span>
                          ) : (
                            <span className="badge-individual">Individual</span>
                          )}
                          <span className="badge-plus">
                            {inv.maxPlusOnes > 0
                              ? `Habilitado +${inv.maxPlusOnes}`
                              : 'Sin +1'}
                          </span>
                          <code className="badge-token">?t={inv.token}</code>
                        </div>
                        <h3>{inv.displayTitle}</h3>
                      </div>

                      <div className="inv-card-icon-actions">
                        <button
                          type="button"
                          onClick={() => handleLoadInvitationForEdit(inv)}
                          title="Editar invitación"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteInvitationRecord(inv.id)}
                          title="Eliminar invitación"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    {/* Individual Member Statuses */}
                    <div className="inv-members-status-list">
                      {inv.members.map((m) => (
                        <div key={m.id} className="member-status-pill-row">
                          <span>{m.name}</span>
                          <span className={`status-tag is-${m.status}`}>
                            {m.status === 'attending'
                              ? '✓ Sí asiste'
                              : m.status === 'declined'
                                ? '✕ No asiste'
                                : '⏳ Pendiente'}
                          </span>
                        </div>
                      ))}

                      {/* Plus-One Companions if selected */}
                      {inv.selectedPlusOnesCount > 0 &&
                        inv.plusOneNames.length > 0 && (
                          <div className="plus-ones-summary">
                            <strong>
                              Acompañantes confirmados (+
                              {inv.selectedPlusOnesCount}):
                            </strong>{' '}
                            {inv.plusOneNames.join(', ')}
                          </div>
                        )}
                    </div>

                    {/* Share & Preview Buttons */}
                    <div className="inv-share-actions-row">
                      <button
                        type="button"
                        className="btn-admin-action"
                        onClick={() => handleCopyLink(inv)}
                      >
                        {copiedId === inv.id ? (
                          <>
                            <Check size={14} />
                            <span>¡Copiado!</span>
                          </>
                        ) : (
                          <>
                            <Copy size={14} />
                            <span>Copiar link</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        className="btn-admin-action is-whatsapp"
                        onClick={() => handleShareWhatsApp(inv)}
                      >
                        <Share2 size={14} />
                        <span>WhatsApp</span>
                      </button>

                      <a
                        href={buildInvitationUrl(inv.token)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-admin-action"
                      >
                        <ExternalLink size={14} />
                        <span>Abrir</span>
                      </a>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        </div>
      )}

      {/* ==================== TAB 2: FAMILY GROUPS ==================== */}
      {activeTab === 'families' && (
        <section className="dashboard-panel">
          <h2>Grupos Familiares</h2>
          <p className="panel-helper">
            Las invitaciones que compartan el mismo Grupo Familiar podrán ver
            entre sí quiénes de su familia ya confirmaron asistencia (y nadie
            fuera de su familia podrá verlo).
          </p>

          <form onSubmit={handleCreateFamily} className="family-create-row">
            <input
              type="text"
              placeholder="Nombre de la familia (ej. Familia Picapiedra)"
              value={newFamilyName}
              onChange={(e) => setNewFamilyName(e.target.value)}
              required
            />
            <button type="submit" className="btn-start-journey">
              <Plus size={16} />
              <span>Crear Familia</span>
            </button>
          </form>

          <div className="families-list-grid">
            {families.map((fam) => {
              const famInvs = invitations.filter(
                (i) => i.familyGroupId === fam.id
              );
              return (
                <div key={fam.id} className="family-admin-card">
                  <div>
                    <h3>{fam.name}</h3>
                    <small>
                      {famInvs.length} invitaciones vinculadas a esta familia
                    </small>
                  </div>
                  <button
                    type="button"
                    className="btn-icon-danger"
                    onClick={() => deleteFamilyGroup(fam.id)}
                    title="Eliminar grupo familiar"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ==================== TAB 3: SETTINGS & FIREBASE ==================== */}
      {activeTab === 'settings' && (
        <div className="dashboard-content-columns">
          <section className="dashboard-panel">
            <h2>Parámetros Variables (Fecha Límite y PIN)</h2>
            <form onSubmit={handleSaveGlobalSettings} className="dashboard-form">
              <div className="form-group">
                <label>
                  <Calendar size={15} /> Fecha y hora límite para modificar
                  invitaciones
                </label>
                <input
                  type="datetime-local"
                  value={deadlineInput}
                  onChange={(e) => setDeadlineInput(e.target.value)}
                  required
                />
                <small>
                  Los invitados podrán entrar a su token y cambiar su
                  confirmación hasta esta fecha.
                </small>
              </div>

              <div className="form-group">
                <label>
                  <Lock size={15} /> PIN de acceso a /mi_dashboard (guardado en
                  Firebase)
                </label>
                <input
                  type="text"
                  value={newPinInput}
                  onChange={(e) => setNewPinInput(e.target.value)}
                  required
                />
              </div>

              {settingsSavedMsg && (
                <div className="form-feedback-banner">{settingsSavedMsg}</div>
              )}

              <button type="submit" className="btn-start-journey">
                Guardar parámetros en base de datos
              </button>
            </form>

            <hr className="panel-divider" />

            <h3>Datos de Ejemplo (Familia Picapiedra)</h3>
            <p className="panel-helper">
              Restaura o sube a Firebase el ejemplo completo de la{' '}
              <strong>Familia Picapiedra</strong> (4 invitaciones: Esposos
              Picapiedra con Juan y María + 3 hijos + 1 invitado individual con
              +3).
            </p>
            <button
              type="button"
              className="btn-secondary-journey"
              onClick={async () => {
                await seedPicapiedraExampleToDatabase();
                alert(
                  '¡Ejemplo de la Familia Picapiedra cargado en la base de datos!'
                );
              }}
            >
              Cargar ejemplo Familia Picapiedra
            </button>
          </section>

          <section className="dashboard-panel">
            <h2>Conexión a Firebase (Cloud Firestore)</h2>
            <p className="panel-helper">
              Puedes colocar tus credenciales en el archivo <code>.env</code>{' '}
              (variables <code>VITE_FIREBASE_*</code>) o pegarlas directamente
              aquí para conectar este navegador a tu proyecto de Firebase:
            </p>

            <form onSubmit={handleSaveFirebaseCreds} className="dashboard-form">
              <div className="form-group">
                <label>Firebase apiKey</label>
                <input
                  type="text"
                  placeholder="AIzaSy..."
                  value={fbApiKey}
                  onChange={(e) => setFbApiKey(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Firebase projectId</label>
                <input
                  type="text"
                  placeholder="mi-proyecto-firebase"
                  value={fbProjectId}
                  onChange={(e) => setFbProjectId(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Firebase authDomain (opcional)</label>
                <input
                  type="text"
                  placeholder="mi-proyecto.firebaseapp.com"
                  value={fbAuthDomain}
                  onChange={(e) => setFbAuthDomain(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Firebase appId (opcional)</label>
                <input
                  type="text"
                  placeholder="1:123456:web:abcdef"
                  value={fbAppId}
                  onChange={(e) => setFbAppId(e.target.value)}
                />
              </div>

              <button type="submit" className="btn-start-journey">
                <Database size={16} />
                <span>Guardar credenciales Firebase y reconectar</span>
              </button>
            </form>
          </section>
        </div>
      )}
    </div>
  );
};
