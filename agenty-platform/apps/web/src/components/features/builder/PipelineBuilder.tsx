'use client'

import React, { useCallback, useRef, useEffect, useState } from 'react'
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
import { usePipelineStore } from '@/stores/usePipelineStore'
import { PipelineToolbar } from './PipelineToolbar'
import { PipelineNode } from './PipelineNode'
import { PipelineNodeConfig } from './PipelineNodeConfig'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Save, Play, Pause, Download, Upload, Trash2, CheckCircle, AlertCircle, Activity, Zap } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

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
  selectedProviders?: {
    stt?: string
    llm?: string
    tts?: string
    realtime?: string
  }
}


export function PipelineBuilder({ agentId, readonly = false, selectedProviders }: PipelineBuilderProps) {
  const { t } = useLanguage()
  const reactFlowWrapper = useRef<HTMLDivElement>(null)

  // Pipeline simulation state
  const [isSimulating, setIsSimulating] = useState(false)
  const [simulationSpeed, setSimulationSpeed] = useState(1)
  const [showMetrics, setShowMetrics] = useState(false)

  const {
    nodes,
    edges,
    selectedNode,
    currentPipeline,
    addNode,
    onNodesChange,
    onEdgesChange,
    onConnect,
    selectNode,
    savePipeline,
    validatePipeline,
    exportPipeline,
    resetPipeline,
  } = usePipelineStore()

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
  }, [selectNode])

  const onPaneClick = useCallback(() => {
    selectNode(null)
  }, [selectNode])

  // Pre-populate pipeline with selected providers
  useEffect(() => {
    if (selectedProviders && nodes.length === 0) {
      const { stt, llm, tts, realtime } = selectedProviders

      if (realtime) {
        // For realtime providers, create a single node
        addNode('realtime', { x: 300, y: 200 })
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
      }
    }
  }, [selectedProviders, nodes.length, addNode, onConnect])

  const handleSave = () => {
    savePipeline()
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
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold">
              {currentPipeline?.name || t('pipelineBuilder', 'builder')}
            </h2>
            <Badge variant={isValid ? 'default' : 'destructive'} className="flex items-center gap-1">
              {isValid ? (
                <CheckCircle className="w-3 h-3" />
              ) : (
                <AlertCircle className="w-3 h-3" />
              )}
              {isValid ? t('valid', 'builder') : t('invalid', 'builder')}
            </Badge>
          </div>

          {!readonly && (
            <div className="flex items-center gap-2">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSimulate}
                  className={isSimulating ? "bg-green-100 border-green-300" : ""}
                >
                  {isSimulating ? (
                    <Pause className="w-4 h-4 mr-2" />
                  ) : (
                    <Play className="w-4 h-4 mr-2" />
                  )}
                  {isSimulating ? 'Stop Simulation' : 'Simulate Pipeline'}
                </Button>
              </motion.div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowMetrics(!showMetrics)}
                className={showMetrics ? "bg-blue-100 border-blue-300" : ""}
              >
                <Activity className="w-4 h-4 mr-2" />
                Metrics
              </Button>
              <Button variant="outline" size="sm" onClick={handleValidate}>
                <CheckCircle className="w-4 h-4 mr-2" />
                {t('validate', 'builder')}
              </Button>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="w-4 h-4 mr-2" />
                {t('export', 'builder')}
              </Button>
              <Button variant="outline" size="sm" onClick={handleReset}>
                <Trash2 className="w-4 h-4 mr-2" />
                {t('reset', 'builder')}
              </Button>
              <Button onClick={handleSave}>
                <Save className="w-4 h-4 mr-2" />
                {t('save', 'builder')}
              </Button>
            </div>
          )}
        </div>

        <div className="flex flex-1">
          {/* Toolbar */}
          {!readonly && (
            <div className="w-64 border-r bg-muted/30">
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
                  snapToGrid
                  snapGrid={[20, 20]}
                  className="turbo-flow-canvas"
                  defaultViewport={{ x: 0, y: 0, zoom: 1 }}
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

          {/* Node Configuration Panel */}
          {selectedNode && !readonly && (
            <div className="w-80 border-l bg-background">
              <PipelineNodeConfig node={selectedNode} />
            </div>
          )}
        </div>
      </div>
  )
}