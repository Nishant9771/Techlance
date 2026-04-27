import { Router } from 'express';
import {
  createEscrowMilestone,
  getContributionsOnChain,
  getEscrowMilestone,
  getOnChainReputation,
  hashPlainText,
  logContributionOnChain,
  registerIdeaHashOnChain,
  registerNdaHashOnChain,
  releaseEscrowMilestone,
  updateOnChainReputation,
  verifyIdeaHashOnChain,
  verifyNdaHashOnChain,
} from '../services/blockchainService.js';
import { createMilestone, storeBlockchainProof } from '../services/firestoreService.js';
import { getDoc, upsertDoc } from '../services/store.js';

const router = Router();

router.post('/idea/register', async (req, res) => {
  try {
    const { ideaText, title, creatorId, walletAddress, projectId } = req.body || {};
    if (!String(ideaText || '').trim()) {
      return res.status(400).json({ error: 'ideaText is required' });
    }

    const chain = await registerIdeaHashOnChain(ideaText);

    const ideaId = String(projectId || `idea_${Date.now()}`);
    await upsertDoc('ideas', ideaId, {
      id: ideaId,
      title: title || 'Untitled Idea',
      description: ideaText,
      creatorId: creatorId || null,
      walletAddress: walletAddress || null,
      blockchain: {
        ideaHash: chain.ideaHash,
        txHash: chain.txHash,
        timestamp: new Date().toISOString(),
        network: 'polygon-amoy',
      },
      ownershipVerified: true,
    });

    if (projectId) {
      await storeBlockchainProof(projectId, {
        ideaHash: chain.ideaHash,
        txHash: chain.txHash,
        proofType: 'idea_ownership',
        createdBy: creatorId || null,
      });
    }

    return res.json({
      message: 'Idea ownership registered on-chain',
      ideaId,
      ideaHash: chain.ideaHash,
      txHash: chain.txHash,
      ownershipVerified: true,
      explorerUrl: `https://amoy.polygonscan.com/tx/${chain.txHash}`,
    });
  } catch (error) {
    return res.status(500).json({ error: String(error?.message || error) });
  }
});

router.post('/idea/verify', async (req, res) => {
  try {
    const { ideaText, ideaHash, ideaId } = req.body || {};
    const payloadHash = ideaHash || hashPlainText(String(ideaText || ''));

    const onChain = await verifyIdeaHashOnChain({ ideaText, ideaHash: payloadHash });
    const localIdea = ideaId ? await getDoc('ideas', String(ideaId)) : null;

    return res.json({
      ideaId: ideaId || null,
      ideaHash: onChain.ideaHash,
      exists: onChain.exists,
      registrant: onChain.registrant,
      timestamp: onChain.timestamp,
      txStatus: onChain.exists ? 'anchored' : 'not-found',
      localRecord: localIdea,
    });
  } catch (error) {
    return res.status(500).json({ error: String(error?.message || error) });
  }
});

router.post('/nda/register', async (req, res) => {
  try {
    const { ndaText, projectId, title } = req.body || {};
    if (!String(ndaText || '').trim()) {
      return res.status(400).json({ error: 'ndaText is required' });
    }

    const chain = await registerNdaHashOnChain(ndaText);
    const ndaId = String(projectId || `nda_${Date.now()}`);

    await upsertDoc('agreements', ndaId, {
      id: ndaId,
      title: title || 'NDA Agreement',
      ndaHash: chain.ndaHash,
      txHash: chain.txHash,
      network: 'polygon-amoy',
      anchoredAt: new Date().toISOString(),
    });

    if (projectId) {
      await storeBlockchainProof(projectId, {
        ndaHash: chain.ndaHash,
        txHash: chain.txHash,
        proofType: 'nda',
      });
    }

    return res.json({
      message: 'NDA hash anchored on-chain',
      ndaId,
      ndaHash: chain.ndaHash,
      txHash: chain.txHash,
      explorerUrl: `https://amoy.polygonscan.com/tx/${chain.txHash}`,
    });
  } catch (error) {
    return res.status(500).json({ error: String(error?.message || error) });
  }
});

