# GeoSentinel AI

AI-powered satellite change detection using a
TRUE SHARED-WEIGHT SIAMESE U-NET architecture.

## Model

Input:
- Sentinel-style T1 image
- Sentinel-style T2 image
- 13 channels
- 256 x 256 spatial resolution

Output:
- Pixel-level change probability map
- 256 x 256 x 1

Architecture:
TRUE SHARED-WEIGHT SIAMESE U-NET

Parameters:
1,955,393

## Backend

Flask REST API.

## Deployment

Designed for Render deployment.

## Important

The Flask application is not intended to be served
directly from Google Colab.

Colab is used for:
- model development
- validation
- visualization
- package preparation

Render is used for:
- Flask backend hosting
- API serving
- production inference

## Project Structure

GeoSentinel_AI/
  app.py
  requirements.txt
  render.yaml
  .gitignore
  model/
    GeoSentinel_best_model.weights.h5
  config/
    GeoSentinel_model_config.json
    GeoSentinel_inference_config.json

## API

Health endpoint:
GET /health

Model information:
GET /model-info

Prediction endpoint:
POST /predict

## Model Threshold

Final inference threshold:
0.60