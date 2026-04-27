const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '/api/vertex';
const ML_API_BASE = process.env.NEXT_PUBLIC_ML_API_BASE || 'http://localhost:3001/api';

async function readJsonSafe(response: Response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

async function postJson(path: string, payload: any) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload || {}),
  });

  const data = await readJsonSafe(response);
  if (!response.ok) {
    return {
      error: String(data?.error || `Request failed (${response.status})`),
      status: response.status,
      ...data,
    };
  }

  return data;
}

async function postMlJson(path: string, payload: any) {
  const response = await fetch(`${ML_API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload || {}),
  });

  const data = await readJsonSafe(response);
  if (!response.ok) {
    return {
      error: String(data?.error || `Request failed (${response.status})`),
      status: response.status,
      ...data,
    };
  }

  return data;
}

async function getJson(path: string) {
  const response = await fetch(`${API_BASE}${path}`);
  const data = await readJsonSafe(response);
  if (!response.ok) {
    return {
      error: String(data?.error || `Request failed (${response.status})`),
      status: response.status,
      ...data,
    };
  }
  return data;
}

export async function getEmbedding(text: string) {
  return postJson('/embeddings', { input: text });
}

export async function predictEndpoint(endpointId: string, instances: any[]) {
  return postJson('/predict', { endpointId, instances });
}

export async function saveEmbeddingForPost(postId: string | undefined, text: string, meta = {}) {
  return postJson('/embeddings/store', { postId, text, meta });
}

export async function queryNearest(vector: number[], k = 8) {
  return postJson('/embeddings/nearest', { vector, k });
}

export async function getNovelty(postId: string) {
  return getJson(`/novelty/${encodeURIComponent(postId)}`);
}

export async function embedActorFromUser(actorId: string) {
  return postJson('/actors/embed', { actorId });
}

export async function matchActors(opts: {
  postId?: string;
  postText?: string;
  candidateIds?: string[];
  endpointId?: string;
  topK?: number;
  projectSkills?: string[];
  projectCategory?: string;
  whoNeeded?: string;
}) {
  return postJson('/match', opts);
}

export async function predictBidSuccess(opts: {
  postId?: string;
  actorId?: string;
  postText?: string;
  actorText?: string;
  amount: string | number;
  timeline?: string;
  message?: string;
  workPlan?: string;
  postBudget?: string;
  postTimeline?: string;
  endpointId?: string;
}) {
  return postJson('/bid-success', opts);
}

export async function semanticSearchIdeas(opts: {
  query: string;
  k?: number;
  minScore?: number;
  model?: string;
}) {
  return postJson('/semantic-search', opts);
}

export async function predictProjectSuccess(opts: {
  postId?: string;
  title?: string;
  description?: string;
  fullDetails?: string;
  category?: string;
  budget?: string;
  timeline?: string;
  skills?: string[];
  whoNeeded?: string;
  creatorId?: string;
  endpointId?: string;
}) {
  return postJson('/project-success', opts);
}

export async function detectFraud(payload: {
  expert?: Record<string, unknown>;
  review?: Record<string, unknown>;
  proposal?: Record<string, unknown>;
  behavior?: Record<string, unknown>;
  endpointId?: string;
}) {
  return postJson('/fraud-detect', payload);
}

export async function getTeamChemistry(opts: {
  postId?: string;
  postText?: string;
  candidateIds?: string[];
  topK?: number;
  projectSkills?: string[];
  projectCategory?: string;
  whoNeeded?: string;
  model?: string;
}) {
  return postJson('/team-chemistry', opts);
}

export async function getDynamicPricing(opts: {
  title?: string;
  description?: string;
  fullDetails?: string;
  category?: string;
  skills?: string[];
  budget?: string;
  timeline?: string;
  postId?: string;
}) {
  return postJson('/dynamic-pricing', opts);
}

export async function predictScopeCreep(opts: {
  title?: string;
  description?: string;
  fullDetails?: string;
  category?: string;
  skills?: string[];
  timeline?: string;
  whoNeeded?: string;
  postId?: string;
}) {
  return postJson('/scope-creep', opts);
}

export async function getFailureRecovery(opts: {
  progressPercent: number;
  timelineDays: number;
  elapsedDays?: number;
  changeRequestsCount?: number;
  stakeholderCount?: number;
  postId?: string;
}) {
  return postJson('/failure-recovery', opts);
}

export async function getReputationScore(opts: {
  userId?: string;
  profile?: Record<string, unknown>;
}) {
  return postJson('/reputation-score', opts);
}

export async function generateProposalCopilot(opts: {
  project?: Record<string, unknown>;
  actor?: Record<string, unknown>;
  preferences?: Record<string, unknown>;
}) {
  return postJson('/proposal-copilot', opts);
}

export async function analyzeProjectML(payload: {
  projectId?: string;
  title?: string;
  ideaTitle?: string;
  ideaText?: string;
  description?: string;
  fullDetails?: string;
  category?: string;
  skills?: string[];
  budget?: number | string;
  timeline?: number | string;
  teamSize?: number;
  complexity?: number;
  searchQuery?: string;
  fraudPayload?: Record<string, unknown>;
}) {
  return postMlJson('/project/analyze', payload);
}

export async function getIdeaNoveltyML(payload: {
  ideaTitle?: string;
  ideaText?: string;
  ideaId?: string;
  domain?: string;
  topK?: number;
}) {
  return postMlJson('/idea/novelty', payload);
}

export async function getActorMatchesML(payload: {
  skills?: string[];
  requiredSkills?: string[];
  domain?: string;
  category?: string;
  minAvailability?: number;
  topK?: number;
}) {
  return postMlJson('/actor/match', payload);
}

export async function getProjectPredictionML(payload: {
  complexity?: number;
  timeline?: number | string;
  budget?: number | string;
  teamSize?: number;
}) {
  return postMlJson('/project/predict', payload);
}

export async function getFraudCheckML(payload: {
  expert?: Record<string, unknown>;
  review?: Record<string, unknown>;
  proposal?: Record<string, unknown>;
  behavior?: Record<string, unknown>;
}) {
  return postMlJson('/fraud/check', payload);
}

export async function searchSemanticML(payload: {
  query: string;
  type?: 'actors' | 'projects';
  topK?: number;
}) {
  return postMlJson('/search/semantic', payload);
}
