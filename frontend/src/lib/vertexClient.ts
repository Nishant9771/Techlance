const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '/api/vertex';

export async function getEmbedding(text: string) {
  const r = await fetch(`${API_BASE}/embeddings`, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({input: text})});
  return r.json();
}

export async function predictEndpoint(endpointId: string, instances: any[]) {
  const r = await fetch(`${API_BASE}/predict`, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({endpointId, instances})});
  return r.json();
}

export async function saveEmbeddingForPost(postId: string | undefined, text: string, meta = {}) {
  const r = await fetch(`${API_BASE}/embeddings/store`, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({postId, text, meta})});
  return r.json();
}

export async function queryNearest(vector: number[], k = 8) {
  const r = await fetch(`${API_BASE}/embeddings/nearest`, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({vector, k})});
  return r.json();
}

export async function getNovelty(postId: string) {
  const r = await fetch(`${API_BASE}/novelty/${encodeURIComponent(postId)}`);
  return r.json();
}

export async function embedActorFromUser(actorId: string) {
  const r = await fetch(`${API_BASE}/actors/embed`, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({actorId})});
  return r.json();
}

export async function matchActors(opts: {postId?: string; postText?: string; candidateIds?: string[]; endpointId?: string; topK?: number}) {
  const r = await fetch(`${API_BASE}/match`, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(opts)});
  return r.json();
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
  const r = await fetch(`${API_BASE}/bid-success`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(opts),
  });
  return r.json();
}

export async function predictProjectSuccess(opts: {
  postId?: string;
  title?: string;
  description?: string;
  fullDetails?: string;
  category?: string;
  budget?: string | number;
  timeline?: string | number;
  skills?: string[];
  whoNeeded?: string;
  requireNda?: boolean;
  creatorId?: string;
  endpointId?: string;
  model?: string;
}) {
  const r = await fetch(`${API_BASE}/project-success`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(opts),
  });
  return r.json();
}
