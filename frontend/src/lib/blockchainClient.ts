const BLOCKCHAIN_API_BASE = process.env.NEXT_PUBLIC_ML_API_BASE || 'http://localhost:3001/api';

async function readJsonSafe(response: Response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

async function post(path: string, payload: Record<string, unknown>) {
  const response = await fetch(`${BLOCKCHAIN_API_BASE}${path}`, {
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

export function registerIdeaProof(payload: {
  ideaText: string;
  title?: string;
  creatorId?: string;
  walletAddress?: string;
  projectId?: string;
}) {
  return post('/idea/register', payload);
}

export function verifyIdeaProof(payload: {
  ideaText?: string;
  ideaHash?: string;
  ideaId?: string;
}) {
  return post('/idea/verify', payload);
}

export function registerNdaProof(payload: {
  ndaText: string;
  projectId?: string;
  title?: string;
}) {
  return post('/nda/register', payload);
}

export function verifyNdaProof(payload: {
  ndaText?: string;
  ndaHash?: string;
}) {
  return post('/nda/verify', payload);
}

export function createEscrow(payload: {
  engineerWallet: string;
  title: string;
  amountEth: string;
  projectId?: string;
}) {
  return post('/escrow/create', payload);
}

export function releaseEscrow(payload: {
  milestoneId: number;
  autoApprove?: boolean;
}) {
  return post('/escrow/release', payload);
}

export function getEscrow(payload: { milestoneId: number }) {
  return post('/escrow/get', payload);
}

export function getBlockchainReputation(payload: { walletAddress: string }) {
  return post('/reputation/get', payload);
}

export function logContribution(payload: {
  projectId: string;
  moduleName: string;
  contributorWallet: string;
}) {
  return post('/contribution/log', payload);
}

export function listContributions(payload: { projectId: string }) {
  return post('/contribution/list', payload);
}
