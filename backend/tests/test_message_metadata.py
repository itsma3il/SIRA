#!/usr/bin/env python3
"""Test if message metadata is properly serialized."""
import sys
from datetime import datetime
from uuid import uuid4
from app.models.conversation import ConversationMessage
from app.schemas.conversation import MessageResponse

# Create a mock message with metadata
mock_message = ConversationMessage(
    id=uuid4(),
    session_id=uuid4(),
    role="assistant",
    content="Test message",
    message_metadata={
        "type": "recommendation_generated",
        "recommendation_id": str(uuid4()),
        "recommendation_number": 1
    },
    created_at=datetime.utcnow()
)

# Serialize to Pydantic model
try:
    response = MessageResponse.model_validate(mock_message)
    print("✅ Serialization successful!")
    print(f"Message ID: {response.id}")
    print(f"Metadata: {response.metadata}")
    
    if response.metadata and response.metadata.get("type") == "recommendation_generated":
        print("✅ Metadata correctly includes recommendation info")
    else:
        print("❌ Metadata is missing or incorrect")
        sys.exit(1)
        
except Exception as e:
    print(f"❌ Serialization failed: {e}")
    sys.exit(1)
