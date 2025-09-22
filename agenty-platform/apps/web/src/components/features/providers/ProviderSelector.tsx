'use client'

import { useState, useEffect } from 'react'
import { Check, Star, Globe, Zap } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { useLanguage } from '@/contexts/LanguageContext'
import { useProviderStore, Provider } from '@/stores/useProviderStore'

interface ProviderSelectorProps {
  type: 'stt' | 'llm' | 'tts'
  selectedProvider?: string
  onProviderChange: (providerId: string, provider: Provider) => void
  className?: string
}

export function ProviderSelector({
  type,
  selectedProvider,
  onProviderChange,
  className
}: ProviderSelectorProps) {
  const { t } = useLanguage()
  const { providers, fetchProviders, getProvidersByType } = useProviderStore()
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    if (providers.length === 0) {
      fetchProviders()
    }
  }, [providers.length, fetchProviders])

  const typeProviders = getProvidersByType(type)
  const popularProviders = typeProviders
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, 3)
  const displayProviders = showAll ? typeProviders : popularProviders

  const getTypeTitle = () => {
    switch (type) {
      case 'stt':
        return t('selectSTTProvider', 'providers')
      case 'llm':
        return t('selectLLMProvider', 'providers')
      case 'tts':
        return t('selectTTSProvider', 'providers')
      default:
        return t('selectProvider', 'providers')
    }
  }

  const getTypeDescription = () => {
    switch (type) {
      case 'stt':
        return t('sttProviderDesc', 'providers')
      case 'llm':
        return t('llmProviderDesc', 'providers')
      case 'tts':
        return t('ttsProviderDesc', 'providers')
      default:
        return t('selectProviderDesc', 'providers')
    }
  }

  const formatPricing = (pricing: Provider['pricing']) => {
    if (pricing.inputCost && pricing.outputCost) {
      return `$${pricing.inputCost}/$${pricing.outputCost}/1K tokens`
    }
    if (pricing.cost) {
      return `$${pricing.cost}/${pricing.model.replace('per_', '')}`
    }
    return t('contactForPricing', 'providers')
  }

  const handleProviderSelect = (provider: Provider) => {
    onProviderChange(provider.id, provider)
  }

  const selectedProviderData = providers.find(p => p.id === selectedProvider)

  return (
    <div className={className}>
      <div className="space-y-4">
        <div>
          <Label className="text-base font-medium">{getTypeTitle()}</Label>
          <p className="text-sm text-muted-foreground mt-1">
            {getTypeDescription()}
          </p>
        </div>

        {/* Quick Select */}
        <div className="space-y-2">
          <Label className="text-sm">{t('quickSelect', 'providers')}</Label>
          <Select
            value={selectedProvider || ''}
            onValueChange={(value) => {
              const provider = providers.find(p => p.id === value)
              if (provider) {
                handleProviderSelect(provider)
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('chooseProvider', 'providers')} />
            </SelectTrigger>
            <SelectContent>
              {typeProviders.map((provider) => (
                <SelectItem key={provider.id} value={provider.id}>
                  <div className="flex items-center gap-2">
                    <span>{provider.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {provider.popularity}% popular
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Provider Cards */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm">{t('browseProviders', 'providers')}</Label>
            {typeProviders.length > 3 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAll(!showAll)}
              >
                {showAll
                  ? t('showLess', 'providers')
                  : t('showAll', 'providers') + ` (${typeProviders.length})`
                }
              </Button>
            )}
          </div>

          <div className="grid gap-3">
            {displayProviders.map((provider) => (
              <Card
                key={provider.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedProvider === provider.id
                    ? 'ring-2 ring-primary border-primary'
                    : 'hover:border-primary/50'
                }`}
                onClick={() => handleProviderSelect(provider)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                        <span className="text-sm font-bold">
                          {provider.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{provider.name}</h4>
                          {provider.popularity >= 90 && (
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {provider.description}
                        </p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-muted-foreground">
                            {formatPricing(provider.pricing)}
                          </span>
                          {provider.supportedLanguages && (
                            <div className="flex items-center gap-1">
                              <Globe className="w-3 h-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">
                                {provider.supportedLanguages.length} langs
                              </span>
                            </div>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {provider.popularity}% popular
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {provider.capabilities.includes('real_time') && (
                        <Zap className="w-3 h-3 text-green-500" title={t('realTime', 'providers')} />
                      )}
                      {selectedProvider === provider.id && (
                        <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-primary-foreground" />
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Selected Provider Details */}
        {selectedProviderData && (
          <Card className="border-primary/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                {t('selectedProvider', 'providers')}: {selectedProviderData.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  {selectedProviderData.description}
                </p>
                <div className="flex flex-wrap gap-1">
                  {selectedProviderData.capabilities.slice(0, 4).map((capability) => (
                    <Badge key={capability} variant="secondary" className="text-xs">
                      {capability.replace('_', ' ')}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('pricing', 'providers')}: {formatPricing(selectedProviderData.pricing)}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}