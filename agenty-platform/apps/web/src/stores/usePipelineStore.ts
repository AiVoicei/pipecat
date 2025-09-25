import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { Node, Edge, Connection, addEdge, applyNodeChanges, applyEdgeChanges, NodeChange, EdgeChange } from 'reactflow'

// Pipeline node types
export type PipelineNodeType = 'stt' | 'llm' | 'tts' | 'realtime' | 'filter' | 'aggregator' | 'custom'

// Node data structure
export interface PipelineNodeData {
  label: string
  type: PipelineNodeType
  provider?: string
  configuration?: Record<string, string | number | boolean>
  isConfigured?: boolean
}

// Pipeline node
export interface PipelineNode extends Node {
  data: PipelineNodeData
}

// Pipeline configuration
export interface PipelineConfig {
  id: string
  name: string
  description: string
  nodes: PipelineNode[]
  edges: Edge[]
  isValid: boolean
  createdAt: string
  updatedAt: string
}

interface PipelineStore {
  // Current pipeline state
  nodes: PipelineNode[]
  edges: Edge[]
  selectedNode: PipelineNode | null

  // Pipeline management
  pipelines: PipelineConfig[]
  currentPipeline: PipelineConfig | null
  isLoading: boolean
  error: string | null

  // Actions
  setNodes: (nodes: PipelineNode[]) => void
  setEdges: (edges: Edge[]) => void
  onNodesChange: (changes: NodeChange[]) => void
  onEdgesChange: (changes: EdgeChange[]) => void
  onConnect: (connection: Connection) => void

  // Node management
  addNode: (type: PipelineNodeType, position: { x: number; y: number }) => PipelineNode
  removeNode: (nodeId: string) => void
  updateNode: (nodeId: string, data: Partial<PipelineNodeData>) => void
  selectNode: (node: PipelineNode | null) => void

  // Pipeline management
  createPipeline: (name: string, description: string) => void
  loadPipeline: (pipelineId: string) => void
  savePipeline: () => void
  deletePipeline: (pipelineId: string) => void
  validatePipeline: () => boolean
  exportPipeline: () => string
  importPipeline: (configJson: string) => void

  // Utility functions
  resetPipeline: () => void
  setError: (error: string | null) => void
}

// Default node templates
const nodeTemplates: Record<PipelineNodeType, Partial<PipelineNodeData>> = {
  stt: {
    label: 'Speech to Text',
    type: 'stt',
    isConfigured: false
  },
  llm: {
    label: 'Language Model',
    type: 'llm',
    isConfigured: false
  },
  tts: {
    label: 'Text to Speech',
    type: 'tts',
    isConfigured: false
  },
  realtime: {
    label: 'Realtime Speech',
    type: 'realtime',
    isConfigured: false
  },
  filter: {
    label: 'Filter',
    type: 'filter',
    isConfigured: false
  },
  aggregator: {
    label: 'Aggregator',
    type: 'aggregator',
    isConfigured: false
  },
  custom: {
    label: 'Custom Function',
    type: 'custom',
    isConfigured: false
  }
}

// Generate unique ID
const generateId = () => Math.random().toString(36).substr(2, 9)

