import { Mic, MicOff, Phone, PhoneOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useVoiceChat } from '@/hooks/useVoiceChat';

interface VoiceChatProps {
  botUrl?: string;
}

export function VoiceChat({ botUrl = 'http://localhost:7860' }: VoiceChatProps) {
  const { 
    isConnected, 
    isCallActive, 
    connectionState, 
    error, 
    startCall, 
    endCall 
  } = useVoiceChat({ botUrl });

  const getStatusBadge = () => {
    switch (connectionState) {
      case 'connected':
        return <Badge variant="default" className="bg-green-500">מחובר</Badge>;
      case 'connecting':
        return <Badge variant="secondary">מתחבר...</Badge>;
      case 'error':
        return <Badge variant="destructive">שגיאה</Badge>;
      default:
        return <Badge variant="outline">לא מחובר</Badge>;
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto p-6">
      <div className="text-center space-y-6">
        {/* Status */}
        <div className="flex justify-center">
          {getStatusBadge()}
        </div>

        {/* Voice Indicator */}
        <div className="relative">
          <div className={`w-24 h-24 mx-auto rounded-full border-4 flex items-center justify-center ${
            isCallActive 
              ? 'border-green-500 bg-green-50 animate-pulse' 
              : 'border-gray-300 bg-gray-50'
          }`}>
            {isCallActive ? (
              <Mic className="w-8 h-8 text-green-600" />
            ) : (
              <MicOff className="w-8 h-8 text-gray-400" />
            )}
          </div>
          
          {/* Pulse animation for active call */}
          {isCallActive && (
            <div className="absolute inset-0 rounded-full border-4 border-green-500 animate-ping"></div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Controls */}
        <div className="flex justify-center space-x-4">
          {!isCallActive ? (
            <Button 
              onClick={startCall}
              disabled={connectionState === 'connecting'}
              className="bg-green-600 hover:bg-green-700"
              size="lg"
            >
              <Phone className="w-5 h-5 mr-2" />
              התחל שיחה
            </Button>
          ) : (
            <Button 
              onClick={endCall}
              variant="destructive"
              size="lg"
            >
              <PhoneOff className="w-5 h-5 mr-2" />
              סיים שיחה
            </Button>
          )}
        </div>

        {/* Instructions */}
        <div className="text-sm text-gray-600 text-center">
          {!isCallActive ? (
            <p>לחץ להתחלת שיחה עם AI Voicei</p>
          ) : (
            <p>השיחה פעילה - דבר באופן טבעי</p>
          )}
        </div>
      </div>
    </Card>
  );
}