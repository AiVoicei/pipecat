'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Search,
  Filter,
  Star,
  Download,
  Heart,
  Share2,
  Bot,
  Users,
  TrendingUp,
  Clock,
  Tag,
  Upload,
  Eye,
  MessageSquare,
  Award,
  Zap,
  Plus,
  Loader2
} from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { useAgentStore } from '@/stores/useAgentStore'
import { toast } from 'sonner'
import type { CreateAgentRequest } from '@/services/api'

interface MarketplaceAgent {
  id: string
  name: string
  description: string
  author: {
    name: string
    avatar?: string
    verified: boolean
  }
  category: string
  tags: string[]
  rating: number
  downloads: number
  likes: number
  price: 'free' | 'premium'
  featured: boolean
  previewUrl?: string
  createdAt: Date
  updatedAt: Date
  configuration: {
    providers: string[]
    languages: string[]
    features: string[]
  }
  stats: {
    conversations: number
    avgResponseTime: number
    satisfaction: number
    activeUsers: number
  }
}

// Bilingual mock agent data
const getMockAgents = (language: string): MarketplaceAgent[] => {
  const isHebrew = language === 'he'

  return [
    {
      id: 'agent-1',
      name: isHebrew ? 'סוכן תמיכת לקוחות מקצועי' : 'Customer Support Pro',
      description: isHebrew
        ? 'סוכן תמיכת לקוחות מתקדם עם יכולות רב-לשוניות וניתוב חכם'
        : 'Advanced customer support agent with multilingual capabilities and smart routing',
      author: {
        name: 'Agenty Team',
        verified: true
      },
      category: isHebrew ? 'שירות לקוחות' : 'Customer Service',
      tags: isHebrew
        ? ['תמיכת-לקוחות', 'רב-לשוני', 'ניתוב', 'כרטיסיות']
        : ['customer-support', 'multilingual', 'routing', 'tickets'],
      rating: 4.8,
      downloads: 15420,
      likes: 892,
      price: 'free',
      featured: true,
      createdAt: new Date(2024, 0, 15),
      updatedAt: new Date(2024, 11, 10),
      configuration: {
        providers: ['OpenAI GPT-4', 'Deepgram', 'ElevenLabs'],
        languages: isHebrew ? ['אנגלית', 'ספרדית', 'צרפתית', 'גרמנית'] : ['English', 'Spanish', 'French', 'German'],
        features: isHebrew
          ? ['זיהוי כוונות', 'ניתוח סנטימנט', 'יצירת כרטיסים']
          : ['Intent Recognition', 'Sentiment Analysis', 'Ticket Creation']
      },
      stats: {
        conversations: 45000,
        avgResponseTime: 320,
        satisfaction: 4.7,
        activeUsers: 1200
      }
    },
    {
      id: 'agent-2',
      name: isHebrew ? 'עוזר מסחר אלקטרוני' : 'E-commerce Assistant',
      description: isHebrew
        ? 'עוזר קניות מיוחד עם המלצות מוצרים ומעקב הזמנות'
        : 'Specialized shopping assistant with product recommendations and order tracking',
      author: {
        name: 'RetailBot Inc',
        verified: true
      },
      category: isHebrew ? 'מסחר אלקטרוני' : 'E-commerce',
      tags: isHebrew
        ? ['קניות', 'המלצות', 'הזמנות', 'תשלומים']
        : ['shopping', 'recommendations', 'orders', 'payments'],
      rating: 4.6,
      downloads: 8930,
      likes: 534,
      price: 'premium',
      featured: false,
      createdAt: new Date(2024, 1, 22),
      updatedAt: new Date(2024, 11, 8),
      configuration: {
        providers: ['Anthropic Claude', 'Azure Speech', 'Cartesia'],
        languages: isHebrew ? ['אנגלית', 'ספרדית'] : ['English', 'Spanish'],
        features: isHebrew
          ? ['חיפוש מוצרים', 'מעקב הזמנות', 'עיבוד תשלומים']
          : ['Product Search', 'Order Tracking', 'Payment Processing']
      },
      stats: {
        conversations: 22000,
        avgResponseTime: 280,
        satisfaction: 4.5,
        activeUsers: 680
      }
    },
    {
      id: 'agent-3',
      name: isHebrew ? 'עוזר בריאות' : 'Healthcare Helper',
      description: isHebrew
        ? 'עוזר בריאות תואם HIPAA לתיאום פגישות ושאלות בריאות בסיסיות'
        : 'HIPAA-compliant healthcare assistant for appointment scheduling and basic health queries',
      author: {
        name: 'MedTech Solutions',
        verified: true
      },
      category: isHebrew ? 'בריאות' : 'Healthcare',
      tags: isHebrew
        ? ['בריאות', 'פגישות', 'hipaa', 'רפואה']
        : ['healthcare', 'appointments', 'hipaa', 'medical'],
      rating: 4.9,
      downloads: 3240,
      likes: 298,
      price: 'premium',
      featured: true,
      createdAt: new Date(2024, 2, 10),
      updatedAt: new Date(2024, 11, 12),
      configuration: {
        providers: ['OpenAI GPT-4', 'Google Speech', 'Azure TTS'],
        languages: isHebrew ? ['אנגלית'] : ['English'],
        features: isHebrew
          ? ['הזמנת פגישות', 'בדיקת תסמינים', 'רשומות רפואיות']
          : ['Appointment Booking', 'Symptom Checker', 'Medical Records']
      },
      stats: {
        conversations: 8500,
        avgResponseTime: 450,
        satisfaction: 4.8,
        activeUsers: 320
      }
    },
    {
      id: 'agent-4',
      name: isHebrew ? 'מורה פרטי חינוכי' : 'Educational Tutor',
      description: isHebrew
        ? 'עוזר למידה אינטראקטיבי לסטודנטים עם תמיכה מותאמת אישית'
        : 'Interactive learning assistant for students with personalized curriculum support',
      author: {
        name: 'EduAI Labs',
        verified: false
      },
      category: isHebrew ? 'חינוך' : 'Education',
      tags: isHebrew
        ? ['חינוך', 'הדרכה', 'למידה', 'סטודנטים']
        : ['education', 'tutoring', 'learning', 'students'],
      rating: 4.4,
      downloads: 12100,
      likes: 756,
      price: 'free',
      featured: false,
      createdAt: new Date(2024, 3, 5),
      updatedAt: new Date(2024, 11, 15),
      configuration: {
        providers: ['OpenAI GPT-3.5', 'Deepgram', 'PlayHT'],
        languages: isHebrew ? ['אנגלית', 'ספרדית', 'צרפתית'] : ['English', 'Spanish', 'French'],
        features: isHebrew
          ? ['יצירת בחנים', 'מעקב התקדמות', 'תוכניות לימוד']
          : ['Quiz Generation', 'Progress Tracking', 'Study Plans']
      },
      stats: {
        conversations: 35000,
        avgResponseTime: 380,
        satisfaction: 4.3,
        activeUsers: 2100
      }
    }
  ]
}

