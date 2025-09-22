'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { User, Bot, Clock, Trash2, Copy } from 'lucide-react'
import { useState } from 'react'

interface Message {
  id: string
  content: string
  isUser: boolean
  timestamp: Date
}

interface ConversationTestHistoryProps {
  messages: Message[]
  agentName: string
}

export function ConversationTestHistory({ messages, agentName }: ConversationTestHistoryProps) {
  const [hoveredMessage, setHoveredMessage] = useState<string | null>(null)

  const clearHistory = () => {
    // This would clear the messages in the parent component
    // For now, we'll just show it's available
  }

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content)
  }

  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Test Conversation
            </CardTitle>
            <CardDescription>
              Real-time conversation history with {agentName}
            </CardDescription>
          </div>
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearHistory}
              className="h-8 w-8 p-0"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[600px] px-6 pb-6">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-[200px] text-center">
              <div>
                <Bot className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-sm font-medium text-foreground mb-2">No conversation yet</h3>
                <p className="text-xs text-muted-foreground">
                  Start a test to see the conversation history
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 group transition-all duration-200 ${
                    message.isUser ? 'flex-row-reverse' : 'flex-row'
                  }`}
                  onMouseEnter={() => setHoveredMessage(message.id)}
                  onMouseLeave={() => setHoveredMessage(null)}
                >
                  {/* Avatar */}
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    message.isUser
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground'
                  }`}>
                    {message.isUser ? (
                      <User className="w-4 h-4" />
                    ) : (
                      <Bot className="w-4 h-4" />
                    )}
                  </div>

                  {/* Message Content */}
                  <div className={`flex-1 max-w-[80%] ${message.isUser ? 'text-right' : 'text-left'}`}>
                    {/* Header */}
                    <div className={`flex items-center gap-2 mb-1 ${
                      message.isUser ? 'justify-end' : 'justify-start'
                    }`}>
                      <Badge variant={message.isUser ? 'default' : 'secondary'} className="text-xs">
                        {message.isUser ? 'You' : agentName}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatTime(message.timestamp)}
                      </span>
                    </div>

                    {/* Message Bubble */}
                    <div className="relative">
                      <div className={`rounded-lg px-4 py-3 text-sm transition-all duration-200 ${
                        message.isUser
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted border border-border'
                      } ${hoveredMessage === message.id ? 'shadow-md' : ''}`}>
                        <p className="leading-relaxed">{message.content}</p>
                      </div>

                      {/* Copy Button */}
                      {hoveredMessage === message.id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`absolute top-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity ${
                            message.isUser ? 'left-1' : 'right-1'
                          }`}
                          onClick={() => copyMessage(message.content)}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Typing Indicator - Could be shown when agent is processing */}
              {false && (
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary" className="text-xs">
                        {agentName}
                      </Badge>
                      <span className="text-xs text-muted-foreground">typing...</span>
                    </div>
                    <div className="bg-muted border border-border rounded-lg px-4 py-3">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </CardContent>

      {/* Statistics Footer */}
      {messages.length > 0 && (
        <div className="border-t border-border px-6 py-4">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{messages.length} total messages</span>
            <span>
              {messages.filter(m => m.isUser).length} user, {messages.filter(m => !m.isUser).length} agent
            </span>
          </div>
        </div>
      )}
    </Card>
  )
}