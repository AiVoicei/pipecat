"""
Abstract Data Layer - Database-Ready Mock Architecture

This module provides an abstract interface for data operations that can seamlessly
switch between mock storage (current) and database storage (future) without
changing business logic code.
"""

from abc import ABC, abstractmethod
from typing import Dict, List, Optional, Any, Union
from datetime import datetime
import uuid
import json
import asyncio

from ..schemas.agent import Agent, AgentSession
from ..schemas.provider import Provider, ProviderCredential, ProviderType


class DataLayer(ABC):
    """Abstract interface for all data operations"""

    # Agent Operations
    @abstractmethod
    async def get_agent(self, agent_id: str) -> Optional[Agent]:
        """Get agent by ID"""
        pass

    @abstractmethod
    async def create_agent(self, agent: Agent) -> Agent:
        """Create new agent"""
        pass

    @abstractmethod
    async def update_agent(self, agent_id: str, agent_data: Dict[str, Any]) -> Agent:
        """Update existing agent"""
        pass

    @abstractmethod
    async def delete_agent(self, agent_id: str) -> bool:
        """Delete agent"""
        pass

    @abstractmethod
    async def list_user_agents(self, user_id: str) -> List[Agent]:
        """List all agents for a user"""
        pass

    # Provider Operations
    @abstractmethod
    async def get_provider(self, provider_id: str) -> Optional[Provider]:
        """Get provider by ID"""
        pass

    @abstractmethod
    async def list_providers(
        self,
        provider_type: Optional[ProviderType] = None,
        status: Optional[str] = None
    ) -> List[Provider]:
        """List providers with optional filtering"""
        pass

    # Credential Operations
    @abstractmethod
    async def store_user_credential(
        self,
        user_id: str,
        provider_name: str,
        provider_type: ProviderType,
        encrypted_credentials: str
    ) -> ProviderCredential:
        """Store encrypted user credentials"""
        pass

    @abstractmethod
    async def get_user_credential(
        self,
        user_id: str,
        provider_name: str,
        provider_type: ProviderType
    ) -> Optional[ProviderCredential]:
        """Get user credentials for a provider"""
        pass

    @abstractmethod
    async def delete_user_credential(
        self,
        user_id: str,
        provider_name: str,
        provider_type: ProviderType
    ) -> bool:
        """Delete user credentials"""
        pass

    @abstractmethod
    async def list_user_credentials(self, user_id: str) -> List[ProviderCredential]:
        """List all credentials for a user"""
        pass

    # Session Operations
    @abstractmethod
    async def create_agent_session(self, session: AgentSession) -> AgentSession:
        """Create new agent session"""
        pass

    @abstractmethod
    async def get_agent_session(self, session_id: str) -> Optional[AgentSession]:
        """Get session by ID"""
        pass

    @abstractmethod
    async def update_agent_session(
        self,
        session_id: str,
        session_data: Dict[str, Any]
    ) -> AgentSession:
        """Update session data"""
        pass

    @abstractmethod
    async def list_agent_sessions(
        self,
        agent_id: Optional[str] = None,
        user_id: Optional[str] = None
    ) -> List[AgentSession]:
        """List sessions with optional filtering"""
        pass


