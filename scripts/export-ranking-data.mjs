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

function cosineSimilarity(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b)) return 0;
  const n = Math.min(a.length, b.length);
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < n; i += 1) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const denom = Math.sqrt((na || 1e-12) * (nb || 1e-12));
  return dot / denom;
}

function parseBudgetNumber(budget) {
  if (typeof budget !== 'string') return 0;
  const normalized = budget.replace(/[^0-9.]/g, '');
  const value = Number(normalized);
  return Number.isFinite(value) ? value : 0;
}

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

async function run() {
  const offersSnap = await db.collection('offers').get();
  const postEmbeddingsSnap = await db.collection('embeddings').get();
  const actorEmbeddingsSnap = await db.collection('actorEmbeddings').get();

  const postEmbeddings = new Map();
  postEmbeddingsSnap.forEach((doc) => {
    const data = doc.data();
    postEmbeddings.set(doc.id, data.vector || []);
  });

  const actorEmbeddings = new Map();
  actorEmbeddingsSnap.forEach((doc) => {
    const data = doc.data();
    actorEmbeddings.set(doc.id, data.vector || []);
  });

  const rows = [];

  for (const offerDoc of offersSnap.docs) {
    const offer = offerDoc.data();
    const postId = String(offer.contextId || '');
    const actorId = String(offer.senderId || '');

    if (!postId || !actorId) {
      continue;
    }

    const postVector = postEmbeddings.get(postId);
    const actorVector = actorEmbeddings.get(actorId);

    if (!postVector || !actorVector) {
      continue;
    }

    const userDoc = await db.collection('users').doc(actorId).get();
    const user = userDoc.exists ? userDoc.data() : {};
    const postDoc = await db.collection('projectPosts').doc(postId).get();
    const post = postDoc.exists ? postDoc.data() : {};

    const similarity = cosineSimilarity(postVector, actorVector);
    const rating = toNumber(user?.rating ?? user?.avgRating ?? 0);
    const yearsExperience = toNumber(user?.experienceYears ?? user?.yearsExperience ?? user?.years ?? 0);
    const budget = parseBudgetNumber(String(post?.budget ?? '0'));
    const offerAmount = parseBudgetNumber(String(offer.amount ?? '0'));
    const priceGapRatio = budget > 0 ? Math.abs(offerAmount - budget) / budget : 0;
    const accepted = offer.status === 'accepted' ? 1 : 0;

    rows.push({
      postId,
      actorId,
      similarity,
      rating,
      yearsExperience,
      budget,
      offerAmount,
      priceGapRatio,
      accepted,
    });
  }

  const header = [
    'postId',
    'actorId',
    'similarity',
    'rating',
    'yearsExperience',
    'budget',
    'offerAmount',
    'priceGapRatio',
    'accepted',
  ];

  const csv = [
    header.join(','),
    ...rows.map((r) => [
      r.postId,
      r.actorId,
      r.similarity,
      r.rating,
      r.yearsExperience,
      r.budget,
      r.offerAmount,
      r.priceGapRatio,
      r.accepted,
    ].join(',')),
  ].join('\n');

  writeFileSync('ranking-dataset.csv', csv, 'utf-8');
  console.log(`Exported ${rows.length} rows to ranking-dataset.csv`);
}

run().catch((error) => {
  console.error('Failed to export ranking dataset', error);
  process.exit(1);
});
