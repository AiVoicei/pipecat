import { create } from 'zustand';

interface VoiceState {
  isConnected: boolean;
  isCallActive: boolean;
  connectionState: 'idle' | 'connecting' | 'connected' | 'error';
  botUrl: string;
  
  // Actions
  setConnectionState: (state: 'idle' | 'connecting' | 'connected' | 'error') => void;
  setCallActive: (active: boolean) => void;
  setBotUrl: (url: string) => void;
  connect: () => void;
  disconnect: () => void;
}

export const useVoiceStore = create<VoiceState>((set) => ({
  isConnected: false,
  isCallActive: false,
  connectionState: 'idle',
  botUrl: import.meta.env.VITE_BOT_URL || 'http://localhost:7860',
  
  setConnectionState: (state) => set({ 
    connectionState: state,
    isConnected: state === 'connected'
  }),
  
  setCallActive: (active) => set({ isCallActive: active }),
  
  setBotUrl: (url) => set({ botUrl: url }),
  
  connect: () => {
    set({ connectionState: 'connecting' });
    // Connection logic will be implemented later with Pipecat SDK
  },
  
  disconnect: () => {
    set({ 
      connectionState: 'idle',
      isConnected: false,
      isCallActive: false
    });
  }
}));