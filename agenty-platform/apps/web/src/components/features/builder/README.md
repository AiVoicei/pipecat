# Pipeline Builder Components

A complete visual pipeline builder for creating voice AI agent workflows using drag & drop interface.

## Components

### PipelineBuilder
Main component that provides the complete pipeline building interface.

```tsx
import { PipelineBuilder } from '@/components/features/builder'

<PipelineBuilder
  agentId="optional-agent-id"
  readonly={false}
/>
```

**Props:**
- `agentId?: string` - Optional agent ID for integration
- `readonly?: boolean` - If true, disables editing capabilities

### PipelineNode
Custom React Flow node component for pipeline elements.

**Features:**
- Visual node representation for STT, LLM, TTS, filters, etc.
- Configuration status indicators
- Provider information display
- Selection handling

### PipelineToolbar
Draggable component toolbar for adding nodes to the pipeline.

**Features:**
- Categorized component sections (Core, Processing)
- Drag & drop functionality
- Usage instructions
- Helpful tips

### PipelineNodeConfig
Configuration panel for selected pipeline nodes.

**Features:**
- Dynamic configuration forms based on node type
- Provider selection
- Real-time validation
- Configuration persistence

## Store Integration

Uses `usePipelineStore` for state management:

```tsx
import { usePipelineStore } from '@/stores/usePipelineStore'

const {
  nodes,
  edges,
  addNode,
  updateNode,
  validatePipeline,
  savePipeline
} = usePipelineStore()
```

## Pipeline Validation

The builder includes built-in validation:
- Requires at least STT → LLM → TTS flow
- Validates node configurations
- Checks proper connections
- Provides visual feedback

## Supported Node Types

- **STT (Speech-to-Text)**: OpenAI, Deepgram, Google, etc.
- **LLM (Language Model)**: GPT-4, Claude, Gemini, etc.
- **TTS (Text-to-Speech)**: ElevenLabs, Azure, OpenAI, etc.
- **Filters**: Data processing and filtering
- **Aggregators**: Data collection and combination
- **Custom**: User-defined processing functions

## Usage Example

```tsx
'use client'

import { PipelineBuilder } from '@/components/features/builder'

export default function BuilderPage() {
  return (
    <div className="h-screen">
      <PipelineBuilder />
    </div>
  )
}
```

## Dependencies

- `reactflow` - Flow diagram functionality
- `@dnd-kit/core` - Drag and drop
- `zustand` - State management
- `radix-ui` - UI components

## Internationalization

Fully supports Hebrew and English with proper RTL handling.
All text is translatable through the `useLanguage` context.