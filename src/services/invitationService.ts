import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';
import { getDb } from '../config/firebaseConfig';

export type AttendanceStatus = 'pending' | 'attending' | 'declined';

export interface InvitationMember {
  id: string;
  name: string;
  status: AttendanceStatus;
}

export interface FamilyGroup {
  id: string;
  name: string;
  createdAt: string;
}

export interface InvitationRecord {
  id: string;
  token: string;
  /** Título visible en el saludo de la invitación, ej: "Esposos Picapiedra" o "Mateo Picapiedra" */
  displayTitle: string;
  /** ID de la familia si pertenece a un grupo familiar (para que puedan ver quiénes de su familia ya confirmaron) */
  familyGroupId: string | null;
  /** Miembros titulares incluidos en esta invitación (1 para individual, 2+ para esposos/pareja) */
  members: InvitationMember[];
  /** Cantidad máxima permitida de acompañantes adicionales (+0, +1, +2, +3) */
  maxPlusOnes: 0 | 1 | 2 | 3;
  /** Cuántos acompañantes adicionales seleccionó llevar (0 a maxPlusOnes) */
  selectedPlusOnesCount: number;
  /** Nombres obligatorios de cada acompañante seleccionado */
  plusOneNames: string[];
  /** Mensaje opcional para Christopher Gabriel */
  notes?: string;
  respondedAt: string | null;
  createdAt: string;
}

export interface GlobalInvitationSettings {
  /** PIN almacenado en la base de datos para ingresar a /mi_dashboard */
  dashboardPin: string;
  /** Fecha límite (ISO string YYYY-MM-DDTHH:mm) hasta la que los invitados pueden modificar su confirmación */
  rsvpDeadline: string;
  updatedAt: string;
}

const LS_SETTINGS_KEY = 'cg_inv_settings_v1';
const LS_FAMILIES_KEY = 'cg_inv_families_v1';
const LS_INVITATIONS_KEY = 'cg_inv_records_v1';

const DEFAULT_SETTINGS: GlobalInvitationSettings = {
  dashboardPin: '2026',
  rsvpDeadline: '2026-11-25T23:59',
  updatedAt: new Date().toISOString(),
};

/**
 * Generates a unique URL-safe token for an invitation
 */
export function generateInvitationToken(prefix = 'inv'): string {
  const cleanPrefix = prefix
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 16);
  const rand = Math.random().toString(36).substring(2, 7);
  return `${cleanPrefix || 'inv'}-${rand}`;
}

/**
 * Default seed data demonstrating the exact "Familia Picapiedra" (5 people across 4 invitations)
 * + an individual invitation with +2 companions.
 */
function getInitialDemoSeed(): {
  settings: GlobalInvitationSettings;
  families: FamilyGroup[];
  invitations: InvitationRecord[];
} {
  const now = new Date().toISOString();
  const familyId = 'fam-picapiedra';

  const families: FamilyGroup[] = [
    {
      id: familyId,
      name: 'Familia Picapiedra',
      createdAt: now,
    },
  ];

  const invitations: InvitationRecord[] = [
    {
      id: 'inv-picapiedra-papas',
      token: 'esposos-picapiedra',
      displayTitle: 'Esposos Picapiedra',
      familyGroupId: familyId,
      members: [
        { id: 'm-juan', name: 'Juan Picapiedra', status: 'declined' },
        { id: 'm-maria', name: 'María Picapiedra', status: 'attending' },
      ],
      maxPlusOnes: 0,
      selectedPlusOnesCount: 0,
      plusOneNames: [],
      notes: '¡Muchas felicidades por el bautizo y primer añito de Christopher Gabriel!',
      respondedAt: now,
      createdAt: now,
    },
    {
      id: 'inv-picapiedra-hijo1',
      token: 'pedro-picapiedra',
      displayTitle: 'Pedro Picapiedra (Hijo)',
      familyGroupId: familyId,
      members: [
        { id: 'm-pedro', name: 'Pedro Picapiedra', status: 'attending' },
      ],
      maxPlusOnes: 1,
      selectedPlusOnesCount: 1,
      plusOneNames: ['Vilma de Picapiedra'],
      notes: '',
      respondedAt: now,
      createdAt: now,
    },
    {
      id: 'inv-picapiedra-hija2',
      token: 'pebbles-picapiedra',
      displayTitle: 'Pebbles Picapiedra (Hija)',
      familyGroupId: familyId,
      members: [
        { id: 'm-pebbles', name: 'Pebbles Picapiedra', status: 'pending' },
      ],
      maxPlusOnes: 0,
      selectedPlusOnesCount: 0,
      plusOneNames: [],
      notes: '',
      respondedAt: null,
      createdAt: now,
    },
    {
      id: 'inv-picapiedra-hijo3',
      token: 'dino-picapiedra',
      displayTitle: 'Mateo Picapiedra (Hijo)',
      familyGroupId: familyId,
      members: [
        { id: 'm-mateo', name: 'Mateo Picapiedra', status: 'pending' },
      ],
      maxPlusOnes: 2,
      selectedPlusOnesCount: 0,
      plusOneNames: [],
      notes: '',
      respondedAt: null,
      createdAt: now,
    },
    {
      id: 'inv-individual-plus3',
      token: 'invitado-especial',
      displayTitle: 'Carlos Mármol',
      familyGroupId: null,
      members: [
        { id: 'm-carlos', name: 'Carlos Mármol', status: 'pending' },
      ],
      maxPlusOnes: 3,
      selectedPlusOnesCount: 0,
      plusOneNames: [],
      notes: '',
      respondedAt: null,
      createdAt: now,
    },
  ];

  return {
    settings: DEFAULT_SETTINGS,
    families,
    invitations,
  };
}

