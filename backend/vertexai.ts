import express, { type Request, type Response } from 'express';
import {GoogleAuth} from 'google-auth-library';
import { adminDb } from './firebaseAdmin';

const router = express.Router();

const location = process.env.VERTEX_LOCATION || 'us-central1';
const localEmbeddings = new Map<string, any>();
const localActorEmbeddings = new Map<string, any>();

function getProjectId() {
  return process.env.GCP_PROJECT || process.env.GOOGLE_CLOUD_PROJECT || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '';
}

function getDefaultRankingEndpointId() {
  return process.env.VERTEX_RANKING_ENDPOINT_ID || '';
}

function getDefaultBidEndpointId() {
  return process.env.VERTEX_BID_ENDPOINT_ID || '';
}

function getDefaultProjectSuccessEndpointId() {
  return process.env.VERTEX_PROJECT_SUCCESS_ENDPOINT_ID || '';
}

const getAccessToken = async () => {
  const auth = new GoogleAuth({scopes: ['https://www.googleapis.com/auth/cloud-platform']});
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  return token.token ?? token;
};

function getHttpStatusForError(err: any) {
  const msg = String(err?.message || '');
  if (/PERMISSION_DENIED|insufficient permissions|Missing or insufficient permissions/i.test(msg)) return 403;
  if (/not found|NOT_FOUND/i.test(msg)) return 404;
  if (/invalid|INVALID_ARGUMENT/i.test(msg)) return 400;
  return 500;
}

function getActionHintForError(err: any) {
  const msg = String(err?.message || '');
  if (/PERMISSION_DENIED|insufficient permissions|Missing or insufficient permissions/i.test(msg)) {
    return 'Grant IAM roles to backend service account: Vertex AI User and Cloud Datastore User.';
  }
  if (/Could not load the default credentials/i.test(msg)) {
    return 'Set GOOGLE_APPLICATION_CREDENTIALS to a valid service-account JSON key.';
  }
  if (/not found|NOT_FOUND/i.test(msg) && /models\//i.test(msg)) {
    return 'Use a supported embedding model, for example text-embedding-004.';
  }
  return undefined;
}

function isFirestorePermissionError(err: any) {
  const msg = String(err?.message || '');
  return /PERMISSION_DENIED|Missing or insufficient permissions|insufficient permissions/i.test(msg);
}

function clamp(value: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function parseMoney(value: any): number {
  const normalized = String(value ?? '').replace(/[^0-9.]/g, '');
  const num = Number(normalized);
  return Number.isFinite(num) ? num : 0;
}

function parseDays(value: any): number {
  const match = String(value ?? '').match(/\d+/);
  if (!match) return 0;
  const num = Number(match[0]);
  return Number.isFinite(num) ? num : 0;
}

function successBand(probability: number) {
  if (probability >= 0.75) return 'High';
  if (probability >= 0.5) return 'Medium';
  return 'Low';
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function normalizeStringArray(value: any): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item ?? '').trim()).filter(Boolean);
  }
  if (typeof value === 'string') {
    return value.split(',').map((item) => item.trim()).filter(Boolean);
  }
  return [];
}

function pickNestedNumber(record: any, keys: string[], fallback = 0) {
  const containers = [record, record?.profileDetails, record?.stats, record?.profileDetails?.stats];
  for (const container of containers) {
    if (!container || typeof container !== 'object') continue;
    for (const key of keys) {
      const value = Number(container[key]);
      if (Number.isFinite(value)) return value;
    }
  }
  return fallback;
}

function pickNestedText(record: any, keys: string[]) {
  const containers = [record, record?.profileDetails, record?.stats, record?.profileDetails?.stats];
  for (const container of containers) {
    if (!container || typeof container !== 'object') continue;
    for (const key of keys) {
      const value = container[key];
      if (typeof value === 'string' && value.trim()) return value.trim();
    }
  }
  return '';
}

function inferCategoryComplexity(category: any) {
  const text = String(category ?? '').toLowerCase();
  if (!text) return 0.58;
  if (/ai|machine learning|robotics|computer vision|hardware|iot|firmware|embedded/.test(text)) return 0.85;
  if (/mechanical|civil|manufacturing|pcb|electronics/.test(text)) return 0.72;
  if (/web|frontend|backend|app|software/.test(text)) return 0.56;
  return 0.62;
}

