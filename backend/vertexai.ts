import express, { type Request, type Response } from 'express';
import {GoogleAuth} from 'google-auth-library';
import { adminDb } from './firebaseAdmin.ts';

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

function getDefaultFraudEndpointId() {
  return process.env.VERTEX_FRAUD_ENDPOINT_ID || '';
}

function getDefaultProposalCopilotModel() {
  return process.env.VERTEX_PROPOSAL_COPILOT_MODEL || 'gemini-2.0-flash-001';
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
  return /PERMISSION_DENIED|UNAUTHENTICATED|Missing or insufficient permissions|insufficient permissions|invalid authentication credentials/i.test(msg);
}

function clamp(value: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function parseMoney(value: any): number {
  const matches = String(value ?? '').match(/\d+(?:\.\d+)?/g) || [];
  if (matches.length === 0) return 0;
  const numbers = matches.map((m) => Number(m)).filter((n) => Number.isFinite(n));
  if (numbers.length === 0) return 0;
  if (numbers.length === 1) return numbers[0];
  const sum = numbers.reduce((acc, curr) => acc + curr, 0);
  return sum / numbers.length;
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

function riskBand(score: number) {
  if (score >= 0.7) return 'High';
  if (score >= 0.4) return 'Medium';
  return 'Low';
}

function toNumber(value: any, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeStringArray(value: any): string[] {
  if (Array.isArray(value)) {
    return value.map((v) => String(v ?? '').trim()).filter(Boolean);
  }
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);
  }
  return [];
}

function tokenize(text: string): string[] {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]+/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 1);
}

function lexicalSimilarityFromText(a: string, b: string) {
  const aSet = new Set(tokenize(a));
  const bSet = new Set(tokenize(b));
  if (aSet.size === 0 || bSet.size === 0) return 0;
  let intersection = 0;
  for (const token of aSet) {
    if (bSet.has(token)) intersection += 1;
  }
  const union = aSet.size + bSet.size - intersection;
  return union > 0 ? intersection / union : 0;
}

function normalizeVector(vec: number[]) {
  let magnitude = 0;
  for (const value of vec) {
    magnitude += value * value;
  }
  const denom = Math.sqrt(magnitude || 1e-12);
  return vec.map((value) => value / denom);
}

function pseudoEmbeddingFromText(text: string, dimensions = 256) {
  const vector = new Array(dimensions).fill(0) as number[];
  const tokens = tokenize(text);
  for (let tokenIdx = 0; tokenIdx < tokens.length; tokenIdx += 1) {
    const token = tokens[tokenIdx];
    for (let charIdx = 0; charIdx < token.length; charIdx += 1) {
      const code = token.charCodeAt(charIdx);
      const index = (code * 31 + tokenIdx * 17 + charIdx * 13) % dimensions;
      const signed = (code % 2 === 0 ? 1 : -1) * ((charIdx + 1) / (token.length + 1));
      vector[index] += signed;
    }
  }
  return normalizeVector(vector);
}

function keywordSignal(text: string, keywords: string[]) {
  const lowered = String(text || '').toLowerCase();
  let hits = 0;
  for (const keyword of keywords) {
    if (lowered.includes(keyword.toLowerCase())) hits += 1;
  }
  return keywords.length > 0 ? clamp(hits / keywords.length) : 0;
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

async function embedTextWithFallback(input: string, model = 'text-embedding-004') {
  try {
    const out = await embedTextWithVertex(input, model);
    return { vector: out.vector, source: 'vertex' as const };
  } catch (err: any) {
    return {
      vector: pseudoEmbeddingFromText(input),
      source: 'pseudo' as const,
      error: String(err?.message || err),
    };
  }
}

function parseGenerateContentText(data: any) {
  const candidates = Array.isArray(data?.candidates) ? data.candidates : [];
  for (const candidate of candidates) {
    const parts = candidate?.content?.parts;
    if (!Array.isArray(parts)) continue;
    for (const part of parts) {
      if (typeof part?.text === 'string' && part.text.trim()) {
        return part.text;
      }
    }
  }
  return '';
}

async function generateJsonWithVertex(prompt: string, model = getDefaultProposalCopilotModel()) {
  const projectId = getProjectId();
  if (!projectId) {
    throw new Error('GCP project not configured');
  }
  const accessToken = await getAccessToken();
  const url = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${model}:generateContent`;
  const body = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 1024,
      responseMimeType: 'application/json',
    },
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message || `Vertex generateContent failed with status ${res.status}`);
  }

  const text = parseGenerateContentText(data);
  if (!text) {
    throw new Error('Vertex generateContent returned no text output');
  }

  try {
    return { parsed: JSON.parse(text), raw: data, model };
  } catch {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start >= 0 && end > start) {
      const slice = text.slice(start, end + 1);
      return { parsed: JSON.parse(slice), raw: data, model };
    }
    throw new Error('Could not parse JSON response from Vertex copilot model');
  }
}

async function callVertexEndpointPredict(endpointId: string, instances: any[]) {
  const projectId = getProjectId();
  if (!projectId) throw new Error('GCP project not configured');
  const accessToken = await getAccessToken();
  const url = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/endpoints/${endpointId}:predict`;
  const r = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ instances }),
  });
  const data = await r.json();
  if (!r.ok) {
    throw new Error(data?.error?.message || `Vertex endpoint predict failed with status ${r.status}`);
  }
  return data;
}

