"""Test conversation system API endpoints."""
import asyncio
import logging
import sys
from pathlib import Path

# Add backend to path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

import httpx

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# API Configuration
BASE_URL = "http://localhost:8000"

# Test user credentials (from existing test data)
TEST_USER_ID = "test-user-123"  # Replace with actual user ID
TEST_AUTH_TOKEN = "your-clerk-jwt-token"  # Replace with actual Clerk JWT


class ConversationAPITester:
    """Test all conversation API endpoints."""
    
    def __init__(self, base_url: str, auth_token: str):
        self.base_url = base_url
        self.headers = {
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json"
        }
        self.session_id = None
        self.profile_id = None
    
    async def test_health_check(self) -> bool:
        """Test if backend is running."""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{self.base_url}/health")
                if response.status_code == 200:
                    logger.info("✓ Backend health check passed")
                    return True
                else:
                    logger.error(f"✗ Health check failed: {response.status_code}")
                    return False
        except Exception as e:
            logger.error(f"✗ Health check error: {str(e)}")
            return False
    
    async def test_create_session(self) -> bool:
        """Test POST /api/conversations/sessions."""
        try:
            # First, get a profile ID (you'll need to create one or use existing)
            async with httpx.AsyncClient() as client:
                # This is a placeholder - you need an actual profile
                payload = {
                    "profile_id": self.profile_id or "test-profile-uuid"
                }
                
                response = await client.post(
                    f"{self.base_url}/api/conversations/sessions",
                    json=payload,
                    headers=self.headers
                )
                
                if response.status_code == 200:
                    data = response.json()
                    self.session_id = data["id"]
                    logger.info(f"✓ Created session: {self.session_id}")
                    logger.info(f"  Title: {data['title']}")
                    return True
                else:
                    logger.error(f"✗ Create session failed: {response.status_code}")
                    logger.error(f"  Response: {response.text}")
                    return False
        except Exception as e:
            logger.error(f"✗ Create session error: {str(e)}")
            return False
    
    async def test_list_sessions(self) -> bool:
        """Test GET /api/conversations/sessions."""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/api/conversations/sessions",
                    headers=self.headers
                )
                
                if response.status_code == 200:
                    data = response.json()
                    logger.info(f"✓ Listed sessions: {data['total']} total")
                    logger.info(f"  Periods: {[p['period'] for p in data['sessions']]}")
                    return True
                else:
                    logger.error(f"✗ List sessions failed: {response.status_code}")
                    return False
        except Exception as e:
            logger.error(f"✗ List sessions error: {str(e)}")
            return False
    
    async def test_get_session(self) -> bool:
        """Test GET /api/conversations/sessions/{session_id}."""
        if not self.session_id:
            logger.warning("⊘ Skipping get session (no session created)")
            return True
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/api/conversations/sessions/{self.session_id}",
                    headers=self.headers
                )
                
                if response.status_code == 200:
                    data = response.json()
                    logger.info(f"✓ Got session details")
                    logger.info(f"  Messages: {len(data['messages'])}")
                    return True
                else:
                    logger.error(f"✗ Get session failed: {response.status_code}")
                    return False
        except Exception as e:
            logger.error(f"✗ Get session error: {str(e)}")
            return False
    
    async def test_send_message(self) -> bool:
        """Test POST /api/conversations/sessions/{session_id}/messages."""
        if not self.session_id:
            logger.warning("⊘ Skipping send message (no session created)")
            return True
        
        try:
            async with httpx.AsyncClient() as client:
                payload = {
                    "content": "What are the admission requirements for the top program?"
                }
                
                response = await client.post(
                    f"{self.base_url}/api/conversations/sessions/{self.session_id}/messages",
                    json=payload,
                    headers=self.headers,
                    timeout=60.0  # AI response may take time
                )
                
                if response.status_code == 200:
                    data = response.json()
                    logger.info(f"✓ Sent message and got AI response")
                    logger.info(f"  User: {data['user_message']['content'][:50]}...")
                    logger.info(f"  AI: {data['assistant_message']['content'][:100]}...")
                    return True
                else:
                    logger.error(f"✗ Send message failed: {response.status_code}")
                    logger.error(f"  Response: {response.text}")
                    return False
        except Exception as e:
            logger.error(f"✗ Send message error: {str(e)}")
            return False
    
    async def test_update_session(self) -> bool:
        """Test PATCH /api/conversations/sessions/{session_id}."""
        if not self.session_id:
            logger.warning("⊘ Skipping update session (no session created)")
            return True
        
        try:
            async with httpx.AsyncClient() as client:
                payload = {
                    "title": "Updated Test Session",
                    "status": "active"
                }
                
                response = await client.patch(
                    f"{self.base_url}/api/conversations/sessions/{self.session_id}",
                    json=payload,
                    headers=self.headers
                )
                
                if response.status_code == 200:
                    data = response.json()
                    logger.info(f"✓ Updated session title: {data['title']}")
                    return True
                else:
                    logger.error(f"✗ Update session failed: {response.status_code}")
                    return False
        except Exception as e:
            logger.error(f"✗ Update session error: {str(e)}")
            return False
    
    async def test_generate_recommendation(self) -> bool:
        """Test POST /api/conversations/sessions/{session_id}/recommend."""
        if not self.session_id:
            logger.warning("⊘ Skipping generate recommendation (no session created)")
            return True
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/api/conversations/sessions/{self.session_id}/recommend",
                    headers=self.headers,
                    timeout=120.0  # RAG + LLM may take time
                )
                
                if response.status_code == 200:
                    data = response.json()
                    logger.info(f"✓ Generated recommendation")
                    logger.info(f"  Recommendation ID: {data['recommendation_id']}")
                    logger.info(f"  Programs: {len(data['structured_data'].get('program_names', []))}")
                    return True
                elif response.status_code == 400 and "already has recommendation" in response.text:
                    logger.info("✓ Cannot generate (session already has recommendation)")
                    return True
                else:
                    logger.error(f"✗ Generate recommendation failed: {response.status_code}")
                    logger.error(f"  Response: {response.text}")
                    return False
        except Exception as e:
            logger.error(f"✗ Generate recommendation error: {str(e)}")
            return False
    
    async def test_delete_session(self) -> bool:
        """Test DELETE /api/conversations/sessions/{session_id}."""
        if not self.session_id:
            logger.warning("⊘ Skipping delete session (no session created)")
            return True
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.delete(
                    f"{self.base_url}/api/conversations/sessions/{self.session_id}",
                    headers=self.headers
                )
                
                if response.status_code == 204:
                    logger.info(f"✓ Deleted session")
                    return True
                else:
                    logger.error(f"✗ Delete session failed: {response.status_code}")
                    return False
        except Exception as e:
            logger.error(f"✗ Delete session error: {str(e)}")
            return False
    
    async def run_all_tests(self):
        """Run all API tests in sequence."""
        logger.info("=" * 60)
        logger.info("CONVERSATION API TEST SUITE")
        logger.info("=" * 60)
        
        tests = [
            ("Health Check", self.test_health_check()),
            ("Create Session", self.test_create_session()),
            ("List Sessions", self.test_list_sessions()),
            ("Get Session", self.test_get_session()),
            ("Send Message", self.test_send_message()),
            ("Update Session", self.test_update_session()),
            ("Generate Recommendation", self.test_generate_recommendation()),
            ("Delete Session", self.test_delete_session()),
        ]
        
        results = []
        for test_name, test_coro in tests:
            logger.info(f"\n--- {test_name} ---")
            result = await test_coro
            results.append((test_name, result))
        
        # Summary
        logger.info("\n" + "=" * 60)
        logger.info("TEST SUMMARY")
        logger.info("=" * 60)
        
        passed = sum(1 for _, result in results if result)
        total = len(results)
        
        for test_name, result in results:
            status = "✅ PASSED" if result else "❌ FAILED"
            logger.info(f"{test_name}: {status}")
        
        logger.info(f"\n{passed}/{total} tests passed")
        
        if passed == total:
            logger.info("\n🎉 All tests passed!")
        else:
            logger.error(f"\n⚠️ {total - passed} test(s) failed")
        
        return passed == total


async def main():
    """Main entry point."""
    logger.info("Note: This test requires:")
    logger.info("1. Backend running (docker-compose up backend)")
    logger.info("2. Valid Clerk JWT token")
    logger.info("3. Existing user profile\n")
    
    # Check if we should run with mock or real auth
    if TEST_AUTH_TOKEN == "your-clerk-jwt-token":
        logger.warning("⚠️ Using placeholder auth token - tests will likely fail")
        logger.warning("Set TEST_AUTH_TOKEN in the script to a real Clerk JWT\n")
    
    tester = ConversationAPITester(BASE_URL, TEST_AUTH_TOKEN)
    
    # You can set a profile_id here if you have one
    # tester.profile_id = "some-uuid"
    
    success = await tester.run_all_tests()
    
    return 0 if success else 1


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