function buildProjectSuccessReasons(metrics: {
  talentFit: number;
  topActorSimilarity: number;
  scopeClarity: number;
  budgetFeasibility: number;
  timelineFeasibility: number;
  novelty: number;
  maxSimilarity: number;
  creatorReadiness: number;
  ndaRequired: boolean;
}) {
  const reasons: Array<{ impact: 'positive' | 'negative' | 'neutral'; label: string; detail: string }> = [];

  if (metrics.talentFit >= 0.7) {
    reasons.push({
      impact: 'positive',
      label: 'Strong actor fit',
      detail: `Existing actor profiles align well with the project, led by a ${(metrics.topActorSimilarity * 100).toFixed(0)}% top match.`,
    });
  } else if (metrics.talentFit < 0.45) {
    reasons.push({
      impact: 'negative',
      label: 'Limited talent coverage',
      detail: 'Current actor embeddings show a relatively thin talent pool for this scope.',
    });
  }

  if (metrics.scopeClarity >= 0.72) {
    reasons.push({
      impact: 'positive',
      label: 'Clear project brief',
      detail: 'The description, locked details, and skills list give collaborators a strong starting point.',
    });
  } else if (metrics.scopeClarity < 0.45) {
    reasons.push({
      impact: 'negative',
      label: 'Brief needs detail',
      detail: 'Adding more deliverables, technical constraints, and skills would improve project conversion.',
    });
  }

  if (metrics.budgetFeasibility >= 0.72) {
    reasons.push({
      impact: 'positive',
      label: 'Budget looks workable',
      detail: 'The posted budget is aligned with the estimated complexity of the project.',
    });
  } else if (metrics.budgetFeasibility < 0.45) {
    reasons.push({
      impact: 'negative',
      label: 'Budget may be tight',
      detail: 'The current budget looks lean relative to the scope and technical complexity.',
    });
  }

  if (metrics.timelineFeasibility >= 0.72) {
    reasons.push({
      impact: 'positive',
      label: 'Timeline looks realistic',
      detail: 'The requested schedule appears achievable for the stated scope.',
    });
  } else if (metrics.timelineFeasibility < 0.45) {
    reasons.push({
      impact: 'negative',
      label: 'Timeline looks aggressive',
      detail: 'The planned delivery window may be too short for the amount of work described.',
    });
  }

  if (metrics.novelty >= 0.75) {
    reasons.push({
      impact: 'positive',
      label: 'Differentiated idea',
      detail: 'The project stands out from similar ideas already stored in the platform.',
    });
  } else if (metrics.maxSimilarity > 0.85) {
    reasons.push({
      impact: 'negative',
      label: 'Crowded project space',
      detail: 'The post overlaps strongly with existing ideas, which can reduce differentiation.',
    });
  }

  if (metrics.creatorReadiness >= 0.7) {
    reasons.push({
      impact: 'positive',
      label: 'Strong creator signal',
      detail: 'The project owner profile suggests good readiness to execute and manage the project.',
    });
  } else if (metrics.creatorReadiness < 0.45) {
    reasons.push({
      impact: 'negative',
      label: 'Owner signal is light',
      detail: 'A more complete creator profile would increase trust and improve project follow-through.',
    });
  }

  if (metrics.ndaRequired) {
    reasons.push({
      impact: 'neutral',
      label: 'NDA gate enabled',
      detail: 'The NDA improves idea protection, but it can slightly reduce early response volume.',
    });
  }

  if (reasons.length === 0) {
    reasons.push({
      impact: 'neutral',
      label: 'Balanced project setup',
      detail: 'The project does not show major risk spikes, but stronger detail or market fit could improve confidence.',
    });
  }

  return reasons.slice(0, 4);
}

function extractFirstNumber(x: any): number | null {
  const visited = new Set<any>();
  function walk(obj: any): number | null {
    if (obj === null || obj === undefined || visited.has(obj)) return null;
    if (typeof obj === 'number' && Number.isFinite(obj)) return obj;
    if (typeof obj !== 'object') return null;
    visited.add(obj);
    if (Array.isArray(obj)) {
      for (const item of obj) {
        const found = walk(item);
        if (found !== null) return found;
      }
      return null;
    }
    for (const key of Object.keys(obj)) {
      const found = walk(obj[key]);
      if (found !== null) return found;
    }
    return null;
  }
  return walk(x);
}

function generateLocalId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

async function saveEmbeddingRecord(id: string, payload: any) {
  try {
    await adminDb.collection('embeddings').doc(id).set(payload);
    return { storage: 'firestore' as const };
  } catch (err: any) {
    if (isFirestorePermissionError(err)) {
      localEmbeddings.set(id, { id, ...payload });
      return { storage: 'local-fallback' as const };
    }
    throw err;
  }
}

async function getEmbeddingRecord(id: string) {
  try {
    const doc = await adminDb.collection('embeddings').doc(id).get();
    if (doc.exists) {
      return { item: { id: doc.id, ...doc.data() }, storage: 'firestore' as const };
    }
  } catch (err: any) {
    if (!isFirestorePermissionError(err)) throw err;
  }

  const local = localEmbeddings.get(id);
  if (local) {
    return { item: local, storage: 'local-fallback' as const };
  }
  return { item: null, storage: 'none' as const };
}

async function listEmbeddingRecords() {
  try {
    const snap = await adminDb.collection('embeddings').get();
    const items: any[] = [];
    snap.forEach((d: FirebaseFirestore.QueryDocumentSnapshot) => items.push({ id: d.id, ...d.data() }));
    return { items, storage: 'firestore' as const };
  } catch (err: any) {
    if (!isFirestorePermissionError(err)) throw err;
    return { items: Array.from(localEmbeddings.values()), storage: 'local-fallback' as const };
  }
}

