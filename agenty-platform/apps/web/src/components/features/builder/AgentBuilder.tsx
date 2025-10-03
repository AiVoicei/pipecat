'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Bot,
  Settings,
  TestTube,
  Save,
  Play,
  CheckCircle,
  AlertCircle,
  Info,
  ArrowRight,
  ArrowLeft,
  Zap
} from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { useAgentStore } from '@/stores/useAgentStore'
import { useProviderStore, Provider } from '@/stores/useProviderStore'
import { PipelineBuilder } from './PipelineBuilder'
import { ProviderSelector } from '../providers/ProviderSelector'
import { ProviderConfigForm } from '../providers/ProviderConfigForm'

interface AgentConfiguration {
  name: string
  description: string
  stt: {
    provider: string
    config: Record<string, any>
  } | null
  llm: {
    provider: string
    config: Record<string, any>
  } | null
  tts: {
    provider: string
    config: Record<string, any>
  } | null
  realtime: {
    provider: string
    config: Record<string, any>
  } | null
  transport: {
    type: 'webrtc' | 'websocket' | 'twilio' | 'phone' | 'whatsapp' | 'api'
    settings?: Record<string, any>
  }
  systemPrompt: string
}

interface AgentBuilderProps {
  agentId?: string
  templateId?: string
  onSave?: (agent: any) => void
  onTest?: (agent: any) => void
}

/**
 * Render a multi-step UI to create or edit an agent configuration.
 *
 * The component manages local agent configuration state (basic info, providers, transport,
 * and system prompt), step navigation, validation, and actions to save or test the agent.
 *
 * @param agentId - Optional ID of an existing agent to load for editing; when provided the component populates the form from the agent data.
 * @param templateId - Optional template ID to initialize the form (placeholder: not yet implemented).
 * @param onSave - Optional callback invoked with the final agent data after a successful save.
 * @param onTest - Optional callback invoked with the current configuration when starting a test.
 * @returns The React element for the AgentBuilder UI.
 */
