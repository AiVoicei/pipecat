'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { AgentyAvatar } from './AgentyAvatar'
import { ProgressRing } from './ProgressRing'
import { GenerationPhase } from './types'
import { Sparkles, Brain, Zap, CheckCircle } from 'lucide-react'

interface GenerationJourneyProps {
  progress: number // 0-100
  onComplete?: () => void
}

const phases: GenerationPhase[] = [
  { id: 1, label: 'Analyzing requirements', progress: 20, description: 'Understanding your agent needs...' },
  { id: 2, label: 'Crafting personality', progress: 40, description: 'Generating unique system prompt...' },
  { id: 3, label: 'Configuring providers', progress: 60, description: 'Setting up AI services...' },
  { id: 4, label: 'Finalizing agent', progress: 80, description: 'Putting it all together...' },
  { id: 5, label: 'Agent ready', progress: 100, description: 'Your agent is born!' }
]

export function GenerationJourney({ progress, onComplete }: GenerationJourneyProps) {
  const [currentPhase, setCurrentPhase] = useState<GenerationPhase>(phases[0])
  const [stars, setStars] = useState<Array<{ x: number; y: number; size: number; delay: number }>>([])

  useEffect(() => {
    // Generate random stars for space theme
    const newStars = Array.from({ length: 50 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      delay: Math.random() * 3
    }))
    setStars(newStars)
  }, [])

  useEffect(() => {
    const phase = phases.find((p) => progress <= p.progress) || phases[phases.length - 1]
    setCurrentPhase(phase)

    if (progress >= 100 && onComplete) {
      const timer = setTimeout(onComplete, 1500)
      return () => clearTimeout(timer)
    }
  }, [progress, onComplete])

  const getPhaseIcon = () => {
    if (progress >= 100) return <CheckCircle className="w-12 h-12 text-green-400" />
    if (progress >= 60) return <Zap className="w-12 h-12 text-purple-400" />
    if (progress >= 40) return <Brain className="w-12 h-12 text-purple-400" />
    return <Sparkles className="w-12 h-12 text-purple-400" />
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-gradient-to-b from-[#0D0D0D] via-[#1a0a2e] to-[#0D0D0D]">
      {/* Starfield Background */}
      <div className="absolute inset-0">
        {stars.map((star, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full build-star-twinkle"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: `${star.size}px`,
              height: `${star.size}px`
            }}
            animate={{
              opacity: [0.2, 1, 0.2],
              scale: [1, 1.5, 1]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: star.delay
            }}
          />
        ))}
      </div>

      {/* Neural Network Lines (for analysis phase) */}
      {progress >= 20 && progress < 60 && (
        <svg className="absolute inset-0 w-full h-full opacity-20" style={{ zIndex: 1 }}>
          {[...Array(10)].map((_, i) => (
            <motion.line
              key={i}
              x1={`${Math.random() * 100}%`}
              y1={`${Math.random() * 100}%`}
              x2="50%"
              y2="50%"
              stroke="rgba(139, 92, 246, 0.6)"
              strokeWidth="1"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.6 }}
              transition={{
                duration: 2,
                delay: i * 0.2,
                repeat: Infinity,
                repeatType: 'reverse'
              }}
            />
          ))}
        </svg>
      )}

      {/* Orbiting Provider Logos (for configuration phase) */}
      {progress >= 60 && progress < 100 && (
        <div className="absolute inset-0 flex items-center justify-center">
          {['STT', 'LLM', 'TTS'].map((label, i) => (
            <motion.div
              key={label}
              className="absolute w-16 h-16 rounded-full bg-purple-500/20 border-2 border-purple-400/40
                backdrop-blur-sm flex items-center justify-center text-xs font-bold text-purple-300"
              animate={{
                rotate: 360,
                x: Math.cos((i * 120 * Math.PI) / 180) * 120,
                y: Math.sin((i * 120 * Math.PI) / 180) * 120
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: 'linear',
                delay: i * 0.3
              }}
            >
              {label}
            </motion.div>
          ))}
        </div>
      )}

      {/* Main Content */}
      <div className="relative z-10 text-center space-y-8 px-4 max-w-2xl">
        {/* Avatar with Progress Ring */}
        <motion.div
          className="flex justify-center"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{
            type: 'spring',
            stiffness: 200,
            damping: 20
          }}
        >
          <ProgressRing progress={progress} size={240} strokeWidth={6}>
            <AgentyAvatar
              state={progress >= 100 ? 'celebrating' : progress >= 60 ? 'speaking' : 'thinking'}
              size="lg"
              showGlow={false}
            />
          </ProgressRing>
        </motion.div>

        {/* Phase Description */}
        <motion.div
          key={currentPhase.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5 }}
          className="space-y-4"
        >
          {/* Phase Icon */}
          <motion.div
            className="flex justify-center"
            animate={{
              scale: [1, 1.1, 1],
              rotate: progress >= 100 ? [0, 360] : 0
            }}
            transition={{
              scale: { duration: 2, repeat: Infinity },
              rotate: { duration: 1 }
            }}
          >
            {getPhaseIcon()}
          </motion.div>

          {/* Phase Label */}
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            {currentPhase.label}
          </h2>

          {/* Phase Description */}
          <p className="text-lg text-purple-200/80">
            {currentPhase.description}
          </p>
        </motion.div>

        {/* Milestones Checklist */}
        <motion.div
          className="space-y-2 text-left max-w-md mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {phases.slice(0, -1).map((phase) => (
            <motion.div
              key={phase.id}
              className="flex items-center gap-3 text-sm"
              initial={{ opacity: 0, x: -20 }}
              animate={{
                opacity: progress >= phase.progress ? 1 : 0.4,
                x: 0
              }}
              transition={{ delay: phase.id * 0.1 }}
            >
              <motion.div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center
                  ${progress >= phase.progress
                    ? 'bg-green-500 border-green-400'
                    : 'border-purple-400/40'
                  }`}
                animate={progress >= phase.progress ? { scale: [1, 1.2, 1] } : {}}
                transition={{ duration: 0.3 }}
              >
                {progress >= phase.progress && (
                  <CheckCircle className="w-3 h-3 text-white" />
                )}
              </motion.div>
              <span className={progress >= phase.progress ? 'text-white' : 'text-purple-300/60'}>
                {phase.label}
              </span>
            </motion.div>
          ))}
        </motion.div>

        {/* Sparkle Effect at 100% */}
        {progress >= 100 && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-yellow-300 rounded-full"
                style={{
                  left: '50%',
                  top: '50%'
                }}
                initial={{ scale: 0, x: 0, y: 0 }}
                animate={{
                  scale: [0, 1, 0],
                  x: (Math.random() - 0.5) * 400,
                  y: (Math.random() - 0.5) * 400,
                  opacity: [0, 1, 0]
                }}
                transition={{
                  duration: 1.5,
                  delay: i * 0.05
                }}
              />
            ))}
          </motion.div>
        )}
      </div>
    </div>
  )
}
