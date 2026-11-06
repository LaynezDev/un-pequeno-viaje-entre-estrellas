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
  Phone,
  Table,
  ClipboardList,
  Search,
  MessageCircle,
  AlertTriangle,
  X,
  UserCheck,
  CheckCircle2,
  XCircle,
  Clock,
  FileSpreadsheet,
} from 'lucide-react';
import {
  AttendanceStatus,
  EventTable,
  FamilyGroup,
  FirestoreInitStatus,
  GlobalInvitationSettings,
  InvitationMember,
  InvitationRecord,
  assignInvitationToTable,
  calculateTableOccupancy,
  deleteFamilyGroup,
  deleteInvitationRecord,
  deleteTable,
  generateInvitationToken,
  initializeFirestoreSettings,
  seedPicapiedraExampleToDatabase,
  subscribeToDashboardData,
  updateGlobalSettings,
  updateInvitationPhone,
  updatePersonPhone,
  upsertFamilyGroup,
  upsertInvitationRecord,
  upsertTable,
  verifyDashboardPin,
} from '../services/invitationService';
import {
  getFirebaseCredentials,
  isFirebaseConnected,
  saveRuntimeFirebaseCredentials,
} from '../config/firebaseConfig';
import { invitationConfig } from '../config/invitationConfig';

const SESSION_AUTH_KEY = 'cg_dashboard_unlocked_v1';