export function AgentBuilder({ agentId, templateId, onSave, onTest }: AgentBuilderProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const { agents, createAgent, updateAgent } = useAgentStore()
  const { providers } = useProviderStore()

  const [currentStep, setCurrentStep] = useState(0)
  const [config, setConfig] = useState<AgentConfiguration>({
    name: '',
    description: '',
    stt: null,
    llm: null,
    tts: null,
    realtime: null,
    transport: {
      type: 'webrtc',
      settings: {}
    },
    systemPrompt: ''
  })

  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [isTesting, setIsTesting] = useState(false)

  // Load existing agent or template
  useEffect(() => {
    if (agentId) {
      const agent = agents.find(a => a.id === agentId)
      if (agent) {
        setConfig({
          name: agent.name,
          description: agent.description || '',
          stt: agent.configuration.stt ? {
            provider: agent.configuration.stt.provider,
            config: agent.configuration.stt as any
          } : null,
          llm: agent.configuration.llm ? {
            provider: agent.configuration.llm.provider,
            config: agent.configuration.llm as any
          } : null,
          tts: agent.configuration.tts ? {
            provider: agent.configuration.tts.provider,
            config: agent.configuration.tts as any
          } : null,
          realtime: null,
          transport: agent.deploymentConfig || { type: 'webrtc', settings: {} },
          systemPrompt: agent.configuration.llm?.systemPrompt || ''
        })
      }
    }
    // TODO: Load template if templateId provided
  }, [agentId, agents])

  // Validation
  const validateConfiguration = useCallback((): boolean => {
    const errors: string[] = []

    if (!config.name.trim()) {
      errors.push(t('nameRequired', 'agents'))
    }

    // Realtime providers handle all functions, so they don't need STT/LLM/TTS
    if (config.realtime) {
      // Only validate realtime provider configuration
      if (!config.realtime.config.apiKey) {
        errors.push('Realtime provider API key is required')
      }
    } else {
      // Traditional setup requires all three providers
      if (!config.stt) {
        errors.push(t('sttProviderRequired', 'agents'))
      }

      if (!config.llm) {
        errors.push(t('llmProviderRequired', 'agents'))
      }

      if (!config.tts) {
        errors.push(t('ttsProviderRequired', 'agents'))
      }

      // Validate provider configurations
      if (config.stt && !config.stt.config.apiKey) {
        errors.push(t('sttApiKeyRequired', 'agents'))
      }

      if (config.llm && !config.llm.config.apiKey) {
        errors.push(t('llmApiKeyRequired', 'agents'))
      }

      if (config.tts && !config.tts.config.apiKey) {
        errors.push(t('ttsApiKeyRequired', 'agents'))
      }
    }

    setValidationErrors(errors)
    return errors.length === 0
  }, [config, t])

  // Provider selection handlers
  const handleProviderSelect = useCallback((type: 'stt' | 'llm' | 'tts' | 'realtime') =>
    (providerId: string, provider: Provider) => {
      setConfig(prev => {
        // If selecting a realtime provider, clear traditional providers
        if (type === 'realtime') {
          return {
            ...prev,
            stt: null,
            llm: null,
            tts: null,
            [type]: {
              provider: providerId,
              config: { apiKey: '', ...prev[type]?.config }
            }
          }
        } else {
          // If selecting traditional providers, clear realtime
          return {
            ...prev,
            realtime: null,
            [type]: {
              provider: providerId,
              config: { apiKey: '', ...prev[type]?.config }
            }
          }
        }
      })
    }, [])

  const handleProviderConfig = useCallback((type: 'stt' | 'llm' | 'tts' | 'realtime') =>
    (newConfig: Record<string, any>) => {
      setConfig(prev => ({
        ...prev,
        [type]: prev[type] ? {
          ...prev[type],
          config: newConfig
        } : null
      }))
    }, [])

  // Step navigation
  const steps = [
    { id: 'basic', title: t('basicInformation', 'agents'), icon: Bot },
    { id: 'providers', title: t('selectProviders', 'agents'), icon: Settings },
    { id: 'pipeline', title: t('buildPipeline', 'agents'), icon: Settings },
    { id: 'test', title: t('testAgent', 'agents'), icon: TestTube }
  ]

  const progress = ((currentStep + 1) / steps.length) * 100

  const handleNext = () => {
    if (currentStep === 0) {
      // Validate basic info before proceeding
      if (!config.name.trim()) {
        setValidationErrors([t('nameRequired', 'agents')])
        return
      }
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
      setValidationErrors([])
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
      setValidationErrors([])
    }
  }

  const handleSave = async () => {
    if (!validateConfiguration()) return

    setIsSaving(true)
    try {
      const agentData: any = {
        name: config.name,
        description: config.description,
        configuration: config.stt && config.llm && config.tts ? {
          stt: {
            provider: config.stt.provider,
            model: (config.stt.config as any).model || 'default',
            language: (config.stt.config as any).language || 'en',
            temperature: (config.stt.config as any).temperature
          },
          llm: {
            provider: config.llm.provider,
            model: (config.llm.config as any).model || 'default',
            systemPrompt: config.systemPrompt,
            temperature: (config.llm.config as any).temperature || 0.7,
            maxTokens: (config.llm.config as any).maxTokens || 1000
          },
          tts: {
            provider: config.tts.provider,
            voice: (config.tts.config as any).voice || 'default',
            stability: (config.tts.config as any).stability,
            clarity: (config.tts.config as any).clarity,
            speed: (config.tts.config as any).speed
          }
        } : undefined,
        deploymentConfig: {
          type: config.transport.type,
          settings: config.transport.settings
        }
      }

      if (agentId) {
        await updateAgent(agentId, agentData)
      } else {
        await createAgent(agentData)
      }

      onSave?.(agentData)
    } catch (error) {
      console.error('Error saving agent:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleTest = async () => {
    if (!validateConfiguration()) return

    setIsTesting(true)
    try {
      // TODO: Implement test functionality
      onTest?.(config)
      router.push(`/agents/${agentId || 'new'}/test`)
    } catch (error) {
      console.error('Error testing agent:', error)
    } finally {
      setIsTesting(false)
    }
  }

  const isFormValid = config.name.trim() && (config.realtime || (config.stt && config.llm && config.tts))

  return (
    <div className="h-screen flex flex-col">
      {/* Fixed Header */}
      <div className="flex-shrink-0 p-6 border-b bg-background">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">
              {agentId ? t('editAgent', 'agents') : t('createNewAgent', 'agents')}
            </h1>
            <p className="text-muted-foreground">
              {t('buildAgentDesc', 'agents')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleTest}
              disabled={!isFormValid || isTesting}
            >
              <Play className="w-4 h-4 mr-2" />
              {isTesting ? t('testing', 'agents') : t('testAgent', 'agents')}
            </Button>
            <Button
              onClick={handleSave}
              disabled={!isFormValid || isSaving}
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? t('saving', 'agents') : t('saveAgent', 'agents')}
            </Button>
          </div>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>{t('progress', 'agents')}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="w-full" />

          {/* Steps */}
          <div className="flex items-center justify-between mt-4">
            {steps.map((step, index) => {
              const StepIcon = step.icon
              const isActive = index === currentStep
              const isCompleted = index < currentStep

              return (
                <div key={step.id} className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                    isActive
                      ? 'border-primary bg-primary text-primary-foreground'
                      : isCompleted
                        ? 'border-green-500 bg-green-500 text-white'
                        : 'border-muted-foreground bg-background'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <StepIcon className="w-5 h-5" />
                    )}
                  </div>
                  <span className={`ml-2 text-sm ${isActive ? 'font-medium' : 'text-muted-foreground'}`}>
                    {step.title}
                  </span>
                  {index < steps.length - 1 && (
                    <ArrowRight className="w-4 h-4 text-muted-foreground mx-4" />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="flex-shrink-0 px-6 pt-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <ul className="list-disc list-inside space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Scrollable Step Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
        {/* Step 1: Basic Information */}
        {currentStep === 0 && (
          <div className="max-w-2xl space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="w-5 h-5" />
                  {t('basicInformation', 'agents')}
                </CardTitle>
                <CardDescription>
                  {t('basicInfoDesc', 'agents')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="agent-name">{t('agentName', 'agents')}</Label>
                  <Input
                    id="agent-name"
                    value={config.name}
                    onChange={(e) => setConfig(prev => ({ ...prev, name: e.target.value }))}
                    placeholder={t('enterAgentName', 'agents')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="agent-description">{t('description', 'agents')}</Label>
                  <Textarea
                    id="agent-description"
                    value={config.description}
                    onChange={(e) => setConfig(prev => ({ ...prev, description: e.target.value }))}
                    placeholder={t('enterDescription', 'agents')}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="system-prompt">{t('systemPrompt', 'agents')}</Label>
                  <Textarea
                    id="system-prompt"
                    value={config.systemPrompt}
                    onChange={(e) => setConfig(prev => ({ ...prev, systemPrompt: e.target.value }))}
                    placeholder={t('enterSystemPrompt', 'agents')}
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground">
                    {t('systemPromptDesc', 'agents')}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 2: Provider Selection */}
        {currentStep === 1 && (
          <div className="space-y-6">
            {/* Realtime Provider Option */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  {t('realtimeSpeech', 'agents')}
                </CardTitle>
                <CardDescription>{t('selectRealtimeProvider', 'agents')}</CardDescription>
              </CardHeader>
              <CardContent>
                <ProviderSelector
                  type="realtime"
                  selectedProvider={config.realtime?.provider}
                  onProviderChange={handleProviderSelect('realtime')}
                />
              </CardContent>
            </Card>

            {/* Separator */}
            {!config.realtime && (
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or choose individual providers
                  </span>
                </div>
              </div>
            )}

            {/* Traditional Providers - Only show if realtime not selected */}
            {!config.realtime && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* STT Provider */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{t('speechToText', 'agents')}</CardTitle>
                    <CardDescription>{t('selectSTTProvider', 'agents')}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ProviderSelector
                      type="stt"
                      selectedProvider={config.stt?.provider}
                      onProviderChange={handleProviderSelect('stt')}
                    />
                  </CardContent>
                </Card>

                {/* LLM Provider */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{t('languageModel', 'agents')}</CardTitle>
                    <CardDescription>{t('selectLLMProvider', 'agents')}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ProviderSelector
                      type="llm"
                      selectedProvider={config.llm?.provider}
                      onProviderChange={handleProviderSelect('llm')}
                    />
                  </CardContent>
                </Card>

                {/* TTS Provider */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{t('textToSpeech', 'agents')}</CardTitle>
                    <CardDescription>{t('selectTTSProvider', 'agents')}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ProviderSelector
                      type="tts"
                      selectedProvider={config.tts?.provider}
                      onProviderChange={handleProviderSelect('tts')}
                    />
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Provider Configuration */}
            <div className="space-y-6">
              {config.realtime && (
                <ProviderConfigForm
                  providerId={config.realtime.provider}
                  type="realtime"
                  config={config.realtime.config}
                  onConfigChange={handleProviderConfig('realtime')}
                />
              )}

              {config.stt && (
                <ProviderConfigForm
                  providerId={config.stt.provider}
                  type="stt"
                  config={config.stt.config}
                  onConfigChange={handleProviderConfig('stt')}
                />
              )}

              {config.llm && (
                <ProviderConfigForm
                  providerId={config.llm.provider}
                  type="llm"
                  config={config.llm.config}
                  onConfigChange={handleProviderConfig('llm')}
                />
              )}

              {config.tts && (
                <ProviderConfigForm
                  providerId={config.tts.provider}
                  type="tts"
                  config={config.tts.config}
                  onConfigChange={handleProviderConfig('tts')}
                />
              )}
            </div>
          </div>
        )}

        {/* Step 3: Pipeline Builder */}
        {currentStep === 2 && (
          <div className="min-h-[600px]">
            <PipelineBuilder
              agentId={agentId}
              selectedProviders={{
                stt: config.stt?.provider,
                llm: config.llm?.provider,
                tts: config.tts?.provider,
                realtime: config.realtime?.provider
              }}
            />
          </div>
        )}

        {/* Step 4: Test Agent */}
        {currentStep === 3 && (
          <div className="max-w-2xl space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TestTube className="w-5 h-5" />
                  {t('testYourAgent', 'agents')}
                </CardTitle>
                <CardDescription>
                  {t('testAgentDesc', 'agents')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Configuration Summary */}
                <div className="space-y-4">
                  <h4 className="font-medium">{t('configuration', 'agents')}</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">{t('speechToText', 'agents')}:</span>
                      <div className="text-muted-foreground">
                        {config.stt ? providers.find(p => p.id === config.stt?.provider)?.name : t('notSelected', 'agents')}
                      </div>
                    </div>
                    <div>
                      <span className="font-medium">{t('languageModel', 'agents')}:</span>
                      <div className="text-muted-foreground">
                        {config.llm ? providers.find(p => p.id === config.llm?.provider)?.name : t('notSelected', 'agents')}
                      </div>
                    </div>
                    <div>
                      <span className="font-medium">{t('textToSpeech', 'agents')}:</span>
                      <div className="text-muted-foreground">
                        {config.tts ? providers.find(p => p.id === config.tts?.provider)?.name : t('notSelected', 'agents')}
                      </div>
                    </div>
                    <div>
                      <span className="font-medium">{t('transport', 'agents')}:</span>
                      <div className="text-muted-foreground">{config.transport.type}</div>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="flex gap-2">
                  <Button onClick={handleTest} disabled={!isFormValid || isTesting}>
                    <Play className="w-4 h-4 mr-2" />
                    {isTesting ? t('startingTest', 'agents') : t('startTest', 'agents')}
                  </Button>
                  <Button variant="outline" onClick={() => router.push('/agents')}>
                    {t('backToAgents', 'agents')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        </div>
      </div>

      {/* Fixed Navigation Footer */}
      <div className="flex-shrink-0 flex items-center justify-between p-6 border-t bg-background">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 0}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('previous', 'agents')}
        </Button>

        {currentStep < steps.length - 1 ? (
          <Button onClick={handleNext}>
            {t('next', 'agents')}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button onClick={handleSave} disabled={!isFormValid || isSaving}>
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? t('saving', 'agents') : t('saveAgent', 'agents')}
          </Button>
        )}
      </div>
    </div>
  )
}