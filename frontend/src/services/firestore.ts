import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export type ProjectBudget = {
  min: number;
  max: number;
  currency: string;
};

export type ProjectRecord = {
  id?: string;
  ownerId: string;
  ownerRole?: 'user' | 'actor' | 'supplier';
  title: string;
  problemStatement?: string;
  description?: string;
  fullDetails?: string;
  category?: string;
  budget: ProjectBudget;
  timelineDays?: number;
  teamSize?: number;
  status?: string;
  requiredSkills?: string[];
  actorNeeded?: boolean;
  supplierNeeded?: boolean;
  [key: string]: unknown;
};

function toNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeSkills(skills: unknown): string[] {
  if (!Array.isArray(skills)) return [];
  return skills
    .map((skill) => String(skill || '').trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 40);
}

export async function createProjectRecord(input: ProjectRecord) {
  const id = String(input.id || '').trim();
  const projectRef = id ? doc(db, 'projects', id) : doc(collection(db, 'projects'));

  const payload = {
    ownerId: input.ownerId,
    ownerRole: input.ownerRole || 'user',
    title: input.title,
    problemStatement: input.problemStatement || input.description || '',
    description: input.description || '',
    fullDetails: input.fullDetails || '',
    category: input.category || 'General',
    budget: {
      min: toNumber(input.budget?.min, 0),
      max: toNumber(input.budget?.max, 0),
      currency: input.budget?.currency || 'USD',
    },
    timelineDays: toNumber(input.timelineDays, 0),
    teamSize: toNumber(input.teamSize, 1),
    status: input.status || 'open',
    requiredSkills: normalizeSkills(input.requiredSkills),
    actorNeeded: Boolean(input.actorNeeded ?? true),
    supplierNeeded: Boolean(input.supplierNeeded),
    innovationScore: toNumber(input.innovationScore, 0),
    noveltyScore: toNumber(input.noveltyScore, 0),
    successProbability: toNumber(input.successProbability, 0),
    fraudRisk: toNumber(input.fraudRisk, 0),
    scopeRisk: toNumber(input.scopeRisk, 0),
    trustScore: toNumber(input.trustScore, 0),
    pricingEstimate: input.pricingEstimate || null,
    applicationCount: toNumber(input.applicationCount, 0),
    milestoneCount: toNumber(input.milestoneCount, 0),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(projectRef, payload, { merge: true });
  return projectRef.id;
}

export async function saveProjectAIAnalysis(projectId: string, analysis: Record<string, unknown>) {
  const id = String(projectId || '').trim();
  if (!id) return;

  await setDoc(
    doc(db, 'ai_analysis', id),
    {
      projectId: id,
      ...analysis,
      generatedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );

  await setDoc(
    doc(db, 'projects', id),
    {
      innovationScore: toNumber(analysis.innovationScore, 0),
      noveltyScore: toNumber(analysis.noveltyScore, 0),
      successProbability: toNumber(analysis.successProbability, 0),
      fraudRisk: toNumber(analysis.fraudRisk, 0),
      chemistryScore: toNumber(analysis.chemistryScore, 0),
      scopeRisk: toNumber(analysis.scopeRisk, 0),
      trustScore: toNumber(analysis.trustScore, 0),
      pricingEstimate: analysis.pricingEstimate || null,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function createProjectApplication(projectId: string, payload: Record<string, unknown>) {
  const id = String(projectId || '').trim();
  if (!id) throw new Error('projectId is required');

  const appRef = doc(collection(db, 'applications'));
  const basePayload = {
    id: appRef.id,
    projectId: id,
    actorId: String(payload.actorId || ''),
    actorName: String(payload.actorName || ''),
    proposal: String(payload.proposal || ''),
    bidAmount: toNumber(payload.bidAmount, 0),
    etaDays: toNumber(payload.etaDays, 0),
    status: payload.status || 'pending',
    actorSnapshot: payload.actorSnapshot || {},
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(appRef, basePayload, { merge: true });
  await setDoc(doc(db, 'projects', id, 'applications', appRef.id), basePayload, { merge: true });
  return appRef.id;
}

export async function createMilestone(projectId: string, payload: Record<string, unknown>) {
  const id = String(projectId || '').trim();
  if (!id) throw new Error('projectId is required');

  const milestoneRef = doc(collection(db, 'milestones'));
  const basePayload = {
    id: milestoneRef.id,
    projectId: id,
    title: String(payload.title || ''),
    description: String(payload.description || ''),
    sequence: toNumber(payload.sequence, 1),
    amount: toNumber(payload.amount, 0),
    currency: String(payload.currency || 'USD'),
    status: String(payload.status || 'pending'),
    dueDate: payload.dueDate || null,
    escrowTxHash: payload.escrowTxHash || null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(milestoneRef, basePayload, { merge: true });
  await setDoc(doc(db, 'projects', id, 'milestones', milestoneRef.id), basePayload, { merge: true });
  return milestoneRef.id;
}

export async function storeBlockchainProof(projectId: string, payload: Record<string, unknown>) {
  const id = String(projectId || '').trim();
  if (!id) throw new Error('projectId is required');

  await setDoc(
    doc(db, 'blockchain_proofs', id),
    {
      projectId: id,
      ...payload,
      chainId: Number(payload.chainId || 80002),
      network: payload.network || 'polygon-amoy',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function sendChatMessage(roomId: string, payload: Record<string, unknown>) {
  const id = String(roomId || '').trim();
  if (!id) throw new Error('roomId is required');

  const roomRef = doc(db, 'chats', id);
  const messageRef = doc(collection(db, 'chats', id, 'messages'));
  const senderId = String(payload.senderId || '');

  await setDoc(
    roomRef,
    {
      roomId: id,
      projectId: payload.projectId || null,
      participants: Array.isArray(payload.participants) ? payload.participants : [],
      updatedAt: serverTimestamp(),
      lastMessage: {
        senderId,
        text: String(payload.text || ''),
        createdAt: serverTimestamp(),
      },
    },
    { merge: true },
  );

  await setDoc(
    messageRef,
    {
      id: messageRef.id,
      roomId: id,
      senderId,
      senderRole: payload.senderRole || 'user',
      text: String(payload.text || ''),
      attachmentUrl: payload.attachmentUrl || null,
      readBy: Array.isArray(payload.readBy) ? payload.readBy : [senderId],
      createdAt: serverTimestamp(),
    },
    { merge: true },
  );

  return messageRef.id;
}

export function subscribeChatMessages(
  roomId: string,
  onChange: (messages: Record<string, unknown>[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    query(collection(db, 'chats', roomId, 'messages'), orderBy('createdAt', 'asc')),
    (snapshot) => {
      const rows = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
      onChange(rows);
    },
    (error) => onError?.(error),
  );
}

export function subscribeNotifications(
  uid: string,
  onChange: (items: Record<string, unknown>[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    query(collection(db, 'notifications', uid, 'items'), orderBy('createdAt', 'desc')),
    (snapshot) => {
      const rows = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
      onChange(rows);
    },
    (error) => onError?.(error),
  );
}

export function subscribeProjectDashboard(
  projectId: string,
  onChange: (payload: {
    project: Record<string, unknown> | null;
    milestones: Record<string, unknown>[];
    applications: Record<string, unknown>[];
    aiAnalysis: Record<string, unknown> | null;
  }) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const unsubscribers: Unsubscribe[] = [];

  let project: Record<string, unknown> | null = null;
  let milestones: Record<string, unknown>[] = [];
  let applications: Record<string, unknown>[] = [];
  let aiAnalysis: Record<string, unknown> | null = null;

  const emit = () => onChange({ project, milestones, applications, aiAnalysis });

  unsubscribers.push(
    onSnapshot(
      doc(db, 'projects', projectId),
      (snapshot) => {
        project = snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
        emit();
      },
      (error) => onError?.(error),
    ),
  );

  unsubscribers.push(
    onSnapshot(
      query(collection(db, 'projects', projectId, 'milestones'), orderBy('sequence', 'asc')),
      (snapshot) => {
        milestones = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
        emit();
      },
      (error) => onError?.(error),
    ),
  );

  unsubscribers.push(
    onSnapshot(
      query(collection(db, 'projects', projectId, 'applications'), orderBy('createdAt', 'desc')),
      (snapshot) => {
        applications = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
        emit();
      },
      (error) => onError?.(error),
    ),
  );

  unsubscribers.push(
    onSnapshot(
      doc(db, 'ai_analysis', projectId),
      (snapshot) => {
        aiAnalysis = snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
        emit();
      },
      (error) => onError?.(error),
    ),
  );

  return () => {
    unsubscribers.forEach((unsubscribe) => unsubscribe());
  };
}

export async function fetchProjectDashboard(projectId: string) {
  const id = String(projectId || '').trim();
  if (!id) {
    return null;
  }

  const [projectSnap, milestoneSnap, applicationSnap, analysisSnap] = await Promise.all([
    getDoc(doc(db, 'projects', id)),
    getDocs(query(collection(db, 'projects', id, 'milestones'), orderBy('sequence', 'asc'))),
    getDocs(query(collection(db, 'projects', id, 'applications'), orderBy('createdAt', 'desc'))),
    getDoc(doc(db, 'ai_analysis', id)),
  ]);

  return {
    project: projectSnap.exists() ? { id: projectSnap.id, ...projectSnap.data() } : null,
    milestones: milestoneSnap.docs.map((item) => ({ id: item.id, ...item.data() })),
    applications: applicationSnap.docs.map((item) => ({ id: item.id, ...item.data() })),
    aiAnalysis: analysisSnap.exists() ? { id: analysisSnap.id, ...analysisSnap.data() } : null,
  };
}

export async function searchTalentBySkills(params: {
  role?: 'actor' | 'supplier';
  skills?: string[];
  location?: string;
  limit?: number;
  availability?: boolean;
}) {
  const role = params.role || 'actor';
  const snapshot = await getDocs(query(collection(db, 'users'), where('role', '==', role)));

  const requestedSkills = normalizeSkills(params.skills);
  const locationNeedle = String(params.location || '').toLowerCase();

  const rows: Array<Record<string, unknown> & { id: string }> = snapshot.docs.map((item) => ({
    id: item.id,
    ...(item.data() as Record<string, unknown>),
  }));

  return rows
    .filter((row) => {
      if (typeof params.availability === 'boolean' && Boolean(row.availability) !== params.availability) {
        return false;
      }

      if (locationNeedle && !String(row.location || '').toLowerCase().includes(locationNeedle)) {
        return false;
      }

      if (!requestedSkills.length) {
        return true;
      }

      const rowSkills = new Set(normalizeSkills(row.skills));
      return requestedSkills.every((skill) => rowSkills.has(skill));
    })
    .slice(0, params.limit || 25);
}
