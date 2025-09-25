'use client'

import React, { useCallback, useRef, useEffect } from 'react'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
  Node,
  Edge,
  NodeTypes,
  ConnectionMode,
  Panel,
  ReactFlowInstance
} from 'reactflow'
import 'reactflow/dist/style.css'

// Removed DnD Kit import - using native HTML5 drag and drop
import { usePipelineStore } from '@/stores/usePipelineStore'
import { PipelineToolbar } from './PipelineToolbar'
import { PipelineNode } from './PipelineNode'
import { PipelineNodeConfig } from './PipelineNodeConfig'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Save, Play, Download, Upload, Trash2, CheckCircle, AlertCircle } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

// Custom node types
const nodeTypes: NodeTypes = {
  default: PipelineNode,
  stt: PipelineNode,
  llm: PipelineNode,
  tts: PipelineNode,
  filter: PipelineNode,
  aggregator: PipelineNode,
  custom: PipelineNode
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
  const reactFlowInstance = useRef<ReactFlowInstance | null>(null)

  const {
    nodes,
    edges,
    selectedNode,
    currentPipeline,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    selectNode,
    savePipeline,
    validatePipeline,
    exportPipeline,
    resetPipeline,
    initializePipeline
  } = usePipelineStore()

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

  // Native HTML5 drag and drop handlers

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

    if (reactFlowBounds && reactFlowInstance.current && nodeType) {
      const position = reactFlowInstance.current.project({
        x: event.clientX - reactFlowBounds.left - 100,
        y: event.clientY - reactFlowBounds.top - 50,
      })

      console.log('Adding node at position:', position) // Debug log
      addNode(nodeType as any, position)
    }
  }, [addNode])

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    selectNode(node)
  }, [selectNode])

  const onPaneClick = useCallback(() => {
    selectNode(null)
  }, [selectNode])

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
                className="w-full h-full"
                data-testid="pipeline-canvas"
                id="reactflow-wrapper"
                onDragOver={onDragOver}
                onDrop={onDrop}
                style={{ position: 'relative' }}
              >
                <ReactFlow
                  nodes={nodes}
                  edges={edges}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  onConnect={onConnect}
                  onNodeClick={onNodeClick}
                  onPaneClick={onPaneClick}
                  onInit={(instance) => (reactFlowInstance.current = instance)}
                  nodeTypes={nodeTypes}
                  connectionMode={ConnectionMode.Loose}
                  fitView
                  snapToGrid
                  snapGrid={[20, 20]}
                  className="pipeline-canvas"
                >
                  <Background color="#aaaaaa" gap={20} />
                  <Controls />
                  <MiniMap />

                  <Panel position="top-left">
                    <Card className="w-64">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">{t('pipelineInfo', 'builder')}</CardTitle>
                      </CardHeader>
                      <CardContent className="text-xs space-y-1">
                        <div className="flex justify-between">
                          <span>{t('nodes', 'builder')}:</span>
                          <span>{nodes.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>{t('connections', 'builder')}:</span>
                          <span>{edges.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>{t('status', 'builder')}:</span>
                          <Badge variant={isValid ? 'default' : 'secondary'} className="text-xs">
                            {isValid ? t('valid', 'builder') : t('incomplete', 'builder')}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
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