async function listProjectPostRecords(limit = 300) {
  try {
    const snap = await adminDb.collection('projectPosts').limit(limit).get();
    const items: any[] = [];
    snap.forEach((d: FirebaseFirestore.QueryDocumentSnapshot) => items.push({ id: d.id, ...d.data() }));
    return items;
  } catch (err: any) {
    if (isFirestorePermissionError(err)) return [];
    throw err;
  }
}

function computeAvailabilityScore(user: any) {
  const explicit = toNumber(user?.availabilityPercent, NaN);
  if (Number.isFinite(explicit)) return clamp(explicit / 100);
  const activeProjects = toNumber(user?.activeProjects, 0);
  const maxProjects = Math.max(1, toNumber(user?.maxParallelProjects, 4));
  const loadScore = clamp(1 - activeProjects / maxProjects);
  return clamp(loadScore * 0.7 + 0.3);
}

function computePastSuccessScore(user: any) {
  const completed = toNumber(user?.completedProjects, 0);
  const accepted = Math.max(completed, toNumber(user?.acceptedProjects, completed));
  const completionRate = accepted > 0 ? clamp(completed / accepted) : 0.6;
  const onTimeRateRaw = toNumber(user?.onTimeRate, NaN);
  const onTimeRate = Number.isFinite(onTimeRateRaw) ? clamp(onTimeRateRaw / 100) : 0.7;
  const disputeRateRaw = toNumber(user?.disputeRate, NaN);
  const disputePenalty = Number.isFinite(disputeRateRaw) ? clamp(disputeRateRaw / 100) : 0.05;
  return clamp(completionRate * 0.5 + onTimeRate * 0.4 + (1 - disputePenalty) * 0.1);
}

function computeSkillMatch(projectSkills: string[], actorSkills: string[]) {
  if (projectSkills.length === 0 || actorSkills.length === 0) return 0;
  const actorSet = new Set(actorSkills.map((skill) => skill.toLowerCase()));
  let hits = 0;
  for (const skill of projectSkills) {
    if (actorSet.has(skill.toLowerCase())) hits += 1;
  }
  return clamp(hits / projectSkills.length);
}

