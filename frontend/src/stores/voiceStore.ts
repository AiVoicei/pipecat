import { create } from 'zustand';
import { apiService } from '../services/api';

interface VoiceState {
  isConnected: boolean;
  isCallActive: boolean;
  connectionState: 'idle' | 'connecting' | 'connected' | 'error';
  sessionId: string | null;
  botUrl: string;
  error: string | null;
  
  // Actions
  setConnectionState: (state: 'idle' | 'connecting' | 'connected' | 'error') => void;
  setCallActive: (active: boolean) => void;
  setBotUrl: (url: string) => void;
  setError: (error: string | null) => void;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  testConnection: () => Promise<boolean>;
}

export const useVoiceStore = create<VoiceState>((set, get) => ({
  isConnected: false,
  isCallActive: false,
  connectionState: 'idle',
  sessionId: null,
  botUrl: import.meta.env.VITE_BOT_URL || 'http://localhost:7860',
  error: null,
  
  setConnectionState: (state) => set({ 
    connectionState: state,
    isConnected: state === 'connected',
    error: state === 'error' ? get().error : null
  }),
  
  setCallActive: (active) => set({ isCallActive: active }),
  
  setBotUrl: (url) => set({ botUrl: url }),
  
  setError: (error) => set({ error }),
  
  connect: async () => {
    try {
      set({ connectionState: 'connecting', error: null });
      
      // Test API connection first
      const isApiHealthy = await apiService.testConnection();
      if (!isApiHealthy) {
        throw new Error('Backend API is not responding');
      }
      
      // Create a new session
      const sessionResponse = await apiService.createSession();
      
      set({ 
        sessionId: sessionResponse.session_id,
        connectionState: 'connected',
        isConnected: true,
        error: null
      });
      
      console.log('Voice session created:', sessionResponse.session_id);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Connection failed';
      set({ 
        connectionState: 'error', 
        error: errorMessage,
        isConnected: false,
        sessionId: null 
      });
      console.error('Connection failed:', error);
    }
  },
  
  disconnect: async () => {
    try {
      const { sessionId } = get();
      
      if (sessionId) {
        await apiService.endSession(sessionId);
        console.log('Voice session ended:', sessionId);
      }
      
      set({ 
        connectionState: 'idle',
        isConnected: false,
        isCallActive: false,
        sessionId: null,
        error: null
      });
      
    } catch (error) {
      console.error('Disconnect failed:', error);
      // Still set to disconnected state even if API call fails
      set({ 
        connectionState: 'idle',
        isConnected: false,
        isCallActive: false,
        sessionId: null
      });
    }
  },
  
  testConnection: async () => {
    try {
      return await apiService.testConnection();
    } catch {
      return false;
    }
  }
}));