async function saveActorEmbeddingRecord(actorId: string, payload: any) {
  try {
    await adminDb.collection('actorEmbeddings').doc(actorId).set(payload);
    return { storage: 'firestore' as const };
  } catch (err: any) {
    if (isFirestorePermissionError(err)) {
      localActorEmbeddings.set(actorId, { actorId, ...payload });
      return { storage: 'local-fallback' as const };
    }
    throw err;
  }
}

async function getActorEmbeddingRecord(actorId: string) {
  try {
    const doc = await adminDb.collection('actorEmbeddings').doc(actorId).get();
    if (doc.exists) {
      return { item: { actorId: doc.id, ...doc.data() }, storage: 'firestore' as const };
    }
  } catch (err: any) {
    if (!isFirestorePermissionError(err)) throw err;
  }

  const local = localActorEmbeddings.get(actorId);
  if (local) {
    return { item: local, storage: 'local-fallback' as const };
  }
  return { item: null, storage: 'none' as const };
}

async function listActorEmbeddingRecords(candidateIds?: string[]) {
  if (candidateIds && candidateIds.length > 0) {
    const items: any[] = [];
    for (const id of candidateIds) {
      const { item } = await getActorEmbeddingRecord(id);
      if (item) items.push(item);
    }
    return { items, storage: 'mixed' as const };
  }

  try {
    const snap = await adminDb.collection('actorEmbeddings').get();
    const items: any[] = [];
    snap.forEach((d: FirebaseFirestore.QueryDocumentSnapshot) => items.push({ actorId: d.id, ...d.data() }));
    return { items, storage: 'firestore' as const };
  } catch (err: any) {
    if (!isFirestorePermissionError(err)) throw err;
    return { items: Array.from(localActorEmbeddings.values()), storage: 'local-fallback' as const };
  }
}

async function getUserProfileRecord(uid: string) {
  try {
    const doc = await adminDb.collection('users').doc(uid).get();
    if (doc.exists) return doc.data();
    return null;
  } catch (err: any) {
    if (isFirestorePermissionError(err)) return null;
    throw err;
  }
}

async function getProjectPostRecord(postId: string) {
  try {
    const doc = await adminDb.collection('projectPosts').doc(postId).get();
    if (doc.exists) return doc.data();
    return null;
  } catch (err: any) {
    if (isFirestorePermissionError(err)) return null;
    throw err;
  }
}

async function embedTextWithVertex(input: string, model = 'text-embedding-004') {
  const projectId = getProjectId();
  if (!projectId) {
    throw new Error('Missing GCP project configuration. Set GCP_PROJECT or GOOGLE_CLOUD_PROJECT.');
  }
  const accessToken = await getAccessToken();
  const url = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${model}:predict`;
  const body = {instances: [{content: input, mime_type: 'text/plain'}]};
  const res = await fetch(url, {method: 'POST', headers: {Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json'}, body: JSON.stringify(body)});
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message || `Vertex embeddings request failed with status ${res.status}`);
  }
  // Try to extract first numeric array found in response
  const vector = extractFirstNumericArray(data);
  if (!vector) {
    throw new Error('Embedding vector not found in Vertex response.');
  }
  return {data, vector};
}

async function checkVertexEmbeddingsHealth() {
  const out = await embedTextWithVertex('health probe: vertex embeddings');
  return {
    ok: Array.isArray(out.vector) && out.vector.length > 0,
    vectorLength: out.vector?.length ?? 0,
  };
}

async function checkFirestoreReadHealth() {
  const snap = await adminDb.collection('embeddings').limit(1).get();
  return { ok: true, sampledDocs: snap.size };
}

async function checkFirestoreWriteHealth() {
  const ref = adminDb.collection('_healthchecks').doc('vertex-health');
  await ref.set({ updatedAt: new Date(), source: 'api/vertex/health' }, { merge: true });
  return { ok: true };
}

async function checkRankingEndpointHealth(endpointId: string) {
  const projectId = getProjectId();
  if (!projectId) throw new Error('GCP project not configured');
  const accessToken = await getAccessToken();
  const url = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/endpoints/${endpointId}`;
  const r = await fetch(url, { method: 'GET', headers: { Authorization: `Bearer ${accessToken}` } });
  const data = await r.json();
  if (!r.ok) {
    throw new Error(data?.error?.message || `Endpoint check failed with status ${r.status}`);
  }
  return { ok: true, displayName: data?.displayName || '', name: data?.name || '' };
}

