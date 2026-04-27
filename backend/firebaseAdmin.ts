import admin from 'firebase-admin';
import fs from 'node:fs';

const projectId = process.env.FIREBASE_PROJECT_ID || process.env.GCP_PROJECT || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

function resolveAdminCredential() {
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (serviceAccountJson) {
    try {
      const parsed = JSON.parse(serviceAccountJson);
      return admin.credential.cert(parsed);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Invalid FIREBASE_SERVICE_ACCOUNT_JSON; falling back to Application Default Credentials.', error);
    }
  }

  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  if (clientEmail && privateKey) {
    return admin.credential.cert({
      projectId,
      clientEmail,
      privateKey: privateKey.replace(/\\n/g, '\n'),
    });
  }

  const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (credentialsPath && fs.existsSync(credentialsPath)) {
    try {
      const raw = fs.readFileSync(credentialsPath, 'utf8');
      const parsed = JSON.parse(raw);
      return admin.credential.cert(parsed);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Failed to read GOOGLE_APPLICATION_CREDENTIALS JSON; falling back to Application Default Credentials.', error);
    }
  }

  return admin.credential.applicationDefault();
}

if (!admin.apps.length) {
  // Prefer explicit service-account credentials in local/dev, then ADC in GCP.
  admin.initializeApp({
    credential: resolveAdminCredential(),
    projectId,
  });
}

export const adminDb = admin.firestore();

export default admin;
