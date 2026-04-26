import admin from 'firebase-admin';
import { writeFileSync } from 'node:fs';

const projectId = process.env.FIREBASE_PROJECT_ID || process.env.GCP_PROJECT || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId,
  });
}

const db = admin.firestore();

function clamp(value, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function average(values) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function cosineSimilarity(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length === 0 || b.length === 0) return 0;
  const n = Math.min(a.length, b.length);
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < n; i += 1) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / Math.sqrt((na || 1e-12) * (nb || 1e-12));
}

function parseBudgetNumber(value) {
  const normalized = String(value ?? '').replace(/[^0-9.]/g, '');
  const number = Number(normalized);
  return Number.isFinite(number) ? number : 0;
}

function parseDays(value) {
  const match = String(value ?? '').match(/\d+/);
  if (!match) return 0;
  const number = Number(match[0]);
  return Number.isFinite(number) ? number : 0;
}

function normalizeStringArray(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item ?? '').trim()).filter(Boolean);
  }
  if (typeof value === 'string') {
    return value.split(',').map((item) => item.trim()).filter(Boolean);
  }
  return [];
}

function inferCategoryComplexity(category) {
  const text = String(category ?? '').toLowerCase();
  if (!text) return 0.58;
  if (/ai|machine learning|robotics|computer vision|hardware|iot|firmware|embedded/.test(text)) return 0.85;
  if (/mechanical|civil|manufacturing|pcb|electronics/.test(text)) return 0.72;
  if (/web|frontend|backend|app|software/.test(text)) return 0.56;
  return 0.62;
}

function pickNestedNumber(record, keys, fallback = 0) {
  const containers = [record, record?.profileDetails, record?.stats, record?.profileDetails?.stats];
  for (const container of containers) {
    if (!container || typeof container !== 'object') continue;
    for (const key of keys) {
      const value = Number(container[key]);
      if (Number.isFinite(value)) return value;
    }
  }
  return fallback;
}

function pickNestedText(record, keys) {
  const containers = [record, record?.profileDetails, record?.stats, record?.profileDetails?.stats];
  for (const container of containers) {
    if (!container || typeof container !== 'object') continue;
    for (const key of keys) {
      const value = container[key];
      if (typeof value === 'string' && value.trim()) return value.trim();
    }
  }
  return '';
}

