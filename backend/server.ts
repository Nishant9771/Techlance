import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import cors from 'cors';
import { config as loadEnv } from 'dotenv';
 
function loadEnvFile() {
	const candidates = [
		path.resolve(process.cwd(), '.env.local'),
		path.resolve(process.cwd(), '..', '.env.local'),
	];

	for (const candidate of candidates) {
		if (fs.existsSync(candidate)) {
			loadEnv({ path: candidate });
			return candidate;
		}
	}

	return null;
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
	// eslint-disable-next-line no-console
	console.warn('No .env.local found. Checked current and parent directories.');
}

if (!loadedCreds) {
	// eslint-disable-next-line no-console
	console.warn('No Google credentials found. Set GOOGLE_APPLICATION_CREDENTIALS or add backend/vertex-key.json.');
}

const { default: vertexRouter } = await import('./vertexai');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/vertex', vertexRouter);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
	// eslint-disable-next-line no-console
	console.log(`Backend listening on ${PORT}`);
});
