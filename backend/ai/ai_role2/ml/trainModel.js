const fs = require("fs");
const { RandomForestClassifier } = require("ml-random-forest");

// LOAD DATA
const raw = fs.readFileSync("clean_dataset.json", "utf-8");
const data = JSON.parse(raw);

const dataset = [];
const labels = [];

// SAFE NUMBER
function safeNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

// PREPROCESS
function preprocess(row) {
  const progressPercent = safeNum(row.progressPercent);
  const expectedProgress = safeNum(row.expectedProgress);
  const lastActivityDays = safeNum(row.lastActivityDays);
  const actorReliability = safeNum(row.actorReliability);

  const budgetRatio =
    row.budgetTotal > 0
      ? safeNum(row.budgetUsed) / safeNum(row.budgetTotal)
      : 0;

  return [
    progressPercent,
    expectedProgress,
    lastActivityDays,
    actorReliability,
    budgetRatio
  ];
}

// LABEL
function encodeLabel(label) {
  const map = { LOW: 0, MEDIUM: 1, HIGH: 2 };
  return map[label] ?? 0;
}

// BUILD DATA
data.forEach((row) => {
  dataset.push(preprocess(row));
  labels.push(encodeLabel(row.risk));
});

console.log("Dataset loaded:", dataset.length);

// 🔥 SHUFFLE (CRITICAL)
const combined = dataset.map((x, i) => ({ x, y: labels[i] }));
combined.sort(() => Math.random() - 0.5);

const X = combined.map(d => d.x);
const y = combined.map(d => d.y);

// 🔥 TRAIN/TEST SPLIT
const splitIndex = Math.floor(X.length * 0.8);

const X_train = X.slice(0, splitIndex);
const y_train = y.slice(0, splitIndex);

const X_test = X.slice(splitIndex);
const y_test = y.slice(splitIndex);

console.log("Training on:", X_train.length);
console.log("Testing on:", X_test.length);

// TRAIN MODEL
const rf = new RandomForestClassifier({
  nEstimators: 50,
  maxDepth: 12
});

rf.train(X_train, y_train);

console.log("✅ Training complete");

// SAVE MODEL
fs.writeFileSync("risk_model.json", JSON.stringify(rf.toJSON()));
console.log("✅ Model saved");

// 🔥 EVALUATION
let correct = 0;

for (let i = 0; i < X_test.length; i++) {
  const pred = rf.predict([X_test[i]])[0];
  if (pred === y_test[i]) correct++;
}

const accuracy = (correct / X_test.length) * 100;

console.log("🎯 Accuracy:", accuracy.toFixed(2) + "%");

// SAMPLE CHECK
console.log("Sample Prediction:", rf.predict([X_test[0]]));
console.log("Actual Label:", y_test[0]);