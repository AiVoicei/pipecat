'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Lightbulb, Mic, Brain, Volume2, Zap, Trash2, Plus } from 'lucide-react'
import { usePipelineStore } from '@/stores/usePipelineStore'

interface Suggestion {
  title: string
  description: string
  action: () => void
  icon: React.ComponentType<{ className?: string }>
  variant?: 'default' | 'destructive' | 'outline'
}

export function SmartSuggestionsPanel() {
  const { nodes, addNode, removeNode } = usePipelineStore()

  const suggestions = useMemo(() => {
    const hasSTT = nodes.some(n => n.data.type === 'stt')
    const hasLLM = nodes.some(n => n.data.type === 'llm')
    const hasTTS = nodes.some(n => n.data.type === 'tts')
    const hasRealtime = nodes.some(n => n.data.type === 'realtime')
    const sttNodes = nodes.filter(n => n.data.type === 'stt')
    const llmNodes = nodes.filter(n => n.data.type === 'llm')
    const ttsNodes = nodes.filter(n => n.data.type === 'tts')
    const realtimeNodes = nodes.filter(n => n.data.type === 'realtime')

    const suggestions: Suggestion[] = []

    // Empty pipeline suggestions
    if (nodes.length === 0) {
      suggestions.push({
        title: 'Start with STT',
        description: 'Add a speech-to-text node to process user audio',
        action: () => addNode('stt', { x: 100, y: 200 }),
        icon: Mic
      })
      suggestions.push({
        title: 'Start with Realtime',
        description: 'Use a single realtime node for speech-to-speech',
        action: () => addNode('realtime', { x: 300, y: 200 }),
        icon: Zap
      })
      return suggestions
    }

    // Realtime pipeline suggestions
    if (hasRealtime) {
      // Remove other nodes
      if (sttNodes.length > 0 || llmNodes.length > 0 || ttsNodes.length > 0) {
        suggestions.push({
          title: 'Remove other nodes',
          description: 'Realtime nodes work independently - remove STT/LLM/TTS',
          action: () => {
            sttNodes.forEach(n => removeNode(n.id))
            llmNodes.forEach(n => removeNode(n.id))
            ttsNodes.forEach(n => removeNode(n.id))
          },
          icon: Trash2,
          variant: 'destructive'
        })
      }

      // Remove duplicate realtime nodes
      if (realtimeNodes.length > 1) {
        suggestions.push({
          title: 'Remove extra realtime nodes',
          description: `Only one realtime node is allowed (found ${realtimeNodes.length})`,
          action: () => {
            // Keep first, remove others
            realtimeNodes.slice(1).forEach(n => removeNode(n.id))
          },
          icon: Trash2,
          variant: 'destructive'
        })
      }

      return suggestions
    }

    // Traditional pipeline suggestions
    if (!hasSTT) {
      suggestions.push({
        title: 'Add STT Node',
        description: 'Missing speech-to-text input',
        action: () => addNode('stt', { x: 100, y: 200 }),
        icon: Mic
      })
    }

    if (hasSTT && !hasLLM) {
      suggestions.push({
        title: 'Add LLM Node',
        description: 'Connect language model for intelligence',
        action: () => {
          const sttNode = sttNodes[0]
          const xPos = sttNode?.position.x ? sttNode.position.x + 280 : 380
          addNode('llm', { x: xPos, y: 200 })
        },
        icon: Brain
      })
    }

    if (hasSTT && hasLLM && !hasTTS) {
      suggestions.push({
        title: 'Add TTS Node',
        description: 'Generate voice responses',
        action: () => {
          const llmNode = llmNodes[0]
          const xPos = llmNode?.position.x ? llmNode.position.x + 280 : 660
          addNode('tts', { x: xPos, y: 200 })
        },
        icon: Volume2
      })
    }

    // Duplicate node warnings
    if (sttNodes.length > 1) {
      suggestions.push({
        title: 'Remove duplicate STT',
        description: `Found ${sttNodes.length} STT nodes - only one is needed`,
        action: () => {
          // Keep first, remove others
          sttNodes.slice(1).forEach(n => removeNode(n.id))
        },
        icon: Trash2,
        variant: 'outline'
      })
    }

    if (llmNodes.length > 1) {
      suggestions.push({
        title: 'Remove duplicate LLM',
        description: `Found ${llmNodes.length} LLM nodes - only one is needed`,
        action: () => {
          llmNodes.slice(1).forEach(n => removeNode(n.id))
        },
        icon: Trash2,
        variant: 'outline'
      })
    }

    if (ttsNodes.length > 1) {
      suggestions.push({
        title: 'Remove duplicate TTS',
        description: `Found ${ttsNodes.length} TTS nodes - only one is needed`,
        action: () => {
          ttsNodes.slice(1).forEach(n => removeNode(n.id))
        },
        icon: Trash2,
        variant: 'outline'
      })
    }

    return suggestions
  }, [nodes, addNode, removeNode])

  if (suggestions.length === 0) return null

  return (
    <Card className="w-full bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-yellow-500" />
          Smart Suggestions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {suggestions.map((suggestion, i) => {
          const Icon = suggestion.icon
          return (
            <Button
              key={i}
              variant={suggestion.variant || 'outline'}
              className="w-full justify-start text-left h-auto py-3 px-4 whitespace-normal"
              onClick={suggestion.action}
            >
              <Icon className="w-4 h-4 mr-3 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm break-words whitespace-normal">{suggestion.title}</div>
                <div className="text-xs text-muted-foreground mt-1 break-words whitespace-normal">
                  {suggestion.description}
                </div>
              </div>
            </Button>
          )
        })}
      </CardContent>
    </Card>
  )
}
