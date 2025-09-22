const API_BASE_URL = 'http://localhost:7860'

interface SessionResponse {
  session_id: string
}

interface ConnectOptions {
  audio?: boolean
  video?: boolean
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
}

export const apiService = new ApiService()
export type { SessionResponse, ConnectOptions }