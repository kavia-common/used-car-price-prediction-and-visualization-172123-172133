#!/bin/bash
cd /home/kavia/workspace/code-generation/used-car-price-prediction-and-visualization-172123-172133/car_price_streamlit_ui
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

