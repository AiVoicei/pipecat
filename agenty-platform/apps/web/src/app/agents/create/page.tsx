'use client'

import { AgentBuilder } from '@/components/features/builder/AgentBuilder'
import { useLanguage } from '@/contexts/LanguageContext'
import { AppLayout } from '@/components/layout/AppLayout'

export default function CreateAgentPage() {
  const { t } = useLanguage()

  return (
    <AppLayout>
      <div className="h-[calc(100vh-4rem)]">
        <AgentBuilder />
      </div>
    </AppLayout>
  )
}