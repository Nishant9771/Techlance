import { clamp, keywordSignal, parseDays, toNumber } from './utils.js';

function inferClarity(payload) {
  if (payload.requirementsClarity !== undefined) {
    const raw = toNumber(payload.requirementsClarity, 0.5);
    return raw > 1 ? clamp(raw / 10) : clamp(raw);
  }

  const text = [payload.ideaText, payload.description, payload.fullDetails].filter(Boolean).join(' ');
  return clamp(
    Math.min(String(text).length / 1400, 1) * 0.65 +
      (1 - keywordSignal(text, ['tbd', 'later', 'optional', 'maybe', 'to be decided'])) * 0.35,
  );
}

export function predictScopeCreep(payload = {}) {
  const clarity = inferClarity(payload);
  const changeRequestRate = payload.changeRequestRate !== undefined
    ? clamp(toNumber(payload.changeRequestRate, 0.2), 0, 1)
    : clamp(keywordSignal(payload.description || '', ['change', 'pivot', 'expand', 'extra', 'additional']) * 0.7 + 0.15);

  const stakeholderCount = Math.max(1, toNumber(payload.stakeholderCount, 2));
  const stakeholderPressure = clamp((stakeholderCount - 2) / 8);

  const complexity = payload.complexity !== undefined
    ? (toNumber(payload.complexity, 5) > 1 ? clamp(toNumber(payload.complexity, 5) / 10) : clamp(toNumber(payload.complexity, 0.5)))
    : clamp(keywordSignal(payload.description || '', ['integration', 'realtime', 'multi-platform', 'api', 'hardware']) * 0.6 + 0.3);

  const timelineDays = Math.max(1, parseDays(payload.timeline, 60));
  const timelinePressure = clamp((35 - timelineDays) / 35);

  const scopeRisk = clamp(
    (1 - clarity) * 0.33 +
      changeRequestRate * 0.27 +
      stakeholderPressure * 0.16 +
      complexity * 0.17 +
      timelinePressure * 0.07,
  );

  return {
    scopeRisk: Number(scopeRisk.toFixed(4)),
    scopeCreepProbability: Number(scopeRisk.toFixed(4)),
    drivers: {
      clarity: Number(clarity.toFixed(4)),
      changeRequestRate: Number(changeRequestRate.toFixed(4)),
      stakeholderPressure: Number(stakeholderPressure.toFixed(4)),
      complexity: Number(complexity.toFixed(4)),
      timelinePressure: Number(timelinePressure.toFixed(4)),
    },
  };
}

export default predictScopeCreep;
