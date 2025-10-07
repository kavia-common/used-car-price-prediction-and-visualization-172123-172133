# Used Car Price Frontend (React)

A lightweight React UI that connects to the ML backend to predict used car prices and view model metrics.

## Highlights

- Ocean Professional theme (primary #2563EB, accent #F59E0B)
- Sidebar form for car features with validation
- Prediction result display
- Metrics overview with simple inline bar charts
- Minimal dependencies, native fetch for API calls

## Quick Start

1) Install dependencies
   npm install

2) Configure backend URL
   - Copy .env.example to .env
   - Set REACT_APP_BACKEND_BASE_URL to your backend base URL (default http://localhost:3001)

3) Run the app
   npm start
   Open http://localhost:3000

## Environment variables

Create a .env file in this folder:

REACT_APP_BACKEND_BASE_URL=http://localhost:3001

Notes:
- Create React App only exposes variables prefixed with REACT_APP_.
- The app falls back to http://localhost:3001 if not set.

## API contract (aligned with backend)

- GET /
  Health check. Response: { "message": "Healthy" }

- GET /metrics
  Response example:
  {
    "ready": true,
    "metrics": { "r2": 0.82, "mae": 150000.5, "rmse": 220000.7 },
    "trained_at": 1736200000,
    "model_type": "rf",
    "features": ["brand","model","fuel_type","transmission","year","mileage_km","owner_count","engine_cc","seats"]
  }

- POST /predict
  Body example (frontend converts liters to cc and mileage to mileage_km automatically):
  {
    "brand": "Toyota",
    "model": "Corolla",
    "fuel_type": "Petrol",
    "transmission": "Manual",
    "year": 2018,
    "mileage_km": 45000,
    "owner_count": 1,
    "engine_cc": 1600,
    "seats": 5
  }

  Success Response:
  {
    "predicted_price": 525000.0,
    "inputs": { ...echoed sanitized inputs... },
    "model_info": { "model_type": "rf", "trained_at": 1736200000 }
  }

## Project Scripts

- npm start - start dev server
- npm test - run tests
- npm run build - build for production

## Notes

- The metrics chart uses simple CSS-based bars—no chart libraries required.
- Theme toggle supports light/dark using CSS variables.
- Errors are shown inline and in alert boxes.

