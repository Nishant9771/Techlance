import { embedText, cosineSimilarity } from '../services/embeddings.js';
import { listDocs, upsertDoc } from '../services/store.js';
import { average, clamp, keywordSignal, jaccardSimilarity } from './utils.js';

function ideaToText(idea) {
  return [idea?.title, idea?.description, idea?.summary, idea?.domain].filter(Boolean).join(' ');
}

export async function analyzeIdeaNovelty(payload = {}) {
  const ideaText = String(payload.ideaText || payload.description || '').trim();
  const ideaTitle = String(payload.ideaTitle || payload.title || 'Untitled Idea').trim();
  const ideaId = String(payload.ideaId || `idea_${Date.now()}`);
  const topK = Math.max(1, Math.min(10, Number(payload.topK) || 5));

  if (!ideaText) {
    return {
      similarityScore: 0,
      noveltyScore: 0,
      innovationScore: 0,
      similarIdeas: [],
      message: 'No idea text supplied.',
    };
  }

  const queryEmbedding = await embedText(`${ideaTitle}. ${ideaText}`);
  const existingIdeas = await listDocs('ideas', 120);

  const similarityRows = [];

  for (const idea of existingIdeas) {
    const candidateText = ideaToText(idea);
    if (!candidateText || idea.id === ideaId) continue;

    let candidateVector = Array.isArray(idea.embedding) ? idea.embedding : [];
    if (!candidateVector.length) {
      const embedded = await embedText(candidateText);
      candidateVector = embedded.vector;
    }

    const semanticScore = cosineSimilarity(queryEmbedding.vector, candidateVector);
    const lexicalScore = jaccardSimilarity(ideaText, candidateText);
    const similarity = clamp(semanticScore * 0.75 + lexicalScore * 0.25);

    similarityRows.push({
      id: idea.id,
      title: idea.title || 'Untitled',
      similarity: Number(similarity.toFixed(4)),
      domain: idea.domain || idea.category || 'general',
    });
  }

  similarityRows.sort((a, b) => b.similarity - a.similarity);
  const topSimilar = similarityRows.slice(0, topK);

  const avgSimilarity = average(topSimilar.map((row) => row.similarity), 0);
  const maxSimilarity = topSimilar.length > 0 ? topSimilar[0].similarity : 0;
  const noveltyScore = clamp(1 - maxSimilarity);

  const innovationSignals = keywordSignal(ideaText, [
    'autonomous',
    'adaptive',
    'edge',
    'predictive',
    'federated',
    'real-time',
    'optimization',
    'generative',
  ]);

  const innovationScore = clamp(noveltyScore * 0.65 + innovationSignals * 0.35);

  await upsertDoc('ideas', ideaId, {
    id: ideaId,
    title: ideaTitle,
    description: ideaText,
    domain: payload.domain || payload.category || 'general',
    embedding: queryEmbedding.vector,
    modelSource: queryEmbedding.source,
    noveltyScore: Number(noveltyScore.toFixed(4)),
    innovationScore: Number(innovationScore.toFixed(4)),
  });
  await upsertDoc('embeddings', ideaId, {
    id: ideaId,
    type: 'idea',
    text: `${ideaTitle}. ${ideaText}`,
    vector: queryEmbedding.vector,
    modelSource: queryEmbedding.source,
  });

  return {
    similarityScore: Number(avgSimilarity.toFixed(4)),
    noveltyScore: Number(noveltyScore.toFixed(4)),
    innovationScore: Number(innovationScore.toFixed(4)),
    modelSource: queryEmbedding.source,
    similarIdeas: topSimilar,
  };
}

export default analyzeIdeaNovelty;
