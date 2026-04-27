import { Router } from 'express';
import { analyzeIdeaNovelty } from '../ml/noveltyEngine.js';
import { rankActors } from '../ml/actorMatch.js';
import { predictProjectSuccess } from '../ml/successPrediction.js';
import { detectFraudRisk } from '../ml/fraudDetection.js';
import { runSemanticSearch } from '../ml/semanticSearch.js';
import { analyzeProject } from '../ml/orchestrator.js';
import { saveAIAnalysis } from '../services/firestoreService.js';
import { ensureSeedData } from '../services/store.js';

const router = Router();

router.use(async (_req, _res, next) => {
  try {
    await ensureSeedData();
    next();
  } catch (error) {
    next(error);
  }
});

router.post('/project/analyze', async (req, res, next) => {
  try {
    const result = await analyzeProject(req.body || {});
    if (req.body?.projectId && !result?.error) {
      await saveAIAnalysis(req.body.projectId, result);
    }
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/idea/novelty', async (req, res, next) => {
  try {
    const result = await analyzeIdeaNovelty(req.body || {});
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/actor/match', async (req, res, next) => {
  try {
    const result = await rankActors(req.body || {});
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/project/predict', (req, res, next) => {
  try {
    const result = predictProjectSuccess(req.body || {});
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/fraud/check', (req, res, next) => {
  try {
    const result = detectFraudRisk(req.body || {});
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/search/semantic', async (req, res, next) => {
  try {
    const result = await runSemanticSearch(req.body || {});
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'techlance-ml', at: new Date().toISOString() });
});

router.use((error, _req, res, _next) => {
  res.status(500).json({
    error: String(error?.message || error),
    hint: 'Check Firestore credentials and Vertex configuration if this persists.',
  });
});

export default router;
