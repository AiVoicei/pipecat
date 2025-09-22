'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Star, Users, Download, Play, Settings, Zap, Globe, FileText } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useLanguage } from '@/contexts/LanguageContext'
import { useTemplateStore, Template } from '@/stores/useTemplateStore'
import { useAgentStore } from '@/stores/useAgentStore'
import Link from 'next/link'
import { AppLayout } from '@/components/layout/AppLayout'

export default function TemplateDetailPage() {
  const { t } = useLanguage()
  const params = useParams()
  const router = useRouter()
  const templateId = params.id as string

  const { templates, isLoading, error, fetchTemplates } = useTemplateStore()
  const { createAgent } = useAgentStore()

  const [template, setTemplate] = useState<Template | null>(null)

  useEffect(() => {
    if (templates.length === 0) {
      fetchTemplates()
    } else {
      const foundTemplate = templates.find(t => t.id === templateId)
      setTemplate(foundTemplate || null)
    }
  }, [templateId, templates, fetchTemplates])

  useEffect(() => {
    if (templates.length > 0) {
      const foundTemplate = templates.find(t => t.id === templateId)
      setTemplate(foundTemplate || null)
    }
  }, [templateId, templates])

  const getCategoryName = (category: string) => {
    const categoryNames: Record<string, string> = {
      customer_service: t('customerService', 'templates'),
      sales: t('sales', 'templates'),
      hospitality: t('hospitality', 'templates'),
      ecommerce: t('ecommerce', 'templates'),
      healthcare: t('healthcare', 'templates'),
      education: t('education', 'templates'),
      finance: t('finance', 'templates'),
      general: t('general', 'templates')
    }
    return categoryNames[category] || category
  }

  const handleUseTemplate = async () => {
    if (!template) return

    try {
      const newAgent = await createAgent({
        name: `${template.name} (from template)`,
        description: template.description,
        templateId: template.id,
        configuration: template.configuration,
        deploymentConfig: {
          type: (template.deploymentOptions[0] as 'webrtc' | 'phone' | 'whatsapp' | 'api') || 'webrtc'
        }
      })
      router.push(`/agents/${newAgent.id}`)
    } catch (error) {
      console.error('Failed to create agent from template:', error)
    }
  }

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 w-64 bg-muted rounded mb-2"></div>
          <div className="h-4 w-96 bg-muted/50 rounded"></div>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-64 bg-muted rounded-lg"></div>
            </div>
          ))}
        </div>
      </AppLayout>
    )
  }

  if (!template) {
    return (
      <AppLayout>
        <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/templates">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('back', 'common')}
            </Link>
          </Button>
          <h1 className="text-3xl font-bold text-foreground">{t('templateNotFound', 'templates')}</h1>
        </div>
        <Card className="p-8 text-center">
          <h3 className="text-lg font-semibold mb-2">{t('templateNotFound', 'templates')}</h3>
          <p className="text-muted-foreground mb-4">{t('templateNotFoundDesc', 'templates')}</p>
          <Button asChild>
            <Link href="/templates">{t('backToTemplates', 'templates')}</Link>
          </Button>
        </Card>
      </AppLayout>
    )
  }

  if (error) {
    return (
      <AppLayout>
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">{error}</p>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/templates">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('back', 'common')}
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-foreground">{template.name}</h1>
          <div className="flex items-center gap-3 mt-2">
            <Badge variant="secondary">
              {getCategoryName(template.category)}
            </Badge>
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="font-medium">{template.rating}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">{template.usageCount} {t('uses', 'templates')}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" disabled>
            <Play className="w-4 h-4 mr-2" />
            {t('preview', 'templates')}
          </Button>
          <Button onClick={handleUseTemplate}>
            <Download className="w-4 h-4 mr-2" />
            {t('useTemplate', 'templates')}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Template Preview */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>{t('preview', 'templates')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-video relative bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg flex items-center justify-center">
                <div className="text-center space-y-3">
                  <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
                    <FileText className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{template.name}</h3>
                    <p className="text-sm text-muted-foreground">{getCategoryName(template.category)} Template</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>{t('description', 'templates')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                {template.description}
              </p>
            </CardContent>
          </Card>

          {/* Configuration Details */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>{t('configuration', 'templates')}</CardTitle>
              <CardDescription>
                {t('aiConfiguration', 'templates')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* STT Configuration */}
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  {t('speechToText', 'agents')}
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">{t('provider', 'agents')}: </span>
                    <span className="font-medium">{template.configuration.stt.provider}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t('model', 'agents')}: </span>
                    <span className="font-medium">{template.configuration.stt.model}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t('language', 'agents')}: </span>
                    <span className="font-medium">{template.configuration.stt.language}</span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* LLM Configuration */}
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  {t('languageModel', 'agents')}
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">{t('provider', 'agents')}: </span>
                    <span className="font-medium">{template.configuration.llm.provider}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t('model', 'agents')}: </span>
                    <span className="font-medium">{template.configuration.llm.model}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t('temperature', 'agents')}: </span>
                    <span className="font-medium">{template.configuration.llm.temperature}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t('maxTokens', 'agents')}: </span>
                    <span className="font-medium">{template.configuration.llm.maxTokens}</span>
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-muted-foreground text-sm">{t('systemPrompt', 'agents')}: </span>
                  <div className="mt-1 p-3 bg-muted rounded-lg">
                    <pre className="text-sm whitespace-pre-wrap font-mono">
                      {template.configuration.llm.systemPrompt}
                    </pre>
                  </div>
                </div>
              </div>

              <Separator />

              {/* TTS Configuration */}
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                  {t('textToSpeech', 'agents')}
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">{t('provider', 'agents')}: </span>
                    <span className="font-medium">{template.configuration.tts.provider}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t('voice', 'agents')}: </span>
                    <span className="font-medium">{template.configuration.tts.voice}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Template Info */}
          <Card>
            <CardHeader>
              <CardTitle>{t('templateInfo', 'templates')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-1">{t('category', 'templates')}</h4>
                <p className="font-medium">{getCategoryName(template.category)}</p>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-1">{t('deploymentOptions', 'templates')}</h4>
                <div className="flex flex-wrap gap-1">
                  {template.deploymentOptions.map((option) => (
                    <Badge key={option} variant="outline" className="text-xs">
                      <Zap className="w-3 h-3 mr-1" />
                      {option.toUpperCase()}
                    </Badge>
                  ))}
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-1">{t('tags', 'templates')}</h4>
                <div className="flex flex-wrap gap-1">
                  {template.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-1">{t('createdBy', 'templates')}</h4>
                <p className="font-medium">{template.createdBy}</p>
              </div>

              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-1">{t('lastUpdated', 'templates')}</h4>
                <p className="text-sm">{new Date(template.updatedAt).toLocaleDateString()}</p>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>{t('actions', 'templates')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button onClick={handleUseTemplate} className="w-full">
                <Download className="w-4 h-4 mr-2" />
                {t('useTemplate', 'templates')}
              </Button>
              <Button variant="outline" className="w-full" disabled>
                <Play className="w-4 h-4 mr-2" />
                {t('previewTemplate', 'templates')}
              </Button>
              <Button variant="outline" className="w-full" disabled>
                <Settings className="w-4 h-4 mr-2" />
                {t('customizeTemplate', 'templates')}
              </Button>
            </CardContent>
          </Card>

          {/* Similar Templates */}
          <Card>
            <CardHeader>
              <CardTitle>{t('similarTemplates', 'templates')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* This would be populated with similar templates */}
                <p className="text-sm text-muted-foreground text-center py-4">
                  {t('noSimilarTemplates', 'templates')}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  )
}