// ==================== LOCAL STORAGE HELPERS (When Firebase is not yet configured) ====================

function ensureLocalSeed() {
  if (!localStorage.getItem(LS_SETTINGS_KEY)) {
    const seed = getInitialDemoSeed();
    localStorage.setItem(LS_SETTINGS_KEY, JSON.stringify(seed.settings));
    localStorage.setItem(LS_FAMILIES_KEY, JSON.stringify(seed.families));
    localStorage.setItem(LS_INVITATIONS_KEY, JSON.stringify(seed.invitations));
  }
}

function getLocalSettings(): GlobalInvitationSettings {
  ensureLocalSeed();
  try {
    return JSON.parse(localStorage.getItem(LS_SETTINGS_KEY)!) as GlobalInvitationSettings;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function getLocalFamilies(): FamilyGroup[] {
  ensureLocalSeed();
  try {
    return JSON.parse(localStorage.getItem(LS_FAMILIES_KEY)!) as FamilyGroup[];
  } catch {
    return [];
  }
}

function getLocalInvitations(): InvitationRecord[] {
  ensureLocalSeed();
  try {
    return JSON.parse(localStorage.getItem(LS_INVITATIONS_KEY)!) as InvitationRecord[];
  } catch {
    return [];
  }
}

function notifyLocalChange() {
  window.dispatchEvent(new CustomEvent('cg-local-db-updated'));
}

// ==================== PUBLIC SERVICE API (FIRESTORE + LOCAL SYNC) ====================

/**
 * Checks whether the current date/time is still before the configured rsvpDeadline
 */
export function isModificationAllowed(deadlineIso: string): boolean {
  if (!deadlineIso) return true;
  const deadlineTime = new Date(deadlineIso).getTime();
  if (Number.isNaN(deadlineTime)) return true;
  return Date.now() <= deadlineTime;
}

export interface FirestoreInitStatus {
  status: 'connected' | 'local-only' | 'permission-denied' | 'error';
  projectId?: string;
  errorMessage?: string;
}

/**
 * Ensures the settings/general document (containing dashboardPin & rsvpDeadline)
 * exists in Firestore as soon as the application or dashboard loads.
 */
export async function initializeFirestoreSettings(): Promise<FirestoreInitStatus> {
  const db = getDb();
  if (!db) {
    return { status: 'local-only' };
  }

  const projectId = db.app.options.projectId;
  try {
    const ref = doc(db, 'settings', 'general');
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        ...DEFAULT_SETTINGS,
        updatedAt: new Date().toISOString(),
      });
    } else {
      const data = snap.data() as Partial<GlobalInvitationSettings>;
      if (!data.dashboardPin) {
        await setDoc(
          ref,
          {
            ...DEFAULT_SETTINGS,
            ...data,
            dashboardPin: DEFAULT_SETTINGS.dashboardPin,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      }
    }
    return { status: 'connected', projectId };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    const code = (err as { code?: string })?.code || '';
    if (
      code.includes('permission-denied') ||
      msg.toLowerCase().includes('permission')
    ) {
      return {
        status: 'permission-denied',
        projectId,
        errorMessage: msg,
      };
    }
    return {
      status: 'error',
      projectId,
      errorMessage: msg,
    };
  }
}

/**
 * Fetch Global Settings (PIN & RSVP Deadline) from Firebase or Local
 */
export async function fetchGlobalSettings(): Promise<GlobalInvitationSettings> {
  const db = getDb();
  if (db) {
    try {
      const ref = doc(db, 'settings', 'general');
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data() as Partial<GlobalInvitationSettings>;
        return {
          ...DEFAULT_SETTINGS,
          ...data,
          dashboardPin: data.dashboardPin || DEFAULT_SETTINGS.dashboardPin,
        };
      }
      // Initialize default settings in Firestore if not present yet
      const initialSettings: GlobalInvitationSettings = {
        ...DEFAULT_SETTINGS,
        updatedAt: new Date().toISOString(),
      };
      await setDoc(ref, initialSettings);
      return initialSettings;
    } catch (err) {
      console.warn(
        'No se pudo leer/crear settings/general en Firestore, usando respaldo local:',
        err
      );
      return getLocalSettings();
    }
  }
  return getLocalSettings();
}

