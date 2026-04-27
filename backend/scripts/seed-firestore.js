import { randomUUID } from 'node:crypto';
import admin, { adminDb } from '../firebaseAdmin.ts';

const { FieldValue } = admin.firestore;

function nowIso() {
  return new Date().toISOString();
}

async function setDoc(pathSegments, payload) {
  const ref = pathSegments.reduce((acc, segment, index) => {
    if (index === 0) return adminDb.collection(segment);
    return index % 2 === 1 ? acc.doc(segment) : acc.collection(segment);
  }, null);

  await ref.set(payload, { merge: true });
}

async function seedUsers() {
  const users = [
    {
      uid: 'demo_user_1',
      email: 'student@techlance.dev',
      displayName: 'Aarav Student',
      role: 'user',
      phone: '+91-900000001',
      location: 'Bengaluru',
      availability: true,
      walletAddress: '0x000000000000000000000000000000000000dEaD',
      skills: ['product', 'research'],
      trustScore: 0.62,
      ratings: { average: 4.5, count: 7 },
    },
    {
      uid: 'demo_actor_1',
      email: 'actor@techlance.dev',
      displayName: 'Isha Engineer',
      role: 'actor',
      phone: '+91-900000002',
      location: 'Pune',
      availability: true,
      walletAddress: '0x000000000000000000000000000000000000bEEF',
      skills: ['embedded', 'iot', 'react'],
      trustScore: 0.79,
      ratings: { average: 4.8, count: 18 },
    },
    {
      uid: 'demo_supplier_1',
      email: 'supplier@techlance.dev',
      displayName: 'Rohan Supplier',
      role: 'supplier',
      phone: '+91-900000003',
      location: 'Delhi',
      availability: true,
      walletAddress: '0x000000000000000000000000000000000000c0de',
      skills: ['pcb', 'components', 'logistics'],
      trustScore: 0.74,
      ratings: { average: 4.6, count: 11 },
    },
  ];

  for (const user of users) {
    await setDoc(['users', user.uid], {
      ...user,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      createdAtIso: nowIso(),
      updatedAtIso: nowIso(),
    });

    await setDoc(['reputation', user.uid], {
      uid: user.uid,
      averageRating: user.ratings.average,
      ratingsCount: user.ratings.count,
      ratingsTotal: user.ratings.average * user.ratings.count,
      completedProjects: 3,
      disputeCount: 0,
      trustScore: user.trustScore,
      updatedAt: FieldValue.serverTimestamp(),
      updatedAtIso: nowIso(),
    });
  }
}

