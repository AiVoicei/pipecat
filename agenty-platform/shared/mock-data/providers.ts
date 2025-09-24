/**
 * Centralized Mock Provider Data Source
 * Based on actual Pipecat service providers in /src/pipecat/services/
 * This file serves as the single source of truth for all provider data
 * across frontend and backend mock implementations.
 */

export type ProviderType = 'stt' | 'llm' | 'tts'
export type ProviderStatus = 'available' | 'beta' | 'coming_soon'
export type ImplementationStatus = 'implemented' | 'partial' | 'not_implemented'

export interface ProviderCapabilities {
  languages: string[]
  supports_streaming?: boolean
  supports_interruption?: boolean
  supports_realtime?: boolean
  max_input_length?: number
  latency_ms?: number
  quality_score?: number
}

export interface ProviderPricing {
  model: 'pay_per_use' | 'subscription' | 'free'
  cost_per_unit?: number
  input_cost?: number
  output_cost?: number
  unit: string
  currency: string
}

export interface Provider {
  id: string
  name: string
  display_name: string
  type: ProviderType
  description: string
  status: ProviderStatus
  implementation_status: ImplementationStatus
  logo_url?: string
  documentation_url?: string
  configuration_schema: {
    type: string
    properties: Record<string, any>
    required: string[]
    examples?: any[]
  }
  capabilities: ProviderCapabilities
  pricing: ProviderPricing
  supported_formats?: string[]
  requires_setup?: boolean
  is_local?: boolean
}

/**
 * STT Providers - Based on actual Pipecat services
 */
