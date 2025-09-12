import { Wifi, WifiOff, AlertCircle, Loader2 } from 'lucide-react';
import { useVoiceStore } from '@/stores/voiceStore';

export function ConnectionStatus() {
  const { connectionState, error } = useVoiceStore();

  const getStatusIcon = () => {
    switch (connectionState) {
      case 'connected':
        return <Wifi className="w-4 h-4" />;
      case 'connecting':
        return <Loader2 className="w-4 h-4 animate-spin" />;
      case 'error':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <WifiOff className="w-4 h-4" />;
    }
  };

  const getStatusText = () => {
    switch (connectionState) {
      case 'connected':
        return 'מחובר';
      case 'connecting':
        return 'מתחבר...';
      case 'error':
        return 'שגיאה';
      default:
        return 'לא מחובר';
    }
  };

  const getStatusClass = () => {
    switch (connectionState) {
      case 'connected':
        return 'status-connected';
      case 'connecting':
        return 'status-connecting';
      case 'error':
        return 'status-error';
      default:
        return 'status-idle';
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`${getStatusClass()} flex items-center gap-2 px-3 py-2 rounded-full text-xs font-medium`}>
        {getStatusIcon()}
        <span className="hebrew">{getStatusText()}</span>
      </div>
      {error && (
        <div className="text-xs text-destructive max-w-xs text-center bg-destructive/10 p-2 rounded border border-destructive/20">
          <span className="hebrew">{error}</span>
        </div>
      )}
    </div>
  );
}