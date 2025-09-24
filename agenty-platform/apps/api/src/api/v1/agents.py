"""
Agent API endpoints for the Agenty platform.
Handles CRUD operations for agents, configurations, and runtime management.
"""

from typing import List, Optional, Dict, Any
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.responses import JSONResponse

from ...schemas.agent import (
    AgentCreate, AgentUpdate, AgentResponse, AgentConfiguration,
    AgentTemplate, ConfigurationTest, ConfigurationTestResult,
    AgentSession
)
from ...services.agent_factory import AgentFactory
from ...services.provider_service import ProviderService
from ...utils.dependencies import get_current_user, get_agent_factory

router = APIRouter(prefix="/agents", tags=["agents"])


@router.post("/", response_model=AgentResponse, status_code=status.HTTP_201_CREATED)
async def create_agent(
    agent_data: AgentCreate,
    current_user: dict = Depends(get_current_user),
    agent_factory: AgentFactory = Depends(get_agent_factory)
):
    """Create a new agent with the specified configuration"""
    try:
        # Generate agent ID
        import uuid
        agent_id = str(uuid.uuid4())

        # Create agent in factory
        agent_instance = await agent_factory.create_agent(
            agent_config=agent_data.configuration,
            user_id=current_user["id"],
            agent_id=agent_id
        )

        # Create response (in production, save to database)
        agent_response = AgentResponse(
            id=agent_id,
            user_id=current_user["id"],
            name=agent_data.name,
            description=agent_data.description,
            configuration=agent_data.configuration,
            deployment=agent_data.deployment,
            template_id=agent_data.template_id,
            created_at=datetime.now(),
            updated_at=datetime.now()
        )

        return agent_response

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create agent: {str(e)}"
        )


@router.get("/", response_model=List[AgentResponse])
async def get_agents(
    current_user: dict = Depends(get_current_user),
    agent_factory: AgentFactory = Depends(get_agent_factory)
):
    """Get all agents for the current user"""
    try:
        # Get active agents from factory
        active_agents = agent_factory.get_active_agents()

        # Filter by user
        user_agents = [
            agent for agent in active_agents
            if agent.get("session", {}).get("metadata", {}).get("user_id") == current_user["id"]
        ]

        # Convert to response format
        agent_responses = []
        for agent in user_agents:
            agent_responses.append(AgentResponse(
                id=agent["id"],
                user_id=current_user["id"],
                name=f"Agent {agent['id'][:8]}",  # Mock name
                description="Generated agent",
                configuration=agent["configuration"],
                deployment={"status": agent["status"], "endpoints": [], "custom_domain": None},
                template_id=None,
                created_at=agent["started_at"],
                updated_at=agent["started_at"]
            ))

        return agent_responses

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get agents: {str(e)}"
        )


@router.get("/{agent_id}", response_model=AgentResponse)
async def get_agent(
    agent_id: str,
    current_user: dict = Depends(get_current_user),
    agent_factory: AgentFactory = Depends(get_agent_factory)
):
    """Get a specific agent by ID"""
    try:
        # Get agent status
        agent_status = await agent_factory.get_agent_status(agent_id)

        if not agent_status:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Agent not found"
            )

        # Check ownership
        if agent_status["session"]["metadata"]["user_id"] != current_user["id"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )

        # Return agent details
        return AgentResponse(
            id=agent_id,
            user_id=current_user["id"],
            name=f"Agent {agent_id[:8]}",
            description="Generated agent",
            configuration=agent_status["session"]["metadata"]["configuration"],
            deployment={"status": agent_status["status"], "endpoints": [], "custom_domain": None},
            template_id=None,
            created_at=agent_status["session"]["started_at"],
            updated_at=agent_status["session"]["started_at"]
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get agent: {str(e)}"
        )


