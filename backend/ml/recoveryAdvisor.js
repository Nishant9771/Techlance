import { clamp, toNumber } from './utils.js';

export function recommendRecoveryActions(payload = {}) {
  const successProbability = clamp(toNumber(payload.successProbability, 0.55));
  const scopeRisk = clamp(toNumber(payload.scopeRisk, 0.3));
  const fraudRisk = clamp(toNumber(payload.fraudRisk, 0.1));
  const delayRisk = clamp(toNumber(payload.delayRisk, 0.25));
  const chemistryScore = clamp(toNumber(payload.chemistryScore, 0.7));

  const recoveryRisk = clamp((1 - successProbability) * 0.35 + scopeRisk * 0.25 + fraudRisk * 0.2 + delayRisk * 0.15 + (1 - chemistryScore) * 0.05);

  const actions = [];

  if (scopeRisk >= 0.5) {
    actions.push('Freeze requirements for the next sprint and route all change requests through a scored change board.');
  }

  if (delayRisk >= 0.5) {
    actions.push('Introduce weekly milestone reviews and re-baseline schedule with hard dependency tracking.');
  }

  if (chemistryScore < 0.55) {
    actions.push('Assign a delivery lead and enforce daily async standups to improve communication reliability.');
  }

  if (fraudRisk > 0.4) {
    actions.push('Enable enhanced verification for shortlisted actors and require milestone escrow release checks.');
  }

  if (actions.length === 0) {
    actions.push('Project is in a healthy range. Keep risk review cadence weekly and track deviation thresholds.');
  }

  return {
    recoveryRisk: Number(recoveryRisk.toFixed(4)),
    recommendedActions: actions,
  };
}

export default recommendRecoveryActions;
