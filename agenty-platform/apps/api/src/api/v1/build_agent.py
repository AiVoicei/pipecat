"""
Build with Agenty - AI-powered agent creation API endpoint.

This endpoint uses Claude AI to help users create voice agents through
natural language conversation.
"""

from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import Optional
import json
import asyncio
import time
from datetime import datetime
import logging

from services.claude_service import claude_builder
from services.conversation_state import conversation_manager
from services.document_parser import document_parser
from services.database_service import create_agent
from models.agent import Agent

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/build-agent")
async def build_agent_endpoint(
    action: str = Form(...),
    requirements: Optional[str] = Form(None),
    message: Optional[str] = Form(None),
    messages: Optional[str] = Form(None),
    conversationId: Optional[str] = Form(None),
    knowledgeBase: Optional[UploadFile] = File(None)
):
    """
    Main endpoint for AI-powered agent creation.

    Actions:
    - start: Initialize agent creation with user requirements
    - clarify: Continue conversation with user's answer
    - generate: Generate final agent with all gathered information

    Args:
        action: The action to perform (start, clarify, generate)
        requirements: JSON string of agent requirements (for start/generate)
        message: User's message (for clarify)
        messages: JSON array of conversation messages (for clarify/generate)
        conversationId: UUID of ongoing conversation (for clarify/generate)
        knowledgeBase: Optional uploaded document file (for generate)

    Returns:
        JSON response with next steps or completed agent
    """
    logger.info("Build agent endpoint called with action: %s", action)

    try:
        if action == "start":
            return await handle_start(requirements)
        elif action == "clarify":
            return await handle_clarify(message, messages, conversationId)
        elif action == "generate":
            return await handle_generate(requirements, messages, conversationId, knowledgeBase)
        else:
            raise HTTPException(status_code=400, detail=f"Invalid action: {action}")
    except Exception as e:
        logger.error("Error in build_agent_endpoint: %s", str(e), exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


async def handle_start(requirements_str: str) -> dict:
    """
    Handle initial agent creation request.

    Args:
        requirements_str: JSON string containing agent requirements

    Returns:
        Dict with needsClarification, questions, and conversationId
    """
    try:
        requirements = json.loads(requirements_str)
        logger.info("Starting agent creation: %s", requirements.get("name", "Unnamed"))

        # Validate requirements
        if not requirements.get("description"):
            raise HTTPException(
                status_code=400,
                detail="Description is required"
            )

        # Use Claude to analyze and ask clarification questions
        result = await claude_builder.start_agent_creation(
            description=requirements["description"],
            name=requirements.get("name"),
            language=requirements.get("language"),
            has_knowledge_base=requirements.get("hasKnowledgeBase", False)
        )

        if result["needsClarification"]:
            # Create conversation state
            conversation_id = conversation_manager.create_conversation(
                requirements=requirements,
                messages=[
                    {"role": "user", "content": requirements["description"]},
                    {"role": "assistant", "content": result["questions"]}
                ]
            )

            logger.info("Created conversation %s, needs clarification", conversation_id)
            return {
                "needsClarification": True,
                "questions": result["questions"],
                "conversationId": conversation_id
            }
        else:
            # Proceed directly to generation (rare case)
            conversation_id = conversation_manager.create_conversation(
                requirements=requirements,
                messages=[
                    {"role": "user", "content": requirements["description"]}
                ]
            )

            logger.info("Created conversation %s, no clarification needed", conversation_id)
            return {
                "needsClarification": False,
                "conversationId": conversation_id
            }

    except json.JSONDecodeError as e:
        logger.error("Invalid JSON in requirements: %s", str(e))
        raise HTTPException(status_code=400, detail="Invalid requirements format")
    except Exception as e:
        logger.error("Error in handle_start: %s", str(e))
        raise


async def handle_clarify(
    message: str,
    messages_str: str,
    conversation_id: Optional[str]
) -> dict:
    """
    Handle clarification conversation.

    Args:
        message: User's response to questions
        messages_str: JSON array of conversation history
        conversation_id: UUID of conversation

    Returns:
        Dict with needsMoreInfo, questions (if needed), and conversationId
    """
    try:
        if not message:
            raise HTTPException(status_code=400, detail="Message is required")

        messages = json.loads(messages_str) if messages_str else []
        logger.info("Clarifying conversation %s with %d messages",
                   conversation_id, len(messages))

        # Continue conversation with Claude
        result = await claude_builder.continue_conversation(
            messages=messages,
            user_message=message
        )

        if result["needsClarification"]:
            # More clarification needed
            messages.append({"role": "user", "content": message})
            messages.append({"role": "assistant", "content": result["questions"]})

            if conversation_id:
                conversation_manager.update_conversation(conversation_id, messages)

            logger.info("Conversation %s needs more clarification", conversation_id)
            return {
                "needsMoreInfo": True,
                "questions": result["questions"],
                "conversationId": conversation_id
            }
        else:
            # Ready for generation
            messages.append({"role": "user", "content": message})

            if conversation_id:
                conversation_manager.update_conversation(conversation_id, messages)

            logger.info("Conversation %s ready for generation", conversation_id)
            return {
                "needsMoreInfo": False,
                "conversationId": conversation_id
            }

    except json.JSONDecodeError as e:
        logger.error("Invalid JSON in messages: %s", str(e))
        raise HTTPException(status_code=400, detail="Invalid messages format")
    except Exception as e:
        logger.error("Error in handle_clarify: %s", str(e))
        raise


async def handle_generate(
    requirements_str: str,
    messages_str: str,
    conversation_id: Optional[str],
    knowledge_base_file: Optional[UploadFile]
) -> dict:
    """
    Generate final agent.

    Args:
        requirements_str: JSON string of agent requirements
        messages_str: JSON array of conversation history
        conversation_id: UUID of conversation
        knowledge_base_file: Optional uploaded document

    Returns:
        Dict with success, agentId, and agent data
    """
    start_time = time.time()

    try:
        requirements = json.loads(requirements_str)
        messages = json.loads(messages_str) if messages_str else []

        logger.info("Generating agent for conversation %s", conversation_id)

        # Parse knowledge base if provided
        knowledge_base_content = None
        if knowledge_base_file:
            logger.info("Processing knowledge base: %s", knowledge_base_file.filename)

            # Validate file
            if not document_parser.validate_file_type(knowledge_base_file.filename):
                raise HTTPException(
                    status_code=400,
                    detail="Invalid file type. Supported: PDF, TXT, DOC, DOCX, MD"
                )

            file_content = await knowledge_base_file.read()

            # Validate size (10MB max)
            if not document_parser.validate_file_size(len(file_content)):
                raise HTTPException(
                    status_code=400,
                    detail="File too large. Maximum size: 10MB"
                )

            try:
                knowledge_base_content = await document_parser.parse_document(
                    file_content,
                    knowledge_base_file.filename
                )
                logger.info("Successfully parsed knowledge base: %d chars",
                           len(knowledge_base_content))
            except ValueError as e:
                logger.error("Failed to parse knowledge base: %s", str(e))
                raise HTTPException(status_code=400, detail=str(e))

        # Generate agent with Claude
        generation_result = await claude_builder.generate_agent(
            messages=messages,
            knowledge_base_content=knowledge_base_content
        )

        # Create agent in database
        agent_data = {
            "name": requirements.get("name") or "AI Generated Agent",
            "description": requirements.get("description", "Agent created with Claude AI"),
            "systemPrompt": generation_result["systemMessage"],
            "language": requirements.get("language", "English"),
            "configuration": {
                "stt": {
                    "provider": generation_result["recommendedProviders"]["stt"],
                    "needsApiKey": True
                },
                "llm": {
                    "provider": generation_result["recommendedProviders"]["llm"],
                    "needsApiKey": True
                },
                "tts": {
                    "provider": generation_result["recommendedProviders"]["tts"],
                    "needsApiKey": True
                }
            },
            "knowledgeBase": knowledge_base_content,
            "metadata": {
                "createdBy": "claude-ai",
                "createdWith": "build-with-agenty",
                "providerReasoning": generation_result.get("reasoning"),
                "timestamp": datetime.now().isoformat()
            },
            "userId": "user_1"  # TODO: Get from auth context
        }

        agent = await create_agent(agent_data)
        logger.info("Created agent %s successfully", agent.id)

        # Ensure minimum 10 seconds elapsed (for good UX)
        elapsed = time.time() - start_time
        if elapsed < 10:
            logger.debug("Waiting %.2f seconds to reach minimum duration", 10 - elapsed)
            await asyncio.sleep(10 - elapsed)

        # Cleanup conversation state
        if conversation_id:
            conversation_manager.delete_conversation(conversation_id)
            logger.info("Cleaned up conversation %s", conversation_id)

        return {
            "success": True,
            "agentId": agent.id,
            "agent": {
                "id": agent.id,
                "name": agent.name,
                "description": agent.description,
                "systemPrompt": agent.system_prompt,
                "language": agent.language,
                "configuration": agent.configuration,
                "providers": generation_result["recommendedProviders"],
                "reasoning": generation_result.get("reasoning")
            }
        }

    except json.JSONDecodeError as e:
        logger.error("Invalid JSON: %s", str(e))
        raise HTTPException(status_code=400, detail="Invalid JSON format")
    except Exception as e:
        logger.error("Error in handle_generate: %s", str(e), exc_info=True)
        raise


@router.get("/build-agent/stats")
async def get_conversation_stats():
    """
    Get statistics about active conversations.

    Returns:
        Dict with conversation statistics
    """
    stats = conversation_manager.get_stats()
    logger.info("Conversation stats: %s", stats)
    return stats


@router.post("/build-agent/cleanup")
async def cleanup_conversations():
    """
    Manually trigger cleanup of expired conversations.

    Returns:
        Dict with number of conversations removed
    """
    removed = conversation_manager.cleanup_expired()
    logger.info("Cleaned up %d expired conversations", removed)
    return {"removed": removed}