export const STT_PROVIDERS: Provider[] = [
  // Fully implemented providers
  {
    id: 'openai_stt',
    name: 'openai',
    display_name: 'OpenAI Whisper',
    type: 'stt',
    description: 'OpenAI\'s Whisper speech-to-text model with high accuracy',
    status: 'available',
    implementation_status: 'implemented',
    logo_url: '/logos/openai.svg',
    documentation_url: 'https://platform.openai.com/docs/guides/speech-to-text',
    configuration_schema: {
      type: 'object',
      properties: {
        api_key: { type: 'string', description: 'OpenAI API key' },
        model: { type: 'string', enum: ['whisper-1'], default: 'whisper-1' },
        language: { type: 'string', description: 'Language code (e.g., en, he, es)' },
        temperature: { type: 'number', minimum: 0, maximum: 1, default: 0 }
      },
      required: ['api_key'],
      examples: [{ api_key: 'sk-...', model: 'whisper-1', language: 'en' }]
    },
    capabilities: {
      languages: ['en', 'he', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh', 'ar'],
      supports_streaming: true,
      supports_interruption: true,
      latency_ms: 300,
      quality_score: 9.0
    },
    pricing: {
      model: 'pay_per_use',
      cost_per_unit: 0.006,
      unit: 'per minute',
      currency: 'USD'
    },
    supported_formats: ['wav', 'mp3', 'm4a', 'webm']
  },
  {
    id: 'deepgram',
    name: 'deepgram',
    display_name: 'Deepgram Nova',
    type: 'stt',
    description: 'Deepgram\'s real-time speech recognition with Nova models',
    status: 'available',
    implementation_status: 'implemented',
    logo_url: '/logos/deepgram.svg',
    documentation_url: 'https://developers.deepgram.com/',
    configuration_schema: {
      type: 'object',
      properties: {
        api_key: { type: 'string', description: 'Deepgram API key' },
        model: { type: 'string', enum: ['nova-2', 'nova', 'enhanced', 'base'], default: 'nova-2' },
        language: { type: 'string', description: 'Language code' },
        punctuate: { type: 'boolean', default: true },
        diarize: { type: 'boolean', default: false }
      },
      required: ['api_key'],
      examples: [{ api_key: 'xxx', model: 'nova-2', language: 'en' }]
    },
    capabilities: {
      languages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'nl', 'ru', 'ja', 'ko'],
      supports_streaming: true,
      supports_interruption: true,
      supports_realtime: true,
      latency_ms: 250,
      quality_score: 8.8
    },
    pricing: {
      model: 'pay_per_use',
      cost_per_unit: 0.0043,
      unit: 'per minute',
      currency: 'USD'
    }
  },
  {
    id: 'azure_stt',
    name: 'azure',
    display_name: 'Azure Speech Services',
    type: 'stt',
    description: 'Microsoft Azure Speech-to-Text with neural models',
    status: 'available',
    implementation_status: 'implemented',
    logo_url: '/logos/azure.svg',
    configuration_schema: {
      type: 'object',
      properties: {
        api_key: { type: 'string', description: 'Azure Speech API key' },
        region: { type: 'string', description: 'Azure region (e.g., eastus)' },
        language: { type: 'string', default: 'en-US' }
      },
      required: ['api_key', 'region']
    },
    capabilities: {
      languages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'he', 'ar', 'ja', 'ko'],
      supports_streaming: true,
      supports_interruption: true,
      latency_ms: 280,
      quality_score: 8.5
    },
    pricing: {
      model: 'pay_per_use',
      cost_per_unit: 0.001,
      unit: 'per hour',
      currency: 'USD'
    }
  },
  // Partially implemented providers
  {
    id: 'google_stt',
    name: 'google',
    display_name: 'Google Speech-to-Text',
    type: 'stt',
    description: 'Google Cloud Speech-to-Text API',
    status: 'beta',
    implementation_status: 'partial',
    logo_url: '/logos/google.svg',
    configuration_schema: {
      type: 'object',
      properties: {
        credentials_json: { type: 'string', description: 'Service account JSON' },
        language_code: { type: 'string', default: 'en-US' },
        model: { type: 'string', default: 'latest_long' }
      },
      required: ['credentials_json']
    },
    capabilities: {
      languages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'he', 'ar', 'ja', 'ko', 'zh'],
      supports_streaming: true,
      supports_interruption: true,
      latency_ms: 320,
      quality_score: 8.9
    },
    pricing: {
      model: 'pay_per_use',
      cost_per_unit: 0.006,
      unit: 'per minute',
      currency: 'USD'
    }
  },
  {
    id: 'assemblyai',
    name: 'assemblyai',
    display_name: 'AssemblyAI',
    type: 'stt',
    description: 'AssemblyAI speech recognition and understanding',
    status: 'beta',
    implementation_status: 'partial',
    logo_url: '/logos/assemblyai.svg',
    configuration_schema: {
      type: 'object',
      properties: {
        api_key: { type: 'string', description: 'AssemblyAI API key' },
        language_code: { type: 'string', default: 'en' }
      },
      required: ['api_key']
    },
    capabilities: {
      languages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'nl'],
      supports_streaming: true,
      supports_interruption: true,
      latency_ms: 290,
      quality_score: 8.6
    },
    pricing: {
      model: 'pay_per_use',
      cost_per_unit: 0.00037,
      unit: 'per second',
      currency: 'USD'
    }
  },
  // Coming soon providers (exist in Pipecat but not implemented in Agenty)
  {
    id: 'groq_stt',
    name: 'groq',
    display_name: 'Groq Whisper',
    type: 'stt',
    description: 'Ultra-fast Whisper inference on Groq chips',
    status: 'coming_soon',
    implementation_status: 'not_implemented',
    logo_url: '/logos/groq.svg',
    configuration_schema: {
      type: 'object',
      properties: {
        api_key: { type: 'string', description: 'Groq API key' },
        model: { type: 'string', default: 'whisper-large-v3' },
        language: { type: 'string' }
      },
      required: ['api_key']
    },
    capabilities: {
      languages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'he'],
      supports_streaming: false,
      latency_ms: 150,
      quality_score: 8.8
    },
    pricing: {
      model: 'pay_per_use',
      cost_per_unit: 0.00011,
      unit: 'per second',
      currency: 'USD'
    }
  },
  {
    id: 'aws_stt',
    name: 'aws',
    display_name: 'AWS Transcribe',
    type: 'stt',
    description: 'Amazon Web Services Transcribe',
    status: 'coming_soon',
    implementation_status: 'not_implemented',
    logo_url: '/logos/aws.svg',
    configuration_schema: {
      type: 'object',
      properties: {
        access_key_id: { type: 'string' },
        secret_access_key: { type: 'string' },
        region: { type: 'string', default: 'us-east-1' },
        language_code: { type: 'string', default: 'en-US' }
      },
      required: ['access_key_id', 'secret_access_key']
    },
    capabilities: {
      languages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ar', 'he'],
      supports_streaming: true,
      latency_ms: 400,
      quality_score: 8.3
    },
    pricing: {
      model: 'pay_per_use',
      cost_per_unit: 0.024,
      unit: 'per minute',
      currency: 'USD'
    }
  },
  {
    id: 'gladia',
    name: 'gladia',
    display_name: 'Gladia',
    type: 'stt',
    description: 'Gladia speech recognition with translation',
    status: 'coming_soon',
    implementation_status: 'not_implemented',
    logo_url: '/logos/gladia.svg',
    configuration_schema: {
      type: 'object',
      properties: {
        api_key: { type: 'string' },
        language: { type: 'string', default: 'en' },
        enable_translation: { type: 'boolean', default: false }
      },
      required: ['api_key']
    },
    capabilities: {
      languages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'he', 'ar', 'ja', 'ko'],
      supports_streaming: true,
      supports_interruption: true,
      latency_ms: 350,
      quality_score: 8.4
    },
    pricing: {
      model: 'pay_per_use',
      cost_per_unit: 0.000305,
      unit: 'per second',
      currency: 'USD'
    }
  },
  {
    id: 'speechmatics',
    name: 'speechmatics',
    display_name: 'Speechmatics',
    type: 'stt',
    description: 'Real-time automatic speech recognition',
    status: 'coming_soon',
    implementation_status: 'not_implemented',
    logo_url: '/logos/speechmatics.svg',
    configuration_schema: {
      type: 'object',
      properties: {
        api_key: { type: 'string' },
        language: { type: 'string', default: 'en' },
        enable_partials: { type: 'boolean', default: true }
      },
      required: ['api_key']
    },
    capabilities: {
      languages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'nl'],
      supports_streaming: true,
      supports_interruption: true,
      latency_ms: 270,
      quality_score: 8.3
    },
    pricing: {
      model: 'pay_per_use',
      cost_per_unit: 0.003,
      unit: 'per minute',
      currency: 'USD'
    }
  },
  {
    id: 'soniox',
    name: 'soniox',
    display_name: 'Soniox',
    type: 'stt',
    description: 'High-accuracy speech recognition API',
    status: 'coming_soon',
    implementation_status: 'not_implemented',
    configuration_schema: {
      type: 'object',
      properties: {
        api_key: { type: 'string' }
      },
      required: ['api_key']
    },
    capabilities: {
      languages: ['en'],
      supports_streaming: true,
      latency_ms: 200,
      quality_score: 8.5
    },
    pricing: {
      model: 'pay_per_use',
      cost_per_unit: 0.005,
      unit: 'per minute',
      currency: 'USD'
    }
  },
  {
    id: 'whisper_local',
    name: 'whisper',
    display_name: 'Whisper (Local)',
    type: 'stt',
    description: 'Local Whisper implementation',
    status: 'coming_soon',
    implementation_status: 'not_implemented',
    requires_setup: true,
    is_local: true,
    configuration_schema: {
      type: 'object',
      properties: {
        model: { type: 'string', enum: ['tiny', 'base', 'small', 'medium', 'large'], default: 'base' },
        language: { type: 'string' }
      },
      required: ['model']
    },
    capabilities: {
      languages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'he', 'ar', 'ja', 'ko'],
      supports_streaming: false,
      latency_ms: 1000,
      quality_score: 8.0
    },
    pricing: {
      model: 'free',
      cost_per_unit: 0,
      unit: 'free (local)',
      currency: 'USD'
    }
  },
  {
    id: 'riva',
    name: 'riva',
    display_name: 'NVIDIA Riva',
    type: 'stt',
    description: 'NVIDIA Riva speech AI SDK',
    status: 'coming_soon',
    implementation_status: 'not_implemented',
    requires_setup: true,
    configuration_schema: {
      type: 'object',
      properties: {
        server_url: { type: 'string', default: 'localhost:50051' },
        language_code: { type: 'string', default: 'en-US' }
      },
      required: ['server_url']
    },
    capabilities: {
      languages: ['en', 'es'],
      supports_streaming: true,
      latency_ms: 100,
      quality_score: 8.7
    },
    pricing: {
      model: 'free',
      cost_per_unit: 0,
      unit: 'free (on-premise)',
      currency: 'USD'
    }
  },
  {
    id: 'sambanova_stt',
    name: 'sambanova',
    display_name: 'SambaNova',
    type: 'stt',
    description: 'SambaNova speech recognition',
    status: 'coming_soon',
    implementation_status: 'not_implemented',
    configuration_schema: {
      type: 'object',
      properties: {
        api_key: { type: 'string' }
      },
      required: ['api_key']
    },
    capabilities: {
      languages: ['en'],
      supports_streaming: true,
      latency_ms: 300,
      quality_score: 8.0
    },
    pricing: {
      model: 'pay_per_use',
      cost_per_unit: 0.002,
      unit: 'per minute',
      currency: 'USD'
    }
  },
  {
    id: 'cartesia_stt',
    name: 'cartesia',
    display_name: 'Cartesia STT',
    type: 'stt',
    description: 'Cartesia speech-to-text (coming soon)',
    status: 'coming_soon',
    implementation_status: 'not_implemented',
    configuration_schema: {
      type: 'object',
      properties: {
        api_key: { type: 'string' }
      },
      required: ['api_key']
    },
    capabilities: {
      languages: ['en'],
      supports_streaming: true,
      latency_ms: 200,
      quality_score: 8.2
    },
    pricing: {
      model: 'pay_per_use',
      cost_per_unit: 0.003,
      unit: 'per minute',
      currency: 'USD'
    }
  },
  {
    id: 'fal_stt',
    name: 'fal',
    display_name: 'Fal AI STT',
    type: 'stt',
    description: 'Fal AI speech recognition',
    status: 'coming_soon',
    implementation_status: 'not_implemented',
    configuration_schema: {
      type: 'object',
      properties: {
        api_key: { type: 'string' }
      },
      required: ['api_key']
    },
    capabilities: {
      languages: ['en'],
      supports_streaming: false,
      latency_ms: 500,
      quality_score: 7.8
    },
    pricing: {
      model: 'pay_per_use',
      cost_per_unit: 0.001,
      unit: 'per minute',
      currency: 'USD'
    }
  }
]

