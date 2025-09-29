'use client'

import React from 'react'

const FunctionIcon = ({ className = "w-4 h-4" }: { className?: string }) => {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 12h6" />
      <path d="M9 6h6" />
      <path d="M9 18h6" />
      <path d="M5 6v12" />
      <path d="M19 6v12" />
      <rect x="3" y="4" width="18" height="16" rx="2" />
    </svg>
  )
}

export default FunctionIcon