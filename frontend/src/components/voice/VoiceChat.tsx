import { Mic, MicOff, Phone, PhoneOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VoiceVisualizer } from '@pipecat-ai/client-react';
import { useVoiceStore } from '@/stores/voiceStore';
import { useEffect, useRef, useState } from 'react';

interface VoiceChatProps {
  botUrl?: string;
}

export function VoiceChat({ botUrl }: VoiceChatProps) {
  const {
    isConnected,
    isCallActive,
    connectionState,
    error,
    sessionId,
    localStream,
    remoteStream,
    isRecording,
    peerConnectionState,
    messages,
    isAssistantSpeaking,
    connect,
    disconnect,
    setCallActive,
    startRecording,
    stopRecording,
    clearMessages
  } = useVoiceStore();

  const statusAnnouncementRef = useRef<HTMLDivElement>(null);
  const mainButtonRef = useRef<HTMLButtonElement>(null);
  const localAudioRef = useRef<HTMLAudioElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationIdRef = useRef<number | null>(null);

  // Voice activity visualization state
  const [audioLevel, setAudioLevel] = useState(0);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Audio stream management and analysis setup
  useEffect(() => {
    if (localAudioRef.current && localStream) {
      localAudioRef.current.srcObject = localStream;
      setupAudioAnalysis(localStream);
    }

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, [localStream]);

  useEffect(() => {
    if (remoteAudioRef.current && remoteStream) {
      remoteAudioRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Announce status changes to screen readers
  useEffect(() => {
    if (statusAnnouncementRef.current) {
      let announcement = '';
      switch (connectionState) {
        case 'connected':
          announcement = 'מחובר לשירות AI Voicei';
          break;
        case 'connecting':
          announcement = 'מתחבר לשירות AI Voicei...';
          break;
        case 'error':
          announcement = `שגיאת חיבור: ${error}`;
          break;
        default:
          announcement = 'לא מחובר לשירות';
      }

      if (isCallActive) {
        announcement += '. השיחה פעילה';
      }

      // Include WebRTC connection state
      if (peerConnectionState) {
        announcement += `. WebRTC: ${peerConnectionState}`;
      }

      statusAnnouncementRef.current.textContent = announcement;
    }
  }, [connectionState, isCallActive, error, peerConnectionState]);

  const startCall = async () => {
    try {
      // First connect to the session
      if (!isConnected) {
        await connect();
      }

      // Start recording immediately after connection attempt
      // The voice store will handle the state correctly
      await startRecording();
    } catch (error) {
      console.error('Failed to start call:', error);
    }
  };

  const endCall = async () => {
    try {
      // Stop recording first
      stopRecording();
      // Disconnect the session
      await disconnect();
      // Reset mute state
      setIsMuted(false);
    } catch (error) {
      console.error('Failed to end call:', error);
    }
  };

  const toggleMute = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  // Audio analysis setup
  const setupAudioAnalysis = (stream: MediaStream) => {
    try {
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();

      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);

      analyserRef.current.fftSize = 256;
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const analyzeAudio = () => {
        if (!analyserRef.current) return;

        analyserRef.current.getByteFrequencyData(dataArray);

        // Calculate average amplitude
        const average = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;
        const normalizedLevel = Math.min(average / 128, 1);

        setAudioLevel(normalizedLevel);
        setIsVoiceActive(normalizedLevel > 0.1); // Threshold for voice activity

        animationIdRef.current = requestAnimationFrame(analyzeAudio);
      };

      analyzeAudio();
    } catch (error) {
      console.error('Failed to setup audio analysis:', error);
    }
  };

  const getStatusBadge = () => {
    const baseClasses = "px-3 py-1 rounded-full text-xs font-medium hebrew";
    const ariaLabel = `מצב חיבור: `;

    switch (connectionState) {
      case 'connected':
        return (
          <span
            className={`status-connected ${baseClasses}`}
            role="status"
            aria-label={`${ariaLabel}מחובר`}
          >
            מחובר
          </span>
        );
      case 'connecting':
        return (
          <span
            className={`status-connecting ${baseClasses}`}
            role="status"
            aria-label={`${ariaLabel}מתחבר`}
            aria-live="polite"
          >
            מתחבר...
          </span>
        );
      case 'error':
        return (
          <span
            className={`status-error ${baseClasses}`}
            role="alert"
            aria-label={`${ariaLabel}שגיאה`}
          >
            שגיאה
          </span>
        );
      default:
        return (
          <span
            className={`status-idle ${baseClasses}`}
            role="status"
            aria-label={`${ariaLabel}לא מחובר`}
          >
            לא מחובר
          </span>
        );
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Hidden audio elements for WebRTC streams */}
      <audio ref={localAudioRef} muted autoPlay style={{ display: 'none' }} />
      <audio ref={remoteAudioRef} autoPlay style={{ display: 'none' }} />

      {/* Screen reader announcements */}
      <div
        ref={statusAnnouncementRef}
        className="sr-only"
        aria-live="polite"
        aria-atomic="true"
      />

      <div className="text-center space-y-6" role="main" aria-labelledby="voice-chat-heading">
        {/* Accessible heading */}
        <h2 id="voice-chat-heading" className="sr-only hebrew">
          ממשק שיחה קולית עם AI Voicei
        </h2>

        {/* Status */}
        <div className="flex justify-center mb-8 animate-slide-in-down" role="region" aria-label="מצב חיבור">
          {getStatusBadge()}
        </div>

        {/* Voice Indicator with Enhanced Pipecat Audio Visualization */}
        <div className="relative mb-8 animate-fade-in" role="img" aria-label={isCallActive ? 'מיקרופון פעיל - השיחה פועלת' : 'מיקרופון כבוי - השיחה לא פעילה'}>
          <button
            onClick={isCallActive ? toggleMute : undefined}
            disabled={!isCallActive}
            className={`w-40 h-40 mx-auto rounded-full border-2 flex items-center justify-center transition-all duration-500 ease-out ai-voice-indicator-accessible transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-[#6C2CCC]/30 ${
              isCallActive
                ? `border-[#6C2CCC] bg-[#6C2CCC]/10 cursor-pointer ${
                    isMuted ? 'bg-red-500/20 border-red-500' :
                    isVoiceActive ? 'shadow-lg shadow-[#6C2CCC]/30' : 'animate-breathing'
                  }`
                : 'border-border bg-card/50 hover:border-[#6C2CCC]/50 cursor-default'
            }`}
            data-voice-status={isCallActive ? 'השיחה פעילה' : 'השיחה לא פעילה'}
            style={{
              transform: isCallActive && isVoiceActive ? `scale(${1 + audioLevel * 0.15})` : 'scale(1)',
              boxShadow: isCallActive && isVoiceActive ? `0 0 ${25 + audioLevel * 40}px rgba(108, 44, 204, ${0.3 + audioLevel * 0.4})` : 'none'
            }}
          >
            {/* Enhanced Voice Visualization using Pipecat VoiceVisualizer */}
            {isCallActive && localStream ? (
              <div className="absolute inset-0 rounded-full overflow-hidden">
                <VoiceVisualizer
                  participantType="local"
                  backgroundColor="transparent"
                  barColor="#6C2CCC"
                  barGap={2}
                  barWidth={3}
                  barMaxHeight={32}
                />
              </div>
            ) : null}

            {/* Central Microphone Icon */}
            {connectionState === 'connecting' ? (
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-[#6C2CCC]/20 animate-ping absolute"></div>
                <div className="w-12 h-12 rounded-full bg-[#6C2CCC]/40 animate-ping absolute animation-delay-75"></div>
                <Mic className="w-12 h-12 text-[#6C2CCC] relative z-10" aria-hidden="true" />
              </div>
            ) : isCallActive ? (
              isMuted ? (
                <MicOff
                  className="w-12 h-12 text-red-500 transition-all duration-300 z-10 transform hover:scale-110"
                  aria-hidden="true"
                />
              ) : (
                <Mic
                  className={`w-12 h-12 transition-all duration-300 z-10 transform ${
                    isVoiceActive ? 'text-[#6C2CCC] scale-110' : 'text-[#6C2CCC]/70 scale-100'
                  }`}
                  aria-hidden="true"
                />
              )
            ) : (
              <MicOff
                className="w-12 h-12 text-muted-foreground transition-all duration-300 hover:text-[#6C2CCC]/50 hover:scale-110"
                aria-hidden="true"
              />
            )}
          </button>


        </div>

        {/* Error Message */}
        {error && (
          <div
            className="ai-error-accessible mb-6 hebrew"
            role="alert"
            aria-describedby="error-description"
          >
            <span id="error-description">{error}</span>
          </div>
        )}

        {/* Enhanced Controls with Better State Management */}
        <div className="flex justify-center mb-6">
          {!isCallActive ? (
            <Button
              ref={mainButtonRef}
              id="voice-chat-main-button"
              onClick={startCall}
              disabled={connectionState === 'connecting' || connectionState === 'error'}
              className="ai-accessible-button ai-touch-target px-8 py-4 text-base h-auto rounded-xl shadow-lg focus-visible:focus-visible bg-[#6C2CCC] hover:bg-[#6C2CCC]/90 text-white transform transition-all duration-300 hover:scale-105 active:scale-95"
              aria-describedby="start-call-description"
            >
              {connectionState === 'connecting' ? (
                <Loader2 className="w-5 h-5 ml-3 animate-spin" aria-hidden="true" />
              ) : (
                <Phone className="w-5 h-5 ml-3" aria-hidden="true" />
              )}
              <span className="hebrew">
                {connectionState === 'connecting' ? 'מתחבר...' : 'התחל שיחה'}
              </span>
            </Button>
          ) : (
            <Button
              ref={mainButtonRef}
              id="voice-chat-main-button"
              onClick={endCall}
              className="ai-accessible-button ai-touch-target bg-destructive hover:bg-destructive/90 text-destructive-foreground px-8 py-4 text-base h-auto rounded-xl shadow-lg focus-visible:focus-visible transform transition-all duration-300 hover:scale-105 active:scale-95"
              aria-describedby="end-call-description"
            >
              <PhoneOff className="w-5 h-5 ml-3" aria-hidden="true" />
              <span className="hebrew">סיים שיחה</span>
            </Button>
          )}
        </div>

        {/* Session Info */}
        {sessionId && (
          <div
            className="text-xs text-muted-foreground font-mono bg-muted/50 p-3 rounded-lg border border-border mb-4"
            role="status"
            aria-label={`מזהה הפעלה: ${sessionId.slice(0, 8)}`}
          >
            Session: {sessionId.slice(0, 8)}...
          </div>
        )}

        {/* Instructions */}
        <div className="text-sm text-center hebrew-accessible" role="region" aria-label="הוראות שימוש">
          {!isCallActive ? (
            <div className="space-y-2">
              <p
                id="start-call-description"
                className="text-card-foreground font-medium hebrew"
              >
                לחץ להתחלת שיחה עם AI Voicei
              </p>
              <p className="text-muted-foreground text-xs hebrew">
                שירות קולי חכם המבין עברית
              </p>
              <div className="sr-only">
                כדי להתחיל שיחה, לחץ על כפתור התחל שיחה. ודא שהמיקרופון שלך פועל ושיש לך חיבור אינטרנט יציב.
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <p
                id="end-call-description"
                className="font-medium text-primary hebrew"
              >
                השיחה פעילה - דבר באופן טבעי
              </p>
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <div
                  className="w-2 h-2 bg-primary rounded-full animate-pulse"
                  aria-hidden="true"
                />
                <span>מדבר עברית עם Gemini AI</span>
              </div>
              <div className="sr-only">
                השיחה פעילה כעת. אתה יכול לדבר באופן טבעי בעברית והמערכת תקשיב ותענה לך. לחץ על כפתור סיים שיחה כדי לסיים.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}