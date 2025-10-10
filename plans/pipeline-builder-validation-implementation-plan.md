# Pipeline Builder Validation & Enhancement Implementation Plan

**Created:** October 9, 2025
**Status:** Phase 1 COMPLETED ✅ | Phase 2 COMPLETED ✅ | Phase 3 COMPLETED ✅ | Phase 4-5 Ready for Implementation
**Priority:** HIGH - Critical for platform functionality
**Phase 1 Completed:** October 9, 2025
**Phase 2 Completed:** October 9, 2025 (User Tested & Approved ✅)
**Phase 3 Completed:** October 9, 2025 (All Features Implemented & Tested ✅)

---

## Executive Summary

This plan addresses critical gaps in the Pipeline Builder drag-and-drop interface, focusing on connection validation, user guidance, and backend integration. The current implementation allows users to create invalid pipeline configurations that cannot be executed by Pipecat. This plan provides a comprehensive roadmap to make the pipeline builder production-ready.

---

## Current State Analysis

### ✅ Working Features
- Drag & drop node creation from toolbar
- Visual node positioning and connections
- Node configuration panel with provider selection
- Save/Export pipeline to Zustand store
- Simulate mode with visual animations
- Metrics display (mock data)
- Professional Turbo Flow styling
- Auto-population from Agent Builder provider selection

### ✅ Phase 1 COMPLETED Features
1. **Connection Validation** - ✅ IMPLEMENTED - Prevents invalid connections (STT→STT, TTS→LLM, etc.) in real-time
2. **Error Toast Notifications** - ✅ IMPLEMENTED - Bright red toast notifications for all validation errors
3. **Comprehensive Validation Rules** - ✅ IMPLEMENTED - 5 validation rules with helpful error messages
4. **Cycle Detection** - ✅ IMPLEMENTED - Prevents circular dependencies in pipelines
5. **Test Suite** - ✅ IMPLEMENTED - 28 comprehensive test cases covering all scenarios

### ❌ Critical Missing Features (Phases 2-5)
1. **Enhanced Pipeline Validation** - No detailed validation status panel with errors/warnings/suggestions
2. **Backend Integration** - Visual pipeline doesn't convert to executable Pipecat pipeline
3. **User Guidance** - No templates or smart suggestions for pipeline building
4. **Real Provider Integration** - Node config doesn't link to actual provider credentials
5. **Keyboard Controls** - Missing Delete key, multi-select, and shortcuts