router.get('/health', async (_req: Request, res: Response) => {
  const projectId = getProjectId();
  const endpointId = getDefaultRankingEndpointId();
  const bidEndpointId = getDefaultBidEndpointId();
  const projectSuccessEndpointId = getDefaultProjectSuccessEndpointId();

  const response: any = {
    ok: true,
    env: {
      projectId: projectId || null,
      location,
      hasGoogleCredentials: Boolean(process.env.GOOGLE_APPLICATION_CREDENTIALS),
      rankingEndpointConfigured: Boolean(endpointId),
      bidEndpointConfigured: Boolean(bidEndpointId),
      projectSuccessEndpointConfigured: Boolean(projectSuccessEndpointId),
    },
    checks: {},
  };

  try {
    response.checks.vertexEmbeddings = await checkVertexEmbeddingsHealth();
  } catch (err: any) {
    response.ok = false;
    response.checks.vertexEmbeddings = {
      ok: false,
      error: err.message,
      hint: getActionHintForError(err),
    };
  }

  try {
    response.checks.firestoreRead = await checkFirestoreReadHealth();
  } catch (err: any) {
    response.ok = false;
    response.checks.firestoreRead = {
      ok: false,
      error: err.message,
      hint: getActionHintForError(err),
    };
  }

  try {
    response.checks.firestoreWrite = await checkFirestoreWriteHealth();
  } catch (err: any) {
    response.ok = false;
    response.checks.firestoreWrite = {
      ok: false,
      error: err.message,
      hint: getActionHintForError(err),
    };
  }

  if (endpointId) {
    try {
      response.checks.rankingEndpoint = await checkRankingEndpointHealth(endpointId);
    } catch (err: any) {
      response.ok = false;
      response.checks.rankingEndpoint = {
        ok: false,
        error: err.message,
        hint: getActionHintForError(err),
      };
    }
  } else {
    response.checks.rankingEndpoint = {
      ok: false,
      error: 'VERTEX_RANKING_ENDPOINT_ID is not configured',
      hint: 'Set VERTEX_RANKING_ENDPOINT_ID in .env.local after deploying your ranking model.',
    };
  }

  if (bidEndpointId) {
    try {
      response.checks.bidEndpoint = await checkRankingEndpointHealth(bidEndpointId);
    } catch (err: any) {
      response.ok = false;
      response.checks.bidEndpoint = {
        ok: false,
        error: err.message,
        hint: getActionHintForError(err),
      };
    }
  } else {
    response.checks.bidEndpoint = {
      ok: false,
      error: 'VERTEX_BID_ENDPOINT_ID is not configured',
      hint: 'Set VERTEX_BID_ENDPOINT_ID in .env.local after deploying your bid-success model.',
    };
  }

  if (projectSuccessEndpointId) {
    try {
      response.checks.projectSuccessEndpoint = await checkRankingEndpointHealth(projectSuccessEndpointId);
    } catch (err: any) {
      response.ok = false;
      response.checks.projectSuccessEndpoint = {
        ok: false,
        error: err.message,
        hint: getActionHintForError(err),
      };
    }
  } else {
    response.checks.projectSuccessEndpoint = {
      ok: false,
      error: 'VERTEX_PROJECT_SUCCESS_ENDPOINT_ID is not configured',
      hint: 'Set VERTEX_PROJECT_SUCCESS_ENDPOINT_ID in .env.local after deploying your project-success model.',
    };
  }

  return res.status(200).json(response);
});

function extractFirstNumericArray(x:any): number[] | null {
  const visited = new Set<any>();
  function walk(obj:any): number[] | null {
    if (!obj || visited.has(obj)) return null;
    visited.add(obj);
    if (Array.isArray(obj)) {
      if (obj.length > 0 && typeof obj[0] === 'number' && obj.every((v:any)=>typeof v==='number' && Number.isFinite(v))) return obj as number[];
      for (const item of obj) {
        const found = walk(item);
        if (found) return found;
      }
    } else if (typeof obj === 'object') {
      for (const k of Object.keys(obj)) {
        const found = walk(obj[k]);
        if (found) return found;
      }
    }
    return null;
  }
  return walk(x);
}

// Compute embedding only
router.post('/embeddings', async (req: Request, res: Response) => {
  try {
    const {input, model} = req.body;
    if (!input) return res.status(400).json({error: 'input required'});
    const out = await embedTextWithVertex(input, model);
    res.json(out);
  } catch (err:any) {
    res.status(getHttpStatusForError(err)).json({error: err.message, hint: getActionHintForError(err)});
  }
});

// Compute embedding and store for a post
router.post('/embeddings/store', async (req: Request, res: Response) => {
  try {
    const {postId, text, meta = {}, model} = req.body;
    if (!text) return res.status(400).json({error: 'text required'});
    const {vector, data} = await embedTextWithVertex(text, model);
    if (!vector) return res.status(500).json({error: 'could not extract embedding', raw: data});
    const id = String(postId || generateLocalId('emb'));
    const saveResult = await saveEmbeddingRecord(id, {vector, meta, text, updatedAt: new Date()});
    res.json({id, vector, storage: saveResult.storage});
  } catch (err:any) {
    res.status(getHttpStatusForError(err)).json({error: err.message, hint: getActionHintForError(err)});
  }
});

// Return nearest embeddings to provided vector
router.post('/embeddings/nearest', async (req: Request, res: Response) => {
  try {
    const {vector, k = 8} = req.body;
    if (!vector) return res.status(400).json({error: 'vector required'});
    const { items, storage } = await listEmbeddingRecords();
    const scored = items.map(it => ({...it, score: cosineSimilarity(vector, it.vector)}));
    scored.sort((a,b)=>b.score-a.score);
    res.json({items: scored.slice(0, k), storage});
  } catch (err:any) {
    res.status(getHttpStatusForError(err)).json({error: err.message, hint: getActionHintForError(err)});
  }
});

