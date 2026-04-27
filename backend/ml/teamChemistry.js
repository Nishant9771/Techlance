import { clamp, toNumber } from './utils.js';

function memberMetric(member, key, fallback) {
  return clamp(toNumber(member?.[key], fallback), 0, 1);
}

export function calculateTeamChemistry(payload = {}) {
  const members = Array.isArray(payload.teamMembers) ? payload.teamMembers : [];

  if (members.length === 0) {
    return {
      communicationFit: 0,
      collaborationFit: 0,
      reliabilityFit: 0,
      chemistryScore: 0,
    };
  }

  const communicationFit = clamp(
    members.reduce((acc, member) => acc + memberMetric(member, 'communicationScore', 0.68), 0) / members.length,
  );

  const collaborationFit = clamp(
    members.reduce((acc, member) => acc + memberMetric(member, 'collaborationScore', 0.66), 0) / members.length,
  );

  const reliabilityFit = clamp(
    members.reduce((acc, member) => acc + memberMetric(member, 'reliabilityScore', 0.72), 0) / members.length,
  );

  const variancePenalty = clamp(Math.abs(communicationFit - collaborationFit) + Math.abs(collaborationFit - reliabilityFit));
  const chemistryScore = clamp(
    communicationFit * 0.33 + collaborationFit * 0.34 + reliabilityFit * 0.33 - variancePenalty * 0.12,
  );

  return {
    communicationFit: Number(communicationFit.toFixed(4)),
    collaborationFit: Number(collaborationFit.toFixed(4)),
    reliabilityFit: Number(reliabilityFit.toFixed(4)),
    chemistryScore: Number(chemistryScore.toFixed(4)),
  };
}

export default calculateTeamChemistry;