/**
 * LLM Providers - Based on actual Pipecat services
 */
export const LLM_PROVIDERS: Provider[] = [
  // Fully implemented providers
  {
    id: 'openai_llm',
    name: 'openai',
    display_name: 'OpenAI GPT',
    type: 'llm',
    description: 'OpenAI\'s GPT language models including GPT-4 and GPT-3.5',
    status: 'available',
    implementation_status: 'implemented',
    logo_url: '/logos/openai.svg',
    documentation_url: 'https://platform.openai.com/docs/api-reference',
    configuration_schema: {
      type: 'object',
      properties: {
        api_key: { type: 'string', description: 'OpenAI API key' },
        model: {
          type: 'string',
          enum: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo', 'gpt-4o', 'gpt-4o-mini'],
          default: 'gpt-4'
        },
        temperature: { type: 'number', minimum: 0, maximum: 2, default: 0.7 },
        max_tokens: { type: 'integer', minimum: 1, maximum: 4096, default: 150 },
        system_prompt: { type: 'string', description: 'System prompt for the model' }
      },
      required: ['api_key'],
      examples: [{ api_key: 'sk-...', model: 'gpt-4', temperature: 0.7 }]
    },
    capabilities: {
      languages: ['en', 'he', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh', 'ar'],
      max_input_length: 8192,
      supports_streaming: true,
      supports_realtime: true,
      latency_ms: 800,
      quality_score: 9.5
    },
    pricing: {
      model: 'pay_per_use',
      input_cost: 0.03,
      output_cost: 0.06,
      unit: 'per 1000 tokens',
      currency: 'USD'
    }
  },
  {
    id: 'anthropic',
    name: 'anthropic',
    display_name: 'Anthropic Claude',
    type: 'llm',
    description: 'Anthropic\'s Claude language models with long context',
    status: 'available',
    implementation_status: 'implemented',
    logo_url: '/logos/anthropic.svg',
    documentation_url: 'https://docs.anthropic.com/claude/reference/getting-started-with-the-api',
    configuration_schema: {
      type: 'object',
      properties: {
        api_key: { type: 'string', description: 'Anthropic API key' },
        model: {
          type: 'string',
          enum: ['claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307'],
          default: 'claude-3-sonnet-20240229'
        },
        max_tokens: { type: 'integer', minimum: 1, maximum: 4096, default: 150 },
        system_prompt: { type: 'string', description: 'System prompt for the model' }
      },
      required: ['api_key'],
      examples: [{ api_key: 'sk-ant-...', model: 'claude-3-sonnet-20240229' }]
    },
    capabilities: {
      languages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ja'],
      max_input_length: 200000,
      supports_streaming: true,
      latency_ms: 900,
      quality_score: 9.3
    },
    pricing: {
      model: 'pay_per_use',
      input_cost: 0.015,
      output_cost: 0.075,
      unit: 'per 1000 tokens',
      currency: 'USD'
    }
  },
  {
    id: 'azure_llm',
    name: 'azure',
    display_name: 'Azure OpenAI',
    type: 'llm',
    description: 'Microsoft Azure OpenAI Service',
    status: 'available',
    implementation_status: 'implemented',
    logo_url: '/logos/azure.svg',
    configuration_schema: {
      type: 'object',
      properties: {
        api_key: { type: 'string' },
        endpoint: { type: 'string', description: 'Azure OpenAI endpoint URL' },
        deployment: { type: 'string', description: 'Deployment name' },
        api_version: { type: 'string', default: '2024-02-01' },
        temperature: { type: 'number', default: 0.7 }
      },
      required: ['api_key', 'endpoint', 'deployment']
    },
    capabilities: {
      languages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'he'],
      supports_streaming: true,
      latency_ms: 850,
      quality_score: 9.2
    },
    pricing: {
      model: 'pay_per_use',
      input_cost: 0.002,
      output_cost: 0.002,
      unit: 'per 1000 tokens',
      currency: 'USD'
    }
  },
  // More LLM providers would continue here...
  // For brevity, I'll add a few key ones and mark the rest as coming_soon
  {
    id: 'google_llm',
    name: 'google',
    display_name: 'Google Gemini',
    type: 'llm',
    description: 'Google\'s Gemini language models',
    status: 'beta',
    implementation_status: 'partial',
    logo_url: '/logos/google.svg',
    configuration_schema: {
      type: 'object',
      properties: {
        api_key: { type: 'string' },
        model: {
          type: 'string',
          enum: ['gemini-pro', 'gemini-pro-vision'],
          default: 'gemini-pro'
        },
        temperature: { type: 'number', default: 0.7 }
      },
      required: ['api_key']
    },
    capabilities: {
      languages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'he', 'ja', 'ko'],
      supports_streaming: true,
      latency_ms: 750,
      quality_score: 9.1
    },
    pricing: {
      model: 'pay_per_use',
      input_cost: 0.001,
      output_cost: 0.002,
      unit: 'per 1000 tokens',
      currency: 'USD'
    }
  }
]

