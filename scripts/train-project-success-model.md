# Train + Deploy Project Success Prediction on Vertex AI

This guide adds a starter project-success model that predicts whether a posted project is likely to complete successfully.

The exported label is a simple proxy:
- `successful = 1` when a project is marked `Completed` or reaches `progress >= 100`
- `successful = 0` otherwise

That makes this a good starter workflow, but you should refine the label later with better business signals if you collect them.

## 1) Prerequisites

1. Install and log in with `gcloud`:
   - `gcloud auth login`
   - `gcloud auth application-default login`
2. Set project and region:
   - `gcloud config set project YOUR_PROJECT_ID`
   - `gcloud config set ai/region us-central1`
3. Create a GCS bucket once:
   - `gsutil mb -l us-central1 gs://YOUR_BUCKET_NAME`

## 2) Export training data from Firestore

Run from the repo root:

```bash
npm run ml:export-project-success-data
```

This creates `project-success-dataset.csv`.

## 3) Upload CSV to GCS

```bash
gsutil cp project-success-dataset.csv gs://YOUR_BUCKET_NAME/data/project-success-dataset.csv
```

## 4) Create a Vertex AI tabular dataset

```bash
gcloud ai datasets create \
  --display-name=techlance-project-success-dataset \
  --metadata-schema-uri=gs://google-cloud-aiplatform/schema/dataset/metadata/tabular_1.0.0.yaml
```

Copy the returned `DATASET_ID`, then import the CSV:

```bash
gcloud ai datasets import-data DATASET_ID \
  --import-schema-uri=gs://google-cloud-aiplatform/schema/dataset/ioformat/tabular_io_format_1.0.0.yaml \
  --gcs-source=gs://YOUR_BUCKET_NAME/data/project-success-dataset.csv
```

## 5) Train the model

For the easiest workflow, use the Vertex AI console:

1. Open Vertex AI Console.
2. Go to Datasets and open `techlance-project-success-dataset`.
3. Click `Train new model`.
4. Choose `Tabular` and `Classification`.
5. Set target column to `successful`.
6. Train and wait for the model to finish.

## 6) Deploy the endpoint

1. Open Vertex AI -> Models.
2. Select the trained project-success model.
3. Click `Deploy to endpoint`.
4. Create or reuse an endpoint.
5. Copy the deployed endpoint ID.

## 7) Connect the app

Add this to `.env.local`:

```env
VERTEX_PROJECT_SUCCESS_ENDPOINT_ID=YOUR_ENDPOINT_ID
```

After restart, the backend route below will forward prediction requests to Vertex:

```txt
POST /api/vertex/project-success
```

## 8) Starter inference payload

```json
{
  "postId": "YOUR_PROJECT_POST_ID"
}
```

Or pass raw project fields:

```json
{
  "title": "Smart irrigation controller",
  "description": "Need an IoT engineer for a pilot system.",
  "fullDetails": "ESP32 firmware, dashboard, and soil sensor integration.",
  "category": "IoT / Hardware",
  "budget": "6000",
  "timeline": "45",
  "skills": ["ESP32", "MQTT", "Dashboard"],
  "whoNeeded": "Engineer",
  "requireNda": true
}
```

## 9) Notes

- Keep the exported feature columns aligned with the backend heuristic route if you evolve the feature set.
- The starter label is intentionally simple; if you later track accepted offers, delivery milestones, refunds, or reviews, use those to improve the target.