export function AgentMarketplace() {
  const { t, language } = useLanguage()
  const router = useRouter()
  const { createAgent } = useAgentStore()
  const [agents, setAgents] = useState<MarketplaceAgent[]>(() => getMockAgents(language))
  const [filteredAgents, setFilteredAgents] = useState<MarketplaceAgent[]>(() => getMockAgents(language))
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortBy, setSortBy] = useState('popular')
  const [currentTab, setCurrentTab] = useState('discover')
  const [addingAgentId, setAddingAgentId] = useState<string | null>(null)

  // Update agents when language changes
  useEffect(() => {
    const updatedAgents = getMockAgents(language)
    setAgents(updatedAgents)
  }, [language])

  const categories = [
    { value: 'all', label: t('marketplace.allCategories') },
    { value: 'Customer Service', labelKey: 'marketplace.customerService' },
    { value: 'E-commerce', labelKey: 'marketplace.ecommerce' },
    { value: 'Healthcare', labelKey: 'marketplace.healthcare' },
    { value: 'Education', labelKey: 'marketplace.education' },
    { value: 'Finance', labelKey: 'marketplace.finance' },
    { value: 'Entertainment', labelKey: 'marketplace.entertainment' },
    { value: 'Productivity', labelKey: 'marketplace.productivity' }
  ]

  const sortOptions = [
    { value: 'popular', label: t('marketplace.mostPopular') },
    { value: 'newest', label: t('marketplace.newest') },
    { value: 'rating', label: t('marketplace.highestRated') },
    { value: 'downloads', label: t('marketplace.mostDownloaded') }
  ]

  // Filter and sort agents
  useEffect(() => {
    let filtered = [...agents] // Create shallow clone to avoid mutation

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(agent =>
        agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        agent.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        agent.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }

    // Apply category filter - normalize English category names for comparison
    if (selectedCategory !== 'all') {
      // Map Hebrew category back to English for consistent filtering
      const categoryMap: Record<string, string> = {
        'שירות לקוחות': 'Customer Service',
        'מסחר אלקטרוני': 'E-commerce',
        'בריאות': 'Healthcare',
        'חינוך': 'Education',
        'כספים': 'Finance',
        'בידור': 'Entertainment',
        'פרודוקטיביות': 'Productivity'
      }

      filtered = filtered.filter(agent => {
        const normalizedAgentCategory = categoryMap[agent.category] || agent.category
        return normalizedAgentCategory === selectedCategory
      })
    }

    // Apply sorting
    switch (sortBy) {
      case 'newest':
        filtered.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
        break
      case 'rating':
        filtered.sort((a, b) => b.rating - a.rating)
        break
      case 'downloads':
        filtered.sort((a, b) => b.downloads - a.downloads)
        break
      default: // popular
        filtered.sort((a, b) => (b.downloads * b.rating) - (a.downloads * a.rating))
    }

    setFilteredAgents(filtered)
  }, [agents, searchQuery, selectedCategory, sortBy])

  const handleLike = (agentId: string) => {
    setAgents(prev => prev.map(agent =>
      agent.id === agentId
        ? { ...agent, likes: agent.likes + 1 }
        : agent
    ))
  }

  // Normalize localized language labels to ISO/BCP47 codes
  const normalizeLanguageCode = (localizedLabel: string): string => {
    const languageMap: Record<string, string> = {
      // English
      'english': 'en-US',
      'אנגלית': 'en-US',
      // Hebrew
      'hebrew': 'he-IL',
      'עברית': 'he-IL',
      // Spanish
      'spanish': 'es-ES',
      'ספרדית': 'es-ES',
      'español': 'es-ES',
      // French
      'french': 'fr-FR',
      'צרפתית': 'fr-FR',
      'français': 'fr-FR',
      // German
      'german': 'de-DE',
      'גרמנית': 'de-DE',
      'deutsch': 'de-DE',
      // Arabic
      'arabic': 'ar-SA',
      'ערבית': 'ar-SA',
      'العربية': 'ar-SA',
      // Portuguese
      'portuguese': 'pt-BR',
      'פורטוגזית': 'pt-BR',
      'português': 'pt-BR',
      // Russian
      'russian': 'ru-RU',
      'רוסית': 'ru-RU',
      'русский': 'ru-RU',
      // Chinese
      'chinese': 'zh-CN',
      'סינית': 'zh-CN',
      '中文': 'zh-CN',
      // Japanese
      'japanese': 'ja-JP',
      'יפנית': 'ja-JP',
      '日本語': 'ja-JP',
      // Korean
      'korean': 'ko-KR',
      'קוריאנית': 'ko-KR',
      '한국어': 'ko-KR',
      // Italian
      'italian': 'it-IT',
      'איטלקית': 'it-IT',
      'italiano': 'it-IT',
      // Dutch
      'dutch': 'nl-NL',
      'הולנדית': 'nl-NL',
      'nederlands': 'nl-NL',
      // Polish
      'polish': 'pl-PL',
      'פולנית': 'pl-PL',
      'polski': 'pl-PL',
      // Turkish
      'turkish': 'tr-TR',
      'טורקית': 'tr-TR',
      'türkçe': 'tr-TR',
    }

    // Try case-insensitive match
    const normalized = localizedLabel.toLowerCase().trim()
    const code = languageMap[normalized]

    // If found, return the code; otherwise default to en-US
    return code || 'en-US'
  }

  const handleInstall = async (agentId: string) => {
    const marketplaceAgent = agents.find(a => a.id === agentId)
    if (!marketplaceAgent) return

    try {
      setAddingAgentId(agentId)

      // Map marketplace agent configuration to API format
      // Normalize localized language label to ISO/BCP47 code
      const localizedLanguage = marketplaceAgent.configuration.languages[0] || 'English'
      const language = normalizeLanguageCode(localizedLanguage)

      const createRequest: CreateAgentRequest = {
        name: marketplaceAgent.name,
        description: marketplaceAgent.description,
        templateId: agentId,
        configuration: {
          // Parse providers from marketplace configuration
          stt: marketplaceAgent.configuration.providers.some(p => p.toLowerCase().includes('deepgram'))
            ? { provider: 'Deepgram', language, model: 'nova-2' }
            : marketplaceAgent.configuration.providers.some(p => p.toLowerCase().includes('google'))
            ? { provider: 'Google', language }
            : { provider: 'OpenAI', model: 'whisper-1', language },
          llm: marketplaceAgent.configuration.providers.some(p => p.toLowerCase().includes('gpt') || p.toLowerCase().includes('openai'))
            ? { provider: 'OpenAI', model: 'gpt-4o', systemPrompt: marketplaceAgent.description, temperature: 0.7 }
            : marketplaceAgent.configuration.providers.some(p => p.toLowerCase().includes('claude') || p.toLowerCase().includes('anthropic'))
            ? { provider: 'Anthropic', model: 'claude-3-5-sonnet-20241022', systemPrompt: marketplaceAgent.description, temperature: 0.7 }
            : { provider: 'OpenAI', model: 'gpt-4o', systemPrompt: marketplaceAgent.description, temperature: 0.7 },
          tts: marketplaceAgent.configuration.providers.some(p => p.toLowerCase().includes('elevenlabs'))
            ? { provider: 'ElevenLabs', voice: 'default' }
            : marketplaceAgent.configuration.providers.some(p => p.toLowerCase().includes('cartesia'))
            ? { provider: 'Cartesia', voice: 'default' }
            : { provider: 'OpenAI', voice: 'alloy' }
        },
        deploymentConfig: {
          type: 'webrtc',
          settings: {}
        }
      }

      // Create the agent
      const newAgent = await createAgent(createRequest)

      // Update download count in marketplace
      setAgents(prev => prev.map(agent =>
        agent.id === agentId
          ? { ...agent, downloads: agent.downloads + 1 }
          : agent
      ))

      // Show success message
      toast.success(t('marketplace.addedSuccess'), {
        description: `${marketplaceAgent.name} ${t('marketplace.addedDescription')}`
      })

      // Navigate to the agent detail page
      router.push(`/agents/${newAgent.id}`)
    } catch (error) {
      console.error('Failed to add agent:', error)
      toast.error(t('marketplace.addFailed'), {
        description: error instanceof Error ? error.message : t('marketplace.tryAgainLater')
      })
    } finally {
      setAddingAgentId(null)
    }
  }

  const handleAgentClick = (agentId: string) => {
    router.push(`/marketplace/${agentId}`)
  }

  const getFeaturedAgents = () => agents.filter(agent => agent.featured)
  const getTrendingAgents = () => agents.slice().sort((a, b) => b.downloads - a.downloads).slice(0, 3)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t('marketplace.title')}</h1>
          <p className="text-muted-foreground mt-1">
            {t('marketplace.description')}
          </p>
        </div>
        <Button>
          <Upload className="w-4 h-4 mr-2" />
          {t('marketplace.publishAgent')}
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder={t('marketplace.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.value === 'all' ? category.label : t(category.labelKey as any)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs value={currentTab} onValueChange={setCurrentTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="discover">{t('marketplace.discover')}</TabsTrigger>
          <TabsTrigger value="featured">{t('marketplace.featured')}</TabsTrigger>
          <TabsTrigger value="trending">{t('marketplace.trending')}</TabsTrigger>
          <TabsTrigger value="my-agents">{t('marketplace.myAgents')}</TabsTrigger>
        </TabsList>

        <TabsContent value="discover" className="space-y-6 mt-6">
          {/* Agent Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence>
              {filteredAgents.map((agent, index) => (
                <motion.div
                  key={agent.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <AgentCard
                    agent={agent}
                    onLike={() => handleLike(agent.id)}
                    onInstall={() => handleInstall(agent.id)}
                    onClick={() => handleAgentClick(agent.id)}
                    isLoading={addingAgentId === agent.id}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {filteredAgents.length === 0 && (
            <div className="text-center py-12">
              <Bot className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">{t('marketplace.noAgentsFound')}</h3>
              <p className="text-muted-foreground mb-4">
                {t('marketplace.tryAdjustCriteria')}
              </p>
              <Button variant="outline" onClick={() => {
                setSearchQuery('')
                setSelectedCategory('all')
              }}>
                {t('marketplace.clearFilters')}
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="featured" className="space-y-6 mt-6">
          <div className="grid gap-6 md:grid-cols-2">
            {getFeaturedAgents().map((agent, index) => (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <FeaturedAgentCard
                  agent={agent}
                  onLike={() => handleLike(agent.id)}
                  onInstall={() => handleInstall(agent.id)}
                  onClick={() => handleAgentClick(agent.id)}
                  isLoading={addingAgentId === agent.id}
                />
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="trending" className="space-y-6 mt-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {getTrendingAgents().map((agent, index) => (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <TrendingAgentCard
                  agent={agent}
                  rank={index + 1}
                  onLike={() => handleLike(agent.id)}
                  onInstall={() => handleInstall(agent.id)}
                  onClick={() => handleAgentClick(agent.id)}
                  isLoading={addingAgentId === agent.id}
                />
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="my-agents" className="space-y-6 mt-6">
          <div className="text-center py-12">
            <Upload className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">{t('marketplace.shareYourAgents')}</h3>
            <p className="text-muted-foreground mb-4">
              {t('marketplace.publishToMarketplace')}
            </p>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              {t('marketplace.publishFirstAgent')}
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function AgentCard({ agent, onLike, onInstall, onClick, isLoading }: {
  agent: MarketplaceAgent
  onLike: () => void
  onInstall: () => void
  onClick: () => void
  isLoading?: boolean
}) {
  const { t } = useLanguage()

  return (
    <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer group" onClick={onClick}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            <Avatar className="w-8 h-8">
              <AvatarFallback>
                <Bot className="w-4 h-4" />
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg group-hover:text-primary transition-colors">
                {agent.name}
              </CardTitle>
              <CardDescription className="text-sm">
                {t('marketplace.by')} {agent.author.name}
                {agent.author.verified && (
                  <Award className="w-3 h-3 inline ml-1 text-blue-500" />
                )}
              </CardDescription>
            </div>
          </div>
          {agent.price === 'premium' && (
            <Badge variant="outline" className="text-yellow-600 border-yellow-600">
              {t('marketplace.premium')}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-3">
          {agent.description}
        </p>

        <div className="flex flex-wrap gap-1">
          {agent.tags.slice(0, 3).map(tag => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
          {agent.tags.length > 3 && (
            <Badge variant="secondary" className="text-xs">
              +{agent.tags.length - 3}
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <Star className="w-4 h-4 text-yellow-500 fill-current" />
              <span>{agent.rating}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Download className="w-4 h-4 text-muted-foreground" />
              <span>{agent.downloads.toLocaleString()}</span>
            </div>
          </div>
          <Badge variant="outline">{agent.category}</Badge>
        </div>

        <div className="flex items-center justify-between pt-2">
          <Button variant="ghost" size="sm" onClick={(e) => {
            e.stopPropagation()
            onLike()
          }}>
            <Heart className="w-4 h-4 mr-1" />
            {agent.likes}
          </Button>
          <Button size="sm" onClick={(e) => {
            e.stopPropagation()
            onInstall()
          }} disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Plus className="w-4 h-4 mr-2" />
            )}
            {isLoading ? t('marketplace.adding') : t('marketplace.addToAgents')}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function FeaturedAgentCard({ agent, onLike, onInstall, onClick, isLoading }: {
  agent: MarketplaceAgent
  onLike: () => void
  onInstall: () => void
  onClick: () => void
  isLoading?: boolean
}) {
  const { t } = useLanguage()

  return (
    <Card className="relative overflow-hidden border-primary/50 bg-gradient-to-br from-primary/5 to-purple-500/5 cursor-pointer hover:shadow-lg transition-shadow" onClick={onClick}>
      <div className="absolute top-4 right-4">
        <Badge className="bg-primary text-primary-foreground">
          {t('marketplace.featured')}
        </Badge>
      </div>

      <CardHeader className="pb-3">
        <div className="flex items-center space-x-3">
          <Avatar className="w-12 h-12">
            <AvatarFallback>
              <Bot className="w-6 h-6" />
            </AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-xl">{agent.name}</CardTitle>
            <CardDescription>
              {t('marketplace.by')} {agent.author.name}
              {agent.author.verified && (
                <Award className="w-4 h-4 inline ml-1 text-blue-500" />
              )}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-muted-foreground">{agent.description}</p>

        <div className="grid grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-lg font-bold text-foreground">
              {agent.stats.conversations.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">{t('marketplace.conversations')}</div>
          </div>
          <div>
            <div className="text-lg font-bold text-green-600">
              {agent.rating}
            </div>
            <div className="text-xs text-muted-foreground">{t('marketplace.rating')}</div>
          </div>
          <div>
            <div className="text-lg font-bold text-blue-600">
              {agent.stats.avgResponseTime}ms
            </div>
            <div className="text-xs text-muted-foreground">{t('marketplace.response')}</div>
          </div>
          <div>
            <div className="text-lg font-bold text-purple-600">
              {agent.stats.activeUsers}
            </div>
            <div className="text-xs text-muted-foreground">{t('marketplace.users')}</div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4">
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" onClick={(e) => {
              e.stopPropagation()
              onLike()
            }}>
              <Heart className="w-4 h-4 mr-1" />
              {agent.likes}
            </Button>
            <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
              <Share2 className="w-4 h-4" />
            </Button>
          </div>
          <Button onClick={(e) => {
            e.stopPropagation()
            onInstall()
          }} disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Plus className="w-4 h-4 mr-2" />
            )}
            {isLoading ? t('marketplace.adding') : t('marketplace.addToYourAgents')}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function TrendingAgentCard({ agent, rank, onLike, onInstall, onClick, isLoading }: {
  agent: MarketplaceAgent
  rank: number
  onLike: () => void
  onInstall: () => void
  onClick: () => void
  isLoading?: boolean
}) {
  const { t } = useLanguage()

  return (
    <Card className="relative cursor-pointer hover:shadow-lg transition-shadow" onClick={onClick}>
      <div className="absolute top-4 left-4">
        <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
          #{rank}
        </div>
      </div>

      <CardHeader className="pb-3 pt-16">
        <div className="text-center">
          <CardTitle className="text-lg">{agent.name}</CardTitle>
          <CardDescription>{agent.author.name}</CardDescription>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 text-center">
        <div className="flex items-center justify-center space-x-4 text-sm">
          <div className="flex items-center space-x-1">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <span>{agent.downloads.toLocaleString()}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Star className="w-4 h-4 text-yellow-500 fill-current" />
            <span>{agent.rating}</span>
          </div>
        </div>

        <p className="text-sm text-muted-foreground line-clamp-2">
          {agent.description}
        </p>

        <Button className="w-full" onClick={(e) => {
          e.stopPropagation()
          onInstall()
        }} disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Plus className="w-4 h-4 mr-2" />
          )}
          {isLoading ? t('marketplace.adding') : t('marketplace.addToAgents')}
        </Button>
      </CardContent>
    </Card>
  )
}