function computeDomainExpertiseScore(category: string, user: any) {
  const text = [
    user?.bio,
    user?.summary,
    Array.isArray(user?.skills) ? user.skills.join(' ') : '',
    user?.headline,
    user?.domain,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  const categoryTokens = tokenize(category || '');
  if (categoryTokens.length === 0) return 0.5;
  const hits = categoryTokens.filter((token) => text.includes(token)).length;
  return clamp(hits / categoryTokens.length);
}

function computeFraudHeuristic(payload: any) {
  const expert = payload?.expert || {};
  const review = payload?.review || {};
  const proposal = payload?.proposal || {};
  const behavior = payload?.behavior || {};

  const reasons = {
    fakeExperts: [] as string[],
    fakeReviews: [] as string[],
    suspiciousProposals: [] as string[],
    scamBehavior: [] as string[],
  };

  let risk = 0.08;

  const rating = toNumber(expert?.rating, toNumber(review?.rating, 0));
  const reviewsCount = toNumber(expert?.reviewsCount, 0);
  const completedProjects = toNumber(expert?.completedProjects, 0);
  const accountAgeDays = toNumber(expert?.accountAgeDays, toNumber(behavior?.accountAgeDays, 0));
  const verificationLevel = toNumber(expert?.verificationLevel, 50);

  if (rating >= 4.9 && reviewsCount < 3) {
    risk += 0.16;
    reasons.fakeExperts.push('Very high rating with very low review count.');
  }

  if (accountAgeDays > 0 && accountAgeDays < 20 && completedProjects > 3) {
    risk += 0.12;
    reasons.fakeExperts.push('Account age is very low relative to claimed project history.');
  }

  if (verificationLevel < 40) {
    risk += 0.08;
    reasons.fakeExperts.push('Low verification level increases impersonation risk.');
  }

  const reviewText = String(review?.text || '');
  const suspiciousReviewSignal = keywordSignal(reviewText, ['perfect service', '100% guaranteed', 'best ever', 'no flaws']);
  if (suspiciousReviewSignal > 0.2 && reviewText.length < 55) {
    risk += 0.08;
    reasons.fakeReviews.push('Review language appears promotional and too generic.');
  }

  const proposalText = [proposal?.title, proposal?.message, proposal?.workPlan, proposal?.amount, proposal?.timeline]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  const scamKeywordScore = keywordSignal(proposalText, [
    'whatsapp',
    'telegram',
    'wire transfer',
    'crypto',
    'gift card',
    'outside platform',
    'advance payment',
  ]);
  if (scamKeywordScore > 0) {
    risk += 0.22 * scamKeywordScore;
    reasons.suspiciousProposals.push('Proposal contains off-platform or risky payment language.');
  }

  const budget = parseMoney(proposal?.projectBudget);
  const offerAmount = parseMoney(proposal?.amount);
  if (budget > 0 && offerAmount > 0) {
    const gap = Math.abs(offerAmount - budget) / budget;
    if (gap > 0.65) {
      risk += 0.1;
      reasons.suspiciousProposals.push('Offer amount is abnormally far from project budget.');
    }
  }

  const externalContactAttempts = toNumber(behavior?.externalContactAttempts, 0);
  const offPlatformPaymentMentions = toNumber(behavior?.offPlatformPaymentMentions, 0);
  const failedPayments = toNumber(behavior?.failedPayments, 0);
  const chargebacks = toNumber(behavior?.chargebacks, 0);
  const disputes = toNumber(behavior?.disputes, 0);
  const rapidBidCount = toNumber(behavior?.rapidBidCount24h, 0);

  const behaviorRisk = clamp(
    externalContactAttempts * 0.12 +
    offPlatformPaymentMentions * 0.15 +
    failedPayments * 0.06 +
    chargebacks * 0.1 +
    disputes * 0.05 +
    rapidBidCount * 0.02,
  );

  if (behaviorRisk > 0.2) {
    reasons.scamBehavior.push('Behavioral telemetry indicates elevated scam risk.');
  }

  risk += behaviorRisk;
  const overallRisk = clamp(risk);

  return {
    overallRisk,
    band: riskBand(overallRisk),
    reasons,
    features: {
      rating,
      reviewsCount,
      accountAgeDays,
      verificationLevel,
      scamKeywordScore,
      behaviorRisk,
      completedProjects,
    },
  };
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
  const fraudEndpointId = getDefaultFraudEndpointId();

  const response: any = {
    ok: true,
    env: {
      projectId: projectId || null,
      location,
      hasGoogleCredentials: Boolean(process.env.GOOGLE_APPLICATION_CREDENTIALS),
      rankingEndpointConfigured: Boolean(endpointId),
      bidEndpointConfigured: Boolean(bidEndpointId),
      projectSuccessEndpointConfigured: Boolean(projectSuccessEndpointId),
      fraudEndpointConfigured: Boolean(fraudEndpointId),
      proposalCopilotModel: getDefaultProposalCopilotModel(),
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
      hint: 'Set VERTEX_PROJECT_SUCCESS_ENDPOINT_ID after deploying your project-success model.',
    };
  }

  if (fraudEndpointId) {
    try {
      response.checks.fraudEndpoint = await checkRankingEndpointHealth(fraudEndpointId);
    } catch (err: any) {
      response.ok = false;
      response.checks.fraudEndpoint = {
        ok: false,
        error: err.message,
        hint: getActionHintForError(err),
      };
    }
  } else {
    response.checks.fraudEndpoint = {
      ok: false,
      error: 'VERTEX_FRAUD_ENDPOINT_ID is not configured',
      hint: 'Set VERTEX_FRAUD_ENDPOINT_ID after deploying your fraud model (optional).',
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
    const out = await embedTextWithFallback(input, model);
    res.json({
      vector: out.vector,
      source: out.source,
      warning: out.error,
    });
  } catch (err:any) {
    res.status(getHttpStatusForError(err)).json({error: err.message, hint: getActionHintForError(err)});
  }
});

// Compute embedding and store for a post
router.post('/embeddings/store', async (req: Request, res: Response) => {
  try {
    const {postId, text, meta = {}, model} = req.body;
    if (!text) return res.status(400).json({error: 'text required'});
    const out = await embedTextWithFallback(text, model);
    const {vector} = out;
    if (!vector) return res.status(500).json({error: 'could not generate embedding'});
    const id = String(postId || generateLocalId('emb'));
    const saveResult = await saveEmbeddingRecord(id, {
      vector,
      meta,
      text,
      embeddingSource: out.source,
      updatedAt: new Date(),
    });
    res.json({id, vector, source: out.source, warning: out.error, storage: saveResult.storage});
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
    const novelty = clamp(1 - (top?.score ?? 0));
    const noveltyScore = Math.round(novelty * 100);
    const descriptionSignal = clamp(String(base?.text || '').length / 1400);
    const innovationScore = Math.round(clamp(novelty * 0.85 + descriptionSignal * 0.15) * 100);
    const similarProjectsFound = scored.filter((item) => item.score >= 0.75).length;

    res.json({
      novelty,
      noveltyScore,
      innovationScore,
      similarProjectsFound,
      topSimilar: scored.slice(0,10),
      storage: baseStorage === 'firestore' && listStorage === 'firestore' ? 'firestore' : 'local-fallback',
    });
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
    const out = await embedTextWithFallback(txt, model);
    const {vector} = out;
    if (!vector) return res.status(500).json({error: 'could not generate embedding'});
    const saveResult = await saveActorEmbeddingRecord(actorId, {
      vector,
      embeddingSource: out.source,
      updatedAt: new Date(),
    });
    res.json({actorId, vector, source: out.source, warning: out.error, storage: saveResult.storage});
  } catch (err:any) {
    res.status(getHttpStatusForError(err)).json({error: err.message, hint: getActionHintForError(err)});
  }
});

// Rank actors for a post using embeddings + simple heuristics. If endpointId is provided, forward to Vertex endpoint for learned ranking.
router.post('/match', async (req: Request, res: Response) => {
  try {
    const {
      postId,
      postText,
      candidateIds,
      endpointId,
      topK = 10,
      model,
      projectSkills,
      projectCategory,
      whoNeeded,
    } = req.body;

    const skillTargets = normalizeStringArray(projectSkills);
    const categoryText = String(projectCategory || '');

    let resolvedPostText = String(postText || '');
    if (!resolvedPostText) {
      resolvedPostText = [
        categoryText,
        String(whoNeeded || ''),
        skillTargets.join(', '),
      ]
        .filter(Boolean)
        .join('\n');
    }

    const resolvedEndpointId = endpointId || getDefaultRankingEndpointId();
    let postVector: number[] | null = null;

    if (postId) {
      const { item } = await getEmbeddingRecord(String(postId));
      if (item) postVector = item?.vector ?? null;
    }

    if (!postVector && resolvedPostText) {
      const out = await embedTextWithFallback(resolvedPostText, model);
      postVector = out.vector;
    }

    if (!postVector) {
      return res.status(400).json({error: 'Could not create post embedding. Ensure postId exists or pass valid postText.'});
    }

    // If a Vertex endpoint is specified, call it with instances first.
    if (resolvedEndpointId && Array.isArray(candidateIds) && candidateIds.length > 0) {
      try {
        const instances = candidateIds.map((id:any)=>({postVector, actorId: id}));
        const data = await callVertexEndpointPredict(resolvedEndpointId, instances);
        const preds = Array.isArray(data?.predictions) ? data.predictions : [];
        const results = candidateIds.map((id: string, index: number) => {
          const predicted = extractFirstNumber(preds[index]) ?? extractFirstNumber(preds) ?? 0;
          const score = clamp(predicted);
          return {
            actorId: id,
            displayName: id,
            sim: score,
            skillsMatch: Math.round(score * 100),
            domainExpertise: Math.round(score * 100),
            availability: Math.round(score * 100),
            pastProjectSuccess: Math.round(score * 100),
            finalScore: score,
            source: 'vertex',
          };
        });
        return res.json({results: results.slice(0, topK), source: 'vertex', raw: data});
      } catch (vertexErr: any) {
        // Continue with heuristic ranking fallback.
        console.warn('Vertex match endpoint failed; falling back to heuristic ranking.', vertexErr?.message || vertexErr);
      }
    }

    // Fetch actor embeddings for heuristic ranking.
    const { items: actorDocs, storage } = await listActorEmbeddingRecords(candidateIds);

    const results: any[] = [];
    for (const a of actorDocs) {
      const sim = cosineSimilarity(postVector, a.vector || []);
      const user = (await getUserProfileRecord(a.actorId)) || {};
      const rating = (user?.rating ?? user?.avgRating ?? 0);
      const years = (user?.experienceYears ?? user?.yearsExperience ?? user?.years ?? 0);
      const ratingNorm = Math.max(0, Math.min(1, rating / 5));
      const actorSkills = normalizeStringArray(user?.skills || user?.profileDetails?.skills);
      const skillsMatch = computeSkillMatch(skillTargets, actorSkills);
      const domainExpertise = computeDomainExpertiseScore(categoryText, user);
      const availability = computeAvailabilityScore(user);
      const pastProjectSuccess = computePastSuccessScore(user);

      const finalScore = clamp(
        sim * 0.4 +
        skillsMatch * 0.2 +
        domainExpertise * 0.15 +
        availability * 0.1 +
        pastProjectSuccess * 0.1 +
        ratingNorm * 0.05,
      );

      results.push({
        actorId: a.actorId,
        displayName: String(user?.displayName || user?.name || a.actorId),
        sim,
        rating,
        years,
        skillsMatch: Math.round(skillsMatch * 100),
        domainExpertise: Math.round(domainExpertise * 100),
        availability: Math.round(availability * 100),
        pastProjectSuccess: Math.round(pastProjectSuccess * 100),
        finalScore,
        source: 'heuristic',
      });
    }

    results.sort((a,b)=>b.finalScore - a.finalScore);
    res.json({results: results.slice(0, topK), storage, source: 'heuristic'});
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
      const out = await embedTextWithFallback(resolvedPostText, model);
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
      const out = await embedTextWithFallback(resolvedActorText, model);
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

// Semantic idea search using embeddings (with pseudo-embedding fallback).
router.post('/semantic-search', async (req: Request, res: Response) => {
  try {
    const { query, k = 5, minScore = 0.25, model } = req.body;
    if (!query || String(query).trim().length < 2) {
      return res.status(400).json({ error: 'query required' });
    }

    const cleanedQuery = String(query).trim();
    const queryEmbedding = await embedTextWithFallback(cleanedQuery, model);
    const { items, storage } = await listEmbeddingRecords();

    const scoredFromEmbeddings = items
      .map((item) => ({
        id: String(item.id),
        score: cosineSimilarity(queryEmbedding.vector, item.vector || []),
        meta: item.meta || {},
        text: String(item.text || ''),
      }))
      .filter((item) => item.score >= Number(minScore || 0))
      .sort((a, b) => b.score - a.score)
      .slice(0, Number(k || 5));

    let scored = scoredFromEmbeddings;
    let source = queryEmbedding.source === 'vertex' ? 'vertex-embeddings' : 'pseudo-embeddings';

    if (scored.length === 0) {
      const posts = await listProjectPostRecords(250);
      scored = posts
        .map((post) => {
          const text = [post?.title, post?.description, post?.fullDetails, normalizeStringArray(post?.skills).join(' ')].filter(Boolean).join(' ');
          return {
            id: String(post.id),
            score: lexicalSimilarityFromText(cleanedQuery, text),
            meta: { category: post?.category },
            text,
          };
        })
        .filter((item) => item.score >= Number(minScore || 0))
        .sort((a, b) => b.score - a.score)
        .slice(0, Number(k || 5));
      source = 'lexical-fallback';
    }

    const results: any[] = [];
    for (const candidate of scored) {
      const post = await getProjectPostRecord(candidate.id);
      results.push({
        postId: candidate.id,
        title: String(post?.title || candidate?.meta?.title || `Project ${candidate.id}`),
        category: String(post?.category || candidate?.meta?.category || 'General'),
        score: Math.round(clamp(candidate.score) * 100),
        similarity: clamp(candidate.score),
      });
    }

    return res.json({ results, source, storage });
  } catch (err: any) {
    res.status(getHttpStatusForError(err)).json({ error: err.message, hint: getActionHintForError(err) });
  }
});

// Project success prediction for timeline/delivery risk.
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
      creatorId,
      endpointId,
    } = req.body;

    let post: any = null;
    if (postId) {
      post = await getProjectPostRecord(String(postId));
    }

    const resolvedTitle = String(title || post?.title || '');
    const resolvedDescription = String(description || post?.description || '');
    const resolvedFullDetails = String(fullDetails || post?.fullDetails || '');
    const resolvedCategory = String(category || post?.category || '');
    const resolvedBudget = budget ?? post?.budget;
    const resolvedTimeline = timeline ?? post?.timeline;
    const resolvedSkills = normalizeStringArray(skills?.length ? skills : post?.skills);
    const resolvedWhoNeeded = String(whoNeeded || post?.whoNeeded || '');

    const detailQuality = clamp((resolvedDescription.length + resolvedFullDetails.length) / 1800);
    const skillComplexity = clamp(resolvedSkills.length / 10);
    const ambiguity = keywordSignal(`${resolvedDescription}\n${resolvedFullDetails}`, ['etc', 'tbd', 'maybe', 'later', 'flexible', 'to be decided']);
    const budgetValue = parseMoney(resolvedBudget);
    const timelineDays = parseDays(resolvedTimeline);
    const baselineBudget = 1600 + resolvedSkills.length * 650 + skillComplexity * 3000;
    const budgetAdequacy = budgetValue > 0 ? clamp(budgetValue / baselineBudget) : 0.55;
    const timelinePressure = timelineDays > 0 ? clamp((45 - timelineDays) / 45) : 0.4;

    const creatorProfile = creatorId ? (await getUserProfileRecord(String(creatorId))) || {} : {};
    const creatorReliability = computePastSuccessScore(creatorProfile);

    let noveltySignal = 0.55;
    if (postId) {
      const { item: base } = await getEmbeddingRecord(String(postId));
      if (base?.vector) {
        const { items } = await listEmbeddingRecords();
        const bestSimilarity = items
          .filter((entry) => String(entry.id) !== String(postId))
          .map((entry) => cosineSimilarity(base.vector, entry.vector || []))
          .sort((a, b) => b - a)[0] ?? 0.35;
        noveltySignal = clamp(1 - bestSimilarity);
      }
    }

    const features = {
      detailQuality,
      skillComplexity,
      ambiguity,
      budgetAdequacy,
      timelinePressure,
      creatorReliability,
      noveltySignal,
      categorySignal: keywordSignal(resolvedCategory, ['ai', 'iot', 'embedded', 'health', 'robot', 'security']),
      talentSignal: keywordSignal(resolvedWhoNeeded, ['senior', 'lead', 'expert', 'full stack', 'firmware', 'embedded']),
    };

    const resolvedEndpointId = endpointId || getDefaultProjectSuccessEndpointId();
    if (resolvedEndpointId) {
      try {
        const data = await callVertexEndpointPredict(resolvedEndpointId, [features]);
        const predicted = extractFirstNumber(data?.predictions) ?? extractFirstNumber(data);
        if (predicted !== null) {
          const probability = clamp(predicted);
          const delayRisk = clamp(
            timelinePressure * 0.45 +
            (1 - detailQuality) * 0.25 +
            ambiguity * 0.2 +
            (1 - budgetAdequacy) * 0.1,
          );
          const failureProbability = clamp(1 - probability + delayRisk * 0.2);
          return res.json({
            probability,
            successProbability: probability,
            failureProbability,
            delayRisk,
            delayRiskBand: riskBand(delayRisk),
            band: successBand(probability),
            risk: riskBand(failureProbability),
            source: 'vertex',
            reasons: [
              {
                impact: probability >= 0.5 ? 'positive' : 'negative',
                label: 'Vertex Model Score',
                detail: 'Prediction generated from deployed Vertex endpoint using project feature signals.',
              },
            ],
            raw: data,
          });
        }
      } catch (endpointError: any) {
        console.warn('Project-success Vertex endpoint failed; using heuristic.', endpointError?.message || endpointError);
      }
    }

    const probability = clamp(
      detailQuality * 0.23 +
      budgetAdequacy * 0.2 +
      (1 - ambiguity) * 0.14 +
      (1 - timelinePressure) * 0.14 +
      creatorReliability * 0.16 +
      noveltySignal * 0.13,
    );

    const delayRisk = clamp(
      timelinePressure * 0.45 +
      ambiguity * 0.25 +
      (1 - detailQuality) * 0.2 +
      (1 - budgetAdequacy) * 0.1,
    );

    const failureProbability = clamp(1 - probability + delayRisk * 0.2);

    const reasons = [
      {
        impact: detailQuality >= 0.55 ? 'positive' : 'negative',
        label: 'Project Clarity',
        detail: detailQuality >= 0.55
          ? 'Requirements contain enough implementation detail for execution planning.'
          : 'Requirements are short or vague, increasing delivery uncertainty.',
      },
      {
        impact: timelinePressure <= 0.5 ? 'positive' : 'negative',
        label: 'Timeline Feasibility',
        detail: timelinePressure <= 0.5
          ? 'Timeline appears achievable for declared scope.'
          : 'Timeline is tight relative to complexity and may cause delays.',
      },
      {
        impact: creatorReliability >= 0.6 ? 'positive' : 'neutral',
        label: 'Creator Reliability',
        detail: creatorReliability >= 0.6
          ? 'Historical profile signals indicate above-average delivery reliability.'
          : 'Limited creator history is available; estimate is less certain.',
      },
    ];

    return res.json({
      probability,
      successProbability: probability,
      failureProbability,
      delayRisk,
      delayRiskBand: riskBand(delayRisk),
      band: successBand(probability),
      risk: riskBand(failureProbability),
      source: 'heuristic',
      reasons,
      features,
    });
  } catch (err: any) {
    res.status(getHttpStatusForError(err)).json({ error: err.message, hint: getActionHintForError(err) });
  }
});

