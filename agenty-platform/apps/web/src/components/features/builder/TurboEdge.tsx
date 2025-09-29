'use client'

import React, { useMemo } from 'react'
import { BaseEdge, EdgeLabelRenderer, getBezierPath, getSmoothStepPath, type EdgeProps } from '@xyflow/react'
import { motion } from 'framer-motion'

export interface TurboEdgeData {
  status?: 'idle' | 'active' | 'error'
  throughput?: number
  latency?: number
  animated?: boolean
}

const TurboEdge: React.FC<EdgeProps<TurboEdgeData>> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data,
  markerEnd,
  selected
}) => {
  // Calculate edge path with memoized values for stability
  const pathData = useMemo(() => {
    // Calculate direction and choose appropriate path type
    const isUpward = targetY < sourceY
    const isHorizontal = Math.abs(targetY - sourceY) < 50

    // Calculate path parameters
    const distance = Math.sqrt((targetX - sourceX) ** 2 + (targetY - sourceY) ** 2)
    const curvature = isHorizontal
      ? Math.min(distance * 0.2, 60) // Moderate curves for horizontal
      : Math.min(distance * 0.3, 80) // Natural curves for downward

    let edgePath: string, labelX: number, labelY: number

    if (isUpward) {
      // Use smooth step path for upward connections to avoid extreme curves
      [edgePath, labelX, labelY] = getSmoothStepPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
        borderRadius: 8,
        offset: 20, // Small offset for clean connections
      })
    } else {
      // Use Bezier curves for downward and horizontal connections
      [edgePath, labelX, labelY] = getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
        curvature,
      })
    }

    return { edgePath, labelX, labelY }
  }, [sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition])

  const { edgePath, labelX, labelY } = pathData

  const isActive = data?.status === 'active'
  const isError = data?.status === 'error'

  const strokeColor = isError ? '#EF4444' : isActive ? '#8B5CF6' : '#6B7280'
  const strokeWidth = selected ? 3 : isActive ? 2.5 : 2

  return (
    <>
      <defs>
        <linearGradient id={`turbo-gradient-${id}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#06B6D4" />
        </linearGradient>
        <marker
          id={`turbo-marker-${id}`}
          viewBox="-5 -5 10 10"
          refX="0"
          refY="0"
          markerWidth="8"
          markerHeight="8"
          orient="auto"
        >
          <circle cx="0" cy="0" r="2" fill={strokeColor} />
        </marker>
      </defs>

      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={`url(#turbo-marker-${id})`}
        style={{
          ...style,
          stroke: isActive ? `url(#turbo-gradient-${id})` : strokeColor,
          strokeWidth,
          opacity: isActive ? 1 : 0.7,
          filter: isActive ? 'drop-shadow(0 0 4px rgba(139, 92, 246, 0.4))' : undefined,
        }}
      />

      {/* Animated flow particles for active edges */}
      {isActive && data?.animated && (
        <>
          <motion.circle
            r="3"
            fill="#A855F7"
            style={{
              filter: 'drop-shadow(0 0 4px rgba(168, 85, 247, 0.6))',
            }}
          >
            <animateMotion dur="2s" repeatCount="indefinite" path={edgePath} />
          </motion.circle>

          <motion.circle
            r="2"
            fill="#06B6D4"
            style={{
              filter: 'drop-shadow(0 0 4px rgba(6, 182, 212, 0.6))',
            }}
          >
            <animateMotion dur="2.5s" repeatCount="indefinite" path={edgePath} begin="0.5s" />
          </motion.circle>
        </>
      )}

      {/* Edge Label */}
      {(data?.throughput || data?.latency) && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              fontSize: 10,
              pointerEvents: 'all',
            }}
          >
            <motion.div
              className="flex items-center gap-2 px-2 py-1 rounded-md"
              style={{
                background: 'rgba(17, 17, 17, 0.9)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: 'white',
                backdropFilter: 'blur(8px)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
              }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              {data?.throughput && (
                <span className="text-blue-400 font-mono">
                  {data.throughput}/s
                </span>
              )}
              {data?.latency && (
                <span className="text-purple-400 font-mono">
                  {data.latency}ms
                </span>
              )}
            </motion.div>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}

export default TurboEdge