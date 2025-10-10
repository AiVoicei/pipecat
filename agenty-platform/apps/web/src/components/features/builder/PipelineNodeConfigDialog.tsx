'use client'

import { useState, useEffect } from 'react'
import { PipelineNode, usePipelineStore } from '@/stores/usePipelineStore'
import { useProviderStore } from '@/stores/useProviderStore'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
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
} from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { NodeConfiguration } from './types'

interface PipelineNodeConfigDialogProps {
  node: PipelineNode | null
  open: boolean
  onClose: () => void
}

/**
 * Dialog component for configuring a pipeline node with provider selection and node-specific settings.
 *
 * @param node - The pipeline node to configure (null if no node selected)
 * @param open - Whether the dialog is open
 * @param onClose - Callback when dialog should close
 * @returns A JSX element that renders the node configuration dialog
 */
export function PipelineNodeConfigDialog({ node, open, onClose }: PipelineNodeConfigDialogProps) {
  const { t } = useLanguage()
  const { updateNode, removeNode, selectNode } = usePipelineStore()
  const { providers, getProvidersByType } = useProviderStore()

  const [config, setConfig] = useState<NodeConfiguration>({})
  const [label, setLabel] = useState('')
  const [selectedProvider, setSelectedProvider] = useState('')

  // Update state when node changes
  useEffect(() => {
    if (node) {
      setConfig((node.data.configuration as NodeConfiguration) || {})
      setLabel(node.data.label)
      setSelectedProvider(node.data.provider || '')
    }
  }, [node])

  if (!node) return null

  // Get available providers for this node type
  const nodeType = node.data.type as 'stt' | 'llm' | 'tts' | 'realtime'
  const availableProviders = getProvidersByType(nodeType)

  const handleSave = () => {
    updateNode(node.id, {
      label,
      provider: selectedProvider,
      configuration: config,
      isConfigured: selectedProvider !== '' && Object.keys(config).length > 0 && config.apiKey !== undefined && config.apiKey !== ''
    })
    onClose()
  }

  // Update node label in real-time as user types
  const handleLabelChange = (newLabel: string) => {
    setLabel(newLabel)
    updateNode(node.id, { label: newLabel })
  }

  const handleDelete = () => {
    if (confirm(t('confirmDeleteNode', 'builder'))) {
      removeNode(node.id)
      selectNode(null)
      onClose()
    }
  }

  const handleDuplicate = () => {
    // This would create a duplicate node - simplified for now
    console.log('Duplicate node:', node.id)
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
                value={String(config.language || 'en')}
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
                value={String(config.model || '')}
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
                value={String(config.model || '')}
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
                value={String(config.maxTokens || 500)}
                onChange={(e) => setConfig({ ...config, maxTokens: parseInt(e.target.value) })}
                min={50}
                max={4000}
              />
            </div>

            <div>
              <Label htmlFor="systemPrompt">{t('systemPrompt', 'agents')}</Label>
              <Textarea
                id="systemPrompt"
                value={String(config.systemPrompt || '')}
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
                value={String(config.voice || '')}
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
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            {t('nodeConfiguration', 'builder')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">{t('basicInformation', 'builder')}</h3>

            <div>
              <Label htmlFor="nodeLabel">{t('nodeLabel', 'builder')}</Label>
              <Input
                id="nodeLabel"
                value={label}
                onChange={(e) => handleLabelChange(e.target.value)}
                placeholder={t('enterNodeLabel', 'builder')}
              />
            </div>

            <div>
              <Label htmlFor="nodeType">{t('nodeType', 'builder')}</Label>
              <div className="mt-1">
                <Badge variant="secondary">{node.data.type.toUpperCase()}</Badge>
              </div>
            </div>
          </div>

          <Separator />

          {/* Provider Selection */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">{t('providerSelection', 'builder')}</h3>

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

            {/* API Key Field */}
            {selectedProvider && (
              <div>
                <Label htmlFor="apiKey">API Key</Label>
                <Input
                  id="apiKey"
                  type="password"
                  value={String(config.apiKey || '')}
                  onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                  placeholder="Enter your API key"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Your API key is stored securely and used for authentication
                </p>
              </div>
            )}
          </div>

          {/* Provider Configuration */}
          {selectedProvider && (
            <>
              <Separator />
              <div className="space-y-4">
                <h3 className="text-sm font-medium">{t('providerConfiguration', 'builder')}</h3>
                {renderProviderConfig()}
              </div>
            </>
          )}

          <Separator />

          {/* Configuration Status */}
          <div className="flex items-center gap-2">
            {node.data.isConfigured ? (
              <>
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-600">{t('fullyConfigured', 'builder')}</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4 text-yellow-500" />
                <span className="text-sm text-yellow-600">{t('requiresConfiguration', 'builder')}</span>
              </>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-4">
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
      </DialogContent>
    </Dialog>
  )
}