async function handleFraudDetect(req: Request, res: Response) {
  try {
    const heuristic = computeFraudHeuristic(req.body || {});
    const endpointId = req.body?.endpointId || getDefaultFraudEndpointId();

    if (endpointId) {
      try {
        const data = await callVertexEndpointPredict(endpointId, [heuristic.features]);
        const predicted = extractFirstNumber(data?.predictions) ?? extractFirstNumber(data);
        if (predicted !== null) {
          const overallRisk = clamp((heuristic.overallRisk + clamp(predicted)) / 2);
          return res.json({
            overallRisk,
            band: riskBand(overallRisk),
            reasons: heuristic.reasons,
            source: 'vertex+heuristic',
            features: heuristic.features,
            raw: data,
          });
        }
      } catch (endpointError: any) {
        console.warn('Fraud endpoint failed; using heuristic.', endpointError?.message || endpointError);
      }
    }

    return res.json({ ...heuristic, source: 'heuristic' });
  } catch (err: any) {
    res.status(getHttpStatusForError(err)).json({ error: err.message, hint: getActionHintForError(err) });
  }
}

// Fraud detection endpoint aliases (both paths supported).
router.post('/fraud-detect', handleFraudDetect);
router.post('/fraud/detect', handleFraudDetect);

// Team chemistry ranking for shortlisted actors.
router.post('/team-chemistry', async (req: Request, res: Response) => {
  try {
    const {
      postId,
      postText,
      candidateIds,
      topK = 5,
      projectSkills,
      projectCategory,
      whoNeeded,
      model,
    } = req.body;

    let postVector: number[] | null = null;
    if (postId) {
      const stored = await getEmbeddingRecord(String(postId));
      postVector = stored.item?.vector || null;
    }

    const contextText = [
      String(postText || ''),
      String(projectCategory || ''),
      String(whoNeeded || ''),
      normalizeStringArray(projectSkills).join(', '),
    ]
      .filter(Boolean)
      .join('\n');

    if (!postVector && contextText) {
      const embedded = await embedTextWithFallback(contextText, model);
      postVector = embedded.vector;
    }

    const skillTargets = normalizeStringArray(projectSkills);
    const { items } = await listActorEmbeddingRecords(candidateIds);
    const results: any[] = [];

    for (const actor of items) {
      const user = (await getUserProfileRecord(String(actor.actorId))) || {};
      const actorSkills = normalizeStringArray(user?.skills || user?.profileDetails?.skills);
      const semanticFit = postVector ? cosineSimilarity(postVector, actor.vector || []) : 0.5;
      const skillFit = computeSkillMatch(skillTargets, actorSkills);
      const collaborationFit = clamp(skillFit * 0.45 + computeAvailabilityScore(user) * 0.25 + (1 - clamp(toNumber(user?.disputeRate, 6) / 100)) * 0.3);
      const communicationFit = clamp(
        clamp(String(user?.bio || user?.summary || '').length / 450) * 0.35 +
        keywordSignal(String(user?.bio || user?.summary || ''), ['communication', 'collaboration', 'updates', 'standup', 'async']) * 0.4 +
        semanticFit * 0.25,
      );
      const reliabilityFit = computePastSuccessScore(user);
      const chemistryScore = Math.round(clamp(collaborationFit * 0.4 + communicationFit * 0.3 + reliabilityFit * 0.3) * 100);

      results.push({
        actorId: String(actor.actorId),
        displayName: String(user?.displayName || user?.name || actor.actorId),
        chemistryScore,
        collaborationFit: Math.round(collaborationFit * 100),
        communicationFit: Math.round(communicationFit * 100),
        reliabilityFit: Math.round(reliabilityFit * 100),
      });
    }

    results.sort((a, b) => b.chemistryScore - a.chemistryScore);
    res.json({ results: results.slice(0, Number(topK || 5)), source: 'heuristic+semantic' });
  } catch (err: any) {
    res.status(getHttpStatusForError(err)).json({ error: err.message, hint: getActionHintForError(err) });
  }
});

