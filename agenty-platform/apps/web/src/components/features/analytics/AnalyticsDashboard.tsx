'use client'

import { useEffect, useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import {
  TrendingUp,
  TrendingDown,
  Users,
  MessageSquare,
  Clock,
  Activity,
  Bot,
  Star,
  Download,
  Calendar,
  Filter,
  RefreshCw
} from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { useAgentStore } from '@/stores/useAgentStore'
import { format, subDays, parseISO } from 'date-fns'

export function AnalyticsDashboard() {
  const { t } = useLanguage()
  const { agents, isLoading, fetchAgents } = useAgentStore()
  const [timeRange, setTimeRange] = useState('7d')
  const [selectedAgent, setSelectedAgent] = useState('all')
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    fetchAgents()
  }, [fetchAgents])

  // Generate analytics data - memoized to prevent chart flicker
  const data = useMemo(() => {
    const days = timeRange === '24h' ? 1 : timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90
    const dateRange = Array.from({ length: days }, (_, i) => {
      const date = subDays(new Date(), days - 1 - i)
      return format(date, 'MM/dd')
    })

    // Conversation volume over time
    const conversationData = dateRange.map((date, index) => ({
      date,
      conversations: Math.floor(Math.random() * 100) + 50 + (index * 2),
      users: Math.floor(Math.random() * 40) + 20 + index,
      satisfaction: 3.5 + (Math.random() * 1.5)
    }))

    // Response time trends
    const responseTimeData = dateRange.map((date, index) => ({
      date,
      avgResponseTime: 200 + Math.floor(Math.random() * 200) + (index * 5),
      p95ResponseTime: 400 + Math.floor(Math.random() * 300) + (index * 8),
      p99ResponseTime: 800 + Math.floor(Math.random() * 400) + (index * 10)
    }))

    // Agent performance comparison
    const agentPerformanceData = agents.slice(0, 5).map(agent => ({
      name: agent.name,
      conversations: agent.analytics.totalConversations,
      satisfaction: agent.analytics.satisfactionScore,
      responseTime: agent.analytics.averageResponseTime,
      uptime: 95 + Math.floor(Math.random() * 5)
    }))

    // Provider usage distribution
    const providerData = [
      { name: 'OpenAI', value: 35, color: '#8B5CF6' },
      { name: 'Anthropic', value: 25, color: '#10B981' },
      { name: 'Deepgram', value: 20, color: '#F59E0B' },
      { name: 'ElevenLabs', value: 15, color: '#EF4444' },
      { name: 'Others', value: 5, color: '#6B7280' }
    ]

    // Conversation topics
    const topicsData = [
      { topic: 'Customer Support', count: 245, sentiment: 0.7 },
      { topic: 'Product Info', count: 189, sentiment: 0.8 },
      { topic: 'Billing', count: 156, sentiment: 0.5 },
      { topic: 'Technical Issues', count: 123, sentiment: 0.6 },
      { topic: 'General Inquiry', count: 98, sentiment: 0.9 }
    ]

    return {
      conversationData,
      responseTimeData,
      agentPerformanceData,
      providerData,
      topicsData
    }
  }, [agents, timeRange])

  // Calculate summary metrics
  const totalConversations = agents.reduce((sum, agent) => sum + agent.analytics.totalConversations, 0)
  const avgSatisfaction = agents.length > 0
    ? agents.reduce((sum, agent) => sum + agent.analytics.satisfactionScore, 0) / agents.length
    : 0
  const avgResponseTime = agents.length > 0
    ? agents.reduce((sum, agent) => sum + agent.analytics.averageResponseTime, 0) / agents.length
    : 0
  const activeAgents = agents.filter(agent => agent.status === 'active').length

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchAgents()
    // Simulate data refresh
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsRefreshing(false)
  }

  const handleExport = () => {
    // Implement export functionality
    console.log('Exporting analytics data...')
  }

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
          <h1 className="text-3xl font-bold text-foreground">{t('analytics', 'navigation')}</h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive insights into your agent performance
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Conversations</CardTitle>
            <MessageSquare className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalConversations.toLocaleString()}</div>
            <div className="flex items-center text-xs text-emerald-600 mt-1">
              <TrendingUp className="w-3 h-3 mr-1" />
              +12.5% from last period
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Satisfaction</CardTitle>
            <Star className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgSatisfaction.toFixed(1)}/5.0</div>
            <div className="flex items-center text-xs text-emerald-600 mt-1">
              <TrendingUp className="w-3 h-3 mr-1" />
              +2.1% from last period
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(avgResponseTime)}ms</div>
            <div className="flex items-center text-xs text-emerald-600 mt-1">
              <TrendingDown className="w-3 h-3 mr-1" />
              -8.3% from last period
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
            <Bot className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeAgents}</div>
            <div className="text-xs text-muted-foreground mt-1">
              of {agents.length} total agents
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="conversations">Conversations</TabsTrigger>
          <TabsTrigger value="agents">Agents</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Conversation Volume */}
            <Card>
              <CardHeader>
                <CardTitle>Conversation Volume</CardTitle>
                <CardDescription>Daily conversation and user metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={data.conversationData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="conversations"
                      stackId="1"
                      stroke="#8B5CF6"
                      fill="#8B5CF6"
                      fillOpacity={0.6}
                    />
                    <Area
                      type="monotone"
                      dataKey="users"
                      stackId="2"
                      stroke="#10B981"
                      fill="#10B981"
                      fillOpacity={0.6}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Provider Usage */}
            <Card>
              <CardHeader>
                <CardTitle>Provider Distribution</CardTitle>
                <CardDescription>Usage across AI providers</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={data.providerData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={(props: any) => `${props.name} ${(props.percent * 100).toFixed(0)}%`}
                    >
                      {data.providerData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid gap-6">
            {/* Response Time Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Response Time Analysis</CardTitle>
                <CardDescription>Average, 95th, and 99th percentile response times</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={data.responseTimeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="avgResponseTime"
                      stroke="#8B5CF6"
                      strokeWidth={2}
                      name="Average"
                    />
                    <Line
                      type="monotone"
                      dataKey="p95ResponseTime"
                      stroke="#F59E0B"
                      strokeWidth={2}
                      name="95th Percentile"
                    />
                    <Line
                      type="monotone"
                      dataKey="p99ResponseTime"
                      stroke="#EF4444"
                      strokeWidth={2}
                      name="99th Percentile"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Agent Performance Comparison */}
            <Card>
              <CardHeader>
                <CardTitle>Agent Performance Comparison</CardTitle>
                <CardDescription>Key metrics across your agents</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.agentPerformanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="conversations" fill="#8B5CF6" name="Conversations" />
                    <Bar dataKey="satisfaction" fill="#10B981" name="Satisfaction (x100)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="conversations" className="space-y-6">
          {/* Conversation Topics */}
          <Card>
            <CardHeader>
              <CardTitle>Conversation Topics</CardTitle>
              <CardDescription>Most discussed topics and sentiment analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.topicsData.map((topic, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="text-sm font-medium">{topic.topic}</div>
                      <Badge variant="secondary">{topic.count} conversations</Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="text-sm text-muted-foreground">
                        Sentiment: {(topic.sentiment * 100).toFixed(0)}%
                      </div>
                      <div
                        className="w-12 h-2 rounded-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500"
                        style={{
                          background: `linear-gradient(to right,
                            ${topic.sentiment < 0.3 ? '#EF4444' :
                              topic.sentiment < 0.7 ? '#F59E0B' : '#10B981'})`
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agents" className="space-y-6">
          {/* Agent Details Table */}
          <Card>
            <CardHeader>
              <CardTitle>Agent Performance Details</CardTitle>
              <CardDescription>Detailed metrics for each agent</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {agents.map((agent) => (
                  <div key={agent.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <Bot className="w-4 h-4 text-primary" />
                        <span className="font-medium">{agent.name}</span>
                      </div>
                      <Badge variant={agent.status === 'active' ? 'default' : 'secondary'}>
                        {agent.status}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-6 text-sm">
                      <div className="text-center">
                        <div className="font-medium">{agent.analytics.totalConversations}</div>
                        <div className="text-muted-foreground text-xs">Conversations</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium">{agent.analytics.satisfactionScore}/5</div>
                        <div className="text-muted-foreground text-xs">Satisfaction</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium">{agent.analytics.averageResponseTime}ms</div>
                        <div className="text-muted-foreground text-xs">Avg Response</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium">{agent.analytics.activeToday}</div>
                        <div className="text-muted-foreground text-xs">Today</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          {/* Insights and Recommendations */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-green-500" />
                  Performance Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="text-sm font-medium text-green-800 dark:text-green-200">
                    ✓ Response times improved by 8.3% this week
                  </div>
                  <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                    Your agents are responding faster than ever
                  </div>
                </div>
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    📈 Conversation volume up 12.5%
                  </div>
                  <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    More users are engaging with your agents
                  </div>
                </div>
                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                  <div className="text-sm font-medium text-purple-800 dark:text-purple-200">
                    ⭐ Customer satisfaction increased to 4.2/5
                  </div>
                  <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                    Users are more satisfied with responses
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="w-5 h-5 mr-2 text-orange-500" />
                  Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                  <div className="text-sm font-medium text-orange-800 dark:text-orange-200">
                    🎯 Optimize billing topic responses
                  </div>
                  <div className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                    Billing topics have lower satisfaction scores
                  </div>
                </div>
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <div className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    ⚡ Consider upgrading to faster TTS
                  </div>
                  <div className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                    Response times spike during peak hours
                  </div>
                </div>
                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
                  <div className="text-sm font-medium text-indigo-800 dark:text-indigo-200">
                    🚀 Scale successful agent templates
                  </div>
                  <div className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">
                    Top performing agents could be templated
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}