### 🔄 Partially Implemented
- Node configuration (UI exists but doesn't validate or save to backend)
- Pipeline validation (basic check exists but insufficient)
- Provider selection (dropdown works but doesn't connect to credentials)

---

## Valid Pipeline Patterns (Pipecat Architecture)

### Pattern 1: Traditional Pipeline (Most Common)
```
┌─────┐    ┌─────┐    ┌─────┐
│ STT │ -> │ LLM │ -> │ TTS │
└─────┘    └─────┘    └─────┘
```
**Requirements:**
- Exactly 1 STT node (Speech-to-Text)
- Exactly 1 LLM node (Language Model)
- Exactly 1 TTS node (Text-to-Speech)
- Must be connected in sequence

**Data Flow:**
1. User speaks → STT produces `TranscriptionFrame`
2. LLM consumes `TranscriptionFrame` → produces `LLMTextFrame`
3. TTS consumes `LLMTextFrame` → produces `AudioRawFrame`

**Examples:**
- Deepgram → GPT-4 → ElevenLabs
- Whisper → Claude → Cartesia
- Azure STT → Anthropic → Azure TTS

---

### Pattern 2: Realtime Speech-to-Speech (Single Node)
```
┌──────────────┐
│   REALTIME   │  (All-in-one: STT + LLM + TTS)
└──────────────┘
```
**Requirements:**
- Exactly 1 Realtime node
- NO other nodes allowed
- NO connections allowed

**Why Valid:**
Realtime providers handle the entire pipeline internally:
- OpenAI Realtime API (speech-to-speech)
- Gemini 2.0 Flash Live (multimodal)
- Azure Realtime (coming soon)

**Data Flow:**
- User speaks → Realtime service handles everything → Voice response

---

### Pattern 3: Enhanced Pipeline with Filters/Aggregators
```
┌─────┐    ┌────────┐    ┌─────┐    ┌─────┐
│ STT │ -> │ FILTER │ -> │ LLM │ -> │ TTS │
└─────┘    └────────┘    └─────┘    └─────┘

┌─────┐    ┌─────┐    ┌─────────────┐    ┌─────┐
│ STT │ -> │ LLM │ -> │ AGGREGATOR  │ -> │ TTS │
└─────┘    └─────┘    └─────────────┘    └─────┘
```
**Requirements:**
- Must have core STT → LLM → TTS chain
- Filters/Aggregators can be inserted between any nodes
- Cannot break the main flow

**Valid Insertions:**
- STT → Wake Word Filter → LLM → TTS
- STT → LLM → Profanity Filter → TTS
- STT → Context Aggregator → LLM → TTS
- STT → LLM → Sentence Aggregator → TTS

**Examples:**
- Wake phrase detection before LLM activation
- Content filtering before speech output
- Context accumulation for better responses

---

### Pattern 4: Multiple Parallel Paths (Advanced - Future)
```
              ┌→ LLM1 → TTS1 ┐
        STT ──┤              ├→ MERGE → OUTPUT
              └→ LLM2 → TTS2 ┘
```
**Status:** Not implemented yet
**Use Cases:**
- A/B testing different models
- Backup provider fallback
- Multi-language responses

---

## Invalid Pipeline Scenarios

### ❌ Invalid 1: Same Type Connected to Same Type
```
STT → STT   ❌ Makes no sense - redundant processing
LLM → LLM   ❌ Inefficient and breaks data flow
TTS → TTS   ❌ Cannot chain voice outputs
```
**Why Invalid:** Each node type has a specific role in the pipeline. Connecting identical types doesn't add value and breaks Pipecat's frame processing model.

**Error Message:** "Cannot connect {type} to {type}. Each node type should appear once in the main pipeline."

---

### ❌ Invalid 2: Wrong Order/Flow Direction
```
TTS → LLM → STT   ❌ Backwards!
LLM → STT → TTS   ❌ Wrong order
TTS → STT         ❌ Audio output cannot feed back to input
STT → TTS         ❌ Missing intelligence (no LLM)
```
**Why Invalid:** Pipecat expects specific frame types in order:
- STT produces `TranscriptionFrame` (text)
- LLM consumes text, produces `LLMTextFrame` (response text)
- TTS consumes text, produces `AudioRawFrame` (audio)

**Error Message:** "Invalid pipeline order. Correct flow: STT → LLM → TTS"

---

### ❌ Invalid 3: Missing Core Components
```
STT → TTS          ❌ No LLM = no intelligence
STT → LLM          ❌ No TTS = no voice response
LLM → TTS          ❌ No STT = cannot hear user
```
**Why Invalid:** Traditional pipelines require all three components to function.

**Error Messages:**
- "Pipeline requires an LLM node to process user input"
- "Pipeline requires a TTS node to generate voice responses"
- "Pipeline requires an STT node to process user speech"

---

### ❌ Invalid 4: Mixing Realtime with Traditional
```
REALTIME → LLM     ❌ Realtime handles LLM internally
STT → REALTIME     ❌ Realtime handles STT internally
REALTIME → TTS     ❌ Realtime handles TTS internally
STT + REALTIME     ❌ Cannot combine realtime with other nodes
```
**Why Invalid:** Realtime providers are **all-in-one** services that manage the entire pipeline internally. They don't accept external processing nodes.

**Error Message:** "Realtime nodes work independently. Remove all other STT/LLM/TTS nodes when using a realtime provider."

---

### ❌ Invalid 5: Disconnected Nodes
```
STT    LLM    TTS   ❌ No connections between nodes
STT → LLM    TTS    ❌ TTS is isolated
```
**Why Invalid:** Pipecat pipelines require a connected flow of frames from input to output.

**Error Message:** "All nodes must be connected. Connect STT → LLM → TTS in sequence."

---

### ❌ Invalid 6: Circular Dependencies
```
STT → LLM → TTS → STT    ❌ Creates infinite loop
LLM → FILTER → LLM       ❌ Circular processing
```
**Why Invalid:** Creates infinite loops that prevent pipeline execution.

**Error Message:** "Pipeline cannot have circular connections. Remove the connection creating the loop."

---

## Implementation Phases

## Phase 1: Connection Validation ✅ COMPLETED (October 9, 2025)

**Goal:** Prevent users from creating invalid node connections in real-time.

**Status:** ✅ **COMPLETED AND TESTED**

**Implementation Summary:**
- ✅ Connection validation rules engine implemented
- ✅ Real-time validation on every connection attempt
- ✅ Bright red error toast notifications
- ✅ 5 comprehensive validation rules (same-type, realtime isolation, valid mappings, circular dependencies, duplicates)
- ✅ 28 test cases covering all scenarios
- ✅ User documentation created
- ✅ Console debugging with emoji indicators

**Files Modified:**
- `agenty-platform/apps/web/src/stores/usePipelineStore.ts` (+118 lines)
- `agenty-platform/apps/web/src/components/features/builder/PipelineBuilder.tsx` (+20 lines)
- `agenty-platform/apps/web/src/app/layout.tsx` (added Toaster component)

**Files Created:**
- `agenty-platform/apps/web/src/stores/__tests__/usePipelineStore.test.ts` (28 tests)
- `agenty-platform/apps/web/PIPELINE_VALIDATION_GUIDE.md` (comprehensive user guide)
- `PHASE_1_VALIDATION_IMPLEMENTATION_COMPLETE.md` (detailed completion report)

---

### Original Phase 1 Implementation Details:

### 1.1 Connection Rules Engine

**File:** `agenty-platform/apps/web/src/stores/usePipelineStore.ts`

```typescript
// Valid connection mappings based on Pipecat architecture
const VALID_CONNECTIONS: Record<PipelineNodeType, PipelineNodeType[]> = {
  'stt': ['llm', 'filter', 'aggregator'],        // STT can connect to LLM or helpers
  'llm': ['tts', 'filter', 'aggregator'],        // LLM can connect to TTS or helpers
  'tts': [],                                     // TTS is terminal (end of pipeline)
  'realtime': [],                                // Realtime cannot connect to anything
  'filter': ['llm', 'tts', 'aggregator'],        // Filters can go to processing nodes
  'aggregator': ['llm', 'tts'],                  // Aggregators process data forward
  'custom': ['llm', 'tts', 'filter']             // Custom nodes are flexible
}

interface ConnectionValidation {
  valid: boolean
  error?: string
  warning?: string
}

/**
 * Validates if a connection between two nodes is allowed
 */
export function isValidConnection(
  sourceNode: PipelineNode,
  targetNode: PipelineNode,
  currentNodes: PipelineNode[],
  currentEdges: Edge[]
): ConnectionValidation {
  const sourceType = sourceNode.data.type
  const targetType = targetNode.data.type

  // Rule 1: Prevent same-type connections
  if (sourceType === targetType) {
    return {
      valid: false,
      error: `Cannot connect ${sourceType.toUpperCase()} to ${targetType.toUpperCase()}. Same node types cannot be connected.`
    }
  }

  // Rule 2: Realtime nodes cannot connect to anything
  if (sourceType === 'realtime' || targetType === 'realtime') {
    return {
      valid: false,
      error: 'Realtime nodes work independently and cannot be connected to other nodes.'
    }
  }

  // Rule 3: Check if connection is in valid mappings
  const allowedTargets = VALID_CONNECTIONS[sourceType]
  if (!allowedTargets || !allowedTargets.includes(targetType)) {
    return {
      valid: false,
      error: `${sourceType.toUpperCase()} cannot connect to ${targetType.toUpperCase()}. Valid connections: ${allowedTargets?.join(', ') || 'none'}.`
    }
  }

  // Rule 4: Detect circular dependencies
  if (wouldCreateCycle(sourceNode.id, targetNode.id, currentEdges)) {
    return {
      valid: false,
      error: 'This connection would create a circular dependency.'
    }
  }

  // Rule 5: Prevent duplicate connections
  const existingConnection = currentEdges.find(
    edge => edge.source === sourceNode.id && edge.target === targetNode.id
  )
  if (existingConnection) {
    return {
      valid: false,
      error: 'Connection already exists between these nodes.'
    }
  }

  return { valid: true }
}

/**
 * Detects if adding a connection would create a cycle
 */
function wouldCreateCycle(
  sourceId: string,
  targetId: string,
  edges: Edge[]
): boolean {
  // Build adjacency list
  const graph: Record<string, string[]> = {}
  edges.forEach(edge => {
    if (!graph[edge.source]) graph[edge.source] = []
    graph[edge.source].push(edge.target)
  })

  // Add the proposed edge
  if (!graph[sourceId]) graph[sourceId] = []
  graph[sourceId].push(targetId)

  // DFS cycle detection
  const visited = new Set<string>()
  const recStack = new Set<string>()

  function hasCycle(nodeId: string): boolean {
    if (recStack.has(nodeId)) return true
    if (visited.has(nodeId)) return false

    visited.add(nodeId)
    recStack.add(nodeId)

    const neighbors = graph[nodeId] || []
    for (const neighbor of neighbors) {
      if (hasCycle(neighbor)) return true
    }

    recStack.delete(nodeId)
    return false
  }

  return hasCycle(sourceId)
}
```

### 1.2 Update onConnect Handler

**File:** `agenty-platform/apps/web/src/stores/usePipelineStore.ts`

```typescript
onConnect: (connection) => {
  const sourceNode = get().nodes.find(n => n.id === connection.source)
  const targetNode = get().nodes.find(n => n.id === connection.target)

  if (!sourceNode || !targetNode) {
    set({ error: 'Invalid connection: nodes not found' })
    return
  }

  // Validate connection
  const validation = isValidConnection(
    sourceNode,
    targetNode,
    get().nodes,
    get().edges
  )

  if (!validation.valid) {
    // Show error to user (will be handled by toast notification)
    set({ error: validation.error })
    console.error('Invalid connection:', validation.error)
    return
  }

  // Connection is valid - create edge
  const newEdge = {
    id: `${connection.source}-${connection.target}`,
    source: connection.source,
    target: connection.target,
    sourceHandle: connection.sourceHandle,
    targetHandle: connection.targetHandle,
    type: 'turbo',
    animated: true,
    style: { stroke: '#8B5CF6', strokeWidth: 2 }
  }

  set({
    edges: [...get().edges, newEdge],
    error: null // Clear any previous errors
  })

  console.log('Valid connection created:', newEdge)
}
```

### 1.3 Visual Feedback in PipelineBuilder

**File:** `agenty-platform/apps/web/src/components/features/builder/PipelineBuilder.tsx`

```typescript
import { useToast } from '@/components/ui/use-toast'

export function PipelineBuilder({ ... }: PipelineBuilderProps) {
  const { toast } = useToast()
  const { error } = usePipelineStore()

  // Show toast when connection validation fails
  useEffect(() => {
    if (error) {
      toast({
        title: "Invalid Connection",
        description: error,
        variant: "destructive",
      })
    }
  }, [error, toast])

  // ... rest of component
}
```

### 1.4 Visual Handle Highlighting (Advanced)

**File:** `agenty-platform/apps/web/src/components/features/builder/TurboNode.tsx`

```typescript
// Add state for drag operation
const [isDragging, setIsDragging] = useState(false)
const [dragSourceType, setDragSourceType] = useState<string | null>(null)

// Check if this node can accept connection
const canAcceptConnection = useMemo(() => {
  if (!isDragging || !dragSourceType) return true

  const validTargets = VALID_CONNECTIONS[dragSourceType] || []
  return validTargets.includes(data.nodeType)
}, [isDragging, dragSourceType, data.nodeType])

// Style handles based on validity
const handleClassName = `
  absolute w-3 h-3 rounded-full border-2 transition-all
  ${canAcceptConnection
    ? 'border-green-500 bg-green-500/20 hover:bg-green-500'
    : 'border-gray-500 bg-gray-500/20 opacity-50 cursor-not-allowed'}
`
```

---

## Phase 2: Enhanced Pipeline Validation ✅ COMPLETED (October 9, 2025)

**Goal:** Comprehensive pipeline validation with detailed error messages and guidance.

**Status:** ✅ **COMPLETED, TESTED, AND USER APPROVED**

**Implementation Summary:**
- ✅ validatePipelineDetailed function with comprehensive validation logic (~160 lines)
- ✅ PipelineValidationPanel component with real-time updates
- ✅ Integration into PipelineBuilder right sidebar (always visible, 384px width)
- ✅ 26 comprehensive test cases covering all scenarios (including configuration validation)
- ✅ Complete documentation created
- ✅ **CRITICAL FIX:** Strict configuration validation for core nodes (user-identified issue)
- ✅ **UI ENHANCEMENT:** Wider right panel (384px) for better readability

**Key Features Delivered:**
1. **Real-time Validation** - Updates instantly as nodes/edges change
2. **Color-Coded Alerts** - Errors (red), Warnings (yellow), Suggestions (blue), Success (green)
3. **Pipeline Type Detection** - Identifies Realtime, Traditional, or Enhanced pipelines
4. **Configuration Validation** - Requires all core nodes (STT/LLM/TTS/Realtime) to be configured
5. **Helpful Guidance** - Specific, actionable suggestions for fixing issues
6. **Professional UI** - Glass morphism effects, backdrop blur, dark theme compatible

**Files Modified:**
- `agenty-platform/apps/web/src/stores/usePipelineStore.ts` (+175 lines with config validation)
- `agenty-platform/apps/web/src/components/features/builder/PipelineBuilder.tsx` (+15 lines, wider panel)

**Files Created:**
- `agenty-platform/apps/web/src/components/features/builder/PipelineValidationPanel.tsx` (professional UI component)
- `PHASE_2_VALIDATION_IMPLEMENTATION_COMPLETE.md` (comprehensive completion report)
- `PHASE_2_CRITICAL_FIX.md` (configuration validation enhancement)
- 26 new test cases in `usePipelineStore.test.ts`

**User Testing Results:**
- ✅ Identified critical validation gap (unconfigured nodes)
- ✅ Applied fix: Core nodes now require configuration (errors, not warnings)
- ✅ Wider right panel approved (384px vs 320px)
- ✅ All validation scenarios working as expected
- ✅ Ready for production deployment

---

### Original Phase 2 Implementation Details:

### 2.1 Advanced Pipeline Validation

**File:** `agenty-platform/apps/web/src/stores/usePipelineStore.ts`

```typescript
interface PipelineValidationResult {
  valid: boolean
  type?: 'realtime' | 'traditional' | 'enhanced'
  errors: string[]
  warnings: string[]
  suggestions: string[]
}

export function validatePipelineDetailed(
  nodes: PipelineNode[],
  edges: Edge[]
): PipelineValidationResult {
  const result: PipelineValidationResult = {
    valid: false,
    errors: [],
    warnings: [],
    suggestions: []
  }

  // Case 0: Empty pipeline
  if (nodes.length === 0) {
    result.errors.push('Pipeline is empty. Add nodes to get started.')
    result.suggestions.push('Start by dragging an STT node onto the canvas')
    return result
  }

  // Categorize nodes
  const realtimeNodes = nodes.filter(n => n.data.type === 'realtime')
  const sttNodes = nodes.filter(n => n.data.type === 'stt')
  const llmNodes = nodes.filter(n => n.data.type === 'llm')
  const ttsNodes = nodes.filter(n => n.data.type === 'tts')
  const filterNodes = nodes.filter(n => n.data.type === 'filter')
  const aggregatorNodes = nodes.filter(n => n.data.type === 'aggregator')

  // CASE 1: REALTIME PIPELINE
  if (realtimeNodes.length > 0) {
    result.type = 'realtime'

    // Multiple realtime nodes
    if (realtimeNodes.length > 1) {
      result.errors.push(`Only one realtime node allowed. Found ${realtimeNodes.length}.`)
      result.suggestions.push('Remove extra realtime nodes')
    }

    // Realtime with other core nodes
    if (sttNodes.length > 0 || llmNodes.length > 0 || ttsNodes.length > 0) {
      result.errors.push('Realtime pipelines cannot include STT, LLM, or TTS nodes.')
      result.suggestions.push('Remove all STT/LLM/TTS nodes when using realtime mode')
      result.warnings.push('Realtime providers handle speech processing internally')
    }

    // Realtime with connections
    if (edges.length > 0) {
      result.errors.push('Realtime nodes cannot be connected to other nodes.')
      result.suggestions.push('Remove all connections from the realtime node')
    }

    // Check configuration
    const realtimeNode = realtimeNodes[0]
    if (!realtimeNode.data.isConfigured) {
      result.errors.push('Realtime node requires configuration.')
      result.suggestions.push('Click the realtime node to configure provider and credentials')
    }

    result.valid = result.errors.length === 0
    return result
  }

  // CASE 2: TRADITIONAL PIPELINE
  result.type = sttNodes.length > 0 && llmNodes.length > 0 && ttsNodes.length > 0
    ? 'traditional'
    : 'enhanced'

  // Check for required core nodes
  if (sttNodes.length === 0) {
    result.errors.push('Missing STT (Speech-to-Text) node.')
    result.suggestions.push('Add an STT node to process user speech')
  } else if (sttNodes.length > 1) {
    result.warnings.push(`Found ${sttNodes.length} STT nodes. Only one will be used.`)
  }

  if (llmNodes.length === 0) {
    result.errors.push('Missing LLM (Language Model) node.')
    result.suggestions.push('Add an LLM node to process conversations')
  } else if (llmNodes.length > 1) {
    result.warnings.push(`Found ${llmNodes.length} LLM nodes. Only one will be used.`)
  }

  if (ttsNodes.length === 0) {
    result.errors.push('Missing TTS (Text-to-Speech) node.')
    result.suggestions.push('Add a TTS node to generate voice responses')
  } else if (ttsNodes.length > 1) {
    result.warnings.push(`Found ${ttsNodes.length} TTS nodes. Only one will be used.`)
  }

  // Check connectivity
  if (nodes.length > 1 && edges.length === 0) {
    result.errors.push('Nodes are not connected.')
    result.suggestions.push('Connect nodes: STT → LLM → TTS')
  }

  // Check for required path STT → LLM → TTS
  if (sttNodes.length > 0 && llmNodes.length > 0 && ttsNodes.length > 0) {
    const hasSTTtoLLM = edges.some(e =>
      e.source === sttNodes[0].id && e.target === llmNodes[0].id
    )
    const hasLLMtoTTS = edges.some(e =>
      e.source === llmNodes[0].id && e.target === ttsNodes[0].id
    )

    if (!hasSTTtoLLM) {
      result.errors.push('STT node must connect to LLM node.')
      result.suggestions.push('Draw a connection from STT to LLM')
    }

    if (!hasLLMtoTTS) {
      result.errors.push('LLM node must connect to TTS node.')
      result.suggestions.push('Draw a connection from LLM to TTS')
    }
  }

  // Check for isolated nodes
  const connectedNodeIds = new Set<string>()
  edges.forEach(edge => {
    connectedNodeIds.add(edge.source)
    connectedNodeIds.add(edge.target)
  })

  const isolatedNodes = nodes.filter(n => !connectedNodeIds.has(n.id))
  if (isolatedNodes.length > 0) {
    result.warnings.push(`${isolatedNodes.length} node(s) are not connected to the pipeline.`)
    result.suggestions.push('Connect or remove isolated nodes')
  }

  // Check node configurations
  const unconfiguredNodes = nodes.filter(n => !n.data.isConfigured)
  if (unconfiguredNodes.length > 0) {
    result.warnings.push(`${unconfiguredNodes.length} node(s) need configuration.`)
    result.suggestions.push('Click each node to configure provider settings')
  }

  // Check for cycles
  if (hasCycles(edges)) {
    result.errors.push('Pipeline contains circular connections.')
    result.suggestions.push('Remove connections that create loops')
  }

  result.valid = result.errors.length === 0

  return result
}

/**
 * Check if edge list contains cycles
 */
function hasCycles(edges: Edge[]): boolean {
  const graph: Record<string, string[]> = {}
  edges.forEach(edge => {
    if (!graph[edge.source]) graph[edge.source] = []
    graph[edge.source].push(edge.target)
  })

  const visited = new Set<string>()
  const recStack = new Set<string>()

  function dfs(node: string): boolean {
    if (recStack.has(node)) return true
    if (visited.has(node)) return false

    visited.add(node)
    recStack.add(node)

    const neighbors = graph[node] || []
    for (const neighbor of neighbors) {
      if (dfs(neighbor)) return true
    }

    recStack.delete(node)
    return false
  }

  for (const node of Object.keys(graph)) {
    if (dfs(node)) return true
  }

  return false
}
```

### 2.2 Validation Status Panel

**File:** `agenty-platform/apps/web/src/components/features/builder/PipelineValidationPanel.tsx`

```typescript
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, AlertCircle, AlertTriangle, Lightbulb } from 'lucide-react'

export function PipelineValidationPanel() {
  const { nodes, edges } = usePipelineStore()
  const validation = validatePipelineDetailed(nodes, edges)

  return (
    <Card className="w-80">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {validation.valid ? (
            <CheckCircle className="w-5 h-5 text-green-500" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-500" />
          )}
          Pipeline Status
          <Badge variant={validation.valid ? 'default' : 'destructive'}>
            {validation.valid ? 'Valid' : 'Invalid'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Pipeline Type */}
        {validation.type && (
          <div>
            <span className="text-sm font-medium">Type:</span>
            <Badge variant="outline" className="ml-2">
              {validation.type}
            </Badge>
          </div>
        )}

        {/* Errors */}
        {validation.errors.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Errors</AlertTitle>
            <AlertDescription>
              <ul className="list-disc list-inside space-y-1 mt-2">
                {validation.errors.map((error, i) => (
                  <li key={i} className="text-sm">{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Warnings */}
        {validation.warnings.length > 0 && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Warnings</AlertTitle>
            <AlertDescription>
              <ul className="list-disc list-inside space-y-1 mt-2">
                {validation.warnings.map((warning, i) => (
                  <li key={i} className="text-sm">{warning}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Suggestions */}
        {validation.suggestions.length > 0 && (
          <Alert>
            <Lightbulb className="h-4 w-4" />
            <AlertTitle>Suggestions</AlertTitle>
            <AlertDescription>
              <ul className="list-disc list-inside space-y-1 mt-2">
                {validation.suggestions.map((suggestion, i) => (
                  <li key={i} className="text-sm">{suggestion}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Success State */}
        {validation.valid && (
          <Alert className="border-green-500 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">Pipeline Ready</AlertTitle>
            <AlertDescription className="text-green-700">
              Your pipeline is properly configured and ready to deploy.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
```

---

## Phase 3: User Guidance & Templates ✅ COMPLETED (October 9, 2025)

**Goal:** Help users create valid pipelines easily with templates and smart suggestions.

**Status:** ✅ **COMPLETED, TESTED, AND PRODUCTION READY**

**Implementation Summary:**
- ✅ 6 Quick Start Templates (2 realtime, 3 traditional, 1 enhanced)
- ✅ Template Selector UI component with professional dialog
- ✅ Smart Suggestions Panel with context-aware guidance
- ✅ Interactive Help Dialog with 4 comprehensive tabs (Patterns, Connections, Shortcuts, Errors)
- ✅ Keyboard shortcuts (Delete, Escape, Ctrl+S, Ctrl+Z)
- ✅ Edge deletion and multi-node selection support
- ✅ Undo functionality with 50-state history tracking
- ✅ Centered delete and undo buttons (bottom-center position)
- ✅ Purple pulsing help button animation
- ✅ Text wrapping fixes in Smart Suggestions
- ✅ 85 comprehensive test cases
- ✅ Complete user documentation

**Files Created:**
- `agenty-platform/apps/web/src/components/features/builder/PipelineTemplateSelector.tsx` (141 lines)
- `agenty-platform/apps/web/src/components/features/builder/SmartSuggestionsPanel.tsx` (194 lines)
- `agenty-platform/apps/web/src/components/features/builder/PipelineBuilderHelp.tsx` (331 lines)
- `agenty-platform/apps/web/src/components/ui/dialog.tsx` (123 lines)
- `agenty-platform/apps/web/src/stores/__tests__/usePipelineStore.phase3.test.ts` (394 lines, 85 tests)
- `PHASE_3_COMPLETION_SUMMARY.md` (comprehensive completion report)

**Files Modified:**
- `agenty-platform/apps/web/src/stores/usePipelineStore.ts` (+85 lines with templates)
- `agenty-platform/apps/web/src/components/features/builder/PipelineBuilder.tsx` (+100 lines with shortcuts and undo)

**User Feedback Integration:**
- ✅ Fixed missing dialog component error
- ✅ Fixed removeNode undefined error
- ✅ Fixed text overflow in Smart Suggestions
- ✅ Added purple pulsing animation to help button
- ✅ Implemented edge deletion and multi-selection
- ✅ Added undo functionality with history tracking
- ✅ Centered buttons for better UX
- ✅ Documented save persistence limitation

---

### Original Phase 3 Implementation Details:

### 3.1 Quick Start Templates

**File:** `agenty-platform/apps/web/src/stores/usePipelineStore.ts`

```typescript
export interface PipelineTemplate {
  id: string
  name: string
  description: string
  type: 'realtime' | 'traditional' | 'enhanced'
  nodes: Partial<PipelineNodeData>[]
  edges: { sourceIndex: number; targetIndex: number }[]
}

export const PIPELINE_TEMPLATES: PipelineTemplate[] = [
  {
    id: 'openai-realtime',
    name: 'OpenAI Realtime',
    description: 'Speech-to-speech conversation with OpenAI Realtime API',
    type: 'realtime',
    nodes: [
      { type: 'realtime', provider: 'openai-realtime', label: 'OpenAI Realtime' }
    ],
    edges: []
  },
  {
    id: 'gemini-live',
    name: 'Gemini Multimodal Live',
    description: 'Real-time multimodal conversation with Gemini 2.0',
    type: 'realtime',
    nodes: [
      { type: 'realtime', provider: 'gemini-live', label: 'Gemini Live' }
    ],
    edges: []
  },
  {
    id: 'openai-pipeline',
    name: 'OpenAI Complete',
    description: 'Full pipeline using OpenAI services',
    type: 'traditional',
    nodes: [
      { type: 'stt', provider: 'openai-whisper', label: 'Whisper STT' },
      { type: 'llm', provider: 'openai', label: 'GPT-4' },
      { type: 'tts', provider: 'openai-tts', label: 'OpenAI TTS' }
    ],
    edges: [
      { sourceIndex: 0, targetIndex: 1 }, // STT → LLM
      { sourceIndex: 1, targetIndex: 2 }  // LLM → TTS
    ]
  },
  {
    id: 'anthropic-elevenlabs',
    name: 'Claude + ElevenLabs',
    description: 'Deepgram STT + Claude + ElevenLabs TTS',
    type: 'traditional',
    nodes: [
      { type: 'stt', provider: 'deepgram', label: 'Deepgram STT' },
      { type: 'llm', provider: 'anthropic', label: 'Claude 3.5 Sonnet' },
      { type: 'tts', provider: 'elevenlabs', label: 'ElevenLabs TTS' }
    ],
    edges: [
      { sourceIndex: 0, targetIndex: 1 },
      { sourceIndex: 1, targetIndex: 2 }
    ]
  },
  {
    id: 'azure-complete',
    name: 'Microsoft Azure',
    description: 'Full pipeline using Azure services',
    type: 'traditional',
    nodes: [
      { type: 'stt', provider: 'azure-stt', label: 'Azure STT' },
      { type: 'llm', provider: 'azure-openai', label: 'Azure OpenAI' },
      { type: 'tts', provider: 'azure-tts', label: 'Azure TTS' }
    ],
    edges: [
      { sourceIndex: 0, targetIndex: 1 },
      { sourceIndex: 1, targetIndex: 2 }
    ]
  },
  {
    id: 'enhanced-filters',
    name: 'Pipeline with Filters',
    description: 'STT with wake word + LLM + content filter + TTS',
    type: 'enhanced',
    nodes: [
      { type: 'stt', provider: 'deepgram', label: 'Deepgram STT' },
      { type: 'filter', label: 'Wake Word Filter' },
      { type: 'llm', provider: 'openai', label: 'GPT-4' },
      { type: 'filter', label: 'Content Filter' },
      { type: 'tts', provider: 'cartesia', label: 'Cartesia TTS' }
    ],
    edges: [
      { sourceIndex: 0, targetIndex: 1 }, // STT → Wake Filter
      { sourceIndex: 1, targetIndex: 2 }, // Wake Filter → LLM
      { sourceIndex: 2, targetIndex: 3 }, // LLM → Content Filter
      { sourceIndex: 3, targetIndex: 4 }  // Content Filter → TTS
    ]
  }
]

// Add to store actions
loadTemplate: (templateId: string) => {
  const template = PIPELINE_TEMPLATES.find(t => t.id === templateId)
  if (!template) return

  // Clear existing pipeline
  set({ nodes: [], edges: [], selectedNode: null })

  // Create nodes
  const createdNodes: PipelineNode[] = []
  template.nodes.forEach((nodeData, index) => {
    const position = {
      x: 100 + (index * 250),
      y: 200
    }
    const node = get().addNode(nodeData.type!, position)
    if (nodeData.provider) {
      get().updateNode(node.id, { provider: nodeData.provider })
    }
    createdNodes.push(node)
  })

  // Create edges
  setTimeout(() => {
    template.edges.forEach(({ sourceIndex, targetIndex }) => {
      get().onConnect({
        source: createdNodes[sourceIndex].id,
        target: createdNodes[targetIndex].id,
        sourceHandle: null,
        targetHandle: null
      })
    })
  }, 200)
}
```

### 3.2 Template Selector UI

**File:** `agenty-platform/apps/web/src/components/features/builder/PipelineTemplateSelector.tsx`

```typescript
export function PipelineTemplateSelector() {
  const { loadTemplate } = usePipelineStore()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Zap className="w-4 h-4 mr-2" />
          Quick Start Templates
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Quick Start Templates</DialogTitle>
          <DialogDescription>
            Choose a pre-built pipeline template to get started quickly
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 mt-4">
          {PIPELINE_TEMPLATES.map(template => (
            <Card
              key={template.id}
              className="cursor-pointer hover:border-primary transition-colors"
              onClick={() => {
                loadTemplate(template.id)
                setIsOpen(false)
              }}
            >
              <CardHeader>
                <CardTitle className="text-base">{template.name}</CardTitle>
                <Badge variant="outline">{template.type}</Badge>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {template.description}
                </p>
                <div className="mt-3 flex flex-wrap gap-1">
                  {template.nodes.map((node, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {node.type?.toUpperCase()}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

### 3.3 Smart Suggestions Panel

**File:** `agenty-platform/apps/web/src/components/features/builder/SmartSuggestionsPanel.tsx`

```typescript
export function SmartSuggestionsPanel() {
  const { nodes, addNode } = usePipelineStore()

  const suggestions = useMemo(() => {
    const hasSTT = nodes.some(n => n.data.type === 'stt')
    const hasLLM = nodes.some(n => n.data.type === 'llm')
    const hasTTS = nodes.some(n => n.data.type === 'tts')
    const hasRealtime = nodes.some(n => n.data.type === 'realtime')

    const suggestions: Array<{
      title: string
      description: string
      action: () => void
      icon: any
    }> = []

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
    } else if (hasRealtime) {
      suggestions.push({
        title: 'Remove other nodes',
        description: 'Realtime nodes work independently',
        action: () => {}, // Remove non-realtime nodes
        icon: Trash2
      })
    } else {
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
          action: () => addNode('llm', { x: 350, y: 200 }),
          icon: Brain
        })
      }
      if (hasSTT && hasLLM && !hasTTS) {
        suggestions.push({
          title: 'Add TTS Node',
          description: 'Generate voice responses',
          action: () => addNode('tts', { x: 600, y: 200 }),
          icon: Volume2
        })
      }
    }

    return suggestions
  }, [nodes, addNode])

  if (suggestions.length === 0) return null

  return (
    <Card className="w-80">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-yellow-500" />
          Smart Suggestions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {suggestions.map((suggestion, i) => (
          <Button
            key={i}
            variant="outline"
            className="w-full justify-start"
            onClick={suggestion.action}
          >
            <suggestion.icon className="w-4 h-4 mr-2" />
            <div className="text-left">
              <div className="font-medium">{suggestion.title}</div>
              <div className="text-xs text-muted-foreground">
                {suggestion.description}
              </div>
            </div>
          </Button>
        ))}
      </CardContent>
    </Card>
  )
}
```

### 3.4 Keyboard Shortcuts

**File:** `agenty-platform/apps/web/src/components/features/builder/PipelineBuilder.tsx`

```typescript
// Add keyboard event handler
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    // Delete key - remove selected node
    if (e.key === 'Delete' && selectedNode) {
      removeNode(selectedNode.id)
      selectNode(null)
    }

    // Escape - deselect node
    if (e.key === 'Escape') {
      selectNode(null)
    }

    // Ctrl/Cmd + S - Save pipeline
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault()
      handleSave()
    }

    // Ctrl/Cmd + Z - Undo (future feature)
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
      e.preventDefault()
      // TODO: Implement undo
    }
  }

  window.addEventListener('keydown', handleKeyDown)
  return () => window.removeEventListener('keydown', handleKeyDown)
}, [selectedNode, removeNode, selectNode, handleSave])
```

---

## Phase 4: Backend Integration (Week 3)

**Goal:** Convert visual pipeline to executable Pipecat pipeline configuration.

### 4.1 Pipeline Serialization

**File:** `agenty-platform/apps/web/src/utils/pipelineConverter.ts`

```typescript
import { PipelineNode } from '@/stores/usePipelineStore'
import { Edge } from '@xyflow/react'

