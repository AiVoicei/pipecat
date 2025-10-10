'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, AlertCircle, AlertTriangle, Lightbulb, XCircle } from 'lucide-react'
import { usePipelineStore, validatePipelineDetailed } from '@/stores/usePipelineStore'

export function PipelineValidationPanel() {
  const { nodes, edges } = usePipelineStore()

  const validation = useMemo(() => {
    return validatePipelineDetailed(nodes, edges)
  }, [nodes, edges])

  return (
    <Card className="w-full border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          {validation.valid ? (
            <CheckCircle className="w-5 h-5 text-green-500" />
          ) : (
            <XCircle className="w-5 h-5 text-red-500" />
          )}
          Pipeline Status
          <Badge
            variant={validation.valid ? 'default' : 'destructive'}
            className="ml-auto"
          >
            {validation.valid ? 'Valid' : 'Invalid'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Pipeline Type */}
        {validation.type && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Type:</span>
            <Badge variant="outline" className="capitalize">
              {validation.type}
            </Badge>
          </div>
        )}

        {/* Node Count */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Nodes:</span>
          <Badge variant="secondary">
            {nodes.length}
          </Badge>
        </div>

        {/* Connection Count */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Connections:</span>
          <Badge variant="secondary">
            {edges.length}
          </Badge>
        </div>

        {/* Errors */}
        {validation.errors.length > 0 && (
          <Alert variant="destructive" className="border-red-500/50 bg-red-500/10">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle className="text-sm font-semibold">
              {validation.errors.length} Error{validation.errors.length > 1 ? 's' : ''}
            </AlertTitle>
            <AlertDescription>
              <ul className="list-disc list-inside space-y-1 mt-2">
                {validation.errors.map((error, i) => (
                  <li key={i} className="text-xs leading-relaxed">{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Warnings */}
        {validation.warnings.length > 0 && (
          <Alert className="border-yellow-500/50 bg-yellow-500/10">
            <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
            <AlertTitle className="text-sm font-semibold text-yellow-800 dark:text-yellow-400">
              {validation.warnings.length} Warning{validation.warnings.length > 1 ? 's' : ''}
            </AlertTitle>
            <AlertDescription>
              <ul className="list-disc list-inside space-y-1 mt-2">
                {validation.warnings.map((warning, i) => (
                  <li key={i} className="text-xs leading-relaxed text-yellow-700 dark:text-yellow-300">
                    {warning}
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Suggestions */}
        {validation.suggestions.length > 0 && (
          <Alert className="border-blue-500/50 bg-blue-500/10">
            <Lightbulb className="h-4 w-4 text-blue-600 dark:text-blue-500" />
            <AlertTitle className="text-sm font-semibold text-blue-800 dark:text-blue-400">
              {validation.suggestions.length} Suggestion{validation.suggestions.length > 1 ? 's' : ''}
            </AlertTitle>
            <AlertDescription>
              <ul className="list-disc list-inside space-y-1 mt-2">
                {validation.suggestions.map((suggestion, i) => (
                  <li key={i} className="text-xs leading-relaxed text-blue-700 dark:text-blue-300">
                    {suggestion}
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Success State */}
        {validation.valid && validation.errors.length === 0 && (
          <Alert className="border-green-500/50 bg-green-500/10">
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-500" />
            <AlertTitle className="text-sm font-semibold text-green-800 dark:text-green-400">
              Pipeline Ready
            </AlertTitle>
            <AlertDescription className="text-xs text-green-700 dark:text-green-300 mt-1">
              Your pipeline is properly configured and ready to deploy.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
