import { Mic, MicOff, Phone, PhoneOff, Loader2, Video, VideoOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VoiceVisualizer } from '@pipecat-ai/client-react';
import { useVoiceStore, type CallType } from '@/stores/voiceStore';
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
    isVideoEnabled,
    videoStream,
    callType,
    isCallTypeSelected,
    connect,
    disconnect,
    setCallActive,
    setCallType,
    startRecording,
    stopRecording,
    clearMessages,
    enableVideo,
    disableVideo
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

  // Video ref
  const userVideoRef = useRef<HTMLVideoElement>(null);

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

  // Video stream setup
  useEffect(() => {
    if (userVideoRef.current && videoStream) {
      userVideoRef.current.srcObject = videoStream;
    }
  }, [videoStream]);

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

  const toggleVideo = async () => {
    if (isVideoEnabled) {
      // Turn off video
      disableVideo();
    } else {
      // Turn on video
      try {
        await enableVideo();
      } catch (error) {
        console.error('Failed to access camera:', error);
        // Error is already handled in the store
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

        {/* Call Type Selection - Show only when not connected and call type not selected */}
        {!isConnected && !isCallTypeSelected && (
          <div className="mb-8 animate-fade-in" role="region" aria-labelledby="call-type-heading">
            <h3 id="call-type-heading" className="text-lg font-semibold text-center mb-4 hebrew">
              בחרו סוג שיחה
            </h3>
            <div className="flex flex-col gap-3 max-w-xs mx-auto">
              <Button
                onClick={() => setCallType('audio')}
                variant="outline"
                className="h-16 flex items-center justify-center gap-3 bg-muted/50 hover:bg-[#6C2CCC]/10 border-[#6C2CCC]/30 transition-all duration-200 hover:scale-105"
                aria-describedby="audio-call-description"
              >
                <Phone className="w-6 h-6" />
                <div className="text-center">
                  <div className="hebrew font-medium">שיחה קולית</div>
                  <div className="text-xs text-muted-foreground hebrew">שמע בלבד</div>
                </div>
              </Button>
              <div id="audio-call-description" className="sr-only">
                שיחה קולית דורשת הרשאת מיקרופון בלבד
              </div>

              <Button
                onClick={() => setCallType('video')}
                variant="outline"
                className="h-16 flex items-center justify-center gap-3 bg-muted/50 hover:bg-[#6C2CCC]/10 border-[#6C2CCC]/30 transition-all duration-200 hover:scale-105"
                aria-describedby="video-call-description"
              >
                <Video className="w-6 h-6" />
                <div className="text-center">
                  <div className="hebrew font-medium">שיחת וידאו</div>
                  <div className="text-xs text-muted-foreground hebrew">שמע ותמונה</div>
                </div>
              </Button>
              <div id="video-call-description" className="sr-only">
                שיחת וידאו דורשת הרשאות מיקרופון ומצלמה
              </div>
            </div>
            <p className="text-xs text-center text-muted-foreground mt-3 hebrew">
              {callType === 'video'
                ? 'תידרשו לאשר גישה למצלמה ולמיקרופון'
                : 'תידרשו לאשר גישה למיקרופון בלבד'
              }
            </p>
          </div>
        )}

        {/* Call Type Selected Info - Show when type is selected but not connected */}
        {!isConnected && isCallTypeSelected && (
          <div className="mb-6 animate-fade-in text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#6C2CCC]/10 border border-[#6C2CCC]/30">
              {callType === 'video' ? <Video className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
              <span className="hebrew text-sm font-medium">
                {callType === 'video' ? 'שיחת וידאו' : 'שיחה קולית'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-2 hebrew">
              לחצו על "התחל שיחה" להתחיל
            </p>
          </div>
        )}

        {/* User Video Preview */}
        {isVideoEnabled && videoStream && (
          <div className="mb-6 animate-fade-in">
            <div className="relative">
              <video
                ref={userVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full max-w-xs mx-auto aspect-video bg-muted rounded-lg border-2 border-[#6C2CCC]/30 object-cover"
              />
              <div className="absolute top-2 right-2">
                <Button
                  onClick={toggleVideo}
                  size="sm"
                  variant="secondary"
                  className="h-8 w-8 p-0 bg-black/50 hover:bg-black/70 border-none"
                >
                  <VideoOff className="h-4 w-4 text-white" />
                </Button>
              </div>
            </div>
            <p className="text-xs text-center text-muted-foreground mt-2 hebrew">תצוגה מקדימה של הוידאו שלך</p>
          </div>
        )}

        {/* Video Control Button - Only show for video calls */}
        {!isVideoEnabled && callType === 'video' && isCallTypeSelected && (
          <div className="mb-6 animate-fade-in">
            <div className="text-center">
              <Button
                onClick={toggleVideo}
                variant="outline"
                className="mb-2 bg-muted/50 hover:bg-[#6C2CCC]/10 border-[#6C2CCC]/30"
              >
                <Video className="w-4 h-4 ml-2" />
                <span className="hebrew">הפעל וידאו</span>
              </Button>
              <p className="text-xs text-muted-foreground hebrew">הפעל מצלמה לשיחת וידאו</p>
            </div>
          </div>
        )}

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

        {/* Enhanced Controls with Better State Management - Only show when call type is selected */}
        {isCallTypeSelected && (
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
                ) : callType === 'video' ? (
                  <Video className="w-5 h-5 ml-3" aria-hidden="true" />
                ) : (
                  <Phone className="w-5 h-5 ml-3" aria-hidden="true" />
                )}
                <span className="hebrew">
                  {connectionState === 'connecting'
                    ? 'מתחבר...'
                    : callType === 'video'
                      ? 'התחל שיחת וידאו'
                      : 'התחל שיחה קולית'
                  }
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
        )}

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