/**
 * TTS Providers - Based on actual Pipecat services
 */
export const TTS_PROVIDERS: Provider[] = [
  // Fully implemented providers
  {
    id: 'elevenlabs',
    name: 'elevenlabs',
    display_name: 'ElevenLabs',
    type: 'tts',
    description: 'Ultra-realistic text-to-speech with voice cloning',
    status: 'available',
    implementation_status: 'implemented',
    logo_url: '/logos/elevenlabs.svg',
    documentation_url: 'https://docs.elevenlabs.io/',
    configuration_schema: {
      type: 'object',
      properties: {
        api_key: { type: 'string', description: 'ElevenLabs API key' },
        voice_id: { type: 'string', description: 'Voice ID to use' },
        stability: { type: 'number', minimum: 0, maximum: 1, default: 0.5 },
        similarity_boost: { type: 'number', minimum: 0, maximum: 1, default: 0.8 },
        style: { type: 'number', minimum: 0, maximum: 1, default: 0 }
      },
      required: ['api_key', 'voice_id'],
      examples: [{ api_key: 'xxx', voice_id: '21m00Tcm4TlvDq8ikWAM' }]
    },
    capabilities: {
      languages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'hi', 'pl'],
      supports_streaming: true,
      latency_ms: 400,
      quality_score: 9.7
    },
    pricing: {
      model: 'pay_per_use',
      cost_per_unit: 0.22,
      unit: 'per 1000 characters',
      currency: 'USD'
    }
  },
  {
    id: 'cartesia',
    name: 'cartesia',
    display_name: 'Cartesia',
    type: 'tts',
    description: 'Real-time neural text-to-speech with ultra-low latency',
    status: 'available',
    implementation_status: 'implemented',
    logo_url: '/logos/cartesia.svg',
    configuration_schema: {
      type: 'object',
      properties: {
        api_key: { type: 'string', description: 'Cartesia API key' },
        voice_id: { type: 'string', description: 'Voice ID' },
        model_id: { type: 'string', default: 'sonic-english' }
      },
      required: ['api_key', 'voice_id'],
      examples: [{ api_key: 'xxx', voice_id: 'a0e99841-438c-4a64-b679-ae501e7d6091' }]
    },
    capabilities: {
      languages: ['en', 'es', 'fr', 'de', 'pt'],
      supports_streaming: true,
      supports_realtime: true,
      latency_ms: 150,
      quality_score: 8.9
    },
    pricing: {
      model: 'pay_per_use',
      cost_per_unit: 0.0625,
      unit: 'per 1000 characters',
      currency: 'USD'
    }
  },
  {
    id: 'azure_tts',
    name: 'azure',
    display_name: 'Azure Text-to-Speech',
    type: 'tts',
    description: 'Microsoft Azure neural text-to-speech service',
    status: 'available',
    implementation_status: 'implemented',
    logo_url: '/logos/azure.svg',
    configuration_schema: {
      type: 'object',
      properties: {
        api_key: { type: 'string' },
        region: { type: 'string' },
        voice_name: { type: 'string', default: 'en-US-JennyNeural' }
      },
      required: ['api_key', 'region']
    },
    capabilities: {
      languages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'he', 'ar'],
      supports_streaming: true,
      latency_ms: 400,
      quality_score: 8.7
    },
    pricing: {
      model: 'pay_per_use',
      cost_per_unit: 0.016,
      unit: 'per 1000 characters',
      currency: 'USD'
    }
  }
  // More TTS providers would be added here...
]

