#!/usr/bin/env python3
import os
import httpx
import json

api_key = os.environ.get("GEMINI_API_KEY", "")
url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key={api_key}"

request_body = {
    "contents": [{"parts": [{"text": "A cute robot"}]}],
    "generationConfig": {
        "responseModalities": ["image", "text"],
        "responseMimeType": "image/png",
    },
}

try:
    response = httpx.post(url, json=request_body, timeout=60.0)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
except Exception as e:
    print(f"Error: {e}")