// Dynamic pricing recommendation.
router.post('/dynamic-pricing', async (req: Request, res: Response) => {
  try {
    const {
      title,
      description,
      fullDetails,
      category,
      skills,
      budget,
      timeline,
    } = req.body;

    const text = [title, description, fullDetails, category, normalizeStringArray(skills).join(' ')].filter(Boolean).join(' ');
    const skillList = normalizeStringArray(skills);
    const complexityScore = clamp(skillList.length / 10 + clamp(String(fullDetails || '').length / 1400) * 0.6 + keywordSignal(text, ['integration', 'real-time', 'secure', 'embedded', 'firmware', 'multi-tenant']) * 0.4);
    const marketDemandScore = clamp(keywordSignal(text, ['ai', 'iot', 'robotics', 'security', 'health', 'fintech']) * 0.7 + 0.3);
    const timelineDays = parseDays(timeline);
    const urgencyScore = timelineDays > 0 ? clamp((40 - timelineDays) / 40) : 0.45;
    const scarceTalentScore = clamp(keywordSignal(text, ['embedded', 'fpga', 'mlops', 'firmware', 'rtos', 'edge']) * 0.8 + skillList.length / 20);

    const baseline = 1800 + complexityScore * 7000 + marketDemandScore * 4200 + urgencyScore * 2200 + scarceTalentScore * 2800;
    const budgetInput = parseMoney(budget);
    const recommendedBudget = Math.round(budgetInput > 0 ? baseline * 0.62 + budgetInput * 0.38 : baseline);
    const spread = Math.max(450, Math.round(recommendedBudget * 0.18));

    const guidance = [
      urgencyScore > 0.65
        ? 'Tight timeline pushes pricing up; consider extending timeline to reduce burn.'
        : 'Timeline is reasonable for current complexity.',
      scarceTalentScore > 0.6
        ? 'Specialized skills are scarce, so retainers or milestone bonuses improve close rates.'
        : 'Talent supply appears balanced for this scope.',
      complexityScore > 0.65
        ? 'Complexity is high. Split project into milestones to control budget variance.'
        : 'Complexity is moderate; fixed milestone pricing should be feasible.',
    ];

    return res.json({
      recommendedBudget,
      suggestedRange: {
        min: Math.max(500, recommendedBudget - spread),
        max: recommendedBudget + spread,
      },
      marketDemandScore: Math.round(marketDemandScore * 100),
      complexityScore: Math.round(complexityScore * 100),
      urgencyScore: Math.round(urgencyScore * 100),
      scarceTalentScore: Math.round(scarceTalentScore * 100),
      guidance,
      source: 'heuristic',
    });
  } catch (err: any) {
    res.status(getHttpStatusForError(err)).json({ error: err.message, hint: getActionHintForError(err) });
  }
});

