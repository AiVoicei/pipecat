'use client'

import { memo, useState, useEffect } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { motion, AnimatePresence } from 'framer-motion'
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
  Zap,
  Play,
  Pause,
  Activity,
  Clock
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

// Node execution status
type NodeStatus = 'idle' | 'processing' | 'error' | 'success'

export const PipelineNode = memo(({ data, selected }: PipelineNodeComponentProps) => {
  const Icon = nodeIcons[data.type]
  const colorClass = nodeColors[data.type]
  const borderClass = nodeBorders[data.type]

  // Simulated node status and metrics
  const [nodeStatus, setNodeStatus] = useState<NodeStatus>('idle')
  const [processingTime, setProcessingTime] = useState(0)
  const [throughput, setThroughput] = useState(0)
  const [isActive, setIsActive] = useState(false)

  // Simulate node activity and metrics
  useEffect(() => {
    const interval = setInterval(() => {
      if (data.isConfigured && Math.random() > 0.7) {
        setIsActive(true)
        setNodeStatus('processing')
        setProcessingTime(Math.floor(Math.random() * 500) + 100)
        setThroughput(Math.floor(Math.random() * 100) + 50)

        setTimeout(() => {
          setNodeStatus(Math.random() > 0.9 ? 'error' : 'success')
          setTimeout(() => {
            setNodeStatus('idle')
            setIsActive(false)
          }, 1000)
        }, 1500)
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [data.isConfigured])

  const showInputHandle = data.type !== 'stt' // STT nodes don't need input
  const showOutputHandle = data.type !== 'tts' // TTS nodes don't need output

  const getStatusColor = (status: NodeStatus) => {
    switch (status) {
      case 'processing': return 'text-blue-500'
      case 'success': return 'text-green-500'
      case 'error': return 'text-red-500'
      default: return 'text-muted-foreground'
    }
  }

  const getStatusIcon = (status: NodeStatus) => {
    switch (status) {
      case 'processing': return Activity
      case 'success': return CheckCircle
      case 'error': return AlertCircle
      default: return Clock
    }
  }

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className={cn(
        'relative bg-card border-2 rounded-lg shadow-lg min-w-[180px] transition-all duration-300',
        borderClass,
        selected && 'ring-2 ring-primary ring-offset-2 shadow-xl',
        data.isConfigured ? 'opacity-100' : 'opacity-75',
        isActive && 'shadow-2xl'
      )}
    >
      {/* Input Handle */}
      {showInputHandle && (
        <motion.div
          animate={isActive ? { scale: [1, 1.2, 1] } : { scale: 1 }}
          transition={{ duration: 0.8, repeat: isActive ? Infinity : 0 }}
        >
          <Handle
            type="target"
            position={Position.Left}
            className={cn(
              "w-3 h-3 border-2 border-background transition-colors",
              isActive ? "!bg-green-500" : "!bg-muted-foreground"
            )}
          />
        </motion.div>
      )}

      {/* Header */}
      <motion.div
        className={cn('px-3 py-2 rounded-t-md text-white text-sm font-medium relative overflow-hidden', colorClass)}
        animate={isActive ? {
          boxShadow: "0 0 20px rgba(139, 92, 246, 0.5)"
        } : {}}
      >
        {/* Processing animation overlay */}
        <AnimatePresence>
          {nodeStatus === 'processing' && (
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: "100%" }}
              exit={{ x: "100%" }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            />
          )}
        </AnimatePresence>

        <div className="flex items-center gap-2 relative">
          <Icon className="w-4 h-4" />
          <span className="truncate">{data.label}</span>
          <div className="ml-auto flex items-center gap-1">
            {data.isConfigured ? (
              <motion.div
                animate={nodeStatus === 'processing' ? { rotate: 360 } : { rotate: 0 }}
                transition={{ duration: 1, repeat: nodeStatus === 'processing' ? Infinity : 0 }}
              >
                <CheckCircle className="w-3 h-3" />
              </motion.div>
            ) : (
              <AlertCircle className="w-3 h-3" />
            )}
          </div>
        </div>
      </motion.div>

      {/* Content */}
      <div className="p-3 space-y-2 bg-card/50 backdrop-blur-sm rounded-b-md border-t border-border/50">
        {/* Provider Badge */}
        {data.provider && (
          <Badge variant="secondary" className="text-xs">
            {data.provider}
          </Badge>
        )}

        {/* Real-time Status */}
        <motion.div
          className="flex items-center justify-between text-xs"
          animate={{ opacity: isActive ? 1 : 0.7 }}
        >
          <div className="flex items-center gap-1">
            <motion.div
              animate={nodeStatus === 'processing' ? { scale: [1, 1.2, 1] } : { scale: 1 }}
              transition={{ duration: 0.8, repeat: nodeStatus === 'processing' ? Infinity : 0 }}
            >
              {(() => {
                const StatusIcon = getStatusIcon(nodeStatus)
                return <StatusIcon className={cn("w-3 h-3", getStatusColor(nodeStatus))} />
              })()}
            </motion.div>
            <span className={getStatusColor(nodeStatus)}>
              {nodeStatus === 'processing' ? 'Processing' :
               nodeStatus === 'success' ? 'Ready' :
               nodeStatus === 'error' ? 'Error' : 'Idle'}
            </span>
          </div>

          {/* Activity indicator */}
          <div className="flex items-center gap-1">
            <div className={cn(
              "w-2 h-2 rounded-full transition-colors",
              isActive ? "bg-green-500 animate-pulse" : "bg-gray-400"
            )} />
          </div>
        </motion.div>

        {/* Performance Metrics */}
        <AnimatePresence>
          {isActive && data.isConfigured && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="space-y-1 overflow-hidden"
            >
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Latency:</span>
                <span className="font-mono">{processingTime}ms</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Throughput:</span>
                <span className="font-mono">{throughput}/min</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Configuration Status */}
        <div className={cn(
          "flex items-center gap-1 text-xs transition-colors",
          data.isConfigured ? 'text-muted-foreground' : 'text-orange-500'
        )}>
          <Settings className="w-3 h-3" />
          <span>
            {data.isConfigured ? 'Configured' : 'Needs configuration'}
          </span>
        </div>
      </div>

      {/* Output Handle */}
      {showOutputHandle && (
        <motion.div
          animate={isActive ? { scale: [1, 1.2, 1] } : { scale: 1 }}
          transition={{ duration: 0.8, repeat: isActive ? Infinity : 0 }}
        >
          <Handle
            type="source"
            position={Position.Right}
            className={cn(
              "w-3 h-3 border-2 border-background transition-colors",
              isActive ? "!bg-blue-500" : "!bg-muted-foreground"
            )}
          />
        </motion.div>
      )}

      {/* Selection Indicator */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute -inset-1 bg-primary/20 rounded-lg -z-10"
          />
        )}
      </AnimatePresence>

      {/* Data Flow Indicator */}
      <AnimatePresence>
        {isActive && nodeStatus === 'processing' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute top-1 right-1"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-3 h-3 border-2 border-white border-t-transparent rounded-full"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
})

PipelineNode.displayName = 'PipelineNode'