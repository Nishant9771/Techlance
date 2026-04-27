import fs from "fs";
import path from "path";
import { RandomForestClassifier } from "ml-random-forest";

let model: any = null;

const ROOT_DIR = process.cwd();

function loadModel() {
  if (model) return model;

  const modelPath = path.join(ROOT_DIR, "ai", "ml", "risk_model.json");

  if (!fs.existsSync(modelPath)) {
    throw new Error("Model not found: " + modelPath);
  }

  const raw = fs.readFileSync(modelPath, "utf-8");
  const json = JSON.parse(raw);

  model = RandomForestClassifier.load(json);

  console.log("✅ ML model loaded");

  return model;
}

function safeNum(v: any): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function transform(input: any): number[] {
  const progressPercent =
    (input.completedMilestones / input.totalMilestones) * 100;

  const expectedProgress =
    (input.daysPassed / input.timelineDays) * 100;

  const budgetRatio =
    input.budgetTotal > 0
      ? input.budgetUsed / input.budgetTotal
      : 0;

  return [
    progressPercent,
    expectedProgress,
    input.lastActivityDays,
    input.actorReliability,
    budgetRatio
  ];
}

function decode(pred: number): string {
  const map = ["LOW", "MEDIUM", "HIGH"];
  return map[pred] || "UNKNOWN";
}

export function analyzeRiskML(input: any) {
  const model = loadModel();

  const features = transform(input);

  const prediction = model.predict([features])[0];

  return {
    level: decode(prediction),
    raw: prediction,
    reason: "ML prediction (behavior-based)"
  };
}