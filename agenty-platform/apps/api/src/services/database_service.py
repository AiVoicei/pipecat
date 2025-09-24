"""
Database service for agent CRUD operations
"""

import uuid
from typing import List, Optional, Dict, Any
from datetime import datetime
from sqlalchemy import select, update, delete, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..models.agent import Agent, AgentTemplate
from ..models.user import User
from ..models.provider import UserProviderCredential, Provider
from ..models.session import AgentSession
from ..schemas.agent import AgentCreate, AgentUpdate


class DatabaseService:
    """Database service for managing agents, templates, and related entities"""

    def __init__(self, db: AsyncSession):
        self.db = db

    # Agent CRUD operations
    async def create_agent(self, user_id: uuid.UUID, agent_data: AgentCreate) -> Agent:
        """Create a new agent"""
        agent = Agent(
            user_id=user_id,
            name=agent_data.name,
            description=agent_data.description,
            configuration=agent_data.configuration,
            deployment_config=agent_data.deployment_config or {},
            status=agent_data.status or "draft",
            template_id=agent_data.template_id,
            tags=agent_data.tags or [],
            version=agent_data.version or "1.0.0",
            is_public=agent_data.is_public or False
        )

        self.db.add(agent)
        await self.db.commit()
        await self.db.refresh(agent)
        return agent

    async def get_agent_by_id(self, agent_id: uuid.UUID, user_id: uuid.UUID = None) -> Optional[Agent]:
        """Get agent by ID, optionally filtered by user"""
        query = select(Agent).options(
            selectinload(Agent.template),
            selectinload(Agent.user)
        ).where(Agent.id == agent_id)

        if user_id:
            query = query.where(Agent.user_id == user_id)

        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def get_agents_by_user(
        self,
        user_id: uuid.UUID,
        status: Optional[str] = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[Agent]:
        """Get agents by user ID with optional filtering"""
        query = select(Agent).options(
            selectinload(Agent.template)
        ).where(Agent.user_id == user_id)

        if status:
            query = query.where(Agent.status == status)

        query = query.limit(limit).offset(offset).order_by(Agent.updated_at.desc())

        result = await self.db.execute(query)
        return result.scalars().all()

    async def update_agent(
        self,
        agent_id: uuid.UUID,
        user_id: uuid.UUID,
        agent_data: AgentUpdate
    ) -> Optional[Agent]:
        """Update an existing agent"""
        # Check if agent exists and belongs to user
        agent = await self.get_agent_by_id(agent_id, user_id)
        if not agent:
            return None

        # Update fields
        update_data = agent_data.dict(exclude_unset=True)
        if update_data:
            for field, value in update_data.items():
                setattr(agent, field, value)

        await self.db.commit()
        await self.db.refresh(agent)
        return agent

    async def delete_agent(self, agent_id: uuid.UUID, user_id: uuid.UUID) -> bool:
        """Delete an agent"""
        result = await self.db.execute(
            delete(Agent).where(
                and_(Agent.id == agent_id, Agent.user_id == user_id)
            )
        )
        await self.db.commit()
        return result.rowcount > 0

    # Agent Template CRUD operations
    async def get_agent_templates(
        self,
        category: Optional[str] = None,
        is_public: bool = True,
        is_featured: bool = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[AgentTemplate]:
        """Get agent templates with optional filtering"""
        query = select(AgentTemplate).options(
            selectinload(AgentTemplate.creator)
        ).where(AgentTemplate.is_public == is_public)

        if category:
            query = query.where(AgentTemplate.category == category)

        if is_featured is not None:
            query = query.where(AgentTemplate.is_featured == is_featured)

        query = query.limit(limit).offset(offset).order_by(
            AgentTemplate.is_featured.desc(),
            AgentTemplate.sort_order.asc(),
            AgentTemplate.usage_count.desc()
        )

        result = await self.db.execute(query)
        return result.scalars().all()

    async def get_template_by_id(self, template_id: uuid.UUID) -> Optional[AgentTemplate]:
        """Get template by ID"""
        query = select(AgentTemplate).options(
            selectinload(AgentTemplate.creator)
        ).where(AgentTemplate.id == template_id)

        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def increment_template_usage(self, template_id: uuid.UUID) -> None:
        """Increment template usage count"""
        await self.db.execute(
            update(AgentTemplate)
            .where(AgentTemplate.id == template_id)
            .values(usage_count=AgentTemplate.usage_count + 1)
        )
        await self.db.commit()

    # User Provider Credentials CRUD operations
    async def store_user_credentials(
        self,
        user_id: uuid.UUID,
        provider_name: str,
        provider_type: str,
        encrypted_credentials: str,
        credential_name: Optional[str] = None
    ) -> UserProviderCredential:
        """Store user provider credentials"""
        # Delete existing credentials for this provider
        await self.db.execute(
            delete(UserProviderCredential).where(
                and_(
                    UserProviderCredential.user_id == user_id,
                    UserProviderCredential.provider_name == provider_name,
                    UserProviderCredential.provider_type == provider_type
                )
            )
        )

        # Create new credentials
        credential = UserProviderCredential(
            user_id=user_id,
            provider_name=provider_name,
            provider_type=provider_type,
            encrypted_credentials=encrypted_credentials,
            credential_name=credential_name or f"{provider_name} {provider_type}",
            is_active=True,
            validation_status="unknown"
        )

        self.db.add(credential)
        await self.db.commit()
        await self.db.refresh(credential)
        return credential

    async def get_user_credentials(
        self,
        user_id: uuid.UUID,
        provider_name: str,
        provider_type: str
    ) -> Optional[UserProviderCredential]:
        """Get user credentials for a specific provider"""
        query = select(UserProviderCredential).where(
            and_(
                UserProviderCredential.user_id == user_id,
                UserProviderCredential.provider_name == provider_name,
                UserProviderCredential.provider_type == provider_type,
                UserProviderCredential.is_active == True
            )
        )

        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def get_user_credentials_list(self, user_id: uuid.UUID) -> List[UserProviderCredential]:
        """Get all user credentials"""
        query = select(UserProviderCredential).where(
            and_(
                UserProviderCredential.user_id == user_id,
                UserProviderCredential.is_active == True
            )
        ).order_by(UserProviderCredential.provider_name, UserProviderCredential.provider_type)

        result = await self.db.execute(query)
        return result.scalars().all()

    # Agent Session CRUD operations
    async def create_agent_session(
        self,
        agent_id: uuid.UUID,
        session_uuid: str,
        transport_type: Optional[str] = None,
        client_ip: Optional[str] = None,
        user_agent: Optional[str] = None,
        session_config: Optional[Dict[str, Any]] = None
    ) -> AgentSession:
        """Create a new agent session"""
        session = AgentSession(
            agent_id=agent_id,
            session_uuid=session_uuid,
            status="starting",
            transport_type=transport_type,
            client_ip=client_ip,
            user_agent=user_agent,
            session_config=session_config or {}
        )

        self.db.add(session)
        await self.db.commit()
        await self.db.refresh(session)
        return session

    async def get_session_by_uuid(self, session_uuid: str) -> Optional[AgentSession]:
        """Get session by UUID"""
        query = select(AgentSession).options(
            selectinload(AgentSession.agent)
        ).where(AgentSession.session_uuid == session_uuid)

        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def update_session_status(
        self,
        session_uuid: str,
        status: str,
        ended_at: Optional[datetime] = None,
        error_message: Optional[str] = None
    ) -> Optional[AgentSession]:
        """Update session status"""
        session = await self.get_session_by_uuid(session_uuid)
        if not session:
            return None

        session.status = status
        if ended_at:
            session.ended_at = ended_at
            session.calculate_duration()

        if error_message:
            session.error_count += 1
            session.last_error = error_message
            session.last_error_at = datetime.utcnow()

        await self.db.commit()
        await self.db.refresh(session)
        return session

    async def get_active_sessions_by_agent(self, agent_id: uuid.UUID) -> List[AgentSession]:
        """Get active sessions for an agent"""
        query = select(AgentSession).where(
            and_(
                AgentSession.agent_id == agent_id,
                AgentSession.status.in_(["starting", "running", "paused"])
            )
        ).order_by(AgentSession.started_at.desc())

        result = await self.db.execute(query)
        return result.scalars().all()

    # Statistics and analytics
    async def get_agent_stats(self, agent_id: uuid.UUID) -> Dict[str, Any]:
        """Get agent usage statistics"""
        agent = await self.get_agent_by_id(agent_id)
        if not agent:
            return {}

        # Get session statistics
        sessions_query = select(AgentSession).where(AgentSession.agent_id == agent_id)
        sessions_result = await self.db.execute(sessions_query)
        sessions = sessions_result.scalars().all()

        total_sessions = len(sessions)
        active_sessions = len([s for s in sessions if s.is_active])
        total_duration = sum(s.duration_seconds for s in sessions if s.duration_seconds)

        return {
            "total_sessions": total_sessions,
            "active_sessions": active_sessions,
            "total_duration_seconds": total_duration,
            "total_duration_minutes": total_duration // 60,
            "total_messages": agent.total_conversations,
            "average_session_duration": total_duration / total_sessions if total_sessions > 0 else 0
        }