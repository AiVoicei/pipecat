'use client'

import { AppLayout } from '@/components/layout/AppLayout'
import { AnalyticsDashboard } from '@/components/features/analytics/AnalyticsDashboard'

export default function AnalyticsPage() {
  return (
    <AppLayout>
      <AnalyticsDashboard />
    </AppLayout>
  )
}