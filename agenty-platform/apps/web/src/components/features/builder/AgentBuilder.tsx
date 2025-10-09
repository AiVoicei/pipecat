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
import {
  parseSTTConfig,
  parseLLMConfig,
  parseTTSConfig,
  parseRealtimeConfig,
  parseTransportConfig
} from './types'
import {
  AgentConfiguration,
  CreateAgentRequest,
  UpdateAgentRequest,
  DeploymentConfig
} from '@/services/api'

interface LocalAgentConfiguration {
  name: string
  description: string
  stt: {
    provider: string
    config: Record<string, unknown>
  } | null
  llm: {
    provider: string
    config: Record<string, unknown>
  } | null
  tts: {
    provider: string
    config: Record<string, unknown>
  } | null
  realtime: {
    provider: string
    config: Record<string, unknown>
  } | null
  transport: DeploymentConfig
  systemPrompt: string
}

interface AgentBuilderProps {
  agentId?: string
  templateId?: string
  onSave?: (agent: CreateAgentRequest | UpdateAgentRequest) => void
  onTest?: (agent: LocalAgentConfiguration) => void
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
  const [providerMode, setProviderMode] = useState<'realtime' | 'traditional'>('traditional')
  const [config, setConfig] = useState<LocalAgentConfiguration>({
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
        const sttConfig = parseSTTConfig(agent.configuration.stt)
        const llmConfig = parseLLMConfig(agent.configuration.llm)
        const ttsConfig = parseTTSConfig(agent.configuration.tts)
        const realtimeConfig = parseRealtimeConfig(agent.configuration.realtime)
        const transportConfig = parseTransportConfig(agent.deploymentConfig)

        // Set provider mode based on configuration
        if (realtimeConfig) {
          setProviderMode('realtime')
        } else {
          setProviderMode('traditional')
        }

        setConfig({
          name: agent.name,
          description: agent.description || '',
          stt: sttConfig ? {
            provider: sttConfig.provider,
            config: sttConfig
          } : null,
          llm: llmConfig ? {
            provider: llmConfig.provider,
            config: llmConfig
          } : null,
          tts: ttsConfig ? {
            provider: ttsConfig.provider,
            config: ttsConfig
          } : null,
          realtime: realtimeConfig ? {
            provider: realtimeConfig.provider,
            config: realtimeConfig
          } : null,
          transport: transportConfig,
          systemPrompt: llmConfig?.systemPrompt || ''
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
    (newConfig: Record<string, unknown>) => {
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
     { id: 'summary', title: t('agentSummary', 'agents'), icon: TestTube }
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
      // Build configuration based on mode (realtime or traditional)
      let configuration: AgentConfiguration | undefined = undefined

      if (config.realtime) {
        // Realtime mode - single provider handles everything
        configuration = {
          realtime: {
            provider: config.realtime.provider,
            apiKey: (config.realtime.config.apiKey as string) || '',
            model: (config.realtime.config.model as string) || 'default'
          }
        }
      } else if (config.stt && config.llm && config.tts) {
        // Traditional mode - separate STT/LLM/TTS providers
        configuration = {
          stt: {
            provider: config.stt.provider,
            model: (config.stt.config.model as string) || 'default',
            language: (config.stt.config.language as string) || 'en',
            punctuation: (config.stt.config.punctuation as boolean) || undefined
          },
          llm: {
            provider: config.llm.provider,
            model: (config.llm.config.model as string) || 'default',
            systemPrompt: config.systemPrompt,
            temperature: (config.llm.config.temperature as number) ?? 0.7,
            maxTokens: (config.llm.config.maxTokens as number) ?? 1000
          },
          tts: {
            provider: config.tts.provider,
            voice: (config.tts.config.voice as string) || 'default',
            stability: (config.tts.config.stability as number) || undefined,
            clarity: (config.tts.config.clarity as number) || undefined,
            speed: (config.tts.config.speed as number) || undefined
          }
        }
      }

      if (agentId) {
        const updateData: UpdateAgentRequest = {
          name: config.name,
          description: config.description,
          configuration,
          deploymentConfig: config.transport
        }
        await updateAgent(agentId, updateData)
        onSave?.(updateData)
      } else {
        const createData: CreateAgentRequest = {
          name: config.name,
          description: config.description,
          configuration,
          deploymentConfig: config.transport
        }
        await createAgent(createData)
        onSave?.(createData)
      }

      // Navigate to agents page after successful save
      router.push('/agents')
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
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Fixed Header */}
      <div className="flex-shrink-0 p-4 border-b bg-background z-10">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl font-bold">
              {agentId ? t('editAgent', 'agents') : t('createNewAgent', 'agents')}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t('buildAgentDesc', 'agents')}
            </p>
          </div>
          {/* No buttons in header on step 4 */}
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span>{t('progress', 'agents')}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="w-full h-1" />

          {/* Steps */}
          <div className="flex items-center justify-between mt-3">
            {steps.map((step, index) => {
              const StepIcon = step.icon
              const isActive = index === currentStep
              const isCompleted = index < currentStep

              return (
                <div key={step.id} className="flex items-center">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors ${
                    isActive
                      ? 'border-primary bg-primary text-primary-foreground'
                      : isCompleted
                        ? 'border-green-500 bg-green-500 text-white'
                        : 'border-muted-foreground bg-background'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <StepIcon className="w-4 h-4" />
                    )}
                  </div>
                  <span className={`ml-2 text-xs ${isActive ? 'font-medium' : 'text-muted-foreground'}`}>
                    {step.title}
                  </span>
                  {index < steps.length - 1 && (
                    <ArrowRight className="w-3 h-3 text-muted-foreground mx-3" />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="flex-shrink-0 px-4 pt-3">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {validationErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Scrollable Step Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Steps that need padding */}
        {(currentStep === 0 || currentStep === 1 || currentStep === 3) && (
          <div className="flex-1 overflow-y-auto">
            <div className="p-4">
        {/* Step 1: Basic Information */}
        {currentStep === 0 && (
          <div className="max-w-2xl space-y-3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Bot className="w-4 h-4" />
                  {t('basicInformation', 'agents')}
                </CardTitle>
                <CardDescription className="text-xs">
                  {t('basicInfoDesc', 'agents')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="agent-name" className="text-sm">{t('agentName', 'agents')}</Label>
                  <Input
                    id="agent-name"
                    className="h-8"
                    value={config.name}
                    onChange={(e) => setConfig(prev => ({ ...prev, name: e.target.value }))}
                    placeholder={t('enterAgentName', 'agents')}
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="agent-description" className="text-sm">{t('description', 'agents')}</Label>
                  <Textarea
                    id="agent-description"
                    className="min-h-[60px]"
                    value={config.description}
                    onChange={(e) => setConfig(prev => ({ ...prev, description: e.target.value }))}
                    placeholder={t('enterDescription', 'agents')}
                    rows={2}
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="system-prompt" className="text-sm">{t('systemPrompt', 'agents')}</Label>
                  <Textarea
                    id="system-prompt"
                    className="min-h-[80px]"
                    value={config.systemPrompt}
                    onChange={(e) => setConfig(prev => ({ ...prev, systemPrompt: e.target.value }))}
                    placeholder={t('enterSystemPrompt', 'agents')}
                    rows={3}
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
          <div className="space-y-3">
            {/* Mode Selection Tabs */}
            <Tabs
              value={providerMode}
              onValueChange={(value) => {
                const newMode = value as 'realtime' | 'traditional'
                setProviderMode(newMode)

                if (newMode === 'realtime') {
                  // Clear traditional providers when switching to realtime
                  setConfig(prev => ({
                    ...prev,
                    stt: null,
                    llm: null,
                    tts: null
                  }))
                } else {
                  // Clear realtime provider when switching to traditional
                  setConfig(prev => ({
                    ...prev,
                    realtime: null
                  }))
                }
              }}
            >
              <TabsList className="grid w-full grid-cols-2 mb-2">
                <TabsTrigger value="realtime" className="flex items-center gap-2 text-sm h-8">
                  <Zap className="w-3 h-3" />
                  {t('realtimeSpeech', 'agents')}
                </TabsTrigger>
                <TabsTrigger value="traditional" className="flex items-center gap-2 text-sm h-8">
                  <Settings className="w-3 h-3" />
                  {t('individualProviders', 'agents')}
                </TabsTrigger>
              </TabsList>

              {/* Realtime Provider Tab */}
              <TabsContent value="realtime" className="space-y-3 mt-2">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      {t('realtimeSpeech', 'agents')}
                    </CardTitle>
                    <CardDescription className="text-xs">{t('selectRealtimeProvider', 'agents')}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ProviderSelector
                      type="realtime"
                      selectedProvider={config.realtime?.provider}
                      onProviderChange={handleProviderSelect('realtime')}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Traditional Providers Tab */}
              <TabsContent value="traditional" className="space-y-3 mt-2">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                  {/* STT Provider */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">{t('speechToText', 'agents')}</CardTitle>
                      <CardDescription className="text-xs">{t('selectSTTProvider', 'agents')}</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <ProviderSelector
                        type="stt"
                        selectedProvider={config.stt?.provider}
                        onProviderChange={handleProviderSelect('stt')}
                      />
                    </CardContent>
                  </Card>

                  {/* LLM Provider */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">{t('languageModel', 'agents')}</CardTitle>
                      <CardDescription className="text-xs">{t('selectLLMProvider', 'agents')}</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <ProviderSelector
                        type="llm"
                        selectedProvider={config.llm?.provider}
                        onProviderChange={handleProviderSelect('llm')}
                      />
                    </CardContent>
                  </Card>

                  {/* TTS Provider */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">{t('textToSpeech', 'agents')}</CardTitle>
                      <CardDescription className="text-xs">{t('selectTTSProvider', 'agents')}</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <ProviderSelector
                        type="tts"
                        selectedProvider={config.tts?.provider}
                        onProviderChange={handleProviderSelect('tts')}
                      />
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>

            {/* Provider Configuration */}
            <div className="space-y-3">
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

        {/* Step 4: Agent Summary */}
        {currentStep === 3 && (
          <div className="max-w-2xl space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Agent Summary
                </CardTitle>
                <CardDescription>
                  Review your agent configuration and choose an action
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Configuration Summary */}
                <div className="space-y-4">
                  <h4 className="font-medium">{t('configuration', 'agents')}</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">{t('agentName', 'agents')}:</span>
                      <div className="text-muted-foreground">{config.name}</div>
                    </div>
                    <div>
                      <span className="font-medium">{t('transport', 'agents')}:</span>
                      <div className="text-muted-foreground">{config.transport.type}</div>
                    </div>
                    {config.realtime ? (
                      <div className="col-span-2">
                        <span className="font-medium">Realtime Provider:</span>
                        <div className="text-muted-foreground">
                          {providers.find(p => p.id === config.realtime?.provider)?.name}
                        </div>
                      </div>
                    ) : (
                      <>
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
                      </>
                    )}
                  </div>
                </div>

                <Separator />

                <div className="flex gap-2">
                  <Button onClick={handleTest} disabled={!isFormValid || isTesting}>
                    <Play className="w-4 h-4 mr-2" />
                    {isTesting ? t('startingTest', 'agents') : t('startTest', 'agents')}
                  </Button>
                  <Button onClick={handleSave} disabled={!isFormValid || isSaving}>
                    <Save className="w-4 h-4 mr-2" />
                    {isSaving ? t('saving', 'agents') : t('saveAgent', 'agents')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
            </div>
          </div>
        )}

        {/* Step 3: Pipeline Builder - Full height without padding */}
        {currentStep === 2 && (
          <div className="flex-1 min-h-0 mb-[20vh]">
            <PipelineBuilder
              agentId={agentId}
              hideActions={true}
              selectedProviders={{
                stt: config.stt?.provider,
                llm: config.llm?.provider,
                tts: config.tts?.provider,
                realtime: config.realtime?.provider
              }}
            />
          </div>
        )}
      </div>

      {/* Fixed Navigation Footer */}
      <div className="fixed bottom-0 left-0 right-0 flex items-center justify-between p-3 border-t bg-background z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrevious}
          disabled={currentStep === 0}
        >
          <ArrowLeft className="w-3 h-3 mr-2" />
          {t('previous', 'agents')}
        </Button>

        <Button size="sm" onClick={handleNext} disabled={currentStep === steps.length - 1}>
          {t('next', 'agents')}
          <ArrowRight className="w-3 h-3 ml-2" />
        </Button>
      </div>
    </div>
  )
}