router.post('/nda/verify', async (req, res) => {
  try {
    const { ndaText, ndaHash } = req.body || {};
    const verify = await verifyNdaHashOnChain({ ndaText, ndaHash });
    return res.json(verify);
  } catch (error) {
    return res.status(500).json({ error: String(error?.message || error) });
  }
});

router.post('/escrow/create', async (req, res) => {
  try {
    const { engineerWallet, title, amountEth, projectId } = req.body || {};
    const chain = await createEscrowMilestone({ engineerWallet, title, amountEth });

    const key = String(projectId || `milestone_${chain.milestoneId ?? Date.now()}`);
    await upsertDoc('projects', key, {
      id: key,
      milestoneId: chain.milestoneId,
      milestoneTitle: title || 'Milestone',
      engineerWallet,
      amountEth: String(amountEth),
      escrowTxHash: chain.txHash,
      escrowStatus: 'funded',
      network: 'polygon-amoy',
    });

    if (projectId) {
      await createMilestone(projectId, {
        sequence: Number(chain.milestoneId || 1),
        title: title || 'Milestone',
        amount: Number(amountEth || 0),
        currency: 'ETH',
        status: 'funded',
        escrowTxHash: chain.txHash,
      });

      await storeBlockchainProof(projectId, {
        escrowContractAddress: process.env.ESCROW_CONTRACT_ADDRESS || null,
        txHash: chain.txHash,
        proofType: 'escrow',
      });
    }

    return res.json({
      message: 'Milestone funded in escrow',
      ...chain,
      explorerUrl: `https://amoy.polygonscan.com/tx/${chain.txHash}`,
    });
  } catch (error) {
    return res.status(500).json({ error: String(error?.message || error) });
  }
});

router.post('/escrow/release', async (req, res) => {
  try {
    const { milestoneId, autoApprove } = req.body || {};
    const chain = await releaseEscrowMilestone({ milestoneId, autoApprove: autoApprove !== false });
    const state = await getEscrowMilestone(milestoneId);

    return res.json({
      message: 'Milestone released to engineer',
      ...chain,
      milestone: state,
      explorerUrl: `https://amoy.polygonscan.com/tx/${chain.txHash}`,
    });
  } catch (error) {
    return res.status(500).json({ error: String(error?.message || error) });
  }
});

router.post('/escrow/get', async (req, res) => {
  try {
    const { milestoneId } = req.body || {};
    const milestone = await getEscrowMilestone(milestoneId);
    return res.json(milestone);
  } catch (error) {
    return res.status(500).json({ error: String(error?.message || error) });
  }
});

router.post('/reputation/get', async (req, res) => {
  try {
    const { walletAddress } = req.body || {};
    const row = await getOnChainReputation(walletAddress);
    return res.json(row);
  } catch (error) {
    return res.status(500).json({ error: String(error?.message || error) });
  }
});

router.post('/reputation/update', async (req, res) => {
  try {
    const payload = req.body || {};
    const tx = await updateOnChainReputation(payload);
    return res.json(tx);
  } catch (error) {
    return res.status(500).json({ error: String(error?.message || error) });
  }
});

router.post('/contribution/log', async (req, res) => {
  try {
    const { projectId, moduleName, contributorWallet } = req.body || {};
    const tx = await logContributionOnChain({ projectId, moduleName, contributorWallet });

    await upsertDoc('contributions', `${projectId}_${Date.now()}`, {
      projectId,
      moduleName,
      contributorWallet,
      txHash: tx.txHash,
      anchoredAt: new Date().toISOString(),
      network: 'polygon-amoy',
    });

    return res.json(tx);
  } catch (error) {
    return res.status(500).json({ error: String(error?.message || error) });
  }
});

router.post('/contribution/list', async (req, res) => {
  try {
    const { projectId } = req.body || {};
    const rows = await getContributionsOnChain(projectId);
    return res.json(rows);
  } catch (error) {
    return res.status(500).json({ error: String(error?.message || error) });
  }
});

export default router;
