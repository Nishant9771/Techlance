import admin from 'firebase-admin';

const projectId = process.env.FIREBASE_PROJECT_ID || process.env.GCP_PROJECT || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

if (!admin.apps.length) {
  // Use Application Default Credentials (recommended in GCP)
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId,
  });
}

export const adminDb = admin.firestore();

export default admin;
