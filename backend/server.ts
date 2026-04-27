import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import cors from 'cors';
import { config as loadEnv } from 'dotenv';

// AI imports
import { runAI } from './ai/ai_role3/ai/index.ts';
import { runAI2 } from './ai/ai_role2/index.ts';

function loadEnvFile() {
	const candidates = [
		path.resolve(process.cwd(), 'backend', '.env.local'),
		path.resolve(process.cwd(), 'backend', '.env'),
		path.resolve(process.cwd(), '.env.local'),
		path.resolve(process.cwd(), '.env'),
		path.resolve(process.cwd(), '..', '.env.local'),
		path.resolve(process.cwd(), '..', '.env'),
	];

	let loaded: string | null = null;

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

const loadedEnv = loadEnvFile();
const loadedCreds = ensureGoogleCredentials();

if (!loadedEnv) {
	console.warn('No .env.local found. Checked current and parent directories.');
}

if (!loadedCreds) {
	console.warn('No Google credentials found. Set GOOGLE_APPLICATION_CREDENTIALS or add backend/vertex-key.json.');
}

// ✅ IMPORT ROUTES (ONLY ONCE)
const { default: vertexRouter } = await import('./vertexai.ts');
const { default: mlRoutes } = await import('./routes/mlRoutes.js');
const { default: blockchainRoutes } = await import('./routes/blockchain.js');
const { default: firestoreRoutes } = await import('./routes/firestoreRoutes.js');

const app = express();
app.use(cors());
app.use(express.json());

// EXISTING ROUTES
app.use('/api/vertex', vertexRouter);
app.use('/api', mlRoutes);
app.use('/api', blockchainRoutes);
app.use('/api', firestoreRoutes);

// AI ROUTES
app.post('/api/ai/run', async (req, res) => {
	try {
		const result = await runAI(req.body);
		res.json(result);
	} catch (error) {
		console.error('AI ERROR:', error);
		res.status(500).json({ error: 'AI processing failed' });
	}
});

app.post('/api/ai2/run', async (req, res) => {
	try {
		const result = await runAI2(req.body);
		res.json(result);
	} catch (error) {
		console.error('AI2 ERROR:', error);
		res.status(500).json({ error: 'AI2 processing failed' });
	}
});

const PORT = 3002;
app.listen(PORT, () => {
	console.log('Backend running on port', PORT);
});