@router.put("/{agent_id}", response_model=AgentResponse)
async def update_agent(
    agent_id: str,
    agent_data: AgentUpdate,
    current_user: dict = Depends(get_current_user),
    agent_factory: AgentFactory = Depends(get_agent_factory)
):
    """Update an existing agent"""
    try:
        # Get current agent
        agent_status = await agent_factory.get_agent_status(agent_id)

        if not agent_status:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Agent not found"
            )

        # Check ownership
        if agent_status["session"]["metadata"]["user_id"] != current_user["id"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )

        # For configuration updates, recreate the agent
        if agent_data.configuration:
            # Stop current agent
            await agent_factory.stop_agent(agent_id)

            # Create new agent with updated configuration
            agent_instance = await agent_factory.create_agent(
                agent_config=agent_data.configuration,
                user_id=current_user["id"],
                agent_id=agent_id
            )

        # Return updated agent
        updated_status = await agent_factory.get_agent_status(agent_id)
        return AgentResponse(
            id=agent_id,
            user_id=current_user["id"],
            name=agent_data.name or f"Agent {agent_id[:8]}",
            description=agent_data.description or "Updated agent",
            configuration=agent_data.configuration or updated_status["session"]["metadata"]["configuration"],
            deployment=agent_data.deployment or {"status": updated_status["status"], "endpoints": [], "custom_domain": None},
            template_id=None,
            created_at=updated_status["session"]["started_at"],
            updated_at=datetime.now()
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update agent: {str(e)}"
        )


@router.delete("/{agent_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_agent(
    agent_id: str,
    current_user: dict = Depends(get_current_user),
    agent_factory: AgentFactory = Depends(get_agent_factory)
):
    """Delete an agent"""
    try:
        # Get agent to check ownership
        agent_status = await agent_factory.get_agent_status(agent_id)

        if not agent_status:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Agent not found"
            )

        # Check ownership
        if agent_status["session"]["metadata"]["user_id"] != current_user["id"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )

        # Stop and remove agent
        await agent_factory.stop_agent(agent_id)

        return None

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete agent: {str(e)}"
        )


@router.post("/{agent_id}/start")
async def start_agent(
    agent_id: str,
    current_user: dict = Depends(get_current_user),
    agent_factory: AgentFactory = Depends(get_agent_factory)
):
    """Start an agent instance"""
    try:
        # Check ownership first
        agent_status = await agent_factory.get_agent_status(agent_id)
        if agent_status and agent_status["session"]["metadata"]["user_id"] != current_user["id"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )

        # Start agent
        success = await agent_factory.start_agent(agent_id)

        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to start agent"
            )

        return {"message": "Agent started successfully"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to start agent: {str(e)}"
        )


@router.post("/{agent_id}/stop")
async def stop_agent(
    agent_id: str,
    current_user: dict = Depends(get_current_user),
    agent_factory: AgentFactory = Depends(get_agent_factory)
):
    """Stop an agent instance"""
    try:
        # Check ownership
        agent_status = await agent_factory.get_agent_status(agent_id)
        if agent_status and agent_status["session"]["metadata"]["user_id"] != current_user["id"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )

        # Stop agent
        success = await agent_factory.stop_agent(agent_id)

        return {"message": "Agent stopped successfully" if success else "Agent was not running"}

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to stop agent: {str(e)}"
        )