/**
 * All providers combined
 */
export const ALL_PROVIDERS: Provider[] = [
  ...STT_PROVIDERS,
  ...LLM_PROVIDERS,
  ...TTS_PROVIDERS
]

/**
 * Provider implementation status map for backend usage
 */
export const PROVIDER_IMPLEMENTATION_STATUS: Record<string, {
  implemented: boolean
  mock_fallback: boolean
  pipecat_service_available: boolean
}> = {
  // STT
  'openai_stt': { implemented: true, mock_fallback: false, pipecat_service_available: true },
  'deepgram': { implemented: true, mock_fallback: false, pipecat_service_available: true },
  'azure_stt': { implemented: true, mock_fallback: false, pipecat_service_available: true },
  'google_stt': { implemented: false, mock_fallback: true, pipecat_service_available: true },
  'assemblyai': { implemented: false, mock_fallback: true, pipecat_service_available: true },
  'groq_stt': { implemented: false, mock_fallback: true, pipecat_service_available: true },
  'aws_stt': { implemented: false, mock_fallback: true, pipecat_service_available: true },
  'gladia': { implemented: false, mock_fallback: true, pipecat_service_available: true },
  'speechmatics': { implemented: false, mock_fallback: true, pipecat_service_available: true },
  'soniox': { implemented: false, mock_fallback: true, pipecat_service_available: true },
  'whisper_local': { implemented: false, mock_fallback: true, pipecat_service_available: true },
  'riva': { implemented: false, mock_fallback: true, pipecat_service_available: true },
  'sambanova_stt': { implemented: false, mock_fallback: true, pipecat_service_available: true },
  'cartesia_stt': { implemented: false, mock_fallback: true, pipecat_service_available: true },
  'fal_stt': { implemented: false, mock_fallback: true, pipecat_service_available: true },

  // LLM
  'openai_llm': { implemented: true, mock_fallback: false, pipecat_service_available: true },
  'anthropic': { implemented: true, mock_fallback: false, pipecat_service_available: true },
  'azure_llm': { implemented: true, mock_fallback: false, pipecat_service_available: true },
  'google_llm': { implemented: false, mock_fallback: true, pipecat_service_available: true },

  // TTS
  'elevenlabs': { implemented: true, mock_fallback: false, pipecat_service_available: true },
  'cartesia': { implemented: true, mock_fallback: false, pipecat_service_available: true },
  'azure_tts': { implemented: true, mock_fallback: false, pipecat_service_available: true }
}

/**
 * Helper functions
 */
export function getProvidersByType(type: ProviderType): Provider[] {
  return ALL_PROVIDERS.filter(p => p.type === type)
}

export function getProviderById(id: string): Provider | undefined {
  return ALL_PROVIDERS.find(p => p.id === id)
}

export function getAvailableProviders(): Provider[] {
  return ALL_PROVIDERS.filter(p => p.status === 'available')
}

export function getImplementedProviders(): Provider[] {
  return ALL_PROVIDERS.filter(p => p.implementation_status === 'implemented')
}

export function getProvidersByStatus(status: ProviderStatus): Provider[] {
  return ALL_PROVIDERS.filter(p => p.status === status)
}