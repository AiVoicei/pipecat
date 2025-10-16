'use client'

import { motion } from 'framer-motion'
import { AnimationState } from './types'
import { Sparkles, Brain, Zap } from 'lucide-react'

interface AgentyAvatarProps {
  state?: AnimationState
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showGlow?: boolean
}

const sizeMap = {
  sm: { container: 'w-16 h-16', icon: 'w-8 h-8', pulse: 'w-20 h-20' },
  md: { container: 'w-24 h-24', icon: 'w-12 h-12', pulse: 'w-32 h-32' },
  lg: { container: 'w-32 h-32', icon: 'w-16 h-16', pulse: 'w-40 h-40' },
  xl: { container: 'w-48 h-48', icon: 'w-24 h-24', pulse: 'w-56 h-56' }
}

export function AgentyAvatar({ state = 'idle', size = 'lg', showGlow = true }: AgentyAvatarProps) {
  const sizes = sizeMap[size]

  const getAvatarColor = () => {
    switch (state) {
      case 'listening':
        return 'from-blue-500/70 via-purple-500/60 to-blue-500/70'
      case 'thinking':
        return 'from-yellow-500/70 via-purple-500/60 to-yellow-500/70'
      case 'speaking':
        return 'from-green-500/70 via-purple-500/60 to-green-500/70'
      case 'celebrating':
        return 'from-pink-500/70 via-purple-500/60 to-pink-500/70'
      default:
        return 'from-purple-500/70 via-purple-600/60 to-purple-500/70'
    }
  }

  const getIcon = () => {
    switch (state) {
      case 'thinking':
        return <Brain className={`${sizes.icon} text-white`} />
      case 'celebrating':
        return <Sparkles className={`${sizes.icon} text-white`} />
      case 'speaking':
      case 'listening':
        return <Zap className={`${sizes.icon} text-white`} />
      default:
        return <Sparkles className={`${sizes.icon} text-white`} />
    }
  }

  return (
    <div className="relative flex items-center justify-center">
      {/* Outer Glow Ring */}
      {showGlow && (
        <motion.div
          className={`absolute ${sizes.pulse} rounded-full bg-gradient-to-r ${getAvatarColor()} blur-xl`}
          animate={{
            scale: state === 'idle' ? [1, 1.1, 1] : [1, 1.2, 1],
            opacity: state === 'idle' ? [0.3, 0.5, 0.3] : [0.4, 0.7, 0.4]
          }}
          transition={{
            duration: state === 'thinking' ? 1.5 : state === 'speaking' ? 0.8 : 3,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />
      )}

      {/* Rotating Ring */}
      {state === 'thinking' && (
        <motion.div
          className={`absolute ${sizes.pulse} rounded-full border-2 border-dashed border-purple-400/50`}
          animate={{ rotate: 360 }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'linear'
          }}
        />
      )}

      {/* Main Avatar Container */}
      <motion.div
        className={`relative ${sizes.container} rounded-full bg-gradient-to-br ${getAvatarColor()}
          border-2 border-purple-400/30 shadow-2xl flex items-center justify-center overflow-hidden`}
        animate={{
          scale: state === 'celebrating' ? [1, 1.1, 1] : state === 'speaking' ? [1, 1.05, 1] : 1,
          rotate: state === 'celebrating' ? [0, 5, -5, 0] : 0
        }}
        transition={{
          duration: state === 'celebrating' ? 0.6 : state === 'speaking' ? 0.5 : 1,
          repeat: state === 'celebrating' || state === 'speaking' ? Infinity : 0,
          ease: 'easeInOut'
        }}
      >
        {/* Shimmer Effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          animate={{
            x: ['-100%', '200%']
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
            repeatDelay: 2
          }}
        />

        {/* Icon */}
        <motion.div
          animate={{
            rotate: state === 'thinking' ? [0, 10, -10, 0] : 0,
            scale: state === 'speaking' ? [1, 1.1, 1] : 1
          }}
          transition={{
            duration: state === 'thinking' ? 2 : 0.4,
            repeat: state === 'speaking' || state === 'thinking' ? Infinity : 0
          }}
        >
          {getIcon()}
        </motion.div>

        {/* Pulse Dots for Speaking */}
        {state === 'speaking' && (
          <div className="absolute bottom-4 flex gap-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-1.5 h-1.5 bg-white rounded-full"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                  delay: i * 0.2
                }}
              />
            ))}
          </div>
        )}
      </motion.div>

      {/* Orbital Particles */}
      {(state === 'listening' || state === 'speaking') && (
        <>
          {[0, 120, 240].map((angle, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-purple-400 rounded-full"
              style={{
                left: '50%',
                top: '50%'
              }}
              animate={{
                rotate: 360,
                x: [0, Math.cos((angle * Math.PI) / 180) * 50],
                y: [0, Math.sin((angle * Math.PI) / 180) * 50]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'linear',
                delay: i * 0.3
              }}
            />
          ))}
        </>
      )}
    </div>
  )
}
