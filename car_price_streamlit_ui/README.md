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

## API contract

- GET /metrics
  Response example:
  {
    "ready": true,
    "metrics": { "r2": 0.82, "mae": 1200.5, "rmse": 1800.7 },
    "trained_at": "2025-10-07T12:00:00Z",
    "model_type": "random_forest",
    "features": ["year","mileage","brand","model","fuel_type","transmission","owner_count","engine_size","seats"]
  }

- POST /predict
  Body example:
  {
    "year": 2017,
    "mileage": 45000,
    "brand": "Toyota",
    "model": "Corolla",
    "fuel_type": "Petrol",
    "transmission": "Manual",
    "owner_count": 1,
    "engine_size": 1.6,
    "seats": 5
  }
  Response: can be a number or { "price": number }.

## Project Scripts

- npm start - start dev server
- npm test - run tests
- npm run build - build for production

## Notes

- The metrics chart uses simple CSS-based bars—no chart libraries required.
- Theme toggle supports light/dark using CSS variables.
- Errors are shown inline and in alert boxes.

