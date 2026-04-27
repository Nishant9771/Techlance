import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import cors from 'cors';
import { config as loadEnv } from 'dotenv';
import mlRoutes from './routes/mlRoutes.js';
import blockchainRoutes from './routes/blockchain.js';
import firestoreRoutes from './routes/firestoreRoutes.js';

function loadEnvFile() {
  const candidates = [
    path.resolve(process.cwd(), 'backend', '.env.local'),
    path.resolve(process.cwd(), 'backend', '.env'),
    path.resolve(process.cwd(), '.env.local'),
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), '..', '.env.local'),
    path.resolve(process.cwd(), '..', '.env'),
  ];

  let loaded = null;
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      loadEnv({ path: candidate, override: false });
      loaded = loaded || candidate;
    }
  }

  return loaded;
}

function ensureGoogleCredentials() {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return process.env.GOOGLE_APPLICATION_CREDENTIALS;
  }

  const candidates = [
    path.resolve(process.cwd(), 'backend', 'vertex-key.json'),
    path.resolve(process.cwd(), 'vertex-key.json'),
    path.resolve(process.cwd(), '..', 'backend', 'vertex-key.json'),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      process.env.GOOGLE_APPLICATION_CREDENTIALS = candidate;
      return candidate;
    }
  }

  return null;
}

loadEnvFile();
ensureGoogleCredentials();

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

const { default: vertexRouter } = await import('./vertexai.ts');
app.use('/api/vertex', vertexRouter);
app.use('/api', mlRoutes);
app.use('/api', blockchainRoutes);
app.use('/api', firestoreRoutes);

app.get('/', (_req, res) => {
  res.json({
    service: 'techlance-backend',
    ok: true,
    routes: ['/api/vertex/*', '/api/project/analyze', '/api/idea/novelty', '/api/actor/match'],
    at: new Date().toISOString(),
  });
});

app.use((error, _req, res, _next) => {
  res.status(500).json({
    error: String(error?.message || error),
  });
});

const PORT = Number(process.env.PORT || 3001);
app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Backend listening on ${PORT}`);
});
