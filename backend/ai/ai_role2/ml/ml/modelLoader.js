const fs = require("fs");
const { RandomForestClassifier } = require("ml-random-forest");

let model = null;

function loadModel() {
  if (model) return model;

  const raw = fs.readFileSync(__dirname + "/../ai/ml/risk_model.json");
  const json = JSON.parse(raw);

  model = RandomForestClassifier.load(json);

  console.log("✅ ML model loaded");

  return model;
}

module.exports = { loadModel };