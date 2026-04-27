import crypto from 'node:crypto';
import { ethers } from 'ethers';

const TRUST_ABI = [
  'function registerIdea(bytes32 ideaHash) external returns (bool)',
  'function getIdeaProof(bytes32 ideaHash) external view returns (address registrant, uint256 timestamp)',
  'function registerNda(bytes32 ndaHash) external returns (bool)',
  'function getNdaProof(bytes32 ndaHash) external view returns (address registrant, uint256 timestamp)',
  'function getReputation(address engineer) external view returns (uint256 averageRatingTimes100, uint256 completedProjects, uint256 trustScore, uint256 updatedAt)',
  'function updateReputation(address engineer, uint8 rating, uint256 completedProjectsIncrement, uint256 trustScore) external',
  'function logContribution(bytes32 projectId, string moduleName, address contributor) external',
  'function getContributionCount(bytes32 projectId) external view returns (uint256)',
  'function getContributionByIndex(bytes32 projectId, uint256 index) external view returns (string moduleName, address contributor, uint256 timestamp)',
];

const ESCROW_ABI = [
  'function createMilestone(address engineer, string title) external payable returns (uint256 milestoneId)',
  'function approveMilestone(uint256 milestoneId) external',
  'function releaseMilestone(uint256 milestoneId) external',
  'function milestones(uint256 milestoneId) external view returns (uint256 id, address client, address engineer, string title, uint256 amount, bool approved, bool released, uint256 createdAt, uint256 releasedAt)',
];

let provider;
let signer;
let trustContract;
let escrowContract;

function getEnv(name, fallback = '') {
  const value = process.env[name] ?? fallback;
  return String(value || '').trim();
}

function ensureProvider() {
  if (provider) return provider;
  const rpcUrl = getEnv('RPC_URL', 'https://rpc-amoy.polygon.technology');
  provider = new ethers.JsonRpcProvider(rpcUrl);
  return provider;
}

function ensureSigner() {
  if (signer) return signer;
  const privateKey = getEnv('PRIVATE_KEY');
  if (!privateKey) {
    throw new Error('Missing PRIVATE_KEY. Set blockchain signer key in environment.');
  }
  signer = new ethers.Wallet(privateKey, ensureProvider());
  return signer;
}

function ensureTrustContract() {
  if (trustContract) return trustContract;
  const address = getEnv('CONTRACT_ADDRESS');
  if (!address || !ethers.isAddress(address)) {
    throw new Error('Missing or invalid CONTRACT_ADDRESS. Deploy TechLanceTrust and set env.');
  }
  trustContract = new ethers.Contract(address, TRUST_ABI, ensureSigner());
  return trustContract;
}

function ensureEscrowContract() {
  if (escrowContract) return escrowContract;
  const address = getEnv('ESCROW_CONTRACT_ADDRESS');
  if (!address || !ethers.isAddress(address)) {
    throw new Error('Missing or invalid ESCROW_CONTRACT_ADDRESS. Deploy MilestoneEscrow and set env.');
  }
  escrowContract = new ethers.Contract(address, ESCROW_ABI, ensureSigner());
  return escrowContract;
}

function toHexSha256(value) {
  const text = String(value || '');
  const digest = crypto.createHash('sha256').update(text).digest('hex');
  return `0x${digest}`;
}

function normalizeTxReceipt(receipt) {
  return {
    hash: receipt?.hash || receipt?.transactionHash || '',
    blockNumber: Number(receipt?.blockNumber || 0),
    status: Number(receipt?.status || 0),
  };
}

function parseTimestampBigint(timestampValue) {
  const ts = Number(timestampValue || 0);
  return Number.isFinite(ts) ? ts : 0;
}

export async function registerIdeaHashOnChain(ideaText) {
  const ideaHash = toHexSha256(ideaText);
  const contract = ensureTrustContract();

  const tx = await contract.registerIdea(ideaHash);
  const receipt = await tx.wait();

  return {
    ideaHash,
    txHash: tx.hash,
    receipt: normalizeTxReceipt(receipt),
  };
}

export async function verifyIdeaHashOnChain({ ideaText, ideaHash }) {
  const hash = ideaHash && ideaHash.startsWith('0x') ? ideaHash : toHexSha256(ideaText || '');
  const contract = ensureTrustContract();

  const [registrant, timestampRaw] = await contract.getIdeaProof(hash);
  const timestamp = parseTimestampBigint(timestampRaw);

  return {
    ideaHash: hash,
    exists: timestamp > 0,
    registrant,
    timestamp,
  };
}

export async function registerNdaHashOnChain(ndaText) {
  const ndaHash = toHexSha256(ndaText);
  const contract = ensureTrustContract();

  const tx = await contract.registerNda(ndaHash);
  const receipt = await tx.wait();

  return {
    ndaHash,
    txHash: tx.hash,
    receipt: normalizeTxReceipt(receipt),
  };
}

