'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Activity,
  Clock,
  MessageSquare,
  Zap,
  TrendingUp,
  Users,
  Mic,
  Bot
} from 'lucide-react'
import { useState, useEffect } from 'react'
import type { Agent } from '@/stores/useAgentStore'

interface AgentTestMetricsProps {
  agent: Agent
  isTestActive: boolean
  messageCount: number
}

export function AgentTestMetrics({ agent, isTestActive, messageCount }: AgentTestMetricsProps) {
  const [testDuration, setTestDuration] = useState(0)
  const [responseTime, setResponseTime] = useState(0)
  const [audioQuality, setAudioQuality] = useState(85)

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isTestActive) {
      interval = setInterval(() => {
        setTestDuration(prev => prev + 1)
        // Simulate varying response times
        setResponseTime(Math.floor(Math.random() * 500) + 200)
        // Simulate audio quality fluctuations
        setAudioQuality(Math.floor(Math.random() * 15) + 80)
      }, 1000)
    }

    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [isTestActive])

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }


  const getQualityBadgeVariant = (value: number) => {
    if (value >= 90) return 'default'
    if (value >= 70) return 'secondary'
    return 'destructive'
  }

  return (
    <div className="space-y-6">
      {/* Current Test Session */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="w-5 h-5 mr-2" />
            Current Test Session
          </CardTitle>
          <CardDescription>
            Real-time metrics for this test session
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">
                {formatDuration(testDuration)}
              </div>
              <div className="text-xs text-muted-foreground">Duration</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">
                {messageCount}
              </div>
              <div className="text-xs text-muted-foreground">Messages</div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Response Time</span>
              <Badge variant={responseTime < 300 ? 'default' : responseTime < 500 ? 'secondary' : 'destructive'}>
                {responseTime}ms
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Audio Quality</span>
              <Badge variant={getQualityBadgeVariant(audioQuality)}>
                {audioQuality}%
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Status</span>
              <Badge variant={isTestActive ? 'default' : 'secondary'}>
                {isTestActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Agent Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            Agent Performance
          </CardTitle>
          <CardDescription>
            Historical performance metrics
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-2 text-muted-foreground" />
                <span className="text-sm">Avg Response Time</span>
              </div>
              <span className="text-sm font-medium">{agent.analytics.averageResponseTime}ms</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <MessageSquare className="w-4 h-4 mr-2 text-muted-foreground" />
                <span className="text-sm">Total Conversations</span>
              </div>
              <span className="text-sm font-medium">{agent.analytics.totalConversations.toLocaleString()}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Users className="w-4 h-4 mr-2 text-muted-foreground" />
                <span className="text-sm">Satisfaction Score</span>
              </div>
              <div className="flex items-center">
                <span className="text-sm font-medium mr-2">{agent.analytics.satisfactionScore}/5.0</span>
                <Progress value={agent.analytics.satisfactionScore * 20} className="w-16 h-2" />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Activity className="w-4 h-4 mr-2 text-muted-foreground" />
                <span className="text-sm">Active Today</span>
              </div>
              <span className="text-sm font-medium">{agent.analytics.activeToday}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuration Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bot className="w-5 h-5 mr-2" />
            Test Configuration
          </CardTitle>
          <CardDescription>
            Current agent configuration being tested
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div>
              <div className="text-sm font-medium mb-1">Speech-to-Text</div>
              <div className="text-xs text-muted-foreground">
                {agent.configuration.stt.provider} • {agent.configuration.stt.model}
              </div>
              <div className="text-xs text-muted-foreground">
                Language: {agent.configuration.stt.language}
              </div>
            </div>

            <div>
              <div className="text-sm font-medium mb-1">Language Model</div>
              <div className="text-xs text-muted-foreground">
                {agent.configuration.llm.provider} • {agent.configuration.llm.model}
              </div>
              <div className="text-xs text-muted-foreground">
                Temperature: {agent.configuration.llm.temperature} • Max Tokens: {agent.configuration.llm.maxTokens}
              </div>
            </div>

            <div>
              <div className="text-sm font-medium mb-1">Text-to-Speech</div>
              <div className="text-xs text-muted-foreground">
                {agent.configuration.tts.provider}
              </div>
              <div className="text-xs text-muted-foreground">
                Voice: {agent.configuration.tts.voice}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Zap className="w-5 h-5 mr-2" />
            Quick Stats
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-primary">
                {isTestActive ? '●' : '○'}
              </div>
              <div className="text-xs text-muted-foreground">Live Status</div>
            </div>
            <div>
              <div className="text-lg font-bold text-foreground">
                {Math.floor(messageCount / 2)}
              </div>
              <div className="text-xs text-muted-foreground">Exchanges</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Tips */}
      {!isTestActive && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Mic className="w-5 h-5 mr-2" />
              Test Tips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Test different conversation scenarios</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Check response accuracy and timing</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Verify voice quality and clarity</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Test edge cases and error handling</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}