// Novelty score for a stored post id
router.get('/novelty/:postId', async (req: Request, res: Response) => {
  try {
    const {postId} = req.params;
    const { item: base, storage: baseStorage } = await getEmbeddingRecord(postId);
    if (!base) return res.status(404).json({error: 'not found'});
    const vector = base?.vector;
    if (!vector) return res.status(500).json({error: 'no vector stored for this post'});
    const { items, storage: listStorage } = await listEmbeddingRecords();
    const others = items.filter((d: any) => d.id !== postId);
    const scored = others.map(it => ({id: it.id, score: cosineSimilarity(vector, it.vector), meta: it.meta || {}})).sort((a,b)=>b.score-a.score);
    const top = scored[0];
    const novelty = 1 - (top?.score ?? 0);
    res.json({novelty, topSimilar: scored.slice(0,10), storage: baseStorage === 'firestore' && listStorage === 'firestore' ? 'firestore' : 'local-fallback'});
  } catch (err:any) {
    res.status(getHttpStatusForError(err)).json({error: err.message, hint: getActionHintForError(err)});
  }
});

// Create actor embedding from provided text or from stored user profile
router.post('/actors/embed', async (req: Request, res: Response) => {
  try {
    const {actorId, text, model} = req.body;
    if (!actorId) return res.status(400).json({error: 'actorId required'});
    let txt = text;
    if (!txt) {
      const user = await getUserProfileRecord(actorId);
      if (!user) return res.status(404).json({error: 'user not found or inaccessible; provide text explicitly'});
      txt = [user?.displayName, user?.bio, (user?.skills || []).join(' '), user?.summary].filter(Boolean).join('\n');
    }
    const {vector, data} = await embedTextWithVertex(txt, model);
    if (!vector) return res.status(500).json({error: 'could not extract embedding', raw: data});
    const saveResult = await saveActorEmbeddingRecord(actorId, {vector, updatedAt: new Date()});
    res.json({actorId, vector, storage: saveResult.storage});
  } catch (err:any) {
    res.status(getHttpStatusForError(err)).json({error: err.message, hint: getActionHintForError(err)});
  }
});

