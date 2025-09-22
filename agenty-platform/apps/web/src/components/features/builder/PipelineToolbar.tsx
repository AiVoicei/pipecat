'use client'

import { useDraggable } from '@dnd-kit/core'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Mic,
  Brain,
  Volume2,
  Filter,
  Layers,
  Code,
  GripVertical
} from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { PipelineNodeType } from '@/stores/usePipelineStore'

interface DraggableNodeProps {
  type: PipelineNodeType
  label: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  color: string
}

function DraggableNode({ type, label, description, icon: Icon, color }: DraggableNodeProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: type,
  })

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg border-2 border-dashed border-muted-foreground/30 hover:border-muted-foreground/60 hover:bg-accent/50 cursor-grab active:cursor-grabbing transition-all',
        isDragging && 'opacity-50 rotate-3 scale-95'
      )}
    >
      <div className={cn('p-2 rounded-md text-white', color)}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm truncate">{label}</div>
        <div className="text-xs text-muted-foreground truncate">{description}</div>
      </div>
      <GripVertical className="w-4 h-4 text-muted-foreground/50" />
    </div>
  )
}

export function PipelineToolbar() {
  const { t } = useLanguage()

  const coreNodes: DraggableNodeProps[] = [
    {
      type: 'stt',
      label: t('speechToText', 'builder'),
      description: t('sttDescription', 'builder'),
      icon: Mic,
      color: 'bg-blue-500'
    },
    {
      type: 'llm',
      label: t('languageModel', 'builder'),
      description: t('llmDescription', 'builder'),
      icon: Brain,
      color: 'bg-green-500'
    },
    {
      type: 'tts',
      label: t('textToSpeech', 'builder'),
      description: t('ttsDescription', 'builder'),
      icon: Volume2,
      color: 'bg-purple-500'
    }
  ]

  const processingNodes: DraggableNodeProps[] = [
    {
      type: 'filter',
      label: t('filter', 'builder'),
      description: t('filterDescription', 'builder'),
      icon: Filter,
      color: 'bg-orange-500'
    },
    {
      type: 'aggregator',
      label: t('aggregator', 'builder'),
      description: t('aggregatorDescription', 'builder'),
      icon: Layers,
      color: 'bg-yellow-500'
    },
    {
      type: 'custom',
      label: t('customFunction', 'builder'),
      description: t('customDescription', 'builder'),
      icon: Code,
      color: 'bg-gray-500'
    }
  ]

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4 space-y-6">
        {/* Instructions */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{t('howToUse', 'builder')}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground space-y-1">
            <p>{t('dragInstructions', 'builder')}</p>
            <p>{t('connectInstructions', 'builder')}</p>
            <p>{t('configureInstructions', 'builder')}</p>
          </CardContent>
        </Card>

        {/* Core Nodes */}
        <div>
          <h3 className="text-sm font-medium mb-3 text-muted-foreground uppercase tracking-wider">
            {t('coreComponents', 'builder')}
          </h3>
          <div className="space-y-2">
            {coreNodes.map((node) => (
              <DraggableNode key={node.type} {...node} />
            ))}
          </div>
        </div>

        <Separator />

        {/* Processing Nodes */}
        <div>
          <h3 className="text-sm font-medium mb-3 text-muted-foreground uppercase tracking-wider">
            {t('processingComponents', 'builder')}
          </h3>
          <div className="space-y-2">
            {processingNodes.map((node) => (
              <DraggableNode key={node.type} {...node} />
            ))}
          </div>
        </div>

        {/* Tips */}
        <Card className="bg-muted/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              💡 {t('tips', 'builder')}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground space-y-2">
            <div className="space-y-1">
              <p>• {t('tip1', 'builder')}</p>
              <p>• {t('tip2', 'builder')}</p>
              <p>• {t('tip3', 'builder')}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}