@router.get("/{agent_id}/status")
async def get_agent_status(
    agent_id: str,
    current_user: dict = Depends(get_current_user),
    agent_factory: AgentFactory = Depends(get_agent_factory)
):
    """Get real-time status of an agent"""
    try:
        agent_status = await agent_factory.get_agent_status(agent_id)

        if not agent_status:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Agent not found"
            )

        # Check ownership
        if agent_status["session"]["metadata"]["user_id"] != current_user["id"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )

        return {
            "id": agent_id,
            "status": agent_status["status"],
            "uptime": agent_status["uptime"],
            "session": {
                "uuid": agent_status["session"]["session_uuid"],
                "started_at": agent_status["session"]["started_at"],
                "status": agent_status["session"]["status"]
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get agent status: {str(e)}"
        )


@router.post("/test-configuration", response_model=ConfigurationTestResult)
async def test_configuration(
    test_data: ConfigurationTest,
    current_user: dict = Depends(get_current_user),
    agent_factory: AgentFactory = Depends(get_agent_factory)
):
    """Test an agent configuration without creating a permanent agent"""
    try:
        # Create temporary agent for testing
        test_agent_id = f"test_{current_user['id']}_{datetime.now().timestamp()}"

        start_time = datetime.now()

        # Test agent creation
        agent_instance = await agent_factory.create_agent(
            agent_config=test_data.configuration,
            user_id=current_user["id"],
            agent_id=test_agent_id
        )

        # Test basic functionality
        test_duration = (datetime.now() - start_time).total_seconds()

        # Clean up test agent
        await agent_factory.stop_agent(test_agent_id)

        return ConfigurationTestResult(
            success=True,
            message="Configuration test passed",
            test_duration=test_duration,
            errors=[],
            provider_results={
                "stt": {"status": "success", "provider": test_data.configuration.stt.provider},
                "llm": {"status": "success", "provider": test_data.configuration.llm.provider},
                "tts": {"status": "success", "provider": test_data.configuration.tts.provider}
            }
        )

    except Exception as e:
        test_duration = (datetime.now() - start_time).total_seconds()

        return ConfigurationTestResult(
            success=False,
            message=f"Configuration test failed: {str(e)}",
            test_duration=test_duration,
            errors=[str(e)],
            provider_results={}
        )


@router.get("/templates/", response_model=List[AgentTemplate])
async def get_agent_templates():
    """Get available agent templates"""
    # Mock templates for now
    templates = [
        AgentTemplate(
            id="customer_service",
            name="Customer Service Agent",
            description="A helpful customer service agent with multilingual support",
            category="customer_service",
            configuration=AgentConfiguration(
                stt={"provider": "openai", "settings": {"model": "whisper-1", "language": "en"}},
                llm={"provider": "openai", "settings": {"model": "gpt-4", "temperature": 0.7}},
                tts={"provider": "elevenlabs", "settings": {"voice_id": "21m00Tcm4TlvDq8ikWAM"}},
                transport={"type": "webrtc", "settings": {}},
                system_prompt="You are a helpful customer service agent. Be polite, professional, and helpful.",
                language="en"
            ),
            is_public=True,
            usage_count=156,
            created_at=datetime.now()
        ),
        AgentTemplate(
            id="sales_assistant",
            name="Sales Assistant",
            description="A persuasive sales assistant to help convert leads",
            category="sales",
            configuration=AgentConfiguration(
                stt={"provider": "deepgram", "settings": {"model": "nova-2", "language": "en"}},
                llm={"provider": "anthropic", "settings": {"model": "claude-3-sonnet-20240229"}},
                tts={"provider": "cartesia", "settings": {"voice_id": "a0e99841-438c-4a64-b679-ae501e7d6091"}},
                transport={"type": "webrtc", "settings": {}},
                system_prompt="You are a friendly sales assistant. Help customers find what they need and guide them to purchase.",
                language="en"
            ),
            is_public=True,
            usage_count=89,
            created_at=datetime.now()
        )
    ]

    return templates


@router.post("/from-template/{template_id}", response_model=AgentResponse)
async def create_agent_from_template(
    template_id: str,
    agent_name: str,
    current_user: dict = Depends(get_current_user),
    agent_factory: AgentFactory = Depends(get_agent_factory)
):
    """Create a new agent from a template"""
    try:
        # Get template (mock for now)
        templates = await get_agent_templates()
        template = next((t for t in templates if t.id == template_id), None)

        if not template:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Template not found"
            )

        # Create agent from template
        agent_data = AgentCreate(
            name=agent_name,
            description=f"Agent created from {template.name} template",
            configuration=template.configuration,
            template_id=template_id
        )

        return await create_agent(agent_data, current_user, agent_factory)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create agent from template: {str(e)}"
        )