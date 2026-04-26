import { getEmbedding } from './embeddings.js';

function cosineSimilarity(a, b) {
	let dot = 0;
	let magA = 0;
	let magB = 0;

	const n = Math.min(a.length, b.length);
	for (let i = 0; i < n; i += 1) {
		dot += a[i] * b[i];
		magA += a[i] * a[i];
		magB += b[i] * b[i];
	}

	return dot / Math.sqrt((magA || 1e-12) * (magB || 1e-12));
}

(async () => {
	try {
		const idea1 = await getEmbedding('AI smart irrigation');
		const idea2 = await getEmbedding('Machine learning farming system');

		const sim = cosineSimilarity(idea1, idea2);
		const novelty = 1 - sim;

		console.log('Similarity:', sim);
		console.log('Novelty:', novelty);
	} catch (error) {
		console.error('novelty.js failed');
		console.error(error instanceof Error ? error.message : error);
		process.exit(1);
	}
})();