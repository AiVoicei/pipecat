'use client'

import { memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import {
  Mic,
  Brain,
  Volume2,
  Filter,
  Layers,
  Code,
  CheckCircle,
  AlertCircle,
  Settings,
  Zap
} from 'lucide-react'
import { PipelineNodeData } from '@/stores/usePipelineStore'

// Node type icons
const nodeIcons = {
  stt: Mic,
  llm: Brain,
  tts: Volume2,
  realtime: Zap,
  filter: Filter,
  aggregator: Layers,
  custom: Code
}

// Node type colors
const nodeColors = {
  stt: 'bg-blue-500',
  llm: 'bg-green-500',
  tts: 'bg-purple-500',
  realtime: 'bg-red-500',
  filter: 'bg-orange-500',
  aggregator: 'bg-yellow-500',
  custom: 'bg-gray-500'
}

// Node type borders
const nodeBorders = {
  stt: 'border-blue-500',
  llm: 'border-green-500',
  tts: 'border-purple-500',
  realtime: 'border-red-500',
  filter: 'border-orange-500',
  aggregator: 'border-yellow-500',
  custom: 'border-gray-500'
}

interface PipelineNodeComponentProps extends NodeProps {
  data: PipelineNodeData
}

export const PipelineNode = memo(({ data, selected }: PipelineNodeComponentProps) => {
  const Icon = nodeIcons[data.type]
  const colorClass = nodeColors[data.type]
  const borderClass = nodeBorders[data.type]

  const showInputHandle = data.type !== 'stt' // STT nodes don't need input
  const showOutputHandle = data.type !== 'tts' // TTS nodes don't need output

  return (
    <div
      className={cn(
        'relative bg-transparent border-2 rounded-lg shadow-lg min-w-[160px] transition-all',
        borderClass,
        selected && 'ring-2 ring-primary ring-offset-2',
        data.isConfigured ? 'opacity-100' : 'opacity-75'
      )}
    >
      {/* Input Handle */}
      {showInputHandle && (
        <Handle
          type="target"
          position={Position.Left}
          className="w-3 h-3 !bg-muted-foreground border-2 border-background"
        />
      )}

      {/* Header */}
      <div className={cn('px-3 py-2 rounded-t-md text-white text-sm font-medium', colorClass)}>
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4" />
          <span className="truncate">{data.label}</span>
          <div className="ml-auto flex items-center gap-1">
            {data.isConfigured ? (
              <CheckCircle className="w-3 h-3" />
            ) : (
              <AlertCircle className="w-3 h-3" />
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-3 space-y-2 bg-black/20 rounded-b-md backdrop-blur-sm">
        {/* Provider Badge */}
        {data.provider && (
          <Badge variant="secondary" className="text-xs">
            {data.provider}
          </Badge>
        )}

        {/* Configuration Status */}
        <div className={`flex items-center gap-1 text-xs ${data.isConfigured ? 'text-muted-foreground' : 'text-red-500'}`}>
          <Settings className={`w-3 h-3 ${data.isConfigured ? '' : 'text-red-500'}`} />
          <span>
            {data.isConfigured ? 'Configured' : 'Not configured'}
          </span>
        </div>

        {/* Additional Info */}
        {data.configuration && Object.keys(data.configuration).length > 0 && (
          <div className="text-xs text-muted-foreground">
            {Object.keys(data.configuration).length} settings
          </div>
        )}
      </div>

      {/* Output Handle */}
      {showOutputHandle && (
        <Handle
          type="source"
          position={Position.Right}
          className="w-3 h-3 !bg-muted-foreground border-2 border-background"
        />
      )}

      {/* Selection Indicator */}
      {selected && (
        <div className="absolute -inset-1 bg-primary/20 rounded-lg -z-10" />
      )}
    </div>
  )
})

PipelineNode.displayName = 'PipelineNode'