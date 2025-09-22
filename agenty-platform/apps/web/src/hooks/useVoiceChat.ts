import { useEffect, useState } from 'react';
import { useVoiceStore } from '../stores/voiceStore';

export interface VoiceChatConfig {
  botUrl: string;
  apiKey?: string;
}

export const useVoiceChat = (config: VoiceChatConfig) => {
  const { 
    isConnected, 
    isCallActive, 
    connectionState,
    setConnectionState,
    setCallActive,
    connect,
    disconnect 
  } = useVoiceStore();
  
  const [error, setError] = useState<string | null>(null);
  
  // Use real WebRTC connection
  const startCall = async () => {
    try {
      setError(null);

      // Use the real connect method from voice store
      await connect();

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed');
    }
  };
  
  const endCall = () => {
    disconnect();
    setError(null);
  };
  
  return {
    isConnected,
    isCallActive,
    connectionState,
    error,
    startCall,
    endCall
  };
};