import sys
import json
import joblib
import numpy as np
import os

# PATH FIX
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "../model/fraud_model.pkl")

model = joblib.load(MODEL_PATH)

# 🔥 READ FROM FILE INSTEAD OF argv
INPUT_PATH = os.path.join(BASE_DIR, "input.json")

with open(INPUT_PATH, "r") as f:
    input_data = json.load(f)

features = np.array([[
    input_data["cancellations"],
    input_data["disputes"],
    input_data["completion_rate"],
    input_data["response_time"],
    input_data["message_repeat"]
]])

prediction = model.predict_proba(features)[0][1]

print(json.dumps({
    "fraudProbability": float(prediction)
}))