'use client'

import { useState, useMemo, useEffect } from 'react'
import { Search, Filter, Star, Globe, Zap, Clock, DollarSign } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useLanguage } from '@/contexts/LanguageContext'
import { useProviderStore, Provider } from '@/stores/useProviderStore'

interface ProviderMarketplaceProps {
  onProviderSelect?: (provider: Provider) => void
  selectedProviders?: string[]
  className?: string
}

export function ProviderMarketplace({
  onProviderSelect,
  selectedProviders = [],
  className
}: ProviderMarketplaceProps) {
  const { t } = useLanguage()
  const { providers, fetchProviders } = useProviderStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('popularity')
  const [filterType, setFilterType] = useState('all')
  const [showFavorites, setShowFavorites] = useState(false)

  // Initialize providers on mount
  useEffect(() => {
    fetchProviders()
  }, [])

  // Filter and sort providers
  const filteredProviders = useMemo(() => {
    let filtered = providers

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(provider =>
        provider.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        provider.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        provider.capabilities.some(cap => cap.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }

    // Type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(provider => provider.type === filterType)
    }

    // Favorites filter
    if (showFavorites) {
      filtered = filtered.filter(provider => provider.popularity >= 80)
    }

    // Sort
    switch (sortBy) {
      case 'popularity':
        return filtered.sort((a, b) => b.popularity - a.popularity)
      case 'name':
        return filtered.sort((a, b) => a.name.localeCompare(b.name))
      case 'price':
        return filtered.sort((a, b) => {
          const aPrice = a.pricing.cost || a.pricing.inputCost || 0
          const bPrice = b.pricing.cost || b.pricing.inputCost || 0
          return aPrice - bPrice
        })
      default:
        return filtered
    }
  }, [providers, searchQuery, filterType, sortBy, showFavorites])

  // Group providers by type
  const groupedProviders = useMemo(() => {
    const groups: { [key: string]: Provider[] } = {
      stt: [],
      llm: [],
      tts: [],
      realtime: []
    }

    filteredProviders.forEach(provider => {
      groups[provider.type].push(provider)
    })

    return groups
  }, [filteredProviders])

  const formatPricing = (pricing: Provider['pricing']) => {
    if (pricing.inputCost && pricing.outputCost) {
      return `$${pricing.inputCost}/$${pricing.outputCost}/1K`
    }
    if (pricing.cost) {
      return `$${pricing.cost}/${pricing.model.replace('per_', '')}`
    }
    return t('contactForPricing', 'providers')
  }

  const getProviderIcon = (provider: Provider) => {
    const firstLetter = provider.name.charAt(0).toUpperCase()
    return (
      <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/40 rounded-lg flex items-center justify-center">
        <span className="text-lg font-bold text-primary">
          {firstLetter}
        </span>
      </div>
    )
  }

  const renderProviderCard = (provider: Provider) => {
    const isSelected = selectedProviders.includes(provider.id)

    return (
      <Card
        key={provider.id}
        className={`cursor-pointer transition-all hover:shadow-lg group ${
          isSelected ? 'ring-2 ring-primary border-primary' : 'hover:border-primary/50'
        }`}
        onClick={() => onProviderSelect?.(provider)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {getProviderIcon(provider)}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <CardTitle className="text-lg">{provider.name}</CardTitle>
                  {provider.popularity >= 90 && (
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  )}
                  <Badge variant="outline" className="text-xs">
                    {provider.type.toUpperCase()}
                  </Badge>
                </div>
                <CardDescription className="line-clamp-2">
                  {provider.description}
                </CardDescription>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Badge variant="secondary" className="text-xs">
                {provider.popularity}% popular
              </Badge>
              {isSelected && (
                <Badge variant="default" className="text-xs">
                  {t('selected', 'providers')}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="space-y-3">
            {/* Capabilities */}
            <div className="flex flex-wrap gap-1">
              {provider.capabilities.slice(0, 3).map((capability) => (
                <Badge key={capability} variant="secondary" className="text-xs">
                  {capability.replace('_', ' ')}
                </Badge>
              ))}
              {provider.capabilities.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{provider.capabilities.length - 3} more
                </Badge>
              )}
            </div>

            {/* Stats */}
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <DollarSign className="w-3 h-3" />
                  <span className="text-xs">{formatPricing(provider.pricing)}</span>
                </div>
                {provider.supportedLanguages && (
                  <div className="flex items-center gap-1">
                    <Globe className="w-3 h-3" />
                    <span className="text-xs">{provider.supportedLanguages.length} langs</span>
                  </div>
                )}
                {provider.capabilities.includes('real_time') && (
                  <div className="flex items-center gap-1">
                    <Zap className="w-3 h-3 text-green-500" />
                    <span className="text-xs text-green-600">{t('realTime', 'providers')}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Button */}
            <div className="pt-2 border-t">
              <Button
                size="sm"
                variant={isSelected ? "default" : "outline"}
                className="w-full"
                onClick={(e) => {
                  e.stopPropagation()
                  onProviderSelect?.(provider)
                }}
              >
                {isSelected ? t('selected', 'providers') : t('selectProvider', 'providers')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={className}>
      {/* Header */}
      <div className="space-y-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">{t('providerMarketplace', 'providers')}</h1>
          <p className="text-muted-foreground">
            {t('chooseFromProviders', 'providers')} {providers.length}+ {t('aiProviders', 'providers')}
          </p>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={t('searchProviders', 'providers')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex gap-2">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="popularity">{t('popularity', 'providers')}</SelectItem>
                <SelectItem value="name">{t('name', 'providers')}</SelectItem>
                <SelectItem value="price">{t('price', 'providers')}</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant={showFavorites ? "default" : "outline"}
              size="sm"
              onClick={() => setShowFavorites(!showFavorites)}
            >
              <Star className="w-4 h-4 mr-1" />
              {t('popular', 'providers')}
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <div className="text-center p-3 bg-muted/30 rounded-lg">
            <div className="text-2xl font-bold text-primary">{groupedProviders.stt.length}</div>
            <div className="text-xs text-muted-foreground">{t('sttProviders', 'providers')}</div>
          </div>
          <div className="text-center p-3 bg-muted/30 rounded-lg">
            <div className="text-2xl font-bold text-primary">{groupedProviders.llm.length}</div>
            <div className="text-xs text-muted-foreground">{t('llmProviders', 'providers')}</div>
          </div>
          <div className="text-center p-3 bg-muted/30 rounded-lg">
            <div className="text-2xl font-bold text-primary">{groupedProviders.tts.length}</div>
            <div className="text-xs text-muted-foreground">{t('ttsProviders', 'providers')}</div>
          </div>
          <div className="text-center p-3 bg-muted/30 rounded-lg">
            <div className="text-2xl font-bold text-primary">{groupedProviders.realtime.length}</div>
            <div className="text-xs text-muted-foreground">Realtime</div>
          </div>
          <div className="text-center p-3 bg-muted/30 rounded-lg">
            <div className="text-2xl font-bold text-primary">{filteredProviders.length}</div>
            <div className="text-xs text-muted-foreground">{t('totalProviders', 'providers')}</div>
          </div>
        </div>
      </div>

      {/* Provider Categories */}
      <Tabs value={filterType} onValueChange={setFilterType}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">{t('all', 'providers')} ({filteredProviders.length})</TabsTrigger>
          <TabsTrigger value="stt">STT ({groupedProviders.stt.length})</TabsTrigger>
          <TabsTrigger value="llm">LLM ({groupedProviders.llm.length})</TabsTrigger>
          <TabsTrigger value="tts">TTS ({groupedProviders.tts.length})</TabsTrigger>
          <TabsTrigger value="realtime">Realtime ({groupedProviders.realtime.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          {/* All Providers */}
          <div className="space-y-8">
            {Object.entries(groupedProviders).map(([type, typeProviders]) => (
              typeProviders.length > 0 && (
                <div key={type} className="space-y-4">
                  <h2 className="text-xl font-semibold capitalize">
                    {type.toUpperCase()} {t('providers', 'providers')} ({typeProviders.length})
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {typeProviders.map(renderProviderCard)}
                  </div>
                </div>
              )
            ))}
          </div>
        </TabsContent>

        <TabsContent value="stt" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {groupedProviders.stt.map(renderProviderCard)}
          </div>
        </TabsContent>

        <TabsContent value="llm" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {groupedProviders.llm.map(renderProviderCard)}
          </div>
        </TabsContent>

        <TabsContent value="tts" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {groupedProviders.tts.map(renderProviderCard)}
          </div>
        </TabsContent>

        <TabsContent value="realtime" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {groupedProviders.realtime.map(renderProviderCard)}
          </div>
        </TabsContent>
      </Tabs>

      {/* Empty State */}
      {filteredProviders.length === 0 && (
        <div className="text-center py-12">
          <Filter className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">{t('noProvidersFound', 'providers')}</h3>
          <p className="text-muted-foreground mb-4">{t('tryDifferentFilters', 'providers')}</p>
          <Button variant="outline" onClick={() => {
            setSearchQuery('')
            setFilterType('all')
            setShowFavorites(false)
          }}>
            {t('clearFilters', 'providers')}
          </Button>
        </div>
      )}
    </div>
  )
}