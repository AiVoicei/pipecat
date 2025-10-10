'use client'

import React, { useCallback, useRef, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
  Node,
  Edge,
  NodeTypes,
  EdgeTypes,
  ConnectionMode,
  Panel,
  ReactFlowInstance,
  useReactFlow,
  useNodesState,
  useEdgesState,
  addEdge,
  type OnConnect
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { motion, AnimatePresence } from 'framer-motion'

// Turbo Flow Components
import TurboNode, { type TurboNodeData } from './TurboNode'
import TurboEdge from './TurboEdge'
import FunctionIcon from './FunctionIcon'

// Removed DnD Kit import - using native HTML5 drag and drop
import { usePipelineStore, validatePipelineDetailed } from '@/stores/usePipelineStore'
import { PipelineToolbar } from './PipelineToolbar'
import { PipelineNode } from './PipelineNode'
import { PipelineNodeConfigDialog } from './PipelineNodeConfigDialog'
import { PipelineValidationPanel } from './PipelineValidationPanel'
import { PipelineTemplateSelector } from './PipelineTemplateSelector'
import { SmartSuggestionsPanel } from './SmartSuggestionsPanel'
import { PipelineBuilderHelp } from './PipelineBuilderHelp'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Save, Play, Pause, Download, Upload, Trash2, CheckCircle, AlertCircle, Activity, Zap, Undo2, Bot } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { toast } from 'sonner'
import { convertPipelineToAgentConfig, validatePipelineForBackend, generatePipelineSummary } from '@/utils/pipelineConverter'
import { useAgentStore } from '@/stores/useAgentStore'

