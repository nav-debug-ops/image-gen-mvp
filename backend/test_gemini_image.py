#!/usr/bin/env python3
import os
import httpx
import json

api_key = os.environ.get("GEMINI_API_KEY", "")
url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key={api_key}"

request_body = {
    "contents": [{"parts": [{"text": "A cute robot holding a coffee cup"}]}],
    "generationConfig": {
        "responseModalities": ["image", "text"],
        "responseMimeType": "image/png",
    },
}

try:
    response = httpx.post(url, json=request_body, timeout=60.0)
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        print("✓ SUCCESS! Gemini image generation works!")
        data = response.json()
        print(f"Response has {len(data.get('candidates', []))} candidates")
        for candidate in data.get('candidates', []):
            parts = candidate.get('content', {}).get('parts', [])
            print(f"  Candidate has {len(parts)} parts")
            for part in parts:
                if 'inlineData' in part:
                    mime = part['inlineData'].get('mimeType', '')
                    data_len = len(part['inlineData'].get('data', ''))
                    print(f"    ✓ Found image data: {mime}, {data_len} bytes (base64)")
    else:
        print("✗ API call failed")
        print(f"Error: {json.dumps(response.json(), indent=2)}")
except Exception as e:
    print(f"Error: {e}")
