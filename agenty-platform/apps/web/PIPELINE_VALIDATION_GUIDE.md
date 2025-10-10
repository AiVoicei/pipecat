# Pipeline Builder Validation Guide

## Overview

The Pipeline Builder includes comprehensive connection validation to ensure you create valid, executable pipelines. This guide explains the validation rules and how to create successful agent pipelines.

## Valid Pipeline Patterns

### Pattern 1: Traditional Pipeline (Most Common)

```
┌─────┐    ┌─────┐    ┌─────┐
│ STT │ -> │ LLM │ -> │ TTS │
└─────┘    └─────┘    └─────┘
```

**Requirements:**
- Exactly 1 STT (Speech-to-Text) node
- Exactly 1 LLM (Language Model) node
- Exactly 1 TTS (Text-to-Speech) node
- Must be connected in sequence: STT → LLM → TTS

**Examples:**
- Deepgram → GPT-4 → ElevenLabs
- Whisper → Claude → Cartesia
- Azure STT → Anthropic → Azure TTS

### Pattern 2: Realtime Speech-to-Speech (Simplified)

```
┌──────────────┐
│   REALTIME   │
└──────────────┘
```

**Requirements:**
- Exactly 1 Realtime node
- NO other nodes allowed
- NO connections allowed

**Why This Works:**
Realtime providers (OpenAI Realtime API, Gemini 2.0 Flash Live) handle the entire pipeline internally.

### Pattern 3: Enhanced Pipeline with Filters/Aggregators

```
┌─────┐    ┌────────┐    ┌─────┐    ┌─────┐
│ STT │ -> │ FILTER │ -> │ LLM │ -> │ TTS │
└─────┘    └────────┘    └─────┘    └─────┘
```

**Requirements:**
- Must have core STT → LLM → TTS chain
- Filters/Aggregators can be inserted between any nodes
- Cannot break the main flow

**Use Cases:**
- Wake word detection (STT → Wake Filter → LLM → TTS)
- Content filtering (STT → LLM → Profanity Filter → TTS)
- Context aggregation (STT → Context Aggregator → LLM → TTS)

## Validation Rules

### Rule 1: No Same-Type Connections ❌

**Invalid Examples:**
- STT → STT (redundant processing)
- LLM → LLM (inefficient)
- TTS → TTS (cannot chain voice outputs)

**Why Invalid:** Each node type has a specific role. Connecting identical types doesn't add value and breaks Pipecat's frame processing model.

**Error Message:** "Cannot connect {TYPE} to {TYPE}. Same node types cannot be connected."

### Rule 2: Realtime Nodes Work Independently ❌

**Invalid Examples:**
- REALTIME → LLM (realtime handles LLM internally)
- STT → REALTIME (realtime handles STT internally)
- REALTIME → TTS (realtime handles TTS internally)

**Why Invalid:** Realtime providers are all-in-one services. They manage the entire pipeline internally and don't accept external processing nodes.

**Error Message:** "Realtime nodes work independently and cannot be connected to other nodes."

### Rule 3: Valid Connection Mappings ✅

**Allowed Connections:**
- **STT can connect to:** LLM, Filter, Aggregator
- **LLM can connect to:** TTS, Filter, Aggregator
- **TTS can connect to:** Nothing (terminal node)
- **Filter can connect to:** LLM, TTS, Aggregator
- **Aggregator can connect to:** LLM, TTS
- **Realtime can connect to:** Nothing (standalone)

**Invalid Examples:**
- STT → TTS (missing LLM intelligence)
- TTS → LLM (backwards flow)
- LLM → STT (backwards flow)

**Error Message:** "{SOURCE} cannot connect to {TARGET}. Valid connections: {allowed types}."

### Rule 4: No Circular Dependencies ❌

**Invalid Example:**
```
STT → LLM → Filter → STT  ❌ Creates infinite loop
```

**Why Invalid:** Circular connections create infinite loops that prevent pipeline execution.

**Error Message:** "This connection would create a circular dependency."

### Rule 5: No Duplicate Connections ❌

**Invalid Example:**
```
STT ──→ LLM  (connection 1)
    └──→     (trying to create connection 2 - duplicate!)
```

**Why Invalid:** Multiple connections between the same two nodes are redundant.

**Error Message:** "Connection already exists between these nodes."

## How Validation Works

### Real-Time Validation

The Pipeline Builder validates connections **as you create them**:

1. **Drag Connection:** Start dragging from a node's output handle
2. **Visual Feedback:** Valid target nodes show green handles, invalid ones show gray
3. **Drop Validation:** When you drop, validation runs automatically
4. **Error Notification:** If invalid, you'll see a toast notification with the specific error
5. **Connection Prevented:** Invalid connections are not created

### Visual Feedback

- ✅ **Green handles:** Valid connection target
- ❌ **Red/disabled handles:** Invalid connection target
- 🔴 **Error toast:** Explains why connection failed
- ✅ **Success:** Connection appears with smooth animation

## Common Error Scenarios

### Scenario 1: "Cannot connect STT to STT"

**Problem:** You tried to connect two STT nodes together.

**Solution:**
- Remove one STT node
- Connect STT to an LLM node instead
- Each pipeline needs only one STT node

### Scenario 2: "Realtime nodes work independently"