// Scope creep prediction.
router.post('/scope-creep', async (req: Request, res: Response) => {
  try {
    const { description, fullDetails, skills, timeline, whoNeeded } = req.body;
    const detailText = [description, fullDetails, whoNeeded].filter(Boolean).join('\n');
    const skillList = normalizeStringArray(skills);
    const timelineDays = parseDays(timeline);

    const ambiguity = clamp(
      keywordSignal(detailText, ['etc', 'later', 'maybe', 'tbd', 'flexible', 'open ended', 'to be decided']) * 0.65 +
      (String(fullDetails || '').length < 240 ? 0.35 : 0),
    );
    const integrationComplexity = clamp(skillList.length / 9 + keywordSignal(detailText, ['integration', 'hardware', 'api', 'realtime', 'cross-platform']) * 0.5);
    const timelinePressure = timelineDays > 0 ? clamp((32 - timelineDays) / 32) : 0.4;

    const creepRisk = clamp(ambiguity * 0.38 + integrationComplexity * 0.36 + timelinePressure * 0.18 + (skillList.length > 6 ? 0.08 : 0));
    const scopeCreepScore = Math.round(creepRisk * 100);

    const mitigations = [
      'Freeze requirements at each milestone and route changes through a single backlog.',
      'Break deliverables into weekly acceptance checkpoints with explicit definitions of done.',
      'Track each change request with time and budget impact before approval.',
    ];

    if (ambiguity > 0.6) {
      mitigations.unshift('Rewrite user stories with measurable acceptance criteria to reduce interpretation drift.');
    }

    return res.json({
      scopeCreepScore,
      band: riskBand(creepRisk),
      mitigations,
      source: 'heuristic',
    });
  } catch (err: any) {
    res.status(getHttpStatusForError(err)).json({ error: err.message, hint: getActionHintForError(err) });
  }
});

