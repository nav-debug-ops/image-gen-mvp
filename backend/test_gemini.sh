#!/bin/bash

TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiZXhwIjoxNzcyMTI0Mzc0fQ.sq6PMgSgDCUuTH4daSGsHRWQ-BbvYSZeJjafXk7Wr18"

echo "Testing Gemini API connection..."
echo ""

curl -X POST http://localhost:8000/api/generate/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"prompt": "A cute robot holding a coffee cup", "provider": "gemini", "model": "gemini-2.0-flash-exp-image-generation", "aspect_ratio": "1:1"}'
