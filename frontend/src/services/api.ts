// AI Voicei API Service
// Connects to the FastAPI backend server

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:7860';

export interface HealthStatus {
  status: string;
  service: string;
  active_sessions: number;
  environment: string;
}

export interface ServerStatus {
  active_sessions: number;
  sessions: string[];
  uptime: string;
  memory_usage: string;
}

export interface SessionResponse {
  session_id: string;
  status: string;
  message: string;
}

class ApiService {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    try {
      const url = `${API_BASE_URL}${endpoint}`;
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request to ${endpoint} failed:`, error);
      throw error;
    }
  }

  // Health check
  async getHealth(): Promise<HealthStatus> {
    return this.request<HealthStatus>('/health');
  }

  // Server status
  async getStatus(): Promise<ServerStatus> {
    return this.request<ServerStatus>('/status');
  }

  // Create a new voice session
  async createSession(): Promise<SessionResponse> {
    return this.request<SessionResponse>('/sessions', {
      method: 'POST',
    });
  }

  // End a voice session
  async endSession(sessionId: string): Promise<SessionResponse> {
    return this.request<SessionResponse>(`/sessions/${sessionId}`, {
      method: 'DELETE',
    });
  }

  // Get session info
  async getSession(sessionId: string): Promise<SessionResponse> {
    return this.request<SessionResponse>(`/sessions/${sessionId}`);
  }

  // Control video input for a session
  async controlVideo(sessionId: string, enabled: boolean): Promise<{status: string, video_enabled: boolean}> {
    return this.request<{status: string, video_enabled: boolean}>(`/sessions/${sessionId}/video`, {
      method: 'POST',
      body: JSON.stringify({ enabled }),
    });
  }

  // Test API connectivity
  async testConnection(): Promise<boolean> {
    try {
      await this.request('/');
      return true;
    } catch {
      return false;
    }
  }
}

export const apiService = new ApiService();