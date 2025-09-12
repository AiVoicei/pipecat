import { Mic, MicOff, Phone, PhoneOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useVoiceStore } from '@/stores/voiceStore';

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
    connect, 
    disconnect,
    setCallActive
  } = useVoiceStore();

  const startCall = async () => {
    if (!isConnected) {
      await connect();
    }
    if (isConnected) {
      setCallActive(true);
    }
  };

  const endCall = async () => {
    setCallActive(false);
    await disconnect();
  };

  const getStatusBadge = () => {
    switch (connectionState) {
      case 'connected':
        return <span className="status-connected px-3 py-1 rounded-full text-xs font-medium hebrew">מחובר</span>;
      case 'connecting':
        return <span className="status-connecting px-3 py-1 rounded-full text-xs font-medium hebrew">מתחבר...</span>;
      case 'error':
        return <span className="status-error px-3 py-1 rounded-full text-xs font-medium hebrew">שגיאה</span>;
      default:
        return <span className="status-idle px-3 py-1 rounded-full text-xs font-medium hebrew">לא מחובר</span>;
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center space-y-6">
        {/* Status */}
        <div className="flex justify-center mb-8">
          {getStatusBadge()}
        </div>

        {/* Voice Indicator */}
        <div className="relative mb-8">
          <div className={`w-32 h-32 mx-auto rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
            isCallActive 
              ? 'border-primary bg-primary/10 voice-pulse' 
              : 'border-border bg-card/50'
          }`}>
            {isCallActive ? (
              <Mic className="w-12 h-12 text-primary" />
            ) : (
              <MicOff className="w-12 h-12 text-muted-foreground" />
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="text-destructive text-sm bg-destructive/10 p-3 rounded-lg border border-destructive/20 mb-6">
            <span className="hebrew">{error}</span>
          </div>
        )}

        {/* Controls */}
        <div className="flex justify-center mb-6">
          {!isCallActive ? (
            <Button 
              onClick={startCall}
              disabled={connectionState === 'connecting'}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 text-base h-auto rounded-xl shadow-lg"
            >
              <Phone className="w-5 h-5 ml-3" />
              <span className="hebrew">התחל שיחה</span>
            </Button>
          ) : (
            <Button 
              onClick={endCall}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground px-8 py-4 text-base h-auto rounded-xl shadow-lg"
            >
              <PhoneOff className="w-5 h-5 ml-3" />
              <span className="hebrew">סיים שיחה</span>
            </Button>
          )}
        </div>

        {/* Session Info */}
        {sessionId && (
          <div className="text-xs text-muted-foreground font-mono bg-muted/50 p-3 rounded-lg border border-border mb-4">
            Session: {sessionId.slice(0, 8)}...
          </div>
        )}

        {/* Instructions */}
        <div className="text-sm text-center">
          {!isCallActive ? (
            <div className="space-y-2">
              <p className="text-card-foreground font-medium hebrew">לחץ להתחלת שיחה עם AI Voicei</p>
              <p className="text-muted-foreground text-xs hebrew">שירות קולי חכם המבין עברית</p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="font-medium text-primary hebrew">השיחה פעילה - דבר באופן טבעי</p>
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                <span>מדבר עברית עם Gemini AI</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}