// Failure recovery recommendations.
router.post('/failure-recovery', async (req: Request, res: Response) => {
  try {
    const progressPercent = clamp(toNumber(req.body?.progressPercent, 0) / 100) * 100;
    const timelineDays = Math.max(1, toNumber(req.body?.timelineDays, 30));
    const elapsedDays = Math.max(0, toNumber(req.body?.elapsedDays, Math.round(timelineDays * 0.5)));
    const changeRequestsCount = Math.max(0, toNumber(req.body?.changeRequestsCount, 0));
    const stakeholderCount = Math.max(1, toNumber(req.body?.stakeholderCount, 2));

    const expectedProgress = clamp(elapsedDays / timelineDays) * 100;
    const scheduleSlip = clamp((expectedProgress - progressPercent) / 100);
    const changePressure = clamp(changeRequestsCount / 6);
    const stakeholderPressure = clamp((stakeholderCount - 2) / 8);

    const recoveryRisk = clamp(scheduleSlip * 0.45 + changePressure * 0.3 + stakeholderPressure * 0.15 + (progressPercent < 35 ? 0.12 : 0.03));
    const status = recoveryRisk >= 0.7 ? 'struggling' : recoveryRisk >= 0.4 ? 'watch' : 'stable';

    const recommendations = [
      {
        title: 'Split the next milestone into smaller deliverables',
        why: 'Short cycles reduce uncertainty and quickly expose blockers before they cascade.',
      },
    ];

    if (changePressure >= 0.45) {
      recommendations.unshift({
        title: 'Add an embedded engineer to absorb change requests',
        why: 'High change volume indicates team capacity is below incoming scope demand.',
      });
    }

    if (scheduleSlip >= 0.35) {
      recommendations.push({
        title: 'Extend timeline by one iteration',
        why: 'Current pace trails expected progress and requires schedule correction to protect quality.',
      });
    }

    return res.json({
      status,
      recoveryRisk,
      band: riskBand(recoveryRisk),
      expectedProgress: Math.round(expectedProgress),
      scheduleSlip: Number(scheduleSlip.toFixed(3)),
      recommendations,
      source: 'heuristic',
    });
  } catch (err: any) {
    res.status(getHttpStatusForError(err)).json({ error: err.message, hint: getActionHintForError(err) });
  }
});