class MockDataLayer(DataLayer):
    """Mock implementation using in-memory storage"""

    def __init__(self):
        self.agents: Dict[str, Agent] = {}
        self.providers: Dict[str, Provider] = {}
        self.credentials: Dict[str, List[ProviderCredential]] = {}  # user_id -> credentials
        self.sessions: Dict[str, AgentSession] = {}

        # Initialize with providers from centralized mock data
        self._initialize_providers()

    def _initialize_providers(self):
        """Initialize providers from centralized mock data source"""
        # Import the centralized provider data
        # Note: In practice, you'd convert the TypeScript data to Python
        # For now, we'll create a few key providers manually

        from ..schemas.provider import Provider, ProviderCapabilities, ProviderPricingInfo, ProviderStatus

        # OpenAI STT
        self.providers["openai_stt"] = Provider(
            id="openai_stt",
            name="openai",
            display_name="OpenAI Whisper",
            type=ProviderType.STT,
            description="OpenAI's Whisper speech-to-text model with high accuracy",
            status=ProviderStatus.AVAILABLE,
            configuration_schema={
                "type": "object",
                "properties": {
                    "api_key": {"type": "string", "description": "OpenAI API key"},
                    "model": {"type": "string", "enum": ["whisper-1"], "default": "whisper-1"},
                    "language": {"type": "string", "description": "Language code"}
                },
                "required": ["api_key"],
                "examples": [{"api_key": "sk-...", "model": "whisper-1", "language": "en"}]
            },
            capabilities=ProviderCapabilities(
                languages=["en", "he", "es", "fr", "de", "it", "pt", "ru", "ja", "ko"],
                supports_streaming=True,
                supports_interruption=True,
                latency_ms=300,
                quality_score=9.0
            ),
            pricing=ProviderPricingInfo(
                model="pay_per_use",
                cost_per_unit=0.006,
                unit="per minute"
            ),
            documentation_url="https://platform.openai.com/docs/guides/speech-to-text"
        )

        # Add more providers based on centralized data...
        # This would be populated from the TypeScript file we just created

    # Agent Operations
    async def get_agent(self, agent_id: str) -> Optional[Agent]:
        return self.agents.get(agent_id)

    async def create_agent(self, agent: Agent) -> Agent:
        if not agent.id:
            agent.id = str(uuid.uuid4())
        agent.created_at = datetime.now()
        agent.updated_at = datetime.now()
        self.agents[agent.id] = agent
        return agent

    async def update_agent(self, agent_id: str, agent_data: Dict[str, Any]) -> Agent:
        if agent_id not in self.agents:
            raise ValueError(f"Agent {agent_id} not found")

        agent = self.agents[agent_id]
        for key, value in agent_data.items():
            if hasattr(agent, key):
                setattr(agent, key, value)

        agent.updated_at = datetime.now()
        return agent

    async def delete_agent(self, agent_id: str) -> bool:
        if agent_id in self.agents:
            del self.agents[agent_id]
            return True
        return False

    async def list_user_agents(self, user_id: str) -> List[Agent]:
        return [agent for agent in self.agents.values() if agent.user_id == user_id]

    # Provider Operations
    async def get_provider(self, provider_id: str) -> Optional[Provider]:
        return self.providers.get(provider_id)

    async def list_providers(
        self,
        provider_type: Optional[ProviderType] = None,
        status: Optional[str] = None
    ) -> List[Provider]:
        providers = list(self.providers.values())

        if provider_type:
            providers = [p for p in providers if p.type == provider_type]

        if status:
            providers = [p for p in providers if p.status.value == status]

        return providers

    # Credential Operations
    async def store_user_credential(
        self,
        user_id: str,
        provider_name: str,
        provider_type: ProviderType,
        encrypted_credentials: str
    ) -> ProviderCredential:
        credential = ProviderCredential(
            id=f"{user_id}_{provider_name}_{provider_type.value}",
            user_id=user_id,
            provider_name=provider_name,
            provider_type=provider_type,
            encrypted_credentials=encrypted_credentials,
            is_active=True,
            created_at=datetime.now()
        )

        if user_id not in self.credentials:
            self.credentials[user_id] = []

        # Remove existing credential for same provider
        self.credentials[user_id] = [
            c for c in self.credentials[user_id]
            if not (c.provider_name == provider_name and c.provider_type == provider_type)
        ]

        self.credentials[user_id].append(credential)
        return credential

    async def get_user_credential(
        self,
        user_id: str,
        provider_name: str,
        provider_type: ProviderType
    ) -> Optional[ProviderCredential]:
        if user_id not in self.credentials:
            return None

        for cred in self.credentials[user_id]:
            if (cred.provider_name == provider_name and
                cred.provider_type == provider_type and
                cred.is_active):
                return cred

        return None

    async def delete_user_credential(
        self,
        user_id: str,
        provider_name: str,
        provider_type: ProviderType
    ) -> bool:
        if user_id not in self.credentials:
            return False

        original_count = len(self.credentials[user_id])
        self.credentials[user_id] = [
            c for c in self.credentials[user_id]
            if not (c.provider_name == provider_name and c.provider_type == provider_type)
        ]

        return len(self.credentials[user_id]) < original_count

    async def list_user_credentials(self, user_id: str) -> List[ProviderCredential]:
        return self.credentials.get(user_id, [])

    # Session Operations
    async def create_agent_session(self, session: AgentSession) -> AgentSession:
        if not session.id:
            session.id = str(uuid.uuid4())
        if not session.session_uuid:
            session.session_uuid = str(uuid.uuid4())
        session.started_at = datetime.now()

        self.sessions[session.id] = session
        return session

    async def get_agent_session(self, session_id: str) -> Optional[AgentSession]:
        return self.sessions.get(session_id)

    async def update_agent_session(
        self,
        session_id: str,
        session_data: Dict[str, Any]
    ) -> AgentSession:
        if session_id not in self.sessions:
            raise ValueError(f"Session {session_id} not found")

        session = self.sessions[session_id]
        for key, value in session_data.items():
            if hasattr(session, key):
                setattr(session, key, value)

        return session

    async def list_agent_sessions(
        self,
        agent_id: Optional[str] = None,
        user_id: Optional[str] = None
    ) -> List[AgentSession]:
        sessions = list(self.sessions.values())

        if agent_id:
            sessions = [s for s in sessions if s.agent_id == agent_id]

        if user_id:
            sessions = [s for s in sessions if s.metadata and s.metadata.get("user_id") == user_id]

        return sessions


