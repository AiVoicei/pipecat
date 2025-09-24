import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

// Provider types and interfaces
export interface Provider {
  id: string
  name: string
  type: 'stt' | 'llm' | 'tts' | 'realtime'
  logoUrl: string
  description: string
  isActive: boolean
  popularity: number
  pricing: {
    model: string
    cost?: number
    inputCost?: number
    outputCost?: number
    currency: string
  }
  configurationSchema: {
    type: string
    properties: Record<string, Record<string, unknown>>
    required: string[]
  }
  capabilities: string[]
  supportedLanguages?: string[]
  supportedFormats?: string[]
}

interface ProviderStore {
  // State
  providers: Provider[]
  isLoading: boolean
  error: string | null

  // Actions
  fetchProviders: () => Promise<void>
  getProvidersByType: (type: 'stt' | 'llm' | 'tts' | 'realtime') => Provider[]
  getPopularProviders: () => Provider[]
  searchProviders: (query: string) => Provider[]
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

// API base URL - in production this would come from environment
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// Mock provider data for fallback (kept for offline mode)
const fallbackProviders: Provider[] = [
  {
    id: 'prv_1',
    name: 'OpenAI',
    type: 'stt',
    logoUrl: 'https://cdn.openai.com/API/logo-openai.svg',
    description: 'High-quality speech-to-text with Whisper models',
    isActive: true,
    popularity: 95,
    pricing: {
      model: 'per_minute',
      cost: 0.006,
      currency: 'USD'
    },
    configurationSchema: {
      type: 'object',
      properties: {
        model: {
          type: 'string',
          enum: ['whisper-1'],
          default: 'whisper-1'
        },
        language: {
          type: 'string',
          enum: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh', 'he'],
          default: 'en'
        },
        temperature: {
          type: 'number',
          minimum: 0,
          maximum: 1,
          default: 0
        }
      },
      required: ['model']
    },
    capabilities: ['multi_language', 'high_accuracy', 'real_time'],
    supportedFormats: ['wav', 'mp3', 'm4a', 'webm'],
    supportedLanguages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh', 'he']
  },
  {
    id: 'prv_2',
    name: 'Anthropic',
    type: 'llm',
    logoUrl: 'https://cdn.anthropic.com/logo.svg',
    description: 'Advanced language models with Claude series',
    isActive: true,
    popularity: 88,
    pricing: {
      model: 'per_token',
      inputCost: 0.008,
      outputCost: 0.024,
      currency: 'USD'
    },
    configurationSchema: {
      type: 'object',
      properties: {
        model: {
          type: 'string',
          enum: ['claude-3-haiku', 'claude-3-sonnet', 'claude-3-opus'],
          default: 'claude-3-sonnet'
        },
        maxTokens: {
          type: 'integer',
          minimum: 1,
          maximum: 4096,
          default: 1000
        },
        temperature: {
          type: 'number',
          minimum: 0,
          maximum: 1,
          default: 0.7
        },
        systemPrompt: {
          type: 'string',
          default: 'You are a helpful AI assistant.'
        }
      },
      required: ['model', 'maxTokens']
    },
    capabilities: ['function_calling', 'reasoning', 'multilingual', 'context_aware'],
    supportedLanguages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh', 'he']
  },
  {
    id: 'prv_3',
    name: 'ElevenLabs',
    type: 'tts',
    logoUrl: 'https://elevenlabs.io/favicon.ico',
    description: 'Ultra-realistic text-to-speech with voice cloning',
    isActive: true,
    popularity: 92,
    pricing: {
      model: 'per_character',
      cost: 0.00018,
      currency: 'USD'
    },
    configurationSchema: {
      type: 'object',
      properties: {
        voice: {
          type: 'string',
          enum: ['Rachel', 'Drew', 'Clyde', 'Paul', 'Domi', 'Bella', 'Antoni', 'Elli', 'Josh', 'Arnold', 'Adam', 'Sam'],
          default: 'Rachel'
        },
        stability: {
          type: 'number',
          minimum: 0,
          maximum: 1,
          default: 0.75
        },
        clarity: {
          type: 'number',
          minimum: 0,
          maximum: 1,
          default: 0.75
        },
        style: {
          type: 'number',
          minimum: 0,
          maximum: 1,
          default: 0
        }
      },
      required: ['voice']
    },
    capabilities: ['voice_cloning', 'emotional_range', 'streaming', 'multilingual'],
    supportedLanguages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'hi', 'pl']
  },
  {
    id: 'prv_4',
    name: 'Deepgram',
    type: 'stt',
    logoUrl: 'https://deepgram.com/favicon.ico',
    description: 'Fast and accurate speech recognition with Nova models',
    isActive: true,
    popularity: 78,
    pricing: {
      model: 'per_minute',
      cost: 0.0043,
      currency: 'USD'
    },
    configurationSchema: {
      type: 'object',
      properties: {
        model: {
          type: 'string',
          enum: ['nova-2', 'nova', 'enhanced', 'base'],
          default: 'nova-2'
        },
        language: {
          type: 'string',
          enum: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh', 'hi'],
          default: 'en'
        },
        punctuate: {
          type: 'boolean',
          default: true
        },
        diarize: {
          type: 'boolean',
          default: false
        }
      },
      required: ['model']
    },
    capabilities: ['real_time', 'speaker_diarization', 'punctuation', 'streaming'],
    supportedFormats: ['wav', 'mp3', 'm4a', 'flac', 'webm'],
    supportedLanguages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh', 'hi']
  },
  {
    id: 'prv_5',
    name: 'Azure Cognitive Services',
    type: 'tts',
    logoUrl: 'https://azure.microsoft.com/favicon.ico',
    description: 'Microsoft\'s neural text-to-speech service',
    isActive: true,
    popularity: 85,
    pricing: {
      model: 'per_character',
      cost: 0.000015,
      currency: 'USD'
    },
    configurationSchema: {
      type: 'object',
      properties: {
        voice: {
          type: 'string',
          enum: ['en-US-JennyNeural', 'en-US-GuyNeural', 'he-IL-AvriNeural', 'he-IL-HilaNeural'],
          default: 'en-US-JennyNeural'
        },
        rate: {
          type: 'string',
          enum: ['x-slow', 'slow', 'medium', 'fast', 'x-fast'],
          default: 'medium'
        },
        pitch: {
          type: 'string',
          enum: ['x-low', 'low', 'medium', 'high', 'x-high'],
          default: 'medium'
        }
      },
      required: ['voice']
    },
    capabilities: ['neural_voices', 'ssml', 'custom_voice', 'streaming'],
    supportedLanguages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh', 'he', 'ar']
  },
  {
    id: 'prv_6',
    name: 'Google Cloud',
    type: 'stt',
    logoUrl: 'https://cloud.google.com/favicon.ico',
    description: 'Google\'s speech-to-text with latest models',
    isActive: true,
    popularity: 82,
    pricing: {
      model: 'per_minute',
      cost: 0.004,
      currency: 'USD'
    },
    configurationSchema: {
      type: 'object',
      properties: {
        model: {
          type: 'string',
          enum: ['latest', 'latest_long', 'latest_short'],
          default: 'latest'
        },
        language: {
          type: 'string',
          enum: ['en-US', 'es-ES', 'fr-FR', 'de-DE', 'it-IT', 'pt-BR', 'ru-RU', 'ja-JP', 'ko-KR', 'zh-CN', 'he-IL'],
          default: 'en-US'
        },
        enableAutomaticPunctuation: {
          type: 'boolean',
          default: true
        },
        enableSpeakerDiarization: {
          type: 'boolean',
          default: false
        }
      },
      required: ['model']
    },
    capabilities: ['speaker_diarization', 'punctuation', 'profanity_filter', 'streaming'],
    supportedFormats: ['wav', 'flac', 'mp3', 'webm'],
    supportedLanguages: ['en-US', 'es-ES', 'fr-FR', 'de-DE', 'it-IT', 'pt-BR', 'ru-RU', 'ja-JP', 'ko-KR', 'zh-CN', 'he-IL']
  },
  {
    id: 'prv_7',
    name: 'Cartesia',
    type: 'tts',
    logoUrl: 'https://cartesia.ai/favicon.ico',
    description: 'Real-time neural text-to-speech with low latency',
    isActive: true,
    popularity: 76,
    pricing: {
      model: 'per_character',
      cost: 0.00025,
      currency: 'USD'
    },
    configurationSchema: {
      type: 'object',
      properties: {
        voice: {
          type: 'string',
          enum: ['professional_male', 'professional_female', 'casual_male', 'casual_female', 'energetic', 'calm'],
          default: 'professional_female'
        },
        speed: {
          type: 'number',
          minimum: 0.5,
          maximum: 2.0,
          default: 1.0
        },
        emotion: {
          type: 'string',
          enum: ['neutral', 'happy', 'sad', 'angry', 'excited', 'calm'],
          default: 'neutral'
        }
      },
      required: ['voice']
    },
    capabilities: ['real_time', 'low_latency', 'emotional_range', 'streaming'],
    supportedLanguages: ['en', 'es', 'fr', 'de', 'it']
  },
  {
    id: 'prv_8',
    name: 'OpenAI Realtime API',
    type: 'realtime',
    logoUrl: 'https://cdn.openai.com/API/logo-openai.svg',
    description: 'Next-generation speech-to-speech with gpt-realtime model. Function calling, multilingual, and natural conversations.',
    isActive: true,
    popularity: 95,
    pricing: {
      model: 'per_minute',
      inputCost: 0.06,
      outputCost: 0.24,
      currency: 'USD'
    },
    configurationSchema: {
      type: 'object',
      properties: {
        model: {
          type: 'string',
          enum: ['gpt-realtime', 'gpt-4o-realtime-preview'],
          default: 'gpt-realtime'
        },
        voice: {
          type: 'string',
          enum: ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer', 'cedar', 'marin'],
          default: 'alloy'
        },
        temperature: {
          type: 'number',
          minimum: 0,
          maximum: 2,
          default: 0.8
        }
      },
      required: ['model', 'voice']
    },
    capabilities: ['real_time', 'speech_to_speech', 'low_latency', 'interruption', 'function_calling', 'multilingual', 'non_verbal_cues'],
    supportedLanguages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh', 'hi', 'ar']
  },
  {
    id: 'prv_9',
    name: 'Gemini 2.0 Flash Live API',
    type: 'realtime',
    logoUrl: 'https://ai.google.dev/static/site-assets/images/gemini-gradient.svg',
    description: 'Real-time multimodal conversations with vision, audio, and video. 30 HD voices across 24 languages.',
    isActive: true,
    popularity: 90,
    pricing: {
      model: 'per_token',
      inputCost: 0.075,
      outputCost: 0.30,
      currency: 'USD'
    },
    configurationSchema: {
      type: 'object',
      properties: {
        model: {
          type: 'string',
          enum: ['gemini-2.0-flash-exp', 'gemini-2.0-flash'],
          default: 'gemini-2.0-flash'
        },
        voice: {
          type: 'string',
          enum: ['Puck', 'Charon', 'Kore', 'Fenrir', 'Aoede', 'Ballad'],
          default: 'Puck'
        },
        temperature: {
          type: 'number',
          minimum: 0,
          maximum: 2,
          default: 1.0
        }
      },
      required: ['model']
    },
    capabilities: ['real_time', 'speech_to_speech', 'multimodal', 'vision', 'video', 'low_latency', 'interruption', 'function_calling', 'screen_sharing'],
    supportedLanguages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh', 'hi', 'ar', 'he', 'nl', 'pl', 'sv', 'da', 'no', 'fi', 'tr', 'th', 'vi', 'id', 'ms']
  }
]