// Animated Edge Component
const AnimatedEdge = ({ id, sourceX, sourceY, targetX, targetY, style = {}, markerEnd, ...props }: any) => {
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(prev => !prev)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  const edgePath = `M${sourceX},${sourceY} L${targetX},${targetY}`

  return (
    <g>
      <path
        id={id}
        style={style}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={markerEnd}
        fill="none"
        stroke="#6B7280"
        strokeWidth={2}
      />
      <AnimatePresence>
        {isAnimating && (
          <motion.circle
            initial={{ opacity: 0 }}
            animate={{
              opacity: [0, 1, 0],
              offsetDistance: ["0%", "100%"]
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            r="4"
            fill="#8B5CF6"
          >
            <animateMotion dur="1.5s" repeatCount="1">
              <mpath href={`#${id}`} />
            </animateMotion>
          </motion.circle>
        )}
      </AnimatePresence>
    </g>
  )
}

// Custom node and edge types - Turbo Flow Style
const nodeTypes = {
  default: TurboNode,
  turbo: TurboNode,
  stt: TurboNode,
  llm: TurboNode,
  tts: TurboNode,
  filter: TurboNode,
  aggregator: TurboNode,
  custom: TurboNode,
  // Keep original for compatibility
  pipeline: PipelineNode
} as const

const edgeTypes = {
  turbo: TurboEdge,
  animated: AnimatedEdge
} as const

// Default edge options for Turbo Flow style
const defaultEdgeOptions = {
  type: 'turbo',
  markerEnd: 'turbo-marker',
}

interface PipelineBuilderProps {
  agentId?: string
  readonly?: boolean
  hideActions?: boolean // Hide Save and Reset buttons when embedded in agent builder
  selectedProviders?: {
    stt?: string
    llm?: string
    tts?: string
    realtime?: string
  }
}


/**
 * Render an interactive pipeline builder UI with canvas, toolbar, node/edge controls, and simulation features.
 *
 * The component provides drag-and-drop node creation, node selection and configuration, pipeline validation,
 * save/export/reset actions, and an optional simulation mode that surfaces runtime metrics and animated edges.
 *
 * @param agentId - Optional identifier for the current agent, used for contextual naming or persistence.
 * @param readonly - When true, hides editing controls and prevents creating or modifying nodes and connections.
 * @param hideActions - When true, hides Save and Reset buttons (useful when embedded in agent builder).
 * @param selectedProviders - Optional object describing initial providers to auto-populate the canvas.
 *   Expected keys include `stt`, `llm`, `tts`, and `realtime`; presence of these values determines the
 *   initial node(s) and automatic connections created on first render.
 * @returns The PipelineBuilder React element
 */
export function PipelineBuilder({ agentId, readonly = false, hideActions = false, selectedProviders }: PipelineBuilderProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const { createAgent } = useAgentStore()
  const [isSavingAgent, setIsSavingAgent] = useState(false)

  // Pipeline simulation state
  const [isSimulating, setIsSimulating] = useState(false)
  const [simulationSpeed, setSimulationSpeed] = useState(1)
  const [showMetrics, setShowMetrics] = useState(false)

  // Node configuration dialog state
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false)

  // Undo/Redo history
  const [history, setHistory] = useState<Array<{ nodes: PipelineNode[], edges: Edge[] }>>([])
  const [historyIndex, setHistoryIndex] = useState(-1)

  const {
    nodes,
    edges,
    selectedNode,
    currentPipeline,
    error,
    addNode,
    removeNode,
    onNodesChange,
    onEdgesChange,
    onConnect,
    selectNode,
    savePipeline,
    validatePipeline,
    exportPipeline,
    resetPipeline,
  } = usePipelineStore()

  // Save state to history whenever nodes or edges change
  useEffect(() => {
    const saveToHistory = () => {
      const newHistory = history.slice(0, historyIndex + 1)
      newHistory.push({ nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)) })

      // Keep only last 50 states
      if (newHistory.length > 50) {
        newHistory.shift()
      } else {
        setHistoryIndex(historyIndex + 1)
      }

      setHistory(newHistory)
    }

    // Debounce to avoid saving too frequently
    const timeout = setTimeout(saveToHistory, 300)
    return () => clearTimeout(timeout)
  }, [nodes, edges])

  // Undo function
  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1
      const previousState = history[newIndex]

      usePipelineStore.setState({
        nodes: previousState.nodes,
        edges: previousState.edges
      })

      setHistoryIndex(newIndex)
      toast.success('Undone', { duration: 1500 })
    }
  }

  // Show toast when connection validation fails
  useEffect(() => {
    if (error) {
      // Parse error message (remove timestamp if present)
      const errorMessage = error.includes('|') ? error.split('|')[0] : error

      toast.error('Invalid Connection', {
        description: errorMessage,
        duration: 4000,
        style: {
          background: '#991b1b',
          color: '#ffffff',
          border: '1px solid #dc2626',
        },
        className: 'border-red-600',
      })
    }
  }, [error])

  // Keyboard shortcuts handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Delete key - remove selected nodes or edges
      if (e.key === 'Delete') {
        const selectedNodes = nodes.filter(n => n.selected)
        const selectedEdges = edges.filter(e => e.selected)

        if (selectedNodes.length > 0) {
          selectedNodes.forEach(node => removeNode(node.id))
          selectNode(null)
          toast.success(`Deleted ${selectedNodes.length} node${selectedNodes.length > 1 ? 's' : ''}`, { duration: 2000 })
        } else if (selectedEdges.length > 0) {
          const newEdges = edges.filter(e => !e.selected)
          onEdgesChange([{ type: 'remove', id: selectedEdges[0].id }])
          toast.success(`Deleted ${selectedEdges.length} connection${selectedEdges.length > 1 ? 's' : ''}`, { duration: 2000 })
        } else if (selectedNode) {
          removeNode(selectedNode.id)
          selectNode(null)
          toast.success('Node deleted', { duration: 2000 })
        }
      }

      // Escape - deselect node
      if (e.key === 'Escape') {
        selectNode(null)
      }

      // Ctrl/Cmd + S - Save pipeline
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        handleSave()
        toast.success('Pipeline saved', { duration: 2000 })
      }

      // Ctrl/Cmd + Z - Undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        handleUndo()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedNode, removeNode, selectNode, nodes, edges, onEdgesChange, handleUndo])

  // Handle native drag and drop
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
    console.log('Drag over canvas') // Debug log
  }, [])

  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    console.log('Drop event triggered') // Debug log

    const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect()
    const nodeType = event.dataTransfer.getData('application/reactflow')

    console.log('Node type:', nodeType, 'Bounds:', reactFlowBounds) // Debug log

    if (reactFlowBounds && nodeType) {
      // Calculate position relative to the canvas
      const position = {
        x: event.clientX - reactFlowBounds.left - 100,
        y: event.clientY - reactFlowBounds.top - 50,
      }

      console.log('Adding node at position:', position) // Debug log
      addNode(nodeType as any, position)
    } else {
      console.warn('Missing requirements for drop:', { reactFlowBounds: !!reactFlowBounds, nodeType })
    }
  }, [addNode])

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    selectNode(node as any)
    setIsConfigDialogOpen(true)
  }, [selectNode])

  const onPaneClick = useCallback(() => {
    selectNode(null)
  }, [selectNode])

  // Pre-populate pipeline with selected providers - use ref to track initialization
  const initializedProvidersRef = useRef<string>('')

  useEffect(() => {
    // Only initialize when selectedProviders change AND we haven't initialized this combo yet
    if (selectedProviders) {
      const { stt, llm, tts, realtime } = selectedProviders
      const providersKey = `${realtime || ''}-${stt || ''}-${llm || ''}-${tts || ''}`

      // Skip if we've already initialized with these exact providers
      if (initializedProvidersRef.current === providersKey) {
        return
      }

      // Clear any existing nodes first
      resetPipeline()

      if (realtime) {
        // For realtime providers, create a single node
        addNode('realtime', { x: 300, y: 200 })
        initializedProvidersRef.current = providersKey
      } else if (stt && llm && tts) {
        // For traditional pipeline, create STT -> LLM -> TTS chain
        const sttNode = addNode('stt', { x: 100, y: 200 })
        const llmNode = addNode('llm', { x: 350, y: 200 })
        const ttsNode = addNode('tts', { x: 600, y: 200 })

        // Auto-connect the nodes with a slight delay to ensure nodes are rendered
        setTimeout(() => {
          onConnect({
            source: sttNode.id,
            target: llmNode.id,
            sourceHandle: null,
            targetHandle: null
          })
          onConnect({
            source: llmNode.id,
            target: ttsNode.id,
            sourceHandle: null,
            targetHandle: null
          })
        }, 200)
        initializedProvidersRef.current = providersKey
      }
    }
  }, [selectedProviders?.stt, selectedProviders?.llm, selectedProviders?.tts, selectedProviders?.realtime, addNode, onConnect, resetPipeline])

  const handleSave = () => {
    savePipeline()
  }

  const handleSaveAsAgent = async () => {
    const currentNodes = nodes
    const currentEdges = edges

    // Validate pipeline structure
    const pipelineValidation = validatePipelineDetailed(currentNodes, currentEdges)
    if (!pipelineValidation.valid) {
      toast.error('Pipeline Validation Failed', {
        description: pipelineValidation.errors.join(', ')
      })
      return
    }

    // Validate backend readiness
    const backendValidation = validatePipelineForBackend(currentNodes)
    if (!backendValidation.valid) {
      toast.error('Configuration Incomplete', {
        description: backendValidation.errors.join(', ')
      })
      return
    }

    // Show warnings if any
    if (backendValidation.warnings.length > 0) {
      toast.warning('Configuration Warnings', {
        description: backendValidation.warnings.join(', ')
      })
    }

    setIsSavingAgent(true)
    try {
      // Generate pipeline summary
      const summary = generatePipelineSummary(currentNodes, currentEdges)

      // Prompt for agent name
      const agentName = prompt('Enter agent name:', `Agent - ${summary}`)
      if (!agentName) {
        setIsSavingAgent(false)
        return
      }

      const agentDescription = prompt('Enter agent description (optional):', summary) || summary

      // Convert pipeline to agent configuration
      const agentConfig = convertPipelineToAgentConfig(
        currentNodes,
        currentEdges,
        agentName,
        agentDescription,
        'user_1' // TODO: Get from auth context
      )

      // Send to backend to create agent
      const response = await fetch('http://localhost:7860/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(agentConfig)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to create agent')
      }

      const createdAgent = await response.json()

      toast.success('Agent Created Successfully!', {
        description: `${agentName} is ready for testing`
      })

      // Navigate to agent test page
      router.push(`/agents/${createdAgent.id}/test`)

    } catch (error: any) {
      console.error('Error creating agent:', error)
      toast.error('Failed to Create Agent', {
        description: error.message || 'An unexpected error occurred'
      })
    } finally {
      setIsSavingAgent(false)
    }
  }

  const handleValidate = () => {
    const isValid = validatePipeline()
    // Could show a toast or notification here
    console.log('Pipeline valid:', isValid)
  }

  const handleExport = () => {
    const config = exportPipeline()
    const blob = new Blob([config], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${currentPipeline?.name || 'pipeline'}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleReset = () => {
    if (confirm(t('confirmResetPipeline', 'builder'))) {
      resetPipeline()
    }
  }

  const handleSimulate = () => {
    setIsSimulating(!isSimulating)
  }

  const isValid = validatePipeline()

  return (
    <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-2 border-b">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold">
              {currentPipeline?.name || t('pipelineBuilder', 'builder')}
            </h2>
            <Badge variant={isValid ? 'default' : 'destructive'} className="flex items-center gap-1 text-xs">
              {isValid ? (
                <CheckCircle className="w-2.5 h-2.5" />
              ) : (
                <AlertCircle className="w-2.5 h-2.5" />
              )}
              {isValid ? t('valid', 'builder') : t('invalid', 'builder')}
            </Badge>
          </div>

          {!readonly && (
            <div className="flex items-center gap-1">
              {/* Quick Start Template Button */}
              <PipelineTemplateSelector />

              <div className="h-6 w-px bg-border mx-1" />

              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSimulate}
                  className={`h-7 text-xs ${isSimulating ? "bg-green-100 border-green-300" : ""}`}
                >
                  {isSimulating ? (
                    <Pause className="w-3 h-3 mr-1" />
                  ) : (
                    <Play className="w-3 h-3 mr-1" />
                  )}
                  {isSimulating ? 'Stop' : 'Simulate'}
                </Button>
              </motion.div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowMetrics(!showMetrics)}
                className={`h-7 text-xs ${showMetrics ? "bg-blue-100 border-blue-300" : ""}`}
              >
                <Activity className="w-3 h-3 mr-1" />
                Metrics
              </Button>
              <Button variant="outline" size="sm" onClick={handleValidate} className="h-7 text-xs">
                <CheckCircle className="w-3 h-3 mr-1" />
                Validate
              </Button>
              <Button variant="outline" size="sm" onClick={handleExport} className="h-7 text-xs">
                <Download className="w-3 h-3 mr-1" />
                Export
              </Button>
              {!hideActions && (
                <>
                  <Button variant="outline" size="sm" onClick={handleReset} className="h-7 text-xs">
                    <Trash2 className="w-3 h-3 mr-1" />
                    Reset
                  </Button>
                  <Button onClick={handleSave} size="sm" variant="outline" className="h-7 text-xs">
                    <Save className="w-3 h-3 mr-1" />
                    Save
                  </Button>
                  <Button
                    onClick={handleSaveAsAgent}
                    size="sm"
                    className="h-7 text-xs bg-primary hover:bg-primary/90"
                    disabled={isSavingAgent || !isValid}
                  >
                    <Bot className="w-3 h-3 mr-1" />
                    {isSavingAgent ? 'Creating...' : 'Save as Agent'}
                  </Button>
                </>
              )}

              <div className="h-6 w-px bg-border mx-1" />

              {/* Help Button */}
              <PipelineBuilderHelp />
            </div>
          )}
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Toolbar */}
          {!readonly && (
            <div className="w-64 border-r bg-muted/30 overflow-y-auto">
              <PipelineToolbar />
            </div>
          )}

          {/* Main Canvas */}
          <div className="flex-1 relative">
            <ReactFlowProvider>
              <div
                ref={reactFlowWrapper}
                className="w-full h-full turbo-flow-canvas"
                data-testid="pipeline-canvas"
                id="reactflow-wrapper"
                onDragOver={onDragOver}
                onDrop={onDrop}
                style={{ position: 'relative', background: 'rgb(17, 17, 17)' }}
              >
                <ReactFlow
                  nodes={nodes.map(node => ({
                    ...node,
                    type: node.type || 'turbo',
                    data: {
                      ...node.data,
                      title: node.data.label, // Map label to title for TurboNode display
                      nodeType: node.data.type,
                      status: isSimulating ? 'processing' : 'idle',
                      metrics: isSimulating ? {
                        latency: Math.floor(Math.random() * 100) + 50,
                        throughput: Math.floor(Math.random() * 50) + 10,
                        accuracy: Math.floor(Math.random() * 20) + 80
                      } : undefined
                    }
                  }))}
                  edges={edges.map(edge => ({
                    ...edge,
                    type: edge.type || 'turbo',
                    data: {
                      ...edge.data,
                      status: isSimulating ? 'active' : 'idle',
                      animated: isSimulating,
                      throughput: isSimulating ? Math.floor(Math.random() * 100) + 50 : undefined,
                      latency: isSimulating ? Math.floor(Math.random() * 50) + 10 : undefined
                    }
                  }))}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  onConnect={onConnect}
                  onNodeClick={onNodeClick}
                  onPaneClick={onPaneClick}
                  nodeTypes={nodeTypes as any}
                  edgeTypes={edgeTypes as any}
                  defaultEdgeOptions={defaultEdgeOptions}
                  connectionMode={ConnectionMode.Loose}
                  fitView
                  fitViewOptions={{ maxZoom: 0.8, minZoom: 0.8 }}
                  snapToGrid
                  snapGrid={[20, 20]}
                  className="turbo-flow-canvas"
                  defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
                  minZoom={0.2}
                  maxZoom={2}
                >
                  <svg>
                    <defs>
                      <linearGradient id="turbo-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#ae53ba" />
                        <stop offset="100%" stopColor="#2a8af6" />
                      </linearGradient>
                      <marker
                        id="turbo-marker"
                        viewBox="-5 -5 10 10"
                        refX="0"
                        refY="0"
                        markerUnits="strokeWidth"
                        markerWidth="8"
                        markerHeight="8"
                        orient="auto"
                      >
                        <circle
                          cx="0"
                          cy="0"
                          r="2"
                          fill="url(#turbo-gradient)"
                          stroke="none"
                        />
                      </marker>
                    </defs>
                  </svg>
                  <Background
                    color="rgba(255, 255, 255, 0.1)"
                    gap={20}
                    style={{
                      background: 'rgb(17, 17, 17)',
                    }}
                  />
                  <Controls
                    style={{
                      background: 'rgba(17, 17, 17, 0.9)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      backdropFilter: 'blur(12px)',
                    }}
                  />
                  <MiniMap
                    style={{
                      background: 'rgba(17, 17, 17, 0.9)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      backdropFilter: 'blur(12px)',
                    }}
                    maskColor="rgba(17, 17, 17, 0.8)"
                    nodeColor="rgba(139, 92, 246, 0.6)"
                  />

                  {/* Undo and Delete Buttons - Center Bottom */}
                  <Panel position="bottom-center" style={{ marginBottom: '10px' }}>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="w-10 h-10 rounded-lg shadow-lg bg-white/10 hover:bg-white/20 border-white/20"
                        onClick={handleUndo}
                        disabled={historyIndex <= 0}
                        title="Undo (Ctrl+Z)"
                      >
                        <Undo2 className="w-5 h-5" />
                      </Button>

                      {/* Delete Button - Shows when nodes or edges are selected */}
                      {(nodes.some(n => n.selected) || edges.some(e => e.selected)) && (
                        <Button
                          variant="destructive"
                          size="icon"
                          className="w-10 h-10 rounded-lg shadow-lg bg-red-600 hover:bg-red-700"
                          onClick={() => {
                            const selectedNodes = nodes.filter(n => n.selected)
                            const selectedEdges = edges.filter(e => e.selected)

                            if (selectedNodes.length > 0) {
                              selectedNodes.forEach(node => removeNode(node.id))
                              selectNode(null)
                              toast.success(`Deleted ${selectedNodes.length} node${selectedNodes.length > 1 ? 's' : ''}`, { duration: 2000 })
                            } else if (selectedEdges.length > 0) {
                              selectedEdges.forEach(edge => {
                                onEdgesChange([{ type: 'remove', id: edge.id }])
                              })
                              toast.success(`Deleted ${selectedEdges.length} connection${selectedEdges.length > 1 ? 's' : ''}`, { duration: 2000 })
                            }
                          }}
                          title="Delete selected (Delete key)"
                        >
                          <Trash2 className="w-5 h-5" />
                        </Button>
                      )}
                    </div>
                  </Panel>

                  <Panel position="top-left">
                    <motion.div
                      initial={{ x: -300, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ duration: 0.5 }}
                    >
                      <Card
                        className="w-64 bg-black/20 border-white/10 backdrop-blur-sm"
                        style={{
                          background: 'rgba(17, 17, 17, 0.9)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          backdropFilter: 'blur(12px)',
                        }}
                      >
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2 text-white">
                            {t('pipelineInfo', 'builder')}
                            {isSimulating && (
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                              >
                                <Zap className="w-3 h-3 text-blue-400" />
                              </motion.div>
                            )}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="text-xs space-y-2 text-white/80">
                          <div className="flex justify-between">
                            <span>{t('nodes', 'builder')}:</span>
                            <span className="text-white font-mono">{nodes.length}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>{t('connections', 'builder')}:</span>
                            <span className="text-white font-mono">{edges.length}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>{t('status', 'builder')}:</span>
                            <Badge
                              variant={isValid ? 'default' : 'secondary'}
                              className={`text-xs ${
                                isValid
                                  ? 'bg-green-500/20 text-green-400 border-green-500/30'
                                  : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                              }`}
                            >
                              {isValid ? t('valid', 'builder') : t('incomplete', 'builder')}
                            </Badge>
                          </div>

                          <AnimatePresence>
                            {showMetrics && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="space-y-2 pt-2 border-t border-white/10"
                              >
                                <div className="text-xs font-medium text-white">Real-time Metrics</div>
                                <div className="flex justify-between">
                                  <span>Avg Latency:</span>
                                  <span className="font-mono text-purple-400">{Math.floor(Math.random() * 200) + 100}ms</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Throughput:</span>
                                  <span className="font-mono text-blue-400">{Math.floor(Math.random() * 50) + 20}/min</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Success Rate:</span>
                                  <span className="font-mono text-green-400">98.5%</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span>Activity:</span>
                                  <div className={`w-2 h-2 rounded-full ${isSimulating ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`} />
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </Panel>
                </ReactFlow>
              </div>
            </ReactFlowProvider>
          </div>

          {/* Right Sidebar - Validation Panel and Smart Suggestions */}
          {!readonly && (
            <div className="w-96 border-l bg-background overflow-y-auto">
              <div className="p-4 space-y-4">
                {/* Always show validation panel */}
                <PipelineValidationPanel />

                {/* Smart Suggestions Panel */}
                <SmartSuggestionsPanel />
              </div>
            </div>
          )}
        </div>

        {/* Node Configuration Dialog */}
        <PipelineNodeConfigDialog
          node={selectedNode}
          open={isConfigDialogOpen}
          onClose={() => {
            setIsConfigDialogOpen(false)
            selectNode(null)
          }}
        />
      </div>
  )
}