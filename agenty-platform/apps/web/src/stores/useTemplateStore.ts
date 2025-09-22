import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { AgentConfiguration, DeploymentConfig } from '@/services/api'

// Template interface
export interface Template {
  id: string
  name: string
  description: string
  category: string
  previewUrl: string
  isPublic: boolean
  createdBy: string
  usageCount: number
  rating: number
  configuration: AgentConfiguration
  deploymentOptions: string[]
  tags: string[]
  createdAt: string
  updatedAt: string
}

interface TemplateStore {
  // State
  templates: Template[]
  categories: string[]
  isLoading: boolean
  error: string | null

  // Actions
  fetchTemplates: () => Promise<void>
  getTemplatesByCategory: (category: string) => Template[]
  getPopularTemplates: () => Template[]
  searchTemplates: (query: string) => Template[]
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

// Mock template data based on the existing templates.json
const mockTemplates: Template[] = [
  {
    id: 'tpl_1',
    name: 'Customer Support Assistant',
    description: 'Professional customer support bot with ticket handling capabilities',
    category: 'customer_service',
    previewUrl: 'https://agenty.com/previews/customer-support',
    isPublic: true,
    createdBy: 'agenty_official',
    usageCount: 1247,
    rating: 4.8,
    configuration: {
      stt: {
        provider: 'OpenAI',
        model: 'whisper-1',
        language: 'en'
      },
      llm: {
        provider: 'Anthropic',
        model: 'claude-3-sonnet',
        systemPrompt: 'You are a professional customer support assistant. Help customers with their inquiries, be patient, empathetic, and solution-focused. Always ask clarifying questions when needed and provide clear next steps.',
        temperature: 0.7,
        maxTokens: 500
      },
      tts: {
        provider: 'ElevenLabs',
        voice: 'Rachel',
        stability: 0.8,
        clarity: 0.9
      }
    },
    deploymentOptions: ['webrtc', 'phone', 'whatsapp'],
    tags: ['support', 'customer-service', 'professional', 'popular'],
    createdAt: '2024-03-01T00:00:00Z',
    updatedAt: '2024-09-15T12:00:00Z'
  },
  {
    id: 'tpl_2',
    name: 'Sales Qualification Bot',
    description: 'Lead qualification and sales assistant for converting prospects',
    category: 'sales',
    previewUrl: 'https://agenty.com/previews/sales-bot',
    isPublic: true,
    createdBy: 'agenty_official',
    usageCount: 892,
    rating: 4.6,
    configuration: {
      stt: {
        provider: 'Deepgram',
        model: 'nova-2',
        language: 'en'
      },
      llm: {
        provider: 'OpenAI',
        model: 'gpt-4',
        systemPrompt: 'You are a friendly sales assistant. Your goal is to qualify leads and showcase product benefits. Ask engaging questions about their needs, pain points, and budget. Be consultative, not pushy.',
        temperature: 0.8,
        maxTokens: 600
      },
      tts: {
        provider: 'Cartesia',
        voice: 'professional_male',
        speed: 1.1
      }
    },
    deploymentOptions: ['webrtc', 'phone', 'api'],
    tags: ['sales', 'lead-qualification', 'conversion', 'business'],
    createdAt: '2024-03-05T00:00:00Z',
    updatedAt: '2024-09-10T14:30:00Z'
  },
  {
    id: 'tpl_3',
    name: 'Restaurant Booking Assistant',
    description: 'Handles reservations, menu inquiries, and special requests',
    category: 'hospitality',
    previewUrl: 'https://agenty.com/previews/restaurant-bot',
    isPublic: true,
    createdBy: 'agenty_official',
    usageCount: 567,
    rating: 4.7,
    configuration: {
      stt: {
        provider: 'OpenAI',
        model: 'whisper-1',
        language: 'en'
      },
      llm: {
        provider: 'OpenAI',
        model: 'gpt-3.5-turbo',
        systemPrompt: 'You are a friendly restaurant assistant. Help customers make reservations, answer menu questions, and handle special dietary requests. Be warm and welcoming.',
        temperature: 0.6,
        maxTokens: 400
      },
      tts: {
        provider: 'ElevenLabs',
        voice: 'Bella',
        stability: 0.7,
        clarity: 0.8
      }
    },
    deploymentOptions: ['webrtc', 'phone'],
    tags: ['restaurant', 'booking', 'hospitality', 'reservations'],
    createdAt: '2024-04-12T00:00:00Z',
    updatedAt: '2024-08-22T16:15:00Z'
  },
  {
    id: 'tpl_4',
    name: 'E-commerce Shopping Assistant',
    description: 'Product recommendations, order tracking, and shopping help',
    category: 'ecommerce',
    previewUrl: 'https://agenty.com/previews/ecommerce-bot',
    isPublic: true,
    createdBy: 'agenty_official',
    usageCount: 743,
    rating: 4.5,
    configuration: {
      stt: {
        provider: 'Deepgram',
        model: 'nova-2',
        language: 'en'
      },
      llm: {
        provider: 'Anthropic',
        model: 'claude-3-sonnet',
        systemPrompt: 'You are a helpful shopping assistant. Help customers find products, track orders, and answer questions about shipping and returns. Be informative and helpful.',
        temperature: 0.7,
        maxTokens: 500
      },
      tts: {
        provider: 'Azure',
        voice: 'en-US-JennyNeural'
      }
    },
    deploymentOptions: ['webrtc', 'api', 'whatsapp'],
    tags: ['ecommerce', 'shopping', 'recommendations', 'orders'],
    createdAt: '2024-05-08T00:00:00Z',
    updatedAt: '2024-09-05T11:45:00Z'
  },
  {
    id: 'tpl_5',
    name: 'Healthcare Appointment Scheduler',
    description: 'Medical appointment booking and patient intake assistant',
    category: 'healthcare',
    previewUrl: 'https://agenty.com/previews/healthcare-bot',
    isPublic: true,
    createdBy: 'agenty_official',
    usageCount: 234,
    rating: 4.9,
    configuration: {
      stt: {
        provider: 'Google',
        model: 'latest',
        language: 'en-US'
      },
      llm: {
        provider: 'Anthropic',
        model: 'claude-3-sonnet',
        systemPrompt: 'You are a professional medical appointment scheduler. Handle appointment bookings, collect patient information, and provide basic scheduling information. Always maintain patient privacy and be compassionate.',
        temperature: 0.5,
        maxTokens: 400
      },
      tts: {
        provider: 'Azure',
        voice: 'en-US-AriaNeural'
      }
    },
    deploymentOptions: ['webrtc', 'phone'],
    tags: ['healthcare', 'appointments', 'medical', 'scheduling'],
    createdAt: '2024-06-20T00:00:00Z',
    updatedAt: '2024-09-18T09:30:00Z'
  },
  {
    id: 'tpl_6',
    name: 'Hebrew Support Assistant',
    description: 'עוזר תמיכה בעברית לשירות לקוחות ישראלי',
    category: 'customer_service',
    previewUrl: 'https://agenty.com/previews/hebrew-support',
    isPublic: true,
    createdBy: 'agenty_official',
    usageCount: 156,
    rating: 4.8,
    configuration: {
      stt: {
        provider: 'Google',
        model: 'latest',
        language: 'he-IL'
      },
      llm: {
        provider: 'Anthropic',
        model: 'claude-3-haiku',
        systemPrompt: 'אתה עוזר תמיכת לקוחות מקצועי בעברית. עזור ללקוחות עם שאלות ובעיות, היה סבלני ומועיל. תמיד שאל שאלות הבהרה כשצריך ותן הוראות ברורות.',
        temperature: 0.6,
        maxTokens: 400
      },
      tts: {
        provider: 'Azure',
        voice: 'he-IL-AvriNeural'
      }
    },
    deploymentOptions: ['webrtc', 'whatsapp', 'phone'],
    tags: ['hebrew', 'support', 'israel', 'rtl'],
    createdAt: '2024-07-15T00:00:00Z',
    updatedAt: '2024-09-12T15:20:00Z'
  }
]

const categories = [
  'customer_service',
  'sales',
  'hospitality',
  'ecommerce',
  'healthcare',
  'education',
  'finance',
  'general'
]

export const useTemplateStore = create<TemplateStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      templates: mockTemplates,
      categories,
      isLoading: false,
      error: null,

      // Actions
      fetchTemplates: async () => {
        try {
          set({ isLoading: true, error: null })
          // Simulate API call - in real app, this would fetch from API
          await new Promise(resolve => setTimeout(resolve, 500))
          set({ isLoading: false })
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch templates',
            isLoading: false
          })
        }
      },

      getTemplatesByCategory: (category: string) => {
        return get().templates.filter(template =>
          template.isPublic && template.category === category
        )
      },

      getPopularTemplates: () => {
        return get().templates
          .filter(template => template.isPublic)
          .sort((a, b) => b.usageCount - a.usageCount)
          .slice(0, 6)
      },

      searchTemplates: (query: string) => {
        const lowercaseQuery = query.toLowerCase()
        return get().templates.filter(template =>
          template.isPublic && (
            template.name.toLowerCase().includes(lowercaseQuery) ||
            template.description.toLowerCase().includes(lowercaseQuery) ||
            template.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery)) ||
            template.category.toLowerCase().includes(lowercaseQuery)
          )
        )
      },

      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
    }),
    {
      name: 'template-store',
    }
  )
)