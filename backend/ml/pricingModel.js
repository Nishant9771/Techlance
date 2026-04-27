import { clamp, keywordSignal, parseDays, parseMoney, toNumber } from './utils.js';

export function recommendPricing(payload = {}) {
  const explicitComplexity = toNumber(payload.complexity, NaN);
  const complexity = Number.isFinite(explicitComplexity)
    ? (explicitComplexity > 1 ? clamp(explicitComplexity / 10) : clamp(explicitComplexity))
    : clamp(keywordSignal(`${payload.title || ''} ${payload.description || ''}`, [
        'ai',
        'multi-tenant',
        'automation',
        'integration',
        'edge',
        'secure',
      ]) * 0.7 + 0.25);

  const timelineDays = Math.max(1, parseDays(payload.timeline, 60));
  const urgency = clamp((50 - timelineDays) / 50);

  const skillsCount = Math.max(
    1,
    Array.isArray(payload.skills) ? payload.skills.length : toNumber(payload.skillsCount, 3),
  );
  const talentScarcity = clamp(skillsCount / 10 + keywordSignal(String(payload.description || ''), ['firmware', 'mlops', 'embedded', 'vision']) * 0.35);

  const inputBudget = parseMoney(payload.budget, 0);

  const baseline = 2200 + complexity * 9300 + urgency * 2800 + talentScarcity * 3500;
  const recommended = inputBudget > 0 ? baseline * 0.62 + inputBudget * 0.38 : baseline;
  const spread = Math.max(600, recommended * 0.2);

  return {
    pricingEstimate: {
      recommended: Math.round(recommended),
      min: Math.round(Math.max(500, recommended - spread)),
      max: Math.round(recommended + spread),
      currency: payload.currency || 'USD',
    },
    factors: {
      complexity: Number(complexity.toFixed(4)),
      urgency: Number(urgency.toFixed(4)),
      talentScarcity: Number(talentScarcity.toFixed(4)),
      timelineDays,
      skillsCount,
    },
  };
}

export default recommendPricing;
