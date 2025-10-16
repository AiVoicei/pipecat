'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { AgentyAvatar } from './AgentyAvatar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { CheckCircle, Sparkles, ArrowRight } from 'lucide-react'

interface SuccessCelebrationProps {
  agentName?: string
  onViewAgent: () => void
  isHebrew?: boolean
}

interface Confetti {
  id: number
  x: number
  color: string
  delay: number
  duration: number
}

export function SuccessCelebration({ agentName, onViewAgent, isHebrew }: SuccessCelebrationProps) {
  const [confetti, setConfetti] = useState<Confetti[]>([])
  const [showContent, setShowContent] = useState(false)

  useEffect(() => {
    // Generate confetti
    const colors = ['#8B5CF6', '#C084FC', '#10B981', '#FBBF24', '#EF4444', '#3B82F6']
    const newConfetti: Confetti[] = Array.from({ length: 100 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 0.5,
      duration: Math.random() * 2 + 2
    }))
    setConfetti(newConfetti)

    // Show content after brief delay
    const timer = setTimeout(() => setShowContent(true), 300)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-gradient-to-b from-[#0D0D0D] to-[#1a0a2e]">
      {/* Confetti */}
      <div className="absolute inset-0 pointer-events-none">
        {confetti.map((piece) => (
          <motion.div
            key={piece.id}
            className="absolute w-3 h-3 rounded-sm"
            style={{
              left: `${piece.x}%`,
              top: '-10%',
              backgroundColor: piece.color
            }}
            initial={{ y: 0, rotate: 0, opacity: 1 }}
            animate={{
              y: '120vh',
              rotate: Math.random() * 720,
              opacity: [1, 1, 0]
            }}
            transition={{
              duration: piece.duration,
              delay: piece.delay,
              ease: 'linear'
            }}
          />
        ))}
      </div>

      {/* Radial Glow */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
        animate={{
          background: [
            'radial-gradient(circle, rgba(139, 92, 246, 0.3) 0%, transparent 70%)',
            'radial-gradient(circle, rgba(16, 185, 129, 0.3) 0%, transparent 70%)',
            'radial-gradient(circle, rgba(139, 92, 246, 0.3) 0%, transparent 70%)'
          ]
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
      />

      {/* Main Content */}
      {showContent && (
        <motion.div
          className="relative z-10 w-full max-w-2xl px-4"
          initial={{ opacity: 0, scale: 0.8, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{
            type: 'spring',
            stiffness: 200,
            damping: 20,
            delay: 0.2
          }}
        >
          <Card className="build-glass border-2 border-purple-400/30 p-8 md:p-12 text-center space-y-8">
            {/* Success Icon */}
            <motion.div
              className="flex justify-center"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                type: 'spring',
                stiffness: 200,
                damping: 15,
                delay: 0.4
              }}
            >
              <div className="relative">
                <motion.div
                  className="absolute inset-0 rounded-full bg-green-500/30 blur-2xl"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.6, 0.3]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity
                  }}
                />
                <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
                  <CheckCircle className="w-12 h-12 text-white" />
                </div>
              </div>
            </motion.div>

            {/* Avatar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <AgentyAvatar state="celebrating" size="lg" />
            </motion.div>

            {/* Success Message */}
            <motion.div
              className="space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <h1 className="text-4xl md:text-5xl font-bold text-white flex items-center justify-center gap-3">
                <Sparkles className="w-10 h-10 text-yellow-400" />
                {isHebrew ? 'הסוכן נוצר בהצלחה!' : 'Agent Created Successfully!'}
                <Sparkles className="w-10 h-10 text-yellow-400" />
              </h1>

              {agentName && (
                <motion.p
                  className="text-2xl text-purple-200"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                >
                  {isHebrew ? 'פגוש את' : 'Meet'}{' '}
                  <span className="font-bold text-purple-300">{agentName}</span>
                </motion.p>
              )}

              <motion.p
                className="text-lg text-gray-300"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
              >
                {isHebrew
                  ? 'הסוכן שלך מוכן לפעולה! בוא נראה מה הוא יכול לעשות.'
                  : "Your agent is ready to go! Let's see what it can do."}
              </motion.p>
            </motion.div>

            {/* Stats Counter */}
            <motion.div
              className="grid grid-cols-3 gap-4 pt-6 border-t border-purple-400/20"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.4 }}
            >
              {[
                { label: isHebrew ? 'סוכנים' : 'Agents', value: '1', icon: '🤖' },
                { label: isHebrew ? 'מוכן' : 'Ready', value: '100%', icon: '✅' },
                { label: isHebrew ? 'עוצמה' : 'Power', value: 'Max', icon: '⚡' }
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  className="text-center"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    type: 'spring',
                    stiffness: 300,
                    damping: 20,
                    delay: 1.6 + i * 0.1
                  }}
                >
                  <div className="text-3xl mb-1">{stat.icon}</div>
                  <div className="text-2xl font-bold text-purple-300">{stat.value}</div>
                  <div className="text-sm text-gray-400">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>

            {/* CTA Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.8 }}
            >
              <Button
                onClick={onViewAgent}
                size="lg"
                className="w-full md:w-auto px-8 py-6 text-lg font-semibold
                  bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400
                  build-button-glow group"
              >
                {isHebrew ? 'צפה בסוכן' : 'View Your Agent'}
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </motion.div>
          </Card>
        </motion.div>
      )}
    </div>
  )
}
