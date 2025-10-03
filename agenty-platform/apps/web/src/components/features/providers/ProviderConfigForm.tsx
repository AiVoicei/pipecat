'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { useLanguage } from '@/contexts/LanguageContext'
import { useProviderStore, Provider } from '@/stores/useProviderStore'
import { Settings, Eye, EyeOff } from 'lucide-react'

interface ProviderConfigFormProps {
  providerId: string
  type: 'stt' | 'llm' | 'tts' | 'realtime'
  config: Record<string, unknown>
  onConfigChange: (config: Record<string, unknown>) => void
  className?: string
}

export function ProviderConfigForm({
  providerId,
  type,
  config,
  onConfigChange,
  className
}: ProviderConfigFormProps) {
  const { t } = useLanguage()
  const { providers } = useProviderStore()
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)

  const provider = providers.find(p => p.id === providerId)

  if (!provider) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">{t('selectProviderFirst', 'providers')}</p>
        </CardContent>
      </Card>
    )
  }

  const schema = provider.configurationSchema
  const properties = schema.properties || {}
  const required = schema.required || []

  const renderField = (fieldName: string, fieldSchema: Record<string, unknown>) => {
    const value = config[fieldName]
    const isRequired = required.includes(fieldName)
    const isAdvanced = !['model', 'voice', 'language', 'systemPrompt'].includes(fieldName)

    if (isAdvanced && !showAdvanced) {
      return null
    }

    const updateValue = (newValue: string | number | boolean) => {
      onConfigChange({
        ...config,
        [fieldName]: newValue
      })
    }

    // Helper to safely convert value to string
    const asString = (val: unknown, defaultVal = ''): string => {
      if (val === null || val === undefined) return defaultVal
      return String(val)
    }

    // Helper to safely convert value to number
    const asNumber = (val: unknown, defaultVal = 0): number => {
      if (val === null || val === undefined) return defaultVal
      const num = Number(val)
      return isNaN(num) ? defaultVal : num
    }

    switch (fieldSchema.type) {
      case 'string':
        if (fieldSchema.enum && Array.isArray(fieldSchema.enum)) {
          const defaultStr = typeof fieldSchema.default === 'string' ? fieldSchema.default : ''
          return (
            <div key={fieldName} className="space-y-2">
              <Label htmlFor={fieldName}>
                {fieldName}
                {isRequired && <span className="text-red-500 ml-1">*</span>}
              </Label>
              <Select value={asString(value, defaultStr)} onValueChange={updateValue}>
                <SelectTrigger>
                  <SelectValue placeholder={`Select ${fieldName}`} />
                </SelectTrigger>
                <SelectContent>
                  {fieldSchema.enum.map((option) => (
                    <SelectItem key={String(option)} value={String(option)}>
                      {String(option)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldSchema.description && typeof fieldSchema.description === 'string' && (
                <p className="text-xs text-muted-foreground">{fieldSchema.description}</p>
              )}
            </div>
          )
        }

        if (fieldName === 'systemPrompt') {
          const defaultStr = typeof fieldSchema.default === 'string' ? fieldSchema.default : ''
          return (
            <div key={fieldName} className="space-y-2">
              <Label htmlFor={fieldName}>
                {t('systemPrompt', 'agents')}
                {isRequired && <span className="text-red-500 ml-1">*</span>}
              </Label>
              <Textarea
                id={fieldName}
                value={asString(value, defaultStr)}
                onChange={(e) => updateValue(e.target.value)}
                placeholder={t('enterSystemPrompt', 'agents')}
                rows={4}
              />
              {fieldSchema.description && typeof fieldSchema.description === 'string' && (
                <p className="text-xs text-muted-foreground">{fieldSchema.description}</p>
              )}
            </div>
          )
        }

        const defaultStrValue = typeof fieldSchema.default === 'string' ? fieldSchema.default : ''
        return (
          <div key={fieldName} className="space-y-2">
            <Label htmlFor={fieldName}>
              {fieldName}
              {isRequired && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={fieldName}
              value={asString(value, defaultStrValue)}
              onChange={(e) => updateValue(e.target.value)}
              placeholder={`Enter ${fieldName}`}
            />
            {fieldSchema.description && typeof fieldSchema.description === 'string' && (
              <p className="text-xs text-muted-foreground">{fieldSchema.description}</p>
            )}
          </div>
        )

      case 'number':
        const defaultNum = typeof fieldSchema.default === 'number' ? fieldSchema.default : 0
        const minNum = typeof fieldSchema.minimum === 'number' ? fieldSchema.minimum : undefined
        const maxNum = typeof fieldSchema.maximum === 'number' ? fieldSchema.maximum : undefined

        if (minNum !== undefined && maxNum !== undefined) {
          const currentValue = asNumber(value, defaultNum)
          return (
            <div key={fieldName} className="space-y-2">
              <Label htmlFor={fieldName}>
                {fieldName}: {currentValue}
                {isRequired && <span className="text-red-500 ml-1">*</span>}
              </Label>
              <Slider
                value={[currentValue]}
                onValueChange={(newValue) => updateValue(newValue[0])}
                min={minNum}
                max={maxNum}
                step={0.1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{minNum}</span>
                <span>{maxNum}</span>
              </div>
              {fieldSchema.description && typeof fieldSchema.description === 'string' && (
                <p className="text-xs text-muted-foreground">{fieldSchema.description}</p>
              )}
            </div>
          )
        }

        return (
          <div key={fieldName} className="space-y-2">
            <Label htmlFor={fieldName}>
              {fieldName}
              {isRequired && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={fieldName}
              type="number"
              value={asNumber(value, defaultNum)}
              onChange={(e) => updateValue(parseFloat(e.target.value) || 0)}
              min={minNum}
              max={maxNum}
            />
            {fieldSchema.description && typeof fieldSchema.description === 'string' && (
              <p className="text-xs text-muted-foreground">{fieldSchema.description}</p>
            )}
          </div>
        )

      case 'integer':
        return (
          <div key={fieldName} className="space-y-2">
            <Label htmlFor={fieldName}>
              {fieldName}
              {isRequired && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={fieldName}
              type="number"
              value={value || fieldSchema.default || ''}
              onChange={(e) => updateValue(parseInt(e.target.value) || 0)}
              min={fieldSchema.minimum}
              max={fieldSchema.maximum}
            />
            {fieldSchema.description && (
              <p className="text-xs text-muted-foreground">{fieldSchema.description}</p>
            )}
          </div>
        )

      case 'boolean':
        return (
          <div key={fieldName} className="flex items-center justify-between space-y-2">
            <div className="space-y-0.5">
              <Label htmlFor={fieldName}>
                {fieldName}
                {isRequired && <span className="text-red-500 ml-1">*</span>}
              </Label>
              {fieldSchema.description && typeof fieldSchema.description === 'string' && (
                <p className="text-xs text-muted-foreground">{fieldSchema.description}</p>
              )}
            </div>
            <Switch
              id={fieldName}
              checked={value !== undefined ? value : fieldSchema.default}
              onCheckedChange={updateValue}
            />
          </div>
        )

      default:
        return null
    }
  }

  const basicFields = Object.entries(properties).filter(([fieldName]) =>
    ['model', 'voice', 'language', 'systemPrompt'].includes(fieldName)
  )

  const advancedFields = Object.entries(properties).filter(([fieldName]) =>
    !['model', 'voice', 'language', 'systemPrompt'].includes(fieldName)
  )

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-4 h-4" />
          {provider.name} {t('configuration', 'providers')}
        </CardTitle>
        <CardDescription>
          {t('configureProvider', 'providers')}: {provider.name}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* API Key Section */}
        <div className="space-y-2">
          <Label htmlFor="apiKey">
            {t('apiKey', 'providers')}
            <span className="text-red-500 ml-1">*</span>
          </Label>
          <div className="relative">
            <Input
              id="apiKey"
              type={showApiKey ? 'text' : 'password'}
              value={config.apiKey || ''}
              onChange={(e) => onConfigChange({ ...config, apiKey: e.target.value })}
              placeholder={`Enter ${provider.name} API key`}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 transform -translate-y-1/2"
              onClick={() => setShowApiKey(!showApiKey)}
            >
              {showApiKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            {t('apiKeySecure', 'providers')}
          </p>
        </div>

        {/* Basic Configuration */}
        {basicFields.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h4 className="font-medium">{t('basicSettings', 'providers')}</h4>
              <Badge variant="secondary">{t('required', 'providers')}</Badge>
            </div>
            {basicFields.map(([fieldName, fieldSchema]) => renderField(fieldName, fieldSchema))}
          </div>
        )}

        {/* Advanced Configuration */}
        {advancedFields.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h4 className="font-medium">{t('advancedSettings', 'providers')}</h4>
                <Badge variant="outline">{t('optional', 'providers')}</Badge>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                {showAdvanced ? t('hideAdvanced', 'providers') : t('showAdvanced', 'providers')}
              </Button>
            </div>
            {showAdvanced && (
              <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
                {advancedFields.map(([fieldName, fieldSchema]) => renderField(fieldName, fieldSchema))}
              </div>
            )}
          </div>
        )}

        {/* Provider Info */}
        <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
          <h4 className="font-medium text-sm">{t('providerInfo', 'providers')}</h4>
          <div className="space-y-1 text-xs text-muted-foreground">
            <p><strong>{t('capabilities', 'providers')}:</strong> {provider.capabilities.join(', ')}</p>
            {provider.supportedLanguages && (
              <p><strong>{t('languages', 'providers')}:</strong> {provider.supportedLanguages.slice(0, 5).join(', ')}{provider.supportedLanguages.length > 5 && '...'}</p>
            )}
            <p><strong>{t('popularity', 'providers')}:</strong> {provider.popularity}%</p>
          </div>
        </div>

        {/* Test Connection Button */}
        <Button variant="outline" className="w-full" disabled>
          {t('testConnection', 'providers')}
        </Button>
      </CardContent>
    </Card>
  )
}