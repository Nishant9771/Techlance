import { getDoc, upsertDoc } from '../services/store.js';
import { clamp, toNumber } from './utils.js';

export async function computeReputation(payload = {}) {
  const actorId = String(payload.actorId || payload.id || 'unknown_actor');
  const actor = payload.actor || payload.profile || {};

  const rating = clamp(toNumber(actor.rating, 4) / 5);
  const onTimeRate = clamp(toNumber(actor.onTimeRate, 0.78));
  const completionRate = clamp(toNumber(actor.completionRate, 0.8));
  const disputeRate = clamp(toNumber(actor.disputeRate, 0.08));
  const verification = clamp(toNumber(actor.verificationLevel, 75) / 100);

  const trustScore = clamp(
    rating * 0.3 + onTimeRate * 0.25 + completionRate * 0.2 + (1 - disputeRate) * 0.15 + verification * 0.1,
  );

  const reliabilityScore = clamp((onTimeRate * 0.42 + completionRate * 0.38 + (1 - disputeRate) * 0.2));

  const current = await getDoc('reputationScores', actorId);
  const blendedTrust = current
    ? clamp((toNumber(current.trustScore, trustScore * 100) / 100) * 0.3 + trustScore * 0.7)
    : trustScore;

  await upsertDoc('reputationScores', actorId, {
    id: actorId,
    trustScore: Math.round(blendedTrust * 100),
    reliabilityScore: Math.round(reliabilityScore * 100),
    actorSnapshot: {
      rating: Number((rating * 5).toFixed(2)),
      onTimeRate: Number(onTimeRate.toFixed(4)),
      completionRate: Number(completionRate.toFixed(4)),
      disputeRate: Number(disputeRate.toFixed(4)),
      verification: Number(verification.toFixed(4)),
    },
  });

  return {
    trustScore: Number(blendedTrust.toFixed(4)),
    reliabilityScore: Number(reliabilityScore.toFixed(4)),
  };
}

export default computeReputation;