// Rank actors for a post using embeddings + simple heuristics. If endpointId is provided, forward to Vertex endpoint for learned ranking.
router.post('/match', async (req: Request, res: Response) => {
  try {
    const {postId, postText, candidateIds, endpointId, topK = 10, model} = req.body;
    const resolvedEndpointId = endpointId || getDefaultRankingEndpointId();
    const projectId = getProjectId();
    let postVector: number[] | null = null;
    if (postId) {
      const { item } = await getEmbeddingRecord(String(postId));
      if (item) postVector = item?.vector ?? null;
    }
    if (!postVector && postText) {
      const out = await embedTextWithVertex(postText, model);
      postVector = out.vector;
    }
    if (!postVector) {
      return res.status(400).json({error: 'Could not create post embedding. Ensure postId exists or pass valid postText.'});
    }

    // If a Vertex endpoint is specified, call it with instances
    if (resolvedEndpointId) {
      if (!projectId) return res.status(500).json({error: 'GCP project not configured'});
      const accessToken = await getAccessToken();
      const url = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/endpoints/${resolvedEndpointId}:predict`;
      const instances = (candidateIds || []).map((id:any)=>({postVector, actorId: id}));
      const r = await fetch(url, {method: 'POST', headers: {Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json'}, body: JSON.stringify({instances})});
      const data = await r.json();
      if (!r.ok) {
        return res.status(r.status).json({error: data?.error?.message || 'Vertex ranking endpoint call failed', raw: data});
      }
      return res.json({fromVertex: true, raw: data});
    }

    // Fetch actor embeddings
    const { items: actorDocs, storage } = await listActorEmbeddingRecords(candidateIds);

    const results: any[] = [];
    for (const a of actorDocs) {
      const sim = cosineSimilarity(postVector, a.vector || []);
      // Fetch user profile for heuristics
      const user = (await getUserProfileRecord(a.actorId)) || {};
      const rating = (user?.rating ?? user?.avgRating ?? 0);
      const years = (user?.experienceYears ?? user?.yearsExperience ?? user?.years ?? 0);
      const ratingNorm = Math.max(0, Math.min(1, rating / 5));
      const expNorm = Math.max(0, Math.min(1, Math.min(10, years) / 10));
      const finalScore = sim * 0.7 + ratingNorm * 0.2 + expNorm * 0.1;
      results.push({actorId: a.actorId, sim, rating, years, finalScore, user});
    }
    results.sort((a,b)=>b.finalScore - a.finalScore);
    res.json({results: results.slice(0, topK), storage});
  } catch (err:any) {
    res.status(getHttpStatusForError(err)).json({error: err.message, hint: getActionHintForError(err)});
  }
});

// Predict bid success probability using Vertex endpoint (if configured) or heuristic fallback.
router.post('/bid-success', async (req: Request, res: Response) => {
  try {
    const {
      postId,
      actorId,
      postText,
      actorText,
      amount,
      timeline,
      message = '',
      workPlan = '',
      postBudget,
      postTimeline,
      endpointId,
      model,
    } = req.body;

    if (amount === undefined || amount === null || String(amount).trim() === '') {
      return res.status(400).json({ error: 'amount required' });
    }

    let resolvedPostText = postText ? String(postText) : '';
    let resolvedPostBudget = postBudget;
    let resolvedPostTimeline = postTimeline;

    if (postId) {
      const post = await getProjectPostRecord(String(postId));
      if (post) {
        if (!resolvedPostText) {
          resolvedPostText = [
            post?.title,
            post?.description,
            post?.fullDetails,
            Array.isArray(post?.skills) ? `Skills: ${post.skills.join(', ')}` : '',
            post?.category ? `Category: ${post.category}` : '',
          ].filter(Boolean).join('\n');
        }
        if (!resolvedPostBudget) resolvedPostBudget = post?.budget;
        if (!resolvedPostTimeline) resolvedPostTimeline = post?.timeline;
      }
    }

    let postVector: number[] | null = null;
    if (postId) {
      const { item } = await getEmbeddingRecord(String(postId));
      if (item?.vector) postVector = item.vector;
    }
    if (!postVector && resolvedPostText) {
      const out = await embedTextWithVertex(resolvedPostText, model);
      postVector = out.vector;
    }

    let resolvedActorText = actorText ? String(actorText) : '';
    if (!resolvedActorText && actorId) {
      const user = await getUserProfileRecord(String(actorId));
      if (user) {
        resolvedActorText = [
          user?.displayName,
          user?.bio,
          Array.isArray(user?.skills) ? user.skills.join(' ') : '',
          user?.summary,
        ].filter(Boolean).join('\n');
      }
    }

    let actorVector: number[] | null = null;
    if (actorId) {
      const { item } = await getActorEmbeddingRecord(String(actorId));
      if (item?.vector) actorVector = item.vector;
    }
    if (!actorVector && resolvedActorText) {
      const out = await embedTextWithVertex(resolvedActorText, model);
      actorVector = out.vector;
    }

    const user = actorId ? (await getUserProfileRecord(String(actorId))) || {} : {};
    const rating = Number(user?.rating ?? user?.avgRating ?? 0);
    const yearsExperience = Number(user?.experienceYears ?? user?.yearsExperience ?? user?.years ?? 0);
    const ratingNorm = clamp(rating / 5);
    const expNorm = clamp(Math.min(10, yearsExperience) / 10);

    const offerAmount = parseMoney(amount);
    const budget = parseMoney(resolvedPostBudget);
    const priceGapRatio = budget > 0 ? Math.abs(offerAmount - budget) / budget : 0.5;
    const priceFit = clamp(1 - Math.min(priceGapRatio, 1));

    const requestedDays = parseDays(resolvedPostTimeline);
    const offerDays = parseDays(timeline);
    const timelineFit = (requestedDays > 0 && offerDays > 0)
      ? clamp(1 - Math.min(Math.abs(offerDays - requestedDays) / requestedDays, 1))
      : 0.6;

    const messageQuality = clamp(String(message).trim().length / 400);
    const workPlanQuality = clamp(String(workPlan).trim().length / 500);
    const similarity = cosineSimilarity(postVector, actorVector);

    const features = {
      similarity,
      rating,
      yearsExperience,
      budget,
      offerAmount,
      priceGapRatio,
      priceFit,
      timelineFit,
      messageQuality,
      workPlanQuality,
    };

    const resolvedEndpointId = endpointId || getDefaultBidEndpointId();
    if (resolvedEndpointId) {
      const projectId = getProjectId();
      if (!projectId) return res.status(500).json({error: 'GCP project not configured'});

      const accessToken = await getAccessToken();
      const url = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/endpoints/${resolvedEndpointId}:predict`;
      const r = await fetch(url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ instances: [features] }),
      });
      const data = await r.json();
      if (!r.ok) {
        return res.status(r.status).json({error: data?.error?.message || 'Vertex bid-success endpoint call failed', raw: data});
      }

      const predicted = extractFirstNumber(data?.predictions) ?? extractFirstNumber(data);
      if (predicted !== null) {
        const probability = clamp(predicted);
        return res.json({ probability, band: successBand(probability), source: 'vertex', features, raw: data });
      }
    }

    const probability = clamp(
      similarity * 0.35 +
      ratingNorm * 0.2 +
      expNorm * 0.1 +
      priceFit * 0.15 +
      timelineFit * 0.1 +
      messageQuality * 0.05 +
      workPlanQuality * 0.05,
    );

    return res.json({ probability, band: successBand(probability), source: 'heuristic', features });
  } catch (err: any) {
    res.status(getHttpStatusForError(err)).json({error: err.message, hint: getActionHintForError(err)});
  }
});

