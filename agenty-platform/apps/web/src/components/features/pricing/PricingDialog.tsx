'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useLanguage } from '@/contexts/LanguageContext'
import { Check, Crown, Sparkles, Zap } from 'lucide-react'

interface PricingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PricingDialog({ open, onOpenChange }: PricingDialogProps) {
  const { t } = useLanguage()
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'standard' | 'pro'>('free')

  const plans = [
    {
      id: 'free' as const,
      name: t('freePlan', 'pricing'),
      price: t('free', 'pricing'),
      description: t('freePlanDesc', 'pricing'),
      icon: Sparkles,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/30',
      features: [
        t('freeFeature1', 'pricing'), // Create up to 3 agents
        t('freeFeature2', 'pricing'), // Explore templates
        t('freeFeature3', 'pricing'), // Test demos with limitations
        t('freeFeature4', 'pricing'), // Basic analytics
        t('freeFeature5', 'pricing'), // Community support
      ],
      limitations: [
        t('freeLimitation1', 'pricing'), // Limited conversations per month
        t('freeLimitation2', 'pricing'), // Basic providers only
      ]
    },
    {
      id: 'standard' as const,
      name: t('standardPlan', 'pricing'),
      price: '$49',
      priceUnit: t('perMonth', 'pricing'),
      description: t('standardPlanDesc', 'pricing'),
      icon: Zap,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/30',
      popular: true,
      features: [
        t('standardFeature1', 'pricing'), // Unlimited agents
        t('standardFeature2', 'pricing'), // All AI providers (40+)
        t('standardFeature3', 'pricing'), // Advanced analytics
        t('standardFeature4', 'pricing'), // Priority support
        t('standardFeature5', 'pricing'), // API access
        t('standardFeature6', 'pricing'), // Team collaboration (up to 5 users)
        t('standardFeature7', 'pricing'), // Custom branding
        t('standardFeature8', 'pricing'), // 50,000 conversations/month
      ]
    },
    {
      id: 'pro' as const,
      name: t('proPlan', 'pricing'),
      price: '$149',
      priceUnit: t('perMonth', 'pricing'),
      description: t('proPlanDesc', 'pricing'),
      icon: Crown,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/30',
      features: [
        t('proFeature1', 'pricing'), // Everything in Standard
        t('proFeature2', 'pricing'), // White-label platform
        t('proFeature3', 'pricing'), // Custom domain support
        t('proFeature4', 'pricing'), // Dedicated account manager
        t('proFeature5', 'pricing'), // Agent creation assistance
        t('proFeature6', 'pricing'), // Unlimited team members
        t('proFeature7', 'pricing'), // Unlimited conversations
        t('proFeature8', 'pricing'), // SLA guarantee
        t('proFeature9', 'pricing'), // Custom integrations
        t('proFeature10', 'pricing'), // Revenue sharing options
      ]
    }
  ]

  const handleSelectPlan = (planId: 'free' | 'standard' | 'pro') => {
    setSelectedPlan(planId)
    // Here you would integrate with your payment system
    console.log('Selected plan:', planId)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            {t('choosePlan', 'pricing')}
          </DialogTitle>
          <DialogDescription className="text-center text-base">
            {t('choosePlanDesc', 'pricing')}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 md:grid-cols-3 mt-6">
          {plans.map((plan) => {
            const Icon = plan.icon
            const isPopular = plan.popular
            const isSelected = selectedPlan === plan.id

            return (
              <Card
                key={plan.id}
                className={`relative transition-all duration-200 ${
                  isSelected
                    ? 'ring-2 ring-primary shadow-lg scale-105'
                    : 'hover:shadow-md'
                } ${isPopular ? 'border-primary' : ''}`}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground px-3 py-1">
                      {t('mostPopular', 'pricing')}
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-4">
                  <div className={`w-16 h-16 mx-auto rounded-full ${plan.bgColor} flex items-center justify-center mb-4`}>
                    <Icon className={`w-8 h-8 ${plan.color}`} />
                  </div>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription className="mt-2">{plan.description}</CardDescription>
                  <div className="mt-4">
                    <div className="text-4xl font-bold text-foreground">
                      {plan.price}
                    </div>
                    {plan.priceUnit && (
                      <div className="text-sm text-muted-foreground mt-1">
                        {plan.priceUnit}
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {plan.limitations && plan.limitations.length > 0 && (
                    <div className="mb-6 p-3 rounded-lg bg-muted/50">
                      <p className="text-xs font-medium text-muted-foreground mb-2">
                        {t('limitations', 'pricing')}:
                      </p>
                      <ul className="space-y-1">
                        {plan.limitations.map((limitation, index) => (
                          <li key={index} className="text-xs text-muted-foreground">
                            • {limitation}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <Button
                    className="w-full"
                    variant={isSelected ? 'default' : 'outline'}
                    onClick={() => handleSelectPlan(plan.id)}
                  >
                    {plan.id === 'free'
                      ? t('getStarted', 'pricing')
                      : t('upgradeTo', 'pricing') + ' ' + plan.name}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>{t('pricingNote', 'pricing')}</p>
          <p className="mt-2">
            {t('needCustomPlan', 'pricing')}{' '}
            <Button variant="link" className="p-0 h-auto font-semibold text-primary">
              {t('contactUs', 'pricing')}
            </Button>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
