#!/usr/bin/env python3
"""Test script to verify Replicate API token"""
import os
from dotenv import load_dotenv

# Load .env file
load_dotenv()

token = os.getenv("REPLICATE_API_TOKEN")

print(f"Token loaded: {'Yes' if token else 'No'}")
if token:
    print(f"Token starts with: {token[:10] if len(token) >= 10 else token}...")
    print(f"Token length: {len(token)}")

    # Try to initialize Replicate client
    try:
        import replicate
        client = replicate.Client(api_token=token)
        print("✅ Replicate client created successfully")

        # Try to run a simple model
        print("\nTesting API call...")
        output = client.run(
            "black-forest-labs/flux-schnell",
            input={
                "prompt": "test product photo",
                "num_outputs": 1,
                "aspect_ratio": "1:1",
            }
        )
        print(f"✅ SUCCESS! Generated image: {output[0] if isinstance(output, list) else output}")

    except Exception as e:
        print(f"❌ ERROR: {type(e).__name__}: {e}")
else:
    print("❌ No token found in .env file")
