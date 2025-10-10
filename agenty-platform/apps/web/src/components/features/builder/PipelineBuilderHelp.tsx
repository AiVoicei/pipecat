'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { HelpCircle, Zap, ArrowRight, X, Keyboard, AlertCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export function PipelineBuilderHelp() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative animate-pulse hover:animate-none"
        >
          <div className="absolute inset-0 rounded-md bg-purple-500/20 animate-ping" />
          <HelpCircle className="w-5 h-5 text-purple-500 relative z-10" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-purple-500" />
            Pipeline Builder Help
          </DialogTitle>
          <DialogDescription>
            Learn how to build valid pipelines with the visual builder
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="patterns" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="patterns">Patterns</TabsTrigger>
            <TabsTrigger value="connections">Connections</TabsTrigger>
            <TabsTrigger value="shortcuts">Shortcuts</TabsTrigger>
            <TabsTrigger value="errors">Errors</TabsTrigger>
          </TabsList>

          {/* Valid Patterns Tab */}
          <TabsContent value="patterns" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  Pattern 1: Realtime Pipeline
                </CardTitle>
                <CardDescription>
                  Single-node speech-to-speech conversation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 p-3 bg-white/5 rounded-lg border border-white/10">
                  <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">REALTIME</Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  <p><strong>Requirements:</strong></p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Exactly 1 Realtime node</li>
                    <li>NO other nodes allowed</li>
                    <li>NO connections allowed</li>
                  </ul>
                </div>
                <div className="text-sm">
                  <strong>Providers:</strong> OpenAI Realtime, Gemini 2.0 Flash Live
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <ArrowRight className="w-5 h-5 text-purple-500" />
                  Pattern 2: Traditional Pipeline
                </CardTitle>
                <CardDescription>
                  Standard three-stage voice AI pipeline
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 p-3 bg-white/5 rounded-lg border border-white/10">
                  <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/30">STT</Badge>
                  <ArrowRight className="w-4 h-4 text-purple-500" />
                  <Badge className="bg-green-500/20 text-green-500 border-green-500/30">LLM</Badge>
                  <ArrowRight className="w-4 h-4 text-purple-500" />
                  <Badge className="bg-purple-500/20 text-purple-500 border-purple-500/30">TTS</Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  <p><strong>Requirements:</strong></p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Exactly 1 STT node (Speech-to-Text)</li>
                    <li>Exactly 1 LLM node (Language Model)</li>
                    <li>Exactly 1 TTS node (Text-to-Speech)</li>
                    <li>Connected in sequence: STT → LLM → TTS</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Pattern 3: Enhanced Pipeline
                </CardTitle>
                <CardDescription>
                  Traditional pipeline with filters or aggregators
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 p-3 bg-white/5 rounded-lg border border-white/10 flex-wrap">
                  <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/30">STT</Badge>
                  <ArrowRight className="w-4 h-4 text-purple-500" />
                  <Badge className="bg-gray-500/20 text-gray-500 border-gray-500/30">FILTER</Badge>
                  <ArrowRight className="w-4 h-4 text-purple-500" />
                  <Badge className="bg-green-500/20 text-green-500 border-green-500/30">LLM</Badge>
                  <ArrowRight className="w-4 h-4 text-purple-500" />
                  <Badge className="bg-purple-500/20 text-purple-500 border-purple-500/30">TTS</Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  <p><strong>Use Cases:</strong></p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Wake word detection before LLM</li>
                    <li>Content filtering before speech output</li>
                    <li>Context accumulation for better responses</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Connections Tab */}
          <TabsContent value="connections" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Valid Connections</CardTitle>
                <CardDescription>What each node type can connect to</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                    <div className="font-medium text-sm mb-2 flex items-center gap-2">
                      <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/30">STT</Badge>
                      can connect to:
                    </div>
                    <div className="flex gap-2 flex-wrap ml-2">
                      <Badge variant="outline">LLM</Badge>
                      <Badge variant="outline">Filter</Badge>
                      <Badge variant="outline">Aggregator</Badge>
                    </div>
                  </div>

                  <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                    <div className="font-medium text-sm mb-2 flex items-center gap-2">
                      <Badge className="bg-green-500/20 text-green-500 border-green-500/30">LLM</Badge>
                      can connect to:
                    </div>
                    <div className="flex gap-2 flex-wrap ml-2">
                      <Badge variant="outline">TTS</Badge>
                      <Badge variant="outline">Filter</Badge>
                      <Badge variant="outline">Aggregator</Badge>
                    </div>
                  </div>

                  <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                    <div className="font-medium text-sm mb-2 flex items-center gap-2">
                      <Badge className="bg-purple-500/20 text-purple-500 border-purple-500/30">TTS</Badge>
                      can connect to:
                    </div>
                    <div className="flex gap-2 flex-wrap ml-2">
                      <Badge variant="outline">Nothing (terminal node)</Badge>
                    </div>
                  </div>

                  <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                    <div className="font-medium text-sm mb-2 flex items-center gap-2">
                      <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">REALTIME</Badge>
                      can connect to:
                    </div>
                    <div className="flex gap-2 flex-wrap ml-2">
                      <Badge variant="outline">Nothing (standalone)</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-red-500">Invalid Connections</CardTitle>
                <CardDescription>These connections are not allowed</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-red-400">
                    <X className="w-4 h-4" />
                    <span>Same type to same type (STT → STT, LLM → LLM, etc.)</span>
                  </div>
                  <div className="flex items-center gap-2 text-red-400">
                    <X className="w-4 h-4" />
                    <span>Realtime to/from any node</span>
                  </div>
                  <div className="flex items-center gap-2 text-red-400">
                    <X className="w-4 h-4" />
                    <span>Wrong order (TTS → LLM, LLM → STT)</span>
                  </div>
                  <div className="flex items-center gap-2 text-red-400">
                    <X className="w-4 h-4" />
                    <span>Circular connections (creates loops)</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Keyboard Shortcuts Tab */}
          <TabsContent value="shortcuts" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Keyboard className="w-5 h-5" />
                  Keyboard Shortcuts
                </CardTitle>
                <CardDescription>Speed up your workflow with these shortcuts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                    <span className="text-sm">Delete selected node or connection</span>
                    <kbd className="px-2 py-1 bg-white/10 rounded text-xs border border-white/20">Delete</kbd>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                    <span className="text-sm">Select multiple nodes</span>
                    <div className="flex gap-1">
                      <kbd className="px-2 py-1 bg-white/10 rounded text-xs border border-white/20">Shift</kbd>
                      <span>+ Click</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                    <span className="text-sm">Delete multiple selected nodes</span>
                    <div className="flex gap-1">
                      <kbd className="px-2 py-1 bg-white/10 rounded text-xs border border-white/20">Shift</kbd>
                      <span>+ Select +</span>
                      <kbd className="px-2 py-1 bg-white/10 rounded text-xs border border-white/20">Delete</kbd>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                    <span className="text-sm">Click bin icon to delete selection</span>
                    <kbd className="px-2 py-1 bg-white/10 rounded text-xs border border-white/20">🗑️ Bottom Right</kbd>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                    <span className="text-sm">Deselect node</span>
                    <kbd className="px-2 py-1 bg-white/10 rounded text-xs border border-white/20">Esc</kbd>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                    <span className="text-sm">Save pipeline</span>
                    <div className="flex gap-1">
                      <kbd className="px-2 py-1 bg-white/10 rounded text-xs border border-white/20">Ctrl</kbd>
                      <span>+</span>
                      <kbd className="px-2 py-1 bg-white/10 rounded text-xs border border-white/20">S</kbd>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Common Errors Tab */}
          <TabsContent value="errors" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  Common Errors & Solutions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <div className="font-medium text-sm text-red-400 mb-2">
                    "Cannot connect STT to STT"
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <strong>Solution:</strong> Each node type should appear once in the main pipeline. Connect STT → LLM instead.
                  </div>
                </div>

                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <div className="font-medium text-sm text-red-400 mb-2">
                    "Realtime nodes work independently"
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <strong>Solution:</strong> Remove all other nodes. Realtime nodes handle STT+LLM+TTS internally.
                  </div>
                </div>

                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <div className="font-medium text-sm text-red-400 mb-2">
                    "Missing TTS (Text-to-Speech) node"
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <strong>Solution:</strong> Add a TTS node and connect: LLM → TTS
                  </div>
                </div>

                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <div className="font-medium text-sm text-red-400 mb-2">
                    "This connection would create a circular dependency"
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <strong>Solution:</strong> Remove the connection creating the loop. Pipelines must flow in one direction.
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-4 p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
          <p className="text-sm">
            <strong>Need more help?</strong> Check the validation panel on the right side for real-time feedback about your pipeline.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
