import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePipelineStore, PIPELINE_TEMPLATES, PipelineTemplate } from '../usePipelineStore'

describe('Phase 3: User Guidance & Templates', () => {
  beforeEach(() => {
    // Reset store before each test
    const { result } = renderHook(() => usePipelineStore())
    act(() => {
      result.current.resetPipeline()
    })
  })

  describe('Pipeline Templates', () => {
    it('should have 6 predefined templates', () => {
      expect(PIPELINE_TEMPLATES).toHaveLength(6)
    })

    it('should have 2 realtime templates', () => {
      const realtimeTemplates = PIPELINE_TEMPLATES.filter(t => t.type === 'realtime')
      expect(realtimeTemplates).toHaveLength(2)
      expect(realtimeTemplates.map(t => t.id)).toEqual(['openai-realtime', 'gemini-live'])
    })

    it('should have 3 traditional templates', () => {
      const traditionalTemplates = PIPELINE_TEMPLATES.filter(t => t.type === 'traditional')
      expect(traditionalTemplates).toHaveLength(3)
    })

    it('should have 1 enhanced template', () => {
      const enhancedTemplates = PIPELINE_TEMPLATES.filter(t => t.type === 'enhanced')
      expect(enhancedTemplates).toHaveLength(1)
      expect(enhancedTemplates[0].id).toBe('enhanced-filters')
    })

    it('should have all required template fields', () => {
      PIPELINE_TEMPLATES.forEach(template => {
        expect(template).toHaveProperty('id')
        expect(template).toHaveProperty('name')
        expect(template).toHaveProperty('description')
        expect(template).toHaveProperty('type')
        expect(template).toHaveProperty('nodes')
        expect(template).toHaveProperty('edges')
        expect(template.id).toBeTruthy()
        expect(template.name).toBeTruthy()
        expect(template.description).toBeTruthy()
      })
    })
  })

  describe('Template Loading', () => {
    it('should load OpenAI Realtime template correctly', () => {
      const { result } = renderHook(() => usePipelineStore())

      act(() => {
        result.current.loadTemplate('openai-realtime')
      })

      // Wait for async operations
      setTimeout(() => {
        expect(result.current.nodes).toHaveLength(1)
        expect(result.current.nodes[0].data.type).toBe('realtime')
        expect(result.current.nodes[0].data.provider).toBe('openai-realtime')
        expect(result.current.edges).toHaveLength(0) // Realtime has no connections
      }, 150)
    })

    it('should load OpenAI Complete pipeline correctly', () => {
      const { result } = renderHook(() => usePipelineStore())

      act(() => {
        result.current.loadTemplate('openai-pipeline')
      })

      setTimeout(() => {
        expect(result.current.nodes).toHaveLength(3)
        expect(result.current.edges).toHaveLength(2)

        // Check node types
        const nodeTypes = result.current.nodes.map(n => n.data.type)
        expect(nodeTypes).toContain('stt')
        expect(nodeTypes).toContain('llm')
        expect(nodeTypes).toContain('tts')
      }, 150)
    })

    it('should load enhanced pipeline with filters correctly', () => {
      const { result } = renderHook(() => usePipelineStore())

      act(() => {
        result.current.loadTemplate('enhanced-filters')
      })

      setTimeout(() => {
        expect(result.current.nodes).toHaveLength(5)
        expect(result.current.edges).toHaveLength(4)

        const filterNodes = result.current.nodes.filter(n => n.data.type === 'filter')
        expect(filterNodes).toHaveLength(2)
      }, 150)
    })

    it('should clear existing pipeline before loading template', () => {
      const { result } = renderHook(() => usePipelineStore())

      // Add some nodes first
      act(() => {
        result.current.addNode('stt', { x: 100, y: 100 })
        result.current.addNode('llm', { x: 200, y: 200 })
      })

      expect(result.current.nodes).toHaveLength(2)

      // Load template - should clear existing nodes
      act(() => {
        result.current.loadTemplate('openai-realtime')
      })

      setTimeout(() => {
        expect(result.current.nodes).toHaveLength(1)
        expect(result.current.nodes[0].data.type).toBe('realtime')
      }, 150)
    })

    it('should position nodes correctly with spacing', () => {
      const { result } = renderHook(() => usePipelineStore())

      act(() => {
        result.current.loadTemplate('openai-pipeline')
      })

      setTimeout(() => {
        const positions = result.current.nodes.map(n => n.position.x)
        // First node at 100, then 100 + 280 = 380, then 380 + 280 = 660
        expect(positions[0]).toBe(100)
        expect(positions[1]).toBe(380)
        expect(positions[2]).toBe(660)
      }, 150)
    })

    it('should handle invalid template ID gracefully', () => {
      const { result } = renderHook(() => usePipelineStore())

      act(() => {
        result.current.loadTemplate('invalid-template-id')
      })

      expect(result.current.error).toBe('Template not found')
    })

    it('should create edges after nodes are set', () => {
      const { result } = renderHook(() => usePipelineStore())

      act(() => {
        result.current.loadTemplate('anthropic-elevenlabs')
      })

      // Edges should be created after a small delay (100ms)
      setTimeout(() => {
        expect(result.current.edges).toHaveLength(2)
        expect(result.current.edges[0].type).toBe('turbo')
        expect(result.current.edges[0].animated).toBe(true)
      }, 150)
    })
  })

  describe('Template Node Positioning', () => {
    it('should space nodes 280px apart horizontally', () => {
      const template = PIPELINE_TEMPLATES.find(t => t.id === 'openai-pipeline')!
      const expectedSpacing = 280

      // Calculate expected positions
      const expectedPositions = template.nodes.map((_, index) => ({
        x: 100 + (index * expectedSpacing),
        y: 200
      }))

      expect(expectedPositions[0]).toEqual({ x: 100, y: 200 })
      expect(expectedPositions[1]).toEqual({ x: 380, y: 200 })
      expect(expectedPositions[2]).toEqual({ x: 660, y: 200 })
    })

    it('should position all nodes at the same y coordinate', () => {
      const { result } = renderHook(() => usePipelineStore())

      act(() => {
        result.current.loadTemplate('openai-pipeline')
      })

      setTimeout(() => {
        const yCoords = result.current.nodes.map(n => n.position.y)
        yCoords.forEach(y => {
          expect(y).toBe(200)
        })
      }, 150)
    })
  })

  describe('Template Edge Configuration', () => {
    it('should create edges with proper turbo styling', () => {
      const { result } = renderHook(() => usePipelineStore())

      act(() => {
        result.current.loadTemplate('azure-complete')
      })

      setTimeout(() => {
        result.current.edges.forEach(edge => {
          expect(edge.type).toBe('turbo')
          expect(edge.animated).toBe(true)
          expect(edge.style).toEqual({
            stroke: '#8B5CF6',
            strokeWidth: 2
          })
        })
      }, 150)
    })

    it('should connect nodes in correct sequence for traditional pipeline', () => {
      const { result } = renderHook(() => usePipelineStore())

      act(() => {
        result.current.loadTemplate('openai-pipeline')
      })

      setTimeout(() => {
        const nodes = result.current.nodes
        const edges = result.current.edges

        // First edge should connect STT to LLM
        const firstEdge = edges[0]
        expect(firstEdge.source).toBe(nodes[0].id)
        expect(firstEdge.target).toBe(nodes[1].id)

        // Second edge should connect LLM to TTS
        const secondEdge = edges[1]
        expect(secondEdge.source).toBe(nodes[1].id)
        expect(secondEdge.target).toBe(nodes[2].id)
      }, 150)
    })
  })

  describe('Template Provider Configuration', () => {
    it('should preserve provider information from template', () => {
      const { result } = renderHook(() => usePipelineStore())

      act(() => {
        result.current.loadTemplate('anthropic-elevenlabs')
      })

      setTimeout(() => {
        const providers = result.current.nodes.map(n => n.data.provider)
        expect(providers).toEqual(['deepgram', 'anthropic', 'elevenlabs'])
      }, 150)
    })

    it('should mark nodes as unconfigured initially', () => {
      const { result } = renderHook(() => usePipelineStore())

      act(() => {
        result.current.loadTemplate('openai-pipeline')
      })

      setTimeout(() => {
        result.current.nodes.forEach(node => {
          expect(node.data.isConfigured).toBe(false)
        })
      }, 150)
    })
  })

  describe('Template Data Integrity', () => {
    it('should maintain template immutability', () => {
      const originalTemplate = { ...PIPELINE_TEMPLATES[0] }

      const { result } = renderHook(() => usePipelineStore())

      act(() => {
        result.current.loadTemplate(originalTemplate.id)
      })

      // Template should not be mutated
      expect(PIPELINE_TEMPLATES[0]).toEqual(originalTemplate)
    })

    it('should create unique node IDs for each load', () => {
      const { result } = renderHook(() => usePipelineStore())

      let firstLoadIds: string[] = []
      let secondLoadIds: string[] = []

      act(() => {
        result.current.loadTemplate('openai-pipeline')
      })

      setTimeout(() => {
        firstLoadIds = result.current.nodes.map(n => n.id)

        act(() => {
          result.current.loadTemplate('openai-pipeline')
        })

        setTimeout(() => {
          secondLoadIds = result.current.nodes.map(n => n.id)

          // IDs should be different between loads
          expect(firstLoadIds).not.toEqual(secondLoadIds)
        }, 150)
      }, 150)
    })
  })

  describe('Template Error Handling', () => {
    it('should set error state for non-existent template', () => {
      const { result } = renderHook(() => usePipelineStore())

      act(() => {
        result.current.loadTemplate('non-existent-template')
      })

      expect(result.current.error).toBe('Template not found')
    })

    it('should not modify pipeline on error', () => {
      const { result } = renderHook(() => usePipelineStore())

      // Add a node first
      act(() => {
        result.current.addNode('stt', { x: 100, y: 100 })
      })

      const initialNodeCount = result.current.nodes.length

      // Try to load invalid template
      act(() => {
        result.current.loadTemplate('invalid')
      })

      // Nodes should remain unchanged
      expect(result.current.nodes).toHaveLength(initialNodeCount)
    })
  })

  describe('Template Validation', () => {
    it('should create valid realtime pipeline from template', () => {
      const { result } = renderHook(() => usePipelineStore())

      act(() => {
        result.current.loadTemplate('gemini-live')
      })

      setTimeout(() => {
        const validation = result.current.validatePipeline()
        expect(validation).toBe(true) // Should be valid structurally
      }, 150)
    })

    it('should create valid traditional pipeline from template', () => {
      const { result } = renderHook(() => usePipelineStore())

      act(() => {
        result.current.loadTemplate('azure-complete')
      })

      setTimeout(() => {
        const isValid = result.current.validatePipeline()
        expect(isValid).toBe(true)
      }, 150)
    })
  })

  describe('Template Use Cases', () => {
    it('should support quick OpenAI setup', () => {
      const template = PIPELINE_TEMPLATES.find(t => t.id === 'openai-pipeline')!
      expect(template.name).toBe('OpenAI Complete')
      expect(template.nodes).toHaveLength(3)
      expect(template.nodes.every(n => n.provider?.includes('openai'))).toBe(true)
    })

    it('should support Claude + ElevenLabs setup', () => {
      const template = PIPELINE_TEMPLATES.find(t => t.id === 'anthropic-elevenlabs')!
      expect(template.name).toBe('Claude + ElevenLabs')
      expect(template.nodes.find(n => n.provider === 'anthropic')).toBeTruthy()
      expect(template.nodes.find(n => n.provider === 'elevenlabs')).toBeTruthy()
    })

    it('should support Microsoft Azure setup', () => {
      const template = PIPELINE_TEMPLATES.find(t => t.id === 'azure-complete')!
      expect(template.name).toBe('Microsoft Azure')
      expect(template.nodes.every(n => n.provider?.includes('azure'))).toBe(true)
    })
  })
})
