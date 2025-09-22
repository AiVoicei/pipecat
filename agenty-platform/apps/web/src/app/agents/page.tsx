'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bot, Plus, Search, Filter, Play, Settings2, Copy, Trash2, Power, PowerOff } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useLanguage } from '@/contexts/LanguageContext'
import { useAgentStore } from '@/stores/useAgentStore'
import { Agent } from '@/services/api'
import { AppLayout } from '@/components/layout/AppLayout'
import Link from 'next/link'

export default function AgentsPage() {
  const { t } = useLanguage()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('updated')

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

  useEffect(() => {
    fetchAgents()
  }, [fetchAgents])

  const filteredAgents = agents.filter(agent => {
    const matchesSearch = agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         agent.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || agent.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const sortedAgents = [...filteredAgents].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name)
      case 'status':
        return a.status.localeCompare(b.status)
      case 'conversations':
        return b.analytics.totalConversations - a.analytics.totalConversations
      case 'updated':
      default:
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    }
  })

  const handleDelete = async (agentId: string) => {
    if (confirm(t('confirmDelete', 'agents'))) {
      try {
        await deleteAgent(agentId)
      } catch (error) {
        console.error('Failed to delete agent:', error)
      }
    }
  }

  const handleDuplicate = async (agentId: string) => {
    try {
      await duplicateAgent(agentId)
    } catch (error) {
      console.error('Failed to duplicate agent:', error)
    }
  }

  const handleDeploy = async (agentId: string) => {
    try {
      await deployAgent(agentId)
    } catch (error) {
      console.error('Failed to deploy agent:', error)
    }
  }

  const handleStop = async (agentId: string) => {
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

  if (isLoading && agents.length === 0) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-8 w-64 bg-muted rounded mb-2"></div>
            <div className="h-4 w-96 bg-muted/50 rounded"></div>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-48 bg-muted rounded-lg"></div>
              </div>
            ))}
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t('agents', 'navigation')}</h1>
          <p className="text-muted-foreground mt-1">
            {t('manageYourAgents', 'agents')}
          </p>
        </div>
        <Button asChild className="bg-primary hover:bg-primary/90">
          <Link href="/agents/new">
            <Plus className="w-4 h-4 mr-2" />
            {t('createAgent', 'navigation')}
          </Link>
        </Button>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('searchAgents', 'agents')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder={t('filterByStatus', 'agents')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('allStatuses', 'agents')}</SelectItem>
            <SelectItem value="active">{t('active', 'dashboard')}</SelectItem>
            <SelectItem value="inactive">{t('inactive', 'dashboard')}</SelectItem>
            <SelectItem value="draft">{t('draft', 'agents')}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder={t('sortBy', 'agents')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="updated">{t('lastUpdated', 'agents')}</SelectItem>
            <SelectItem value="name">{t('name', 'agents')}</SelectItem>
            <SelectItem value="status">{t('status', 'agents')}</SelectItem>
            <SelectItem value="conversations">{t('conversations', 'dashboard')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Agents Grid */}
      {sortedAgents.length === 0 ? (
        <Card className="p-8 text-center">
          <Bot className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            {searchQuery || statusFilter !== 'all'
              ? t('noAgentsFound', 'agents')
              : t('noAgentsYet', 'agents')
            }
          </h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery || statusFilter !== 'all'
              ? t('tryAdjustingFilters', 'agents')
              : t('createFirstAgent', 'agents')
            }
          </p>
          {!searchQuery && statusFilter === 'all' && (
            <Button asChild>
              <Link href="/agents/new">
                <Plus className="w-4 h-4 mr-2" />
                {t('createAgent', 'navigation')}
              </Link>
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sortedAgents.map((agent) => (
            <Card key={agent.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        <Bot className="w-4 h-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">{agent.name}</CardTitle>
                      <Badge className={getStatusColor(agent.status)}>
                        {t(agent.status, 'dashboard')}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <CardDescription className="line-clamp-2">
                  {agent.description}
                </CardDescription>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">{t('conversations', 'dashboard')}: </span>
                    <span className="font-medium">{agent.analytics.totalConversations}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t('satisfaction', 'dashboard')}: </span>
                    <span className="font-medium">⭐ {agent.analytics.satisfactionScore}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t('avgResponseTime', 'dashboard')}: </span>
                    <span className="font-medium">{agent.analytics.averageResponseTime}ms</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t('activeToday', 'agents')}: </span>
                    <span className="font-medium">{agent.analytics.activeToday}</span>
                  </div>
                </div>

                {/* Provider Info */}
                <div className="text-xs text-muted-foreground">
                  {agent.configuration.llm.provider} + {agent.configuration.tts.provider} + {agent.configuration.stt.provider}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild className="flex-1">
                    <Link href={`/agents/${agent.id}/test`}>
                      <Play className="w-3 h-3 mr-1" />
                      {t('test', 'agents')}
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/agents/${agent.id}/edit`}>
                      <Settings2 className="w-3 h-3" />
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDuplicate(agent.id)}
                    disabled={isLoading}
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                  {agent.status === 'active' ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStop(agent.id)}
                      disabled={isLoading}
                      className="text-red-600 hover:text-red-700"
                    >
                      <PowerOff className="w-3 h-3" />
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeploy(agent.id)}
                      disabled={isLoading}
                      className="text-green-600 hover:text-green-700"
                    >
                      <Power className="w-3 h-3" />
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(agent.id)}
                    disabled={isLoading}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      </div>
    </AppLayout>
  )
}