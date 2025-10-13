import { AiVoiceiInterface } from '@/components/features/agents/AiVoiceiInterface'

/**
 * Quick Test Page
 *
 * This page provides a quick way to test voice AI using Gemini Live model.
 * Accessed from the Dashboard quick actions.
 * Always uses the Gemini Multimodal Live backend (aivoicei_web_server.py)
 */
export default function QuickTestPage() {
  // Pass special "quick-test" agentId to use Gemini Live configuration
  return <AiVoiceiInterface agentId="quick-test" isQuickTest={true} />
}
