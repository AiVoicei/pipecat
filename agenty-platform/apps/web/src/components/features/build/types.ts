export interface BuildStep {
  id: string
  title: string
  description?: string
  completed: boolean
}

export interface AgentRequirements {
  description: string
  name?: string
  language?: string
  gender?: 'male' | 'female'
  knowledgeBase?: File
}

export interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp?: number
}

export type AnimationState =
  | 'idle'
  | 'listening'
  | 'thinking'
  | 'speaking'
  | 'celebrating'

export type BuildFlowStep =
  | 'welcome'
  | 'description'
  | 'name'
  | 'language'
  | 'gender'
  | 'knowledge'
  | 'clarification'
  | 'generating'
  | 'complete'

export interface GenerationPhase {
  id: number
  label: string
  progress: number
  description: string
}
