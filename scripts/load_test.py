"""
Load Testing Script for SIRA
Uses locust for load testing
Install: pip install locust
Run: locust -f scripts/load_test.py --host=http://localhost:8000
"""

from locust import HttpUser, task, between
import json
import random


class SIRAUser(HttpUser):
    """Simulates a SIRA user."""
    
    # Wait 1-3 seconds between tasks
    wait_time = between(1, 3)
    
    def on_start(self):
        """Called when a simulated user starts."""
        # Mock authentication token (replace with real token in production)
        self.headers = {
            "Authorization": "Bearer test_token_12345",
            "Content-Type": "application/json"
        }
        self.user_id = f"user_{random.randint(1, 1000)}"
    
    @task(3)
    def health_check(self):
        """Check API health (most frequent)."""
        self.client.get("/health", headers=self.headers)
    
    @task(2)
    def get_profile(self):
        """Get user profile."""
        self.client.get(
            f"/api/profiles/{self.user_id}",
            headers=self.headers
        )
    
    @task(2)
    def create_profile(self):
        """Create or update user profile."""
        profile_data = {
            "clerk_id": self.user_id,
            "academic_level": random.choice(["bachelor", "master", "phd"]),
            "field_of_study": random.choice(["Computer Science", "Engineering", "Business"]),
            "gpa": round(random.uniform(2.5, 4.0), 2),
            "target_country": random.choice(["USA", "Canada", "UK", "Germany"]),
            "budget_range": random.choice(["low", "medium", "high"]),
            "interests": ["AI", "Data Science", "Web Development"],
            "career_goals": "Software Engineer"
        }
        self.client.post(
            "/api/profiles",
            headers=self.headers,
            json=profile_data
        )
    
    @task(1)
    def generate_recommendations(self):
        """Generate recommendations (most expensive operation)."""
        recommendation_request = {
            "user_id": self.user_id,
            "filters": {
                "country": random.choice(["USA", "Canada", "UK"]),
                "degree_level": random.choice(["bachelor", "master"])
            },
            "limit": 10
        }
        self.client.post(
            "/api/recommendations/generate",
            headers=self.headers,
            json=recommendation_request
        )
    
    @task(2)
    def get_recommendations(self):
        """Get existing recommendations."""
        self.client.get(
            f"/api/recommendations/user/{self.user_id}",
            headers=self.headers
        )
    
    @task(1)
    def upload_document(self):
        """Upload a document (transcript)."""
        # Simulate file upload with dummy data
        files = {
            'file': ('transcript.pdf', b'dummy pdf content', 'application/pdf')
        }
        self.client.post(
            "/api/documents/upload",
            headers={"Authorization": self.headers["Authorization"]},
            files=files,
            data={"document_type": "transcript"}
        )
    
    @task(1)
    def start_conversation(self):
        """Start a conversation session."""
        self.client.post(
            "/api/conversation/start",
            headers=self.headers,
            json={"user_id": self.user_id}
        )
    
    @task(1)
    def send_message(self):
        """Send a message in conversation."""
        session_id = f"session_{random.randint(1, 100)}"
        message_data = {
            "session_id": session_id,
            "user_id": self.user_id,
            "message": random.choice([
                "What are the best universities for computer science?",
                "Tell me about scholarships in Canada",
                "What are the admission requirements?",
                "Can you help me with my application?"
            ])
        }
        self.client.post(
            "/api/conversation/message",
            headers=self.headers,
            json=message_data
        )


class AdminUser(HttpUser):
    """Simulates an admin user monitoring the system."""
    
    wait_time = between(5, 10)
    
    def on_start(self):
        """Called when admin user starts."""
        self.headers = {
            "Authorization": "Bearer admin_token",
            "Content-Type": "application/json"
        }
    
    @task
    def check_system_health(self):
        """Check detailed system health."""
        self.client.get("/health/system", headers=self.headers)
    
    @task
    def check_performance_metrics(self):
        """Check performance metrics."""
        self.client.get("/health/performance", headers=self.headers)


if __name__ == "__main__":
    import os
    print("Load Testing Script for SIRA")
    print("=" * 60)
    print("\nTo run load tests:")
    print("\n1. Install locust:")
    print("   pip install locust")
    print("\n2. Run load test:")
    print("   locust -f scripts/load_test.py --host=http://localhost:8000")
    print("\n3. Open web UI:")
    print("   http://localhost:8089")
    print("\n4. Configure:")
    print("   - Number of users: 100")
    print("   - Spawn rate: 10/second")
    print("   - Host: http://localhost:8000")
    print("\n5. Start test and monitor:")
    print("   - Response times")
    print("   - Requests per second")
    print("   - Failure rate")
    print("\n" + "=" * 60)
