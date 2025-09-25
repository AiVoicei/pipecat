'use client'

import { PipelineBuilder } from '@/components/features/builder/PipelineBuilder'
import { useLanguage } from '@/contexts/LanguageContext'
import { AppLayout } from '@/components/layout/AppLayout'

export default function BuilderPage() {
  const { t } = useLanguage()

  return (
    <AppLayout>
      <div className="h-[calc(100vh-4rem)]">
        <PipelineBuilder />
      </div>
    </AppLayout>
  )
}