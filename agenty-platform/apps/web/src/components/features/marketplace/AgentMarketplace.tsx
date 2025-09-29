'use client'

import { useState, useEffect } from 'react'
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
  Plus
} from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

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

const MOCK_AGENTS: MarketplaceAgent[] = [
  {
    id: 'agent-1',
    name: 'Customer Support Pro',
    description: 'Advanced customer support agent with multilingual capabilities and smart routing',
    author: {
      name: 'Agenty Team',
      verified: true
    },
    category: 'Customer Service',
    tags: ['customer-support', 'multilingual', 'routing', 'tickets'],
    rating: 4.8,
    downloads: 15420,
    likes: 892,
    price: 'free',
    featured: true,
    createdAt: new Date(2024, 0, 15),
    updatedAt: new Date(2024, 11, 10),
    configuration: {
      providers: ['OpenAI GPT-4', 'Deepgram', 'ElevenLabs'],
      languages: ['English', 'Spanish', 'French', 'German'],
      features: ['Intent Recognition', 'Sentiment Analysis', 'Ticket Creation']
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
    name: 'E-commerce Assistant',
    description: 'Specialized shopping assistant with product recommendations and order tracking',
    author: {
      name: 'RetailBot Inc',
      verified: true
    },
    category: 'E-commerce',
    tags: ['shopping', 'recommendations', 'orders', 'payments'],
    rating: 4.6,
    downloads: 8930,
    likes: 534,
    price: 'premium',
    featured: false,
    createdAt: new Date(2024, 1, 22),
    updatedAt: new Date(2024, 11, 8),
    configuration: {
      providers: ['Anthropic Claude', 'Azure Speech', 'Cartesia'],
      languages: ['English', 'Spanish'],
      features: ['Product Search', 'Order Tracking', 'Payment Processing']
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
    name: 'Healthcare Helper',
    description: 'HIPAA-compliant healthcare assistant for appointment scheduling and basic health queries',
    author: {
      name: 'MedTech Solutions',
      verified: true
    },
    category: 'Healthcare',
    tags: ['healthcare', 'appointments', 'hipaa', 'medical'],
    rating: 4.9,
    downloads: 3240,
    likes: 298,
    price: 'premium',
    featured: true,
    createdAt: new Date(2024, 2, 10),
    updatedAt: new Date(2024, 11, 12),
    configuration: {
      providers: ['OpenAI GPT-4', 'Google Speech', 'Azure TTS'],
      languages: ['English'],
      features: ['Appointment Booking', 'Symptom Checker', 'Medical Records']
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
    name: 'Educational Tutor',
    description: 'Interactive learning assistant for students with personalized curriculum support',
    author: {
      name: 'EduAI Labs',
      verified: false
    },
    category: 'Education',
    tags: ['education', 'tutoring', 'learning', 'students'],
    rating: 4.4,
    downloads: 12100,
    likes: 756,
    price: 'free',
    featured: false,
    createdAt: new Date(2024, 3, 5),
    updatedAt: new Date(2024, 11, 15),
    configuration: {
      providers: ['OpenAI GPT-3.5', 'Deepgram', 'PlayHT'],
      languages: ['English', 'Spanish', 'French'],
      features: ['Quiz Generation', 'Progress Tracking', 'Study Plans']
    },
    stats: {
      conversations: 35000,
      avgResponseTime: 380,
      satisfaction: 4.3,
      activeUsers: 2100
    }
  }
]

export function AgentMarketplace() {
  const { t } = useLanguage()
  const [agents, setAgents] = useState<MarketplaceAgent[]>(MOCK_AGENTS)
  const [filteredAgents, setFilteredAgents] = useState<MarketplaceAgent[]>(MOCK_AGENTS)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortBy, setSortBy] = useState('popular')
  const [currentTab, setCurrentTab] = useState('discover')

  const categories = [
    'all',
    'Customer Service',
    'E-commerce',
    'Healthcare',
    'Education',
    'Finance',
    'Entertainment',
    'Productivity'
  ]

  const sortOptions = [
    { value: 'popular', label: 'Most Popular' },
    { value: 'newest', label: 'Newest' },
    { value: 'rating', label: 'Highest Rated' },
    { value: 'downloads', label: 'Most Downloaded' }
  ]

  // Filter and sort agents
  useEffect(() => {
    let filtered = agents

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(agent =>
        agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        agent.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        agent.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }

    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(agent => agent.category === selectedCategory)
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
    setAgents(agents.map(agent =>
      agent.id === agentId
        ? { ...agent, likes: agent.likes + 1 }
        : agent
    ))
  }

  const handleInstall = (agentId: string) => {
    setAgents(agents.map(agent =>
      agent.id === agentId
        ? { ...agent, downloads: agent.downloads + 1 }
        : agent
    ))
    // Here you would implement the actual installation logic
    console.log('Installing agent:', agentId)
  }

  const getFeaturedAgents = () => agents.filter(agent => agent.featured)
  const getTrendingAgents = () => agents.slice().sort((a, b) => b.downloads - a.downloads).slice(0, 3)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Agent Marketplace</h1>
          <p className="text-muted-foreground mt-1">
            Discover, share, and install AI agents created by the community
          </p>
        </div>
        <Button>
          <Upload className="w-4 h-4 mr-2" />
          Publish Agent
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
                  placeholder="Search agents, categories, or features..."
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
                    <SelectItem key={category} value={category}>
                      {category === 'all' ? 'All Categories' : category}
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
          <TabsTrigger value="discover">Discover</TabsTrigger>
          <TabsTrigger value="featured">Featured</TabsTrigger>
          <TabsTrigger value="trending">Trending</TabsTrigger>
          <TabsTrigger value="my-agents">My Agents</TabsTrigger>
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
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {filteredAgents.length === 0 && (
            <div className="text-center py-12">
              <Bot className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No agents found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your search criteria or browse different categories
              </p>
              <Button variant="outline" onClick={() => {
                setSearchQuery('')
                setSelectedCategory('all')
              }}>
                Clear Filters
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
                />
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="my-agents" className="space-y-6 mt-6">
          <div className="text-center py-12">
            <Upload className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Share your agents</h3>
            <p className="text-muted-foreground mb-4">
              Publish your agents to the marketplace and help the community
            </p>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Publish Your First Agent
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function AgentCard({ agent, onLike, onInstall }: {
  agent: MarketplaceAgent
  onLike: () => void
  onInstall: () => void
}) {
  return (
    <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer group">
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
                by {agent.author.name}
                {agent.author.verified && (
                  <Award className="w-3 h-3 inline ml-1 text-blue-500" />
                )}
              </CardDescription>
            </div>
          </div>
          {agent.price === 'premium' && (
            <Badge variant="outline" className="text-yellow-600 border-yellow-600">
              Premium
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
          }}>
            <Download className="w-4 h-4 mr-2" />
            Install
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function FeaturedAgentCard({ agent, onLike, onInstall }: {
  agent: MarketplaceAgent
  onLike: () => void
  onInstall: () => void
}) {
  return (
    <Card className="relative overflow-hidden border-primary/50 bg-gradient-to-br from-primary/5 to-purple-500/5">
      <div className="absolute top-4 right-4">
        <Badge className="bg-primary text-primary-foreground">
          Featured
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
              by {agent.author.name}
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
            <div className="text-xs text-muted-foreground">Conversations</div>
          </div>
          <div>
            <div className="text-lg font-bold text-green-600">
              {agent.rating}
            </div>
            <div className="text-xs text-muted-foreground">Rating</div>
          </div>
          <div>
            <div className="text-lg font-bold text-blue-600">
              {agent.stats.avgResponseTime}ms
            </div>
            <div className="text-xs text-muted-foreground">Response</div>
          </div>
          <div>
            <div className="text-lg font-bold text-purple-600">
              {agent.stats.activeUsers}
            </div>
            <div className="text-xs text-muted-foreground">Users</div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4">
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" onClick={onLike}>
              <Heart className="w-4 h-4 mr-1" />
              {agent.likes}
            </Button>
            <Button variant="ghost" size="sm">
              <Share2 className="w-4 h-4" />
            </Button>
          </div>
          <Button onClick={onInstall}>
            <Download className="w-4 h-4 mr-2" />
            Install Now
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function TrendingAgentCard({ agent, rank, onLike, onInstall }: {
  agent: MarketplaceAgent
  rank: number
  onLike: () => void
  onInstall: () => void
}) {
  return (
    <Card className="relative">
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

        <Button className="w-full" onClick={onInstall}>
          <Download className="w-4 h-4 mr-2" />
          Install
        </Button>
      </CardContent>
    </Card>
  )
}