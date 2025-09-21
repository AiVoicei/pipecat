import { create } from 'zustand';
import { apiService } from '../services/api';
import type { WebRTCService } from '../services/webrtc';
import { getWebRTCService } from '../services/webrtc';
import type { ConversationMessage } from '../components/voice/ConversationHistory';

interface VoiceState {
  isConnected: boolean;
  isCallActive: boolean;
  connectionState: 'idle' | 'connecting' | 'connected' | 'error';
  sessionId: string | null;
  botUrl: string;
  error: string | null;

  // WebRTC specific state
  webrtcService: WebRTCService | null;
  peerConnectionState: RTCPeerConnectionState;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isRecording: boolean;

  // Conversation state
  messages: ConversationMessage[];
  isAssistantSpeaking: boolean;

  // Simple message processing (no aggregation needed with TranscriptProcessor)
  processingMessage: boolean;

  // Actions
  setConnectionState: (state: 'idle' | 'connecting' | 'connected' | 'error') => void;
  setCallActive: (active: boolean) => void;
  setBotUrl: (url: string) => void;
  setError: (error: string | null) => void;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  testConnection: () => Promise<boolean>;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  onTranscript: (callback: (text: string, isUser: boolean) => void) => void;

  // Conversation actions
  addMessage: (text: string, isUser: boolean) => void;
  clearMessages: () => void;
  setAssistantSpeaking: (speaking: boolean) => void;
}

export const useVoiceStore = create<VoiceState>((set, get) => ({
  isConnected: false,
  isCallActive: false,
  connectionState: 'idle',
  sessionId: null,
  botUrl: import.meta.env.VITE_BOT_URL || 'http://localhost:7860',
  error: null,

  // WebRTC initial state
  webrtcService: null,
  peerConnectionState: 'closed',
  localStream: null,
  remoteStream: null,
  isRecording: false,

  // Conversation initial state
  messages: [],
  isAssistantSpeaking: false,

  // Simple message processing initial state
  processingMessage: false,
  
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

      // Initialize with empty conversation history - real messages will come from WebSocket transcripts
      set({ messages: [] });

      // Test API connection first
      const isApiHealthy = await apiService.testConnection();
      if (!isApiHealthy) {
        throw new Error('Backend API is not responding');
      }

      // Create a new session
      const sessionResponse = await apiService.createSession();

      // Initialize WebRTC service
      const webrtcService = getWebRTCService();

      // Set up WebRTC event handlers
      webrtcService.onConnectionStateChange((state: RTCPeerConnectionState) => {
        set({ peerConnectionState: state });

        // Map WebRTC states to our connection state
        if (state === 'connected') {
          set({ connectionState: 'connected', isConnected: true });
        } else if (state === 'failed' || state === 'disconnected') {
          set({ connectionState: 'error', error: 'WebRTC connection failed' });
        }
      });

      webrtcService.onError((error: Error) => {
        console.error('[VoiceStore] WebRTC error:', error);
        set({
          connectionState: 'error',
          error: error.message,
          isConnected: false
        });
      });

      webrtcService.onAudioReceived((stream: MediaStream) => {
        console.log('[VoiceStore] Remote audio received');
        set({ remoteStream: stream });
      });

      // Connect via WebRTC
      await webrtcService.connect();

      // Set up transcript handling (now receives complete messages from TranscriptProcessor)
      webrtcService.onTranscript((text: string, isUser: boolean) => {
        console.log(`[VoiceStore] Complete transcript received - ${isUser ? 'User' : 'AI'}: ${text}`);

        // Directly add complete messages (no aggregation needed)
        get().addMessage(text, isUser);

        // Track assistant speaking state
        if (!isUser) {
          get().setAssistantSpeaking(true);
          // Auto-stop assistant speaking after message is complete
          setTimeout(() => get().setAssistantSpeaking(false), 1000);
        }
      });

      set({
        sessionId: sessionResponse.session_id,
        webrtcService,
        connectionState: 'connected',
        isConnected: true,
        error: null
      });

      console.log('Voice session created with WebRTC:', sessionResponse.session_id);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Connection failed';
      set({
        connectionState: 'error',
        error: errorMessage,
        isConnected: false,
        sessionId: null,
        webrtcService: null
      });
      console.error('Connection failed:', error);
    }
  },
  
  disconnect: async () => {
    try {
      const { sessionId, webrtcService } = get();

      // Disconnect WebRTC first
      if (webrtcService) {
        webrtcService.disconnect();
      }

      // End API session
      if (sessionId) {
        await apiService.endSession(sessionId);
        console.log('Voice session ended:', sessionId);
      }

      set({
        connectionState: 'idle',
        isConnected: false,
        isCallActive: false,
        sessionId: null,
        error: null,
        webrtcService: null,
        peerConnectionState: 'closed',
        localStream: null,
        remoteStream: null,
        isRecording: false,
        processingMessage: false
      });

    } catch (error) {
      console.error('Disconnect failed:', error);
      // Still set to disconnected state even if API call fails
      set({
        connectionState: 'idle',
        isConnected: false,
        isCallActive: false,
        sessionId: null,
        webrtcService: null,
        peerConnectionState: 'closed',
        localStream: null,
        remoteStream: null,
        isRecording: false,
        processingMessage: false
      });
    }
  },
  
  testConnection: async () => {
    try {
      return await apiService.testConnection();
    } catch {
      return false;
    }
  },

  startRecording: async () => {
    try {
      const { webrtcService } = get();

      if (!webrtcService) {
        throw new Error('WebRTC service not initialized');
      }

      // Get user media for recording
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000
        },
        video: false
      });

      // Send audio to WebRTC service
      webrtcService.sendAudio(stream);

      set({
        localStream: stream,
        isRecording: true,
        isCallActive: true
      });

      console.log('[VoiceStore] Recording started');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Recording failed';
      set({
        error: errorMessage,
        isRecording: false
      });
      console.error('Recording failed:', error);
      throw error;
    }
  },

  stopRecording: () => {
    try {
      const { localStream } = get();

      // Stop all tracks
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }

      set({
        localStream: null,
        isRecording: false,
        isCallActive: false
      });

      console.log('[VoiceStore] Recording stopped');

    } catch (error) {
      console.error('Failed to stop recording:', error);
    }
  },

  onTranscript: (callback: (text: string, isUser: boolean) => void) => {
    const { webrtcService } = get();

    if (webrtcService) {
      webrtcService.onTranscript(callback);
    } else {
      console.warn('[VoiceStore] Cannot set transcript callback - WebRTC service not initialized');
    }
  },

  // Conversation actions
  addMessage: (text: string, isUser: boolean) => {
    const message: ConversationMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: isUser ? 'user' : 'assistant',
      content: text,
      timestamp: new Date(),
      metadata: {
        processingTime: Date.now() % 1000 // Placeholder processing time
      }
    };

    set((state) => ({
      messages: [...state.messages, message]
    }));

    console.log(`[VoiceStore] Message added - ${isUser ? 'User' : 'Assistant'}: ${text}`);
  },


  clearMessages: () => {
    set({
      messages: [],
      processingMessage: false
    });
    console.log('[VoiceStore] Conversation history cleared');
  },

  setAssistantSpeaking: (speaking: boolean) => {
    set({ isAssistantSpeaking: speaking });
    console.log(`[VoiceStore] Assistant speaking: ${speaking}`);
  }
}));