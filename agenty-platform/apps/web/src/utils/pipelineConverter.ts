/**
 * Pipeline Converter - Converts visual pipeline to backend Pipecat configuration
 *
 * This utility transforms the ReactFlow visual pipeline representation into
 * a configuration that the backend AgentFactory can use to create executable
 * Pipecat pipelines.
 */

import { PipelineNode } from '@/stores/usePipelineStore'
import { Edge } from '@xyflow/react'

/**
 * Agent configuration payload for backend API
 */
export interface AgentConfigurationPayload {
  name: string
  description: string
  userId: string
  pipeline_type: 'realtime' | 'traditional' | 'enhanced'

  // Core node configurations
  stt?: {
    provider: string
    settings: Record<string, any>
  }
  llm?: {
    provider: string
    settings: Record<string, any>
  }
  tts?: {
    provider: string
    settings: Record<string, any>
  }
  realtime?: {
    provider: string
    settings: Record<string, any>
  }

  // Advanced features
  filters?: Array<{
    type: string
    position: 'before_llm' | 'after_llm'
    settings: Record<string, any>
  }>
  aggregators?: Array<{
    type: string
    settings: Record<string, any>
  }>

  // Transport configuration
  transport?: {
    type: 'webrtc' | 'websocket' | 'daily'
    settings: Record<string, any>
  }

  // Advanced configuration
  vad_enabled?: boolean
  system_prompt?: string
}

/**
 * Validation result for backend submission readiness
 */
export interface BackendValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

/**
 * Converts visual pipeline to backend-compatible agent configuration
 *
 * @param nodes - Pipeline nodes from ReactFlow
 * @param edges - Connections between nodes
 * @param agentName - Name of the agent
 * @param agentDescription - Description of the agent
 * @param userId - User ID creating the agent
 * @returns Agent configuration payload for backend API
 */
export function convertPipelineToAgentConfig(
  nodes: PipelineNode[],
  edges: Edge[],
  agentName: string,
  agentDescription: string,
  userId: string = 'user_1'
): AgentConfigurationPayload {
  // Detect pipeline type
  const realtimeNode = nodes.find(n => n.data.type === 'realtime')

  // REALTIME PIPELINE
  if (realtimeNode) {
    return {
      name: agentName,
      description: agentDescription,
      userId,
      pipeline_type: 'realtime',
      realtime: {
        provider: realtimeNode.data.provider || '',
        settings: realtimeNode.data.configuration || {}
      },
      transport: {
        type: 'webrtc', // Realtime always uses WebRTC
        settings: {}
      },
      vad_enabled: false // Realtime handles VAD internally
    }
  }

  // TRADITIONAL OR ENHANCED PIPELINE
  const sttNode = nodes.find(n => n.data.type === 'stt')
  const llmNode = nodes.find(n => n.data.type === 'llm')
  const ttsNode = nodes.find(n => n.data.type === 'tts')
  const filterNodes = nodes.filter(n => n.data.type === 'filter')
  const aggregatorNodes = nodes.filter(n => n.data.type === 'aggregator')

  if (!sttNode || !llmNode || !ttsNode) {
    throw new Error('Traditional pipeline requires STT, LLM, and TTS nodes')
  }

  // Determine filter positions based on edges
  const filters = filterNodes.map(filter => {
    const hasLLMSource = edges.some(e =>
      e.source === llmNode.id && e.target === filter.id
    )
    return {
      type: filter.data.label || 'generic_filter',
      position: hasLLMSource ? 'after_llm' as const : 'before_llm' as const,
      settings: filter.data.configuration || {}
    }
  })

  // Determine aggregators
  const aggregators = aggregatorNodes.map(agg => ({
    type: agg.data.label || 'context_aggregator',
    settings: agg.data.configuration || {}
  }))

  // Extract system prompt from LLM configuration
  const systemPrompt = llmNode.data.configuration?.systemPrompt ||
                      llmNode.data.configuration?.system_prompt ||
                      'You are a helpful AI assistant.'

  const pipelineType = filterNodes.length > 0 || aggregatorNodes.length > 0
    ? 'enhanced' as const
    : 'traditional' as const

  return {
    name: agentName,
    description: agentDescription,
    userId,
    pipeline_type: pipelineType,
    stt: {
      provider: sttNode.data.provider || '',
      settings: {
        model: sttNode.data.configuration?.model || 'default',
        language: sttNode.data.configuration?.language || 'en',
        ...sttNode.data.configuration
      }
    },
    llm: {
      provider: llmNode.data.provider || '',
      settings: {
        model: llmNode.data.configuration?.model || 'default',
        temperature: llmNode.data.configuration?.temperature || 0.7,
        max_tokens: llmNode.data.configuration?.maxTokens ||
                   llmNode.data.configuration?.max_tokens || 1000,
        ...llmNode.data.configuration
      }
    },
    tts: {
      provider: ttsNode.data.provider || '',
      settings: {
        voice: ttsNode.data.configuration?.voice ||
               ttsNode.data.configuration?.voice_id || 'default',
        speed: ttsNode.data.configuration?.speed || 1.0,
        stability: ttsNode.data.configuration?.stability || 0.75,
        ...ttsNode.data.configuration
      }
    },
    filters: filters.length > 0 ? filters : undefined,
    aggregators: aggregators.length > 0 ? aggregators : undefined,
    transport: {
      type: 'webrtc',
      settings: {}
    },
    vad_enabled: true, // Traditional pipelines use VAD
    system_prompt: systemPrompt
  }
}

