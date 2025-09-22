import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { apiService, Agent, CreateAgentRequest, UpdateAgentRequest } from '@/services/api'

interface AgentStore {
  // State
  agents: Agent[]
  selectedAgent: Agent | null
  isLoading: boolean
  error: string | null

  // Actions
  fetchAgents: () => Promise<void>
  createAgent: (request: CreateAgentRequest) => Promise<Agent>
  updateAgent: (id: string, updates: UpdateAgentRequest) => Promise<Agent>
  deleteAgent: (id: string) => Promise<void>
  duplicateAgent: (id: string) => Promise<Agent>
  deployAgent: (id: string) => Promise<void>
  stopAgent: (id: string) => Promise<void>
  setSelectedAgent: (agent: Agent | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void

  // Computed
  getActiveAgents: () => Agent[]
  getAgentsByStatus: (status: Agent['status']) => Agent[]
  getTotalConversations: () => number
}

export const useAgentStore = create<AgentStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      agents: [],
      selectedAgent: null,
      isLoading: false,
      error: null,

      // API Actions
      fetchAgents: async () => {
        try {
          set({ isLoading: true, error: null })
          const agents = await apiService.listAgents()
          set({ agents, isLoading: false })
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch agents',
            isLoading: false
          })
        }
      },

      createAgent: async (request: CreateAgentRequest) => {
        try {
          set({ isLoading: true, error: null })
          const newAgent = await apiService.createAgent(request)
          set((state) => ({
            agents: [...state.agents, newAgent],
            isLoading: false
          }))
          return newAgent
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to create agent',
            isLoading: false
          })
          throw error
        }
      },

      updateAgent: async (id: string, updates: UpdateAgentRequest) => {
        try {
          set({ isLoading: true, error: null })
          const updatedAgent = await apiService.updateAgent(id, updates)
          set((state) => ({
            agents: state.agents.map(agent =>
              agent.id === id ? updatedAgent : agent
            ),
            selectedAgent: state.selectedAgent?.id === id ? updatedAgent : state.selectedAgent,
            isLoading: false
          }))
          return updatedAgent
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to update agent',
            isLoading: false
          })
          throw error
        }
      },

      deleteAgent: async (id: string) => {
        try {
          set({ isLoading: true, error: null })
          await apiService.deleteAgent(id)
          set((state) => ({
            agents: state.agents.filter(agent => agent.id !== id),
            selectedAgent: state.selectedAgent?.id === id ? null : state.selectedAgent,
            isLoading: false
          }))
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to delete agent',
            isLoading: false
          })
          throw error
        }
      },

      duplicateAgent: async (id: string) => {
        try {
          set({ isLoading: true, error: null })
          const duplicatedAgent = await apiService.duplicateAgent(id)
          set((state) => ({
            agents: [...state.agents, duplicatedAgent],
            isLoading: false
          }))
          return duplicatedAgent
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to duplicate agent',
            isLoading: false
          })
          throw error
        }
      },

      deployAgent: async (id: string) => {
        try {
          set({ isLoading: true, error: null })
          await apiService.deployAgent(id)
          set((state) => ({
            agents: state.agents.map(agent =>
              agent.id === id ? { ...agent, status: 'active' as const } : agent
            ),
            selectedAgent: state.selectedAgent?.id === id
              ? { ...state.selectedAgent, status: 'active' as const }
              : state.selectedAgent,
            isLoading: false
          }))
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to deploy agent',
            isLoading: false
          })
          throw error
        }
      },

      stopAgent: async (id: string) => {
        try {
          set({ isLoading: true, error: null })
          await apiService.stopAgent(id)
          set((state) => ({
            agents: state.agents.map(agent =>
              agent.id === id ? { ...agent, status: 'inactive' as const } : agent
            ),
            selectedAgent: state.selectedAgent?.id === id
              ? { ...state.selectedAgent, status: 'inactive' as const }
              : state.selectedAgent,
            isLoading: false
          }))
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to stop agent',
            isLoading: false
          })
          throw error
        }
      },

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