import { getEmbedding } from './embeddings.js';

(async () => {
	try {
		const result = await getEmbedding('AI smart irrigation');
		console.log('Embedding length:', result.length);
		console.log('First 8 values:', result.slice(0, 8));
	} catch (error) {
		console.error('test.js failed');
		console.error(error instanceof Error ? error.message : error);
		process.exit(1);
	}
})();