'use client'

import React, { useCallback, useRef } from 'react'
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

import { DndContext, DragEndEvent, useSensor, useSensors, PointerSensor } from '@dnd-kit/core'
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
}

export function PipelineBuilder({ agentId, readonly = false }: PipelineBuilderProps) {
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
    resetPipeline
  } = usePipelineStore()

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const onDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event

    if (over && over.id === 'pipeline-canvas') {
      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect()
      if (reactFlowBounds && reactFlowInstance.current) {
        const position = reactFlowInstance.current.project({
          x: event.activatorEvent.clientX - reactFlowBounds.left - 100,
          y: event.activatorEvent.clientY - reactFlowBounds.top - 50,
        })

        const nodeType = active.id as string
        addNode(nodeType, position)
      }
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
    <DndContext sensors={sensors} onDragEnd={onDragEnd}>
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
                  droppable
                  className="pipeline-canvas"
                >
                  <Background color="#aaa" gap={20} />
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
    </DndContext>
  )
}