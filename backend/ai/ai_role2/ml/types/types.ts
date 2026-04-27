export type InputData = {
  timelineDays: number;
  daysPassed: number;
  completedMilestones: number;
  totalMilestones: number;
  lastActivityDays: number;
  budgetTotal: number;
  budgetUsed: number;
  actorReliability: number;
};

export type ProgressResult = {
  percent: number;
  expected: number;
  status: "ON_TRACK" | "DELAYED" | "CRITICAL";
};

export type RiskResult = {
  level: "LOW" | "MEDIUM" | "HIGH";
  reasons: string[];
  suggestions: string[];
};