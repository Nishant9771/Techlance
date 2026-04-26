import fs from 'node:fs';
import path from 'node:path';
import { config as loadEnv } from 'dotenv';
import { GoogleAuth } from 'google-auth-library';

function loadLocalEnv() {
  const candidates = [
    path.resolve(process.cwd(), '.env.local'),
    path.resolve(process.cwd(), '..', '.env.local'),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      loadEnv({ path: candidate });  
      return;
    }
  }
}

function resolveKeyFile() {
  const envPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (envPath && fs.existsSync(envPath)) {
    return envPath;
  }

  const candidates = [
    path.resolve(process.cwd(), 'vertex-key.json'),
    path.resolve(process.cwd(), 'backend', 'vertex-key.json'),
    path.resolve(process.cwd(), '..', 'backend', 'vertex-key.json'),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return undefined;
}

loadLocalEnv();

const projectId =
  process.env.GCP_PROJECT ||
  process.env.GOOGLE_CLOUD_PROJECT ||
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const location = process.env.VERTEX_LOCATION || 'us-central1';
const model = process.env.VERTEX_EMBEDDING_MODEL || 'text-embedding-004';

if (!projectId) {
  throw new Error('Missing project id. Set GCP_PROJECT in .env.local');
}

const keyFilename = resolveKeyFile();
const endpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${model}:predict`;

async function getAccessToken() {
  const auth = new GoogleAuth({
    keyFilename,
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  });
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  return token.token ?? token;
}

function extractFirstNumericArray(x) {
  const visited = new Set();
  function walk(obj) {
    if (!obj || visited.has(obj)) return null;
    visited.add(obj);
    if (Array.isArray(obj)) {
      if (obj.length > 0 && typeof obj[0] === 'number' && obj.every((v) => typeof v === 'number' && Number.isFinite(v))) {
        return obj;
      }
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

export async function getEmbedding(text) {
  if (!text) {
    throw new Error('Text is required for embeddings.');
  }

  const accessToken = await getAccessToken();
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      instances: [{ content: text, mime_type: 'text/plain' }],
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error?.message || `Vertex embeddings request failed with status ${response.status}`);
  }

  const vector = extractFirstNumericArray(data);

  if (!Array.isArray(vector)) {
    throw new Error('Embedding vector not found in Vertex response.');
  }

  return vector;
}