"""
Conversation state management for agent creation flow.

Manages temporary state during the agent creation conversation with Claude AI.
Conversations expire after 1 hour to prevent memory leaks.
"""

from typing import Dict, List, Optional
from datetime import datetime, timedelta
import uuid
import logging

logger = logging.getLogger(__name__)


class ConversationStateManager:
    """Manage conversation state for agent creation"""

    def __init__(self, ttl_hours: int = 1):
        """
        Initialize conversation state manager.

        Args:
            ttl_hours: Time-to-live for conversations in hours (default: 1)
        """
        self.conversations: Dict[str, Dict] = {}
        self.ttl = timedelta(hours=ttl_hours)
        logger.info("ConversationStateManager initialized with TTL: %s hours", ttl_hours)

    def create_conversation(
        self,
        requirements: Dict,
        messages: List[Dict]
    ) -> str:
        """
        Create a new conversation.

        Args:
            requirements: User's agent requirements
            messages: Initial conversation messages

        Returns:
            Conversation ID (UUID)
        """
        conversation_id = str(uuid.uuid4())

        self.conversations[conversation_id] = {
            "id": conversation_id,
            "requirements": requirements,
            "messages": messages,
            "created_at": datetime.now()
        }

        logger.info("Created conversation: %s", conversation_id)
        return conversation_id

    def get_conversation(self, conversation_id: str) -> Optional[Dict]:
        """
        Get conversation by ID.

        Args:
            conversation_id: Conversation UUID

        Returns:
            Conversation dict or None if not found/expired
        """
        conv = self.conversations.get(conversation_id)

        if conv:
            # Check if expired
            if datetime.now() - conv["created_at"] > self.ttl:
                logger.info("Conversation %s expired, removing", conversation_id)
                del self.conversations[conversation_id]
                return None

            logger.debug("Retrieved conversation: %s", conversation_id)
            return conv

        logger.warning("Conversation not found: %s", conversation_id)
        return None

    def update_conversation(
        self,
        conversation_id: str,
        messages: List[Dict]
    ) -> bool:
        """
        Update conversation messages.

        Args:
            conversation_id: Conversation UUID
            messages: Updated messages list

        Returns:
            True if updated, False if not found
        """
        if conversation_id in self.conversations:
            self.conversations[conversation_id]["messages"] = messages
            logger.debug("Updated conversation %s with %d messages",
                        conversation_id, len(messages))
            return True

        logger.warning("Cannot update conversation %s: not found", conversation_id)
        return False

    def delete_conversation(self, conversation_id: str) -> bool:
        """
        Delete a conversation.

        Args:
            conversation_id: Conversation UUID

        Returns:
            True if deleted, False if not found
        """
        if conversation_id in self.conversations:
            del self.conversations[conversation_id]
            logger.info("Deleted conversation: %s", conversation_id)
            return True

        return False

    def cleanup_expired(self) -> int:
        """
        Remove expired conversations.

        Returns:
            Number of conversations removed
        """
        now = datetime.now()
        expired = [
            cid for cid, conv in self.conversations.items()
            if now - conv["created_at"] > self.ttl
        ]

        for cid in expired:
            del self.conversations[cid]

        if expired:
            logger.info("Cleaned up %d expired conversations", len(expired))

        return len(expired)

    def get_stats(self) -> Dict:
        """
        Get statistics about active conversations.

        Returns:
            Dict with conversation statistics
        """
        now = datetime.now()
        active = len(self.conversations)
        ages = [
            (now - conv["created_at"]).total_seconds() / 60
            for conv in self.conversations.values()
        ]

        return {
            "active_conversations": active,
            "avg_age_minutes": sum(ages) / len(ages) if ages else 0,
            "oldest_age_minutes": max(ages) if ages else 0
        }


# Global instance
conversation_manager = ConversationStateManager()
