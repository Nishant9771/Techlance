# Train + Deploy Smart Actor Matching on Vertex AI (Beginner Guide)

This guide trains a binary classifier/regressor using the exported ranking dataset.

## 1) Prerequisites

1. Install and login gcloud:
   - `gcloud auth login`
   - `gcloud auth application-default login`
2. Set project and region:
   - `gcloud config set project YOUR_PROJECT_ID`
   - `gcloud config set ai/region us-central1`
3. Create a GCS bucket (once):
   - `gsutil mb -l us-central1 gs://YOUR_BUCKET_NAME`

## 2) Export training data from Firestore

Run from repo root:

```bash
node scripts/export-ranking-data.mjs
```

This creates `ranking-dataset.csv`.

## 3) Upload CSV to GCS

```bash
gsutil cp ranking-dataset.csv gs://YOUR_BUCKET_NAME/data/ranking-dataset.csv
```

## 4) Create Vertex AI tabular dataset

```bash
gcloud ai datasets create \
  --display-name=techlance-ranking-dataset \
  --metadata-schema-uri=gs://google-cloud-aiplatform/schema/dataset/metadata/tabular_1.0.0.yaml
```

Copy the returned DATASET_ID, then import CSV:

```bash
gcloud ai datasets import-data DATASET_ID \
  --import-schema-uri=gs://google-cloud-aiplatform/schema/dataset/ioformat/tabular_io_format_1.0.0.yaml \
  --gcs-source=gs://YOUR_BUCKET_NAME/data/ranking-dataset.csv
```

## 5) Train model (AutoML Tabular)

Use `accepted` as target column.

```bash
gcloud ai custom-jobs create \
  --region=us-central1 \
  --display-name=techlance-ranking-train-placeholder \
  --worker-pool-spec=machine-type=n1-standard-4,replica-count=1,container-image-uri=us-docker.pkg.dev/vertex-ai/training/tf-cpu.2-15.py310:latest
```

For true AutoML Tabular from console (easiest for beginners):
1. Vertex AI Console -> Datasets -> techlance-ranking-dataset.
2. Click Train new model.
3. Choose Tabular, prediction type Classification.
4. Set target column `accepted`.
5. Train and wait for completion.

## 6) Deploy model endpoint

From console (easy):
1. Vertex AI -> Models -> your trained model.
2. Click Deploy to endpoint.
3. Create endpoint named `techlance-ranking-endpoint`.
4. Note the Endpoint ID.

## 7) Connect endpoint to app

In `.env.local` add:

```env
VERTEX_RANKING_ENDPOINT_ID=YOUR_ENDPOINT_ID
```

Your backend route `/api/vertex/match` already accepts `endpointId` in body.
When `endpointId` is provided, it forwards prediction requests to Vertex endpoint.

## 8) Inference payload example

```json
{
  "endpointId": "1234567890123456789",
  "instances": [
    {
      "similarity": 0.92,
      "rating": 4.8,
      "yearsExperience": 6,
      "budget": 5000,
      "offerAmount": 4800,
      "priceGapRatio": 0.04
    }
  ]
}
```

## 9) Troubleshooting

- `Permission denied`: ensure service account has Vertex AI User + Storage access.
- `No rows exported`: make sure you have offers + embeddings in Firestore.
- `Endpoint predict error`: verify region, project ID, endpoint ID.
