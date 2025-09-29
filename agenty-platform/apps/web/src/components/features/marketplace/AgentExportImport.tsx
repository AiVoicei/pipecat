'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Download,
  Upload,
  FileText,
  Share2,
  Copy,
  CheckCircle,
  AlertCircle,
  Info,
  Globe,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react'
import { useAgentStore } from '@/stores/useAgentStore'

interface ExportConfig {
  includeCredentials: boolean
  includeConversationHistory: boolean
  includeAnalytics: boolean
  includeCustomizations: boolean
  privacy: 'public' | 'unlisted' | 'private'
  license: 'mit' | 'apache' | 'gpl' | 'commercial' | 'custom'
  tags: string[]
  category: string
}

interface ImportedAgent {
  name: string
  description: string
  configuration: any
  metadata: {
    version: string
    author: string
    exportDate: string
    agencyVersion: string
  }
}

export function AgentExportImport({ agentId }: { agentId: string }) {
  const { agents, createAgent } = useAgentStore()
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export')
  const [exportConfig, setExportConfig] = useState<ExportConfig>({
    includeCredentials: false,
    includeConversationHistory: false,
    includeAnalytics: true,
    includeCustomizations: true,
    privacy: 'public',
    license: 'mit',
    tags: [],
    category: 'General'
  })
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [importData, setImportData] = useState<string>('')
  const [parsedImport, setParsedImport] = useState<ImportedAgent | null>(null)
  const [newTag, setNewTag] = useState('')

  const agent = agents.find(a => a.id === agentId)

  const categories = [
    'General',
    'Customer Service',
    'E-commerce',
    'Healthcare',
    'Education',
    'Finance',
    'Entertainment',
    'Productivity'
  ]

  const licenses = [
    { value: 'mit', label: 'MIT License', description: 'Free to use, modify, and distribute' },
    { value: 'apache', label: 'Apache 2.0', description: 'Free with patent protection' },
    { value: 'gpl', label: 'GPL v3', description: 'Free but derivatives must be open source' },
    { value: 'commercial', label: 'Commercial', description: 'Requires purchase for commercial use' },
    { value: 'custom', label: 'Custom License', description: 'Custom terms and conditions' }
  ]

  const handleExport = async () => {
    if (!agent) return

    setIsExporting(true)
    try {
      // Create export package
      const exportPackage = {
        name: agent.name,
        description: agent.description,
        configuration: {
          ...agent.configuration,
          // Remove credentials if not included
          ...(exportConfig.includeCredentials ? {} : {
            stt: { ...agent.configuration.stt, config: {} },
            llm: { ...agent.configuration.llm, config: {} },
            tts: { ...agent.configuration.tts, config: {} }
          })
        },
        metadata: {
          version: '1.0.0',
          author: 'Current User', // Would be actual user
          exportDate: new Date().toISOString(),
          agencyVersion: '1.0.0',
          privacy: exportConfig.privacy,
          license: exportConfig.license,
          category: exportConfig.category,
          tags: exportConfig.tags
        },
        ...(exportConfig.includeAnalytics && {
          analytics: agent.analytics
        }),
        ...(exportConfig.includeConversationHistory && {
          conversationHistory: [] // Would be actual history
        })
      }

      // Download as JSON file
      const blob = new Blob([JSON.stringify(exportPackage, null, 2)], {
        type: 'application/json'
      })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${agent.name.toLowerCase().replace(/\s+/g, '-')}-agent.json`
      link.click()
      URL.revokeObjectURL(url)

    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setIsExporting(false)
    }
  }

  const handleImport = async () => {
    if (!importData.trim()) return

    setIsImporting(true)
    try {
      const parsed = JSON.parse(importData) as ImportedAgent
      setParsedImport(parsed)

      // Validate the import data
      if (!parsed.name || !parsed.configuration) {
        throw new Error('Invalid agent format')
      }

    } catch (error) {
      console.error('Import failed:', error)
      // Show error message
    } finally {
      setIsImporting(false)
    }
  }

  const confirmImport = async () => {
    if (!parsedImport) return

    try {
      const newAgent = await createAgent({
        name: `${parsedImport.name} (Imported)`,
        description: parsedImport.description,
        configuration: parsedImport.configuration,
        status: 'inactive',
        type: 'imported'
      })

      // Reset import state
      setImportData('')
      setParsedImport(null)

      // Show success message
      console.log('Agent imported successfully:', newAgent)

    } catch (error) {
      console.error('Failed to create imported agent:', error)
    }
  }

  const addTag = () => {
    if (newTag.trim() && !exportConfig.tags.includes(newTag.trim())) {
      setExportConfig({
        ...exportConfig,
        tags: [...exportConfig.tags, newTag.trim()]
      })
      setNewTag('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setExportConfig({
      ...exportConfig,
      tags: exportConfig.tags.filter(tag => tag !== tagToRemove)
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-center">
        <div className="flex bg-muted rounded-lg p-1">
          <Button
            variant={activeTab === 'export' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('export')}
          >
            <Upload className="w-4 h-4 mr-2" />
            Export Agent
          </Button>
          <Button
            variant={activeTab === 'import' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('import')}
          >
            <Download className="w-4 h-4 mr-2" />
            Import Agent
          </Button>
        </div>
      </div>

      {/* Export Tab */}
      {activeTab === 'export' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <Card>
            <CardHeader>
              <CardTitle>Export Configuration</CardTitle>
              <CardDescription>
                Choose what to include in your agent export
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Include API Credentials</Label>
                    <p className="text-xs text-muted-foreground">Export with your API keys</p>
                  </div>
                  <Switch
                    checked={exportConfig.includeCredentials}
                    onCheckedChange={(checked) =>
                      setExportConfig({ ...exportConfig, includeCredentials: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Include Analytics</Label>
                    <p className="text-xs text-muted-foreground">Export performance data</p>
                  </div>
                  <Switch
                    checked={exportConfig.includeAnalytics}
                    onCheckedChange={(checked) =>
                      setExportConfig({ ...exportConfig, includeAnalytics: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Include Conversation History</Label>
                    <p className="text-xs text-muted-foreground">Export chat logs</p>
                  </div>
                  <Switch
                    checked={exportConfig.includeConversationHistory}
                    onCheckedChange={(checked) =>
                      setExportConfig({ ...exportConfig, includeConversationHistory: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Include Customizations</Label>
                    <p className="text-xs text-muted-foreground">Export custom settings</p>
                  </div>
                  <Switch
                    checked={exportConfig.includeCustomizations}
                    onCheckedChange={(checked) =>
                      setExportConfig({ ...exportConfig, includeCustomizations: checked })
                    }
                  />
                </div>
              </div>

              {exportConfig.includeCredentials && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Including API credentials will make your export contain sensitive information.
                    Only share with trusted parties.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Publishing Options</CardTitle>
              <CardDescription>
                Configure how your agent will appear in the marketplace
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Privacy</Label>
                  <Select
                    value={exportConfig.privacy}
                    onValueChange={(value: any) => setExportConfig({ ...exportConfig, privacy: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">
                        <div className="flex items-center">
                          <Globe className="w-4 h-4 mr-2" />
                          Public - Anyone can find and install
                        </div>
                      </SelectItem>
                      <SelectItem value="unlisted">
                        <div className="flex items-center">
                          <EyeOff className="w-4 h-4 mr-2" />
                          Unlisted - Only people with link can access
                        </div>
                      </SelectItem>
                      <SelectItem value="private">
                        <div className="flex items-center">
                          <Lock className="w-4 h-4 mr-2" />
                          Private - Only you can access
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={exportConfig.category}
                    onValueChange={(value) => setExportConfig({ ...exportConfig, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>License</Label>
                <Select
                  value={exportConfig.license}
                  onValueChange={(value: any) => setExportConfig({ ...exportConfig, license: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {licenses.map(license => (
                      <SelectItem key={license.value} value={license.value}>
                        <div>
                          <div className="font-medium">{license.label}</div>
                          <div className="text-xs text-muted-foreground">{license.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {exportConfig.tags.map(tag => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="cursor-pointer"
                      onClick={() => removeTag(tag)}
                    >
                      {tag} ×
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add tag..."
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addTag()}
                  />
                  <Button variant="outline" size="sm" onClick={addTag}>
                    Add
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleExport} disabled={isExporting || !agent}>
              <Upload className="w-4 h-4 mr-2" />
              {isExporting ? 'Exporting...' : 'Export Agent'}
            </Button>
          </div>
        </motion.div>
      )}

      {/* Import Tab */}
      {activeTab === 'import' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <Card>
            <CardHeader>
              <CardTitle>Import Agent</CardTitle>
              <CardDescription>
                Import an agent from a JSON export file or marketplace
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Agent Configuration (JSON)</Label>
                <Textarea
                  placeholder="Paste agent JSON configuration here..."
                  value={importData}
                  onChange={(e) => setImportData(e.target.value)}
                  className="min-h-[200px] font-mono text-sm"
                />
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setImportData('')}>
                  Clear
                </Button>
                <Button onClick={handleImport} disabled={isImporting || !importData.trim()}>
                  <FileText className="w-4 h-4 mr-2" />
                  {isImporting ? 'Parsing...' : 'Parse Configuration'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {parsedImport && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
                    Import Preview
                  </CardTitle>
                  <CardDescription>
                    Review the agent before importing
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Name</Label>
                      <div className="font-medium">{parsedImport.name}</div>
                    </div>
                    <div>
                      <Label>Author</Label>
                      <div className="font-medium">{parsedImport.metadata.author}</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Description</Label>
                    <p className="text-sm text-muted-foreground">
                      {parsedImport.description}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Configuration</Label>
                    <div className="bg-muted p-3 rounded-lg">
                      <pre className="text-xs overflow-auto max-h-32">
                        {JSON.stringify(parsedImport.configuration, null, 2)}
                      </pre>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <Label>Export Date</Label>
                      <div>{new Date(parsedImport.metadata.exportDate).toLocaleDateString()}</div>
                    </div>
                    <div>
                      <Label>Version</Label>
                      <div>{parsedImport.metadata.version}</div>
                    </div>
                  </div>

                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      The imported agent will be created as inactive. You can review and configure
                      it before activation.
                    </AlertDescription>
                  </Alert>

                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setParsedImport(null)}>
                      Cancel
                    </Button>
                    <Button onClick={confirmImport}>
                      <Download className="w-4 h-4 mr-2" />
                      Import Agent
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </motion.div>
      )}
    </div>
  )
}