/**
 * Verify PIN against Firebase settings/general.dashboardPin
 */
export async function verifyDashboardPin(enteredPin: string): Promise<boolean> {
  const settings = await fetchGlobalSettings();
  return settings.dashboardPin.trim() === enteredPin.trim();
}

/**
 * Update Global Settings (PIN and/or RSVP Deadline) in Firebase
 */
export async function updateGlobalSettings(
  partial: Partial<GlobalInvitationSettings>
): Promise<GlobalInvitationSettings> {
  const current = await fetchGlobalSettings();
  const updated: GlobalInvitationSettings = {
    ...current,
    ...partial,
    updatedAt: new Date().toISOString(),
  };

  const db = getDb();
  if (db) {
    await setDoc(doc(db, 'settings', 'general'), updated);
  }
  localStorage.setItem(LS_SETTINGS_KEY, JSON.stringify(updated));
  notifyLocalChange();
  return updated;
}

/**
 * Subscribe in real time to a single Invitation by its unique token,
 * PLUS all sibling invitations in the same familyGroupId (if any) and global settings.
 */
export function subscribeToInvitationByToken(
  token: string,
  callback: (data: {
    invitation: InvitationRecord | null;
    familyInvitations: InvitationRecord[];
    familyGroup: FamilyGroup | null;
    settings: GlobalInvitationSettings;
    loading: boolean;
  }) => void
): () => void {
  const cleanToken = token.trim();
  const db = getDb();

  if (db) {
    let unsubFamily: (() => void) | null = null;
    let currentSettings = DEFAULT_SETTINGS;

    const unsubSettings = onSnapshot(doc(db, 'settings', 'general'), (snap) => {
      if (snap.exists()) {
        currentSettings = snap.data() as GlobalInvitationSettings;
      }
    });

    const q = query(
      collection(db, 'invitations'),
      where('token', '==', cleanToken)
    );

    const unsubInv = onSnapshot(q, async (querySnap) => {
      if (querySnap.empty) {
        callback({
          invitation: null,
          familyInvitations: [],
          familyGroup: null,
          settings: currentSettings,
          loading: false,
        });
        return;
      }

      const inv = querySnap.docs[0].data() as InvitationRecord;

      if (unsubFamily) {
        unsubFamily();
        unsubFamily = null;
      }

      if (inv.familyGroupId) {
        let famGroup: FamilyGroup | null = null;
        try {
          const famSnap = await getDoc(doc(db, 'families', inv.familyGroupId));
          if (famSnap.exists()) {
            famGroup = famSnap.data() as FamilyGroup;
          }
        } catch {
          // ignore
        }

        const famQuery = query(
          collection(db, 'invitations'),
          where('familyGroupId', '==', inv.familyGroupId)
        );
        unsubFamily = onSnapshot(famQuery, (famQuerySnap) => {
          const siblings = famQuerySnap.docs.map(
            (d) => d.data() as InvitationRecord
          );
          callback({
            invitation: inv,
            familyInvitations: siblings,
            familyGroup: famGroup,
            settings: currentSettings,
            loading: false,
          });
        });
      } else {
        callback({
          invitation: inv,
          familyInvitations: [inv],
          familyGroup: null,
          settings: currentSettings,
          loading: false,
        });
      }
    });

    return () => {
      unsubSettings();
      unsubInv();
      if (unsubFamily) unsubFamily();
    };
  }

  // Local Storage reactive subscription
  const emitLocal = () => {
    const settings = getLocalSettings();
    const allInvs = getLocalInvitations();
    const allFams = getLocalFamilies();
    const inv = allInvs.find((i) => i.token === cleanToken) ?? null;

    if (!inv) {
      callback({
        invitation: null,
        familyInvitations: [],
        familyGroup: null,
        settings,
        loading: false,
      });
      return;
    }

    const familyInvitations = inv.familyGroupId
      ? allInvs.filter((i) => i.familyGroupId === inv.familyGroupId)
      : [inv];
    const familyGroup = inv.familyGroupId
      ? allFams.find((f) => f.id === inv.familyGroupId) ?? null
      : null;

    callback({
      invitation: inv,
      familyInvitations,
      familyGroup,
      settings,
      loading: false,
    });
  };

  emitLocal();
  window.addEventListener('cg-local-db-updated', emitLocal);
  window.addEventListener('storage', emitLocal);
  return () => {
    window.removeEventListener('cg-local-db-updated', emitLocal);
    window.removeEventListener('storage', emitLocal);
  };
}

