import { describe, it, expect } from 'vitest'
import { isValidConnection, validatePipelineDetailed, PipelineNode, PipelineNodeData } from '../usePipelineStore'
import { Edge } from '@xyflow/react'

// Helper function to create test nodes
function createNode(type: string, id: string): PipelineNode {
  return {
    id,
    type: 'turbo',
    position: { x: 0, y: 0 },
    data: {
      label: `${type.toUpperCase()} Node`,
      type: type as any,
      isConfigured: true,
      nodeType: type as any,
      status: 'idle'
    }
  }
}

// Helper function to create configured nodes
function createConfiguredNode(type: string, id: string, provider: string): PipelineNode {
  return {
    id,
    type: 'turbo',
    position: { x: 0, y: 0 },
    data: {
      label: `${type.toUpperCase()} Node`,
      type: type as any,
      provider,
      isConfigured: true,
      nodeType: type as any,
      status: 'idle'
    }
  }
}

describe('Pipeline Connection Validation', () => {
  describe('Rule 1: Same-Type Connections', () => {
    it('should reject STT to STT connection', () => {
      const sttNode1 = createNode('stt', 'node1')
      const sttNode2 = createNode('stt', 'node2')

      const result = isValidConnection(sttNode1, sttNode2, [sttNode1, sttNode2], [])

      expect(result.valid).toBe(false)
      expect(result.error).toContain('same node types')
      expect(result.error).toContain('STT')
    })

    it('should reject LLM to LLM connection', () => {
      const llmNode1 = createNode('llm', 'node1')
      const llmNode2 = createNode('llm', 'node2')

      const result = isValidConnection(llmNode1, llmNode2, [llmNode1, llmNode2], [])

      expect(result.valid).toBe(false)
      expect(result.error).toContain('same node types')
    })

    it('should reject TTS to TTS connection', () => {
      const ttsNode1 = createNode('tts', 'node1')
      const ttsNode2 = createNode('tts', 'node2')

      const result = isValidConnection(ttsNode1, ttsNode2, [ttsNode1, ttsNode2], [])

      expect(result.valid).toBe(false)
      expect(result.error).toContain('same node types')
    })
  })

  describe('Rule 2: Realtime Node Isolation', () => {
    it('should reject realtime to LLM connection', () => {
      const realtimeNode = createNode('realtime', 'node1')
      const llmNode = createNode('llm', 'node2')

      const result = isValidConnection(realtimeNode, llmNode, [realtimeNode, llmNode], [])

      expect(result.valid).toBe(false)
      expect(result.error).toContain('Realtime nodes')
      expect(result.error).toContain('independently')
    })

    it('should reject STT to realtime connection', () => {
      const sttNode = createNode('stt', 'node1')
      const realtimeNode = createNode('realtime', 'node2')

      const result = isValidConnection(sttNode, realtimeNode, [sttNode, realtimeNode], [])

      expect(result.valid).toBe(false)
      expect(result.error).toContain('Realtime nodes')
    })

    it('should reject realtime to realtime connection', () => {
      const realtime1 = createNode('realtime', 'node1')
      const realtime2 = createNode('realtime', 'node2')

      const result = isValidConnection(realtime1, realtime2, [realtime1, realtime2], [])

      expect(result.valid).toBe(false)
      expect(result.error).toContain('same node types')
    })
  })

  describe('Rule 3: Valid Connection Mappings', () => {
    it('should accept STT to LLM connection', () => {
      const sttNode = createNode('stt', 'node1')
      const llmNode = createNode('llm', 'node2')

      const result = isValidConnection(sttNode, llmNode, [sttNode, llmNode], [])

      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should accept LLM to TTS connection', () => {
      const llmNode = createNode('llm', 'node1')
      const ttsNode = createNode('tts', 'node2')

      const result = isValidConnection(llmNode, ttsNode, [llmNode, ttsNode], [])

      expect(result.valid).toBe(true)
    })

    it('should accept STT to Filter connection', () => {
      const sttNode = createNode('stt', 'node1')
      const filterNode = createNode('filter', 'node2')

      const result = isValidConnection(sttNode, filterNode, [sttNode, filterNode], [])

      expect(result.valid).toBe(true)
    })

    it('should accept Filter to LLM connection', () => {
      const filterNode = createNode('filter', 'node1')
      const llmNode = createNode('llm', 'node2')

      const result = isValidConnection(filterNode, llmNode, [filterNode, llmNode], [])

      expect(result.valid).toBe(true)
    })

    it('should reject STT to TTS direct connection', () => {
      const sttNode = createNode('stt', 'node1')
      const ttsNode = createNode('tts', 'node2')

      const result = isValidConnection(sttNode, ttsNode, [sttNode, ttsNode], [])

      expect(result.valid).toBe(false)
      expect(result.error).toContain('cannot connect')
    })

    it('should reject TTS to any connection (terminal node)', () => {
      const ttsNode = createNode('tts', 'node1')
      const llmNode = createNode('llm', 'node2')

      const result = isValidConnection(ttsNode, llmNode, [ttsNode, llmNode], [])

      expect(result.valid).toBe(false)
      expect(result.error).toContain('Valid connections: none')
    })

    it('should reject backwards LLM to STT connection', () => {
      const llmNode = createNode('llm', 'node1')
      const sttNode = createNode('stt', 'node2')

      const result = isValidConnection(llmNode, sttNode, [llmNode, sttNode], [])

      expect(result.valid).toBe(false)
      expect(result.error).toContain('cannot connect')
    })
  })

  describe('Rule 4: Circular Dependencies', () => {
    it('should detect simple circular dependency', () => {
      const stt = createNode('stt', 'stt1')
      const llm = createNode('llm', 'llm1')
      const tts = createNode('tts', 'tts1')

      const edges: Edge[] = [
        { id: 'e1', source: 'stt1', target: 'llm1' },
        { id: 'e2', source: 'llm1', target: 'tts1' }
      ]

      // Try to connect TTS back to STT (creating cycle via filter)
      const filter = createNode('filter', 'filter1')
      edges.push({ id: 'e3', source: 'tts1', target: 'filter1' })

      const result = isValidConnection(filter, stt, [stt, llm, tts, filter], edges)

      expect(result.valid).toBe(false)
      expect(result.error).toContain('circular')
    })

    it('should allow linear chain without cycles', () => {
      const stt = createNode('stt', 'stt1')
      const filter = createNode('filter', 'filter1')
      const llm = createNode('llm', 'llm1')

      const edges: Edge[] = [
        { id: 'e1', source: 'stt1', target: 'filter1' }
      ]

      const result = isValidConnection(filter, llm, [stt, filter, llm], edges)

      expect(result.valid).toBe(true)
    })
  })

  describe('Rule 5: Duplicate Connections', () => {
    it('should reject duplicate connection', () => {
      const sttNode = createNode('stt', 'node1')
      const llmNode = createNode('llm', 'node2')

      const existingEdges: Edge[] = [
        { id: 'e1', source: 'node1', target: 'node2' }
      ]

      const result = isValidConnection(sttNode, llmNode, [sttNode, llmNode], existingEdges)

      expect(result.valid).toBe(false)
      expect(result.error).toContain('already exists')
    })

    it('should allow same nodes with different direction (if valid)', () => {
      const filterNode = createNode('filter', 'node1')
      const llmNode = createNode('llm', 'node2')

      const existingEdges: Edge[] = [
        { id: 'e1', source: 'node2', target: 'node1' }
      ]

      const result = isValidConnection(filterNode, llmNode, [filterNode, llmNode], existingEdges)

      expect(result.valid).toBe(true)
    })
  })

  describe('Complex Pipeline Scenarios', () => {
    it('should validate traditional STT → LLM → TTS pipeline', () => {
      const stt = createNode('stt', 'stt1')
      const llm = createNode('llm', 'llm1')
      const tts = createNode('tts', 'tts1')

      // First connection: STT → LLM
      const result1 = isValidConnection(stt, llm, [stt, llm, tts], [])
      expect(result1.valid).toBe(true)

      // Second connection: LLM → TTS
      const edges: Edge[] = [{ id: 'e1', source: 'stt1', target: 'llm1' }]
      const result2 = isValidConnection(llm, tts, [stt, llm, tts], edges)
      expect(result2.valid).toBe(true)
    })

    it('should validate enhanced pipeline with filters', () => {
      const stt = createNode('stt', 'stt1')
      const filter1 = createNode('filter', 'filter1')
      const llm = createNode('llm', 'llm1')
      const filter2 = createNode('filter', 'filter2')
      const tts = createNode('tts', 'tts1')

      const nodes = [stt, filter1, llm, filter2, tts]

      // STT → Filter
      const r1 = isValidConnection(stt, filter1, nodes, [])
      expect(r1.valid).toBe(true)

      // Filter → LLM
      const edges1 = [{ id: 'e1', source: 'stt1', target: 'filter1' }]
      const r2 = isValidConnection(filter1, llm, nodes, edges1)
      expect(r2.valid).toBe(true)

      // LLM → Filter
      const edges2 = [...edges1, { id: 'e2', source: 'filter1', target: 'llm1' }]
      const r3 = isValidConnection(llm, filter2, nodes, edges2)
      expect(r3.valid).toBe(true)

      // Filter → TTS
      const edges3 = [...edges2, { id: 'e3', source: 'llm1', target: 'filter2' }]
      const r4 = isValidConnection(filter2, tts, nodes, edges3)
      expect(r4.valid).toBe(true)
    })

    it('should validate aggregator insertion', () => {
      const stt = createNode('stt', 'stt1')
      const aggregator = createNode('aggregator', 'agg1')
      const llm = createNode('llm', 'llm1')

      // STT → Aggregator
      const r1 = isValidConnection(stt, aggregator, [stt, aggregator, llm], [])
      expect(r1.valid).toBe(true)

      // Aggregator → LLM
      const edges = [{ id: 'e1', source: 'stt1', target: 'agg1' }]
      const r2 = isValidConnection(aggregator, llm, [stt, aggregator, llm], edges)
      expect(r2.valid).toBe(true)
    })
  })

  describe('Edge Cases', () => {
    it('should handle missing nodes gracefully', () => {
      const sttNode = createNode('stt', 'node1')
      const llmNode = createNode('llm', 'node2')

      // Connection validation should still work with empty node list
      const result = isValidConnection(sttNode, llmNode, [], [])
      expect(result.valid).toBe(true)
    })

    it('should handle empty edges list', () => {
      const sttNode = createNode('stt', 'node1')
      const llmNode = createNode('llm', 'node2')

      const result = isValidConnection(sttNode, llmNode, [sttNode, llmNode], [])
      expect(result.valid).toBe(true)
    })
  })
})

