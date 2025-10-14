"""
Claude AI service for intelligent agent generation.

This service uses Claude 3.5 Sonnet to:
1. Analyze user requirements for voice AI agents
2. Ask clarifying questions to understand needs
3. Generate professional system messages
4. Recommend appropriate AI providers
"""

import anthropic
import os
from typing import List, Dict, Optional
import json
import logging

logger = logging.getLogger(__name__)


class ClaudeAgentBuilder:
    """Service for building agents with Claude AI"""

    def __init__(self):
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            raise ValueError("ANTHROPIC_API_KEY environment variable is required")

        self.client = anthropic.Anthropic(api_key=api_key)
        self.model = "claude-3-5-sonnet-20241022"
        logger.info("ClaudeAgentBuilder initialized with model: %s", self.model)

    async def start_agent_creation(
        self,
        description: str,
        name: Optional[str] = None,
        language: Optional[str] = None,
        has_knowledge_base: bool = False
    ) -> Dict:
        """
        Start the agent creation process.
        Returns clarification questions if needed.

        Args:
            description: User's agent description
            name: Optional agent name
            language: Optional language preference
            has_knowledge_base: Whether user will provide a knowledge base

        Returns:
            Dict with needsClarification, questions (if needed), conversationId
        """
        logger.info("Starting agent creation for: %s", name or "Unnamed Agent")

        system_prompt = self._build_system_prompt()
        user_message = self._format_initial_request(
            description, name, language, has_knowledge_base
        )

        try:
            response = self.client.messages.create(
                model=self.model,
                max_tokens=2000,
                system=system_prompt,
                messages=[{"role": "user", "content": user_message}]
            )

            content = response.content[0].text
            logger.debug("Claude response: %s", content[:200])

            # Parse Claude's response
            return self._parse_clarification_response(content)
        except Exception as e:
            logger.error("Error in start_agent_creation: %s", str(e))
            raise

    def _build_system_prompt(self) -> str:
        """Build the system prompt for Claude"""
        return """You are an expert AI agent designer helping users create voice AI agents using the Pipecat framework.

Your role:
1. Analyze user requirements for a voice AI agent
2. Ask 2-3 clarifying questions to understand their needs better
3. Generate a professional system message/prompt for the agent
4. Recommend appropriate AI providers (STT, LLM, TTS)

Important guidelines:
- Ask specific, relevant questions about agent personality, use cases, and target audience
- Focus on understanding the agent's purpose, tone, and context
- Keep questions clear and concise
- After clarification, generate a complete, production-ready system message
- Recommend providers based on requirements (language support, features, cost-effectiveness)
- If a knowledge base is provided, incorporate it into the system message with clear instructions for the agent to use that information

Available providers:
- STT: deepgram, assemblyai, azure, google, whisper, speechmatics
- LLM: openai, anthropic, google, azure, groq, together, cerebras, deepseek
- TTS: elevenlabs, cartesia, azure, google, deepgram, playht, lmnt

Response format for clarification (MUST be valid JSON):
{
  "needsClarification": true,
  "questions": "Your questions here as a friendly message"
}

Response format after clarification (MUST be valid JSON):
{
  "needsClarification": false,
  "systemMessage": "Complete system message for the agent",
  "recommendedProviders": {
    "stt": "provider-name",
    "llm": "provider-name",
    "tts": "provider-name"
  },
  "reasoning": "Brief explanation of provider choices"
}

Always respond with valid JSON. Be friendly and helpful."""

    def _format_initial_request(
        self,
        description: str,
        name: Optional[str],
        language: Optional[str],
        has_knowledge_base: bool
    ) -> str:
        """Format the user's requirements into a prompt"""

        message = f"I want to create a voice AI agent with the following description:\n\n{description}"

        if name:
            message += f"\n\nAgent name: {name}"

        if language:
            message += f"\nLanguage: {language}"

        if has_knowledge_base:
            message += "\n\nI will provide a knowledge base document for the agent."

        message += "\n\nPlease ask me any clarifying questions you need to create the perfect agent, or if the description is clear enough, proceed to generate the system message and provider recommendations."

        return message

    async def continue_conversation(
        self,
        messages: List[Dict],
        user_message: str
    ) -> Dict:
        """
        Continue the conversation with user's answer.

        Args:
            messages: Conversation history
            user_message: User's latest response

        Returns:
            Dict with needsClarification or generation result
        """
        logger.info("Continuing conversation with user response")

        conversation = [
            {"role": msg["role"], "content": msg["content"]}
            for msg in messages
        ]
        conversation.append({"role": "user", "content": user_message})

        try:
            response = self.client.messages.create(
                model=self.model,
                max_tokens=2000,
                system=self._build_system_prompt(),
                messages=conversation
            )

            content = response.content[0].text
            logger.debug("Claude response: %s", content[:200])

            return self._parse_clarification_response(content)
        except Exception as e:
            logger.error("Error in continue_conversation: %s", str(e))
            raise

    async def generate_agent(
        self,
        messages: List[Dict],
        knowledge_base_content: Optional[str] = None
    ) -> Dict:
        """
        Generate final agent configuration.
        This is called when no more clarification is needed.

        Args:
            messages: Conversation history
            knowledge_base_content: Optional parsed document content

        Returns:
            Dict with systemMessage and recommendedProviders
        """
        logger.info("Generating final agent configuration")

        # Add knowledge base context if provided
        if knowledge_base_content:
            # Use up to 20,000 characters for better context (Claude can handle it)
            max_kb_chars = 20000
            kb_excerpt = knowledge_base_content[:max_kb_chars]
            truncated_note = f"\n\n[Note: Content truncated from {len(knowledge_base_content)} to {max_kb_chars} characters]" if len(knowledge_base_content) > max_kb_chars else ""

            messages.append({
                "role": "user",
                "content": f"""Here is the knowledge base document that the agent should use to answer questions:

--- KNOWLEDGE BASE START ---
{kb_excerpt}
--- KNOWLEDGE BASE END ---
{truncated_note}

Please incorporate this knowledge base into the agent's system message. The agent should:
1. Use this information to answer user questions accurately
2. Refer to specific details from the knowledge base when relevant
3. Admit when a question is outside the scope of the provided knowledge base"""
            })

        # Request final generation
        messages.append({
            "role": "user",
            "content": "Great! Now please generate the complete system message and recommend providers. Remember to respond with valid JSON."
        })

        try:
            response = self.client.messages.create(
                model=self.model,
                max_tokens=4000,
                system=self._build_system_prompt(),
                messages=messages
            )

            content = response.content[0].text
            logger.debug("Claude generation response: %s", content[:200])

            result = self._parse_generation_response(content)
            logger.info("Agent generated successfully with providers: %s",
                       result.get("recommendedProviders"))
            return result
        except Exception as e:
            logger.error("Error in generate_agent: %s", str(e))
            raise

    def _parse_clarification_response(self, content: str) -> Dict:
        """Parse Claude's response for clarification"""
        try:
            # Try to extract JSON from response
            json_start = content.find('{')
            json_end = content.rfind('}') + 1

            if json_start >= 0 and json_end > json_start:
                json_str = content[json_start:json_end]
                parsed = json.loads(json_str)
                logger.debug("Parsed JSON response: %s", parsed)
                return parsed
            else:
                # If no JSON, treat as clarification question
                logger.warning("No JSON found in response, treating as clarification")
                return {
                    "needsClarification": True,
                    "questions": content
                }
        except json.JSONDecodeError as e:
            logger.warning("Failed to parse JSON: %s. Treating as clarification", str(e))
            return {
                "needsClarification": True,
                "questions": content
            }
        except Exception as e:
            logger.error("Unexpected error parsing response: %s", str(e))
            return {
                "needsClarification": True,
                "questions": content
            }

    def _parse_generation_response(self, content: str) -> Dict:
        """Parse Claude's final generation response"""
        try:
            json_start = content.find('{')
            json_end = content.rfind('}') + 1

            if json_start < 0 or json_end <= json_start:
                raise ValueError("No JSON found in response")

            json_str = content[json_start:json_end]
            parsed = json.loads(json_str)

            # Validate required fields
            if "systemMessage" not in parsed:
                raise ValueError("systemMessage missing from response")
            if "recommendedProviders" not in parsed:
                raise ValueError("recommendedProviders missing from response")

            logger.info("Successfully parsed generation response")
            return parsed
        except Exception as e:
            logger.error("Failed to parse generation response: %s", str(e))
            raise ValueError(f"Failed to parse generation response: {e}")


# Global instance
claude_builder = ClaudeAgentBuilder()
