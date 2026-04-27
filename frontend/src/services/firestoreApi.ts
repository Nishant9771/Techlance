const FIRESTORE_API_BASE = process.env.NEXT_PUBLIC_ML_API_BASE || 'http://localhost:3001/api';

async function readJsonSafe(response: Response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

async function request(path: string, options: RequestInit = {}) {
  const response = await fetch(`${FIRESTORE_API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
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

export function createProjectApi(payload: Record<string, unknown>) {
  return request('/firestore/project/create', {
    method: 'POST',
    body: JSON.stringify(payload || {}),
  });
}

export function updateProjectApi(projectId: string, payload: Record<string, unknown>) {
  return request(`/firestore/project/${encodeURIComponent(projectId)}`, {
    method: 'PATCH',
    body: JSON.stringify(payload || {}),
  });
}

export function fetchProjectDashboardApi(projectId: string) {
  return request(`/firestore/project/${encodeURIComponent(projectId)}/dashboard`);
}

export function applyToProjectApi(projectId: string, payload: Record<string, unknown>) {
  return request(`/firestore/project/${encodeURIComponent(projectId)}/apply`, {
    method: 'POST',
    body: JSON.stringify(payload || {}),
  });
}

export function saveAIAnalysisApi(projectId: string, payload: Record<string, unknown>) {
  return request(`/firestore/project/${encodeURIComponent(projectId)}/ai-analysis`, {
    method: 'POST',
    body: JSON.stringify(payload || {}),
  });
}

export function storeBlockchainProofApi(projectId: string, payload: Record<string, unknown>) {
  return request(`/firestore/project/${encodeURIComponent(projectId)}/blockchain-proof`, {
    method: 'POST',
    body: JSON.stringify(payload || {}),
  });
}

export function createMilestoneApi(projectId: string, payload: Record<string, unknown>) {
  return request(`/firestore/project/${encodeURIComponent(projectId)}/milestone`, {
    method: 'POST',
    body: JSON.stringify(payload || {}),
  });
}

export function storeReviewApi(payload: Record<string, unknown>) {
  return request('/firestore/reviews', {
    method: 'POST',
    body: JSON.stringify(payload || {}),
  });
}

export function searchTalentApi(params: {
  role?: 'actor' | 'supplier';
  skills?: string[];
  location?: string;
  availability?: boolean;
  limit?: number;
}) {
  const query = new URLSearchParams();
  if (params.role) query.set('role', params.role);
  if (params.skills?.length) query.set('skills', params.skills.join(','));
  if (params.location) query.set('location', params.location);
  if (typeof params.availability === 'boolean') query.set('availability', String(params.availability));
  if (params.limit) query.set('limit', String(params.limit));

  return request(`/firestore/search/talent?${query.toString()}`);
}
