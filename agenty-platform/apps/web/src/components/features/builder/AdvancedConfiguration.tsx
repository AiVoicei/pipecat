'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Settings,
  Brain,
  Mic,
  Volume2,
  Zap,
  Clock,
  Filter,
  Users,
  Globe,
  Shield,
  TestTube,
  Info,
  ChevronDown,
  ChevronUp,
  Palette,
  Activity
} from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

interface AdvancedConfigurationProps {
  config: any
  onChange: (config: any) => void
  onValidate?: () => boolean
}

export function AdvancedConfiguration({ config, onChange, onValidate }: AdvancedConfigurationProps) {
  const { t } = useLanguage()
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['llm']))

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(section)) {
      newExpanded.delete(section)
    } else {
      newExpanded.add(section)
    }
    setExpandedSections(newExpanded)
  }

  const updateConfig = (section: string, key: string, value: any) => {
    const newConfig = {
      ...config,
      [section]: {
        ...config[section],
        [key]: value
      }
    }
    onChange(newConfig)
  }

  const configSections = [
    {
      id: 'llm',
      title: 'Language Model Configuration',
      icon: Brain,
      color: 'text-green-500',
      description: 'Advanced LLM settings for conversation behavior'
    },
    {
      id: 'voice',
      title: 'Voice Personality',
      icon: Volume2,
      color: 'text-purple-500',
      description: 'Customize voice characteristics and behavior'
    },
    {
      id: 'interruption',
      title: 'Interruption Handling',
      icon: Zap,
      color: 'text-orange-500',
      description: 'Configure how the agent handles interruptions'
    },
    {
      id: 'context',
      title: 'Context Management',
      icon: Clock,
      color: 'text-blue-500',
      description: 'Memory and conversation context settings'
    },
    {
      id: 'filters',
      title: 'Content Filters',
      icon: Filter,
      color: 'text-red-500',
      description: 'Content moderation and safety filters'
    },
    {
      id: 'performance',
      title: 'Performance Tuning',
      icon: Activity,
      color: 'text-cyan-500',
      description: 'Optimize latency and throughput'
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Advanced Configuration</h2>
          <p className="text-muted-foreground">Fine-tune your agent's behavior and performance</p>
        </div>
        <Button variant="outline" onClick={onValidate}>
          <TestTube className="w-4 h-4 mr-2" />
          Validate Config
        </Button>
      </div>

      <div className="grid gap-4">
        {configSections.map((section) => (
          <motion.div
            key={section.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: configSections.indexOf(section) * 0.1 }}
          >
            <Card className="overflow-hidden">
              <CardHeader
                className="cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() => toggleSection(section.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <section.icon className={`w-5 h-5 ${section.color}`} />
                    <div>
                      <CardTitle className="text-lg">{section.title}</CardTitle>
                      <CardDescription>{section.description}</CardDescription>
                    </div>
                  </div>
                  <motion.div
                    animate={{ rotate: expandedSections.has(section.id) ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  </motion.div>
                </div>
              </CardHeader>

              <AnimatePresence>
                {expandedSections.has(section.id) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <CardContent className="pt-0">
                      {section.id === 'llm' && (
                        <LLMConfiguration
                          config={config.llm ?? {}}
                          onChange={(llmConfig) => updateConfig('llm', { ...config.llm, ...llmConfig })}
                        />
                      )}
                      {section.id === 'voice' && (
                        <VoiceConfiguration
                          config={config.tts ?? {}}
                          onChange={(voiceConfig) => updateConfig('tts', 'personality', voiceConfig)}
                        />
                      )}
                      {section.id === 'interruption' && (
                        <InterruptionConfiguration
                          config={config.interruption ?? {}}
                          onChange={(intConfig) => updateConfig('interruption', 'settings', intConfig)}
                        />
                      )}
                      {section.id === 'context' && (
                        <ContextConfiguration
                          config={config.context ?? {}}
                          onChange={(ctxConfig) => updateConfig('context', 'management', ctxConfig)}
                        />
                      )}
                      {section.id === 'filters' && (
                        <FiltersConfiguration
                          config={config.filters ?? {}}
                          onChange={(filterConfig) => updateConfig('filters', 'content', filterConfig)}
                        />
                      )}
                      {section.id === 'performance' && (
                        <PerformanceConfiguration
                          config={config.performance ?? {}}
                          onChange={(perfConfig) => updateConfig('performance', 'tuning', perfConfig)}
                        />
                      )}
                    </CardContent>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

function LLMConfiguration({ config, onChange }: { config: any; onChange: (config: any) => void }) {
  const updateValue = (key: string, value: any) => {
    onChange({ ...config, [key]: value })
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="generation" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="generation">Generation</TabsTrigger>
          <TabsTrigger value="functions">Functions</TabsTrigger>
          <TabsTrigger value="context">Context</TabsTrigger>
        </TabsList>

        <TabsContent value="generation" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Temperature: {config.temperature ?? 0.7}</Label>
              <Slider
                value={[config.temperature ?? 0.7]}
                onValueChange={([value]) => updateValue('temperature', value)}
                max={2}
                min={0}
                step={0.1}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">Controls randomness in responses</p>
            </div>
            <div className="space-y-2">
              <Label>Max Tokens: {config.maxTokens ?? 1000}</Label>
              <Slider
                value={[config.maxTokens ?? 1000]}
                onValueChange={([value]) => updateValue('maxTokens', value)}
                max={4000}
                min={100}
                step={100}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">Maximum response length</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>System Prompt</Label>
            <Textarea
              value={config.systemPrompt ?? ''}
              onChange={(e) => updateValue('systemPrompt', e.target.value)}
              placeholder="You are a helpful AI assistant..."
              className="min-h-[100px]"
            />
            <p className="text-xs text-muted-foreground">Initial instructions for the AI model</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Top P: {config.topP ?? 0.9}</Label>
              <Slider
                value={[config.topP ?? 0.9]}
                onValueChange={([value]) => updateValue('topP', value)}
                max={1}
                min={0}
                step={0.05}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label>Frequency Penalty: {config.frequencyPenalty ?? 0}</Label>
              <Slider
                value={[config.frequencyPenalty ?? 0]}
                onValueChange={([value]) => updateValue('frequencyPenalty', value)}
                max={2}
                min={-2}
                step={0.1}
                className="w-full"
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="functions" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Enable Function Calling</Label>
              <p className="text-xs text-muted-foreground">Allow the AI to use external tools</p>
            </div>
            <Switch
              checked={config.enableFunctions ?? false}
              onCheckedChange={(checked) => updateValue('enableFunctions', checked)}
            />
          </div>

          {config.enableFunctions && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Available Functions</Label>
                <div className="grid grid-cols-2 gap-2">
                  {['weather', 'calendar', 'email', 'search', 'calculator', 'time'].map((func) => (
                    <div key={func} className="flex items-center space-x-2">
                      <Switch
                        checked={config.functions?.[func] ?? false}
                        onCheckedChange={(checked) => updateValue('functions', { ...config.functions, [func]: checked })}
                      />
                      <Label className="capitalize">{func}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="context" className="space-y-4">
          <div className="space-y-2">
            <Label>Context Window: {config.contextWindow ?? 4000} tokens</Label>
            <Slider
              value={[config.contextWindow ?? 4000]}
              onValueChange={([value]) => updateValue('contextWindow', value)}
              max={128000}
              min={1000}
              step={1000}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">Maximum conversation history to maintain</p>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Smart Context Pruning</Label>
              <p className="text-xs text-muted-foreground">Automatically manage conversation length</p>
            </div>
            <Switch
              checked={config.smartPruning ?? true}
              onCheckedChange={(checked) => updateValue('smartPruning', checked)}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function VoiceConfiguration({ config, onChange }: { config: any; onChange: (config: any) => void }) {
  const updateValue = (key: string, value: any) => {
    onChange({ ...config, [key]: value })
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Speed: {config.speed ?? 1.0}x</Label>
          <Slider
            value={[config.speed ?? 1.0]}
            onValueChange={([value]) => updateValue('speed', value)}
            max={2}
            min={0.5}
            step={0.1}
            className="w-full"
          />
        </div>
        <div className="space-y-2">
          <Label>Pitch: {config.pitch ?? 0}</Label>
          <Slider
            value={[config.pitch ?? 0]}
            onValueChange={([value]) => updateValue('pitch', value)}
            max={20}
            min={-20}
            step={1}
            className="w-full"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Voice Emotion</Label>
        <Select value={config.emotion ?? 'neutral'} onValueChange={(value) => updateValue('emotion', value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="neutral">Neutral</SelectItem>
            <SelectItem value="excited">Excited</SelectItem>
            <SelectItem value="calm">Calm</SelectItem>
            <SelectItem value="professional">Professional</SelectItem>
            <SelectItem value="friendly">Friendly</SelectItem>
            <SelectItem value="empathetic">Empathetic</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Pause Handling</Label>
        <Select value={config.pauseHandling ?? 'natural'} onValueChange={(value) => updateValue('pauseHandling', value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="minimal">Minimal Pauses</SelectItem>
            <SelectItem value="natural">Natural Pauses</SelectItem>
            <SelectItem value="dramatic">Dramatic Pauses</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <Label>Breathing Sounds</Label>
          <p className="text-xs text-muted-foreground">Add natural breathing to speech</p>
        </div>
        <Switch
          checked={config.breathing ?? false}
          onCheckedChange={(checked) => updateValue('breathing', checked)}
        />
      </div>
    </div>
  )
}

function InterruptionConfiguration({ config, onChange }: { config: any; onChange: (config: any) => void }) {
  const updateValue = (key: string, value: any) => {
    onChange({ ...config, [key]: value })
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Interruption Strategy</Label>
        <Select value={config.strategy ?? 'polite'} onValueChange={(value) => updateValue('strategy', value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="immediate">Immediate Stop</SelectItem>
            <SelectItem value="polite">Polite Pause</SelectItem>
            <SelectItem value="sentence">Finish Sentence</SelectItem>
            <SelectItem value="disabled">No Interruptions</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Minimum Words Before Interruption: {config.minWords ?? 3}</Label>
        <Slider
          value={[config.minWords ?? 3]}
          onValueChange={([value]) => updateValue('minWords', value)}
          max={20}
          min={1}
          step={1}
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <Label>Detection Sensitivity: {config.sensitivity ?? 0.7}</Label>
        <Slider
          value={[config.sensitivity ?? 0.7]}
          onValueChange={([value]) => updateValue('sensitivity', value)}
          max={1}
          min={0.1}
          step={0.1}
          className="w-full"
        />
        <p className="text-xs text-muted-foreground">Higher values detect interruptions more easily</p>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <Label>Resume After Interruption</Label>
          <p className="text-xs text-muted-foreground">Continue speaking where left off</p>
        </div>
        <Switch
          checked={config.resume ?? true}
          onCheckedChange={(checked) => updateValue('resume', checked)}
        />
      </div>
    </div>
  )
}

function ContextConfiguration({ config, onChange }: { config: any; onChange: (config: any) => void }) {
  const updateValue = (key: string, value: any) => {
    onChange({ ...config, [key]: value })
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Memory Duration: {config.memoryDuration ?? 24} hours</Label>
        <Slider
          value={[config.memoryDuration ?? 24]}
          onValueChange={([value]) => updateValue('memoryDuration', value)}
          max={168}
          min={1}
          step={1}
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <Label>Conversation Summary</Label>
        <Select value={config.summaryMode ?? 'automatic'} onValueChange={(value) => updateValue('summaryMode', value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="disabled">Disabled</SelectItem>
            <SelectItem value="automatic">Automatic</SelectItem>
            <SelectItem value="periodic">Periodic</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <Label>Persistent Memory</Label>
          <p className="text-xs text-muted-foreground">Remember user preferences across sessions</p>
        </div>
        <Switch
          checked={config.persistent ?? false}
          onCheckedChange={(checked) => updateValue('persistent', checked)}
        />
      </div>

      <div className="flex items-center justify-between">
        <div>
          <Label>Context Sharing</Label>
          <p className="text-xs text-muted-foreground">Share context between different agents</p>
        </div>
        <Switch
          checked={config.sharing ?? false}
          onCheckedChange={(checked) => updateValue('sharing', checked)}
        />
      </div>
    </div>
  )
}

function FiltersConfiguration({ config, onChange }: { config: any; onChange: (config: any) => void }) {
  const updateValue = (key: string, value: any) => {
    onChange({ ...config, [key]: value })
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Content Safety Level</Label>
        <Select value={config.safetyLevel ?? 'medium'} onValueChange={(value) => updateValue('safetyLevel', value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="strict">Strict</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="relaxed">Relaxed</SelectItem>
            <SelectItem value="minimal">Minimal</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Blocked Categories</Label>
        <div className="grid grid-cols-2 gap-2">
          {['violence', 'adult', 'hate', 'harassment', 'self-harm', 'illegal'].map((category) => (
            <div key={category} className="flex items-center space-x-2">
              <Switch
                checked={config.blockedCategories?.[category] ?? true}
                onCheckedChange={(checked) => updateValue('blockedCategories', {
                  ...config.blockedCategories,
                  [category]: checked
                })}
              />
              <Label className="capitalize">{category}</Label>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Custom Keywords (comma separated)</Label>
        <Textarea
          value={config.customKeywords ?? ''}
          onChange={(e) => updateValue('customKeywords', e.target.value)}
          placeholder="Enter blocked words or phrases..."
          className="min-h-[60px]"
        />
      </div>
    </div>
  )
}

function PerformanceConfiguration({ config, onChange }: { config: any; onChange: (config: any) => void }) {
  const updateValue = (key: string, value: any) => {
    onChange({ ...config, [key]: value })
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Response Timeout: {config.timeout ?? 30}s</Label>
        <Slider
          value={[config.timeout ?? 30]}
          onValueChange={([value]) => updateValue('timeout', value)}
          max={120}
          min={5}
          step={5}
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <Label>Concurrent Requests: {config.concurrency ?? 5}</Label>
        <Slider
          value={[config.concurrency ?? 5]}
          onValueChange={([value]) => updateValue('concurrency', value)}
          max={20}
          min={1}
          step={1}
          className="w-full"
        />
      </div>

      <div className="flex items-center justify-between">
        <div>
          <Label>Auto-scaling</Label>
          <p className="text-xs text-muted-foreground">Automatically adjust resources based on load</p>
        </div>
        <Switch
          checked={config.autoScaling ?? true}
          onCheckedChange={(checked) => updateValue('autoScaling', checked)}
        />
      </div>

      <div className="flex items-center justify-between">
        <div>
          <Label>Response Caching</Label>
          <p className="text-xs text-muted-foreground">Cache common responses for faster delivery</p>
        </div>
        <Switch
          checked={config.caching ?? true}
          onCheckedChange={(checked) => updateValue('caching', checked)}
        />
      </div>

      <div className="space-y-2">
        <Label>Quality vs Speed</Label>
        <Select value={config.priority ?? 'balanced'} onValueChange={(value) => updateValue('priority', value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="quality">Prioritize Quality</SelectItem>
            <SelectItem value="balanced">Balanced</SelectItem>
            <SelectItem value="speed">Prioritize Speed</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}