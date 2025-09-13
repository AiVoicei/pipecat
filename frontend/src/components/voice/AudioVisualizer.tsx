import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface AudioVisualizerProps {
  isActive: boolean;
  activityLevel?: 'low' | 'medium' | 'high';
  className?: string;
  variant?: 'bars' | 'circle' | 'waveform';
}

export function AudioVisualizer({
  isActive,
  activityLevel = 'medium',
  className,
  variant = 'bars'
}: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [barHeights, setBarHeights] = useState<number[]>([]);

  // Initialize bar heights
  useEffect(() => {
    const initialHeights = Array.from({ length: 5 }, () => Math.random() * 0.5 + 0.1);
    setBarHeights(initialHeights);
  }, []);

  useEffect(() => {
    if (!isActive) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      return;
    }

    const animate = () => {
      if (!isActive) return;

      // Update bar heights based on activity level
      setBarHeights(prev => prev.map((height, index) => {
        const baseIntensity = activityLevel === 'high' ? 0.8 :
                              activityLevel === 'medium' ? 0.5 : 0.3;
        const randomVariation = Math.random() * 0.4 - 0.2;
        const newHeight = Math.max(0.1, Math.min(1, baseIntensity + randomVariation));

        // Smooth transition
        return prev[index] * 0.7 + newHeight * 0.3;
      }));

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive, activityLevel]);

  if (variant === 'bars') {
    return (
      <div className={cn("flex items-end justify-center gap-1 h-16", className)}>
        {barHeights.map((height, index) => (
          <div
            key={index}
            className={cn(
              "bg-primary rounded-full transition-all duration-75",
              isActive ? "opacity-100" : "opacity-30",
              index === 0 || index === 4 ? "w-1.5" : "w-2",
              index === 2 ? "w-2.5" : ""
            )}
            style={{
              height: isActive ? `${height * 100}%` : '20%',
              minHeight: '8px'
            }}
          />
        ))}
      </div>
    );
  }

  if (variant === 'circle') {
    return (
      <div className={cn("relative w-32 h-32", className)}>
        <div className={cn(
          "absolute inset-0 rounded-full border-2 transition-all duration-300",
          isActive
            ? "border-primary bg-primary/10 ai-glow-pulse"
            : "border-border bg-card/50"
        )}>
          <div className="absolute inset-2 rounded-full flex items-center justify-center">
            {isActive && (
              <div className="flex items-end justify-center gap-0.5 h-8">
                {barHeights.slice(0, 3).map((height, index) => (
                  <div
                    key={index}
                    className="bg-primary rounded-full w-1"
                    style={{
                      height: `${height * 100}%`,
                      minHeight: '4px'
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Pulse rings */}
        {isActive && (
          <>
            <div className="absolute inset-0 rounded-full border border-primary/30 animate-ping"
                 style={{ animationDuration: '1.5s' }} />
            <div className="absolute inset-2 rounded-full border border-primary/20 animate-ping"
                 style={{ animationDuration: '2s', animationDelay: '0.5s' }} />
          </>
        )}
      </div>
    );
  }

  if (variant === 'waveform') {
    return (
      <div className={cn("flex items-center justify-center h-16", className)}>
        <svg width="200" height="60" className="overflow-visible">
          <defs>
            <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.1" />
              <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity="0.8" />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.1" />
            </linearGradient>
          </defs>

          {/* Waveform path */}
          <path
            d={`M 0 30 ${barHeights.map((height, index) =>
              `L ${(index + 1) * 40} ${30 + (isActive ? height * 20 - 10 : 0)}`
            ).join(' ')} L 200 30`}
            stroke="hsl(var(--primary))"
            strokeWidth="2"
            fill="url(#waveGradient)"
            className={cn(
              "transition-all duration-300",
              isActive ? "opacity-100" : "opacity-30"
            )}
          />

          {/* Center line */}
          <line
            x1="0"
            y1="30"
            x2="200"
            y2="30"
            stroke="hsl(var(--border))"
            strokeWidth="1"
            opacity="0.5"
          />
        </svg>
      </div>
    );
  }

  return null;
}

// Additional specialized visualizers
export function VoiceActivityIndicator({
  isActive,
  activityLevel = 'medium',
  className
}: AudioVisualizerProps) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className={cn(
        "w-2 h-2 rounded-full transition-all duration-300",
        isActive
          ? "bg-primary shadow-sm shadow-primary/50"
          : "bg-muted-foreground/30"
      )} />

      <div className={cn(
        "w-1.5 h-1.5 rounded-full transition-all duration-300",
        isActive && activityLevel !== 'low'
          ? "bg-primary shadow-sm shadow-primary/50 ai-bounce-subtle"
          : "bg-muted-foreground/20"
      )} />

      <div className={cn(
        "w-1 h-1 rounded-full transition-all duration-300",
        isActive && activityLevel === 'high'
          ? "bg-primary shadow-sm shadow-primary/50 ai-bounce-subtle"
          : "bg-muted-foreground/10"
      )}
      style={{ animationDelay: '0.2s' }} />
    </div>
  );
}

// Compact version for header
export function CompactAudioVisualizer({ isActive, className }: { isActive: boolean; className?: string }) {
  const [bars] = useState(() => Array.from({ length: 3 }, () => Math.random() * 0.5 + 0.3));

  return (
    <div className={cn("flex items-end gap-0.5 h-4", className)}>
      {bars.map((height, index) => (
        <div
          key={index}
          className={cn(
            "bg-primary rounded-full w-0.5 transition-all duration-300",
            isActive
              ? `voice-activity-${index === 0 ? 'low' : index === 1 ? 'high' : 'medium'}`
              : "",
            !isActive && "opacity-30"
          )}
          style={{
            height: isActive ? `${height * 100}%` : '25%',
            minHeight: '2px'
          }}
        />
      ))}
    </div>
  );
}