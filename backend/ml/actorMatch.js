import { listDocs } from '../services/store.js';
import { average, clamp, normalizeText, toNumber } from './utils.js';

function normalizeSkills(value) {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeText(item).trim()).filter(Boolean);
  }
  if (typeof value === 'string') {
    return value.split(',').map((item) => normalizeText(item).trim()).filter(Boolean);
  }
  return [];
}

function scoreSkillMatch(requiredSkills, actorSkills) {
  if (requiredSkills.length === 0) return 0.55;
  const actorSet = new Set(actorSkills);
  const hits = requiredSkills.filter((skill) => actorSet.has(skill)).length;
  return clamp(hits / requiredSkills.length);
}

function scoreDomainFit(projectDomain, actorDomains) {
  if (!projectDomain) return 0.5;
  const domain = normalizeText(projectDomain);
  return actorDomains.includes(domain) ? 1 : actorDomains.some((item) => domain.includes(item) || item.includes(domain)) ? 0.7 : 0.2;
}

export async function rankActors(payload = {}) {
  const requiredSkills = normalizeSkills(payload.skills || payload.requiredSkills);
  const domain = String(payload.domain || payload.category || '').trim();
  const minAvailability = clamp(toNumber(payload.minAvailability, 0) / 100, 0, 1);
  const topK = Math.max(1, Math.min(20, Number(payload.topK) || 5));

  const actors = await listDocs('actors', 200);

  const ranked = actors.map((actor) => {
    const actorSkills = normalizeSkills(actor.skills);
    const actorDomains = normalizeSkills(actor.domains || actor.domain);

    const skillScore = scoreSkillMatch(requiredSkills, actorSkills);
    const ratingScore = clamp(toNumber(actor.rating, 0) / 5, 0, 1);
    const experienceScore = clamp(toNumber(actor.experience, 0) / 10, 0, 1);
    const domainScore = scoreDomainFit(domain, actorDomains);
    const availabilityScore = clamp(toNumber(actor.availability, 0.5), 0, 1);

    const finalScore = clamp(
      skillScore * 0.35 +
      ratingScore * 0.2 +
      experienceScore * 0.18 +
      domainScore * 0.17 +
      availabilityScore * 0.1,
    );

    const blocked = availabilityScore < minAvailability;

    return {
      actorId: actor.id,
      name: actor.name || actor.displayName || actor.id,
      score: Number((blocked ? finalScore * 0.6 : finalScore).toFixed(4)),
      skillScore: Number(skillScore.toFixed(4)),
      ratingScore: Number(ratingScore.toFixed(4)),
      experienceScore: Number(experienceScore.toFixed(4)),
      domainScore: Number(domainScore.toFixed(4)),
      availabilityScore: Number(availabilityScore.toFixed(4)),
      rating: toNumber(actor.rating, 0),
      experience: toNumber(actor.experience, 0),
      skills: actorSkills,
      domains: actorDomains,
      blockedByAvailability: blocked,
    };
  });

  ranked.sort((a, b) => b.score - a.score);

  return {
    recommendedActors: ranked.slice(0, topK),
    summary: {
      totalActors: actors.length,
      averageFit: Number(average(ranked.map((item) => item.score), 0).toFixed(4)),
      requiredSkills,
      domain,
    },
  };
}

export default rankActors;