/**
 * Save Guest RSVP Confirmation (validating deadline & required +1/+2/+3 names)
 */
export async function submitGuestRsvp(
  invitationId: string,
  payload: {
    members: InvitationMember[];
    selectedPlusOnesCount: number;
    plusOneNames: string[];
    notes?: string;
  }
): Promise<void> {
  const settings = await fetchGlobalSettings();
  if (!isModificationAllowed(settings.rsvpDeadline)) {
    throw new Error(
      'La fecha límite para modificar confirmaciones ha concluido.'
    );
  }

  // Check if any member is attending
  const anyAttending = payload.members.some((m) => m.status === 'attending');
  const effectivePlusOnesCount = anyAttending
    ? payload.selectedPlusOnesCount
    : 0;
  const cleanedPlusOneNames = payload.plusOneNames
    .slice(0, effectivePlusOnesCount)
    .map((n) => n.trim());

  if (effectivePlusOnesCount > 0) {
    for (let i = 0; i < effectivePlusOnesCount; i++) {
      if (!cleanedPlusOneNames[i]) {
        throw new Error(
          `Por favor ingresa el nombre completo del acompañante #${i + 1}.`
        );
      }
    }
  }

  const now = new Date().toISOString();
  const db = getDb();

  if (db) {
    const ref = doc(db, 'invitations', invitationId);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      throw new Error('No se encontró la invitación.');
    }
    const existing = snap.data() as InvitationRecord;
    const updated: InvitationRecord = {
      ...existing,
      members: payload.members,
      selectedPlusOnesCount: Math.min(
         existing.maxPlusOnes,
        effectivePlusOnesCount
      ),
      plusOneNames: cleanedPlusOneNames,
      notes: payload.notes ?? existing.notes ?? '',
      respondedAt: now,
    };
    await setDoc(ref, updated);
    return;
  }

  // Local fallback
  const all = getLocalInvitations();
  const idx = all.findIndex((i) => i.id === invitationId);
  if (idx === -1) throw new Error('No se encontró la invitación.');
  all[idx] = {
    ...all[idx],
    members: payload.members,
    selectedPlusOnesCount: Math.min(
      all[idx].maxPlusOnes,
      effectivePlusOnesCount
    ),
    plusOneNames: cleanedPlusOneNames,
    notes: payload.notes ?? all[idx].notes ?? '',
    respondedAt: now,
  };
  localStorage.setItem(LS_INVITATIONS_KEY, JSON.stringify(all));
  notifyLocalChange();
}

// ==================== DASHBOARD CRUD OPERATIONS ====================

