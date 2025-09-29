'use client'

import { useParams } from 'next/navigation'
import { AppLayout } from '@/components/layout/AppLayout'
import { AdvancedConfiguration } from '@/components/features/builder/AdvancedConfiguration'
import { useAgentStore } from '@/stores/useAgentStore'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Save, TestTube } from 'lucide-react'
import Link from 'next/link'
import type { AgentConfiguration, DeploymentConfig } from '@/services/api'

interface ConfigState {
  stt?: Partial<AgentConfiguration['stt']>
  llm?: Partial<AgentConfiguration['llm']>
  tts?: Partial<AgentConfiguration['tts']>
  deployment?: Partial<DeploymentConfig>
}

export default function AgentConfigurePage() {
  const params = useParams()
  const agentId = params.id as string
  const { agents, updateAgent } = useAgentStore()
  const [config, setConfig] = useState<ConfigState>({})
  const [isSaving, setIsSaving] = useState(false)

  const agent = agents.find(a => a.id === agentId)

  useEffect(() => {
    if (agent) {
      // Initialize with existing configuration structure
      setConfig({
        stt: agent.configuration?.stt || {},
        llm: agent.configuration?.llm || {},
        tts: agent.configuration?.tts || {},
        deployment: agent.deploymentConfig || {}
      })
    }
  }, [agent])

  const handleSave = async () => {
    if (!agent) return

    setIsSaving(true)
    try {
      // Update the agent with the new configuration
      await updateAgent(agentId, {
        configuration: {
          stt: { ...(agent.configuration?.stt ?? {}), ...config.stt },
          llm: { ...(agent.configuration?.llm ?? {}), ...config.llm },
          tts: { ...(agent.configuration?.tts ?? {}), ...config.tts }
        },
        deploymentConfig: { ...(agent.deploymentConfig ?? {}), ...config.deployment }
      })
      // Show success toast here
    } catch (error) {
      console.error('Failed to save configuration:', error)
      // Show error toast here
    } finally {
      setIsSaving(false)
    }
  }

  const handleValidate = () => {
    // Validate configuration
    console.log('Validating configuration...', config)
    return true
  }

  if (!agent) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <Card className="w-96">
            <CardContent className="p-6 text-center">
              <h2 className="text-xl font-semibold mb-2">Agent Not Found</h2>
              <p className="text-muted-foreground mb-4">
                The agent you're looking for doesn't exist or has been removed.
              </p>
              <Button asChild>
                <Link href="/agents">Back to Agents</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/agents/${agentId}`}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Agent
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Advanced Configuration</h1>
              <p className="text-muted-foreground">
                Fine-tune {agent.name}'s behavior and performance
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={handleValidate}>
              <TestTube className="w-4 h-4 mr-2" />
              Test Configuration
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>

        {/* Configuration Interface */}
        <AdvancedConfiguration
          config={config}
          onChange={setConfig}
          onValidate={handleValidate}
        />

        {/* Configuration Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Configuration Preview</CardTitle>
            <CardDescription>
              Preview of current configuration settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-lg text-sm overflow-auto max-h-60">
              {JSON.stringify(config, null, 2)}
            </pre>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}