interface FlattenedGuest {
  uniqueId: string;
  name: string;
  isPlusOne: boolean;
  memberId?: string;
  plusOneIndex?: number;
  status: AttendanceStatus;
  invitationId: string;
  invitationTitle: string;
  token: string;
  phone?: string;
  tableId?: string | null;
  familyGroupId?: string | null;
  familyName?: string;
}

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
  const [tables, setTables] = useState<EventTable[]>([]);
  const [activeTab, setActiveTab] = useState<
    'guests' | 'tables' | 'invitations' | 'families' | 'settings'
  >('guests');

  const [copiedId, setCopiedId] = useState<string | null>(null);

  // ==================== LISTA GENERAL DE INVITADOS FILTROS ====================
  const [guestSearch, setGuestSearch] = useState('');
  const [guestStatusFilter, setGuestStatusFilter] = useState<
    'ALL' | 'attending' | 'declined' | 'pending'
  >('ALL');
  const [guestTableFilter, setGuestTableFilter] = useState<string>('ALL');
  const [guestFamilyFilter, setGuestFamilyFilter] = useState<string>('ALL');
  const [guestViewMode, setGuestViewMode] = useState<
    'by-person' | 'by-invitation' | 'by-family'
  >('by-person');

  // Quick Inline Phone Editing for a specific person
  const [quickPhoneGuestId, setQuickPhoneGuestId] = useState<string | null>(null);
  const [quickPhoneValue, setQuickPhoneValue] = useState('');

  // ==================== FORMULARIO DE INVITACIONES ====================
  const [editingId, setEditingId] = useState<string | null>(null);
  const [displayTitle, setDisplayTitle] = useState('');
  const [selectedFamilyId, setSelectedFamilyId] = useState<string>('');
  const [maxPlusOnes, setMaxPlusOnes] = useState<0 | 1 | 2 | 3>(0);
  const [customToken, setCustomToken] = useState('');
  const [memberNames, setMemberNames] = useState<string[]>(['']);
  const [memberPhones, setMemberPhones] = useState<string[]>(['']);
  const [invPhone, setInvPhone] = useState('');
  const [invTableId, setInvTableId] = useState<string>('');
  const [formFeedback, setFormFeedback] = useState('');

  // ==================== FORMULARIO DE MESAS ====================
  const [editingTableId, setEditingTableId] = useState<string | null>(null);
  const [tableName, setTableName] = useState('');
  const [tableCapacity, setTableCapacity] = useState<number>(8);
  const [tableNotes, setTableNotes] = useState('');
  const [tableFormFeedback, setTableFormFeedback] = useState('');

  // ==================== FORMULARIO DE FAMILIAS ====================
  const [newFamilyName, setNewFamilyName] = useState('');

  // ==================== SETTINGS & FIREBASE ====================
  const [deadlineInput, setDeadlineInput] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [settingsSavedMsg, setSettingsSavedMsg] = useState('');

  const existingCreds = getFirebaseCredentials();
  const [fbApiKey, setFbApiKey] = useState(existingCreds?.apiKey ?? '');
  const [fbProjectId, setFbProjectId] = useState(
    existingCreds?.projectId ?? ''
  );
  const [fbAuthDomain, setFbAuthDomain] = useState(
    existingCreds?.authDomain ?? ''
  );
  const [fbAppId, setFbAppId] = useState(existingCreds?.appId ?? '');
  const [firestoreInit, setFirestoreInit] =
    useState<FirestoreInitStatus | null>(null);

  // Immediately initialize settings/general (PIN & deadline) in Firestore on page load
  useEffect(() => {
    void initializeFirestoreSettings().then((res) => {
      setFirestoreInit(res);
    });
  }, []);

  useEffect(() => {
    if (!unlocked) return;
    const unsub = subscribeToDashboardData((data) => {
      setSettings(data.settings);
      setDeadlineInput(data.settings.rsvpDeadline);
      setNewPinInput(data.settings.dashboardPin);
      setFamilies(data.families);
      setInvitations(data.invitations);
      setTables(data.tables);
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

  // ==================== RESUMEN Y MÉTRICAS CALCULADAS ====================
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

    const attendingTotal = attendingMembers + totalPlusOnesConfirmed;
    const totalPeople = totalMembers + totalPlusOnesConfirmed;

    // Calcular cuántas personas que asisten ya tienen mesa asignada
    let attendingWithTable = 0;
    invitations.forEach((inv) => {
      if (inv.tableId) {
        const attMembers = inv.members.filter((m) => m.status === 'attending').length;
        const plus = attMembers > 0 ? inv.selectedPlusOnesCount : 0;
        attendingWithTable += attMembers + plus;
      }
    });

    return {
      totalInvitations: invitations.length,
      totalMembers,
      totalPeople,
      attendingTotal,
      attendingMembers,
      totalPlusOnesConfirmed,
      declinedMembers,
      pendingMembers,
      attendingWithTable,
      attendingWithoutTable: Math.max(0, attendingTotal - attendingWithTable),
    };
  }, [invitations]);

  // Métricas generales de mesas
  const tableMetrics = useMemo(() => {
    let totalSalonCapacity = 0;
    let totalSeatsOccupied = 0;
    let overcapacityTablesCount = 0;
    let fullTablesCount = 0;

    tables.forEach((tbl) => {
      totalSalonCapacity += tbl.capacity;
      const occ = calculateTableOccupancy(tbl.id, tbl.capacity, invitations);
      totalSeatsOccupied += occ.confirmedCount;
      if (occ.isOverCapacity) overcapacityTablesCount++;
      else if (occ.confirmedCount >= tbl.capacity) fullTablesCount++;
    });

    const totalSeatsAvailable = Math.max(0, totalSalonCapacity - totalSeatsOccupied);

    return {
      totalTables: tables.length,
      totalSalonCapacity,
      totalSeatsOccupied,
      totalSeatsAvailable,
      overcapacityTablesCount,
      fullTablesCount,
    };
  }, [tables, invitations]);

  // Lista plana de personas individuales para la tabla nominal
  const flattenedGuests = useMemo<FlattenedGuest[]>(() => {
    const list: FlattenedGuest[] = [];

    invitations.forEach((inv) => {
      const famName = families.find((f) => f.id === inv.familyGroupId)?.name;

      // Titulares de la invitación
      inv.members.forEach((m, idx) => {
        list.push({
          uniqueId: `mem-${inv.id}-${m.id || idx}`,
          name: m.name,
          isPlusOne: false,
          memberId: m.id,
          status: m.status,
          invitationId: inv.id,
          invitationTitle: inv.displayTitle,
          token: inv.token,
          phone: m.phone || (inv.members.length === 1 ? inv.phone : ''),
          tableId: inv.tableId,
          familyGroupId: inv.familyGroupId,
          familyName: famName,
        });
      });

      // Acompañantes confirmados (+1, +2, +3) si algún titular asiste
      const anyAttending = inv.members.some((m) => m.status === 'attending');
      if (anyAttending && inv.selectedPlusOnesCount > 0 && inv.plusOneNames.length > 0) {
        inv.plusOneNames.forEach((plusName, pIdx) => {
          list.push({
            uniqueId: `plus-${inv.id}-${pIdx}`,
            name: plusName,
            isPlusOne: true,
            plusOneIndex: pIdx,
            status: 'attending',
            invitationId: inv.id,
            invitationTitle: inv.displayTitle,
            token: inv.token,
            phone: inv.companionPhones?.[pIdx] || '',
            tableId: inv.tableId,
            familyGroupId: inv.familyGroupId,
            familyName: famName,
          });
        });
      }
    });

    return list;
  }, [invitations, families]);

  // Filtro de invitados para la tabla
  const filteredGuests = useMemo(() => {
    return flattenedGuests.filter((g) => {
      // Búsqueda por texto (nombre, invitación, teléfono, familia)
      if (guestSearch.trim()) {
        const query = guestSearch.toLowerCase().trim();
        const matchName = g.name.toLowerCase().includes(query);
        const matchTitle = g.invitationTitle.toLowerCase().includes(query);
        const matchPhone = (g.phone || '').toLowerCase().includes(query);
        const matchFam = (g.familyName || '').toLowerCase().includes(query);
        if (!matchName && !matchTitle && !matchPhone && !matchFam) {
          return false;
        }
      }

      // Filtro de estado
      if (guestStatusFilter !== 'ALL' && g.status !== guestStatusFilter) {
        return false;
      }

      // Filtro de mesa
      if (guestTableFilter === 'WITH_TABLE' && !g.tableId) return false;
      if (guestTableFilter === 'WITHOUT_TABLE' && g.tableId) return false;
      if (
        guestTableFilter !== 'ALL' &&
        guestTableFilter !== 'WITH_TABLE' &&
        guestTableFilter !== 'WITHOUT_TABLE' &&
        g.tableId !== guestTableFilter
      ) {
        return false;
      }

      // Filtro de familia
      if (guestFamilyFilter !== 'ALL') {
        if (guestFamilyFilter === 'NONE' && g.familyGroupId) return false;
        if (guestFamilyFilter !== 'NONE' && g.familyGroupId !== guestFamilyFilter) {
          return false;
        }
      }

      return true;
    });
  }, [
    flattenedGuests,
    guestSearch,
    guestStatusFilter,
    guestTableFilter,
    guestFamilyFilter,
  ]);

  // ==================== HELPERS PARA WHATSAPP Y ENLACES ====================
  const buildInvitationUrl = (token: string) => {
    return `${window.location.origin}/?t=${encodeURIComponent(token)}`;
  };

  const cleanPhoneNumber = (raw?: string): string => {
    if (!raw) return '';
    return raw.replace(/[^0-9]/g, '');
  };

  const handleShareWhatsApp = (inv: InvitationRecord, personPhone?: string) => {
    const url = buildInvitationUrl(inv.token);
    const text = `✨ Hola *${inv.displayTitle}*, te compartimos tu invitación personal e interactiva para el Bautizo y Primer Cumpleaños de *${invitationConfig.protagonistName}*:\n\n👉 ${url}`;
    const phoneToUse = personPhone || inv.phone;
    const cleanPhone = cleanPhoneNumber(phoneToUse);

    let waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    if (cleanPhone.length >= 8) {
      waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
    }
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  const handleCopyLink = (inv: InvitationRecord) => {
    const url = buildInvitationUrl(inv.token);
    navigator.clipboard.writeText(url);
    setCopiedId(inv.id);
    setTimeout(() => setCopiedId(null), 2200);
  };

  // ==================== EXPORTAR LISTA A CSV ====================
  const handleExportCsv = () => {
    const headers = [
      'Invitado / Nombre',
      'Tipo',
      'Estado Asistencia',
      'Teléfono / WhatsApp',
      'Mesa Asignada',
      'Invitación',
      'Grupo Familiar',
      'Enlace con Token',
    ];

    const rows = filteredGuests.map((g) => {
      const tableName =
        tables.find((t) => t.id === g.tableId)?.name || 'Sin mesa asignada';
      const statusLabel =
        g.status === 'attending'
          ? 'Asiste'
          : g.status === 'declined'
          ? 'No asiste'
          : 'Pendiente';
      const typeLabel = g.isPlusOne ? 'Acompañante (+1)' : 'Titular';
      const invUrl = buildInvitationUrl(g.token);

      return [
        `"${g.name.replace(/"/g, '""')}"`,
        `"${typeLabel}"`,
        `"${statusLabel}"`,
        `"${(g.phone || '').replace(/"/g, '""')}"`,
        `"${tableName.replace(/"/g, '""')}"`,
        `"${g.invitationTitle.replace(/"/g, '""')}"`,
        `"${(g.familyName || 'Sin Familia').replace(/"/g, '""')}"`,
        `"${invUrl}"`,
      ];
    });

    const csvContent =
      '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const dateStr = new Date().toISOString().slice(0, 10);
    link.setAttribute('download', `lista_invitados_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // ==================== ASIGNACIÓN RÁPIDA DE MESA CON VALIDACIÓN DE CUPO ====================
  const handleQuickAssignTable = async (
    invitationId: string,
    targetTableId: string | null
  ) => {
    const inv = invitations.find((i) => i.id === invitationId);
    if (!inv) return;

    if (!targetTableId) {
      await assignInvitationToTable(invitationId, null);
      return;
    }

    const targetTable = tables.find((t) => t.id === targetTableId);
    if (!targetTable) return;

    // Calcular cuántos asientos requiere esta invitación
    const attendingCount = inv.members.filter((m) => m.status === 'attending').length;
    const requiredSeats =
      attendingCount > 0 ? attendingCount + inv.selectedPlusOnesCount : inv.members.length;

    // Calcular ocupación actual excluyendo esta misma invitación
    const currentOccupancy = calculateTableOccupancy(
      targetTable.id,
      targetTable.capacity,
      invitations.filter((i) => i.id !== invitationId)
    );

    const availableSeats = Math.max(0, targetTable.capacity - currentOccupancy.confirmedCount);

    if (requiredSeats > availableSeats) {
      const confirmMsg = `⚠️ Advertencia de Capacidad:\n\nLa mesa "${targetTable.name}" tiene capacidad para ${targetTable.capacity} personas y solo le quedan ${availableSeats} asientos libres.\nEsta invitación requiere ${requiredSeats} asientos.\n\nSi la asignas, la mesa quedará con sobrecupo (${currentOccupancy.confirmedCount + requiredSeats}/${targetTable.capacity}).\n\n¿Deseas asignarla de todas formas?`;
      if (!window.confirm(confirmMsg)) {
        return;
      }
    }

    await assignInvitationToTable(invitationId, targetTableId);
  };

  // ==================== GUARDAR TELÉFONO RÁPIDO INDIVIDUAL POR PERSONA ====================
  const handleSaveQuickPersonPhone = async (guest: FlattenedGuest) => {
    await updatePersonPhone(
      guest.invitationId,
      { memberId: guest.memberId, plusOneIndex: guest.plusOneIndex },
      quickPhoneValue
    );
    setQuickPhoneGuestId(null);
    setQuickPhoneValue('');
  };

  // ==================== GESTIÓN DE MESAS (CRUD) ====================
  const resetTableForm = () => {
    setEditingTableId(null);
    setTableName('');
    setTableCapacity(8);
    setTableNotes('');
    setTableFormFeedback('');
  };

  const handleEditTable = (table: EventTable) => {
    setEditingTableId(table.id);
    setTableName(table.name);
    setTableCapacity(table.capacity);
    setTableNotes(table.notes || '');
    setActiveTab('tables');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveTable = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = tableName.trim();
    if (!cleanName) {
      setTableFormFeedback('Por favor ingresa un nombre para la mesa.');
      return;
    }
    const cap = Math.max(1, Number(tableCapacity) || 8);

    const record: EventTable = {
      id: editingTableId || `tbl-${Date.now()}`,
      name: cleanName,
      capacity: cap,
      notes: tableNotes.trim(),
      createdAt: new Date().toISOString(),
    };

    await upsertTable(record);
    setTableFormFeedback(
      editingTableId ? '¡Mesa actualizada correctamente!' : '¡Mesa creada correctamente!'
    );
    resetTableForm();
    setTimeout(() => setTableFormFeedback(''), 3000);
  };

  const handleDeleteTable = async (table: EventTable) => {
    const assignedCount = invitations.filter((i) => i.tableId === table.id).length;
    const confirmMsg =
      assignedCount > 0
        ? `¿Eliminar "${table.name}"? Hay ${assignedCount} invitaciones asignadas a esta mesa que quedarán sin mesa.`
        : `¿Eliminar la mesa "${table.name}"?`;
    if (window.confirm(confirmMsg)) {
      await deleteTable(table.id);
    }
  };

  // ==================== GESTIÓN DE INVITACIONES (CRUD) ====================
  const resetInvitationForm = () => {
    setEditingId(null);
    setDisplayTitle('');
    setSelectedFamilyId('');
    setMaxPlusOnes(0);
    setCustomToken('');
    setMemberNames(['']);
    setMemberPhones(['']);
    setInvPhone('');
    setInvTableId('');
    setFormFeedback('');
  };

  const handleLoadInvitationForEdit = (inv: InvitationRecord) => {
    setEditingId(inv.id);
    setDisplayTitle(inv.displayTitle);
    setSelectedFamilyId(inv.familyGroupId ?? '');
    setMaxPlusOnes(inv.maxPlusOnes);
    setCustomToken(inv.token);
    setMemberNames(inv.members.map((m) => m.name));
    setMemberPhones(inv.members.map((m) => m.phone || ''));
    setInvPhone(inv.phone || '');
    setInvTableId(inv.tableId || '');
    setActiveTab('invitations');
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

    // Validar capacidad de mesa si se asignó una
    if (invTableId) {
      const targetTable = tables.find((t) => t.id === invTableId);
      if (targetTable) {
        const occ = calculateTableOccupancy(
          targetTable.id,
          targetTable.capacity,
          invitations.filter((i) => i.id !== editingId)
        );
        const reqSeats = cleanedNames.length;
        if (reqSeats > targetTable.capacity - occ.confirmedCount) {
          const proceed = window.confirm(
            `⚠️ La mesa "${targetTable.name}" solo tiene ${Math.max(
              0,
              targetTable.capacity - occ.confirmedCount
            )} asientos libres y esta invitación tiene ${reqSeats} titulares. ¿Deseas asignarla de todas formas?`
          );
          if (!proceed) return;
        }
      }
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
      const assignedPhone = memberPhones[idx]?.trim() || prevMember?.phone || '';
      return {
        id: prevMember?.id || `m-${Date.now()}-${idx}`,
        name,
        status: prevMember?.status || 'pending',
        phone: assignedPhone || undefined,
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
      companionPhones: existing?.companionPhones ?? [],
      notes: existing?.notes ?? '',
      phone: invPhone.trim() || members[0]?.phone || '',
      tableId: invTableId || null,
      respondedAt: existing?.respondedAt ?? null,
      createdAt: existing?.createdAt || new Date().toISOString(),
    };

    await upsertInvitationRecord(record);
    setFormFeedback(
      editingId ? '¡Invitación actualizada correctamente!' : '¡Invitación creada correctamente!'
    );
    resetInvitationForm();
    setTimeout(() => setFormFeedback(''), 3000);
  };

  // ==================== GESTIÓN DE FAMILIAS ====================
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

  // ==================== SETTINGS & CREDENCIALES ====================
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
      authDomain: fbAuthDomain.trim() || `${fbProjectId.trim()}.firebaseapp.com`,
      appId: fbAppId.trim(),
    });
    window.location.reload();
  };

  // ==================== PANTALLA DE BLOQUEO POR PIN ====================
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
            <label htmlFor="dashboard-pin-input">Ingresa el PIN de seguridad</label>
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

            <button type="submit" className="btn-start-journey" disabled={verifyingPin}>
              <Sparkles size={16} />
              <span>{verifyingPin ? 'Verificando...' : 'Ingresar al Panel'}</span>
            </button>
          </form>
          <small className="pin-hint">
            PIN inicial por defecto en base de datos: <strong>2026</strong>
          </small>

          {firestoreInit?.status === 'connected' && (
            <small
              className="pin-hint"
              style={{
                display: 'block',
                marginTop: '0.6rem',
                color: '#7ed9a6',
              }}
            >
              ✓ Conectado a Firestore ({firestoreInit.projectId}) •{' '}
              <code>settings/general</code> activo
            </small>
          )}

          {firestoreInit?.status === 'permission-denied' && (
            <div
              style={{
                marginTop: '0.85rem',
                padding: '0.75rem',
                borderRadius: '10px',
                background: 'rgba(232, 111, 124, 0.14)',
                border: '1px solid rgba(232, 111, 124, 0.4)',
                fontSize: '0.78rem',
                color: '#ffd6db',
                textAlign: 'left',
              }}
            >
              <strong>⚠️ Reglas de Firestore bloqueadas:</strong> Ve a Firebase
              Console → <em>Firestore Database → Reglas</em> y actualiza las reglas
              para permitir leer y escribir en <code>settings</code>, <code>families</code>,{' '}
              <code>invitations</code> y <code>tables</code>.
            </div>
          )}

          {firestoreInit?.status === 'local-only' && (
            <small
              className="pin-hint"
              style={{
                display: 'block',
                marginTop: '0.6rem',
                color: '#f3c677',
              }}
            >
              ℹ️ Ingresa con <strong>2026</strong> y ve a la pestaña{' '}
              <strong>Parámetros y Firebase</strong> para vincular tu Firestore.
            </small>
          )}
        </div>
      </div>
    );
  }

  // ==================== PANEL DESBLOQUEADO ====================
  return (
    <div className="dashboard-page">
      <header className="dashboard-topbar">
        <div>
          <span className="dashboard-kicker">
            Administración • {invitationConfig.protagonistName}
          </span>
          <h1>Panel de Invitados, Mesas y Asistencias</h1>
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
                : 'Modo Local / Demo'}
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

      {/* Real-time KPI Metrics Grid */}
      <section className="dashboard-stats-grid">
        <div className="stat-card">
          <span>Total Personas Registradas</span>
          <strong>{stats.totalPeople}</strong>
          <small>{stats.totalInvitations} invitaciones / tokens</small>
        </div>
        <div className="stat-card is-attending">
          <span>Confirmados que Asisten</span>
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
          className={activeTab === 'guests' ? 'is-active' : ''}
          onClick={() => setActiveTab('guests')}
        >
          <ClipboardList size={16} />
          <span>Lista General de Invitados ({flattenedGuests.length})</span>
        </button>

        <button
          type="button"
          className={activeTab === 'tables' ? 'is-active' : ''}
          onClick={() => setActiveTab('tables')}
        >
          <Table size={16} />
          <span>Mesas y Asientos ({tables.length})</span>
        </button>

        <button
          type="button"
          className={activeTab === 'invitations' ? 'is-active' : ''}
          onClick={() => setActiveTab('invitations')}
        >
          <UserPlus size={16} />
          <span>Invitaciones / Tokens ({invitations.length})</span>
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
          <span>Parámetros y Firebase</span>
        </button>
      </nav>

      {/* ============================================================ */}
      {/* ==================== TAB 1: LISTA GENERAL =================== */}
      {/* ============================================================ */}
      {activeTab === 'guests' && (
        <section className="dashboard-panel">
          <div className="guests-overview-header">
            <div>
              <h2>Lista General de Invitados</h2>
              <p className="panel-helper" style={{ marginBottom: 0 }}>
                Control detallado de cada persona, teléfono individual, estado de confirmación y asignación de mesa.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              {/* Botón Exportar CSV */}
              <button
                type="button"
                className="btn-export-csv"
                onClick={handleExportCsv}
                title="Descargar lista completa en formato Excel / CSV"
              >
                <FileSpreadsheet size={15} />
                <span>Exportar CSV ({filteredGuests.length})</span>
              </button>

              {/* Selector de modo de vista: Por Persona / Por Invitación / Por Familia */}
              <div className="view-mode-toggle">
                <button
                  type="button"
                  className={guestViewMode === 'by-person' ? 'is-active' : ''}
                  onClick={() => setGuestViewMode('by-person')}
                >
                  Por Persona ({flattenedGuests.length})
                </button>
                <button
                  type="button"
                  className={guestViewMode === 'by-invitation' ? 'is-active' : ''}
                  onClick={() => setGuestViewMode('by-invitation')}
                >
                  Por Invitación ({invitations.length})
                </button>
                <button
                  type="button"
                  className={guestViewMode === 'by-family' ? 'is-active' : ''}
                  onClick={() => setGuestViewMode('by-family')}
                >
                  Por Familia ({families.length})
                </button>
              </div>
            </div>
          </div>

          {/* KPI Pills de estado de mesas y confirmaciones */}
          <div className="guests-kpi-bar">
            <span className="guest-kpi-pill is-attending">
              <CheckCircle2 size={14} />
              <span>Asisten:</span> <strong>{stats.attendingTotal}</strong>
            </span>
            <span className="guest-kpi-pill is-declined">
              <XCircle size={14} />
              <span>No Asisten:</span> <strong>{stats.declinedMembers}</strong>
            </span>
            <span className="guest-kpi-pill is-pending">
              <Clock size={14} />
              <span>Pendientes:</span> <strong>{stats.pendingMembers}</strong>
            </span>
            <span className="guest-kpi-pill is-tabled">
              <Table size={14} />
              <span>Con Mesa Asignada:</span> <strong>{stats.attendingWithTable}</strong>
            </span>
            {stats.attendingWithoutTable > 0 && (
              <span
                className="guest-kpi-pill"
                style={{ background: '#fff0d6', borderColor: '#e4b66f', color: '#885305' }}
              >
                <AlertTriangle size={14} />
                <span>Asisten sin mesa:</span> <strong>{stats.attendingWithoutTable}</strong>
              </span>
            )}
          </div>

          {/* Barra de Filtros y Búsqueda */}
          <div className="guests-toolbar">
            <div className="guests-search-box">
              <Search size={16} />
              <input
                type="text"
                placeholder="Buscar por nombre, familia, teléfono..."
                value={guestSearch}
                onChange={(e) => setGuestSearch(e.target.value)}
              />
            </div>

            <div className="guests-filter-group">
              <select
                value={guestStatusFilter}
                onChange={(e) =>
                  setGuestStatusFilter(
                    e.target.value as 'ALL' | 'attending' | 'declined' | 'pending'
                  )
                }
              >
                <option value="ALL">Todos los estados</option>
                <option value="attending">✓ Solo confirmados (Asisten)</option>
                <option value="declined">✕ Solo confirmados (No asisten)</option>
                <option value="pending">⏳ Solo pendientes</option>
              </select>

              <select
                value={guestTableFilter}
                onChange={(e) => setGuestTableFilter(e.target.value)}
              >
                <option value="ALL">Todas las mesas</option>
                <option value="WITH_TABLE">Con mesa asignada</option>
                <option value="WITHOUT_TABLE">Sin mesa asignada</option>
                {tables.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>

              <select
                value={guestFamilyFilter}
                onChange={(e) => setGuestFamilyFilter(e.target.value)}
              >
                <option value="ALL">Todas las familias</option>
                <option value="NONE">Solo individuales sin familia</option>
                {families.map((fam) => (
                  <option key={fam.id} value={fam.id}>
                    {fam.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* ==================== VISTA 1: POR PERSONA (LISTA NOMINAL) ==================== */}
          {guestViewMode === 'by-person' && (
            <div className="guests-table-wrapper">
              <table className="guests-table">
                <thead>
                  <tr>
                    <th>Persona / Invitado</th>
                    <th>Familia / Grupo</th>
                    <th>Estado</th>
                    <th>Teléfono / WhatsApp</th>
                    <th>Mesa Asignada</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGuests.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '30px' }}>
                        No se encontraron invitados con los filtros seleccionados.
                      </td>
                    </tr>
                  ) : (
                    filteredGuests.map((guest) => {
                      const inv = invitations.find((i) => i.id === guest.invitationId);
                      const isEditingPhone = quickPhoneGuestId === guest.uniqueId;

                      return (
                        <tr key={guest.uniqueId}>
                          {/* Nombre del invitado */}
                          <td>
                            <div className="guest-name-cell">
                              <span className="guest-primary-name">{guest.name}</span>
                              <span className="guest-inv-source">
                                Invitación: <em>{guest.invitationTitle}</em>
                              </span>
                              {guest.isPlusOne && (
                                <span className="badge-tag-companion">Acompañante (+1)</span>
                              )}
                            </div>
                          </td>

                          {/* Familia */}
                          <td>
                            {guest.familyName ? (
                              <span className="badge-family">{guest.familyName}</span>
                            ) : (
                              <span className="badge-individual">Individual</span>
                            )}
                          </td>

                          {/* Estado de confirmación */}
                          <td>
                            <span className={`status-tag is-${guest.status}`}>
                              {guest.status === 'attending'
                                ? '✓ Asiste'
                                : guest.status === 'declined'
                                ? '✕ No asiste'
                                : '⏳ Pendiente'}
                            </span>
                          </td>

                          {/* Teléfono individual / WhatsApp */}
                          <td>
                            {isEditingPhone ? (
                              <div className="phone-quick-edit-row">
                                <input
                                  type="tel"
                                  className="phone-quick-input"
                                  placeholder="+502 1234 5678"
                                  value={quickPhoneValue}
                                  onChange={(e) => setQuickPhoneValue(e.target.value)}
                                  autoFocus
                                />
                                <button
                                  type="button"
                                  className="btn-icon-save"
                                  onClick={() => handleSaveQuickPersonPhone(guest)}
                                  title="Guardar teléfono de esta persona"
                                >
                                  <Check size={14} />
                                </button>
                                <button
                                  type="button"
                                  className="btn-icon-cancel"
                                  onClick={() => setQuickPhoneGuestId(null)}
                                  title="Cancelar"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ) : guest.phone ? (
                              <div className="guest-phone-cell">
                                <span style={{ fontWeight: 600 }}>{guest.phone}</span>
                                {inv && (
                                  <button
                                    type="button"
                                    className="btn-wa-direct"
                                    onClick={() => handleShareWhatsApp(inv, guest.phone)}
                                    title="Enviar invitación por WhatsApp a este número"
                                  >
                                    <MessageCircle size={13} />
                                    <span>WhatsApp</span>
                                  </button>
                                )}
                                <button
                                  type="button"
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: '#826e4f',
                                  }}
                                  onClick={() => {
                                    setQuickPhoneGuestId(guest.uniqueId);
                                    setQuickPhoneValue(guest.phone || '');
                                  }}
                                  title="Editar teléfono de esta persona"
                                >
                                  <Edit3 size={13} />
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                className="btn-add-phone-quick"
                                onClick={() => {
                                  setQuickPhoneGuestId(guest.uniqueId);
                                  setQuickPhoneValue('');
                                }}
                              >
                                <Plus size={11} /> Agregar teléfono
                              </button>
                            )}
                          </td>

                          {/* Mesa asignada con selector rápido */}
                          <td>
                            <select
                              className={`table-quick-select ${
                                !guest.tableId ? 'is-empty' : ''
                              }`}
                              value={guest.tableId || ''}
                              onChange={(e) =>
                                handleQuickAssignTable(
                                  guest.invitationId,
                                  e.target.value || null
                                )
                              }
                            >
                              <option value="">(Sin mesa asignada)</option>
                              {tables.map((tbl) => {
                                const occ = calculateTableOccupancy(
                                  tbl.id,
                                  tbl.capacity,
                                  invitations
                                );
                                const isCurrent = tbl.id === guest.tableId;
                                const isFull =
                                  !isCurrent && occ.confirmedCount >= tbl.capacity;
                                return (
                                  <option key={tbl.id} value={tbl.id}>
                                    {tbl.name} ({occ.confirmedCount}/{tbl.capacity}
                                    {isFull ? ' - LLENA' : ''})
                                  </option>
                                );
                              })}
                            </select>
                          </td>

                          {/* Acciones */}
                          <td>
                            {inv && (
                              <div style={{ display: 'flex', gap: '5px' }}>
                                <button
                                  type="button"
                                  className="btn-card-small"
                                  onClick={() => handleCopyLink(inv)}
                                  title="Copiar enlace con token"
                                >
                                  {copiedId === inv.id ? <Check size={13} /> : <Copy size={13} />}
                                </button>
                                <a
                                  href={buildInvitationUrl(inv.token)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="btn-card-small"
                                  title="Abrir invitación"
                                >
                                  <ExternalLink size={13} />
                                </a>
                                <button
                                  type="button"
                                  className="btn-card-small"
                                  onClick={() => handleLoadInvitationForEdit(inv)}
                                  title="Editar invitación"
                                >
                                  <Edit3 size={13} />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* ==================== VISTA 2: POR INVITACIÓN (GRUPOS) ==================== */}
          {guestViewMode === 'by-invitation' && (
            <div className="guests-table-wrapper">
              <table className="guests-table">
                <thead>
                  <tr>
                    <th>Invitación</th>
                    <th>Titulares y Acompañantes</th>
                    <th>Teléfono / WhatsApp</th>
                    <th>Mesa Asignada</th>
                    <th>Token</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {invitations.map((inv) => {
                    const famName = families.find((f) => f.id === inv.familyGroupId)?.name;
                    return (
                      <tr key={inv.id}>
                        <td>
                          <div className="guest-name-cell">
                            <span className="guest-primary-name">{inv.displayTitle}</span>
                            {famName && <span className="badge-family">{famName}</span>}
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {inv.members.map((m) => (
                              <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span>{m.name}</span>
                                {m.phone && <small style={{ color: '#685434' }}>({m.phone})</small>}
                                <span className={`status-tag is-${m.status}`} style={{ fontSize: '0.7rem' }}>
                                  {m.status === 'attending'
                                    ? '✓ Asiste'
                                    : m.status === 'declined'
                                    ? '✕ No'
                                    : '⏳'}
                                </span>
                              </div>
                            ))}
                            {inv.selectedPlusOnesCount > 0 && inv.plusOneNames.length > 0 && (
                              <small style={{ color: '#7a5513' }}>
                                <strong>+ {inv.selectedPlusOnesCount} acompañantes:</strong>{' '}
                                {inv.plusOneNames.join(', ')}
                              </small>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="guest-phone-cell">
                            {inv.phone ? (
                              <>
                                <span>{inv.phone}</span>
                                <button
                                  type="button"
                                  className="btn-wa-direct"
                                  onClick={() => handleShareWhatsApp(inv)}
                                >
                                  <MessageCircle size={13} />
                                  <span>WhatsApp</span>
                                </button>
                              </>
                            ) : (
                              <span style={{ color: '#9d8866', fontStyle: 'italic', fontSize: '0.78rem' }}>
                                Sin teléfono
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          <select
                            className={`table-quick-select ${!inv.tableId ? 'is-empty' : ''}`}
                            value={inv.tableId || ''}
                            onChange={(e) =>
                              handleQuickAssignTable(inv.id, e.target.value || null)
                            }
                          >
                            <option value="">(Sin mesa asignada)</option>
                            {tables.map((tbl) => {
                              const occ = calculateTableOccupancy(tbl.id, tbl.capacity, invitations);
                              return (
                                <option key={tbl.id} value={tbl.id}>
                                  {tbl.name} ({occ.confirmedCount}/{tbl.capacity})
                                </option>
                              );
                            })}
                          </select>
                        </td>
                        <td>
                          <code className="badge-token">?t={inv.token}</code>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '5px' }}>
                            <button
                              type="button"
                              className="btn-card-small"
                              onClick={() => handleCopyLink(inv)}
                              title="Copiar link"
                            >
                              <Copy size={13} />
                            </button>
                            <button
                              type="button"
                              className="btn-card-small"
                              onClick={() => handleLoadInvitationForEdit(inv)}
                              title="Editar"
                            >
                              <Edit3 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* ==================== VISTA 3: POR FAMILIA ==================== */}
          {guestViewMode === 'by-family' && (
            <div className="families-overview-container">
              {/* Recorrer cada grupo familiar */}
              {families.map((fam) => {
                const famGuests = filteredGuests.filter((g) => g.familyGroupId === fam.id);
                if (guestFamilyFilter !== 'ALL' && guestFamilyFilter !== fam.id) return null;
                if (famGuests.length === 0 && guestSearch.trim()) return null;

                const totalFam = famGuests.length;
                const attendingFam = famGuests.filter((g) => g.status === 'attending').length;
                const declinedFam = famGuests.filter((g) => g.status === 'declined').length;
                const pendingFam = famGuests.filter((g) => g.status === 'pending').length;

                // Nombres de mesas asignadas a miembros de esta familia
                const famTableIds = Array.from(
                  new Set(famGuests.map((g) => g.tableId).filter(Boolean))
                );
                const famTableNames = famTableIds
                  .map((tId) => tables.find((t) => t.id === tId)?.name)
                  .filter(Boolean);

                return (
                  <article key={fam.id} className="family-section-card">
                    <div className="family-section-header">
                      <div>
                        <h3>
                          <Users size={18} />
                          <span>{fam.name}</span>
                        </h3>
                        {famTableNames.length > 0 ? (
                          <small style={{ color: '#1a4b81', fontWeight: 600 }}>
                            🪑 Mesas de la familia: {famTableNames.join(', ')}
                          </small>
                        ) : (
                          <small style={{ color: '#8d754e', fontStyle: 'italic' }}>
                            Sin mesas asignadas aún
                          </small>
                        )}
                      </div>

                      <div className="family-stats-badge-row">
                        <span className="badge-family-stat">Total: {totalFam}</span>
                        <span className="badge-family-stat is-green">✓ Asisten: {attendingFam}</span>
                        <span className="badge-family-stat is-red">✕ No: {declinedFam}</span>
                        <span className="badge-family-stat is-yellow">⏳ Pendientes: {pendingFam}</span>
                      </div>
                    </div>

                    <div className="guests-table-wrapper">
                      <table className="guests-table">
                        <thead>
                          <tr>
                            <th>Invitado / Integrante</th>
                            <th>Invitación</th>
                            <th>Estado</th>
                            <th>Teléfono / WhatsApp</th>
                            <th>Mesa Asignada</th>
                            <th>Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {famGuests.length === 0 ? (
                            <tr>
                              <td colSpan={6} style={{ textAlign: 'center', padding: '20px' }}>
                                No hay invitados registrados en esta familia.
                              </td>
                            </tr>
                          ) : (
                            famGuests.map((guest) => {
                              const inv = invitations.find((i) => i.id === guest.invitationId);
                              const isEditingPhone = quickPhoneGuestId === guest.uniqueId;

                              return (
                                <tr key={guest.uniqueId}>
                                  <td>
                                    <div className="guest-name-cell">
                                      <span className="guest-primary-name">{guest.name}</span>
                                      {guest.isPlusOne && (
                                        <span className="badge-tag-companion">Acompañante (+1)</span>
                                      )}
                                    </div>
                                  </td>

                                  <td>
                                    <em>{guest.invitationTitle}</em>
                                  </td>

                                  <td>
                                    <span className={`status-tag is-${guest.status}`}>
                                      {guest.status === 'attending'
                                        ? '✓ Asiste'
                                        : guest.status === 'declined'
                                        ? '✕ No asiste'
                                        : '⏳ Pendiente'}
                                    </span>
                                  </td>

                                  <td>
                                    {isEditingPhone ? (
                                      <div className="phone-quick-edit-row">
                                        <input
                                          type="tel"
                                          className="phone-quick-input"
                                          placeholder="+502 1234 5678"
                                          value={quickPhoneValue}
                                          onChange={(e) => setQuickPhoneValue(e.target.value)}
                                          autoFocus
                                        />
                                        <button
                                          type="button"
                                          className="btn-icon-save"
                                          onClick={() => handleSaveQuickPersonPhone(guest)}
                                          title="Guardar teléfono"
                                        >
                                          <Check size={14} />
                                        </button>
                                        <button
                                          type="button"
                                          className="btn-icon-cancel"
                                          onClick={() => setQuickPhoneGuestId(null)}
                                          title="Cancelar"
                                        >
                                          <X size={14} />
                                        </button>
                                      </div>
                                    ) : guest.phone ? (
                                      <div className="guest-phone-cell">
                                        <span style={{ fontWeight: 600 }}>{guest.phone}</span>
                                        {inv && (
                                          <button
                                            type="button"
                                            className="btn-wa-direct"
                                            onClick={() => handleShareWhatsApp(inv, guest.phone)}
                                            title="Enviar WhatsApp"
                                          >
                                            <MessageCircle size={13} />
                                            <span>WhatsApp</span>
                                          </button>
                                        )}
                                        <button
                                          type="button"
                                          style={{
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            color: '#826e4f',
                                          }}
                                          onClick={() => {
                                            setQuickPhoneGuestId(guest.uniqueId);
                                            setQuickPhoneValue(guest.phone || '');
                                          }}
                                          title="Editar teléfono"
                                        >
                                          <Edit3 size={13} />
                                        </button>
                                      </div>
                                    ) : (
                                      <button
                                        type="button"
                                        className="btn-add-phone-quick"
                                        onClick={() => {
                                          setQuickPhoneGuestId(guest.uniqueId);
                                          setQuickPhoneValue('');
                                        }}
                                      >
                                        <Plus size={11} /> Agregar teléfono
                                      </button>
                                    )}
                                  </td>

                                  <td>
                                    <select
                                      className={`table-quick-select ${
                                        !guest.tableId ? 'is-empty' : ''
                                      }`}
                                      value={guest.tableId || ''}
                                      onChange={(e) =>
                                        handleQuickAssignTable(
                                          guest.invitationId,
                                          e.target.value || null
                                        )
                                      }
                                    >
                                      <option value="">(Sin mesa asignada)</option>
                                      {tables.map((tbl) => {
                                        const occ = calculateTableOccupancy(
                                          tbl.id,
                                          tbl.capacity,
                                          invitations
                                        );
                                        const isCurrent = tbl.id === guest.tableId;
                                        const isFull =
                                          !isCurrent && occ.confirmedCount >= tbl.capacity;
                                        return (
                                          <option key={tbl.id} value={tbl.id}>
                                            {tbl.name} ({occ.confirmedCount}/{tbl.capacity}
                                            {isFull ? ' - LLENA' : ''})
                                          </option>
                                        );
                                      })}
                                    </select>
                                  </td>

                                  <td>
                                    {inv && (
                                      <div style={{ display: 'flex', gap: '5px' }}>
                                        <button
                                          type="button"
                                          className="btn-card-small"
                                          onClick={() => handleCopyLink(inv)}
                                          title="Copiar enlace con token"
                                        >
                                          {copiedId === inv.id ? <Check size={13} /> : <Copy size={13} />}
                                        </button>
                                        <a
                                          href={buildInvitationUrl(inv.token)}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="btn-card-small"
                                          title="Abrir invitación"
                                        >
                                          <ExternalLink size={13} />
                                        </a>
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </article>
                );
              })}

              {/* Sección Especial: Invitados Individuales (Sin Grupo Familiar) */}
              {(() => {
                const nonFamGuests = filteredGuests.filter((g) => !g.familyGroupId);
                if (nonFamGuests.length === 0) return null;
                if (guestFamilyFilter !== 'ALL' && guestFamilyFilter !== 'NONE') return null;

                const attendingNonFam = nonFamGuests.filter((g) => g.status === 'attending').length;
                const declinedNonFam = nonFamGuests.filter((g) => g.status === 'declined').length;
                const pendingNonFam = nonFamGuests.filter((g) => g.status === 'pending').length;

                return (
                  <article className="family-section-card">
                    <div className="family-section-header">
                      <div>
                        <h3>
                          <UserCheck size={18} />
                          <span>Invitados Individuales (Sin Grupo Familiar)</span>
                        </h3>
                        <small style={{ color: '#8d754e' }}>
                          Invitados que no comparten token familiar con otros miembros.
                        </small>
                      </div>

                      <div className="family-stats-badge-row">
                        <span className="badge-family-stat">Total: {nonFamGuests.length}</span>
                        <span className="badge-family-stat is-green">✓ Asisten: {attendingNonFam}</span>
                        <span className="badge-family-stat is-red">✕ No: {declinedNonFam}</span>
                        <span className="badge-family-stat is-yellow">⏳ Pendientes: {pendingNonFam}</span>
                      </div>
                    </div>

                    <div className="guests-table-wrapper">
                      <table className="guests-table">
                        <thead>
                          <tr>
                            <th>Invitado / Integrante</th>
                            <th>Invitación</th>
                            <th>Estado</th>
                            <th>Teléfono / WhatsApp</th>
                            <th>Mesa Asignada</th>
                            <th>Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {nonFamGuests.map((guest) => {
                            const inv = invitations.find((i) => i.id === guest.invitationId);
                            const isEditingPhone = quickPhoneGuestId === guest.uniqueId;

                            return (
                              <tr key={guest.uniqueId}>
                                <td>
                                  <div className="guest-name-cell">
                                    <span className="guest-primary-name">{guest.name}</span>
                                    {guest.isPlusOne && (
                                      <span className="badge-tag-companion">Acompañante (+1)</span>
                                    )}
                                  </div>
                                </td>

                                <td>
                                  <em>{guest.invitationTitle}</em>
                                </td>

                                <td>
                                  <span className={`status-tag is-${guest.status}`}>
                                    {guest.status === 'attending'
                                      ? '✓ Asiste'
                                      : guest.status === 'declined'
                                      ? '✕ No asiste'
                                      : '⏳ Pendiente'}
                                  </span>
                                </td>

                                <td>
                                  {isEditingPhone ? (
                                    <div className="phone-quick-edit-row">
                                      <input
                                        type="tel"
                                        className="phone-quick-input"
                                        placeholder="+502 1234 5678"
                                        value={quickPhoneValue}
                                        onChange={(e) => setQuickPhoneValue(e.target.value)}
                                        autoFocus
                                      />
                                      <button
                                        type="button"
                                        className="btn-icon-save"
                                        onClick={() => handleSaveQuickPersonPhone(guest)}
                                        title="Guardar teléfono"
                                      >
                                        <Check size={14} />
                                      </button>
                                      <button
                                        type="button"
                                        className="btn-icon-cancel"
                                        onClick={() => setQuickPhoneGuestId(null)}
                                        title="Cancelar"
                                      >
                                        <X size={14} />
                                      </button>
                                    </div>
                                  ) : guest.phone ? (
                                    <div className="guest-phone-cell">
                                      <span style={{ fontWeight: 600 }}>{guest.phone}</span>
                                      {inv && (
                                        <button
                                          type="button"
                                          className="btn-wa-direct"
                                          onClick={() => handleShareWhatsApp(inv, guest.phone)}
                                          title="Enviar WhatsApp"
                                        >
                                          <MessageCircle size={13} />
                                          <span>WhatsApp</span>
                                        </button>
                                      )}
                                      <button
                                        type="button"
                                        style={{
                                          background: 'none',
                                          border: 'none',
                                          cursor: 'pointer',
                                          color: '#826e4f',
                                        }}
                                        onClick={() => {
                                          setQuickPhoneGuestId(guest.uniqueId);
                                          setQuickPhoneValue(guest.phone || '');
                                        }}
                                        title="Editar teléfono"
                                      >
                                        <Edit3 size={13} />
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      className="btn-add-phone-quick"
                                      onClick={() => {
                                        setQuickPhoneGuestId(guest.uniqueId);
                                        setQuickPhoneValue('');
                                      }}
                                    >
                                      <Plus size={11} /> Agregar teléfono
                                    </button>
                                  )}
                                </td>

                                <td>
                                  <select
                                    className={`table-quick-select ${
                                      !guest.tableId ? 'is-empty' : ''
                                    }`}
                                    value={guest.tableId || ''}
                                    onChange={(e) =>
                                      handleQuickAssignTable(
                                        guest.invitationId,
                                        e.target.value || null
                                      )
                                    }
                                  >
                                    <option value="">(Sin mesa asignada)</option>
                                    {tables.map((tbl) => {
                                      const occ = calculateTableOccupancy(
                                        tbl.id,
                                        tbl.capacity,
                                        invitations
                                      );
                                      const isCurrent = tbl.id === guest.tableId;
                                      const isFull =
                                        !isCurrent && occ.confirmedCount >= tbl.capacity;
                                      return (
                                        <option key={tbl.id} value={tbl.id}>
                                          {tbl.name} ({occ.confirmedCount}/{tbl.capacity}
                                          {isFull ? ' - LLENA' : ''})
                                        </option>
                                      );
                                    })}
                                  </select>
                                </td>

                                <td>
                                  {inv && (
                                    <div style={{ display: 'flex', gap: '5px' }}>
                                      <button
                                        type="button"
                                        className="btn-card-small"
                                        onClick={() => handleCopyLink(inv)}
                                        title="Copiar enlace con token"
                                      >
                                        {copiedId === inv.id ? <Check size={13} /> : <Copy size={13} />}
                                      </button>
                                      <a
                                        href={buildInvitationUrl(inv.token)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn-card-small"
                                        title="Abrir invitación"
                                      >
                                        <ExternalLink size={13} />
                                      </a>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </article>
                );
              })()}
            </div>
          )}
        </section>
      )}

      {/* ============================================================ */}
      {/* ==================== TAB 2: MESAS Y ASIENTOS ================ */}
      {/* ============================================================ */}
      {activeTab === 'tables' && (
        <div className="tables-management-layout">
          {/* Métricas Generales de Mesas */}
          <div className="tables-summary-grid">
            <div className="table-kpi-card">
              <span>Mesas Creadas</span>
              <strong>{tableMetrics.totalTables}</strong>
              <small>Capacidad total: {tableMetrics.totalSalonCapacity} personas</small>
            </div>
            <div className="table-kpi-card" style={{ borderLeft: '4px solid #38a169' }}>
              <span>Asientos Ocupados</span>
              <strong style={{ color: '#1f663c' }}>{tableMetrics.totalSeatsOccupied}</strong>
              <small>Personas confirmadas asignadas</small>
            </div>
            <div className="table-kpi-card" style={{ borderLeft: '4px solid #3182ce' }}>
              <span>Asientos Libres</span>
              <strong style={{ color: '#1a4971' }}>{tableMetrics.totalSeatsAvailable}</strong>
              <small>Disponibles para asignar</small>
            </div>
            <div className="table-kpi-card" style={{ borderLeft: '4px solid #dd6b20' }}>
              <span>Mesas Llenas</span>
              <strong>{tableMetrics.fullTablesCount}</strong>
              <small>
                {tableMetrics.overcapacityTablesCount > 0
                  ? `⚠️ ${tableMetrics.overcapacityTablesCount} con sobrecupo`
                  : 'Sin sobrecupos'}
              </small>
            </div>
          </div>

          <div className="dashboard-content-columns">
            {/* Columna Izquierda: Formulario Crear / Editar Mesa */}
            <section className="dashboard-panel">
              <h2>{editingTableId ? 'Editar Mesa' : 'Agregar Nueva Mesa'}</h2>
              <p className="panel-helper">
                Define el nombre o número de la mesa y la cantidad máxima de personas permitidas para evitar sobrecupos.
              </p>

              <form onSubmit={handleSaveTable} className="dashboard-form">
                <div className="form-group">
                  <label>Nombre o Número de Mesa</label>
                  <input
                    type="text"
                    placeholder="Ej. Mesa 1, Mesa de Honor o Mesa Familia García"
                    value={tableName}
                    onChange={(e) => setTableName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-row-2">
                  <div className="form-group">
                    <label>Capacidad máxima (personas)</label>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={tableCapacity}
                      onChange={(e) => setTableCapacity(Math.max(1, Number(e.target.value)))}
                      required
                    />
                    <small style={{ color: '#7a6544' }}>Cantidad de sillas/personas</small>
                  </div>

                  <div className="form-group">
                    <label>Atajos de capacidad</label>
                    <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                      {[6, 8, 10, 12].map((cap) => (
                        <button
                          key={cap}
                          type="button"
                          className="btn-card-small"
                          onClick={() => setTableCapacity(cap)}
                          style={{
                            fontWeight: tableCapacity === cap ? 800 : 500,
                            borderColor: tableCapacity === cap ? '#2b2111' : '#cfbe9e',
                          }}
                        >
                          {cap} pers.
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label>Notas de ubicación (opcional)</label>
                  <input
                    type="text"
                    placeholder="Ej. Cerca de la pista, Frente al jardín"
                    value={tableNotes}
                    onChange={(e) => setTableNotes(e.target.value)}
                  />
                </div>

                {tableFormFeedback && (
                  <div className="form-feedback-banner">{tableFormFeedback}</div>
                )}

                <div className="form-actions">
                  {editingTableId && (
                    <button
                      type="button"
                      className="btn-secondary-journey"
                      onClick={resetTableForm}
                    >
                      Cancelar
                    </button>
                  )}
                  <button type="submit" className="btn-start-journey">
                    <Plus size={16} />
                    <span>{editingTableId ? 'Guardar Cambios' : 'Crear Mesa'}</span>
                  </button>
                </div>
              </form>
            </section>

            {/* Columna Derecha: Tarjetas de Mesas */}
            <section className="dashboard-panel">
              <div className="panel-header-with-filter">
                <h2>Mesas del Evento ({tables.length})</h2>
              </div>

              {tables.length === 0 ? (
                <div className="empty-state-notice">
                  <Table size={36} style={{ margin: '0 auto 10px', color: '#bca680' }} />
                  <h4>No hay mesas registradas aún</h4>
                  <p>Crea tu primera mesa en el formulario de la izquierda (ej. Mesa 1 con 8 o 10 personas).</p>
                </div>
              ) : (
                <div className="tables-cards-grid">
                  {tables.map((tbl) => {
                    const occ = calculateTableOccupancy(tbl.id, tbl.capacity, invitations);
                    const pct = Math.min(100, Math.round((occ.confirmedCount / tbl.capacity) * 100));

                    let meterColor = 'is-green';
                    let tagClass = 'is-green';
                    if (occ.isOverCapacity) {
                      meterColor = 'is-red';
                      tagClass = 'is-red';
                    } else if (occ.confirmedCount >= tbl.capacity) {
                      meterColor = 'is-full';
                      tagClass = 'is-full';
                    } else if (pct >= 75) {
                      meterColor = 'is-yellow';
                      tagClass = 'is-yellow';
                    }

                    return (
                      <div
                        key={tbl.id}
                        className={`table-card ${occ.isOverCapacity ? 'is-overcap' : ''}`}
                      >
                        <div className="table-card-top">
                          <div>
                            <h3>{tbl.name}</h3>
                            {tbl.notes && <p className="table-card-notes">{tbl.notes}</p>}
                          </div>

                          <span className={`table-capacity-tag ${tagClass}`}>
                            {occ.confirmedCount} / {tbl.capacity} pers.
                          </span>
                        </div>

                        {/* Barra de Ocupación Visual */}
                        <div className="table-meter-container">
                          <div className="table-meter-bar">
                            <div
                              className={`table-meter-fill ${meterColor}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <div className="table-meter-labels">
                            <span>
                              {occ.confirmedCount} confirmados ({occ.expectedCount} previstos)
                            </span>
                            <span>
                              {occ.isOverCapacity
                                ? `⚠️ Sobrecupo (+${occ.confirmedCount - tbl.capacity})`
                                : `${occ.availableSeats} libres`}
                            </span>
                          </div>
                        </div>

                        {occ.isOverCapacity && (
                          <div className="table-overcap-alert">
                            <AlertTriangle size={14} />
                            <span>¡Esta mesa supera su capacidad máxima!</span>
                          </div>
                        )}

                        {/* Lista de Invitados Sentados */}
                        <div style={{ marginTop: '4px' }}>
                          <span
                            style={{
                              fontSize: '0.74rem',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              color: '#6e5833',
                              letterSpacing: '0.04em',
                            }}
                          >
                            Invitados Asignados ({occ.memberNames.length}):
                          </span>

                          <div className="table-guests-chips" style={{ marginTop: '5px' }}>
                            {occ.memberNames.length === 0 ? (
                              <small style={{ color: '#97825f', fontStyle: 'italic' }}>
                                Ninguna persona asignada todavía.
                              </small>
                            ) : (
                              occ.memberNames.map((g, idx) => (
                                <div key={idx} className="table-guest-item-row">
                                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span className="table-guest-item-name">{g.name}</span>
                                    <small>{g.invitationTitle}</small>
                                  </div>
                                  <span
                                    className={`status-tag is-${g.status}`}
                                    style={{ fontSize: '0.68rem', padding: '1px 6px' }}
                                  >
                                    {g.status === 'attending'
                                      ? '✓ Asiste'
                                      : g.status === 'declined'
                                      ? '✕ No'
                                      : '⏳'}
                                  </span>
                                </div>
                              ))
                            )}
                          </div>
                        </div>

                        {/* Botones de acción */}
                        <div className="table-card-actions">
                          <button
                            type="button"
                            className="btn-card-small"
                            onClick={() => handleEditTable(tbl)}
                          >
                            <Edit3 size={13} /> Editar
                          </button>
                          <button
                            type="button"
                            className="btn-card-small is-danger"
                            onClick={() => handleDeleteTable(tbl)}
                          >
                            <Trash2 size={13} /> Eliminar
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* ==================== TAB 3: INVITACIONES (TOKENS) =========== */}
      {/* ============================================================ */}
      {activeTab === 'invitations' && (
        <div className="dashboard-content-columns">
          {/* Columna Izquierda: Formulario Crear / Editar Invitación */}
          <section className="dashboard-panel">
            <h2>{editingId ? 'Editar Invitación' : 'Nueva Invitación con Token'}</h2>
            <p className="panel-helper">
              Crea invitaciones individuales o por pareja (ej. <em>Esposos Picapiedra</em> con Juan y María para selección individual), asigna acompañantes permitidos (+1/+2/+3), teléfono para WhatsApp y mesa del evento.
            </p>

            <form onSubmit={handleSaveInvitation} className="dashboard-form">
              <div className="form-group">
                <label>Título que dirá la invitación</label>
                <input
                  type="text"
                  placeholder="Ej. Esposos Picapiedra o Mateo Picapiedra"
                  value={displayTitle}
                  onChange={(e) => setDisplayTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>
                    <Phone size={14} /> Teléfono general / WhatsApp
                  </label>
                  <input
                    type="tel"
                    placeholder="Ej. +502 5555 1234"
                    value={invPhone}
                    onChange={(e) => setInvPhone(e.target.value)}
                  />
                  <small style={{ color: '#7a6544' }}>Para compartirle directamente por WhatsApp</small>
                </div>

                <div className="form-group">
                  <label>
                    <Table size={14} /> Mesa asignada para el evento
                  </label>
                  <select
                    value={invTableId}
                    onChange={(e) => setInvTableId(e.target.value)}
                  >
                    <option value="">(Sin mesa asignada por ahora)</option>
                    {tables.map((t) => {
                      const occ = calculateTableOccupancy(
                        t.id,
                        t.capacity,
                        invitations.filter((i) => i.id !== editingId)
                      );
                      return (
                        <option key={t.id} value={t.id}>
                          {t.name} ({occ.confirmedCount}/{t.capacity} pers. - {occ.availableSeats} libres)
                        </option>
                      );
                    })}
                  </select>
                </div>
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
                    <option value={0}>Sin acompañantes (+0, solo titulares)</option>
                    <option value={1}>Permitir +1 acompañante</option>
                    <option value={2}>Permitir hasta +2 acompañantes</option>
                    <option value={3}>Permitir hasta +3 acompañantes</option>
                  </select>
                </div>
              </div>

              {/* Lista de Personas Titulares en esta Invitación */}
              <div className="form-group">
                <label>
                  Personas en esta invitación (nombre y teléfono individual)
                </label>
                <div className="members-inputs-stack">
                  {memberNames.map((name, idx) => (
                    <div key={idx} className="member-input-row" style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="text"
                        placeholder={`Nombre persona #${idx + 1}`}
                        value={name}
                        onChange={(e) => {
                          const copy = [...memberNames];
                          copy[idx] = e.target.value;
                          setMemberNames(copy);
                        }}
                        style={{ flex: 1.2 }}
                        required
                      />
                      <input
                        type="tel"
                        placeholder="WhatsApp (opcional)"
                        value={memberPhones[idx] || ''}
                        onChange={(e) => {
                          const copy = [...memberPhones];
                          copy[idx] = e.target.value;
                          setMemberPhones(copy);
                        }}
                        style={{ flex: 0.9, maxWidth: '170px' }}
                      />
                      {memberNames.length > 1 && (
                        <button
                          type="button"
                          className="btn-icon-danger"
                          onClick={() => {
                            setMemberNames(memberNames.filter((_, i) => i !== idx));
                            setMemberPhones(memberPhones.filter((_, i) => i !== idx));
                          }}
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
                  onClick={() => {
                    setMemberNames([...memberNames, '']);
                    setMemberPhones([...memberPhones, '']);
                  }}
                >
                  <Plus size={14} />
                  <span>
                    Agregar otra persona titular a esta misma invitación (ej. Esposa/Esposo)
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
                  <span>{editingId ? 'Guardar cambios' : 'Crear invitación'}</span>
                </button>
              </div>
            </form>
          </section>

          {/* Columna Derecha: Tarjetas de Invitaciones */}
          <section className="dashboard-panel">
            <div className="panel-header-with-filter">
              <h2>Invitaciones Generadas</h2>
            </div>

            <div className="invitations-cards-list">
              {invitations.map((inv) => {
                const famName = families.find((f) => f.id === inv.familyGroupId)?.name;
                const assignedTable = tables.find((t) => t.id === inv.tableId);

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

                          {assignedTable ? (
                            <span
                              className="badge-table"
                              style={{
                                background: '#eaf2fd',
                                color: '#1a4b81',
                                borderRadius: '999px',
                                padding: '2px 8px',
                                fontSize: '0.68rem',
                                fontWeight: 700,
                              }}
                            >
                              🪑 {assignedTable.name}
                            </span>
                          ) : (
                            <span style={{ fontSize: '0.68rem', color: '#97825f', padding: '2px 4px' }}>
                              Sin mesa
                            </span>
                          )}

                          <code className="badge-token">?t={inv.token}</code>
                        </div>

                        <h3>{inv.displayTitle}</h3>

                        {inv.phone && (
                          <small style={{ color: '#5a4628', fontWeight: 600 }}>
                            📱 Teléfono: {inv.phone}
                          </small>
                        )}
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
                          onClick={() => {
                            if (window.confirm(`¿Eliminar la invitación "${inv.displayTitle}"?`)) {
                              deleteInvitationRecord(inv.id);
                            }
                          }}
                          title="Eliminar invitación"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    {/* Estado individual de miembros */}
                    <div className="inv-members-status-list">
                      {inv.members.map((m) => (
                        <div key={m.id} className="member-status-pill-row">
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>{m.name}</span>
                            {m.phone && (
                              <small style={{ color: '#776241' }}>({m.phone})</small>
                            )}
                          </span>
                          <span className={`status-tag is-${m.status}`}>
                            {m.status === 'attending'
                              ? '✓ Sí asiste'
                              : m.status === 'declined'
                              ? '✕ No asiste'
                              : '⏳ Pendiente'}
                          </span>
                        </div>
                      ))}

                      {/* Acompañantes seleccionados */}
                      {inv.selectedPlusOnesCount > 0 && inv.plusOneNames.length > 0 && (
                        <div className="plus-ones-summary">
                          <strong>
                            Acompañantes confirmados (+{inv.selectedPlusOnesCount}):
                          </strong>{' '}
                          {inv.plusOneNames.join(', ')}
                        </div>
                      )}
                    </div>

                    {/* Botones de acción */}
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

      {/* ============================================================ */}
      {/* ==================== TAB 4: GRUPOS FAMILIARES =============== */}
      {/* ============================================================ */}
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
              const famInvs = invitations.filter((i) => i.familyGroupId === fam.id);
              return (
                <div key={fam.id} className="family-admin-card">
                  <div>
                    <h3>{fam.name}</h3>
                    <small>{famInvs.length} invitaciones vinculadas a esta familia</small>
                  </div>
                  <button
                    type="button"
                    className="btn-icon-danger"
                    onClick={() => {
                      if (window.confirm(`¿Eliminar el grupo familiar "${fam.name}"?`)) {
                        deleteFamilyGroup(fam.id);
                      }
                    }}
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

      {/* ============================================================ */}
      {/* ==================== TAB 5: PARÁMETROS Y FIREBASE =========== */}
      {/* ============================================================ */}
      {activeTab === 'settings' && (
        <div className="dashboard-content-columns">
          <section className="dashboard-panel">
            <h2>Parámetros Variables (Fecha Límite y PIN)</h2>
            <form onSubmit={handleSaveGlobalSettings} className="dashboard-form">
              <div className="form-group">
                <label>
                  <Calendar size={15} /> Fecha y hora límite para modificar invitaciones
                </label>
                <input
                  type="datetime-local"
                  value={deadlineInput}
                  onChange={(e) => setDeadlineInput(e.target.value)}
                  required
                />
                <small>
                  Los invitados podrán entrar a su token y cambiar su confirmación hasta esta fecha.
                </small>
              </div>

              <div className="form-group">
                <label>
                  <Lock size={15} /> PIN de acceso a /mi_dashboard (guardado en Firebase)
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

            <h3>Datos de Ejemplo (Familia Picapiedra y Mesas)</h3>
            <p className="panel-helper">
              Restaura o sube a Firebase el ejemplo completo de la{' '}
              <strong>Familia Picapiedra</strong> con mesas asignadas, números de WhatsApp y acompañantes.
            </p>
            <button
              type="button"
              className="btn-secondary-journey"
              onClick={async () => {
                await seedPicapiedraExampleToDatabase();
                alert('¡Datos de demostración y mesas cargados en la base de datos!');
              }}
            >
              Cargar ejemplo Familia Picapiedra y Mesas
            </button>
          </section>

          <section className="dashboard-panel">
            <h2>Conexión a Firebase (Cloud Firestore)</h2>
            <p className="panel-helper">
              Puedes colocar tus credenciales en el archivo <code>.env</code>{' '}
              (variables <code>VITE_FIREBASE_*</code>) o pegarlas directamente aquí:
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
