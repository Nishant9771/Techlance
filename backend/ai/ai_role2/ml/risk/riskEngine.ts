import { InputData, RiskResult } from "../types/types";
import { analyzeRiskML } from "./mlRiskEngine";

export function analyzeRisk(data: InputData): RiskResult {
  const reasons: string[] = [];
  const suggestions: string[] = [];

  const progressPercent =
    (data.completedMilestones / data.totalMilestones) * 100;

  let level: RiskResult["level"] = "LOW";

  // -----------------------
  // RULE-BASED LOGIC (CORE)
  // -----------------------

  if (data.lastActivityDays > 5) {
    level = "HIGH";
    reasons.push("No recent activity");
    suggestions.push("Contact team immediately");
  }

  if (data.budgetUsed / data.budgetTotal > 0.8 && progressPercent < 50) {
    level = "HIGH";
    reasons.push("Budget overuse with low progress");
    suggestions.push("Review budget allocation");
  }

  if (data.actorReliability < 40) {
    level = "HIGH";
    reasons.push("Low actor reliability");
    suggestions.push("Re-evaluate team member");
  }

  if (
    level !== "HIGH" &&
    (progressPercent < 60 || data.actorReliability < 70)
  ) {
    level = "MEDIUM";
    reasons.push("Moderate performance issues");
    suggestions.push("Monitor project closely");
  }

  if (level === "LOW") {
    suggestions.push("Project is healthy");
  }

  // -----------------------
  // ML PREDICTION
  // -----------------------

  let mlResult: any = null;

  try {
    mlResult = analyzeRiskML(data);
  } catch (e) {
    // ML failure should NOT break system
    reasons.push("ML model unavailable");
  }

  // -----------------------
  // HYBRID DECISION
  // -----------------------

  if (mlResult) {
    // If ML says HIGH → escalate
    if (mlResult.level === "HIGH" && level !== "HIGH") {
      level = "HIGH";
      reasons.push("ML detected hidden risk");
      suggestions.push("Investigate deeper issues");
    }

    // If ML disagrees strongly → flag uncertainty
    if (mlResult.level !== level) {
      reasons.push(`ML disagreement: ${mlResult.level}`);
      suggestions.push("Cross-check project metrics");
    }
  }

  return {
    level,
    reasons,
    suggestions
  };
}