export async function verifyNdaHashOnChain({ ndaText, ndaHash }) {
  const hash = ndaHash && ndaHash.startsWith('0x') ? ndaHash : toHexSha256(ndaText || '');
  const contract = ensureTrustContract();

  const [registrant, timestampRaw] = await contract.getNdaProof(hash);
  const timestamp = parseTimestampBigint(timestampRaw);

  return {
    ndaHash: hash,
    exists: timestamp > 0,
    registrant,
    timestamp,
  };
}

export async function createEscrowMilestone({ engineerWallet, title, amountEth }) {
  if (!ethers.isAddress(engineerWallet || '')) {
    throw new Error('Invalid engineerWallet address');
  }

  const amount = ethers.parseEther(String(amountEth || '0'));
  if (amount <= 0n) {
    throw new Error('amountEth must be greater than 0');
  }

  const contract = ensureEscrowContract();
  const tx = await contract.createMilestone(engineerWallet, String(title || 'Milestone'), { value: amount });
  const receipt = await tx.wait();

  let milestoneId = null;
  for (const log of receipt?.logs || []) {
    try {
      const parsed = contract.interface.parseLog(log);
      if (parsed?.name === 'MilestoneCreated') {
        milestoneId = Number(parsed.args?.milestoneId);
        break;
      }
    } catch {
      // no-op: skip unrelated logs
    }
  }

  return {
    milestoneId,
    txHash: tx.hash,
    amountEth: String(amountEth),
    receipt: normalizeTxReceipt(receipt),
  };
}

export async function releaseEscrowMilestone({ milestoneId, autoApprove = true }) {
  const id = Number(milestoneId);
  if (!Number.isFinite(id)) {
    throw new Error('Invalid milestoneId');
  }

  const contract = ensureEscrowContract();

  if (autoApprove) {
    const approveTx = await contract.approveMilestone(id);
    await approveTx.wait();
  }

  const tx = await contract.releaseMilestone(id);
  const receipt = await tx.wait();

  return {
    milestoneId: id,
    txHash: tx.hash,
    receipt: normalizeTxReceipt(receipt),
  };
}

export async function getEscrowMilestone(milestoneId) {
  const id = Number(milestoneId);
  const contract = ensureEscrowContract();
  const data = await contract.milestones(id);

  return {
    id: Number(data.id),
    client: data.client,
    engineer: data.engineer,
    title: data.title,
    amountWei: data.amount.toString(),
    amountEth: ethers.formatEther(data.amount),
    approved: Boolean(data.approved),
    released: Boolean(data.released),
    createdAt: Number(data.createdAt),
    releasedAt: Number(data.releasedAt),
  };
}

export async function getOnChainReputation(walletAddress) {
  if (!ethers.isAddress(walletAddress || '')) {
    throw new Error('Invalid walletAddress');
  }

  const contract = ensureTrustContract();
  const [avgRatingTimes100, completedProjects, trustScore, updatedAt] = await contract.getReputation(walletAddress);

  return {
    walletAddress,
    averageRating: Number(avgRatingTimes100) / 100,
    completedProjects: Number(completedProjects),
    trustScore: Number(trustScore),
    updatedAt: Number(updatedAt),
    verified: Number(updatedAt) > 0,
  };
}

export async function updateOnChainReputation({ walletAddress, rating, completedProjectsIncrement, trustScore }) {
  if (!ethers.isAddress(walletAddress || '')) {
    throw new Error('Invalid walletAddress');
  }

  const contract = ensureTrustContract();
  const tx = await contract.updateReputation(
    walletAddress,
    Number(rating),
    Number(completedProjectsIncrement || 0),
    Number(trustScore || 0),
  );
  const receipt = await tx.wait();

  return {
    walletAddress,
    txHash: tx.hash,
    receipt: normalizeTxReceipt(receipt),
  };
}

export async function logContributionOnChain({ projectId, moduleName, contributorWallet }) {
  if (!ethers.isAddress(contributorWallet || '')) {
    throw new Error('Invalid contributorWallet');
  }

  const projectHash = ethers.id(String(projectId || '')); 
  const contract = ensureTrustContract();
  const tx = await contract.logContribution(projectHash, String(moduleName || ''), contributorWallet);
  const receipt = await tx.wait();

  return {
    projectHash,
    txHash: tx.hash,
    receipt: normalizeTxReceipt(receipt),
  };
}

export async function getContributionsOnChain(projectId) {
  const projectHash = ethers.id(String(projectId || ''));
  const contract = ensureTrustContract();

  const countRaw = await contract.getContributionCount(projectHash);
  const count = Number(countRaw);
  const rows = [];

  for (let i = 0; i < count; i += 1) {
    const [moduleName, contributor, timestamp] = await contract.getContributionByIndex(projectHash, i);
    rows.push({
      moduleName,
      contributor,
      timestamp: Number(timestamp),
    });
  }

  return { projectHash, count, rows };
}

export function hashPlainText(value) {
  return toHexSha256(value);
}