export interface AgentConfigurationPayload {
  name: string
  description: string
  pipeline_type: 'realtime' | 'traditional'
  stt?: {
    provider: string
    config: Record<string, any>
  }
  llm?: {
    provider: string
    config: Record<string, any>
  }
  tts?: {
    provider: string
    config: Record<string, any>
  }
  realtime?: {
    provider: string
    config: Record<string, any>
  }
  filters?: Array<{
    type: string
    position: 'before_llm' | 'after_llm'
    config: Record<string, any>
  }>
  aggregators?: Array<{
    type: string
    config: Record<string, any>
  }>
}

/**
 * Converts visual pipeline to backend-compatible agent configuration
 */
export function convertPipelineToAgentConfig(
  nodes: PipelineNode[],
  edges: Edge[],
  agentName: string,
  agentDescription: string
): AgentConfigurationPayload {
  // Check for realtime pipeline
  const realtimeNode = nodes.find(n => n.data.type === 'realtime')
  if (realtimeNode) {
    return {
      name: agentName,
      description: agentDescription,
      pipeline_type: 'realtime',
      realtime: {
        provider: realtimeNode.data.provider || '',
        config: realtimeNode.data.configuration || {}
      }
    }
  }

  // Traditional pipeline
  const sttNode = nodes.find(n => n.data.type === 'stt')
  const llmNode = nodes.find(n => n.data.type === 'llm')
  const ttsNode = nodes.find(n => n.data.type === 'tts')
  const filterNodes = nodes.filter(n => n.data.type === 'filter')
  const aggregatorNodes = nodes.filter(n => n.data.type === 'aggregator')

  if (!sttNode || !llmNode || !ttsNode) {
    throw new Error('Traditional pipeline requires STT, LLM, and TTS nodes')
  }

  // Determine filter positions based on edges
  const filters = filterNodes.map(filter => {
    const hasLLMSource = edges.some(e =>
      e.source === llmNode.id && e.target === filter.id
    )
    return {
      type: filter.data.label,
      position: hasLLMSource ? 'after_llm' as const : 'before_llm' as const,
      config: filter.data.configuration || {}
    }
  })

  return {
    name: agentName,
    description: agentDescription,
    pipeline_type: 'traditional',
    stt: {
      provider: sttNode.data.provider || '',
      config: sttNode.data.configuration || {}
    },
    llm: {
      provider: llmNode.data.provider || '',
      config: llmNode.data.configuration || {}
    },
    tts: {
      provider: ttsNode.data.provider || '',
      config: ttsNode.data.configuration || {}
    },
    filters: filters.length > 0 ? filters : undefined,
    aggregators: aggregatorNodes.length > 0
      ? aggregatorNodes.map(agg => ({
          type: agg.data.label,
          config: agg.data.configuration || {}
        }))
      : undefined
  }
}

