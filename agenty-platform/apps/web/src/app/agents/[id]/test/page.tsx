import { AiVoiceiInterface } from '@/components/features/agents/AiVoiceiInterface'

interface AgentTestPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function AgentTestPage({ params }: AgentTestPageProps) {
  const { id } = await params

  return <AiVoiceiInterface agentId={id} />
}