#!/usr/bin/env python3
import os
import httpx
import json

api_key = os.environ.get("GEMINI_API_KEY", "")
url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key={api_key}"

request_body = {
    "contents": [{"parts": [{"text": "Say hello"}]}],
}

try:
    response = httpx.post(url, json=request_body, timeout=30.0)
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        print("✓ API key is VALID for Gemini text generation")
        data = response.json()
        text = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
        print(f"Response: {text[:100]}")
    else:
        print("✗ API key validation failed")
        print(f"Error: {json.dumps(response.json(), indent=2)}")
except Exception as e:
    print(f"Error: {e}")
