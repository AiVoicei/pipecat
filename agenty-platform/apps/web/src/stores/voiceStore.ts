import { create } from 'zustand';
import { apiService } from '../services/api';
import type { WebRTCService } from '../services/webrtc';
import { getWebRTCService } from '../services/webrtc';
import type { ConversationMessage } from '../components/voice/ConversationHistory';

export type CallType = 'audio' | 'video';

interface VoiceState {
  isConnected: boolean;
  isCallActive: boolean;
  connectionState: 'idle' | 'connecting' | 'connected' | 'error';
  sessionId: string | null;
  botUrl: string;
  error: string | null;

  // Call type selection
  callType: CallType;
  isCallTypeSelected: boolean;

  // WebRTC specific state
  webrtcService: WebRTCService | null;
  peerConnectionState: RTCPeerConnectionState;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isRecording: boolean;

  // Video state
  isVideoEnabled: boolean;
  videoStream: MediaStream | null;

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
  setCallType: (type: CallType) => void;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  testConnection: () => Promise<boolean>;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  onTranscript: (callback: (text: string, isUser: boolean) => void) => void;

  // Video actions
  enableVideo: () => Promise<void>;
  disableVideo: () => void;
  setVideoEnabled: (enabled: boolean) => void;

  // Conversation actions
  addMessage: (text: string, isUser: boolean) => void;
  clearMessages: () => void;
  setAssistantSpeaking: (speaking: boolean) => void;
}

// Remote audio analysis for real-time assistant speaking detection
let remoteAudioContext: AudioContext | null = null;
let remoteAnalyser: AnalyserNode | null = null;
let remoteAnimationId: number | null = null;
let lastSpeakingState = false;
let speakingDebounceTimeout: number | null = null;

const setupRemoteAudioAnalysis = (stream: MediaStream) => {
  try {
    if (remoteAudioContext) {
      remoteAudioContext.close();
    }

    remoteAudioContext = new AudioContext();
    remoteAnalyser = remoteAudioContext.createAnalyser();

    const source = remoteAudioContext.createMediaStreamSource(stream);
    source.connect(remoteAnalyser);

    remoteAnalyser.fftSize = 256;
    const bufferLength = remoteAnalyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const analyzeRemoteAudio = () => {
      if (!remoteAnalyser) return;

      remoteAnalyser.getByteFrequencyData(dataArray);

      // Calculate average amplitude
      const average = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;
      const normalizedLevel = Math.min(average / 128, 1);

      // Update assistant speaking state based on audio level with debouncing
      // INVERTED LOGIC: Low audio level means assistant is speaking (silence when assistant talks)
      const isCurrentlySpeaking = normalizedLevel < 0.02; // Very low threshold - silence means assistant is speaking

      // Only update if state changed and add debouncing to prevent flicker
      if (isCurrentlySpeaking !== lastSpeakingState) {
        if (speakingDebounceTimeout) {
          clearTimeout(speakingDebounceTimeout);
        }

        speakingDebounceTimeout = window.setTimeout(() => {
          useVoiceStore.getState().setAssistantSpeaking(isCurrentlySpeaking);
          lastSpeakingState = isCurrentlySpeaking;
        }, isCurrentlySpeaking ? 100 : 300); // Medium start delay, longer stop delay for smoother transitions
      }

      remoteAnimationId = requestAnimationFrame(analyzeRemoteAudio);
    };

    analyzeRemoteAudio();
  } catch (error) {
    console.error('Failed to setup remote audio analysis:', error);
  }
};

