'use client'

import { useEffect, useState } from 'react'
import { Search, Filter, Star, Zap, Globe, Mic, Bot, Volume2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useLanguage } from '@/contexts/LanguageContext'
import { useProviderStore, Provider } from '@/stores/useProviderStore'

export default function ProvidersPage() {
  const { t } = useLanguage()
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('popularity')

  const {
    providers,
    isLoading,
    error,
    fetchProviders,
    getProvidersByType,
    getPopularProviders,
    searchProviders
  } = useProviderStore()

  useEffect(() => {
    fetchProviders()
  }, [fetchProviders])

  const getFilteredProviders = () => {
    let filtered = providers

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = searchProviders(searchQuery)
    }

    // Apply type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(provider => provider.type === typeFilter)
    }

    // Apply sorting
    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'popularity':
          return b.popularity - a.popularity
        case 'pricing':
          return (a.pricing.cost || 0) - (b.pricing.cost || 0)
        default:
          return b.popularity - a.popularity
      }
    })
  }

  const getTypeIcon = (type: Provider['type']) => {
    switch (type) {
      case 'stt':
        return <Mic className="w-4 h-4" />
      case 'llm':
        return <Bot className="w-4 h-4" />
      case 'tts':
        return <Volume2 className="w-4 h-4" />
      default:
        return <Star className="w-4 h-4" />
    }
  }

  const getTypeName = (type: Provider['type']) => {
    switch (type) {
      case 'stt':
        return t('speechToText', 'providers')
      case 'llm':
        return t('languageModel', 'providers')
      case 'tts':
        return t('textToSpeech', 'providers')
      default:
        return type.toUpperCase()
    }
  }

  const formatPricing = (pricing: Provider['pricing']) => {
    if (pricing.inputCost && pricing.outputCost) {
      return `$${pricing.inputCost}/$${pricing.outputCost} per token`
    }
    if (pricing.cost) {
      return `$${pricing.cost} ${pricing.model.replace('per_', 'per ')}`
    }
    return t('contactForPricing', 'providers')
  }

  const popularProviders = getPopularProviders()
  const filteredProviders = getFilteredProviders()

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
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
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">{t('aiProviders', 'providers')}</h1>
        <p className="text-muted-foreground mt-1">
          {t('chooseFromProviders', 'providers')}
        </p>
      </div>

      {/* Popular Providers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            {t('popularProviders', 'providers')}
          </CardTitle>
          <CardDescription>
            {t('mostUsedProviders', 'providers')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {popularProviders.map((provider) => (
              <div
                key={provider.id}
                className="flex items-center gap-3 p-3 border border-border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                  {getTypeIcon(provider.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{provider.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {getTypeName(provider.type)}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {provider.popularity}% popular
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('searchProviders', 'providers')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder={t('filterByType', 'providers')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('allTypes', 'providers')}</SelectItem>
            <SelectItem value="stt">{t('speechToText', 'providers')}</SelectItem>
            <SelectItem value="llm">{t('languageModel', 'providers')}</SelectItem>
            <SelectItem value="tts">{t('textToSpeech', 'providers')}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder={t('sortBy', 'providers')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="popularity">{t('popularity', 'providers')}</SelectItem>
            <SelectItem value="name">{t('name', 'providers')}</SelectItem>
            <SelectItem value="pricing">{t('pricing', 'providers')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Provider Tabs */}
      <Tabs value={typeFilter === 'all' ? 'all' : typeFilter} onValueChange={setTypeFilter}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">{t('allProviders', 'providers')}</TabsTrigger>
          <TabsTrigger value="stt" className="flex items-center gap-2">
            <Mic className="w-3 h-3" />
            {t('stt', 'providers')}
          </TabsTrigger>
          <TabsTrigger value="llm" className="flex items-center gap-2">
            <Bot className="w-3 h-3" />
            {t('llm', 'providers')}
          </TabsTrigger>
          <TabsTrigger value="tts" className="flex items-center gap-2">
            <Volume2 className="w-3 h-3" />
            {t('tts', 'providers')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value={typeFilter} className="mt-6">
          {filteredProviders.length === 0 ? (
            <Card className="p-8 text-center">
              <Filter className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {t('noProvidersFound', 'providers')}
              </h3>
              <p className="text-muted-foreground mb-4">
                {t('tryAdjustingFilters', 'providers')}
              </p>
              <Button onClick={() => { setSearchQuery(''); setTypeFilter('all') }}>
                {t('clearFilters', 'providers')}
              </Button>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredProviders.map((provider) => (
                <Card key={provider.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                          {getTypeIcon(provider.type)}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{provider.name}</CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline">
                              {getTypeName(provider.type)}
                            </Badge>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                              {provider.popularity}%
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <CardDescription className="line-clamp-2">
                      {provider.description}
                    </CardDescription>

                    {/* Capabilities */}
                    <div>
                      <h4 className="text-sm font-medium mb-2">{t('capabilities', 'providers')}</h4>
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
                    </div>

                    {/* Languages */}
                    {provider.supportedLanguages && provider.supportedLanguages.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                          <Globe className="w-3 h-3" />
                          {t('languages', 'providers')}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {provider.supportedLanguages.length} {t('languagesSupported', 'providers')}
                        </p>
                      </div>
                    )}

                    {/* Pricing */}
                    <div>
                      <h4 className="text-sm font-medium mb-1">{t('pricing', 'providers')}</h4>
                      <p className="text-sm text-muted-foreground">
                        {formatPricing(provider.pricing)}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-1" disabled>
                        {t('viewDetails', 'providers')}
                      </Button>
                      <Button variant="outline" disabled>
                        <Zap className="w-3 h-3 mr-1" />
                        {t('test', 'providers')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}