**Problem:** You added a realtime node alongside traditional STT/LLM/TTS nodes.

**Solution:**
- **Option A:** Keep only the realtime node (remove STT, LLM, TTS)
- **Option B:** Remove the realtime node (keep traditional pipeline)
- You can't mix realtime with traditional components

### Scenario 3: "STT cannot connect to TTS"

**Problem:** You tried to connect STT directly to TTS, skipping the LLM.

**Solution:**
- Add an LLM node between STT and TTS
- Correct order: STT → LLM → TTS
- The LLM provides the "intelligence" layer

### Scenario 4: "This connection would create a circular dependency"

**Problem:** Your connection would create a loop in the pipeline.

**Solution:**
- Review your connections
- Remove the connection that creates the loop
- Pipelines must flow in one direction: Input → Processing → Output

### Scenario 5: "Connection already exists"

**Problem:** You tried to create a duplicate connection.

**Solution:**
- Check if the connection already exists (look for the edge/line)
- If you want to change the connection, delete the old one first
- Each connection should be unique

## Tips for Success

### Start with Templates 🎯

Use the Quick Start Templates for pre-validated pipeline configurations:
- OpenAI Realtime (simplest)
- OpenAI Complete (STT → LLM → TTS)
- Claude + ElevenLabs
- Azure Complete
- Enhanced with Filters

### Build Step-by-Step 🔨

1. **Add STT Node:** Start with speech input
2. **Add LLM Node:** Add intelligence layer
3. **Connect STT → LLM:** Create first connection
4. **Add TTS Node:** Add voice output
5. **Connect LLM → TTS:** Complete the pipeline

### Use Filters Wisely 🎨

Insert filters between main nodes:
- **Before LLM:** Wake word detection, speech preprocessing
- **After LLM:** Content filtering, profanity detection
- **Both:** For multi-stage processing

### Check Validation Status ✅

Look for the validation badge in the header:
- **Green "Valid":** Pipeline is ready to deploy
- **Red "Invalid":** Review errors and fix connections
- **Yellow "Incomplete":** Add missing nodes

## Keyboard Shortcuts

- **Delete:** Remove selected node (and its connections)
- **Escape:** Deselect current node
- **Ctrl/Cmd + S:** Save pipeline
- **Ctrl/Cmd + Z:** Undo (coming soon)

## Getting Help

### Validation Panel

Click the "Validate" button to see:
- ✅ Current pipeline status
- ❌ List of errors
- ⚠️ Warnings to consider
- 💡 Suggestions for fixes

### Smart Suggestions

The Smart Suggestions panel automatically recommends:
- Next nodes to add
- Missing components
- Configuration steps
- Template alternatives

### Error Messages

All error messages include:
- **What went wrong:** Clear description of the issue
- **Why it's invalid:** Technical explanation
- **How to fix it:** Actionable solution

## Advanced Topics

### Filter Positioning

Filters can be inserted at different points:
- **STT → Filter → LLM:** Preprocessing (wake words, noise reduction)
- **STT → LLM → Filter → TTS:** Post-processing (content filtering)
- **Both:** Multi-stage filtering pipeline

### Aggregator Usage

Aggregators collect and structure data:
- **Context Aggregator:** Build conversation context for LLM
- **Sentence Aggregator:** Wait for complete sentences before TTS
- **Custom Aggregators:** Define your own aggregation logic

### Multiple Filters

You can chain multiple filters:
```
STT → Wake Filter → Context Agg → LLM → Profanity Filter → TTS
```

Just ensure the chain maintains valid connections at each step.

## Testing Your Pipeline

### Simulation Mode

Click "Simulate" to:
- See data flow animations
- View mock metrics
- Test edge connections
- Verify visual layout

### Real Testing

Save your pipeline and click "Test Agent" to:
- Run actual WebRTC voice session
- Test with real AI providers
- Monitor latency and performance
- Debug issues in production-like environment

## FAQ

**Q: Can I have multiple LLM nodes for A/B testing?**
A: Not yet - this feature is planned for Phase 4 (parallel pipelines).

**Q: Why can't I connect TTS to anything?**
A: TTS is a terminal node (end of pipeline). It produces audio output that goes to the transport layer, not to other nodes.

**Q: Can I use both OpenAI Realtime AND traditional LLM?**
A: No. Realtime providers handle everything internally. Choose one approach per pipeline.

**Q: How do I fix a circular dependency?**
A: Review your connections and remove the one that completes the loop. Pipelines must flow in one direction.

**Q: Can I connect Filter directly to TTS?**
A: Yes, if the filter is receiving text from an LLM. The full chain would be: STT → LLM → Filter → TTS.

## Summary

The Pipeline Builder validation system ensures you create **valid, executable pipelines** by:

1. ✅ Preventing invalid connections in real-time
2. 📝 Providing clear, helpful error messages
3. 💡 Suggesting fixes and next steps
4. 🎯 Offering pre-validated templates
5. 🔍 Validating complete pipeline configuration

Follow the rules, use the visual feedback, and you'll create production-ready voice AI agents quickly and confidently!

---

**Need More Help?**
- Check the template gallery for examples
- Use the Validate button for detailed feedback
- Review error messages carefully
- Start simple and add complexity gradually
