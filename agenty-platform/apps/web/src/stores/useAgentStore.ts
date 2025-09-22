import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

// Types from our mock data structure
export interface Agent {
  id: string
  userId: string
  name: string
  description: string
  status: 'active' | 'inactive' | 'draft'
  templateId?: string
  configuration: {
    stt: {
      provider: string
      model: string
      language: string
    }
    llm: {
      provider: string
      model: string
      systemPrompt: string
      temperature: number
      maxTokens: number
    }
    tts: {
      provider: string
      voice: string
      [key: string]: unknown
    }
  }
  deploymentConfig: {
    type: 'webrtc' | 'phone' | 'whatsapp' | 'api'
    [key: string]: unknown
  }
  analytics: {
    totalConversations: number
    averageResponseTime: number
    satisfactionScore: number
    activeToday: number
  }
  createdAt: string
  updatedAt: string
}

interface AgentStore {
  // State
  agents: Agent[]
  selectedAgent: Agent | null
  isLoading: boolean
  error: string | null

  // Actions
  setAgents: (agents: Agent[]) => void
  addAgent: (agent: Agent) => void
  updateAgent: (id: string, updates: Partial<Agent>) => void
  deleteAgent: (id: string) => void
  setSelectedAgent: (agent: Agent | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void

  // Computed
  getActiveAgents: () => Agent[]
  getAgentsByStatus: (status: Agent['status']) => Agent[]
  getTotalConversations: () => number
}

// Sample agent data for testing
const sampleAgents: Agent[] = [
  {
    id: 'agt_1',
    userId: 'user_1',
    name: 'Customer Support Assistant',
    description: 'AI assistant specialized in customer support and product inquiries',
    status: 'active',
    templateId: 'customer-support',
    configuration: {
      stt: {
        provider: 'OpenAI',
        model: 'whisper-1',
        language: 'en-US'
      },
      llm: {
        provider: 'OpenAI',
        model: 'gpt-4o',
        systemPrompt: 'You are a helpful customer support assistant.',
        temperature: 0.7,
        maxTokens: 1000
      },
      tts: {
        provider: 'OpenAI',
        voice: 'alloy'
      }
    },
    deploymentConfig: {
      type: 'webrtc'
    },
    analytics: {
      totalConversations: 1247,
      averageResponseTime: 850,
      satisfactionScore: 4.2,
      activeToday: 23
    },
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-20T15:30:00Z'
  }
]

export const useAgentStore = create<AgentStore>()(
  devtools(
    (set, get) => ({
      // Initial state with sample data
      agents: sampleAgents,
      selectedAgent: null,
      isLoading: false,
      error: null,

      // Actions
      setAgents: (agents) => set({ agents }),

      addAgent: (agent) => set((state) => ({
        agents: [...state.agents, agent]
      })),

      updateAgent: (id, updates) => set((state) => ({
        agents: state.agents.map(agent =>
          agent.id === id ? { ...agent, ...updates } : agent
        )
      })),

      deleteAgent: (id) => set((state) => ({
        agents: state.agents.filter(agent => agent.id !== id)
      })),

      setSelectedAgent: (agent) => set({ selectedAgent: agent }),
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),

      // Computed values
      getActiveAgents: () => get().agents.filter(agent => agent.status === 'active'),

      getAgentsByStatus: (status) => get().agents.filter(agent => agent.status === status),

      getTotalConversations: () => get().agents.reduce(
        (total, agent) => total + agent.analytics.totalConversations, 0
      ),
    }),
    {
      name: 'agent-store',
    }
  )
)