import { clamp, keywordSignal, toNumber } from './utils.js';

export function detectFraudRisk(payload = {}) {
  const expert = payload.expert || {};
  const review = payload.review || {};
  const proposal = payload.proposal || {};
  const behavior = payload.behavior || {};

  const rating = toNumber(expert.rating ?? review.rating, 0);
  const reviewsCount = toNumber(expert.reviewsCount, 0);
  const completedProjects = toNumber(expert.completedProjects, 0);
  const accountAgeDays = toNumber(expert.accountAgeDays ?? behavior.accountAgeDays, 365);
  const verificationLevel = toNumber(expert.verificationLevel, 70) / 100;

  const fakeExpertRisk = clamp(
    (rating > 4.85 && reviewsCount < 4 ? 0.45 : 0.1) +
      (completedProjects > 10 && accountAgeDays < 30 ? 0.35 : 0.05) +
      (1 - verificationLevel) * 0.35,
  );

  const reviewText = String(review.text || '');
  const ratingFraudRisk = clamp(
    keywordSignal(reviewText, ['best ever', '100% guaranteed', 'perfect service', 'instant']) * 0.55 +
      (reviewText.length < 40 ? 0.2 : 0.04) +
      (reviewsCount > 0 && rating > 4.9 ? 0.18 : 0.06),
  );

  const proposalText = [proposal.title, proposal.message, proposal.workPlan].filter(Boolean).join(' ');
  const spamProposalRisk = clamp(
    keywordSignal(proposalText, [
      'whatsapp',
      'telegram',
      'outside platform',
      'wire transfer',
      'urgent payment',
      'crypto',
    ]) * 0.7 +
      (toNumber(behavior.rapidBidCount24h, 0) > 20 ? 0.2 : 0.05) +
      (toNumber(behavior.externalContactAttempts, 0) > 1 ? 0.15 : 0.04),
  );

  const fraudRiskScore = clamp(fakeExpertRisk * 0.35 + ratingFraudRisk * 0.25 + spamProposalRisk * 0.4);

  return {
    fakeExpertRisk: Number(fakeExpertRisk.toFixed(4)),
    ratingFraudRisk: Number(ratingFraudRisk.toFixed(4)),
    spamProposalRisk: Number(spamProposalRisk.toFixed(4)),
    fraudRiskScore: Number(fraudRiskScore.toFixed(4)),
  };
}

export default detectFraudRisk;