export function subscribeToDashboardData(
  callback: (data: {
    settings: GlobalInvitationSettings;
    families: FamilyGroup[];
    invitations: InvitationRecord[];
  }) => void
): () => void {
  const db = getDb();
  if (db) {
    let settings = DEFAULT_SETTINGS;
    let families: FamilyGroup[] = [];
    let invitations: InvitationRecord[] = [];

    const emit = () => callback({ settings, families, invitations });

    const settingsRef = doc(db, 'settings', 'general');
    const unsubSettings = onSnapshot(settingsRef, (snap) => {
      if (snap.exists()) {
        settings = snap.data() as GlobalInvitationSettings;
        emit();
      } else {
        const initial: GlobalInvitationSettings = {
          ...DEFAULT_SETTINGS,
          updatedAt: new Date().toISOString(),
        };
        setDoc(settingsRef, initial).catch(() => {
          // ignore if rules block write
        });
        settings = initial;
        emit();
      }
    });

    const unsubFamilies = onSnapshot(collection(db, 'families'), (snap) => {
      families = snap.docs.map((d) => d.data() as FamilyGroup);
      emit();
    });

    const unsubInvs = onSnapshot(collection(db, 'invitations'), (snap) => {
      invitations = snap.docs.map((d) => d.data() as InvitationRecord);
      emit();
    });

    return () => {
      unsubSettings();
      unsubFamilies();
      unsubInvs();
    };
  }

  const emitLocal = () => {
    callback({
      settings: getLocalSettings(),
      families: getLocalFamilies(),
      invitations: getLocalInvitations(),
    });
  };
  emitLocal();
  window.addEventListener('cg-local-db-updated', emitLocal);
  window.addEventListener('storage', emitLocal);
  return () => {
    window.removeEventListener('cg-local-db-updated', emitLocal);
    window.removeEventListener('storage', emitLocal);
  };
}

export async function upsertFamilyGroup(family: FamilyGroup): Promise<void> {
  const db = getDb();
  if (db) {
    await setDoc(doc(db, 'families', family.id), family);
  }
  const all = getLocalFamilies();
  const idx = all.findIndex((f) => f.id === family.id);
  if (idx >= 0) all[idx] = family;
  else all.push(family);
  localStorage.setItem(LS_FAMILIES_KEY, JSON.stringify(all));
  notifyLocalChange();
}

export async function deleteFamilyGroup(familyId: string): Promise<void> {
  const db = getDb();
  if (db) {
    await deleteDoc(doc(db, 'families', familyId));
  }
  const all = getLocalFamilies().filter((f) => f.id !== familyId);
  localStorage.setItem(LS_FAMILIES_KEY, JSON.stringify(all));
  notifyLocalChange();
}

export async function upsertInvitationRecord(
  record: InvitationRecord
): Promise<void> {
  const db = getDb();
  if (db) {
    await setDoc(doc(db, 'invitations', record.id), record);
  }
  const all = getLocalInvitations();
  const idx = all.findIndex((i) => i.id === record.id);
  if (idx >= 0) all[idx] = record;
  else all.push(record);
  localStorage.setItem(LS_INVITATIONS_KEY, JSON.stringify(all));
  notifyLocalChange();
}

export async function deleteInvitationRecord(id: string): Promise<void> {
  const db = getDb();
  if (db) {
    await deleteDoc(doc(db, 'invitations', id));
  }
  const all = getLocalInvitations().filter((i) => i.id !== id);
  localStorage.setItem(LS_INVITATIONS_KEY, JSON.stringify(all));
  notifyLocalChange();
}

/**
 * Seeds or restores the "Familia Picapiedra" (4 invitations for 5 family members + 1 individual +3)
 * into Firebase Firestore and Local Storage.
 */
export async function seedPicapiedraExampleToDatabase(): Promise<void> {
  const seed = getInitialDemoSeed();
  const db = getDb();

  if (db) {
    const settingsSnap = await getDoc(doc(db, 'settings', 'general'));
    if (!settingsSnap.exists()) {
      await setDoc(doc(db, 'settings', 'general'), seed.settings);
    }
    for (const fam of seed.families) {
      await setDoc(doc(db, 'families', fam.id), fam);
    }
    for (const inv of seed.invitations) {
      await setDoc(doc(db, 'invitations', inv.id), inv);
    }
  }

  localStorage.setItem(LS_FAMILIES_KEY, JSON.stringify(seed.families));
  localStorage.setItem(LS_INVITATIONS_KEY, JSON.stringify(seed.invitations));
  notifyLocalChange();
}
