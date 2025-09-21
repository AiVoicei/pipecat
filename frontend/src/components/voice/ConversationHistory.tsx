import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { User, Bot, Clock, Copy, Trash2, VolumeX, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export interface ConversationMessage {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  language?: 'he' | 'en' | 'mixed';
  audioUrl?: string;
  isPlaying?: boolean;
  metadata?: {
    duration?: number;
    confidence?: number;
    processingTime?: number;
  };
}

interface ConversationHistoryProps {
  messages: ConversationMessage[];
  isLoading?: boolean;
  maxHeight?: string;
  showTimestamps?: boolean;
  showMetadata?: boolean;
  onClearHistory?: () => void;
  onPlayAudio?: (messageId: string) => void;
  onStopAudio?: (messageId: string) => void;
  className?: string;
}

export function ConversationHistory({
  messages,
  isLoading = false,
  maxHeight = "400px",
  showTimestamps = true,
  showMetadata = false,
  onClearHistory,
  onPlayAudio,
  onStopAudio,
  className
}: ConversationHistoryProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleCopyMessage = async (content: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (error) {
      console.error('Failed to copy message:', error);
    }
  };

  const detectLanguage = (text: string): 'he' | 'en' | 'mixed' => {
    const hebrewRegex = /[\u0590-\u05FF]/;
    const englishRegex = /[a-zA-Z]/;

    const hasHebrew = hebrewRegex.test(text);
    const hasEnglish = englishRegex.test(text);

    if (hasHebrew && hasEnglish) return 'mixed';
    if (hasHebrew) return 'he';
    return 'en';
  };

  const formatTimestamp = (timestamp: Date): string => {
    return timestamp.toLocaleTimeString('he-IL', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const renderMessage = (message: ConversationMessage) => {
    const isUser = message.type === 'user';
    const isSystem = message.type === 'system';
    const detectedLang = message.language || detectLanguage(message.content);

    return (
      <div
        key={message.id}
        className={cn(
          "group flex gap-3 py-4 px-4 rounded-lg transition-all duration-200 ai-fade-in",
          isUser && "bg-primary/5 border border-primary/10",
          !isUser && !isSystem && "bg-card/50 border border-border/50",
          isSystem && "bg-muted/30 border border-muted"
        )}
      >
        {/* Avatar */}
        <div className="flex-shrink-0">
          <Avatar className="w-8 h-8">
            <AvatarFallback
              className={cn(
                "text-xs font-medium",
                isUser && "bg-primary text-primary-foreground",
                !isUser && !isSystem && "bg-secondary text-secondary-foreground",
                isSystem && "bg-muted text-muted-foreground"
              )}
            >
              {isUser ? <User className="w-4 h-4" /> :
               isSystem ? "S" :
               <Bot className="w-4 h-4" />}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Message Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-card-foreground">
                {isUser ? "אתה" : isSystem ? "מערכת" : "AI Voicei"}
              </span>
              {detectedLang && (
                <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                  {detectedLang === 'he' ? 'עברית' :
                   detectedLang === 'en' ? 'English' : 'מעורב'}
                </Badge>
              )}
            </div>

            {showTimestamps && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span className="font-mono">{formatTimestamp(message.timestamp)}</span>
              </div>
            )}
          </div>

          {/* Message Text */}
          <div
            className={cn(
              "text-sm leading-relaxed",
              detectedLang === 'he' && "hebrew-body text-right",
              detectedLang === 'en' && "text-left",
              detectedLang === 'mixed' && "text-right hebrew-body",
              isSystem && "text-muted-foreground italic"
            )}
            dir={detectedLang === 'he' || detectedLang === 'mixed' ? 'rtl' : 'ltr'}
          >
            {message.content}
          </div>

          {/* Metadata */}
          {showMetadata && message.metadata && (
            <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
              {message.metadata.duration && (
                <span>משך: {message.metadata.duration.toFixed(1)}s</span>
              )}
              {message.metadata.confidence && (
                <span>דיוק: {(message.metadata.confidence * 100).toFixed(0)}%</span>
              )}
              {message.metadata.processingTime && (
                <span>עיבוד: {message.metadata.processingTime}ms</span>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="mt-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              size="sm"
              variant="ghost"
              className="h-6 px-2 text-xs"
              onClick={() => handleCopyMessage(message.content, message.id)}
            >
              <Copy className="w-3 h-3 ml-1" />
              {copiedMessageId === message.id ? "הועתק" : "העתק"}
            </Button>

            {message.audioUrl && (
              <Button
                size="sm"
                variant="ghost"
                className="h-6 px-2 text-xs"
                onClick={() => {
                  if (message.isPlaying) {
                    onStopAudio?.(message.id);
                  } else {
                    onPlayAudio?.(message.id);
                  }
                }}
              >
                {message.isPlaying ? (
                  <VolumeX className="w-3 h-3 ml-1" />
                ) : (
                  <Volume2 className="w-3 h-3 ml-1" />
                )}
                {message.isPlaying ? "עצור" : "נגן"}
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className={cn("ai-card", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h3 className="text-sm font-semibold text-card-foreground hebrew">היסטוריית שיחה</h3>
        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {messages.length} הודעות
            </Badge>
          )}
          {onClearHistory && messages.length > 0 && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 px-2 text-xs"
              onClick={onClearHistory}
            >
              <Trash2 className="w-3 h-3 ml-1" />
              נקה
            </Button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="overflow-y-auto p-2"
        style={{ maxHeight }}
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Bot className="w-12 h-12 text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground hebrew">
              השיחה תתחיל כאן...
            </p>
            <p className="text-xs text-muted-foreground mt-1 hebrew">
              לחץ על התחל שיחה כדי להתחיל לדבר עם AI Voicei
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map(renderMessage)}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex gap-3 py-4 px-4 rounded-lg bg-card/50 border border-border/50 ai-fade-in">
                <div className="flex-shrink-0">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-secondary text-secondary-foreground">
                      <Bot className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium text-card-foreground">AI Voicei</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground hebrew">
                    <span>חושב...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

// Compact version for sidebar
export function CompactConversationHistory({
  messages,
  className
}: {
  messages: ConversationMessage[];
  className?: string;
}) {
  const recentMessages = messages.slice(-3);

  return (
    <div className={cn("space-y-2", className)}>
      <h4 className="text-xs font-medium text-muted-foreground hebrew">שיחות אחרונות</h4>
      {recentMessages.length === 0 ? (
        <p className="text-xs text-muted-foreground hebrew">אין שיחות</p>
      ) : (
        <div className="space-y-1">
          {recentMessages.map((message) => (
            <div
              key={message.id}
              className="text-xs p-2 rounded bg-card/50 border border-border/30"
            >
              <div className="flex items-center gap-1 mb-1">
                {message.type === 'user' ? (
                  <User className="w-3 h-3" />
                ) : (
                  <Bot className="w-3 h-3" />
                )}
                <span className="font-medium">
                  {message.type === 'user' ? 'אתה' : 'AI'}
                </span>
              </div>
              <p className="truncate text-muted-foreground hebrew">
                {message.content}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}