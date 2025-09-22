'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { VoiceTestChat } from './VoiceTestChat'
import { ConversationTestHistory } from './ConversationTestHistory'
import { AgentTestMetrics } from './AgentTestMetrics'
import { useAgentStore } from '@/stores/useAgentStore'
import { useLanguage } from '@/contexts/LanguageContext'
import { ArrowLeft, Play, Square, Settings, TestTube, Bot } from 'lucide-react'
import Link from 'next/link'

interface AgentTestInterfaceProps {
  agentId: string
}

export function AgentTestInterface({ agentId }: AgentTestInterfaceProps) {
  const { agents, selectedAgent, setSelectedAgent } = useAgentStore()
  const { t } = useLanguage()
  const [isTestActive, setIsTestActive] = useState(false)
  const [testMessages, setTestMessages] = useState<Array<{
    id: string
    content: string
    isUser: boolean
    timestamp: Date
  }>>([])

  useEffect(() => {
    const agent = agents.find(a => a.id === agentId)
    if (agent) {
      setSelectedAgent(agent)
    }
  }, [agentId, agents, setSelectedAgent])

  const handleStartTest = () => {
    setIsTestActive(true)
    setTestMessages([])
  }

  const handleStopTest = () => {
    setIsTestActive(false)
  }

  const handleMessage = (message: string, isUser: boolean) => {
    const newMessage = {
      id: Date.now().toString(),
      content: message,
      isUser,
      timestamp: new Date()
    }
    setTestMessages(prev => [...prev, newMessage])
  }

  if (!selectedAgent) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="text-center">
          <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Agent Not Found</h3>
          <p className="text-muted-foreground">The requested agent could not be found.</p>
          <Button asChild className="mt-4">
            <Link href="/agents">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Agents
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/agents/${agentId}`}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Agent
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Test Agent</h1>
            <p className="text-muted-foreground mt-1">
              Test your agent&apos;s voice interaction capabilities
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Badge variant={selectedAgent.status === 'active' ? 'default' : 'secondary'}>
            {t(selectedAgent.status, 'dashboard')}
          </Badge>
          <Button variant="outline" asChild>
            <Link href={`/agents/${agentId}/settings`}>
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Link>
          </Button>
        </div>
      </div>

      {/* Agent Info Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <Bot className="w-5 h-5 mr-2" />
                {selectedAgent.name}
              </CardTitle>
              <CardDescription>{selectedAgent.description}</CardDescription>
            </div>
            <TestTube className="w-8 h-8 text-primary" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h4 className="text-sm font-medium text-foreground mb-2">Speech-to-Text</h4>
              <p className="text-sm text-muted-foreground">
                {selectedAgent.configuration.stt.provider} ({selectedAgent.configuration.stt.model})
              </p>
              <p className="text-xs text-muted-foreground">
                Language: {selectedAgent.configuration.stt.language}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-foreground mb-2">Language Model</h4>
              <p className="text-sm text-muted-foreground">
                {selectedAgent.configuration.llm.provider} ({selectedAgent.configuration.llm.model})
              </p>
              <p className="text-xs text-muted-foreground">
                Temperature: {selectedAgent.configuration.llm.temperature}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-foreground mb-2">Text-to-Speech</h4>
              <p className="text-sm text-muted-foreground">
                {selectedAgent.configuration.tts.provider}
              </p>
              <p className="text-xs text-muted-foreground">
                Voice: {selectedAgent.configuration.tts.voice}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Interface */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Voice Chat Interface */}
        <div className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Voice Test Interface
                <div className="flex space-x-2">
                  {!isTestActive ? (
                    <Button onClick={handleStartTest} size="sm">
                      <Play className="w-4 h-4 mr-2" />
                      Start Test
                    </Button>
                  ) : (
                    <Button onClick={handleStopTest} variant="destructive" size="sm">
                      <Square className="w-4 h-4 mr-2" />
                      Stop Test
                    </Button>
                  )}
                </div>
              </CardTitle>
              <CardDescription>
                Test real-time voice interaction with your agent
              </CardDescription>
            </CardHeader>
            <CardContent>
              <VoiceTestChat
                agent={selectedAgent}
                isActive={isTestActive}
                onMessage={handleMessage}
                onTestStateChange={setIsTestActive}
              />
            </CardContent>
          </Card>
        </div>

        {/* Conversation History */}
        <div className="lg:col-span-1">
          <ConversationTestHistory
            messages={testMessages}
            agentName={selectedAgent.name}
          />
        </div>

        {/* Test Metrics */}
        <div className="lg:col-span-1">
          <AgentTestMetrics
            agent={selectedAgent}
            isTestActive={isTestActive}
            messageCount={testMessages.length}
          />
        </div>
      </div>

      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle>System Information</CardTitle>
          <CardDescription>
            Technical details about the agent configuration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-foreground mb-3">Agent Configuration</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Agent ID:</span>
                  <span className="font-mono">{selectedAgent.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Template:</span>
                  <span>{selectedAgent.templateId || 'Custom'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Deployment:</span>
                  <span>{selectedAgent.deploymentConfig.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Max Tokens:</span>
                  <span>{selectedAgent.configuration.llm.maxTokens}</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-foreground mb-3">Performance Metrics</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Conversations:</span>
                  <span>{selectedAgent.analytics.totalConversations.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Avg Response Time:</span>
                  <span>{selectedAgent.analytics.averageResponseTime}ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Satisfaction Score:</span>
                  <span>{selectedAgent.analytics.satisfactionScore}/5.0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Active Today:</span>
                  <span>{selectedAgent.analytics.activeToday}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}