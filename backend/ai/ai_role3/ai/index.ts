import { processNDA } from "./nda/ndaService.ts";
import { protectIdea } from "./protection/ideaProtection.ts";
import { detectFraudML } from "./fraud/fraudDetection.ts";
import { checkIdeaSimilarity } from "./similarity/similarityService.ts";

export const runAI = async (input: any) => {
  const nda = await processNDA({
    ideaText: input.ideaText,
    actorAccepted: input.actorAccepted,
  });

  const protection = protectIdea({
    ideaText: input.ideaText,
  });

  const fraud = await detectFraudML({
    cancellations: input.cancellations || 0,
    disputes: input.disputes || 0,
    completion_rate: input.completion_rate || 0,
    response_time: 10,
    message_repeat: input.message_repeat || 0,
  });

  const similarity = await checkIdeaSimilarity(
    input.ideaText,
    input.existingIdeas || []
  );

  return {
    nda,
    protection,
    fraud,
    similarity,
  };
};