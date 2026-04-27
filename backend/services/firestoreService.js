import admin, { adminDb } from '../firebaseAdmin.ts';

const { FieldValue } = admin.firestore;
const VALID_ROLES = new Set(['user', 'actor', 'supplier']);

function nowIso() {
  return new Date().toISOString();
}

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeRole(role) {
  return VALID_ROLES.has(String(role)) ? String(role) : 'user';
}

function normalizeSkills(skills) {
  if (!Array.isArray(skills)) return [];
  return skills
    .map((skill) => String(skill || '').trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 40);
}

function pickProjectSummary(analysis = {}) {
  return {
    innovationScore: toNumber(analysis.innovationScore, 0),
    noveltyScore: toNumber(analysis.noveltyScore, 0),
    successProbability: toNumber(analysis.successProbability, 0),
    fraudRisk: toNumber(analysis.fraudRisk, 0),
    chemistryScore: toNumber(analysis.chemistryScore, 0),
    scopeRisk: toNumber(analysis.scopeRisk, 0),
    trustScore: toNumber(analysis.trustScore, 0),
    pricingEstimate: analysis.pricingEstimate || null,
  };
}

function mapDocs(snapshot) {
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

export async function upsertUserProfile(payload = {}) {
  const uid = String(payload.uid || '').trim();
  if (!uid) throw new Error('uid is required');

  const profile = {
    uid,
    email: String(payload.email || ''),
    displayName: String(payload.displayName || ''),
    role: normalizeRole(payload.role),
    phone: String(payload.phone || ''),
    location: String(payload.location || ''),
    availability: payload.availability ?? true,
    walletAddress: String(payload.walletAddress || ''),
    skills: normalizeSkills(payload.skills),
    ratings: payload.ratings || { average: 0, count: 0 },
    trustScore: toNumber(payload.trustScore, 0),
    profile: payload.profile || {},
    updatedAt: FieldValue.serverTimestamp(),
    updatedAtIso: nowIso(),
  };

  if (payload.createdAt === true) {
    profile.createdAt = FieldValue.serverTimestamp();
    profile.createdAtIso = nowIso();
  }

  await adminDb.collection('users').doc(uid).set(profile, { merge: true });
  return { id: uid, ...profile, updatedAt: nowIso() };
}

export async function createProject(payload = {}) {
  const ownerId = String(payload.ownerId || '').trim();
  const title = String(payload.title || '').trim();

  if (!ownerId) throw new Error('ownerId is required');
  if (!title) throw new Error('title is required');

  const docRef = payload.projectId
    ? adminDb.collection('projects').doc(String(payload.projectId))
    : adminDb.collection('projects').doc();

  const requiredSkills = normalizeSkills(payload.requiredSkills || payload.skills);

  const projectData = {
    ownerId,
    ownerRole: normalizeRole(payload.ownerRole || 'user'),
    title,
    problemStatement: String(payload.problemStatement || payload.description || ''),
    description: String(payload.description || ''),
    fullDetails: String(payload.fullDetails || ''),
    category: String(payload.category || 'General'),
    budget: {
      min: toNumber(payload.budgetMin ?? payload.budget?.min ?? payload.budget, 0),
      max: toNumber(payload.budgetMax ?? payload.budget?.max ?? payload.budget, 0),
      currency: String(payload.currency || payload.budget?.currency || 'USD'),
    },
    timelineDays: toNumber(payload.timelineDays ?? payload.timeline, 0),
    teamSize: toNumber(payload.teamSize, 1),
    status: String(payload.status || 'open'),
    requiredSkills,
    domain: String(payload.domain || payload.category || 'General'),
    assignedActorId: payload.assignedActorId || null,
    supplierNeeded: Boolean(payload.supplierNeeded),
    actorNeeded: Boolean(payload.actorNeeded ?? true),
    innovationScore: toNumber(payload.innovationScore, 0),
    noveltyScore: toNumber(payload.noveltyScore, 0),
    successProbability: toNumber(payload.successProbability, 0),
    fraudRisk: toNumber(payload.fraudRisk, 0),
    scopeRisk: toNumber(payload.scopeRisk, 0),
    pricingEstimate: payload.pricingEstimate || null,
    trustScore: toNumber(payload.trustScore, 0),
    applicationCount: toNumber(payload.applicationCount, 0),
    milestoneCount: toNumber(payload.milestoneCount, 0),
    updatedAt: FieldValue.serverTimestamp(),
    createdAt: FieldValue.serverTimestamp(),
    updatedAtIso: nowIso(),
    createdAtIso: nowIso(),
  };

  await docRef.set(projectData, { merge: true });

  await adminDb
    .collection('users')
    .doc(ownerId)
    .collection('projectRefs')
    .doc(docRef.id)
    .set(
      {
        projectId: docRef.id,
        title,
        status: projectData.status,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

  return { id: docRef.id, ...projectData, createdAt: nowIso(), updatedAt: nowIso() };
}

export async function updateProject(projectId, payload = {}) {
  const id = String(projectId || '').trim();
  if (!id) throw new Error('projectId is required');

  const updates = {
    ...payload,
    ...(payload.requiredSkills ? { requiredSkills: normalizeSkills(payload.requiredSkills) } : {}),
    updatedAt: FieldValue.serverTimestamp(),
    updatedAtIso: nowIso(),
  };

  await adminDb.collection('projects').doc(id).set(updates, { merge: true });
  const doc = await adminDb.collection('projects').doc(id).get();
  return { id, ...doc.data() };
}

export async function applyToProject(projectId, payload = {}) {
  const id = String(projectId || '').trim();
  if (!id) throw new Error('projectId is required');

  const actorId = String(payload.actorId || '').trim();
  if (!actorId) throw new Error('actorId is required');

  const appRef = adminDb.collection('applications').doc();
  const projectRef = adminDb.collection('projects').doc(id);
  const projectAppRef = projectRef.collection('applications').doc(appRef.id);

  const record = {
    id: appRef.id,
    projectId: id,
    actorId,
    actorName: String(payload.actorName || ''),
    actorRole: normalizeRole(payload.actorRole || 'actor'),
    proposal: String(payload.proposal || ''),
    bidAmount: toNumber(payload.bidAmount, 0),
    etaDays: toNumber(payload.etaDays ?? payload.timeline, 0),
    status: String(payload.status || 'pending'),
    actorSnapshot: payload.actorSnapshot || {},
    createdAt: FieldValue.serverTimestamp(),
    createdAtIso: nowIso(),
    updatedAt: FieldValue.serverTimestamp(),
    updatedAtIso: nowIso(),
  };

  await adminDb.runTransaction(async (tx) => {
    const projectSnap = await tx.get(projectRef);
    if (!projectSnap.exists) throw new Error('Project not found');

    tx.set(appRef, record, { merge: true });
    tx.set(projectAppRef, record, { merge: true });

    const currentCount = toNumber(projectSnap.data()?.applicationCount, 0);
    tx.set(
      projectRef,
      {
        applicationCount: currentCount + 1,
        updatedAt: FieldValue.serverTimestamp(),
        updatedAtIso: nowIso(),
      },
      { merge: true },
    );
  });

  return record;
}

export async function createMilestone(projectId, payload = {}) {
  const id = String(projectId || '').trim();
  if (!id) throw new Error('projectId is required');

  const projectRef = adminDb.collection('projects').doc(id);
  const milestoneRef = adminDb.collection('milestones').doc();
  const projectMilestoneRef = projectRef.collection('milestones').doc(milestoneRef.id);

  const record = {
    id: milestoneRef.id,
    projectId: id,
    title: String(payload.title || `Milestone ${payload.sequence || 1}`),
    description: String(payload.description || ''),
    amount: toNumber(payload.amount, 0),
    currency: String(payload.currency || 'USD'),
    sequence: toNumber(payload.sequence, 1),
    status: String(payload.status || 'pending'),
    dueDate: payload.dueDate || null,
    fundedBy: payload.fundedBy || null,
    approvedBy: payload.approvedBy || null,
    escrowContractAddress: payload.escrowContractAddress || null,
    escrowTxHash: payload.escrowTxHash || null,
    releaseTxHash: payload.releaseTxHash || null,
    createdAt: FieldValue.serverTimestamp(),
    createdAtIso: nowIso(),
    updatedAt: FieldValue.serverTimestamp(),
    updatedAtIso: nowIso(),
  };

  await adminDb.runTransaction(async (tx) => {
    const projectSnap = await tx.get(projectRef);
    if (!projectSnap.exists) throw new Error('Project not found');

    tx.set(milestoneRef, record, { merge: true });
    tx.set(projectMilestoneRef, record, { merge: true });

    const milestoneCount = toNumber(projectSnap.data()?.milestoneCount, 0);
    tx.set(
      projectRef,
      {
        milestoneCount: milestoneCount + 1,
        updatedAt: FieldValue.serverTimestamp(),
        updatedAtIso: nowIso(),
      },
      { merge: true },
    );
  });

  return record;
}

export async function saveAIAnalysis(projectId, analysis = {}) {
  const id = String(projectId || '').trim();
  if (!id) throw new Error('projectId is required');

  const summary = pickProjectSummary(analysis);
  const analysisDoc = {
    projectId: id,
    ...analysis,
    ...summary,
    recommendedActors: Array.isArray(analysis.recommendedActors) ? analysis.recommendedActors : [],
    recoveryActions: Array.isArray(analysis.recoveryActions) ? analysis.recoveryActions : [],
    modelVersion: String(analysis.modelVersion || 'hackathon-v1'),
    generatedAt: FieldValue.serverTimestamp(),
    generatedAtIso: nowIso(),
    updatedAt: FieldValue.serverTimestamp(),
    updatedAtIso: nowIso(),
  };

  const projectRef = adminDb.collection('projects').doc(id);
  const analysisRef = adminDb.collection('ai_analysis').doc(id);

  await adminDb.runTransaction(async (tx) => {
    tx.set(analysisRef, analysisDoc, { merge: true });
    tx.set(
      projectRef,
      {
        ...summary,
        updatedAt: FieldValue.serverTimestamp(),
        updatedAtIso: nowIso(),
      },
      { merge: true },
    );
  });

  return analysisDoc;
}

export async function storeBlockchainProof(projectId, payload = {}) {
  const id = String(projectId || '').trim();
  if (!id) throw new Error('projectId is required');

  const proof = {
    projectId: id,
    ideaHash: payload.ideaHash || null,
    txHash: payload.txHash || null,
    escrowContractAddress: payload.escrowContractAddress || null,
    ndaHash: payload.ndaHash || null,
    chainId: Number(payload.chainId || 80002),
    network: payload.network || 'polygon-amoy',
    proofType: payload.proofType || 'idea_ownership',
    createdBy: payload.createdBy || null,
    createdAt: FieldValue.serverTimestamp(),
    createdAtIso: nowIso(),
    updatedAt: FieldValue.serverTimestamp(),
    updatedAtIso: nowIso(),
  };

  await adminDb.collection('blockchain_proofs').doc(id).set(proof, { merge: true });

  await adminDb
    .collection('projects')
    .doc(id)
    .set(
      {
        blockchain: {
          proofStored: true,
          txHash: proof.txHash,
          chainId: proof.chainId,
          network: proof.network,
          updatedAtIso: nowIso(),
        },
        updatedAt: FieldValue.serverTimestamp(),
        updatedAtIso: nowIso(),
      },
      { merge: true },
    );

  return proof;
}

export async function storeReview(payload = {}) {
  const fromUid = String(payload.fromUid || '').trim();
  const toUid = String(payload.toUid || '').trim();
  const projectId = String(payload.projectId || '').trim();

  if (!fromUid || !toUid || !projectId) {
    throw new Error('fromUid, toUid and projectId are required');
  }

  const rating = Math.max(1, Math.min(5, toNumber(payload.rating, 5)));
  const reviewRef = adminDb.collection('reviews').doc();
  const reputationRef = adminDb.collection('reputation').doc(toUid);
  const userRef = adminDb.collection('users').doc(toUid);

  const reviewRecord = {
    id: reviewRef.id,
    fromUid,
    toUid,
    projectId,
    roleContext: payload.roleContext || 'actor',
    rating,
    comment: String(payload.comment || ''),
    tags: Array.isArray(payload.tags) ? payload.tags.slice(0, 10) : [],
    createdAt: FieldValue.serverTimestamp(),
    createdAtIso: nowIso(),
  };

  await adminDb.runTransaction(async (tx) => {
    const reputationSnap = await tx.get(reputationRef);
    const existing = reputationSnap.exists ? reputationSnap.data() : {};

    const ratingsCount = toNumber(existing?.ratingsCount, 0) + 1;
    const ratingsTotal = toNumber(existing?.ratingsTotal, 0) + rating;
    const averageRating = Number((ratingsTotal / ratingsCount).toFixed(3));
    const completedProjects = toNumber(existing?.completedProjects, 0);
    const disputeCount = toNumber(existing?.disputeCount, 0);

    const trustScore = Number(
      Math.max(0, Math.min(1, averageRating / 5 * 0.7 + Math.min(completedProjects, 20) / 20 * 0.25 - Math.min(disputeCount, 10) / 100)).toFixed(3),
    );

    tx.set(reviewRef, reviewRecord, { merge: true });

    tx.set(
      reputationRef,
      {
        uid: toUid,
        ratingsCount,
        ratingsTotal,
        averageRating,
        completedProjects,
        disputeCount,
        trustScore,
        updatedAt: FieldValue.serverTimestamp(),
        updatedAtIso: nowIso(),
      },
      { merge: true },
    );

    tx.set(
      userRef,
      {
        ratings: { average: averageRating, count: ratingsCount },
        trustScore,
        updatedAt: FieldValue.serverTimestamp(),
        updatedAtIso: nowIso(),
      },
      { merge: true },
    );
  });

  return reviewRecord;
}

export async function createNotification(uid, payload = {}) {
  const userId = String(uid || '').trim();
  if (!userId) throw new Error('uid is required');

  const ref = adminDb.collection('notifications').doc(userId).collection('items').doc();
  const record = {
    id: ref.id,
    uid: userId,
    type: String(payload.type || 'system'),
    title: String(payload.title || 'Notification'),
    body: String(payload.body || ''),
    deepLink: String(payload.deepLink || ''),
    read: Boolean(payload.read || false),
    metadata: payload.metadata || {},
    createdAt: FieldValue.serverTimestamp(),
    createdAtIso: nowIso(),
  };

  await ref.set(record, { merge: true });
  return record;
}

export async function sendChatMessage(roomId, payload = {}) {
  const id = String(roomId || '').trim();
  const senderId = String(payload.senderId || '').trim();
  if (!id) throw new Error('roomId is required');
  if (!senderId) throw new Error('senderId is required');

  const participants = Array.isArray(payload.participants)
    ? payload.participants.map((v) => String(v)).filter(Boolean).slice(0, 20)
    : [];

  const roomRef = adminDb.collection('chats').doc(id);
  const messageRef = roomRef.collection('messages').doc();

  const message = {
    id: messageRef.id,
    roomId: id,
    senderId,
    senderRole: normalizeRole(payload.senderRole || 'user'),
    text: String(payload.text || ''),
    attachmentUrl: payload.attachmentUrl || null,
    readBy: Array.isArray(payload.readBy) ? payload.readBy : [senderId],
    createdAt: FieldValue.serverTimestamp(),
    createdAtIso: nowIso(),
  };

  await adminDb.runTransaction(async (tx) => {
    tx.set(
      roomRef,
      {
        roomId: id,
        projectId: payload.projectId || null,
        participants,
        updatedAt: FieldValue.serverTimestamp(),
        updatedAtIso: nowIso(),
        lastMessage: {
          text: message.text,
          senderId,
          createdAtIso: nowIso(),
        },
      },
      { merge: true },
    );

    tx.set(messageRef, message, { merge: true });
  });

  return message;
}

export async function getChatMessages(roomId, limit = 50) {
  const id = String(roomId || '').trim();
  if (!id) throw new Error('roomId is required');

  const snapshot = await adminDb
    .collection('chats')
    .doc(id)
    .collection('messages')
    .orderBy('createdAt', 'desc')
    .limit(Math.max(1, Math.min(200, Number(limit) || 50)))
    .get();

  return mapDocs(snapshot).reverse();
}

export async function getProjectDashboard(projectId) {
  const id = String(projectId || '').trim();
  if (!id) throw new Error('projectId is required');

  const projectRef = adminDb.collection('projects').doc(id);
  const projectSnap = await projectRef.get();

  if (!projectSnap.exists) {
    return null;
  }

  const [milestonesSnap, applicationsSnap, documentsSnap, reviewsSnap, analysisSnap, blockchainSnap] = await Promise.all([
    projectRef.collection('milestones').orderBy('sequence', 'asc').limit(100).get(),
    projectRef.collection('applications').orderBy('createdAt', 'desc').limit(100).get(),
    projectRef.collection('documents').orderBy('createdAt', 'desc').limit(100).get(),
    adminDb.collection('reviews').where('projectId', '==', id).limit(100).get(),
    adminDb.collection('ai_analysis').doc(id).get(),
    adminDb.collection('blockchain_proofs').doc(id).get(),
  ]);

  return {
    project: { id: projectSnap.id, ...projectSnap.data() },
    milestones: mapDocs(milestonesSnap),
    applications: mapDocs(applicationsSnap),
    documents: mapDocs(documentsSnap),
    reviews: mapDocs(reviewsSnap),
    aiAnalysis: analysisSnap.exists ? { id: analysisSnap.id, ...analysisSnap.data() } : null,
    blockchainProof: blockchainSnap.exists ? { id: blockchainSnap.id, ...blockchainSnap.data() } : null,
  };
}

export async function searchTalent({
  role = 'actor',
  skills = [],
  location = '',
  availability = null,
  limit = 30,
} = {}) {
  let query = adminDb.collection('users').where('role', '==', normalizeRole(role));

  if (availability !== null) {
    query = query.where('availability', '==', Boolean(availability));
  }

  const snapshot = await query.limit(Math.max(1, Math.min(100, Number(limit) || 30))).get();
  const requestedSkills = normalizeSkills(skills);
  const lcLocation = String(location || '').toLowerCase().trim();

  const rows = snapshot.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }))
    .filter((row) => {
      if (lcLocation && !String(row.location || '').toLowerCase().includes(lcLocation)) {
        return false;
      }

      if (!requestedSkills.length) return true;
      const skillSet = new Set(normalizeSkills(row.skills));
      return requestedSkills.every((skill) => skillSet.has(skill));
    });

  return rows;
}

export async function queryProjects({
  ownerId,
  status,
  category,
  skill,
  limit = 30,
} = {}) {
  let query = adminDb.collection('projects');

  if (ownerId) query = query.where('ownerId', '==', String(ownerId));
  if (status) query = query.where('status', '==', String(status));
  if (category) query = query.where('category', '==', String(category));

  const snapshot = await query.orderBy('updatedAt', 'desc').limit(Math.max(1, Math.min(100, Number(limit) || 30))).get();

  const rows = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  if (!skill) return rows;

  const needle = String(skill).trim().toLowerCase();
  return rows.filter((row) => normalizeSkills(row.requiredSkills).includes(needle));
}
