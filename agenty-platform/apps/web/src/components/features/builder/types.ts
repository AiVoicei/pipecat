/**
 * Type definitions for Agent Builder components
 * Provides type safety for agent configuration and pipeline management
 */

export interface STTConfig {
  provider: string
  model?: string
  language?: string
  punctuation?: boolean
  [key: string]: unknown
}

export interface LLMConfig {
  provider: string
  model?: string
  systemPrompt?: string
  temperature?: number
  maxTokens?: number
  [key: string]: unknown
}

export interface TTSConfig {
  provider: string
  voice?: string
  speed?: number
  stability?: number
  clarity?: number
  [key: string]: unknown
}

export interface RealtimeConfig {
  provider: string
  apiKey?: string
  model?: string
  [key: string]: unknown
}

export interface TransportConfig {
  type: 'webrtc' | 'websocket' | 'twilio' | 'phone' | 'whatsapp' | 'api'
  settings?: Record<string, unknown>
}

export interface ProviderConfiguration {
  provider: string
  config: Record<string, unknown>
}

export interface AgentConfiguration {
  name: string
  description: string
  stt: ProviderConfiguration | null
  llm: ProviderConfiguration | null
  tts: ProviderConfiguration | null
  realtime: ProviderConfiguration | null
  transport: TransportConfig
  systemPrompt: string
}

export interface AgentSaveData {
  name: string
  description: string
  configuration?: {
    stt?: STTConfig
    llm?: LLMConfig
    tts?: TTSConfig
    realtime?: RealtimeConfig
  }
  deploymentConfig: TransportConfig
}

export interface NodeConfiguration {
  // STT Configuration
  language?: string
  model?: string
  punctuation?: boolean

  // LLM Configuration
  temperature?: number
  maxTokens?: number
  systemPrompt?: string

  // TTS Configuration
  voice?: string
  speed?: number
  stability?: number

  // Additional provider-specific config
  [key: string]: unknown
}

/**
 * Validates and extracts a typed STT configuration from unknown agent data
 */
export function parseSTTConfig(data: unknown): STTConfig | null {
  if (!data || typeof data !== 'object') return null

  const config = data as Record<string, unknown>
  if (!config.provider || typeof config.provider !== 'string') return null

  return {
    provider: config.provider,
    model: typeof config.model === 'string' ? config.model : undefined,
    language: typeof config.language === 'string' ? config.language : undefined,
    punctuation: typeof config.punctuation === 'boolean' ? config.punctuation : undefined,
    ...config
  }
}

/**
 * Validates and extracts a typed LLM configuration from unknown agent data
 */
export function parseLLMConfig(data: unknown): LLMConfig | null {
  if (!data || typeof data !== 'object') return null

  const config = data as Record<string, unknown>
  if (!config.provider || typeof config.provider !== 'string') return null

  return {
    provider: config.provider,
    model: typeof config.model === 'string' ? config.model : undefined,
    systemPrompt: typeof config.systemPrompt === 'string' ? config.systemPrompt : undefined,
    temperature: typeof config.temperature === 'number' ? config.temperature : undefined,
    maxTokens: typeof config.maxTokens === 'number' ? config.maxTokens : undefined,
    ...config
  }
}

/**
 * Validates and extracts a typed TTS configuration from unknown agent data
 */
export function parseTTSConfig(data: unknown): TTSConfig | null {
  if (!data || typeof data !== 'object') return null

  const config = data as Record<string, unknown>
  if (!config.provider || typeof config.provider !== 'string') return null

  return {
    provider: config.provider,
    voice: typeof config.voice === 'string' ? config.voice : undefined,
    speed: typeof config.speed === 'number' ? config.speed : undefined,
    stability: typeof config.stability === 'number' ? config.stability : undefined,
    clarity: typeof config.clarity === 'number' ? config.clarity : undefined,
    ...config
  }
}

/**
 * Validates and extracts a typed Realtime configuration from unknown agent data
 */
export function parseRealtimeConfig(data: unknown): RealtimeConfig | null {
  if (!data || typeof data !== 'object') return null

  const config = data as Record<string, unknown>
  if (!config.provider || typeof config.provider !== 'string') return null

  return {
    provider: config.provider,
    apiKey: typeof config.apiKey === 'string' ? config.apiKey : undefined,
    model: typeof config.model === 'string' ? config.model : undefined,
    ...config
  }
}

/**
 * Validates and extracts transport configuration from agent data
 */
export function parseTransportConfig(data: unknown): TransportConfig {
  if (!data || typeof data !== 'object') {
    return { type: 'webrtc', settings: {} }
  }

  const config = data as Record<string, unknown>
  const validTypes: TransportConfig['type'][] = ['webrtc', 'websocket', 'twilio', 'phone', 'whatsapp', 'api']
  const type = typeof config.type === 'string' && validTypes.includes(config.type as TransportConfig['type'])
    ? (config.type as TransportConfig['type'])
    : 'webrtc'

  return {
    type,
    settings: typeof config.settings === 'object' && config.settings !== null
      ? config.settings as Record<string, unknown>
      : {}
  }
}
