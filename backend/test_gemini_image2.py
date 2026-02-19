#!/usr/bin/env python3
import httpx
import json

api_key = "***REMOVED***"
url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key={api_key}"

# Try without responseMimeType
request_body = {
    "contents": [{"parts": [{"text": "A cute robot holding a coffee cup"}]}],
    "generationConfig": {
        "responseModalities": ["IMAGE"],
    },
}

try:
    response = httpx.post(url, json=request_body, timeout=60.0)
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        print("✓ SUCCESS! Gemini image generation works!")
        data = response.json()
        print(f"Full response structure:")
        print(json.dumps(data, indent=2)[:1000])
    else:
        print("✗ API call failed")
        print(f"Error: {json.dumps(response.json(), indent=2)}")
except Exception as e:
    print(f"Error: {e}")
