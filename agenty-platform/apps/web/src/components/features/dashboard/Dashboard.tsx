'use client'

import { useEffect, useState } from 'react'
import { Bot, Users, MessageSquare, TrendingUp, Plus, Play, Settings2, TestTube } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useLanguage } from '@/contexts/LanguageContext'
import { useAgentStore } from '@/stores/useAgentStore'
import Link from 'next/link'

export function Dashboard() {
  const { t } = useLanguage()
  const { agents, isLoading, fetchAgents, getActiveAgents, getTotalConversations } = useAgentStore()

  useEffect(() => {
    fetchAgents()
  }, [fetchAgents])

  // Calculate analytics from real data
  const analytics = {
    totalAgents: agents.length,
    activeAgents: getActiveAgents().length,
    totalConversations: getTotalConversations(),
    conversationsToday: agents.reduce((sum, agent) => sum + agent.analytics.activeToday, 0),
    averageResponseTime: agents.length > 0
      ? Math.round(agents.reduce((sum, agent) => sum + agent.analytics.averageResponseTime, 0) / agents.length)
      : 0,
    satisfactionScore: agents.length > 0
      ? Math.round((agents.reduce((sum, agent) => sum + agent.analytics.satisfactionScore, 0) / agents.length) * 10) / 10
      : 0,
    monthlyGrowth: {
      conversations: 12.5,
      responseTime: -8.3,
      satisfaction: 2.1
    }
  }

  const recentAgents = agents
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 3)

  if (isLoading && agents.length === 0) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 w-64 bg-muted rounded mb-2"></div>
          <div className="h-4 w-96 bg-muted/50 rounded"></div>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-32 bg-muted rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t('title', 'dashboard')}</h1>
          <p className="text-muted-foreground mt-1">
            {t('monitorAgents', 'dashboard')}
          </p>
        </div>
        <Button asChild className="bg-primary hover:bg-primary/90">
          <Link href="/agents/new">
            <Plus className="w-4 h-4 mr-2" />
            {t('createAgent', 'navigation')}
          </Link>
        </Button>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('totalAgents', 'dashboard')}</CardTitle>
            <Bot className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalAgents}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.activeAgents} {t('active', 'dashboard')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('conversations', 'dashboard')}</CardTitle>
            <MessageSquare className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalConversations.toLocaleString()}</div>
            <p className="text-xs text-emerald-600">
              +{analytics.monthlyGrowth.conversations}% {t('fromLastMonth', 'dashboard')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('avgResponseTime', 'dashboard')}</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.averageResponseTime}ms</div>
            <p className="text-xs text-emerald-600">
              {analytics.monthlyGrowth.responseTime}% {t('improvement', 'dashboard')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('satisfaction', 'dashboard')}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.satisfactionScore}/5</div>
            <p className="text-xs text-emerald-600">
              +{analytics.monthlyGrowth.satisfaction}% {t('fromLastMonth', 'dashboard')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Agents */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{t('yourAgents', 'dashboard')}</CardTitle>
            <CardDescription>
              {t('manageAndMonitor', 'dashboard')}
            </CardDescription>
          </div>
          <Button variant="outline" asChild>
            <Link href="/agents">{t('viewAll', 'dashboard')}</Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentAgents.length === 0 ? (
              <div className="text-center py-8">
                <Bot className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">{t('noAgentsYet', 'agents')}</h3>
                <p className="text-muted-foreground mb-4">{t('createFirstAgent', 'agents')}</p>
                <Button asChild>
                  <Link href="/agents/new">
                    <Plus className="w-4 h-4 mr-2" />
                    {t('createAgent', 'navigation')}
                  </Link>
                </Button>
              </div>
            ) : (
              recentAgents.map((agent) => (
                <div key={agent.id} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors">
                  <div className="flex items-center space-x-4">
                    <Avatar>
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        <Bot className="w-4 h-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-medium">{agent.name}</h3>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span>{agent.analytics.totalConversations} {t('conversations_', 'dashboard')}</span>
                        <span>⭐ {agent.analytics.satisfactionScore}</span>
                        <span>{agent.analytics.averageResponseTime}ms avg</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={agent.status === 'active' ? 'default' : 'secondary'}>
                      {t(agent.status, 'dashboard')}
                    </Badge>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/agents/${agent.id}`}>
                        <Settings2 className="w-4 h-4" />
                      </Link>
                    </Button>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/agents/${agent.id}/test`}>
                        <Play className="w-4 h-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>{t('quickActions', 'dashboard')}</CardTitle>
          <CardDescription>
            {t('getStartedCommon', 'dashboard')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Button variant="outline" className="h-20 flex-col space-y-2" asChild>
              <Link href="/agents/new">
                <Plus className="w-6 h-6" />
                <span>{t('createNewAgent', 'dashboard')}</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2" asChild>
              <Link href="/templates">
                <Bot className="w-6 h-6" />
                <span>{t('browseTemplates', 'dashboard')}</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2" asChild>
              <Link href="/analytics">
                <TrendingUp className="w-6 h-6" />
                <span>{t('viewAnalytics', 'dashboard')}</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2" asChild>
              <Link href="/agents/agt_1/test">
                <TestTube className="w-6 h-6" />
                <span>{t('testAgent', 'dashboard')}</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}