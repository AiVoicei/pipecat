const API_BASE_URL = 'http://localhost:7860'

interface SessionResponse {
  session_id: string
}

interface ConnectOptions {
  audio?: boolean
  video?: boolean
}

// Agent Management Types
export interface STTConfig {
  provider: string
  model?: string
  language?: string
  temperature?: number
  punctuation?: boolean
}

export interface LLMConfig {
  provider: string
  model?: string
  systemPrompt?: string
  temperature?: number
  maxTokens?: number
}

export interface TTSConfig {
  provider: string
  voice?: string
  stability?: number
  clarity?: number
  speed?: number
}

export interface RealtimeConfig {
  provider: string
  apiKey?: string
  model?: string
}

export interface AgentConfiguration {
  stt?: STTConfig
  llm?: LLMConfig
  tts?: TTSConfig
  realtime?: RealtimeConfig
}

export interface DeploymentConfig {
  type: 'webrtc' | 'phone' | 'whatsapp' | 'api'
  settings?: Record<string, string | number | boolean>
}

export interface AgentAnalytics {
  totalConversations: number
  averageResponseTime: number
  satisfactionScore: number
  activeToday: number
}

export interface Agent {
  id: string
  userId: string
  name: string
  description: string
  status: 'active' | 'inactive' | 'draft'
  templateId?: string
  configuration: AgentConfiguration
  deploymentConfig: DeploymentConfig
  analytics: AgentAnalytics
  createdAt: string
  updatedAt: string
}

export interface CreateAgentRequest {
  name: string
  description: string
  templateId?: string
  configuration?: AgentConfiguration
  deploymentConfig?: DeploymentConfig
}

export interface UpdateAgentRequest {
  name?: string
  description?: string
  status?: 'active' | 'inactive' | 'draft'
  configuration?: AgentConfiguration
  deploymentConfig?: DeploymentConfig
}

class ApiService {
  async createSession(options: ConnectOptions = {}): Promise<SessionResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          audio: options.audio ?? true,
          video: options.video ?? false,
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to create session: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error creating session:', error)
      throw error
    }
  }

  async endSession(sessionId: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to end session: ${response.statusText}`)
      }
    } catch (error) {
      console.error('Error ending session:', error)
      throw error
    }
  }

  async getSessionStatus(sessionId: string): Promise<{ status: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}`)

      if (!response.ok) {
        throw new Error(`Failed to get session status: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error getting session status:', error)
      throw error
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)

      const response = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        signal: controller.signal
      })

      clearTimeout(timeoutId)
      return response.ok
    } catch (error) {
      console.error('API health check failed:', error)
      return false
    }
  }

  async controlVideo(sessionId: string, enabled: boolean): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/control_video`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionId,
          enabled: enabled,
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to control video: ${response.statusText}`)
      }
    } catch (error) {
      console.error('Error controlling video:', error)
      throw error
    }
  }

  // Agent Management Methods
  async listAgents(userId: string = 'user_1'): Promise<Agent[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/agents?user_id=${userId}`)

      if (!response.ok) {
        throw new Error(`Failed to list agents: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error listing agents:', error)
      throw error
    }
  }

  async createAgent(request: CreateAgentRequest, userId: string = 'user_1'): Promise<Agent> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/agents?user_id=${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        throw new Error(`Failed to create agent: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error creating agent:', error)
      throw error
    }
  }

  async getAgent(agentId: string): Promise<Agent> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/agents/${agentId}`)

      if (!response.ok) {
        throw new Error(`Failed to get agent: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error getting agent:', error)
      throw error
    }
  }

  async updateAgent(agentId: string, request: UpdateAgentRequest): Promise<Agent> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/agents/${agentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        throw new Error(`Failed to update agent: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error updating agent:', error)
      throw error
    }
  }

  async deleteAgent(agentId: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/agents/${agentId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error(`Failed to delete agent: ${response.statusText}`)
      }
    } catch (error) {
      console.error('Error deleting agent:', error)
      throw error
    }
  }

  async duplicateAgent(agentId: string, userId: string = 'user_1'): Promise<Agent> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/agents/${agentId}/duplicate?user_id=${userId}`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error(`Failed to duplicate agent: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error duplicating agent:', error)
      throw error
    }
  }

  async deployAgent(agentId: string): Promise<{ message: string; agent_id: string; status: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/agents/${agentId}/deploy`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error(`Failed to deploy agent: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error deploying agent:', error)
      throw error
    }
  }

  async stopAgent(agentId: string): Promise<{ message: string; agent_id: string; status: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/agents/${agentId}/stop`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error(`Failed to stop agent: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error stopping agent:', error)
      throw error
    }
  }
}

export const apiService = new ApiService()
export type { SessionResponse, ConnectOptions }