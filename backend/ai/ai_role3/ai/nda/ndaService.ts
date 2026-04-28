import * as crypto from "crypto";
import { analyzeIdeaWithGemini } from "../gemini/geminiClient.ts";

interface NDAInput {
  ideaText: string;
  actorAccepted: boolean;
}

interface NDAOutput {
  requiresNDA: boolean;
  allowed: boolean;
  message: string;
  ideaPreview?: string;
  ideaHash?: string;
  timestamp?: number;
}

// 🔐 MAIN FUNCTION (ASYNC NOW)
export const processNDA = async (input: NDAInput): Promise<NDAOutput> => {
  const { ideaText, actorAccepted } = input;

  // 🔥 GEMINI AI ANALYSIS
  let aiResult;
  try {
    aiResult = await analyzeIdeaWithGemini(ideaText);
  } catch (err) {
    // fallback if API fails
    aiResult = {
      sensitive: true,
      level: "HIGH",
      reason: "Fallback: assumed sensitive",
    };
  }

  const preview = (ideaText || "").substring(0, 120);
  const hash = crypto.createHash("sha256").update(ideaText).digest("hex");
  const timestamp = Date.now();

  // 🔐 NDA LOGIC
  if (aiResult.sensitive && !actorAccepted) {
    return {
      requiresNDA: true,
      allowed: false,
      message: `🔒 ${aiResult.reason}`,
      ideaPreview: preview,
      ideaHash: hash,
      timestamp,
    };
  }

  return {
    requiresNDA: false,
    allowed: true,
    message: "✅ Safe or NDA accepted",
    ideaPreview: ideaText,
    ideaHash: hash,
    timestamp,
  };
};