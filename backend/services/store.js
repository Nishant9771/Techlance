import { adminDb } from '../firebaseAdmin.ts';
import { demoActors, demoIdeas, demoProjects, demoReputationScores } from '../ml/demoData.js';

const memoryStore = {
  ideas: new Map(demoIdeas.map((item) => [item.id, item])),
  actors: new Map(demoActors.map((item) => [item.id, item])),
  projects: new Map(demoProjects.map((item) => [item.id, item])),
  reputationScores: new Map(demoReputationScores.map((item) => [item.id, item])),
  embeddings: new Map(),
};

function isPermissionError(error) {
  const message = String(error?.message || '');
  return /PERMISSION_DENIED|UNAUTHENTICATED|insufficient permissions|Missing or insufficient permissions/i.test(message);
}

function toCollectionMap(collection) {
  if (!memoryStore[collection]) {
    memoryStore[collection] = new Map();
  }
  return memoryStore[collection];
}

export async function upsertDoc(collection, id, payload) {
  const docId = String(id || `${collection}_${Date.now()}`);
  const record = {
    id: docId,
    ...payload,
    updatedAt: new Date().toISOString(),
  };

  try {
    await adminDb.collection(collection).doc(docId).set(record, { merge: true });
    return { id: docId, data: record, storage: 'firestore' };
  } catch (error) {
    if (!isPermissionError(error)) throw error;
    toCollectionMap(collection).set(docId, record);
    return { id: docId, data: record, storage: 'memory' };
  }
}

export async function getDoc(collection, id) {
  const docId = String(id || '');
  if (!docId) return null;

  try {
    const snap = await adminDb.collection(collection).doc(docId).get();
    if (snap.exists) {
      return { id: snap.id, ...snap.data(), _storage: 'firestore' };
    }
  } catch (error) {
    if (!isPermissionError(error)) throw error;
  }

  const local = toCollectionMap(collection).get(docId);
  return local ? { ...local, _storage: 'memory' } : null;
}

export async function listDocs(collection, limit = 100) {
  const safeLimit = Math.max(1, Math.min(500, Number(limit) || 100));

  try {
    const snapshot = await adminDb.collection(collection).limit(safeLimit).get();
    const rows = [];
    snapshot.forEach((doc) => rows.push({ id: doc.id, ...doc.data(), _storage: 'firestore' }));
    if (rows.length > 0) {
      return rows;
    }
  } catch (error) {
    if (!isPermissionError(error)) throw error;
  }

  return Array.from(toCollectionMap(collection).values()).slice(0, safeLimit).map((row) => ({
    ...row,
    _storage: 'memory',
  }));
}

export async function ensureSeedData() {
  const seedPlans = [
    { collection: 'ideas', rows: demoIdeas },
    { collection: 'actors', rows: demoActors },
    { collection: 'projects', rows: demoProjects },
    { collection: 'reputationScores', rows: demoReputationScores },
  ];

  const report = [];

  for (const plan of seedPlans) {
    const existing = await listDocs(plan.collection, 3);
    if (existing.length > 0) {
      report.push({ collection: plan.collection, seeded: 0, skipped: true });
      continue;
    }

    let count = 0;
    for (const row of plan.rows) {
      await upsertDoc(plan.collection, row.id, row);
      count += 1;
    }

    report.push({ collection: plan.collection, seeded: count, skipped: false });
  }

  return report;
}