/**
 * Validates that pipeline is ready for backend submission
 */
export function validatePipelineForBackend(
  nodes: PipelineNode[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  // Check that all nodes are configured
  const unconfiguredNodes = nodes.filter(n => !n.data.isConfigured)
  if (unconfiguredNodes.length > 0) {
    errors.push(
      `${unconfiguredNodes.length} node(s) are not configured. ` +
      `Please configure: ${unconfiguredNodes.map(n => n.data.label).join(', ')}`
    )
  }

  // Check that all nodes have providers
  const noProviderNodes = nodes.filter(n =>
    !n.data.provider && n.data.type !== 'filter' && n.data.type !== 'aggregator'
  )
  if (noProviderNodes.length > 0) {
    errors.push(
      `${noProviderNodes.length} node(s) missing provider selection. ` +
      `Please select providers for: ${noProviderNodes.map(n => n.data.label).join(', ')}`
    )
  }

  return {
    valid: errors.length === 0,
    errors
  }
}
```

### 4.2 Update Agent Builder Integration

**File:** `agenty-platform/apps/web/src/components/features/builder/AgentBuilder.tsx`

```typescript
// When saving agent from builder
const handleSaveAgent = async () => {
  const { nodes, edges } = usePipelineStore.getState()

  // Validate pipeline
  const validation = validatePipelineDetailed(nodes, edges)
  if (!validation.valid) {
    toast({
      title: "Invalid Pipeline",
      description: validation.errors.join(', '),
      variant: "destructive"
    })
    return
  }

  // Check backend readiness
  const backendValidation = validatePipelineForBackend(nodes)
  if (!backendValidation.valid) {
    toast({
      title: "Configuration Incomplete",
      description: backendValidation.errors.join(', '),
      variant: "destructive"
    })
    return
  }

  try {
    // Convert pipeline to agent config
    const agentConfig = convertPipelineToAgentConfig(
      nodes,
      edges,
      agentName,
      agentDescription
    )

    // Send to backend
    const response = await fetch('http://localhost:7860/api/v1/agents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(agentConfig)
    })

    if (!response.ok) {
      throw new Error('Failed to create agent')
    }

    const data = await response.json()

    toast({
      title: "Agent Created",
      description: "Your agent has been successfully created!",
    })

    // Navigate to agent test page
    router.push(`/agents/${data.id}/test`)
  } catch (error) {
    toast({
      title: "Error",
      description: error.message,
      variant: "destructive"
    })
  }
}
```

### 4.3 Backend Agent Factory Updates

**File:** `agenty-platform/apps/api/src/services/agent_factory.py`

```python
async def create_pipeline_from_config(
    self,
    agent_config: AgentConfiguration
) -> Pipeline:
    """
    Create Pipecat Pipeline from agent configuration

    Handles both realtime and traditional pipeline types
    """

    # REALTIME PIPELINE
    if agent_config.realtime:
        realtime_service = await self._create_realtime_service(
            agent_config.realtime,
            agent_config.user_id
        )

        # Realtime pipelines are simple - just the service
        pipeline = Pipeline([
            transport.input(),
            realtime_service,
            transport.output()
        ])

        return pipeline

    # TRADITIONAL PIPELINE
    stt_service = await self._create_stt_service(agent_config.stt, user_id)
    llm_service = await self._create_llm_service(agent_config.llm, user_id)
    tts_service = await self._create_tts_service(agent_config.tts, user_id)

    # Build pipeline components list
    components = [
        transport.input(),
        stt_service
    ]

    # Add filters before LLM if configured
    if agent_config.filters:
        before_llm_filters = [f for f in agent_config.filters if f.position == 'before_llm']
        for filter_config in before_llm_filters:
            filter_processor = self._create_filter(filter_config)
            components.append(filter_processor)

    # Add LLM context aggregator
    if agent_config.llm.provider in ['openai', 'azure-openai']:
        components.append(OpenAILLMContext())
    else:
        components.append(LLMContext())

    # Add LLM service
    components.append(llm_service)

    # Add aggregators if configured
    if agent_config.aggregators:
        for agg_config in agent_config.aggregators:
            aggregator = self._create_aggregator(agg_config)
            components.append(aggregator)

    # Add filters after LLM if configured
    if agent_config.filters:
        after_llm_filters = [f for f in agent_config.filters if f.position == 'after_llm']
        for filter_config in after_llm_filters:
            filter_processor = self._create_filter(filter_config)
            components.append(filter_processor)

    # Add TTS service
    components.append(tts_service)
    components.append(transport.output())

    # Create pipeline
    pipeline = Pipeline(components)

    return pipeline
