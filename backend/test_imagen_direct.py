#!/usr/bin/env python3
import os
import httpx
import json

api_key = os.environ.get("GEMINI_API_KEY", "")
url = "https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict"

request_body = {
    "instances": [{"prompt": "A cute robot holding a coffee cup"}],
    "parameters": {
        "sampleCount": 1,
        "aspectRatio": "1:1",
        "safetyFilterLevel": "block_few",
        "personGeneration": "allow_adult",
        "outputOptions": {"mimeType": "image/png"},
    },
}

try:
    response = httpx.post(
        url,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "x-goog-api-key": api_key,
        },
        json=request_body,
        timeout=60.0,
    )
    print(f"Status Code: {response.status_code}")
    data = response.json()
    print(f"Response keys: {list(data.keys())}")
    if response.status_code != 200:
        print(f"Error: {json.dumps(data, indent=2)}")
    else:
        print("Success! Image generated.")
        if "predictions" in data:
            print(f"Predictions count: {len(data['predictions'])}")
except Exception as e:
    print(f"Error: {e}")