class DatabaseDataLayer(DataLayer):
    """Database implementation using PostgreSQL (future implementation)"""

    def __init__(self, database_url: str):
        self.database_url = database_url
        # Database connection would be initialized here
        # For now, this is just a placeholder
        pass

    # All methods would be implemented to use actual database queries
    # For now, they raise NotImplementedError to indicate future work

    async def get_agent(self, agent_id: str) -> Optional[Agent]:
        raise NotImplementedError("Database implementation pending")

    async def create_agent(self, agent: Agent) -> Agent:
        raise NotImplementedError("Database implementation pending")

    async def update_agent(self, agent_id: str, agent_data: Dict[str, Any]) -> Agent:
        raise NotImplementedError("Database implementation pending")

    async def delete_agent(self, agent_id: str) -> bool:
        raise NotImplementedError("Database implementation pending")

    async def list_user_agents(self, user_id: str) -> List[Agent]:
        raise NotImplementedError("Database implementation pending")

    async def get_provider(self, provider_id: str) -> Optional[Provider]:
        raise NotImplementedError("Database implementation pending")

    async def list_providers(
        self,
        provider_type: Optional[ProviderType] = None,
        status: Optional[str] = None
    ) -> List[Provider]:
        raise NotImplementedError("Database implementation pending")

    async def store_user_credential(
        self,
        user_id: str,
        provider_name: str,
        provider_type: ProviderType,
        encrypted_credentials: str
    ) -> ProviderCredential:
        raise NotImplementedError("Database implementation pending")

    async def get_user_credential(
        self,
        user_id: str,
        provider_name: str,
        provider_type: ProviderType
    ) -> Optional[ProviderCredential]:
        raise NotImplementedError("Database implementation pending")

    async def delete_user_credential(
        self,
        user_id: str,
        provider_name: str,
        provider_type: ProviderType
    ) -> bool:
        raise NotImplementedError("Database implementation pending")

    async def list_user_credentials(self, user_id: str) -> List[ProviderCredential]:
        raise NotImplementedError("Database implementation pending")

    async def create_agent_session(self, session: AgentSession) -> AgentSession:
        raise NotImplementedError("Database implementation pending")

    async def get_agent_session(self, session_id: str) -> Optional[AgentSession]:
        raise NotImplementedError("Database implementation pending")

    async def update_agent_session(
        self,
        session_id: str,
        session_data: Dict[str, Any]
    ) -> AgentSession:
        raise NotImplementedError("Database implementation pending")

    async def list_agent_sessions(
        self,
        agent_id: Optional[str] = None,
        user_id: Optional[str] = None
    ) -> List[AgentSession]:
        raise NotImplementedError("Database implementation pending")