'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Play, Copy, Trash2, Power, PowerOff, Edit } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { useLanguage } from '@/contexts/LanguageContext'
import { useAgentStore } from '@/stores/useAgentStore'
import { Agent } from '@/services/api'
import { AppLayout } from '@/components/layout/AppLayout'
import { Bot } from 'lucide-react'
import Link from 'next/link'

export default function AgentDetailPage() {
  const { t } = useLanguage()
  const params = useParams()
  const router = useRouter()
  const agentId = params.id as string

  const {
    agents,
    isLoading,
    error,
    fetchAgents,
    deleteAgent,
    duplicateAgent,
    deployAgent,
    stopAgent
  } = useAgentStore()

  const [agent, setAgent] = useState<Agent | null>(null)

  useEffect(() => {
    if (agents.length === 0) {
      fetchAgents()
    } else {
      const foundAgent = agents.find(a => a.id === agentId)
      setAgent(foundAgent || null)
    }
  }, [agentId, agents, fetchAgents])

  useEffect(() => {
    if (agents.length > 0) {
      const foundAgent = agents.find(a => a.id === agentId)
      setAgent(foundAgent || null)
    }
  }, [agentId, agents])

  const handleDelete = async () => {
    if (confirm(t('confirmDelete', 'agents'))) {
      try {
        await deleteAgent(agentId)
        router.push('/agents')
      } catch (error) {
        console.error('Failed to delete agent:', error)
      }
    }
  }

  const handleDuplicate = async () => {
    try {
      const duplicatedAgent = await duplicateAgent(agentId)
      router.push(`/agents/${duplicatedAgent.id}`)
    } catch (error) {
      console.error('Failed to duplicate agent:', error)
    }
  }

  const handleDeploy = async () => {
    try {
      await deployAgent(agentId)
    } catch (error) {
      console.error('Failed to deploy agent:', error)
    }
  }

  const handleStop = async () => {
    try {
      await stopAgent(agentId)
    } catch (error) {
      console.error('Failed to stop agent:', error)
    }
  }

  const getStatusColor = (status: Agent['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/10 text-green-700 dark:text-green-400'
      case 'inactive':
        return 'bg-red-500/10 text-red-700 dark:text-red-400'
      case 'draft':
        return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400'
      default:
        return 'bg-gray-500/10 text-gray-700 dark:text-gray-400'
    }
  }

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-8 w-64 bg-muted rounded mb-2"></div>
            <div className="h-4 w-96 bg-muted/50 rounded"></div>
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-64 bg-muted rounded-lg"></div>
              </div>
            ))}
          </div>
        </div>
      </AppLayout>
    )
  }

  if (!agent) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/agents">
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t('back', 'common')}
              </Link>
            </Button>
            <h1 className="text-3xl font-bold text-foreground">{t('agentNotFound', 'agents')}</h1>
          </div>
          <Card className="p-8 text-center">
            <Bot className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t('agentNotFound', 'agents')}</h3>
            <p className="text-muted-foreground mb-4">{t('agentNotFoundDesc', 'agents')}</p>
            <Button asChild>
              <Link href="/agents">{t('backToAgents', 'agents')}</Link>
            </Button>
          </Card>
        </div>
      </AppLayout>
    )
  }

  if (error) {
    return (
      <AppLayout>
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">{error}</p>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/agents">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('back', 'common')}
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <Avatar className="w-12 h-12">
              <AvatarFallback className="bg-primary text-primary-foreground">
                <Bot className="w-6 h-6" />
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl font-bold text-foreground">{agent.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={getStatusColor(agent.status)}>
                  {t(agent.status, 'dashboard')}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {t('lastUpdated', 'agents')}: {new Date(agent.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/agents/${agent.id}/test`}>
              <Play className="w-4 h-4 mr-2" />
              {t('test', 'agents')}
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/agents/${agent.id}/edit`}>
              <Edit className="w-4 h-4 mr-2" />
              {t('edit', 'agents')}
            </Link>
          </Button>
          <Button
            variant="outline"
            onClick={handleDuplicate}
            disabled={isLoading}
          >
            <Copy className="w-4 h-4 mr-2" />
            {t('duplicate', 'agents')}
          </Button>
          {agent.status === 'active' ? (
            <Button
              variant="outline"
              onClick={handleStop}
              disabled={isLoading}
              className="text-red-600 hover:text-red-700"
            >
              <PowerOff className="w-4 h-4 mr-2" />
              {t('stop', 'agents')}
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={handleDeploy}
              disabled={isLoading}
              className="text-green-600 hover:text-green-700"
            >
              <Power className="w-4 h-4 mr-2" />
              {t('deploy', 'agents')}
            </Button>
          )}
          <Button
            variant="outline"
            onClick={handleDelete}
            disabled={isLoading}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Overview */}
        <Card>
          <CardHeader>
            <CardTitle>{t('overview', 'agents')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-1">{t('description', 'agents')}</h4>
              <p className="text-sm">{agent.description}</p>
            </div>

            <Separator />

            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-1">{t('deploymentType', 'agents')}</h4>
              <p className="text-sm font-medium">{agent.deploymentConfig.type.toUpperCase()}</p>
            </div>

            {agent.templateId && (
              <>
                <Separator />
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">{t('template', 'agents')}</h4>
                  <p className="text-sm font-medium">{agent.templateId}</p>
                </div>
              </>
            )}

            <Separator />

            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-1">{t('created', 'agents')}</h4>
              <p className="text-sm">{new Date(agent.createdAt).toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>

        {/* Analytics */}
        <Card>
          <CardHeader>
            <CardTitle>{t('analytics', 'agents')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-2xl font-bold">{agent.analytics.totalConversations}</div>
                <p className="text-xs text-muted-foreground">{t('totalConversations', 'agents')}</p>
              </div>
              <div>
                <div className="text-2xl font-bold">{agent.analytics.activeToday}</div>
                <p className="text-xs text-muted-foreground">{t('activeToday', 'agents')}</p>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-2xl font-bold">{agent.analytics.averageResponseTime}ms</div>
                <p className="text-xs text-muted-foreground">{t('avgResponseTime', 'dashboard')}</p>
              </div>
              <div>
                <div className="text-2xl font-bold">⭐ {agent.analytics.satisfactionScore}</div>
                <p className="text-xs text-muted-foreground">{t('satisfaction', 'dashboard')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>{t('configuration', 'agents')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-2">{t('speechToText', 'agents')}</h4>
              <div className="text-sm space-y-1">
                <div><strong>{t('provider', 'agents')}:</strong> {agent.configuration.stt.provider}</div>
                <div><strong>{t('model', 'agents')}:</strong> {agent.configuration.stt.model}</div>
                <div><strong>{t('language', 'agents')}:</strong> {agent.configuration.stt.language}</div>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-2">{t('languageModel', 'agents')}</h4>
              <div className="text-sm space-y-1">
                <div><strong>{t('provider', 'agents')}:</strong> {agent.configuration.llm.provider}</div>
                <div><strong>{t('model', 'agents')}:</strong> {agent.configuration.llm.model}</div>
                <div><strong>{t('temperature', 'agents')}:</strong> {agent.configuration.llm.temperature}</div>
                <div><strong>{t('maxTokens', 'agents')}:</strong> {agent.configuration.llm.maxTokens}</div>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-2">{t('textToSpeech', 'agents')}</h4>
              <div className="text-sm space-y-1">
                <div><strong>{t('provider', 'agents')}:</strong> {agent.configuration.tts.provider}</div>
                <div><strong>{t('voice', 'agents')}:</strong> {agent.configuration.tts.voice}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Prompt */}
      <Card>
        <CardHeader>
          <CardTitle>{t('systemPrompt', 'agents')}</CardTitle>
          <CardDescription>
            {t('systemPromptDesc', 'agents')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted p-4 rounded-lg">
            <pre className="text-sm whitespace-pre-wrap font-mono">
              {agent.configuration.llm.systemPrompt}
            </pre>
          </div>
        </CardContent>
      </Card>
      </div>
    </AppLayout>
  )
}