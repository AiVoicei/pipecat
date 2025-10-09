'use client'

import { PipelineBuilder } from '@/components/features/builder/PipelineBuilder'
import { useLanguage } from '@/contexts/LanguageContext'
import { AppLayout } from '@/components/layout/AppLayout'

export default function BuilderPage() {
  const { t } = useLanguage()

  return (
    <AppLayout className="p-0 overflow-hidden">
      <div className="h-full">
        <PipelineBuilder />
      </div>
    </AppLayout>
  )
}