// Reputation trust score.
router.post('/reputation-score', async (req: Request, res: Response) => {
  try {
    const { userId, profile } = req.body;
    const persisted = userId ? (await getUserProfileRecord(String(userId))) || {} : {};
    const merged = { ...persisted, ...(profile || {}) };

    const reliability = computePastSuccessScore(merged);
    const onTimeRateRaw = toNumber(merged?.onTimeRate, NaN);
    const delivery = Number.isFinite(onTimeRateRaw)
      ? clamp(onTimeRateRaw / 100)
      : clamp((toNumber(merged?.completedProjects, 0) + 3) / (toNumber(merged?.acceptedProjects, 0) + 5));
    const verification = clamp(toNumber(merged?.verificationLevel, 72) / 100);
    const trust = clamp(reliability * 0.45 + delivery * 0.35 + verification * 0.2);

    return res.json({
      reliabilityScore: Math.round(reliability * 100),
      deliveryScore: Math.round(delivery * 100),
      trustScore: Math.round(trust * 100),
      source: userId ? 'profile+history' : 'profile-only',
    });
  } catch (err: any) {
    res.status(getHttpStatusForError(err)).json({ error: err.message, hint: getActionHintForError(err) });
  }
});

// Proposal copilot draft generation using Vertex generateContent with safe template fallback.
router.post('/proposal-copilot', async (req: Request, res: Response) => {
  try {
    const project = req.body?.project || {};
    const actor = req.body?.actor || {};
    const preferences = req.body?.preferences || {};

    const fallbackDraft = {
      title: String(project?.title || 'Proposal for your project'),
      message: `Hi, I reviewed your ${String(project?.category || 'engineering')} project and can deliver a strong implementation plan with predictable milestones and clear communication.`,
      workPlan: [
        '1) Align on requirements and acceptance criteria.',
        '2) Build core implementation and run integration tests.',
        '3) Deliver documentation and deployment handover.',
      ].join('\n'),
      notes: 'Open to refining scope and timeline based on your priority constraints.',
    };

    let draft = fallbackDraft;
    let source = 'template';
    let modelUsed = '';

    const prompt = [
      'Generate a professional engineering proposal in JSON only.',
      'Return shape: {"draft":{"title":"","message":"","workPlan":"","notes":""}}',
      `Project title: ${String(project?.title || '')}`,
      `Project description: ${String(project?.description || '')}`,
      `Project details: ${String(project?.fullDetails || '')}`,
      `Project category: ${String(project?.category || '')}`,
      `Project budget: ${String(project?.budget || '')}`,
      `Project timeline: ${String(project?.timeline || '')}`,
      `Project skills: ${normalizeStringArray(project?.skills).join(', ')}`,
      `Actor name: ${String(actor?.name || '')}`,
      `Actor skills: ${normalizeStringArray(actor?.skills).join(', ')}`,
      `Actor experience years: ${String(actor?.experienceYears || '')}`,
      `Preferred amount: ${String(preferences?.amount || '')}`,
      `Preferred timeline: ${String(preferences?.timeline || '')}`,
      `Tone: ${String(preferences?.tone || 'professional')}`,
    ].join('\n');

    try {
      const generated = await generateJsonWithVertex(prompt);
      const parsedDraft = generated?.parsed?.draft || generated?.parsed;
      if (parsedDraft && typeof parsedDraft === 'object') {
        draft = {
          title: String(parsedDraft?.title || fallbackDraft.title),
          message: String(parsedDraft?.message || fallbackDraft.message),
          workPlan: String(parsedDraft?.workPlan || fallbackDraft.workPlan),
          notes: String(parsedDraft?.notes || fallbackDraft.notes),
        };
        source = 'vertex';
        modelUsed = generated.model;
      }
    } catch (genErr: any) {
      console.warn('Proposal copilot Vertex generation failed; using template draft.', genErr?.message || genErr);
    }

    const fraudCheck = computeFraudHeuristic({
      expert: {
        displayName: actor?.name,
        skills: actor?.skills,
        yearsExperience: actor?.experienceYears,
      },
      proposal: {
        title: draft.title,
        message: draft.message,
        workPlan: draft.workPlan,
        amount: preferences?.amount,
        timeline: preferences?.timeline,
      },
      behavior: {
        externalContactAttempts: keywordSignal(`${draft.message} ${draft.notes}`, ['whatsapp', 'telegram', 'gmail']) > 0 ? 1 : 0,
      },
    });

    return res.json({
      draft,
      source,
      modelUsed,
      fraudCheck: {
        band: fraudCheck.band,
        overallRisk: fraudCheck.overallRisk,
      },
    });
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
