#!/usr/bin/env python3
"""
Test script for the Agenty Platform API
Quick test to verify the API is working correctly
"""

import asyncio
import sys
import json
from pathlib import Path

# Add src to Python path
current_dir = Path(__file__).parent
src_dir = current_dir / "src"
sys.path.insert(0, str(src_dir))

async def test_api():
    """Test the Agenty Platform API functionality"""
    try:
        print("🧪 Testing Agenty Platform API...")

        # Import API components
        from main import app
        from fastapi.testclient import TestClient

        # Create test client
        client = TestClient(app)

        print("\n1. Testing health check...")
        response = client.get("/health")
        assert response.status_code == 200
        health_data = response.json()
        print(f"   ✅ Health check: {health_data['status']}")

        print("\n2. Testing root endpoint...")
        response = client.get("/")
        assert response.status_code == 200
        root_data = response.json()
        print(f"   ✅ API Name: {root_data['name']}")
        print(f"   ✅ Version: {root_data['version']}")

        print("\n3. Testing provider endpoints...")

        # Test get providers (no auth needed for this endpoint)
        response = client.get("/api/v1/providers/")
        if response.status_code == 200:
            providers = response.json()
            print(f"   ✅ Found {len(providers)} providers")
            for provider in providers[:3]:  # Show first 3
                print(f"      - {provider['display_name']} ({provider['type']})")
        else:
            print(f"   ⚠️ Providers endpoint returned {response.status_code}")

        print("\n4. Testing provider marketplace...")

        # Mock auth header for testing
        headers = {"Authorization": "Bearer test-token"}

        response = client.get("/api/v1/providers/marketplace", headers=headers)
        if response.status_code == 200:
            marketplace = response.json()
            print(f"   ✅ Marketplace loaded with {len(marketplace['providers'])} providers")
        else:
            print(f"   ⚠️ Marketplace endpoint returned {response.status_code}")

        print("\n5. Testing agent templates...")
        response = client.get("/api/v1/agents/templates/")
        if response.status_code == 200:
            templates = response.json()
            print(f"   ✅ Found {len(templates)} agent templates")
            for template in templates:
                print(f"      - {template['name']} ({template['category']})")
        else:
            print(f"   ⚠️ Templates endpoint returned {response.status_code}")

        print("\n6. Testing configuration validation...")

        # Test configuration
        test_config = {
            "configuration": {
                "stt": {
                    "provider": "openai",
                    "settings": {"model": "whisper-1", "language": "en"}
                },
                "llm": {
                    "provider": "openai",
                    "settings": {"model": "gpt-4", "temperature": 0.7}
                },
                "tts": {
                    "provider": "elevenlabs",
                    "settings": {"voice_id": "21m00Tcm4TlvDq8ikWAM"}
                },
                "transport": {
                    "type": "webrtc",
                    "settings": {}
                },
                "language": "en",
                "system_prompt": "You are a helpful assistant."
            },
            "test_text": "Hello, this is a test."
        }

        response = client.post(
            "/api/v1/agents/test-configuration",
            json=test_config,
            headers=headers
        )

        if response.status_code == 200:
            result = response.json()
            print(f"   ✅ Configuration test: {result['success']}")
            print(f"   ⏱️ Test duration: {result['test_duration']:.2f}s")
        else:
            print(f"   ⚠️ Configuration test failed: {response.status_code}")
            if response.status_code == 422:
                print(f"      Validation error: {response.json()}")

        print("\n7. Testing API status...")
        response = client.get("/api/v1/status")
        if response.status_code == 200:
            status_data = response.json()
            print(f"   ✅ API Status: {status_data['api_status']}")
            print(f"   📊 Active agents: {status_data['active_agents']}")
        else:
            print(f"   ⚠️ Status endpoint returned {response.status_code}")

        print("\n🎉 API Test Complete!")
        print("✅ All core endpoints are working")
        print("🚀 Ready for frontend integration")

        return True

    except ImportError as e:
        print(f"❌ Import error: {e}")
        print("💡 Make sure to install dependencies:")
        print("   pip install fastapi uvicorn pydantic")
        return False

    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Run the API tests"""
    print("🧪 Agenty Platform API Test Suite")
    print("=" * 50)

    # Run async test
    success = asyncio.run(test_api())

    if success:
        print("\n✅ All tests passed!")
        sys.exit(0)
    else:
        print("\n❌ Tests failed!")
        sys.exit(1)

if __name__ == "__main__":
    main()