export const usePipelineStore = create<PipelineStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      nodes: [],
      edges: [],
      selectedNode: null,
      pipelines: [],
      currentPipeline: null,
      isLoading: false,
      error: null,

      // Node and edge management
      setNodes: (nodes) => set({ nodes }),
      setEdges: (edges) => set({ edges }),

      onNodesChange: (changes) => {
        set({
          nodes: applyNodeChanges(changes, get().nodes)
        })
      },

      onEdgesChange: (changes) => {
        set({
          edges: applyEdgeChanges(changes, get().edges)
        })
      },

      onConnect: (connection) => {
        set({
          edges: addEdge(connection, get().edges)
        })
      },

      // Node management
      addNode: (type, position) => {
        const newNode: PipelineNode = {
          id: generateId(),
          type: 'default',
          position,
          data: {
            ...nodeTemplates[type],
            label: `${nodeTemplates[type].label} ${get().nodes.filter(n => n.data.type === type).length + 1}`
          } as PipelineNodeData
        }

        set({
          nodes: [...get().nodes, newNode]
        })

        return newNode
      },

      removeNode: (nodeId) => {
        set({
          nodes: get().nodes.filter(node => node.id !== nodeId),
          edges: get().edges.filter(edge => edge.source !== nodeId && edge.target !== nodeId),
          selectedNode: get().selectedNode?.id === nodeId ? null : get().selectedNode
        })
      },

      updateNode: (nodeId, data) => {
        set({
          nodes: get().nodes.map(node =>
            node.id === nodeId
              ? { ...node, data: { ...node.data, ...data } }
              : node
          )
        })
      },

      selectNode: (node) => set({ selectedNode: node }),

      // Pipeline management
      createPipeline: (name, description) => {
        const newPipeline: PipelineConfig = {
          id: generateId(),
          name,
          description,
          nodes: [],
          edges: [],
          isValid: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }

        set({
          pipelines: [...get().pipelines, newPipeline],
          currentPipeline: newPipeline,
          nodes: [],
          edges: [],
          selectedNode: null
        })
      },

      loadPipeline: (pipelineId) => {
        const pipeline = get().pipelines.find(p => p.id === pipelineId)
        if (pipeline) {
          set({
            currentPipeline: pipeline,
            nodes: pipeline.nodes,
            edges: pipeline.edges,
            selectedNode: null
          })
        }
      },

      savePipeline: () => {
        const { currentPipeline, nodes, edges } = get()
        if (currentPipeline) {
          const updatedPipeline = {
            ...currentPipeline,
            nodes,
            edges,
            isValid: get().validatePipeline(),
            updatedAt: new Date().toISOString()
          }

          set({
            pipelines: get().pipelines.map(p =>
              p.id === currentPipeline.id ? updatedPipeline : p
            ),
            currentPipeline: updatedPipeline
          })
        }
      },

      deletePipeline: (pipelineId) => {
        set({
          pipelines: get().pipelines.filter(p => p.id !== pipelineId),
          currentPipeline: get().currentPipeline?.id === pipelineId ? null : get().currentPipeline
        })
      },

      validatePipeline: () => {
        const { nodes, edges } = get()

        // Basic validation rules
        if (nodes.length === 0) return false

        const nodeTypes = nodes.map(n => n.data.type)
        const hasRealtime = nodeTypes.includes('realtime')

        if (hasRealtime) {
          // For realtime pipelines, we just need the realtime node
          return nodes.length >= 1
        } else {
          // Check for required node types (at least STT, LLM, TTS)
          const hasSTT = nodeTypes.includes('stt')
          const hasLLM = nodeTypes.includes('llm')
          const hasTTS = nodeTypes.includes('tts')

          if (!hasSTT || !hasLLM || !hasTTS) return false

          // Check for proper connections (simplified)
          if (nodes.length > 1 && edges.length === 0) return false
        }

        return true
      },

      exportPipeline: () => {
        const { currentPipeline, nodes, edges } = get()
        return JSON.stringify({
          pipeline: currentPipeline,
          nodes,
          edges
        }, null, 2)
      },

      importPipeline: (configJson) => {
        try {
          const config = JSON.parse(configJson)
          if (config.pipeline && config.nodes && config.edges) {
            set({
              currentPipeline: config.pipeline,
              nodes: config.nodes,
              edges: config.edges,
              selectedNode: null
            })
          }
        } catch (error) {
          set({ error: 'Invalid pipeline configuration' })
        }
      },

      // Utility functions
      resetPipeline: () => {
        set({
          nodes: [],
          edges: [],
          selectedNode: null,
          currentPipeline: null
        })
      },

      setError: (error) => set({ error })
    }),
    {
      name: 'pipeline-store'
    }
  )
)