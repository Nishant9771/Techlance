import { getEmbedding } from '../embeddings.js';

const memoryEmbeddings = new Map();

function clamp(value, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function tokenize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]+/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 1);
}

function normalizeVector(vector) {
  const vec = Array.isArray(vector) ? vector.map((v) => Number(v) || 0) : [];
  const magnitude = Math.sqrt(vec.reduce((acc, value) => acc + value * value, 0)) || 1e-12;
  return vec.map((value) => value / magnitude);
}

function pseudoEmbeddingFromText(text, dimensions = 256) {
  const tokens = tokenize(text);
  const vector = new Array(dimensions).fill(0);

  for (let tokenIndex = 0; tokenIndex < tokens.length; tokenIndex += 1) {
    const token = tokens[tokenIndex];
    for (let charIndex = 0; charIndex < token.length; charIndex += 1) {
      const code = token.charCodeAt(charIndex);
      const idx = (code * 37 + tokenIndex * 17 + charIndex * 13) % dimensions;
      const sign = code % 2 === 0 ? 1 : -1;
      vector[idx] += sign * ((charIndex + 1) / (token.length + 1));
    }
  }

  return normalizeVector(vector);
}

export function cosineSimilarity(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length === 0 || b.length === 0) {
    return 0;
  }

  const n = Math.min(a.length, b.length);
  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < n; i += 1) {
    const av = Number(a[i]) || 0;
    const bv = Number(b[i]) || 0;
    dot += av * bv;
    normA += av * av;
    normB += bv * bv;
  }

  const denom = Math.sqrt(normA || 1e-12) * Math.sqrt(normB || 1e-12);
  return clamp(dot / (denom || 1e-12), -1, 1);
}

export async function embedText(text) {
  const clean = String(text || '').trim();
  if (!clean) {
    return { vector: [], source: 'empty' };
  }

  try {
    const vector = await getEmbedding(clean);
    return { vector: normalizeVector(vector), source: 'vertex' };
  } catch (error) {
    return {
      vector: pseudoEmbeddingFromText(clean),
      source: 'pseudo',
      fallbackReason: String(error?.message || error),
    };
  }
}

export function upsertEmbeddingCache(key, payload) {
  if (!key) return;
  memoryEmbeddings.set(key, payload);
}

export function getEmbeddingCache(key) {
  return memoryEmbeddings.get(key) || null;
}

export function listEmbeddingCache() {
  return Array.from(memoryEmbeddings.values());
}