/**
 * Validates that pipeline is ready for backend submission
 *
 * Checks:
 * - All nodes are configured
 * - All nodes have providers selected
 * - Required credentials are available (note: actual credential check happens on backend)
 *
 * @param nodes - Pipeline nodes to validate
 * @returns Validation result with errors and warnings
 */
export function validatePipelineForBackend(
  nodes: PipelineNode[]
): BackendValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Check that all core nodes are configured
  const coreNodes = nodes.filter(n =>
    n.data.type === 'stt' ||
    n.data.type === 'llm' ||
    n.data.type === 'tts' ||
    n.data.type === 'realtime'
  )

  const unconfiguredCoreNodes = coreNodes.filter(n => !n.data.isConfigured)
  if (unconfiguredCoreNodes.length > 0) {
    errors.push(
      `${unconfiguredCoreNodes.length} core node(s) must be configured. ` +
      `Please configure: ${unconfiguredCoreNodes.map(n => n.data.label).join(', ')}`
    )
  }

  // Check that all core nodes have providers
  const noProviderNodes = coreNodes.filter(n => !n.data.provider)
  if (noProviderNodes.length > 0) {
    errors.push(
      `${noProviderNodes.length} node(s) missing provider selection. ` +
      `Please select providers for: ${noProviderNodes.map(n => n.data.label).join(', ')}`
    )
  }

  // Warn about unconfigured helper nodes (filters/aggregators)
  const helperNodes = nodes.filter(n =>
    n.data.type === 'filter' || n.data.type === 'aggregator'
  )
  const unconfiguredHelperNodes = helperNodes.filter(n => !n.data.isConfigured)
  if (unconfiguredHelperNodes.length > 0) {
    warnings.push(
      `${unconfiguredHelperNodes.length} filter/aggregator node(s) are not configured. ` +
      `They will use default settings.`
    )
  }

  // Check for system prompt in LLM nodes
  const llmNodes = nodes.filter(n => n.data.type === 'llm')
  const llmWithoutPrompt = llmNodes.filter(n =>
    !n.data.configuration?.systemPrompt && !n.data.configuration?.system_prompt
  )
  if (llmWithoutPrompt.length > 0) {
    warnings.push(
      'LLM node(s) do not have a system prompt. A default prompt will be used.'
    )
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Generates a user-friendly summary of the pipeline configuration
 *
 * @param nodes - Pipeline nodes
 * @param edges - Connections between nodes
 * @returns Human-readable summary of the pipeline
 */
export function generatePipelineSummary(
  nodes: PipelineNode[],
  edges: Edge[]
): string {
  const realtimeNode = nodes.find(n => n.data.type === 'realtime')

  if (realtimeNode) {
    return `Realtime Speech-to-Speech Pipeline using ${realtimeNode.data.provider || 'unknown provider'}`
  }

  const sttNode = nodes.find(n => n.data.type === 'stt')
  const llmNode = nodes.find(n => n.data.type === 'llm')
  const ttsNode = nodes.find(n => n.data.type === 'tts')
  const filterCount = nodes.filter(n => n.data.type === 'filter').length
  const aggregatorCount = nodes.filter(n => n.data.type === 'aggregator').length

  const parts: string[] = []

  if (sttNode) parts.push(`STT: ${sttNode.data.provider || 'unconfigured'}`)
  if (llmNode) parts.push(`LLM: ${llmNode.data.provider || 'unconfigured'}`)
  if (ttsNode) parts.push(`TTS: ${ttsNode.data.provider || 'unconfigured'}`)

  if (filterCount > 0) parts.push(`${filterCount} filter(s)`)
  if (aggregatorCount > 0) parts.push(`${aggregatorCount} aggregator(s)`)

  return parts.join(' → ')
}

/**
 * Extracts provider names from pipeline for credential checking
 *
 * @param nodes - Pipeline nodes
 * @returns Array of unique provider names
 */
export function extractRequiredProviders(nodes: PipelineNode[]): string[] {
  const providers = nodes
    .filter(n => n.data.provider && n.data.provider.length > 0)
    .map(n => n.data.provider!)

  return Array.from(new Set(providers))
}
