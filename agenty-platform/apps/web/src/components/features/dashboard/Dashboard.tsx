'use client'

import { useEffect, useState } from 'react'
import { Bot, Users, MessageSquare, TrendingUp, Plus, Play, Settings2, TestTube } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useLanguage } from '@/contexts/LanguageContext'
import Link from 'next/link'

// Mock data - will be replaced with actual API calls
const mockAnalytics = {
  totalAgents: 5,
  activeAgents: 3,
  totalConversations: 2432,
  conversationsToday: 43,
  averageResponseTime: 856,
  satisfactionScore: 4.6,
  monthlyGrowth: {
    conversations: 12.5,
    responseTime: -8.3,
    satisfaction: 2.1
  }
}

// Mock agents with translation keys
const getMockAgents = (t: (key: string, namespace?: string) => string) => [
  {
    id: 'agt_1',
    name: t('customerSupportBot', 'dashboard'),
    status: 'active' as const,
    conversations: 1247,
    satisfaction: 4.6,
    responseTime: 850
  },
  {
    id: 'agt_2',
    name: t('salesAssistant', 'dashboard'),
    status: 'active' as const,
    conversations: 687,
    satisfaction: 4.8,
    responseTime: 920
  },
  {
    id: 'agt_3',
    name: t('hebrewSupportBot', 'dashboard'),
    status: 'active' as const,
    conversations: 342,
    satisfaction: 4.4,
    responseTime: 780
  }
]

export function Dashboard() {
  const [isLoading, setIsLoading] = useState(true)
  const { t } = useLanguage()
  const mockAgents = getMockAgents(t)

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setIsLoading(false), 1000)
    return () => clearTimeout(timer)
  }, [])

  if (isLoading) {
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
            <div className="text-2xl font-bold">{mockAnalytics.totalAgents}</div>
            <p className="text-xs text-muted-foreground">
              {mockAnalytics.activeAgents} {t('active', 'dashboard')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('conversations', 'dashboard')}</CardTitle>
            <MessageSquare className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockAnalytics.totalConversations.toLocaleString()}</div>
            <p className="text-xs text-emerald-600">
              +{mockAnalytics.monthlyGrowth.conversations}% {t('fromLastMonth', 'dashboard')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('avgResponseTime', 'dashboard')}</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockAnalytics.averageResponseTime}ms</div>
            <p className="text-xs text-emerald-600">
              {mockAnalytics.monthlyGrowth.responseTime}% {t('improvement', 'dashboard')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('satisfaction', 'dashboard')}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockAnalytics.satisfactionScore}/5</div>
            <p className="text-xs text-emerald-600">
              +{mockAnalytics.monthlyGrowth.satisfaction}% {t('fromLastMonth', 'dashboard')}
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
            {mockAgents.map((agent) => (
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
                      <span>{agent.conversations} {t('conversations_', 'dashboard')}</span>
                      <span>⭐ {agent.satisfaction}</span>
                      <span>{agent.responseTime}ms avg</span>
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
            ))}
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