'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/contexts/LanguageContext'
import { AppLayout } from '@/components/layout/AppLayout'
import { AgentBuilder } from '@/components/features/builder/AgentBuilder'
import Link from 'next/link'

export default function NewAgentPage() {
  const { t } = useLanguage()
  const router = useRouter()

  return (
    <AppLayout>
      <div className="h-[calc(100vh-4rem)]">
        <AgentBuilder
          onSave={(agent) => {
            console.log('Agent saved:', agent)
            router.push('/agents')
          }}
          onTest={(agent) => {
            console.log('Testing agent:', agent)
          }}
        />
      </div>
    </AppLayout>
  )
}