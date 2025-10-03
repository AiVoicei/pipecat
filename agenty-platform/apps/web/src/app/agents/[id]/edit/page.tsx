'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Save } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useLanguage } from '@/contexts/LanguageContext'
import { useAgentStore } from '@/stores/useAgentStore'
import { Agent, UpdateAgentRequest, AgentConfiguration } from '@/services/api'
import { AppLayout } from '@/components/layout/AppLayout'
import { AdvancedConfiguration } from '@/components/features/builder/AdvancedConfiguration'
import Link from 'next/link'

export default function EditAgentPage() {
  const { t } = useLanguage()
  const params = useParams()
  const router = useRouter()
  const agentId = params.id as string

  const { agents, isLoading, updateAgent, fetchAgents } = useAgentStore()

  const [agent, setAgent] = useState<Agent | null>(null)
  const [formData, setFormData] = useState<UpdateAgentRequest>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (agents.length === 0) {
      fetchAgents()
    } else {
      const foundAgent = agents.find(a => a.id === agentId)
      if (foundAgent) {
        setAgent(foundAgent)
        setFormData({
          name: foundAgent.name,
          description: foundAgent.description,
          status: foundAgent.status,
          configuration: foundAgent.configuration,
          deploymentConfig: foundAgent.deploymentConfig
        })
      }
    }
  }, [agentId, agents, fetchAgents])

  useEffect(() => {
    if (agents.length > 0) {
      const foundAgent = agents.find(a => a.id === agentId)
      if (foundAgent) {
        setAgent(foundAgent)
        setFormData({
          name: foundAgent.name,
          description: foundAgent.description,
          status: foundAgent.status,
          configuration: foundAgent.configuration,
          deploymentConfig: foundAgent.deploymentConfig
        })
      }
    }
  }, [agentId, agents])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name?.trim()) {
      newErrors.name = t('nameRequired', 'agents')
    }

    if (!formData.description?.trim()) {
      newErrors.description = t('descriptionRequired', 'agents')
    }

    if (formData.configuration?.llm.systemPrompt && !formData.configuration.llm.systemPrompt.trim()) {
      newErrors.systemPrompt = t('systemPromptRequired', 'agents')
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      await updateAgent(agentId, formData)
      router.push(`/agents/${agentId}`)
    } catch (error) {
      console.error('Failed to update agent:', error)
    }
  }

  const handleConfigurationChange = (
    section: keyof AgentConfiguration,
    field: string,
    value: string | number | boolean
  ) => {
    setFormData(prev => ({
      ...prev,
      configuration: {
        ...prev.configuration!,
        [section]: {
          ...prev.configuration![section],
          [field]: value
        }
      }
    }))
  }

  if (isLoading && !agent) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 w-64 bg-muted rounded mb-2"></div>
          <div className="h-4 w-96 bg-muted/50 rounded"></div>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-96 bg-muted rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!agent) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/agents">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('back', 'common')}
            </Link>
          </Button>
          <h1 className="text-3xl font-bold text-foreground">{t('agentNotFound', 'agents')}</h1>
        </div>
      </div>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/agents/${agentId}`}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('back', 'common')}
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t('editAgent', 'agents')}</h1>
          <p className="text-muted-foreground mt-1">
            {t('editingAgent', 'agents')}: {agent.name}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>{t('basicInformation', 'agents')}</CardTitle>
              <CardDescription>
                {t('basicInformationDesc', 'agents')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t('agentName', 'agents')}</Label>
                <Input
                  id="name"
                  value={formData.name || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder={t('enterAgentName', 'agents')}
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">{t('description', 'agents')}</Label>
                <Textarea
                  id="description"
                  value={formData.description || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder={t('enterDescription', 'agents')}
                  rows={3}
                  className={errors.description ? 'border-red-500' : ''}
                />
                {errors.description && (
                  <p className="text-sm text-red-500">{errors.description}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">{t('status', 'agents')}</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData(prev => ({
                    ...prev,
                    status: value as 'active' | 'inactive' | 'draft'
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('selectStatus', 'agents')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">{t('draft', 'agents')}</SelectItem>
                    <SelectItem value="active">{t('active', 'dashboard')}</SelectItem>
                    <SelectItem value="inactive">{t('inactive', 'dashboard')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="deployment">{t('deploymentType', 'agents')}</Label>
                <Select
                  value={formData.deploymentConfig?.type}
                  onValueChange={(value) => setFormData(prev => ({
                    ...prev,
                    deploymentConfig: { ...prev.deploymentConfig!, type: value as 'webrtc' | 'phone' | 'whatsapp' | 'api' }
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('selectDeploymentType', 'agents')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="webrtc">{t('webRTC', 'agents')}</SelectItem>
                    <SelectItem value="phone">{t('phoneCall', 'agents')}</SelectItem>
                    <SelectItem value="whatsapp">{t('whatsApp', 'agents')}</SelectItem>
                    <SelectItem value="api">{t('apiOnly', 'agents')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* AI Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>{t('aiConfiguration', 'agents')}</CardTitle>
              <CardDescription>
                {t('aiConfigurationDesc', 'agents')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* STT Configuration */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">{t('speechToText', 'agents')}</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Select
                    value={formData.configuration?.stt.provider}
                    onValueChange={(value) => handleConfigurationChange('stt', 'provider', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="OpenAI">OpenAI</SelectItem>
                      <SelectItem value="Deepgram">Deepgram</SelectItem>
                      <SelectItem value="Google">Google</SelectItem>
                      <SelectItem value="Azure">Azure</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={formData.configuration?.stt.language}
                    onValueChange={(value) => handleConfigurationChange('stt', 'language', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
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
              </div>

              {/* LLM Configuration */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">{t('languageModel', 'agents')}</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Select
                    value={formData.configuration?.llm.provider}
                    onValueChange={(value) => handleConfigurationChange('llm', 'provider', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="OpenAI">OpenAI</SelectItem>
                      <SelectItem value="Anthropic">Anthropic</SelectItem>
                      <SelectItem value="Google">Google</SelectItem>
                      <SelectItem value="Azure">Azure</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={formData.configuration?.llm.model}
                    onValueChange={(value) => handleConfigurationChange('llm', 'model', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                      <SelectItem value="gpt-4">GPT-4</SelectItem>
                      <SelectItem value="claude-3-sonnet">Claude 3 Sonnet</SelectItem>
                      <SelectItem value="claude-3-haiku">Claude 3 Haiku</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="systemPrompt">{t('systemPrompt', 'agents')}</Label>
                  <Textarea
                    id="systemPrompt"
                    value={formData.configuration?.llm.systemPrompt || ''}
                    onChange={(e) => handleConfigurationChange('llm', 'systemPrompt', e.target.value)}
                    placeholder={t('enterSystemPrompt', 'agents')}
                    rows={4}
                    className={errors.systemPrompt ? 'border-red-500' : ''}
                  />
                  {errors.systemPrompt && (
                    <p className="text-sm text-red-500">{errors.systemPrompt}</p>
                  )}
                </div>
              </div>

              {/* TTS Configuration */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">{t('textToSpeech', 'agents')}</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Select
                    value={formData.configuration?.tts.provider}
                    onValueChange={(value) => handleConfigurationChange('tts', 'provider', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="OpenAI">OpenAI</SelectItem>
                      <SelectItem value="ElevenLabs">ElevenLabs</SelectItem>
                      <SelectItem value="Azure">Azure</SelectItem>
                      <SelectItem value="Cartesia">Cartesia</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={formData.configuration?.tts.voice}
                    onValueChange={(value) => handleConfigurationChange('tts', 'voice', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="alloy">Alloy</SelectItem>
                      <SelectItem value="echo">Echo</SelectItem>
                      <SelectItem value="fable">Fable</SelectItem>
                      <SelectItem value="nova">Nova</SelectItem>
                      <SelectItem value="shimmer">Shimmer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Advanced Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>{t('advancedConfiguration', 'agents')}</CardTitle>
            <CardDescription>
              {t('advancedConfigurationDesc', 'agents')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AdvancedConfiguration
              config={formData.configuration || agent.configuration}
              onChange={(newConfig) => setFormData(prev => ({ ...prev, configuration: newConfig }))}
            />
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-between">
          <Button type="button" variant="outline" asChild>
            <Link href={`/agents/${agentId}`}>
              {t('cancel', 'common')}
            </Link>
          </Button>
          <Button type="submit" disabled={isLoading}>
            <Save className="w-4 h-4 mr-2" />
            {isLoading ? t('saving', 'agents') : t('saveChanges', 'agents')}
          </Button>
        </div>
      </form>
      </div>
    </AppLayout>
  )
}