// API client functions
async function fetchProvidersFromAPI(): Promise<Provider[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/providers`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const data = await response.json()

    // Transform API response to match frontend Provider interface
    return data.map((provider: any) => ({
      id: provider.id,
      name: provider.display_name || provider.name,
      type: provider.type,
      logoUrl: provider.logo_url || `/logos/${provider.name}.svg`,
      description: provider.description,
      isActive: provider.status === 'available' || provider.status === 'beta',
      popularity: provider.implementation_status === 'implemented' ? 95 : 70,
      pricing: {
        model: provider.pricing?.model || 'pay_per_use',
        cost: provider.pricing?.cost_per_unit,
        inputCost: provider.pricing?.input_cost,
        outputCost: provider.pricing?.output_cost,
        currency: provider.pricing?.currency || 'USD'
      },
      configurationSchema: provider.configuration_schema || { type: 'object', properties: {}, required: [] },
      capabilities: Object.keys(provider.capabilities || {}),
      supportedLanguages: provider.capabilities?.languages || ['en'],
      supportedFormats: provider.supported_formats || []
    }))
  } catch (error) {
    console.error('Failed to fetch providers from API:', error)
    // Return fallback providers if API fails
    return fallbackProviders
  }
}

export const useProviderStore = create<ProviderStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      providers: [],
      isLoading: false,
      error: null,

      // Actions
      fetchProviders: async () => {
        try {
          set({ isLoading: true, error: null })
          const providers = await fetchProvidersFromAPI()
          set({ providers, isLoading: false })
        } catch (error) {
          set({
            providers: fallbackProviders, // Use fallback on error
            error: error instanceof Error ? error.message : 'Failed to fetch providers',
            isLoading: false
          })
        }
      },

      getProvidersByType: (type: 'stt' | 'llm' | 'tts' | 'realtime') => {
        return get().providers.filter(provider => provider.type === type && provider.isActive)
      },

      getPopularProviders: () => {
        return get().providers
          .filter(provider => provider.isActive)
          .sort((a, b) => b.popularity - a.popularity)
          .slice(0, 6)
      },

      searchProviders: (query: string) => {
        const lowercaseQuery = query.toLowerCase()
        return get().providers.filter(provider =>
          provider.isActive && (
            provider.name.toLowerCase().includes(lowercaseQuery) ||
            provider.description.toLowerCase().includes(lowercaseQuery) ||
            provider.capabilities.some(cap => cap.toLowerCase().includes(lowercaseQuery))
          )
        )
      },

      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
    }),
    {
      name: 'provider-store',
    }
  )
)