'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  TestTube,
  Plus,
  Trash2,
  Copy,
  Play,
  Pause,
  BarChart3,
  Users,
  Target,
  Clock,
  TrendingUp,
  Settings
} from 'lucide-react'

interface ABTest {
  id: string
  name: string
  description: string
  variants: ABTestVariant[]
  trafficSplit: number[]
  status: 'draft' | 'running' | 'completed' | 'paused'
  metrics: {
    totalUsers: number
    conversions: number
    avgSessionTime: number
    satisfaction: number
  }
  startDate?: Date
  endDate?: Date
}

interface ABTestVariant {
  id: string
  name: string
  description: string
  config: Record<string, any>
  isControl: boolean
}

interface ABTestingConfigurationProps {
  agentId: string
  onCreateTest?: (test: ABTest) => void
  onUpdateTest?: (testId: string, test: ABTest) => void
  onDeleteTest?: (testId: string) => void
}

export function ABTestingConfiguration({
  agentId,
  onCreateTest,
  onUpdateTest,
  onDeleteTest
}: ABTestingConfigurationProps) {
  const [tests, setTests] = useState<ABTest[]>([
    {
      id: 'test-1',
      name: 'Voice Speed Test',
      description: 'Testing different speech speeds for user preference',
      variants: [
        {
          id: 'control',
          name: 'Normal Speed',
          description: 'Standard 1.0x speed',
          config: { voice: { speed: 1.0 } },
          isControl: true
        },
        {
          id: 'variant-a',
          name: 'Faster Speed',
          description: 'Increased to 1.2x speed',
          config: { voice: { speed: 1.2 } },
          isControl: false
        }
      ],
      trafficSplit: [50, 50],
      status: 'running',
      metrics: {
        totalUsers: 1250,
        conversions: 89,
        avgSessionTime: 245,
        satisfaction: 4.2
      },
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    }
  ])

  const [selectedTest, setSelectedTest] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  const createNewTest = () => {
    const newTest: ABTest = {
      id: `test-${Date.now()}`,
      name: 'New A/B Test',
      description: '',
      variants: [
        {
          id: 'control',
          name: 'Control',
          description: 'Original configuration',
          config: {},
          isControl: true
        }
      ],
      trafficSplit: [100],
      status: 'draft',
      metrics: {
        totalUsers: 0,
        conversions: 0,
        avgSessionTime: 0,
        satisfaction: 0
      }
    }

    setTests([...tests, newTest])
    setSelectedTest(newTest.id)
    setIsCreating(true)
  }

  const addVariant = (testId: string) => {
    setTests(tests.map(test => {
      if (test.id === testId) {
        const newVariant: ABTestVariant = {
          id: `variant-${Date.now()}`,
          name: `Variant ${test.variants.length}`,
          description: '',
          config: {},
          isControl: false
        }

        const newVariants = [...test.variants, newVariant]
        const equalSplit = Math.floor(100 / newVariants.length)
        const remainder = 100 - equalSplit * newVariants.length
        const newTrafficSplit = newVariants.map((_, index) =>
          index < remainder ? equalSplit + 1 : equalSplit
        )

        return {
          ...test,
          variants: newVariants,
          trafficSplit: newTrafficSplit
        }
      }
      return test
    }))
  }

  const updateTest = (testId: string, updates: Partial<ABTest>) => {
    setTests(prev => {
      const updatedTests = prev.map(test => test.id === testId ? { ...test, ...updates } : test)
      // Notify parent component if callback is provided
      if (onUpdateTest) {
        const updatedTest = updatedTests.find(t => t.id === testId)
        if (updatedTest) {
          onUpdateTest(testId, updatedTest)
        }
      }
      return updatedTests
    })
  }

  const deleteTest = (testId: string) => {
    setTests(prev => prev.filter(test => test.id !== testId))
    setSelectedTest(prev => prev === testId ? null : prev)
    // Notify parent component if callback is provided
    if (onDeleteTest) {
      onDeleteTest(testId)
    }
  }

  const toggleTestStatus = (testId: string) => {
    setTests(prev => {
      const test = prev.find(t => t.id === testId)
      if (!test) return prev

      let newStatus: ABTest['status']
      switch (test.status) {
        case 'draft':
          newStatus = 'running'
          break
        case 'running':
          newStatus = 'paused'
          break
        case 'paused':
          newStatus = 'running'
          break
        default:
          newStatus = test.status
      }

      const updatedTest = {
        ...test,
        status: newStatus,
        startDate: newStatus === 'running' && !test.startDate ? new Date() : test.startDate
      }

      // Notify parent component if callback is provided
      if (onUpdateTest) {
        onUpdateTest(testId, updatedTest)
      }

      return prev.map(t => t.id === testId ? updatedTest : t)
    })
  }

  const getStatusColor = (status: ABTest['status']) => {
    switch (status) {
      case 'running':
        return 'bg-green-500'
      case 'paused':
        return 'bg-yellow-500'
      case 'completed':
        return 'bg-blue-500'
      default:
        return 'bg-gray-500'
    }
  }

  const selectedTestData = selectedTest ? tests.find(t => t.id === selectedTest) : null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">A/B Testing</h2>
          <p className="text-muted-foreground">
            Test different configurations to optimize your agent's performance
          </p>
        </div>
        <Button onClick={createNewTest}>
          <Plus className="w-4 h-4 mr-2" />
          Create Test
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Test List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Active Tests</CardTitle>
              <CardDescription>
                {tests.filter(t => t.status === 'running').length} running, {tests.length} total
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {tests.map((test) => (
                <motion.div
                  key={test.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedTest === test.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:bg-accent/50'
                  }`}
                  onClick={() => setSelectedTest(test.id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-sm">{test.name}</h3>
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(test.status)}`} />
                      <Badge variant="secondary" className="text-xs">
                        {test.variants.length} variants
                      </Badge>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{test.description}</p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="capitalize">{test.status}</span>
                    <span>{test.metrics.totalUsers} users</span>
                  </div>
                </motion.div>
              ))}

              {tests.length === 0 && (
                <div className="text-center py-8">
                  <TestTube className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No tests yet</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    Create your first A/B test to start optimizing your agent
                  </p>
                  <Button onClick={createNewTest} size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Test
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Test Details */}
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {selectedTestData ? (
              <motion.div
                key={selectedTestData.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* Test Header */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center space-x-2">
                          <span>{selectedTestData.name}</span>
                          <Badge variant="secondary" className={`text-white ${getStatusColor(selectedTestData.status)}`}>
                            {selectedTestData.status}
                          </Badge>
                        </CardTitle>
                        <CardDescription>{selectedTestData.description}</CardDescription>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleTestStatus(selectedTestData.id)}
                        >
                          {selectedTestData.status === 'running' ? (
                            <Pause className="w-4 h-4 mr-2" />
                          ) : (
                            <Play className="w-4 h-4 mr-2" />
                          )}
                          {selectedTestData.status === 'running' ? 'Pause' : 'Start'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteTest(selectedTestData.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-foreground">
                          {selectedTestData.metrics.totalUsers}
                        </div>
                        <div className="text-sm text-muted-foreground">Total Users</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {(() => {
                            const { conversions = 0, totalUsers = 0 } = selectedTestData.metrics
                            const rate = totalUsers > 0 ? (conversions / totalUsers) * 100 : 0
                            return rate.toFixed(1) + '%'
                          })()}
                        </div>
                        <div className="text-sm text-muted-foreground">Conversion Rate</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-foreground">
                          {selectedTestData.metrics.avgSessionTime}s
                        </div>
                        <div className="text-sm text-muted-foreground">Avg Session</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {selectedTestData.metrics.satisfaction.toFixed(1)}
                        </div>
                        <div className="text-sm text-muted-foreground">Satisfaction</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Variants */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Test Variants</CardTitle>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addVariant(selectedTestData.id)}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Variant
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {selectedTestData.variants.map((variant, index) => (
                      <motion.div
                        key={variant.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="border border-border rounded-lg p-4"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-medium">{variant.name}</h3>
                            {variant.isControl && (
                              <Badge variant="outline">Control</Badge>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-muted-foreground">
                              {selectedTestData.trafficSplit[index]}% traffic
                            </span>
                            <Button variant="ghost" size="sm">
                              <Settings className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        <p className="text-sm text-muted-foreground mb-3">
                          {variant.description || 'No description provided'}
                        </p>

                        <div className="space-y-2">
                          <Label>Traffic Split: {selectedTestData.trafficSplit[index]}%</Label>
                          <Slider
                            value={[selectedTestData.trafficSplit[index]]}
                            onValueChange={([value]) => {
                              const newSplit = [...selectedTestData.trafficSplit]
                              newSplit[index] = value
                              // Normalize other values
                              const remaining = 100 - value
                              const otherCount = newSplit.length - 1
                              if (otherCount > 0) {
                                const perOther = Math.floor(remaining / otherCount)
                                newSplit.forEach((_, i) => {
                                  if (i !== index) {
                                    newSplit[i] = perOther
                                  }
                                })
                              }
                              updateTest(selectedTestData.id, { trafficSplit: newSplit })
                            }}
                            max={100}
                            min={0}
                            step={5}
                            className="w-full"
                          />
                        </div>

                        {selectedTestData.status === 'running' && (
                          <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <div className="font-medium">{Math.floor(selectedTestData.metrics.totalUsers * selectedTestData.trafficSplit[index] / 100)}</div>
                              <div className="text-muted-foreground">Users</div>
                            </div>
                            <div>
                              <div className="font-medium text-green-600">
                                {(Math.random() * 10 + 5).toFixed(1)}%
                              </div>
                              <div className="text-muted-foreground">Conv. Rate</div>
                            </div>
                            <div>
                              <div className="font-medium">
                                {(4.0 + Math.random() * 1).toFixed(1)}
                              </div>
                              <div className="text-muted-foreground">Rating</div>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </CardContent>
                </Card>

                {/* Results & Analytics */}
                {selectedTestData.status !== 'draft' && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <BarChart3 className="w-5 h-5" />
                        <span>Test Results</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="text-sm text-muted-foreground">
                          Statistical significance will be calculated after 100 conversions per variant
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Test Duration</Label>
                            <div className="text-lg font-medium">
                              {selectedTestData.startDate &&
                                Math.floor((Date.now() - selectedTestData.startDate.getTime()) / (1000 * 60 * 60 * 24))
                              } days
                            </div>
                          </div>
                          <div>
                            <Label>Confidence Level</Label>
                            <div className="text-lg font-medium text-green-600">
                              {selectedTestData.metrics.totalUsers > 100 ? '95%' : 'Insufficient data'}
                            </div>
                          </div>
                        </div>

                        <div>
                          <Label>Progress to Statistical Significance</Label>
                          <Progress
                            value={Math.min((selectedTestData.metrics.totalUsers / 1000) * 100, 100)}
                            className="w-full mt-2"
                          />
                          <div className="text-xs text-muted-foreground mt-1">
                            {selectedTestData.metrics.totalUsers}/1000 minimum sample size
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-center h-96"
              >
                <div className="text-center">
                  <TestTube className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Select a test</h3>
                  <p className="text-muted-foreground">
                    Choose a test from the list to view details and manage variants
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}