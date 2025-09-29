'use client'

import React, { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { motion } from 'framer-motion'
import {
  Mic,
  Brain,
  Volume2,
  Zap,
  Settings,
  Cpu,
  Database
} from 'lucide-react'

export interface TurboNodeData {
  icon?: React.ReactNode
  title: string
  subtitle?: string
  status?: 'idle' | 'processing' | 'completed' | 'error'
  nodeType?: 'stt' | 'llm' | 'tts' | 'realtime' | 'filter' | 'aggregator' | 'custom'
  metrics?: {
    latency?: number
    throughput?: number
    accuracy?: number
  }
}

export type TurboNodeType = NodeProps<TurboNodeData>

const getNodeIcon = (nodeType?: string) => {
  switch (nodeType) {
    case 'stt': return <Mic className="w-4 h-4" />
    case 'llm': return <Brain className="w-4 h-4" />
    case 'tts': return <Volume2 className="w-4 h-4" />
    case 'realtime': return <Zap className="w-4 h-4" />
    case 'filter': return <Settings className="w-4 h-4" />
    case 'aggregator': return <Database className="w-4 h-4" />
    case 'custom': return <Cpu className="w-4 h-4" />
    default: return <Settings className="w-4 h-4" />
  }
}

const getCategoryColor = (nodeType?: string) => {
  switch (nodeType) {
    case 'stt': return '#3B82F6' // Blue
    case 'llm': return '#22C55E' // Green
    case 'tts': return '#A855F7' // Purple
    case 'realtime': return '#EF4444' // Red
    case 'filter': return '#F97316' // Orange
    case 'aggregator': return '#F59E0B' // Amber
    case 'custom': return '#6B7280' // Gray
    default: return '#8B5CF6' // Default purple
  }
}

const TurboNode = memo(({ data, selected }: TurboNodeType) => {
  const { icon, title, subtitle, status = 'idle', nodeType, metrics } = data
  const nodeIcon = icon || getNodeIcon(nodeType)
  const categoryColor = getCategoryColor(nodeType)

  return (
    <>
      {/* Connection Handles - Top and Left (Inputs) */}
      <Handle
        type="target"
        position={Position.Top}
        style={{
          width: '16px',
          height: '16px',
          background: 'white',
          border: `3px solid ${categoryColor}`,
          borderRadius: '50%',
          top: '-8px',
        }}
        className="transition-all duration-200 hover:scale-125 hover:shadow-lg opacity-80 hover:opacity-100"
      />

      <Handle
        type="target"
        position={Position.Left}
        style={{
          width: '16px',
          height: '16px',
          background: 'white',
          border: `3px solid ${categoryColor}`,
          borderRadius: '50%',
          left: '-8px',
        }}
        className="transition-all duration-200 hover:scale-125 hover:shadow-lg opacity-80 hover:opacity-100"
      />

      {/* Node Body */}
      <motion.div
        className="relative"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.2 }}
        style={{
          background: 'rgba(17, 17, 17, 0.95)',
          border: `2px solid ${categoryColor}`,
          borderRadius: '12px',
          padding: '16px',
          minWidth: '200px',
          color: 'white',
          backdropFilter: 'blur(12px)',
          boxShadow: selected
            ? `0 0 30px ${categoryColor}40, 0 0 60px ${categoryColor}20`
            : `0 0 20px ${categoryColor}20`,
          position: 'relative',
        }}
      >
        {/* Processing Animation Border - Smooth Rotating Border */}
        {status === 'processing' && (
          <div
            className="absolute inset-[-3px] rounded-[15px] animate-spin"
            style={{
              background: `conic-gradient(from 0deg, ${categoryColor}, transparent, ${categoryColor})`,
              zIndex: -1,
            }}
          >
            <div
              className="absolute inset-[3px] rounded-[12px]"
              style={{
                background: 'rgba(17, 17, 17, 0.95)',
              }}
            />
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            {/* Icon */}
            <motion.div
              className="flex items-center justify-center w-8 h-8 rounded-lg"
              style={{
                background: `${categoryColor}20`,
                border: `1px solid ${categoryColor}30`,
              }}
              animate={status === 'processing' ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {nodeIcon}
            </motion.div>

            {/* Status Badge */}
            <div
              className="px-2 py-1 text-xs font-medium rounded-full"
              style={{
                background: status === 'processing'
                  ? '#F59E0B20'
                  : status === 'completed'
                  ? '#22C55E20'
                  : status === 'error'
                  ? '#EF444420'
                  : '#6B728020',
                color: status === 'processing'
                  ? '#F59E0B'
                  : status === 'completed'
                  ? '#22C55E'
                  : status === 'error'
                  ? '#EF4444'
                  : '#9CA3AF',
                border: `1px solid ${status === 'processing'
                  ? '#F59E0B50'
                  : status === 'completed'
                  ? '#22C55E50'
                  : status === 'error'
                  ? '#EF444450'
                  : '#6B728050'}`,
              }}
            >
              {status}
            </div>
          </div>

          {/* Activity Indicator */}
          {status === 'processing' && (
            <div
              className="w-3 h-3 rounded-full animate-pulse"
              style={{ background: categoryColor }}
            />
          )}
        </div>

        {/* Title and Subtitle */}
        <div>
          <h3 className="text-sm font-semibold text-white mb-1">
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs text-gray-400">
              {subtitle}
            </p>
          )}
        </div>

        {/* Metrics */}
        {metrics && (
          <div className="mt-3 space-y-2">
            {metrics.latency && (
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Latency:</span>
                <span className="text-white font-mono">{metrics.latency}ms</span>
              </div>
            )}
            {metrics.throughput && (
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Throughput:</span>
                <span className="text-white font-mono">{metrics.throughput}/s</span>
              </div>
            )}
            {metrics.accuracy && (
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Accuracy:</span>
                <span className="text-white font-mono">{metrics.accuracy}%</span>
              </div>
            )}
          </div>
        )}
      </motion.div>

      {/* Connection Handles - Bottom and Right (Outputs) */}
      <Handle
        type="source"
        position={Position.Bottom}
        style={{
          width: '16px',
          height: '16px',
          background: 'white',
          border: `3px solid ${categoryColor}`,
          borderRadius: '50%',
          bottom: '-8px',
        }}
        className="transition-all duration-200 hover:scale-125 hover:shadow-lg opacity-80 hover:opacity-100"
      />

      <Handle
        type="source"
        position={Position.Right}
        style={{
          width: '16px',
          height: '16px',
          background: 'white',
          border: `3px solid ${categoryColor}`,
          borderRadius: '50%',
          right: '-8px',
        }}
        className="transition-all duration-200 hover:scale-125 hover:shadow-lg opacity-80 hover:opacity-100"
      />
    </>
  )
})

TurboNode.displayName = 'TurboNode'

export default TurboNode