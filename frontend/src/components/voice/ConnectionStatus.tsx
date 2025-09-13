import React, { useEffect, useState } from 'react';
import { Wifi, WifiOff, AlertCircle, Loader2, CheckCircle, XCircle, Clock, Signal, Zap } from 'lucide-react';
import { useVoiceStore } from '@/stores/voiceStore';
import { CompactAudioVisualizer } from './AudioVisualizer';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface ConnectionMetrics {
  latency: number | null;
  quality: 'excellent' | 'good' | 'fair' | 'poor' | null;
  uptime: number;
  lastConnected: Date | null;
}

export function ConnectionStatus() {
  const { connectionState, error, isCallActive, sessionId } = useVoiceStore();
  const [metrics, setMetrics] = useState<ConnectionMetrics>({
    latency: null,
    quality: null,
    uptime: 0,
    lastConnected: null
  });
  const [expanded, setExpanded] = useState(false);

  // Simulate connection metrics (in real implementation, these would come from actual measurements)
  useEffect(() => {
    if (connectionState === 'connected') {
      const interval = setInterval(() => {
        setMetrics(prev => ({
          latency: Math.random() * 200 + 100, // 100-300ms
          quality: ['excellent', 'good', 'fair'][Math.floor(Math.random() * 3)] as any,
          uptime: prev.uptime + 1,
          lastConnected: prev.lastConnected || new Date()
        }));
      }, 5000);

      return () => clearInterval(interval);
    } else {
      setMetrics(prev => ({
        ...prev,
        latency: null,
        quality: null,
        uptime: 0
      }));
    }
  }, [connectionState]);

  const getStatusIcon = () => {
    switch (connectionState) {
      case 'connected':
        return <CheckCircle className="w-4 h-4" />;
      case 'connecting':
        return <Loader2 className="w-4 h-4 animate-spin" />;
      case 'error':
        return <XCircle className="w-4 h-4" />;
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

  const getQualityColor = (quality: string | null) => {
    switch (quality) {
      case 'excellent':
        return 'text-green-400';
      case 'good':
        return 'text-yellow-400';
      case 'fair':
        return 'text-orange-400';
      case 'poor':
        return 'text-red-400';
      default:
        return 'text-muted-foreground';
    }
  };

  const formatUptime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
  };

  // Compact version for mobile/header
  if (!expanded) {
    return (
      <div className="flex flex-col items-center gap-2">
        <button
          onClick={() => setExpanded(true)}
          className={cn(
            `${getStatusClass()} flex items-center gap-2 px-3 py-2 rounded-full text-xs font-medium transition-all duration-200 hover:scale-105 cursor-pointer`,
            "focus:outline-none focus:ring-2 focus:ring-primary/50"
          )}
        >
          {getStatusIcon()}
          <span className="hebrew">{getStatusText()}</span>
          {connectionState === 'connected' && isCallActive && (
            <CompactAudioVisualizer isActive={isCallActive} className="mr-1" />
          )}
        </button>

        {error && (
          <div className="text-xs text-destructive max-w-xs text-center bg-destructive/10 p-2 rounded border border-destructive/20 ai-fade-in">
            <span className="hebrew">{error}</span>
          </div>
        )}
      </div>
    );
  }

  // Expanded detailed view
  return (
    <Card className="ai-card w-80 p-4">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-card-foreground hebrew">מצב חיבור</h3>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 px-2 text-xs"
            onClick={() => setExpanded(false)}
          >
            ✕
          </Button>
        </div>

        {/* Main Status */}
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-2 rounded-full",
            connectionState === 'connected' && "bg-primary/10",
            connectionState === 'connecting' && "bg-yellow-400/10",
            connectionState === 'error' && "bg-destructive/10",
            connectionState === 'idle' && "bg-muted/20"
          )}>
            {getStatusIcon()}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-card-foreground hebrew">
                {getStatusText()}
              </span>
              {connectionState === 'connected' && (
                <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                  פעיל
                </Badge>
              )}
            </div>
            {sessionId && (
              <p className="text-xs text-muted-foreground font-mono mt-1">
                {sessionId.slice(0, 8)}...
              </p>
            )}
          </div>
        </div>

        {/* Connection Metrics */}
        {connectionState === 'connected' && (
          <div className="grid grid-cols-2 gap-3">
            {/* Latency */}
            <div className="bg-card/50 p-3 rounded-lg border border-border/30">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-3 h-3 text-primary" />
                <span className="text-xs font-medium text-card-foreground">זמן תגובה</span>
              </div>
              <p className="text-sm font-semibold">
                {metrics.latency ? `${Math.round(metrics.latency)}ms` : '--'}
              </p>
            </div>

            {/* Quality */}
            <div className="bg-card/50 p-3 rounded-lg border border-border/30">
              <div className="flex items-center gap-2 mb-1">
                <Signal className="w-3 h-3 text-primary" />
                <span className="text-xs font-medium text-card-foreground">איכות</span>
              </div>
              <p className={cn("text-sm font-semibold", getQualityColor(metrics.quality))}>
                {metrics.quality === 'excellent' ? 'מעולה' :
                 metrics.quality === 'good' ? 'טוב' :
                 metrics.quality === 'fair' ? 'בינוני' :
                 metrics.quality === 'poor' ? 'נמוך' : '--'}
              </p>
            </div>

            {/* Uptime */}
            <div className="bg-card/50 p-3 rounded-lg border border-border/30">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-3 h-3 text-primary" />
                <span className="text-xs font-medium text-card-foreground">זמן חיבור</span>
              </div>
              <p className="text-sm font-semibold">
                {formatUptime(metrics.uptime)}
              </p>
            </div>

            {/* Voice Activity */}
            <div className="bg-card/50 p-3 rounded-lg border border-border/30">
              <div className="flex items-center gap-2 mb-1">
                <Wifi className="w-3 h-3 text-primary" />
                <span className="text-xs font-medium text-card-foreground">שמע</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">
                  {isCallActive ? 'פעיל' : 'לא פעיל'}
                </span>
                {isCallActive && <CompactAudioVisualizer isActive={true} />}
              </div>
            </div>
          </div>
        )}

        {/* Error Details */}
        {error && (
          <div className="bg-destructive/10 p-3 rounded-lg border border-destructive/20">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-destructive">שגיאת חיבור</p>
                <p className="text-xs text-destructive/80 mt-1 hebrew">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Connection Tips */}
        {connectionState !== 'connected' && (
          <div className="bg-muted/30 p-3 rounded-lg border border-border/30">
            <p className="text-xs font-medium text-card-foreground mb-2 hebrew">טיפים לחיבור טוב יותר:</p>
            <ul className="text-xs text-muted-foreground space-y-1 hebrew">
              <li>• וודא חיבור אינטרנט יציב</li>
              <li>• בדוק הרשאות מיקרופון</li>
              <li>• נסה לרענן את הדף</li>
            </ul>
          </div>
        )}

        {/* Technical Details Toggle */}
        {connectionState === 'connected' && (
          <details className="text-xs">
            <summary className="cursor-pointer text-muted-foreground hover:text-card-foreground transition-colors hebrew">
              פרטים טכניים
            </summary>
            <div className="mt-2 space-y-1 text-muted-foreground font-mono">
              <div>Transport: WebRTC</div>
              <div>Protocol: RTVI</div>
              <div>Codec: Opus</div>
              <div>Sample Rate: 48kHz</div>
              {metrics.lastConnected && (
                <div>Connected: {metrics.lastConnected.toLocaleTimeString('he-IL')}</div>
              )}
            </div>
          </details>
        )}
      </div>
    </Card>
  );
}