import { analyzeIdeaNovelty } from './noveltyEngine.js';
import { rankActors } from './actorMatch.js';
import { predictProjectSuccess } from './successPrediction.js';
import { detectFraudRisk } from './fraudDetection.js';
import { calculateTeamChemistry } from './teamChemistry.js';
import { runSemanticSearch } from './semanticSearch.js';
import { predictScopeCreep } from './scopeCreep.js';
import { recommendPricing } from './pricingModel.js';
import { computeReputation } from './reputationModel.js';
import { recommendRecoveryActions } from './recoveryAdvisor.js';
import { ensureSeedData } from '../services/store.js';

function actorToChemistryMember(actor) {
  return {
    communicationScore: 0.58 + actor.ratingScore * 0.35,
    collaborationScore: 0.55 + actor.skillScore * 0.3,
    reliabilityScore: 0.52 + actor.availabilityScore * 0.18 + actor.experienceScore * 0.3,
  };
}

export async function analyzeProject(payload = {}) {
  await ensureSeedData();

  const ideaText = String(payload.ideaText || payload.description || payload.title || '');
  const ideaTitle = String(payload.ideaTitle || payload.title || 'Project Idea');

  const novelty = await analyzeIdeaNovelty({
    ideaId: payload.ideaId,
    ideaTitle,
    ideaText,
    domain: payload.category,
    topK: payload.topK || 5,
  });

  const actorMatch = await rankActors({
    skills: payload.skills,
    domain: payload.category,
    minAvailability: payload.minAvailability,
    topK: payload.topK || 5,
  });

  const success = predictProjectSuccess({
    complexity: payload.complexity,
    timeline: payload.timeline,
    budget: payload.budget,
    teamSize: payload.teamSize,
  });

  const fraud = detectFraudRisk(payload.fraudPayload || payload);

  const chemistry = calculateTeamChemistry({
    teamMembers: actorMatch.recommendedActors.slice(0, 3).map(actorToChemistryMember),
  });

  const semantic = await runSemanticSearch({
    query: payload.searchQuery || ideaText || ideaTitle,
    type: payload.searchType || 'projects',
    topK: payload.searchTopK || 6,
  });

  const scope = predictScopeCreep({
    requirementsClarity: payload.requirementsClarity,
    changeRequestRate: payload.changeRequestRate,
    stakeholderCount: payload.stakeholderCount,
    complexity: payload.complexity,
    timeline: payload.timeline,
    description: payload.description || ideaText,
    fullDetails: payload.fullDetails,
  });

  const pricing = recommendPricing({
    title: payload.title || ideaTitle,
    description: payload.description || ideaText,
    complexity: payload.complexity,
    timeline: payload.timeline,
    skills: payload.skills,
    budget: payload.budget,
    currency: payload.currency || 'USD',
  });

  const reputation = await computeReputation({
    actorId: actorMatch.recommendedActors[0]?.actorId,
    actor: {
      rating: actorMatch.recommendedActors[0]?.rating || 4.5,
      onTimeRate: actorMatch.recommendedActors[0]?.availabilityScore || 0.76,
      completionRate: actorMatch.recommendedActors[0]?.experienceScore || 0.8,
      disputeRate: payload.disputeRate || 0.08,
      verificationLevel: payload.verificationLevel || 80,
    },
  });

  const recovery = recommendRecoveryActions({
    successProbability: success.successProbability,
    scopeRisk: scope.scopeRisk,
    fraudRisk: fraud.fraudRiskScore,
    delayRisk: success.delayRisk,
    chemistryScore: chemistry.chemistryScore,
  });

  return {
    innovationScore: novelty.innovationScore,
    noveltyScore: novelty.noveltyScore,
    successProbability: success.successProbability,
    fraudRisk: fraud.fraudRiskScore,
    chemistryScore: chemistry.chemistryScore,
    scopeRisk: scope.scopeRisk,
    pricingEstimate: pricing.pricingEstimate,
    trustScore: reputation.trustScore,
    recommendedActors: actorMatch.recommendedActors,
    recoveryActions: recovery.recommendedActions,
    details: {
      novelty,
      actorMatch,
      success,
      fraud,
      chemistry,
      semantic,
      scope,
      pricing,
      reputation,
      recovery,
    },
  };
}

export default analyzeProject;
