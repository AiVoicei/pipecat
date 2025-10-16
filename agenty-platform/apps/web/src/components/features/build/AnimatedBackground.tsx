'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

interface Particle {
  id: number
  x: number
  y: number
  size: number
  duration: number
  delay: number
}

interface AnimatedBackgroundProps {
  variant?: 'default' | 'space' | 'celebration'
}

export function AnimatedBackground({ variant = 'default' }: AnimatedBackgroundProps) {
  const [particles, setParticles] = useState<Particle[]>([])

  useEffect(() => {
    const particleCount = variant === 'celebration' ? 50 : 20
    const newParticles: Particle[] = Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: variant === 'celebration' ? Math.random() * 4 + 2 : Math.random() * 3 + 1,
      duration: Math.random() * 10 + 10,
      delay: Math.random() * 5
    }))
    setParticles(newParticles)
  }, [variant])

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Animated Gradient Mesh */}
      <div className="absolute inset-0">
        <motion.div
          className="absolute inset-0 opacity-30"
          animate={{
            background: [
              'radial-gradient(circle at 0% 0%, rgba(139, 92, 246, 0.3) 0%, transparent 50%)',
              'radial-gradient(circle at 100% 100%, rgba(192, 132, 252, 0.3) 0%, transparent 50%)',
              'radial-gradient(circle at 0% 100%, rgba(139, 92, 246, 0.3) 0%, transparent 50%)',
              'radial-gradient(circle at 100% 0%, rgba(192, 132, 252, 0.3) 0%, transparent 50%)',
              'radial-gradient(circle at 0% 0%, rgba(139, 92, 246, 0.3) 0%, transparent 50%)'
            ]
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'linear'
          }}
        />

        {variant === 'space' && (
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 2 }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(16,185,129,0.15)_0%,_transparent_50%)]" />
          </motion.div>
        )}
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0">
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className={`absolute rounded-full ${
              variant === 'celebration'
                ? 'bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400'
                : variant === 'space'
                ? 'bg-white'
                : 'bg-purple-400/40'
            }`}
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`
            }}
            animate={{
              y: [0, -30, 0],
              x: [0, Math.random() * 20 - 10, 0],
              opacity: variant === 'space' ? [0.3, 1, 0.3] : [0.2, 0.8, 0.2],
              scale: variant === 'celebration' ? [1, 1.5, 1] : [1, 1.2, 1]
            }}
            transition={{
              duration: particle.duration,
              repeat: Infinity,
              delay: particle.delay,
              ease: 'easeInOut'
            }}
          />
        ))}
      </div>

      {/* Ambient Glow */}
      {variant === 'default' && (
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full"
          animate={{
            background: [
              'radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 70%)',
              'radial-gradient(circle, rgba(192, 132, 252, 0.15) 0%, transparent 70%)',
              'radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 70%)'
            ]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />
      )}

      {/* Celebration Confetti Effect */}
      {variant === 'celebration' && (
        <div className="absolute inset-0">
          {Array.from({ length: 30 }).map((_, i) => (
            <motion.div
              key={`confetti-${i}`}
              className="absolute w-2 h-2 rounded-sm"
              style={{
                left: `${Math.random() * 100}%`,
                top: '-10%',
                background: ['#8B5CF6', '#C084FC', '#10B981', '#FBBF24', '#EF4444'][i % 5]
              }}
              animate={{
                y: ['0vh', '110vh'],
                rotate: [0, Math.random() * 360],
                x: [0, Math.random() * 100 - 50]
              }}
              transition={{
                duration: Math.random() * 3 + 2,
                delay: Math.random() * 2,
                repeat: Infinity,
                ease: 'linear'
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
