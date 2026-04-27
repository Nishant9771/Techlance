import { Router } from 'express';
import {
  applyToProject,
  createMilestone,
  createNotification,
  createProject,
  getChatMessages,
  getProjectDashboard,
  queryProjects,
  saveAIAnalysis,
  searchTalent,
  sendChatMessage,
  storeBlockchainProof,
  storeReview,
  updateProject,
  upsertUserProfile,
} from '../services/firestoreService.js';

const router = Router();

router.post('/firestore/users/upsert', async (req, res, next) => {
  try {
    const record = await upsertUserProfile(req.body || {});
    res.json({ ok: true, user: record });
  } catch (error) {
    next(error);
  }
});

router.post('/firestore/project/create', async (req, res, next) => {
  try {
    const project = await createProject(req.body || {});
    res.json({ ok: true, project });
  } catch (error) {
    next(error);
  }
});

router.patch('/firestore/project/:projectId', async (req, res, next) => {
  try {
    const project = await updateProject(req.params.projectId, req.body || {});
    res.json({ ok: true, project });
  } catch (error) {
    next(error);
  }
});

router.get('/firestore/project/:projectId/dashboard', async (req, res, next) => {
  try {
    const dashboard = await getProjectDashboard(req.params.projectId);
    if (!dashboard) {
      return res.status(404).json({ error: 'Project not found' });
    }
    return res.json({ ok: true, ...dashboard });
  } catch (error) {
    return next(error);
  }
});

router.post('/firestore/project/:projectId/apply', async (req, res, next) => {
  try {
    const application = await applyToProject(req.params.projectId, req.body || {});
    res.json({ ok: true, application });
  } catch (error) {
    next(error);
  }
});

router.post('/firestore/project/:projectId/ai-analysis', async (req, res, next) => {
  try {
    const analysis = await saveAIAnalysis(req.params.projectId, req.body || {});
    res.json({ ok: true, analysis });
  } catch (error) {
    next(error);
  }
});

router.post('/firestore/project/:projectId/blockchain-proof', async (req, res, next) => {
  try {
    const proof = await storeBlockchainProof(req.params.projectId, req.body || {});
    res.json({ ok: true, proof });
  } catch (error) {
    next(error);
  }
});

router.post('/firestore/project/:projectId/milestone', async (req, res, next) => {
  try {
    const milestone = await createMilestone(req.params.projectId, req.body || {});
    res.json({ ok: true, milestone });
  } catch (error) {
    next(error);
  }
});

router.post('/firestore/reviews', async (req, res, next) => {
  try {
    const review = await storeReview(req.body || {});
    res.json({ ok: true, review });
  } catch (error) {
    next(error);
  }
});

router.post('/firestore/notifications/:uid', async (req, res, next) => {
  try {
    const notification = await createNotification(req.params.uid, req.body || {});
    res.json({ ok: true, notification });
  } catch (error) {
    next(error);
  }
});

router.post('/firestore/chat/:roomId/message', async (req, res, next) => {
  try {
    const message = await sendChatMessage(req.params.roomId, req.body || {});
    res.json({ ok: true, message });
  } catch (error) {
    next(error);
  }
});

router.get('/firestore/chat/:roomId/messages', async (req, res, next) => {
  try {
    const messages = await getChatMessages(req.params.roomId, Number(req.query.limit || 50));
    res.json({ ok: true, messages });
  } catch (error) {
    next(error);
  }
});

router.get('/firestore/search/talent', async (req, res, next) => {
  try {
    const skills = String(req.query.skills || '')
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);

    const rows = await searchTalent({
      role: req.query.role || 'actor',
      location: req.query.location || '',
      skills,
      availability: req.query.availability === undefined ? null : req.query.availability === 'true',
      limit: Number(req.query.limit || 30),
    });

    res.json({ ok: true, rows });
  } catch (error) {
    next(error);
  }
});

router.get('/firestore/search/projects', async (req, res, next) => {
  try {
    const rows = await queryProjects({
      ownerId: req.query.ownerId,
      status: req.query.status,
      category: req.query.category,
      skill: req.query.skill,
      limit: Number(req.query.limit || 30),
    });

    res.json({ ok: true, rows });
  } catch (error) {
    next(error);
  }
});

router.use((error, _req, res, _next) => {
  res.status(500).json({
    error: String(error?.message || error),
    hint: 'Check Firestore credentials and indexes for this query.',
  });
});

export default router;
