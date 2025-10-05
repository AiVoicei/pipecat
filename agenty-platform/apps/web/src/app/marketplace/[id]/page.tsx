'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { AppLayout } from '@/components/layout/AppLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ArrowLeft,
  Bot,
  Star,
  Download,
  Heart,
  Share2,
  Award,
  MessageSquare,
  TrendingUp,
  Users,
  Clock,
  Settings,
  CheckCircle2,
  Plus,
  Loader2
} from 'lucide-react'
import { useAgentStore } from '@/stores/useAgentStore'
import { toast } from 'sonner'
import type { CreateAgentRequest } from '@/services/api'
import { useLanguage } from '@/contexts/LanguageContext'

export default function MarketplaceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const agentId = params.id as string
  const { createAgent } = useAgentStore()
  const [isAddingAgent, setIsAddingAgent] = useState(false)
  const { t, language } = useLanguage()

  const isHebrew = language === 'he'

  // Mock agent data - in a real app, fetch this based on agentId
  const agent = {
    id: agentId,
    name: isHebrew ? 'סוכן תמיכת לקוחות מקצועי' : 'Customer Support Pro',
    description: isHebrew
      ? 'סוכן תמיכת לקוחות מתקדם עם יכולות רב-לשוניות וניתוב חכם. סוכן זה מיועד לטיפול בפניות לקוחות מורכבות במספר ערוצים.'
      : 'Advanced customer support agent with multilingual capabilities and smart routing. This agent is designed to handle complex customer inquiries across multiple channels.',
    author: {
      name: 'Agenty Team',
      verified: true,
      avatar: 'AT'
    },
    category: isHebrew ? 'שירות לקוחות' : 'Customer Service',
    tags: isHebrew
      ? ['תמיכת-לקוחות', 'רב-לשוני', 'ניתוב', 'כרטיסיות']
      : ['customer-support', 'multilingual', 'routing', 'tickets'],
    rating: 4.8,
    downloads: 15420,
    likes: 892,
    price: 'free' as const,
    featured: true,
    createdAt: new Date(2024, 0, 15),
    updatedAt: new Date(2024, 11, 10),
    configuration: {
      providers: ['OpenAI GPT-4', 'Deepgram', 'ElevenLabs'],
      languages: isHebrew ? ['אנגלית', 'ספרדית', 'צרפתית', 'גרמנית'] : ['English', 'Spanish', 'French', 'German'],
      features: isHebrew
        ? ['זיהוי כוונות', 'ניתוח סנטימנט', 'יצירת כרטיסים', 'אינטגרציה למייל']
        : ['Intent Recognition', 'Sentiment Analysis', 'Ticket Creation', 'Email Integration']
    },
    stats: {
      conversations: 45000,
      avgResponseTime: 320,
      satisfaction: 4.7,
      activeUsers: 1200
    }
  }

  const handleAddToAgents = async () => {
    if (isAddingAgent) return // Prevent double clicks

    try {
      setIsAddingAgent(true)

      const language = agent.configuration.languages[0] || 'en'

      const createRequest: CreateAgentRequest = {
        name: agent.name,
        description: agent.description,
        templateId: agentId,
        configuration: {
          stt: agent.configuration.providers.some(p => p.toLowerCase().includes('deepgram'))
            ? { provider: 'Deepgram', language, model: 'nova-2' }
            : agent.configuration.providers.some(p => p.toLowerCase().includes('google'))
            ? { provider: 'Google', language }
            : { provider: 'OpenAI', model: 'whisper-1', language },
          llm: agent.configuration.providers.some(p => p.toLowerCase().includes('gpt') || p.toLowerCase().includes('openai'))
            ? { provider: 'OpenAI', model: 'gpt-4o', systemPrompt: agent.description, temperature: 0.7 }
            : agent.configuration.providers.some(p => p.toLowerCase().includes('claude') || p.toLowerCase().includes('anthropic'))
            ? { provider: 'Anthropic', model: 'claude-3-5-sonnet-20241022', systemPrompt: agent.description, temperature: 0.7 }
            : { provider: 'OpenAI', model: 'gpt-4o', systemPrompt: agent.description, temperature: 0.7 },
          tts: agent.configuration.providers.some(p => p.toLowerCase().includes('elevenlabs'))
            ? { provider: 'ElevenLabs', voice: 'default' }
            : agent.configuration.providers.some(p => p.toLowerCase().includes('cartesia'))
            ? { provider: 'Cartesia', voice: 'default' }
            : { provider: 'OpenAI', voice: 'alloy' }
        },
        deploymentConfig: {
          type: 'webrtc',
          settings: {}
        }
      }

      const newAgent = await createAgent(createRequest)

      toast.success(t('marketplace.addedSuccess'), {
        description: `${agent.name} ${t('marketplace.addedDescription')}`
      })

      router.push(`/agents/${newAgent.id}`)
    } catch (error) {
      console.error('Failed to add agent:', error)
      toast.error(t('marketplace.addFailed'), {
        description: error instanceof Error ? error.message : t('marketplace.tryAgainLater')
      })
    } finally {
      setIsAddingAgent(false)
    }
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('marketplace.backToMarketplace')}
        </Button>

        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              <div className="flex items-start gap-4">
                <Avatar className="w-16 h-16">
                  <AvatarFallback className="text-2xl">
                    <Bot className="w-8 h-8" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h1 className="text-3xl font-bold">{agent.name}</h1>
                    {agent.featured && (
                      <Badge className="bg-primary text-primary-foreground">
                        {t('marketplace.featured')}
                      </Badge>
                    )}
                    {agent.price === 'premium' && (
                      <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                        {t('marketplace.premium')}
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground mb-3">
                    {t('marketplace.by')} {agent.author.name}
                    {agent.author.verified && (
                      <Award className="w-4 h-4 inline ml-1 text-blue-500" />
                    )}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {agent.tags.map(tag => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2 lg:min-w-[200px]">
                <Button
                  size="lg"
                  className="w-full"
                  onClick={handleAddToAgents}
                  disabled={isAddingAgent}
                >
                  {isAddingAgent ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4 mr-2" />
                  )}
                  {isAddingAgent ? t('marketplace.adding') : t('marketplace.addToYourAgents')}
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1">
                    <Heart className="w-4 h-4 mr-2" />
                    {agent.likes}
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <Share2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{agent.rating}</p>
                  <p className="text-sm text-muted-foreground">{t('marketplace.rating')}</p>
                </div>
                <Star className="w-8 h-8 text-yellow-500 fill-current" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{agent.downloads.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">{t('marketplace.downloads')}</p>
                </div>
                <Download className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{agent.stats.activeUsers.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">{t('marketplace.activeUsers')}</p>
                </div>
                <Users className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{agent.stats.avgResponseTime}ms</p>
                  <p className="text-sm text-muted-foreground">{t('marketplace.responseTime')}</p>
                </div>
                <Clock className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Details Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">{t('marketplace.overview')}</TabsTrigger>
            <TabsTrigger value="configuration">{t('marketplace.configuration')}</TabsTrigger>
            <TabsTrigger value="reviews">{t('marketplace.reviews')}</TabsTrigger>
            <TabsTrigger value="changelog">{t('marketplace.changelog')}</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t('marketplace.about')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  {agent.description}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('marketplace.keyFeatures')}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {agent.configuration.features.map(feature => (
                    <li key={feature} className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('marketplace.performanceMetrics')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-muted-foreground">{t('marketplace.totalConversations')}</span>
                      <span className="font-semibold">{agent.stats.conversations.toLocaleString()}</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-muted-foreground">{t('marketplace.customerSatisfaction')}</span>
                      <span className="font-semibold">{agent.stats.satisfaction}/5.0</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-muted-foreground">{t('marketplace.category')}</span>
                      <Badge variant="outline">{agent.category}</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="configuration" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t('marketplace.aiProviders')}</CardTitle>
                <CardDescription>{t('marketplace.servicesUsed')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {agent.configuration.providers.map(provider => (
                    <div key={provider} className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                      <Settings className="w-4 h-4 text-primary" />
                      <span>{provider}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('marketplace.supportedLanguages')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {agent.configuration.languages.map(language => (
                    <Badge key={language} variant="secondary">
                      {language}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviews" className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">{t('marketplace.noReviewsYet')}</h3>
                  <p className="text-muted-foreground">
                    {t('marketplace.firstToReview')}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="changelog" className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                      <div>
                        <p className="font-semibold">{t('marketplace.latestUpdate')}</p>
                        <p className="text-sm text-muted-foreground">
                          {agent.updatedAt.toLocaleDateString()}
                        </p>
                        <ul className="mt-2 text-sm text-muted-foreground space-y-1">
                          <li>• {t('marketplace.performanceImprovements')}</li>
                          <li>• {t('marketplace.bugFixes')}</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  )
}
