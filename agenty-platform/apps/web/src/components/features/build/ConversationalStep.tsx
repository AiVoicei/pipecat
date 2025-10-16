'use client'

import { ReactNode } from 'react'

interface ConversationalStepProps {
  children: ReactNode
  show: boolean
  direction?: 'left' | 'right'
  onComplete?: () => void
}

export function ConversationalStep({
  children,
  show,
  direction = 'right',
  onComplete
}: ConversationalStepProps) {
  if (!show) return null

  return (
    <div className="w-full animate-in fade-in duration-300">
      {children}
    </div>
  )
}