export const useVoiceStore = create<VoiceState>((set, get) => ({
  isConnected: false,
  isCallActive: false,
  connectionState: 'idle',
  sessionId: null,
  botUrl: process.env.NEXT_PUBLIC_BOT_URL || 'http://localhost:7860',
  error: null,

  // Call type initial state
  callType: 'audio',
  isCallTypeSelected: false,

  // WebRTC initial state
  webrtcService: null,
  peerConnectionState: 'closed',
  localStream: null,
  remoteStream: null,
  isRecording: false,

  // Video initial state
  isVideoEnabled: false,
  videoStream: null,

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

  setCallType: (type) => set({
    callType: type,
    isCallTypeSelected: true,
    // Auto-enable video if video call is selected
    isVideoEnabled: type === 'video'
  }),

  connect: async () => {
    try {
      const { callType, isCallTypeSelected } = get();

      // Ensure call type is selected
      if (!isCallTypeSelected) {
        throw new Error('Please select a call type first');
      }

      set({ connectionState: 'connecting', error: null });

      // Initialize with empty conversation history - real messages will come from WebSocket transcripts
      set({ messages: [] });

      // Request permissions based on call type BEFORE API connection
      console.log(`[VoiceStore] Requesting permissions for ${callType} call...`);

      try {
        if (callType === 'video') {
          // For video calls, require both audio and video permissions
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
              sampleRate: 16000
            },
            video: {
              width: { ideal: 640 },
              height: { ideal: 480 },
              frameRate: { ideal: 15 },
              facingMode: 'user'
            }
          });
          console.log('[VoiceStore] Video call permissions granted');
          // Store the stream temporarily, will be used by WebRTC service
          set({ localStream: stream, videoStream: stream });
        } else {
          // For audio calls, only require audio permission
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
              sampleRate: 16000
            }
          });
          console.log('[VoiceStore] Audio call permissions granted');
          set({ localStream: stream });
        }
      } catch (permissionError) {
        console.error('Permission error:', permissionError);
        const callTypeText = callType === 'video' ? 'camera and microphone' : 'microphone';
        throw new Error(`${callTypeText} permission is required for ${callType} calls. Please allow access and try again.`);
      }

      // Test API connection
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

        // Set up real-time assistant speaking detection from audio stream
        setupRemoteAudioAnalysis(stream);
      });

      // Connect via WebRTC using the pre-obtained stream
      const { localStream } = get();
      await webrtcService.connect(localStream || undefined);

      // Set up transcript handling (now receives complete messages from TranscriptProcessor)
      webrtcService.onTranscript((text: string, isUser: boolean) => {
        console.log(`[VoiceStore] Complete transcript received - ${isUser ? 'User' : 'AI'}: ${text}`);

        // Directly add complete messages (no aggregation needed)
        get().addMessage(text, isUser);

        // Note: Assistant speaking state is now handled by real-time audio analysis
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

      // Cleanup remote audio analysis
      if (remoteAnimationId) {
        cancelAnimationFrame(remoteAnimationId);
        remoteAnimationId = null;
      }
      if (speakingDebounceTimeout) {
        clearTimeout(speakingDebounceTimeout);
        speakingDebounceTimeout = null;
      }
      if (remoteAudioContext && remoteAudioContext.state !== 'closed') {
        remoteAudioContext.close();
        remoteAudioContext = null;
      }
      lastSpeakingState = false;

      // Ensure assistant speaking state is cleared
      set({ isAssistantSpeaking: false });

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
        processingMessage: false,
        isVideoEnabled: false,
        videoStream: null,
        isAssistantSpeaking: false, // Always clear speaking state on disconnect
        // Reset call type selection
        isCallTypeSelected: false,
        callType: 'audio'
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
        processingMessage: false,
        isVideoEnabled: false,
        videoStream: null,
        isAssistantSpeaking: false, // Always clear speaking state on disconnect
        // Reset call type selection
        isCallTypeSelected: false,
        callType: 'audio'
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
  },

  // Video actions
  enableVideo: async () => {
    try {
      const { sessionId, webrtcService } = get();

      if (!webrtcService) {
        throw new Error('WebRTC service not initialized');
      }

      // Use WebRTC service to enable video with proper configuration
      const stream = await webrtcService.enableVideo();

      set({
        isVideoEnabled: true,
        videoStream: stream
      });

      // Tell backend to enable video processing
      if (sessionId) {
        try {
          await apiService.controlVideo(sessionId, true);
          console.log('[VoiceStore] Backend video processing enabled');
        } catch (error) {
          console.error('[VoiceStore] Failed to enable backend video processing:', error);
        }
      }

      console.log('[VoiceStore] Video enabled');
    } catch (error) {
      console.error('Failed to enable video:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to access camera'
      });
      throw error;
    }
  },

  disableVideo: () => {
    const { videoStream, sessionId, webrtcService } = get();

    // Stop local video stream tracks
    if (videoStream) {
      videoStream.getTracks().forEach(track => track.stop());
    }

    // Use WebRTC service to properly disable video
    if (webrtcService) {
      webrtcService.disableVideo();
    }

    set({
      isVideoEnabled: false,
      videoStream: null
    });

    // Tell backend to disable video processing
    if (sessionId) {
      apiService.controlVideo(sessionId, false).catch(error => {
        console.error('[VoiceStore] Failed to disable backend video processing:', error);
      });
    }

    console.log('[VoiceStore] Video disabled');
  },

  setVideoEnabled: (enabled: boolean) => {
    set({ isVideoEnabled: enabled });
  }
}));