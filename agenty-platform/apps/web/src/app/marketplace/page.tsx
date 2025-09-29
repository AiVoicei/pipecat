'use client'

import { AppLayout } from '@/components/layout/AppLayout'
import { AgentMarketplace } from '@/components/features/marketplace/AgentMarketplace'

export default function MarketplacePage() {
  return (
    <AppLayout>
      <AgentMarketplace />
    </AppLayout>
  )
}