```

---

## Phase 5: Testing & Polish (Week 4)

### 5.1 Unit Tests

**File:** `agenty-platform/apps/web/src/stores/__tests__/usePipelineStore.test.ts`

```typescript
import { describe, it, expect } from 'vitest'
import { isValidConnection, validatePipelineDetailed } from '../usePipelineStore'

describe('Pipeline Validation', () => {
  describe('Connection Validation', () => {
    it('should reject same-type connections', () => {
      const sttNode1 = createNode('stt', 'node1')
      const sttNode2 = createNode('stt', 'node2')

      const result = isValidConnection(sttNode1, sttNode2, [], [])
      expect(result.valid).toBe(false)
      expect(result.error).toContain('same node types')
    })

    it('should accept STT to LLM connection', () => {
      const sttNode = createNode('stt', 'node1')
      const llmNode = createNode('llm', 'node2')

      const result = isValidConnection(sttNode, llmNode, [sttNode, llmNode], [])
      expect(result.valid).toBe(true)
    })

    it('should reject realtime connections', () => {
      const realtimeNode = createNode('realtime', 'node1')
      const llmNode = createNode('llm', 'node2')

      const result = isValidConnection(realtimeNode, llmNode, [], [])
      expect(result.valid).toBe(false)
      expect(result.error).toContain('Realtime nodes')
    })

    it('should detect circular dependencies', () => {
      const stt = createNode('stt', 'stt1')
      const llm = createNode('llm', 'llm1')
      const tts = createNode('tts', 'tts1')

      const edges = [
        { source: 'stt1', target: 'llm1' },
        { source: 'llm1', target: 'tts1' }
      ]

      // Try to connect TTS back to STT (creating cycle)
      const result = isValidConnection(tts, stt, [stt, llm, tts], edges)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('circular')
    })
  })

  describe('Pipeline Validation', () => {
    it('should validate realtime pipeline', () => {
      const realtime = createNode('realtime', 'rt1')
      const result = validatePipelineDetailed([realtime], [])

      expect(result.valid).toBe(true)
      expect(result.type).toBe('realtime')
    })

    it('should reject realtime with other nodes', () => {
      const realtime = createNode('realtime', 'rt1')
      const stt = createNode('stt', 'stt1')

      const result = validatePipelineDetailed([realtime, stt], [])
      expect(result.valid).toBe(false)
      expect(result.errors).toContain(expect.stringContaining('cannot include STT'))
    })

    it('should validate complete traditional pipeline', () => {
      const stt = createNode('stt', 'stt1')
      const llm = createNode('llm', 'llm1')
      const tts = createNode('tts', 'tts1')

      const edges = [
        { source: 'stt1', target: 'llm1' },
        { source: 'llm1', target: 'tts1' }
      ]

      const result = validatePipelineDetailed([stt, llm, tts], edges)
      expect(result.valid).toBe(true)
      expect(result.type).toBe('traditional')
    })

    it('should reject incomplete traditional pipeline', () => {
      const stt = createNode('stt', 'stt1')
      const llm = createNode('llm', 'llm1')
      // Missing TTS

      const result = validatePipelineDetailed([stt, llm], [])
      expect(result.valid).toBe(false)
      expect(result.errors).toContain(expect.stringContaining('Missing TTS'))
    })
  })
})
```

### 5.2 Integration Tests

**File:** `agenty-platform/apps/web/src/utils/__tests__/pipelineConverter.test.ts`

```typescript
describe('Pipeline Conversion', () => {
  it('should convert realtime pipeline correctly', () => {
    const realtime = createConfiguredNode('realtime', 'rt1', 'openai-realtime')

    const config = convertPipelineToAgentConfig(
      [realtime],
      [],
      'Test Agent',
      'Test Description'
    )

    expect(config.pipeline_type).toBe('realtime')
    expect(config.realtime?.provider).toBe('openai-realtime')
    expect(config.stt).toBeUndefined()
  })

  it('should convert traditional pipeline correctly', () => {
    const stt = createConfiguredNode('stt', 'stt1', 'deepgram')
    const llm = createConfiguredNode('llm', 'llm1', 'openai')
    const tts = createConfiguredNode('tts', 'tts1', 'elevenlabs')

    const edges = [
      { source: 'stt1', target: 'llm1' },
      { source: 'llm1', target: 'tts1' }
    ]

    const config = convertPipelineToAgentConfig(
      [stt, llm, tts],
      edges,
      'Test Agent',
      'Test Description'
    )

    expect(config.pipeline_type).toBe('traditional')
    expect(config.stt?.provider).toBe('deepgram')
    expect(config.llm?.provider).toBe('openai')
    expect(config.tts?.provider).toBe('elevenlabs')
  })

  it('should handle filters correctly', () => {
    const stt = createConfiguredNode('stt', 'stt1', 'deepgram')
    const filter = createNode('filter', 'filter1')
    const llm = createConfiguredNode('llm', 'llm1', 'openai')
    const tts = createConfiguredNode('tts', 'tts1', 'elevenlabs')

    const edges = [
      { source: 'stt1', target: 'filter1' },
      { source: 'filter1', target: 'llm1' },
      { source: 'llm1', target: 'tts1' }
    ]

    const config = convertPipelineToAgentConfig(
      [stt, filter, llm, tts],
      edges,
      'Test Agent',
      'Test'
    )

    expect(config.filters).toHaveLength(1)
    expect(config.filters[0].position).toBe('before_llm')
  })
})
```

### 5.3 User Documentation

**File:** `agenty-platform/apps/web/src/components/features/builder/PipelineBuilderHelp.tsx`

Create an interactive help dialog explaining:
- Valid pipeline patterns
- How to connect nodes
- Keyboard shortcuts
- Common errors and solutions
- Video tutorials (future)

---

## Success Metrics

### Phase 1 Success Criteria
- ✅ 100% of invalid connections are prevented
- ✅ Users see helpful error messages for invalid actions
- ✅ No crashes or errors when attempting invalid connections

### Phase 2 Success Criteria
- ✅ Validation panel shows detailed errors, warnings, and suggestions
- ✅ Users can understand what's wrong with their pipeline
- ✅ All 6 invalid scenarios are detected and explained

### Phase 3 Success Criteria
- ✅ Users can create valid pipelines in < 30 seconds using templates
- ✅ Smart suggestions guide users to next steps
- ✅ First-time users understand how to build pipelines

### Phase 4 Success Criteria
- ✅ Visual pipelines successfully convert to Pipecat pipelines
- ✅ Agents created from pipeline builder are fully functional
- ✅ Backend can execute traditional and realtime pipelines

### Phase 5 Success Criteria
- ✅ Test coverage > 80% for validation logic
- ✅ Zero regression bugs in existing functionality
- ✅ User documentation is complete and accessible

---

## Technical Debt & Future Enhancements

### Known Limitations
1. **Single Path Only** - No support for parallel LLM paths (A/B testing)
2. **No Undo/Redo** - Users cannot undo connection mistakes
3. **No Version Control** - Pipeline changes aren't tracked
4. **Limited Filter Types** - Only generic filters, not specific implementations
5. **No Cost Estimation** - Users don't see estimated costs before deploying

### Future Enhancements (Post-Launch)
1. **Visual Debugger** - See frame flow in real-time during testing
2. **Performance Profiling** - Identify bottlenecks in pipeline
3. **A/B Testing Nodes** - Split traffic between multiple LLMs
4. **Conditional Routing** - Route based on user intent or language
5. **Custom Node SDK** - Allow users to create custom processors
6. **Pipeline Marketplace** - Share and discover community pipelines
7. **Version Control** - Track changes and roll back to previous versions
8. **Collaborative Editing** - Multiple users editing same pipeline

---

## Files to Create/Modify

### New Files
1. `agenty-platform/apps/web/src/utils/pipelineConverter.ts`
2. `agenty-platform/apps/web/src/components/features/builder/PipelineValidationPanel.tsx`
3. `agenty-platform/apps/web/src/components/features/builder/PipelineTemplateSelector.tsx`
4. `agenty-platform/apps/web/src/components/features/builder/SmartSuggestionsPanel.tsx`
5. `agenty-platform/apps/web/src/components/features/builder/PipelineBuilderHelp.tsx`
6. `agenty-platform/apps/web/src/stores/__tests__/usePipelineStore.test.ts`
7. `agenty-platform/apps/web/src/utils/__tests__/pipelineConverter.test.ts`

### Files to Modify
1. `agenty-platform/apps/web/src/stores/usePipelineStore.ts` - Add validation logic
2. `agenty-platform/apps/web/src/components/features/builder/PipelineBuilder.tsx` - Integrate new components
3. `agenty-platform/apps/web/src/components/features/builder/TurboNode.tsx` - Add handle highlighting
4. `agenty-platform/apps/web/src/components/features/builder/AgentBuilder.tsx` - Update save logic
5. `agenty-platform/apps/api/src/services/agent_factory.py` - Enhance pipeline creation

---

## Implementation Timeline

### Week 1: Connection Validation (Days 1-3)
- Day 1: Implement `isValidConnection` function and connection rules
- Day 2: Add validation to `onConnect` handler and error toasts
- Day 3: Implement visual handle highlighting during drag

### Week 1-2: Pipeline Validation (Days 4-7)
- Day 4: Implement `validatePipelineDetailed` with all scenarios
- Day 5: Create PipelineValidationPanel component
- Day 6-7: Testing and refinement

### Week 2: User Guidance (Days 8-10)
- Day 8: Create pipeline templates and template selector
- Day 9: Implement smart suggestions panel
- Day 10: Add keyboard shortcuts and help dialog

### Week 3: Backend Integration (Days 11-15)
- Day 11-12: Implement pipeline serialization and conversion
- Day 13-14: Update backend agent factory
- Day 15: End-to-end testing

### Week 4: Testing & Polish (Days 16-20)
- Day 16-17: Write unit and integration tests
- Day 18: User testing and feedback
- Day 19: Bug fixes and polish
- Day 20: Documentation and launch

---

## Conclusion

This implementation plan transforms the Pipeline Builder from a visual-only tool into a production-ready agent creation system. The phased approach ensures each component is validated before moving forward, reducing integration risk.

**Priority order:**
1. **Phase 1** (Critical) - Prevents users from creating broken pipelines
2. **Phase 4** (High) - Makes pipelines actually work
3. **Phase 2** (High) - Helps users fix problems
4. **Phase 3** (Medium) - Improves user experience
5. **Phase 5** (Medium) - Ensures quality

The end result will be a best-in-class visual pipeline builder that makes complex AI agent creation accessible to non-technical users while providing full control for power users.
