'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Zap, Mic, Brain, Volume2, Filter as FilterIcon } from 'lucide-react'
import { usePipelineStore, PIPELINE_TEMPLATES } from '@/stores/usePipelineStore'

export function PipelineTemplateSelector() {
  const { loadTemplate } = usePipelineStore()
  const [isOpen, setIsOpen] = useState(false)

  const handleTemplateSelect = (templateId: string) => {
    loadTemplate(templateId)
    setIsOpen(false)
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'realtime':
        return <Zap className="w-4 h-4 text-yellow-500" />
      case 'traditional':
        return <Brain className="w-4 h-4 text-purple-500" />
      case 'enhanced':
        return <FilterIcon className="w-4 h-4 text-blue-500" />
      default:
        return null
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'realtime':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
      case 'traditional':
        return 'bg-purple-500/10 text-purple-500 border-purple-500/20'
      case 'enhanced':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20'
    }
  }

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'stt':
        return <Mic className="w-3 h-3" />
      case 'llm':
        return <Brain className="w-3 h-3" />
      case 'tts':
        return <Volume2 className="w-3 h-3" />
      case 'realtime':
        return <Zap className="w-3 h-3" />
      case 'filter':
        return <FilterIcon className="w-3 h-3" />
      default:
        return null
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-purple-500/20 hover:border-purple-500/40 transition-all"
        >
          <Zap className="w-4 h-4 mr-2" />
          Quick Start Templates
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Zap className="w-6 h-6 text-purple-500" />
            Quick Start Templates
          </DialogTitle>
          <DialogDescription className="text-base">
            Choose a pre-built pipeline template to get started quickly. All templates are production-ready and follow Pipecat best practices.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 mt-4">
          {PIPELINE_TEMPLATES.map(template => (
            <Card
              key={template.id}
              className="cursor-pointer hover:border-purple-500/40 hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-200 group"
              onClick={() => handleTemplateSelect(template.id)}
            >
              <CardHeader className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2 group-hover:text-purple-500 transition-colors">
                      {getTypeIcon(template.type)}
                      {template.name}
                    </CardTitle>
                  </div>
                  <Badge variant="outline" className={getTypeColor(template.type)}>
                    {template.type}
                  </Badge>
                </div>
                <CardDescription className="text-sm">
                  {template.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {template.nodes.map((node, i) => (
                    <Badge
                      key={i}
                      variant="secondary"
                      className="text-xs flex items-center gap-1 bg-white/5 border-white/10"
                    >
                      {getNodeIcon(node.type!)}
                      {node.type?.toUpperCase()}
                    </Badge>
                  ))}
                </div>
                <div className="mt-3 text-xs text-muted-foreground">
                  {template.nodes.length} node{template.nodes.length !== 1 ? 's' : ''} • {template.edges.length} connection{template.edges.length !== 1 ? 's' : ''}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <p className="text-sm text-blue-400">
            <strong>Quick Start:</strong> Templates come with providers and settings pre-configured. Click each node to review settings, then ensure API keys are added in Provider Settings before testing.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
