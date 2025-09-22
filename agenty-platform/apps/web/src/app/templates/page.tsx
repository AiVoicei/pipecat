'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Star, Users, Zap, Play, Eye, Download } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useLanguage } from '@/contexts/LanguageContext'
import { useTemplateStore, Template } from '@/stores/useTemplateStore'
import { useAgentStore } from '@/stores/useAgentStore'
import { AppLayout } from '@/components/layout/AppLayout'

export default function TemplatesPage() {
  const { t } = useLanguage()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('popular')

  const {
    templates,
    categories,
    isLoading,
    error,
    fetchTemplates,
    getTemplatesByCategory,
    getPopularTemplates,
    searchTemplates
  } = useTemplateStore()

  const { createAgent } = useAgentStore()

  useEffect(() => {
    fetchTemplates()
  }, [fetchTemplates])

  const getFilteredTemplates = () => {
    let filtered = templates

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = searchTemplates(searchQuery)
    }

    // Apply category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(template => template.category === categoryFilter)
    }

    // Apply sorting
    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'popular':
          return b.usageCount - a.usageCount
        case 'rating':
          return b.rating - a.rating
        case 'recent':
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        default:
          return b.usageCount - a.usageCount
      }
    })
  }

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

  const handleUseTemplate = async (template: Template) => {
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

  const popularTemplates = getPopularTemplates()
  const filteredTemplates = getFilteredTemplates()

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-8 w-64 bg-muted rounded mb-2"></div>
            <div className="h-4 w-96 bg-muted/50 rounded"></div>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-64 bg-muted rounded-lg"></div>
              </div>
            ))}
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">{t('agentTemplates', 'templates')}</h1>
        <p className="text-muted-foreground mt-1">
          {t('chooseTemplate', 'templates')}
        </p>
      </div>

      {/* Popular Templates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            {t('popularTemplates', 'templates')}
          </CardTitle>
          <CardDescription>
            {t('mostUsedTemplates', 'templates')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {popularTemplates.map((template) => (
              <div
                key={template.id}
                className="flex items-center gap-3 p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                onClick={() => handleUseTemplate(template)}
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Star className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{template.name}</span>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      {template.rating}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      {getCategoryName(template.category)}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {template.usageCount} uses
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('searchTemplates', 'templates')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder={t('filterByCategory', 'templates')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('allCategories', 'templates')}</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {getCategoryName(category)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder={t('sortBy', 'templates')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="popular">{t('popular', 'templates')}</SelectItem>
            <SelectItem value="rating">{t('rating', 'templates')}</SelectItem>
            <SelectItem value="recent">{t('recent', 'templates')}</SelectItem>
            <SelectItem value="name">{t('name', 'templates')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Category Tabs */}
      <Tabs value={categoryFilter === 'all' ? 'all' : categoryFilter} onValueChange={setCategoryFilter}>
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
          <TabsTrigger value="all">{t('all', 'templates')}</TabsTrigger>
          {categories.slice(0, 7).map((category) => (
            <TabsTrigger key={category} value={category} className="hidden sm:flex">
              {getCategoryName(category)}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={categoryFilter} className="mt-6">
          {filteredTemplates.length === 0 ? (
            <Card className="p-8 text-center">
              <Search className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {t('noTemplatesFound', 'templates')}
              </h3>
              <p className="text-muted-foreground mb-4">
                {t('tryAdjustingFilters', 'templates')}
              </p>
              <Button onClick={() => { setSearchQuery(''); setCategoryFilter('all') }}>
                {t('clearFilters', 'templates')}
              </Button>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredTemplates.map((template) => (
                <Card key={template.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CardTitle className="text-lg line-clamp-1">{template.name}</CardTitle>
                          <Badge variant="secondary">
                            {getCategoryName(template.category)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm text-muted-foreground">{template.rating}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="w-3 h-3 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">{template.usageCount}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <CardDescription className="line-clamp-2">
                      {template.description}
                    </CardDescription>

                    {/* Configuration Info */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span><strong>STT:</strong> {template.configuration.stt.provider}</span>
                        <span><strong>LLM:</strong> {template.configuration.llm.provider}</span>
                        <span><strong>TTS:</strong> {template.configuration.tts.provider}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Zap className="w-3 h-3" />
                        <span>{template.deploymentOptions.join(', ')}</span>
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1">
                      {template.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {template.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{template.tags.length - 3}
                        </Badge>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleUseTemplate(template)}
                        className="flex-1"
                      >
                        <Download className="w-3 h-3 mr-2" />
                        {t('useTemplate', 'templates')}
                      </Button>
                      <Button variant="outline" size="sm" disabled>
                        <Eye className="w-3 h-3" />
                      </Button>
                      <Button variant="outline" size="sm" disabled>
                        <Play className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
      </div>
    </AppLayout>
  )
}