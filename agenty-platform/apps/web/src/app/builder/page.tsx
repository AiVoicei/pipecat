'use client'

import { useEffect } from 'react'
import { PipelineBuilder } from '@/components/features/builder/PipelineBuilder'
import { usePipelineStore } from '@/stores/usePipelineStore'
import { useLanguage } from '@/contexts/LanguageContext'
import { AppLayout } from '@/components/layout/AppLayout'

export default function BuilderPage() {
  const { t } = useLanguage()
  const { createPipeline, currentPipeline } = usePipelineStore()

  useEffect(() => {
    // Create a default pipeline if none exists
    if (!currentPipeline) {
      createPipeline(
        t('newPipeline', 'builder'),
        t('defaultPipelineDescription', 'builder')
      )
    }
  }, [currentPipeline, createPipeline, t])

  return (
    <AppLayout>
      <div className="h-[calc(100vh-12rem)]">
        <PipelineBuilder />
      </div>
    </AppLayout>
  )
}