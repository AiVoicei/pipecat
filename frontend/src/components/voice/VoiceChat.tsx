import { Mic, MicOff, Phone, PhoneOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
      if (!isConnected) {
        await connect();
      }
      if (isConnected) {
        await startRecording();
        setCallActive(true);
      }
    } catch (error) {
      console.error('Failed to start call:', error);
    }
  };

  const endCall = async () => {
    try {
      stopRecording();
      setCallActive(false);
      await disconnect();
    } catch (error) {
      console.error('Failed to end call:', error);
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

      {/* Skip to main action */}
      <a
        href="#voice-chat-main-button"
        className="skip-to-content hebrew"
      >
        דלג לכפתור שיחה ראשי
      </a>

      <div className="text-center space-y-6" role="main" aria-labelledby="voice-chat-heading">
        {/* Accessible heading */}
        <h2 id="voice-chat-heading" className="sr-only hebrew">
          ממשק שיחה קולית עם AI Voicei
        </h2>

        {/* Status */}
        <div className="flex justify-center mb-8" role="region" aria-label="מצב חיבור">
          {getStatusBadge()}
        </div>

        {/* Voice Indicator with Real-time Audio Visualization */}
        <div className="relative mb-8" role="img" aria-label={isCallActive ? 'מיקרופון פעיל - השיחה פועלת' : 'מיקרופון כבוי - השיחה לא פעילה'}>
          <div className={`w-32 h-32 mx-auto rounded-full border-2 flex items-center justify-center transition-all duration-300 ai-voice-indicator-accessible ${
            isCallActive
              ? `border-primary bg-primary/10 ${isVoiceActive ? 'voice-pulse' : ''}`
              : 'border-border bg-card/50'
          }`}
          data-voice-status={isCallActive ? 'השיחה פעילה' : 'השיחה לא פעילה'}
          style={{
            transform: isCallActive && isVoiceActive ? `scale(${1 + audioLevel * 0.2})` : 'scale(1)',
            boxShadow: isCallActive && isVoiceActive ? `0 0 ${20 + audioLevel * 30}px rgba(var(--primary-rgb), ${0.3 + audioLevel * 0.4})` : 'none'
          }}>
            {isCallActive ? (
              <Mic
                className={`w-12 h-12 transition-colors duration-300 ${
                  isVoiceActive ? 'text-primary' : 'text-primary/70'
                }`}
                aria-hidden="true"
              />
            ) : (
              <MicOff
                className="w-12 h-12 text-muted-foreground"
                aria-hidden="true"
              />
            )}
          </div>

          {/* Audio Level Indicator */}
          {isCallActive && (
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-16 h-1 bg-gray-300 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-75"
                style={{ width: `${audioLevel * 100}%` }}
              />
            </div>
          )}
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

        {/* Controls */}
        <div className="flex justify-center mb-6">
          {!isCallActive ? (
            <Button
              ref={mainButtonRef}
              id="voice-chat-main-button"
              onClick={startCall}
              disabled={connectionState === 'connecting'}
              className="ai-accessible-button ai-touch-target px-8 py-4 text-base h-auto rounded-xl shadow-lg focus-visible:focus-visible"
              aria-describedby="start-call-description"
            >
              <Phone className="w-5 h-5 ml-3" aria-hidden="true" />
              <span className="hebrew">התחל שיחה</span>
            </Button>
          ) : (
            <Button
              ref={mainButtonRef}
              id="voice-chat-main-button"
              onClick={endCall}
              className="ai-accessible-button ai-touch-target bg-destructive hover:bg-destructive/90 text-destructive-foreground px-8 py-4 text-base h-auto rounded-xl shadow-lg focus-visible:focus-visible"
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

        {/* Keyboard shortcuts info */}
        <details className="text-xs text-muted-foreground text-center">
          <summary className="cursor-pointer hover:text-card-foreground transition-colors hebrew">
            קיצורי מקלדת נגישים
          </summary>
          <div className="mt-2 space-y-1 hebrew">
            <div>Space - התחל/סיים שיחה</div>
            <div>Enter - הפעל כפתור נבחר</div>
            <div>Tab - עבור בין אלמנטים</div>
            <div>Escape - חזור למצב התחלתי</div>
          </div>
        </details>
      </div>
    </div>
  );
}