"""
Test script for Build with Agenty API endpoint.

Tests the AI-powered agent creation flow:
1. Start conversation with requirements
2. Handle clarification questions
3. Generate final agent with Claude AI

Requirements:
- ANTHROPIC_API_KEY must be set in environment
- FastAPI server must be running
"""

import httpx
import asyncio
import json
from typing import Optional


BASE_URL = "http://localhost:8000"
API_ENDPOINT = f"{BASE_URL}/api/v1/build-agent"


async def test_agent_creation_flow():
    """Test the complete agent creation flow"""
    print("🧪 Testing Build with Agenty API\n")
    print("=" * 60)

    async with httpx.AsyncClient(timeout=120.0) as client:
        # Step 1: Start agent creation
        print("\n📝 Step 1: Starting agent creation...")

        requirements = {
            "description": "I need a friendly customer service agent for an e-commerce electronics store. It should help customers with product questions, order tracking, and returns.",
            "name": "Electronics Store CS Agent",
            "language": "English",
            "hasKnowledgeBase": False
        }

        response = await client.post(
            API_ENDPOINT,
            data={
                "action": "start",
                "requirements": json.dumps(requirements)
            }
        )

        print(f"Status: {response.status_code}")

        if response.status_code != 200:
            print(f"❌ Error: {response.text}")
            return

        result = response.json()
        print(f"✅ Response: {json.dumps(result, indent=2)}")

        # Step 2: Handle clarification (if needed)
        if result.get("needsClarification"):
            print("\n💬 Step 2: Claude asked clarification questions")
            print(f"Questions: {result['questions']}")

            conversation_id = result["conversationId"]
            messages = [
                {"role": "user", "content": requirements["description"]},
                {"role": "assistant", "content": result["questions"]}
            ]

            # Simulate user answer
            user_answer = "The agent should be friendly and professional. It needs to know about our 30-day return policy and free shipping on orders over $50. We mainly sell smartphones, laptops, and accessories."

            print(f"\n👤 User answers: {user_answer}")

            response = await client.post(
                API_ENDPOINT,
                data={
                    "action": "clarify",
                    "message": user_answer,
                    "messages": json.dumps(messages),
                    "conversationId": conversation_id
                }
            )

            print(f"Status: {response.status_code}")

            if response.status_code != 200:
                print(f"❌ Error: {response.text}")
                return

            clarify_result = response.json()
            print(f"✅ Response: {json.dumps(clarify_result, indent=2)}")

            messages.append({"role": "user", "content": user_answer})

            # Check if more clarification needed
            while clarify_result.get("needsMoreInfo"):
                print(f"\n💬 More clarification needed: {clarify_result['questions']}")
                messages.append({"role": "assistant", "content": clarify_result["questions"]})

                # For testing, break after first round
                print("\n⚠️ Skipping additional clarification rounds for test")
                break

            # Step 3: Generate agent
            print("\n🚀 Step 3: Generating final agent...")
            print("⏳ This will take at least 10 seconds (minimum duration)...")

            response = await client.post(
                API_ENDPOINT,
                data={
                    "action": "generate",
                    "requirements": json.dumps(requirements),
                    "messages": json.dumps(messages),
                    "conversationId": conversation_id
                }
            )

            print(f"Status: {response.status_code}")

            if response.status_code != 200:
                print(f"❌ Error: {response.text}")
                return

            generate_result = response.json()
            print(f"✅ Agent Generated Successfully!")
            print(f"\nAgent ID: {generate_result['agentId']}")
            print(f"Agent Name: {generate_result['agent']['name']}")
            print(f"\nSystem Prompt Preview:")
            print(generate_result['agent']['systemPrompt'][:300] + "...")
            print(f"\nRecommended Providers:")
            print(f"  STT: {generate_result['agent']['providers']['stt']}")
            print(f"  LLM: {generate_result['agent']['providers']['llm']}")
            print(f"  TTS: {generate_result['agent']['providers']['tts']}")
            print(f"\nReasoning: {generate_result['agent'].get('reasoning', 'N/A')}")

        else:
            # No clarification needed, proceed directly
            print("\n✅ No clarification needed, proceeding to generation")

            conversation_id = result["conversationId"]
            messages = [
                {"role": "user", "content": requirements["description"]}
            ]

            print("\n🚀 Generating final agent...")

            response = await client.post(
                API_ENDPOINT,
                data={
                    "action": "generate",
                    "requirements": json.dumps(requirements),
                    "messages": json.dumps(messages),
                    "conversationId": conversation_id
                }
            )

            print(f"Status: {response.status_code}")

            if response.status_code != 200:
                print(f"❌ Error: {response.text}")
                return

            generate_result = response.json()
            print(f"✅ Agent Generated Successfully!")
            print(f"\nAgent ID: {generate_result['agentId']}")

    print("\n" + "=" * 60)
    print("✅ Test completed successfully!")


async def test_stats_endpoint():
    """Test the stats endpoint"""
    print("\n📊 Testing stats endpoint...")

    async with httpx.AsyncClient() as client:
        response = await client.get(f"{API_ENDPOINT}/stats")

        if response.status_code == 200:
            print(f"✅ Stats: {response.json()}")
        else:
            print(f"❌ Error: {response.status_code}")


async def test_health_check():
    """Test the health check endpoint"""
    print("\n🏥 Testing health check...")

    async with httpx.AsyncClient() as client:
        response = await client.get(f"{BASE_URL}/health")

        if response.status_code == 200:
            print(f"✅ API is healthy: {response.json()}")
        else:
            print(f"❌ Health check failed: {response.status_code}")


async def main():
    """Run all tests"""
    try:
        # Check if server is running
        await test_health_check()

        # Test main flow
        await test_agent_creation_flow()

        # Test stats
        await test_stats_endpoint()

    except httpx.ConnectError:
        print("\n❌ Error: Cannot connect to API server")
        print("Make sure the FastAPI server is running:")
        print("  cd agenty-platform/apps/api")
        print("  uvicorn main:app --reload")
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())
