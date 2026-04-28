import { analyzeProgress } from "./ml/progress/progressEngine";
import { analyzeRisk } from "./ml/risk/riskEngine";

function toNumber(value: unknown, fallback: number) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export async function runAI2(data: any) {
  try {
    const timelineDays = Math.max(
      1,
      toNumber(data?.timelineDays ?? data?.timeline, 30),
    );

    const input = {
      timelineDays,
      daysPassed: Math.max(0, toNumber(data?.daysPassed, 0)),
      completedMilestones: Math.max(0, toNumber(data?.completedMilestones, 0)),
      totalMilestones: Math.max(1, toNumber(data?.totalMilestones, 1)),
      lastActivityDays: Math.max(0, toNumber(data?.lastActivityDays, 0)),
      budgetTotal: Math.max(1, toNumber(data?.budgetTotal ?? data?.budget, 1)),
      budgetUsed: Math.max(0, toNumber(data?.budgetUsed, 0)),
      actorReliability: Math.min(100, Math.max(0, toNumber(data?.actorReliability, 70))),
    };

    const progress = await analyzeProgress(input);
    const risk = await analyzeRisk(input);

    return {
      progress,
      risk,
    };
  } catch (e) {
    console.error("AI2 ERROR:", e);

    return {
      progress: { health: 0, status: "UNKNOWN" },
      risk: { level: "UNKNOWN", score: 0 },
    };
  }
}