// Predict project success probability using a Vertex endpoint (if configured) or heuristic fallback.
router.post('/project-success', async (req: Request, res: Response) => {
  try {
    const {
      postId,
      title,
      description,
      fullDetails,
      category,
      budget,
      timeline,
      skills,
      whoNeeded,
      requireNda,
      creatorId,
      endpointId,
      model,
    } = req.body;

    let resolvedTitle = title ? String(title) : '';
    let resolvedDescription = description ? String(description) : '';
    let resolvedFullDetails = fullDetails ? String(fullDetails) : '';
    let resolvedCategory = category ? String(category) : '';
    let resolvedBudget = budget;
    let resolvedTimeline = timeline;
    let resolvedSkills = normalizeStringArray(skills);
    let resolvedWhoNeeded = whoNeeded ? String(whoNeeded) : '';
    let resolvedRequireNda = Boolean(requireNda);
    let resolvedCreatorId = creatorId ? String(creatorId) : '';

    if (postId) {
      const post = await getProjectPostRecord(String(postId));
      if (post) {
        if (!resolvedTitle) resolvedTitle = String(post?.title ?? '');
        if (!resolvedDescription) resolvedDescription = String(post?.description ?? '');
        if (!resolvedFullDetails) resolvedFullDetails = String(post?.fullDetails ?? '');
        if (!resolvedCategory) resolvedCategory = String(post?.category ?? '');
        if (resolvedBudget === undefined || resolvedBudget === null || resolvedBudget === '') resolvedBudget = post?.budget;
        if (resolvedTimeline === undefined || resolvedTimeline === null || resolvedTimeline === '') resolvedTimeline = post?.timeline;
        if (resolvedSkills.length === 0) resolvedSkills = normalizeStringArray(post?.skills);
        if (!resolvedWhoNeeded) resolvedWhoNeeded = String(post?.whoNeeded ?? '');
        if (requireNda === undefined) resolvedRequireNda = Boolean(post?.requireNda);
        if (!resolvedCreatorId && post?.createdBy) resolvedCreatorId = String(post.createdBy);
      }
    }

    const combinedText = [
      resolvedTitle,
      resolvedDescription,
      resolvedFullDetails,
      resolvedCategory ? `Category: ${resolvedCategory}` : '',
      resolvedWhoNeeded ? `Who needed: ${resolvedWhoNeeded}` : '',
      resolvedSkills.length > 0 ? `Skills: ${resolvedSkills.join(', ')}` : '',
      resolvedBudget ? `Budget: ${resolvedBudget}` : '',
      resolvedTimeline ? `Timeline: ${resolvedTimeline}` : '',
    ].filter(Boolean).join('\n');

    if (!combinedText.trim()) {
      return res.status(400).json({ error: 'postId or project fields required' });
    }

    let postVector: number[] | null = null;
    if (postId) {
      const { item } = await getEmbeddingRecord(String(postId));
      if (item?.vector) postVector = item.vector;
    }
    if (!postVector) {
      const out = await embedTextWithVertex(combinedText, model);
      postVector = out.vector;
    }

    let novelty = 0.5;
    let maxSimilarity = 0;
    if (postVector) {
      const { items } = await listEmbeddingRecords();
      const others = items.filter((item: any) => String(item.id) !== String(postId || ''));
      if (others.length > 0) {
        const similarities = others.map((item: any) => cosineSimilarity(postVector, item.vector || []));
        maxSimilarity = Math.max(...similarities);
        novelty = clamp(1 - maxSimilarity);
      } else {
        novelty = 1;
      }
    }

    let candidateCount = 0;
    let topActorSimilarity = 0;
    let avgTopActorSimilarity = 0;
    if (postVector) {
      const { items: actorDocs } = await listActorEmbeddingRecords();
      const similarities = actorDocs
        .map((actor: any) => cosineSimilarity(postVector, actor.vector || []))
        .filter((value: number) => Number.isFinite(value))
        .sort((a, b) => b - a);
      candidateCount = similarities.length;
      topActorSimilarity = similarities[0] ?? 0;
      avgTopActorSimilarity = average(similarities.slice(0, 5));
    }

    const creator = resolvedCreatorId ? await getUserProfileRecord(resolvedCreatorId) : null;
    const creatorHasBio = Boolean(pickNestedText(creator, ['bio', 'summary', 'previousWorkDescription']));
    const creatorProfileCompleteness = creator
      ? average([
          creator?.displayName ? 1 : 0,
          creator?.location ? 1 : 0,
          creator?.profileDetails ? 1 : 0,
          creatorHasBio ? 1 : 0,
        ])
      : 0.55;
    const creatorTrust = clamp(pickNestedNumber(creator, ['trustScore'], creator ? 60 : 55) / 100);
    const creatorCompletedProjects = clamp(Math.min(20, pickNestedNumber(creator, ['completedProjects'], 0)) / 20);
    const creatorProjectsPosted = clamp(Math.min(20, pickNestedNumber(creator, ['projectsPosted'], 0)) / 20);
    const creatorReadiness = creator
      ? clamp(
          creatorProfileCompleteness * 0.45 +
          creatorTrust * 0.2 +
          creatorCompletedProjects * 0.2 +
          creatorProjectsPosted * 0.15,
        )
      : 0.55;

    const skillCount = resolvedSkills.length;
    const descriptionLength = resolvedDescription.trim().length;
    const fullDetailsLength = resolvedFullDetails.trim().length;
    const budgetValue = parseMoney(resolvedBudget);
    const timelineDays = parseDays(resolvedTimeline);
    const categoryComplexity = inferCategoryComplexity(resolvedCategory);
    const skillDefinition = clamp(skillCount / 6);
    const scopeClarity = clamp(
      clamp(descriptionLength / 260) * 0.35 +
      clamp(fullDetailsLength / 900) * 0.4 +
      skillDefinition * 0.15 +
      (resolvedWhoNeeded ? 0.1 : 0),
    );
    const complexityScore = clamp(
      categoryComplexity * 0.4 +
      clamp(skillCount / 8) * 0.25 +
      clamp((descriptionLength + fullDetailsLength) / 1600) * 0.35,
    );
    const expectedBudget = 1200 + skillCount * 500 + timelineDays * 65 + categoryComplexity * 2500 + complexityScore * 1800;
    const recommendedDays = Math.max(10, Math.round(skillCount * 5 + categoryComplexity * 24 + complexityScore * 28));
    const budgetFeasibility = budgetValue > 0 ? clamp(budgetValue / Math.max(expectedBudget, 1)) : 0.4;
    const timelineFeasibility = timelineDays > 0 ? clamp(timelineDays / recommendedDays) : 0.45;
    const marketDepth = clamp(Math.log10(candidateCount + 1));
    const talentFit = candidateCount > 0
      ? clamp(topActorSimilarity * 0.6 + avgTopActorSimilarity * 0.25 + marketDepth * 0.15)
      : 0.35;
    const noveltyAdvantage = clamp(0.45 + novelty * 0.55);
    const ndaScore = resolvedRequireNda ? 0.86 : 0.96;
    const budgetPerSkill = skillCount > 0 ? budgetValue / skillCount : budgetValue;
    const daysPerSkill = skillCount > 0 ? timelineDays / skillCount : timelineDays;

    const features = {
      scopeClarity,
      budgetFeasibility,
      timelineFeasibility,
      talentFit,
      creatorReadiness,
      novelty,
      noveltyAdvantage,
      maxSimilarity,
      budget: budgetValue,
      timelineDays,
      skillCount,
      skillDefinition,
      categoryComplexity,
      complexityScore,
      candidateCount,
      topActorSimilarity,
      avgTopActorSimilarity,
      marketDepth,
      descriptionLength,
      fullDetailsLength,
      budgetPerSkill,
      daysPerSkill,
      ndaRequired: resolvedRequireNda ? 1 : 0,
    };

    const reasons = buildProjectSuccessReasons({
      talentFit,
      topActorSimilarity,
      scopeClarity,
      budgetFeasibility,
      timelineFeasibility,
      novelty,
      maxSimilarity,
      creatorReadiness,
      ndaRequired: resolvedRequireNda,
    });

    const resolvedEndpointId = endpointId || getDefaultProjectSuccessEndpointId();
    if (resolvedEndpointId) {
      const projectId = getProjectId();
      if (!projectId) return res.status(500).json({ error: 'GCP project not configured' });

      const accessToken = await getAccessToken();
      const url = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/endpoints/${resolvedEndpointId}:predict`;
      const r = await fetch(url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ instances: [features] }),
      });
      const data = await r.json();
      if (!r.ok) {
        return res.status(r.status).json({ error: data?.error?.message || 'Vertex project-success endpoint call failed', raw: data });
      }

      const predicted = extractFirstNumber(data?.predictions) ?? extractFirstNumber(data);
      if (predicted !== null) {
        const probability = clamp(predicted);
        return res.json({ probability, band: successBand(probability), source: 'vertex', features, reasons, raw: data });
      }
    }

    const probability = clamp(
      scopeClarity * 0.22 +
      budgetFeasibility * 0.18 +
      timelineFeasibility * 0.15 +
      talentFit * 0.18 +
      creatorReadiness * 0.1 +
      noveltyAdvantage * 0.1 +
      ndaScore * 0.03 +
      skillDefinition * 0.04,
    );

    return res.json({ probability, band: successBand(probability), source: 'heuristic', features, reasons });
  } catch (err: any) {
    res.status(getHttpStatusForError(err)).json({ error: err.message, hint: getActionHintForError(err) });
  }
});

// Simple wrapper to call Vertex AI online prediction for ranking
router.post('/predict', async (req: Request, res: Response) => {
  try {
    const {instances, endpointId} = req.body;
    const resolvedEndpointId = endpointId || getDefaultRankingEndpointId();
    const projectId = getProjectId();
    if (!resolvedEndpointId) return res.status(400).json({error: 'endpointId required'});
    if (!projectId) return res.status(500).json({error: 'GCP project not configured'});
    const accessToken = await getAccessToken();
    const url = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/endpoints/${resolvedEndpointId}:predict`;
    const r = await fetch(url, {method: 'POST', headers: {Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json'}, body: JSON.stringify({instances})});
    const data = await r.json();
    if (!r.ok) {
      return res.status(r.status).json({error: data?.error?.message || 'Vertex endpoint predict failed', raw: data});
    }
    res.json(data);
  } catch (err:any) {
    res.status(getHttpStatusForError(err)).json({error: err.message, hint: getActionHintForError(err)});
  }
});

function cosineSimilarity(a:number[]|null, b:number[]|null) {
  if (!a || !b) return 0;
  let dot = 0, na = 0, nb = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
  return dot / Math.sqrt((na || 1e-12) * (nb || 1e-12));
}

export default router;
