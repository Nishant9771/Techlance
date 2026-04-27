import { clamp, parseDays, parseMoney, toNumber } from './utils.js';

function normalizeComplexity(value) {
  const raw = toNumber(value, 5);
  if (raw <= 1) return clamp(raw, 0, 1);
  return clamp(raw / 10, 0, 1);
}

export function predictProjectSuccess(payload = {}) {
  const complexity = normalizeComplexity(payload.complexity);
  const timelineDays = Math.max(1, parseDays(payload.timeline, 60));
  const budget = Math.max(100, parseMoney(payload.budget, 8000));
  const teamSize = Math.max(1, toNumber(payload.teamSize, 3));

  const budgetAdequacy = clamp(Math.log10(budget) / 5.5, 0, 1);
  const timelineFeasibility = clamp(timelineDays / (30 + complexity * 120), 0, 1);
  const teamCoverage = clamp(teamSize / (2 + complexity * 5), 0, 1);
  const complexityPenalty = clamp(complexity * 0.7);

  const successProbability = clamp(
    0.32 + budgetAdequacy * 0.24 + timelineFeasibility * 0.2 + teamCoverage * 0.19 - complexityPenalty * 0.23,
  );

  const delayRisk = clamp(
    complexity * 0.4 + (1 - timelineFeasibility) * 0.35 + (1 - teamCoverage) * 0.15 + (1 - budgetAdequacy) * 0.1,
  );

  const failureRisk = clamp(1 - successProbability + delayRisk * 0.25);

  return {
    successProbability: Number(successProbability.toFixed(4)),
    delayRisk: Number(delayRisk.toFixed(4)),
    failureRisk: Number(failureRisk.toFixed(4)),
    features: {
      complexity,
      timelineDays,
      budget,
      teamSize,
      budgetAdequacy: Number(budgetAdequacy.toFixed(4)),
      timelineFeasibility: Number(timelineFeasibility.toFixed(4)),
      teamCoverage: Number(teamCoverage.toFixed(4)),
    },
  };
}

export default predictProjectSuccess;
