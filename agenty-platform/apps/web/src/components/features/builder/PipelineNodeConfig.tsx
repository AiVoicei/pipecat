'use client'

import { useState } from 'react'
import { PipelineNode, usePipelineStore } from '@/stores/usePipelineStore'
import { useProviderStore } from '@/stores/useProviderStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import {
  Settings,
  Trash2,
  Save,
  Copy,
  CheckCircle,
  AlertCircle,
  X
} from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

interface PipelineNodeConfigProps {
  node: PipelineNode
}

export function PipelineNodeConfig({ node }: PipelineNodeConfigProps) {
  const { t } = useLanguage()
  const { updateNode, removeNode, selectNode } = usePipelineStore()
  const { providers, getProvidersByType } = useProviderStore()

  const [config, setConfig] = useState(node.data.configuration || {})
  const [label, setLabel] = useState(node.data.label)
  const [selectedProvider, setSelectedProvider] = useState(node.data.provider || '')

  // Get available providers for this node type
  const availableProviders = getProvidersByType(node.data.type)

  const handleSave = () => {
    updateNode(node.id, {
      label,
      provider: selectedProvider,
      configuration: config,
      isConfigured: selectedProvider !== '' && Object.keys(config).length > 0
    })
  }

  const handleDelete = () => {
    if (confirm(t('confirmDeleteNode', 'builder'))) {
      removeNode(node.id)
      selectNode(null)
    }
  }

  const handleDuplicate = () => {
    // This would create a duplicate node - simplified for now
    console.log('Duplicate node:', node.id)
  }

  const handleClose = () => {
    selectNode(null)
  }

  const renderProviderConfig = () => {
    if (!selectedProvider) return null

    const provider = providers.find(p => p.name === selectedProvider)
    if (!provider) return null

    switch (node.data.type) {
      case 'stt':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="language">{t('language', 'agents')}</Label>
              <Select
                value={config.language || 'en'}
                onValueChange={(value) => setConfig({ ...config, language: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('selectLanguage', 'agents')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="he">Hebrew</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                  <SelectItem value="de">German</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="model">{t('model', 'agents')}</Label>
              <Select
                value={config.model || ''}
                onValueChange={(value) => setConfig({ ...config, model: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('selectModel', 'agents')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="whisper-1">Whisper v1</SelectItem>
                  <SelectItem value="nova-2">Nova 2</SelectItem>
                  <SelectItem value="enhanced">Enhanced</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="punctuation"
                checked={config.punctuation || false}
                onCheckedChange={(checked) => setConfig({ ...config, punctuation: checked })}
              />
              <Label htmlFor="punctuation">{t('enablePunctuation', 'agents')}</Label>
            </div>
          </div>
        )

      case 'llm':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="model">{t('model', 'agents')}</Label>
              <Select
                value={config.model || ''}
                onValueChange={(value) => setConfig({ ...config, model: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('selectModel', 'agents')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gpt-4">GPT-4</SelectItem>
                  <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                  <SelectItem value="claude-3-sonnet">Claude 3 Sonnet</SelectItem>
                  <SelectItem value="claude-3-haiku">Claude 3 Haiku</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="temperature">
                {t('temperature', 'agents')}: {config.temperature || 0.7}
              </Label>
              <Slider
                value={[config.temperature || 0.7]}
                onValueChange={([value]) => setConfig({ ...config, temperature: value })}
                max={2}
                min={0}
                step={0.1}
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="maxTokens">{t('maxTokens', 'agents')}</Label>
              <Input
                id="maxTokens"
                type="number"
                value={config.maxTokens || 500}
                onChange={(e) => setConfig({ ...config, maxTokens: parseInt(e.target.value) })}
                min={50}
                max={4000}
              />
            </div>

            <div>
              <Label htmlFor="systemPrompt">{t('systemPrompt', 'agents')}</Label>
              <Textarea
                id="systemPrompt"
                value={config.systemPrompt || ''}
                onChange={(e) => setConfig({ ...config, systemPrompt: e.target.value })}
                placeholder={t('enterSystemPrompt', 'agents')}
                rows={4}
              />
            </div>
          </div>
        )

      case 'tts':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="voice">{t('voice', 'agents')}</Label>
              <Select
                value={config.voice || ''}
                onValueChange={(value) => setConfig({ ...config, voice: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('selectVoice', 'agents')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alloy">Alloy</SelectItem>
                  <SelectItem value="echo">Echo</SelectItem>
                  <SelectItem value="fable">Fable</SelectItem>
                  <SelectItem value="onyx">Onyx</SelectItem>
                  <SelectItem value="nova">Nova</SelectItem>
                  <SelectItem value="shimmer">Shimmer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="speed">
                {t('speed', 'agents')}: {config.speed || 1.0}
              </Label>
              <Slider
                value={[config.speed || 1.0]}
                onValueChange={([value]) => setConfig({ ...config, speed: value })}
                max={2}
                min={0.5}
                step={0.1}
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="stability">
                {t('stability', 'agents')}: {config.stability || 0.8}
              </Label>
              <Slider
                value={[config.stability || 0.8]}
                onValueChange={([value]) => setConfig({ ...config, stability: value })}
                max={1}
                min={0}
                step={0.1}
                className="mt-2"
              />
            </div>
          </div>
        )

      default:
        return (
          <div className="text-sm text-muted-foreground">
            {t('noConfigurationAvailable', 'builder')}
          </div>
        )
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4" />
          <span className="font-medium">{t('nodeConfiguration', 'builder')}</span>
        </div>
        <Button variant="ghost" size="sm" onClick={handleClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{t('basicInformation', 'builder')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="nodeLabel">{t('nodeLabel', 'builder')}</Label>
              <Input
                id="nodeLabel"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder={t('enterNodeLabel', 'builder')}
              />
            </div>

            <div>
              <Label htmlFor="nodeType">{t('nodeType', 'builder')}</Label>
              <div className="mt-1">
                <Badge variant="secondary">{node.data.type.toUpperCase()}</Badge>
              </div>
            </div>

            <div>
              <Label htmlFor="nodeId">{t('nodeId', 'builder')}</Label>
              <Input id="nodeId" value={node.id} readOnly className="bg-muted" />
            </div>
          </CardContent>
        </Card>

        {/* Provider Selection */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{t('providerSelection', 'builder')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="provider">{t('provider', 'agents')}</Label>
              <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                <SelectTrigger>
                  <SelectValue placeholder={t('selectProvider', 'agents')} />
                </SelectTrigger>
                <SelectContent>
                  {availableProviders.map((provider) => (
                    <SelectItem key={provider.id} value={provider.name}>
                      {provider.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Provider Configuration */}
        {selectedProvider && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{t('providerConfiguration', 'builder')}</CardTitle>
            </CardHeader>
            <CardContent>
              {renderProviderConfig()}
            </CardContent>
          </Card>
        )}

        {/* Configuration Status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              {node.data.isConfigured ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <AlertCircle className="w-4 h-4 text-yellow-500" />
              )}
              {t('configurationStatus', 'builder')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              {node.data.isConfigured ? (
                <span className="text-green-600">{t('fullyConfigured', 'builder')}</span>
              ) : (
                <span className="text-yellow-600">{t('requiresConfiguration', 'builder')}</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="border-t p-4">
        <div className="flex gap-2">
          <Button onClick={handleSave} className="flex-1">
            <Save className="w-4 h-4 mr-2" />
            {t('saveConfiguration', 'builder')}
          </Button>
          <Button variant="outline" onClick={handleDuplicate}>
            <Copy className="w-4 h-4" />
          </Button>
          <Button variant="outline" onClick={handleDelete}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}