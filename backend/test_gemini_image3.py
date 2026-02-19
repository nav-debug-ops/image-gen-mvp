#!/usr/bin/env python3
import httpx
import json

api_key = "***REMOVED***"
url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key={api_key}"

# Correct configuration based on documentation
request_body = {
    "contents": [{"parts": [{"text": "Generate a cute robot holding a coffee cup"}]}],
    "generationConfig": {
        "response_modalities": ["Text", "Image"],
    },
}

try:
    response = httpx.post(url, json=request_body, timeout=60.0)
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        print("✓ SUCCESS! Gemini image generation works!")
        data = response.json()
        print(f"\nResponse structure:")
        for i, candidate in enumerate(data.get('candidates', [])):
            print(f"\nCandidate {i+1}:")
            parts = candidate.get('content', {}).get('parts', [])
            for j, part in enumerate(parts):
                if 'text' in part:
                    print(f"  Part {j+1}: Text - {part['text'][:100]}")
                if 'inlineData' in part:
                    mime = part['inlineData'].get('mimeType', '')
                    data_len = len(part['inlineData'].get('data', ''))
                    print(f"  Part {j+1}: Image - {mime}, {data_len} chars (base64)")
    else:
        print("✗ API call failed")
        print(f"Error: {json.dumps(response.json(), indent=2)}")
except Exception as e:
    print(f"Error: {e}")
