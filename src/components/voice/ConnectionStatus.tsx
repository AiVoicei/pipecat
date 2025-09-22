import { Wifi, WifiOff, AlertCircle, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useVoiceStore } from '@/stores/voiceStore';

export function ConnectionStatus() {
  const { connectionState, isConnected } = useVoiceStore();

  const getStatusIcon = () => {
    switch (connectionState) {
      case 'connected':
        return <Wifi className="w-4 h-4 text-green-600" />;
      case 'connecting':
        return <Loader2 className="w-4 h-4 text-primary animate-spin" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <WifiOff className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusText = () => {
    switch (connectionState) {
      case 'connected':
        return 'מחובר';
      case 'connecting':
        return 'מתחבר...';
      case 'error':
        return 'שגיאת חיבור';
      default:
        return 'לא מחובר';
    }
  };

  const getStatusVariant = () => {
    switch (connectionState) {
      case 'connected':
        return 'default' as const;
      case 'connecting':
        return 'secondary' as const;
      case 'error':
        return 'destructive' as const;
      default:
        return 'outline' as const;
    }
  };

  return (
    <Badge variant={getStatusVariant()} className="flex items-center gap-2">
      {getStatusIcon()}
      {getStatusText()}
    </Badge>
  );
}