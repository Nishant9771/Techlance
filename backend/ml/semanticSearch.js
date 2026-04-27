import { embedText, cosineSimilarity } from '../services/embeddings.js';
import { listDocs } from '../services/store.js';
import { clamp } from './utils.js';

function recordToText(record) {
  return [
    record?.title,
    record?.description,
    record?.summary,
    record?.category,
    Array.isArray(record?.skills) ? record.skills.join(' ') : record?.skills,
    record?.name,
    Array.isArray(record?.domains) ? record.domains.join(' ') : record?.domains,
  ]
    .filter(Boolean)
    .join(' ');
}

export async function runSemanticSearch(payload = {}) {
  const query = String(payload.query || '').trim();
  const type = String(payload.type || 'projects').toLowerCase() === 'actors' ? 'actors' : 'projects';
  const topK = Math.max(1, Math.min(25, Number(payload.topK) || 8));

  if (!query) {
    return { query, type, results: [] };
  }

  const collection = type === 'actors' ? 'actors' : 'projects';
  const corpus = await listDocs(collection, 250);
  const queryEmbedding = await embedText(query);

  const rows = [];
  for (const item of corpus) {
    const itemText = recordToText(item);
    if (!itemText) continue;

    const candidateEmbedding = Array.isArray(item.embedding)
      ? { vector: item.embedding, source: item.modelSource || 'stored' }
      : await embedText(itemText);

    const score = clamp(cosineSimilarity(queryEmbedding.vector, candidateEmbedding.vector));

    rows.push({
      id: item.id,
      title: item.title || item.name || item.id,
      description: item.description || item.summary || '',
      score: Number(score.toFixed(4)),
      category: item.category || item.domain || 'general',
      skills: Array.isArray(item.skills) ? item.skills : [],
    });
  }

  rows.sort((a, b) => b.score - a.score);

  return {
    query,
    type,
    modelSource: queryEmbedding.source,
    results: rows.slice(0, topK),
  };
}

export default runSemanticSearch;