describe('Connection Validation Messages', () => {
  it('should provide helpful error message for same-type connections', () => {
    const sttNode1 = createNode('stt', 'node1')
    const sttNode2 = createNode('stt', 'node2')

    const result = isValidConnection(sttNode1, sttNode2, [], [])

    expect(result.error).toBeDefined()
    expect(result.error).toContain('STT')
    expect(result.error?.toLowerCase()).toContain('same node types')
  })

  it('should provide helpful error message for realtime isolation', () => {
    const realtimeNode = createNode('realtime', 'node1')
    const llmNode = createNode('llm', 'node2')

    const result = isValidConnection(realtimeNode, llmNode, [], [])

    expect(result.error).toBeDefined()
    expect(result.error?.toLowerCase()).toContain('realtime')
    expect(result.error?.toLowerCase()).toContain('independently')
  })

  it('should provide helpful error message for invalid mappings', () => {
    const sttNode = createNode('stt', 'node1')
    const ttsNode = createNode('tts', 'node2')

    const result = isValidConnection(sttNode, ttsNode, [], [])

    expect(result.error).toBeDefined()
    expect(result.error).toContain('cannot connect')
    expect(result.error).toContain('Valid connections')
  })

  it('should provide helpful error message for circular dependencies', () => {
    const stt = createNode('stt', 'stt1')
    const llm = createNode('llm', 'llm1')
    const filter = createNode('filter', 'filter1')

    const edges: Edge[] = [
      { id: 'e1', source: 'stt1', target: 'llm1' },
      { id: 'e2', source: 'llm1', target: 'filter1' }
    ]

    const result = isValidConnection(filter, stt, [stt, llm, filter], edges)

    expect(result.error).toBeDefined()
    expect(result.error?.toLowerCase()).toContain('circular')
  })

  it('should provide helpful error message for duplicate connections', () => {
    const sttNode = createNode('stt', 'node1')
    const llmNode = createNode('llm', 'node2')

    const edges: Edge[] = [
      { id: 'e1', source: 'node1', target: 'node2' }
    ]

    const result = isValidConnection(sttNode, llmNode, [], edges)

    expect(result.error).toBeDefined()
    expect(result.error?.toLowerCase()).toContain('already exists')
  })
})

