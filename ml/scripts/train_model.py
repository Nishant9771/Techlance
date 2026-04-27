import pandas as pd
from sklearn.linear_model import LogisticRegression
import joblib

# load dataset
data = pd.read_csv("../data/fraud_dataset.csv")

X = data.drop("fraud", axis=1)
y = data["fraud"]

model = LogisticRegression()
model.fit(X, y)

joblib.dump(model, "../model/fraud_model.pkl")

print("Model trained and saved")