async function seedProjectSuite() {
  const projectId = 'demo_project_1';
  const project = {
    ownerId: 'demo_user_1',
    ownerRole: 'user',
    title: 'Smart Irrigation IoT Controller',
    problemStatement: 'Need an IoT + mobile dashboard system for water optimization.',
    description: 'Solar powered irrigation automation with cloud dashboard.',
    fullDetails: 'Use ESP32, moisture sensors, relay control, analytics dashboard, and supplier support.',
    category: 'IoT',
    budget: { min: 2000, max: 4500, currency: 'USD' },
    timelineDays: 45,
    teamSize: 3,
    status: 'open',
    requiredSkills: ['iot', 'embedded', 'react'],
    actorNeeded: true,
    supplierNeeded: true,
    innovationScore: 0.73,
    noveltyScore: 0.69,
    successProbability: 0.78,
    fraudRisk: 0.14,
    scopeRisk: 0.31,
    trustScore: 0.81,
    pricingEstimate: { min: 2200, recommended: 3400, max: 4700, currency: 'USD' },
    applicationCount: 1,
    milestoneCount: 2,
  };

  await setDoc(['projects', projectId], {
    ...project,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    createdAtIso: nowIso(),
    updatedAtIso: nowIso(),
  });

  await setDoc(['ai_analysis', projectId], {
    projectId,
    innovationScore: 0.73,
    noveltyScore: 0.69,
    successProbability: 0.78,
    fraudRisk: 0.14,
    chemistryScore: 0.76,
    scopeRisk: 0.31,
    pricingEstimate: { min: 2200, recommended: 3400, max: 4700, currency: 'USD' },
    recommendedActors: [
      { id: 'demo_actor_1', name: 'Isha Engineer', score: 0.92 },
      { id: 'demo_actor_2', name: 'Kabir Robotics', score: 0.84 },
    ],
    recoveryActions: ['Freeze v1 scope', 'Weekly milestone review'],
    generatedAt: FieldValue.serverTimestamp(),
    generatedAtIso: nowIso(),
    updatedAt: FieldValue.serverTimestamp(),
    updatedAtIso: nowIso(),
  });

  await setDoc(['blockchain_proofs', projectId], {
    projectId,
    ideaHash: '0xidea_demo_hash',
    txHash: '0xtx_demo_hash',
    ndaHash: '0xnda_demo_hash',
    escrowContractAddress: '0x0000000000000000000000000000000000001234',
    chainId: 80002,
    network: 'polygon-amoy',
    proofType: 'idea_ownership',
    createdAt: FieldValue.serverTimestamp(),
    createdAtIso: nowIso(),
    updatedAt: FieldValue.serverTimestamp(),
    updatedAtIso: nowIso(),
  });

  const milestones = [
    { id: 'demo_milestone_1', title: 'Prototype', sequence: 1, amount: 1200, status: 'funded' },
    { id: 'demo_milestone_2', title: 'Pilot Deployment', sequence: 2, amount: 2200, status: 'pending' },
  ];

  for (const milestone of milestones) {
    const row = {
      ...milestone,
      projectId,
      currency: 'USD',
      dueDate: null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      createdAtIso: nowIso(),
      updatedAtIso: nowIso(),
    };

    await setDoc(['milestones', milestone.id], row);
    await setDoc(['projects', projectId, 'milestones', milestone.id], row);
  }

  const applicationId = 'demo_application_1';
  const application = {
    id: applicationId,
    projectId,
    actorId: 'demo_actor_1',
    actorName: 'Isha Engineer',
    actorRole: 'actor',
    proposal: 'Can deliver ESP32 firmware + dashboard in 6 weeks.',
    bidAmount: 3500,
    etaDays: 42,
    status: 'pending',
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    createdAtIso: nowIso(),
    updatedAtIso: nowIso(),
  };

  await setDoc(['applications', applicationId], application);
  await setDoc(['projects', projectId, 'applications', applicationId], application);

  const roomId = `project_${projectId}`;
  await setDoc(['chats', roomId], {
    roomId,
    projectId,
    participants: ['demo_user_1', 'demo_actor_1'],
    updatedAt: FieldValue.serverTimestamp(),
    updatedAtIso: nowIso(),
    lastMessage: {
      senderId: 'demo_actor_1',
      text: 'Prototype BOM shared.',
      createdAtIso: nowIso(),
    },
  });

  const messageId = randomUUID();
  await setDoc(['chats', roomId, 'messages', messageId], {
    id: messageId,
    roomId,
    senderId: 'demo_actor_1',
    senderRole: 'actor',
    text: 'Prototype BOM shared.',
    readBy: ['demo_actor_1'],
    createdAt: FieldValue.serverTimestamp(),
    createdAtIso: nowIso(),
  });

  await setDoc(['notifications', 'demo_user_1', 'items', 'demo_notification_1'], {
    id: 'demo_notification_1',
    uid: 'demo_user_1',
    type: 'application',
    title: 'New actor application',
    body: 'Isha Engineer applied to your project.',
    deepLink: `/post/${projectId}`,
    read: false,
    createdAt: FieldValue.serverTimestamp(),
    createdAtIso: nowIso(),
  });

  await setDoc(['reviews', 'demo_review_1'], {
    id: 'demo_review_1',
    projectId,
    fromUid: 'demo_user_1',
    toUid: 'demo_actor_1',
    rating: 5,
    comment: 'Excellent delivery quality.',
    tags: ['timely', 'quality'],
    createdAt: FieldValue.serverTimestamp(),
    createdAtIso: nowIso(),
  });

  await setDoc(['documents', 'demo_doc_1'], {
    id: 'demo_doc_1',
    projectId,
    type: 'nda',
    storagePath: 'documents/demo_project_1/nda.pdf',
    hash: '0xnda_demo_hash',
    uploadedBy: 'demo_user_1',
    createdAt: FieldValue.serverTimestamp(),
    createdAtIso: nowIso(),
  });

  await setDoc(['projects', projectId, 'documents', 'demo_doc_1'], {
    id: 'demo_doc_1',
    projectId,
    type: 'nda',
    storagePath: 'documents/demo_project_1/nda.pdf',
    hash: '0xnda_demo_hash',
    uploadedBy: 'demo_user_1',
    createdAt: FieldValue.serverTimestamp(),
    createdAtIso: nowIso(),
  });

  await setDoc(['embeddings', projectId], {
    id: projectId,
    sourceType: 'project',
    sourceId: projectId,
    model: 'gemini-text-embedding-004',
    vector: [0.14, 0.77, 0.33, 0.55],
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
}

async function main() {
  await seedUsers();
  await seedProjectSuite();
  // eslint-disable-next-line no-console
  console.log('Firestore seed complete. Collections bootstrapped for user, actor, and supplier roles.');
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Firestore seed failed:', error);
  process.exitCode = 1;
});