async function run() {
  const [postsSnap, postEmbeddingsSnap, actorEmbeddingsSnap, usersSnap] = await Promise.all([
    db.collection('projectPosts').get(),
    db.collection('embeddings').get(),
    db.collection('actorEmbeddings').get(),
    db.collection('users').get(),
  ]);

  const postEmbeddings = new Map();
  postEmbeddingsSnap.forEach((doc) => {
    postEmbeddings.set(doc.id, doc.data().vector || []);
  });

  const actorVectors = [];
  actorEmbeddingsSnap.forEach((doc) => {
    actorVectors.push({ actorId: doc.id, vector: doc.data().vector || [] });
  });

  const users = new Map();
  usersSnap.forEach((doc) => {
    users.set(doc.id, doc.data());
  });

  const allPostVectors = Array.from(postEmbeddings.entries()).map(([id, vector]) => ({ id, vector }));
  const rows = [];

  for (const postDoc of postsSnap.docs) {
    const post = postDoc.data();
    const postId = postDoc.id;
    const vector = postEmbeddings.get(postId) || [];
    const skillList = normalizeStringArray(post?.skills);
    const skillCount = skillList.length;
    const descriptionLength = String(post?.description ?? '').trim().length;
    const fullDetailsLength = String(post?.fullDetails ?? '').trim().length;
    const budget = parseBudgetNumber(post?.budget);
    const timelineDays = parseDays(post?.timeline);
    const categoryComplexity = inferCategoryComplexity(post?.category);
    const skillDefinition = clamp(skillCount / 6);
    const scopeClarity = clamp(
      clamp(descriptionLength / 260) * 0.35 +
      clamp(fullDetailsLength / 900) * 0.4 +
      skillDefinition * 0.15 +
      (post?.whoNeeded ? 0.1 : 0),
    );
    const complexityScore = clamp(
      categoryComplexity * 0.4 +
      clamp(skillCount / 8) * 0.25 +
      clamp((descriptionLength + fullDetailsLength) / 1600) * 0.35,
    );
    const expectedBudget = 1200 + skillCount * 500 + timelineDays * 65 + categoryComplexity * 2500 + complexityScore * 1800;
    const recommendedDays = Math.max(10, Math.round(skillCount * 5 + categoryComplexity * 24 + complexityScore * 28));
    const budgetFeasibility = budget > 0 ? clamp(budget / Math.max(expectedBudget, 1)) : 0.4;
    const timelineFeasibility = timelineDays > 0 ? clamp(timelineDays / recommendedDays) : 0.45;

    let novelty = 0.5;
    let maxSimilarity = 0;
    if (vector.length > 0) {
      const similarities = allPostVectors
        .filter((candidate) => candidate.id !== postId && Array.isArray(candidate.vector) && candidate.vector.length > 0)
        .map((candidate) => cosineSimilarity(vector, candidate.vector));
      if (similarities.length > 0) {
        maxSimilarity = Math.max(...similarities);
        novelty = clamp(1 - maxSimilarity);
      } else {
        novelty = 1;
      }
    }

    let candidateCount = 0;
    let topActorSimilarity = 0;
    let avgTopActorSimilarity = 0;
    if (vector.length > 0) {
      const similarities = actorVectors
        .map((actor) => cosineSimilarity(vector, actor.vector))
        .filter((value) => Number.isFinite(value))
        .sort((a, b) => b - a);
      candidateCount = similarities.length;
      topActorSimilarity = similarities[0] ?? 0;
      avgTopActorSimilarity = average(similarities.slice(0, 5));
    }

    const marketDepth = clamp(Math.log10(candidateCount + 1));
    const talentFit = candidateCount > 0
      ? clamp(topActorSimilarity * 0.6 + avgTopActorSimilarity * 0.25 + marketDepth * 0.15)
      : 0.35;

    const creator = users.get(String(post?.createdBy ?? '')) || null;
    const creatorHasBio = Boolean(pickNestedText(creator, ['bio', 'summary', 'previousWorkDescription']));
    const creatorProfileCompleteness = creator
      ? average([
          creator?.displayName ? 1 : 0,
          creator?.location ? 1 : 0,
          creator?.profileDetails ? 1 : 0,
          creatorHasBio ? 1 : 0,
        ])
      : 0.55;
    const creatorTrust = clamp(pickNestedNumber(creator, ['trustScore'], creator ? 60 : 55) / 100);
    const creatorCompletedProjects = clamp(Math.min(20, pickNestedNumber(creator, ['completedProjects'], 0)) / 20);
    const creatorProjectsPosted = clamp(Math.min(20, pickNestedNumber(creator, ['projectsPosted'], 0)) / 20);
    const creatorReadiness = creator
      ? clamp(
          creatorProfileCompleteness * 0.45 +
          creatorTrust * 0.2 +
          creatorCompletedProjects * 0.2 +
          creatorProjectsPosted * 0.15,
        )
      : 0.55;

    const noveltyAdvantage = clamp(0.45 + novelty * 0.55);
    const budgetPerSkill = skillCount > 0 ? budget / skillCount : budget;
    const daysPerSkill = skillCount > 0 ? timelineDays / skillCount : timelineDays;
    const ndaRequired = post?.requireNda ? 1 : 0;
    const successful = post?.status === 'Completed' || Number(post?.progress ?? 0) >= 100 ? 1 : 0;

    rows.push({
      postId,
      scopeClarity,
      budgetFeasibility,
      timelineFeasibility,
      talentFit,
      creatorReadiness,
      novelty,
      noveltyAdvantage,
      maxSimilarity,
      budget,
      timelineDays,
      skillCount,
      skillDefinition,
      categoryComplexity,
      complexityScore,
      candidateCount,
      topActorSimilarity,
      avgTopActorSimilarity,
      marketDepth,
      descriptionLength,
      fullDetailsLength,
      budgetPerSkill,
      daysPerSkill,
      ndaRequired,
      successful,
    });
  }

  const header = [
    'postId',
    'scopeClarity',
    'budgetFeasibility',
    'timelineFeasibility',
    'talentFit',
    'creatorReadiness',
    'novelty',
    'noveltyAdvantage',
    'maxSimilarity',
    'budget',
    'timelineDays',
    'skillCount',
    'skillDefinition',
    'categoryComplexity',
    'complexityScore',
    'candidateCount',
    'topActorSimilarity',
    'avgTopActorSimilarity',
    'marketDepth',
    'descriptionLength',
    'fullDetailsLength',
    'budgetPerSkill',
    'daysPerSkill',
    'ndaRequired',
    'successful',
  ];

  const csv = [
    header.join(','),
    ...rows.map((row) => header.map((key) => row[key]).join(',')),
  ].join('\n');

  writeFileSync('project-success-dataset.csv', csv, 'utf-8');
  console.log(`Exported ${rows.length} rows to project-success-dataset.csv`);
}

run().catch((error) => {
  console.error('Failed to export project success dataset', error);
  process.exit(1);
});
