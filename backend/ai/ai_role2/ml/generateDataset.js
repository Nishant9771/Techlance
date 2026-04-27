const fs = require("fs");

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateSample() {
  const timelineDays = rand(10, 60);
  const daysPassed = rand(1, timelineDays);

  const totalMilestones = Math.floor(rand(3, 10));
  const completedMilestones = Math.floor(rand(0, totalMilestones + 1));

  const lastActivityDays = rand(0, 10);

  const budgetTotal = rand(5000, 50000);
  const budgetUsed = rand(0, budgetTotal);

  const actorReliability = rand(10, 100);

  // 🔥 CORE FEATURES
  const progressPercent =
    totalMilestones > 0
      ? (completedMilestones / totalMilestones) * 100
      : 0;

  const expectedProgress =
    timelineDays > 0
      ? (daysPassed / timelineDays) * 100
      : 0;

  // 🔥 BASE RISK (rule-like)
  let risk = "LOW";

  if (
    lastActivityDays > 5 ||
    (budgetUsed / budgetTotal > 0.8 && progressPercent < 50) ||
    actorReliability < 40
  ) {
    risk = "HIGH";
  } else if (
    progressPercent < expectedProgress ||
    actorReliability < 70
  ) {
    risk = "MEDIUM";
  }

  // 🔥 ADD BORDERLINE CASES (important)
  if (
    progressPercent < expectedProgress &&
    lastActivityDays < 3 &&
    actorReliability > 80
  ) {
    risk = "MEDIUM";
  }

  // 🔥 ADD NOISE (critical for real ML)
  if (Math.random() < 0.1) {
    risk = pick(["LOW", "MEDIUM", "HIGH"]);
  }

  return {
    timelineDays,
    daysPassed,
    completedMilestones,
    totalMilestones,
    lastActivityDays,
    budgetTotal,
    budgetUsed,
    actorReliability,
    progressPercent,
    expectedProgress,
    risk
  };
}

// 🔥 GENERATE DATA
const data = [];

for (let i = 0; i < 5000; i++) {
  data.push(generateSample());
}

fs.writeFileSync("clean_dataset.json", JSON.stringify(data, null, 2));

console.log("✅ Robust dataset generated");