// ============================================================
// PHASE 2: Pipeline Detailed Validation Tests
// ============================================================

describe('Pipeline Detailed Validation (Phase 2)', () => {
  describe('Empty Pipeline', () => {
    it('should return error for empty pipeline', () => {
      const result = validatePipelineDetailed([], [])

      expect(result.valid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0]).toContain('Pipeline is empty')
      expect(result.suggestions).toHaveLength(1)
      expect(result.suggestions[0]).toContain('STT node')
    })
  })

  describe('Realtime Pipeline Validation', () => {
    it('should validate single realtime node as valid', () => {
      const realtimeNode = createConfiguredNode('realtime', 'rt1', 'openai-realtime')
      const result = validatePipelineDetailed([realtimeNode], [])

      expect(result.valid).toBe(true)
      expect(result.type).toBe('realtime')
      expect(result.errors).toHaveLength(0)
    })

    it('should reject multiple realtime nodes', () => {
      const realtime1 = createConfiguredNode('realtime', 'rt1', 'openai-realtime')
      const realtime2 = createConfiguredNode('realtime', 'rt2', 'gemini-live')
      const result = validatePipelineDetailed([realtime1, realtime2], [])

      expect(result.valid).toBe(false)
      expect(result.type).toBe('realtime')
      expect(result.errors.some(e => e.includes('Only one realtime'))).toBe(true)
      expect(result.suggestions.some(s => s.includes('Remove extra'))).toBe(true)
    })

    it('should reject realtime with STT/LLM/TTS nodes', () => {
      const realtime = createConfiguredNode('realtime', 'rt1', 'openai-realtime')
      const stt = createNode('stt', 'stt1')
      const llm = createNode('llm', 'llm1')
      const tts = createNode('tts', 'tts1')

      const result = validatePipelineDetailed([realtime, stt, llm, tts], [])

      expect(result.valid).toBe(false)
      expect(result.type).toBe('realtime')
      expect(result.errors.some(e => e.includes('cannot include STT'))).toBe(true)
      expect(result.suggestions.some(s => s.includes('Remove all STT/LLM/TTS'))).toBe(true)
    })

    it('should reject realtime with connections', () => {
      const realtime = createConfiguredNode('realtime', 'rt1', 'openai-realtime')
      const llm = createNode('llm', 'llm1')
      const edges: Edge[] = [{ id: 'e1', source: 'rt1', target: 'llm1' }]

      const result = validatePipelineDetailed([realtime, llm], edges)

      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('cannot be connected'))).toBe(true)
    })

    it('should require realtime node configuration', () => {
      const realtime = createNode('realtime', 'rt1') // Not configured
      realtime.data.isConfigured = false

      const result = validatePipelineDetailed([realtime], [])

      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('requires configuration'))).toBe(true)
    })
  })

  describe('Traditional Pipeline Validation', () => {
    it('should validate complete STT → LLM → TTS pipeline', () => {
      const stt = createConfiguredNode('stt', 'stt1', 'deepgram')
      const llm = createConfiguredNode('llm', 'llm1', 'openai')
      const tts = createConfiguredNode('tts', 'tts1', 'elevenlabs')

      const edges: Edge[] = [
        { id: 'e1', source: 'stt1', target: 'llm1' },
        { id: 'e2', source: 'llm1', target: 'tts1' }
      ]

      const result = validatePipelineDetailed([stt, llm, tts], edges)

      expect(result.valid).toBe(true)
      expect(result.type).toBe('traditional')
      expect(result.errors).toHaveLength(0)
    })

    it('should reject pipeline missing STT node', () => {
      const llm = createNode('llm', 'llm1')
      const tts = createNode('tts', 'tts1')

      const result = validatePipelineDetailed([llm, tts], [])

      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('Missing STT'))).toBe(true)
      expect(result.suggestions.some(s => s.toLowerCase().includes('add an stt'))).toBe(true)
    })

    it('should reject pipeline missing LLM node', () => {
      const stt = createNode('stt', 'stt1')
      const tts = createNode('tts', 'tts1')

      const result = validatePipelineDetailed([stt, tts], [])

      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('Missing LLM'))).toBe(true)
      expect(result.suggestions.some(s => s.toLowerCase().includes('add an llm'))).toBe(true)
    })

    it('should reject pipeline missing TTS node', () => {
      const stt = createNode('stt', 'stt1')
      const llm = createNode('llm', 'llm1')

      const result = validatePipelineDetailed([stt, llm], [])

      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('Missing TTS'))).toBe(true)
      expect(result.suggestions.some(s => s.toLowerCase().includes('add a tts'))).toBe(true)
    })

    it('should warn about duplicate STT nodes', () => {
      const stt1 = createNode('stt', 'stt1')
      const stt2 = createNode('stt', 'stt2')
      const llm = createNode('llm', 'llm1')
      const tts = createNode('tts', 'tts1')

      const edges: Edge[] = [
        { id: 'e1', source: 'stt1', target: 'llm1' },
        { id: 'e2', source: 'llm1', target: 'tts1' }
      ]

      const result = validatePipelineDetailed([stt1, stt2, llm, tts], edges)

      expect(result.warnings.some(w => w.includes('2 STT nodes'))).toBe(true)
      expect(result.suggestions.some(s => s.includes('removing duplicate'))).toBe(true)
    })

    it('should reject disconnected nodes', () => {
      const stt = createNode('stt', 'stt1')
      const llm = createNode('llm', 'llm1')
      const tts = createNode('tts', 'tts1')

      const result = validatePipelineDetailed([stt, llm, tts], [])

      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('not connected'))).toBe(true)
      expect(result.suggestions.some(s => s.includes('STT → LLM → TTS'))).toBe(true)
    })

    it('should reject pipeline missing STT → LLM connection', () => {
      const stt = createNode('stt', 'stt1')
      const llm = createNode('llm', 'llm1')
      const tts = createNode('tts', 'tts1')

      const edges: Edge[] = [
        { id: 'e1', source: 'llm1', target: 'tts1' }
      ]

      const result = validatePipelineDetailed([stt, llm, tts], edges)

      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('STT node must connect to LLM'))).toBe(true)
    })

    it('should reject pipeline missing LLM → TTS connection', () => {
      const stt = createNode('stt', 'stt1')
      const llm = createNode('llm', 'llm1')
      const tts = createNode('tts', 'tts1')

      const edges: Edge[] = [
        { id: 'e1', source: 'stt1', target: 'llm1' }
      ]

      const result = validatePipelineDetailed([stt, llm, tts], edges)

      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('LLM node must connect to TTS'))).toBe(true)
    })

    it('should detect isolated nodes', () => {
      const stt = createNode('stt', 'stt1')
      const llm = createNode('llm', 'llm1')
      const tts = createNode('tts', 'tts1')
      const filter = createNode('filter', 'filter1')

      const edges: Edge[] = [
        { id: 'e1', source: 'stt1', target: 'llm1' },
        { id: 'e2', source: 'llm1', target: 'tts1' }
      ]

      const result = validatePipelineDetailed([stt, llm, tts, filter], edges)

      expect(result.warnings.some(w => w.includes('1 node(s) are not connected'))).toBe(true)
      expect(result.suggestions.some(s => s.includes('Connect or remove isolated'))).toBe(true)
    })

    it('should reject pipeline with unconfigured core nodes', () => {
      const stt = createNode('stt', 'stt1')
      const llm = createNode('llm', 'llm1')
      const tts = createNode('tts', 'tts1')

      stt.data.isConfigured = false
      llm.data.isConfigured = false

      const edges: Edge[] = [
        { id: 'e1', source: 'stt1', target: 'llm1' },
        { id: 'e2', source: 'llm1', target: 'tts1' }
      ]

      const result = validatePipelineDetailed([stt, llm, tts], edges)

      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('2 core node(s) require configuration'))).toBe(true)
      expect(result.suggestions.some(s => s.includes('Click each unconfigured node'))).toBe(true)
    })

    it('should warn about unconfigured helper nodes but allow pipeline', () => {
      const stt = createConfiguredNode('stt', 'stt1', 'deepgram')
      const filter = createNode('filter', 'filter1')
      const llm = createConfiguredNode('llm', 'llm1', 'openai')
      const tts = createConfiguredNode('tts', 'tts1', 'elevenlabs')

      filter.data.isConfigured = false

      const edges: Edge[] = [
        { id: 'e1', source: 'stt1', target: 'filter1' },
        { id: 'e2', source: 'filter1', target: 'llm1' },
        { id: 'e3', source: 'llm1', target: 'tts1' }
      ]

      const result = validatePipelineDetailed([stt, filter, llm, tts], edges)

      expect(result.valid).toBe(true) // Valid despite unconfigured helper
      expect(result.warnings.some(w => w.includes('1 helper node(s) need configuration'))).toBe(true)
    })

    it('should detect circular connections', () => {
      const stt = createNode('stt', 'stt1')
      const llm = createNode('llm', 'llm1')
      const filter = createNode('filter', 'filter1')

      const edges: Edge[] = [
        { id: 'e1', source: 'stt1', target: 'llm1' },
        { id: 'e2', source: 'llm1', target: 'filter1' },
        { id: 'e3', source: 'filter1', target: 'stt1' } // Creates cycle
      ]

      const result = validatePipelineDetailed([stt, llm, filter], edges)

      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('circular connections'))).toBe(true)
      expect(result.suggestions.some(s => s.includes('Remove connections that create loops'))).toBe(true)
    })
  })

  describe('Enhanced Pipeline Validation', () => {
    it('should validate pipeline with filters', () => {
      const stt = createConfiguredNode('stt', 'stt1', 'deepgram')
      const filter1 = createConfiguredNode('filter', 'filter1', 'wake-word')
      const llm = createConfiguredNode('llm', 'llm1', 'openai')
      const filter2 = createConfiguredNode('filter', 'filter2', 'profanity')
      const tts = createConfiguredNode('tts', 'tts1', 'elevenlabs')

      const edges: Edge[] = [
        { id: 'e1', source: 'stt1', target: 'filter1' },
        { id: 'e2', source: 'filter1', target: 'llm1' },
        { id: 'e3', source: 'llm1', target: 'filter2' },
        { id: 'e4', source: 'filter2', target: 'tts1' }
      ]

      const result = validatePipelineDetailed([stt, filter1, llm, filter2, tts], edges)

      expect(result.valid).toBe(true)
      expect(result.type).toBe('traditional')
      expect(result.warnings.some(w => w.includes('2 filter(s)'))).toBe(true)
    })

    it('should validate pipeline with aggregators', () => {
      const stt = createConfiguredNode('stt', 'stt1', 'deepgram')
      const agg = createConfiguredNode('aggregator', 'agg1', 'context')
      const llm = createConfiguredNode('llm', 'llm1', 'openai')
      const tts = createConfiguredNode('tts', 'tts1', 'elevenlabs')

      const edges: Edge[] = [
        { id: 'e1', source: 'stt1', target: 'agg1' },
        { id: 'e2', source: 'agg1', target: 'llm1' },
        { id: 'e3', source: 'llm1', target: 'tts1' }
      ]

      const result = validatePipelineDetailed([stt, agg, llm, tts], edges)

      expect(result.valid).toBe(true)
      expect(result.warnings.some(w => w.includes('1 aggregator(s)'))).toBe(true)
    })
  })

  describe('Validation Result Structure', () => {
    it('should include all required fields in validation result', () => {
      const stt = createNode('stt', 'stt1')
      const result = validatePipelineDetailed([stt], [])

      expect(result).toHaveProperty('valid')
      expect(result).toHaveProperty('type')
      expect(result).toHaveProperty('errors')
      expect(result).toHaveProperty('warnings')
      expect(result).toHaveProperty('suggestions')
      expect(Array.isArray(result.errors)).toBe(true)
      expect(Array.isArray(result.warnings)).toBe(true)
      expect(Array.isArray(result.suggestions)).toBe(true)
    })

    it('should return empty arrays when pipeline is valid', () => {
      const realtime = createConfiguredNode('realtime', 'rt1', 'openai-realtime')
      const result = validatePipelineDetailed([realtime], [])

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.warnings).toHaveLength(0)
    })

    it('should provide multiple errors for invalid pipeline', () => {
      const stt = createNode('stt', 'stt1')
      const result = validatePipelineDetailed([stt], [])

      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(1)
      expect(result.suggestions.length).toBeGreaterThan(0)
    })
  })
})
