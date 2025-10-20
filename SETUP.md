# AI Voicei / Agenty Platform - Team Setup Guide

This guide helps your team clone and run the project successfully on their local machines.

## 🚨 Important: Files Not in Git Repository

Several critical configuration files are **excluded from git** for security and environment-specific reasons:

### Backend Configuration Files (NOT in repo)
- `.env` - Main environment file with API keys
- `.env.production` - Production environment variables
- `.env.development` - Development environment variables

### Frontend Configuration Files (NOT in repo)
- `agenty-platform/apps/web/.env.local` - Next.js local configuration

### Why These Files Are Excluded
These files contain:
- **API Keys**: OpenAI, Anthropic, Google, Deepgram, etc.
- **Database Credentials**: PostgreSQL connection strings
- **Secret Keys**: Encryption keys for provider credentials
- **Environment-Specific Settings**: URLs, ports, IP addresses

## 📋 Prerequisites

- **Python**: 3.10+ (recommended: 3.12)
- **Node.js**: 18+ (for Next.js frontend)
- **UV**: Python package manager ([install guide](https://docs.astral.sh/uv/getting-started/installation/))
- **Git**: For cloning the repository
- **WSL2** (Windows users): For Linux compatibility

## 🛠️ Initial Setup Steps

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd aivoice-pipecat
```

### 2. Backend Setup (Python/FastAPI)

#### A. Copy Environment Template

```bash
cp env.example .env
```

#### B. Edit `.env` with Your API Keys

Open `.env` and add your API keys:

```bash
# Required for basic functionality
GOOGLE_API_KEY=your_google_api_key_here
ANTHROPIC_API_KEY=your_anthropic_key_here  # For "Build with Agenty" feature

# Database (if using PostgreSQL)
DATABASE_URL=postgresql://user:password@localhost:5432/agenty_db

# Optional: Other AI Providers (add as needed)
OPENAI_API_KEY=your_openai_key
DEEPGRAM_API_KEY=your_deepgram_key
ELEVENLABS_API_KEY=your_elevenlabs_key
CARTESIA_API_KEY=your_cartesia_key
# ... see env.example for full list
```

#### C. Install Python Dependencies

```bash
# Install UV if not already installed
curl -LsSf https://astral.sh/uv/install.sh | sh

# Install project dependencies
uv sync --group dev --all-extras --no-extra gstreamer --no-extra krisp --no-extra local
```

### 3. Frontend Setup (Next.js)

#### A. Create Frontend Environment File

```bash
cd agenty-platform/apps/web
```

Create a new file named `.env.local`:

```bash
# .env.local
# Backend API URL - IMPORTANT: This changes based on your environment!

# For standard localhost (most users):
NEXT_PUBLIC_API_URL=http://localhost:7860

# For WSL2 users (Windows Subsystem for Linux):
# Replace with your WSL2 IP address (find it using: hostname -I)
# NEXT_PUBLIC_API_URL=http://172.x.x.x:7860
```

**🔍 Finding Your WSL2 IP Address (Windows/WSL2 users):**

```bash
# Run this in WSL2 terminal:
hostname -I
# Copy the first IP address (usually starts with 172.x.x.x)
```

#### B. Install Frontend Dependencies

```bash
cd agenty-platform/apps/web
npm install
```

## 🚀 Running the Application

### Option 1: Run Both Services Separately

**Terminal 1 - Backend (AI Voicei Server):**
```bash
# From project root
uv run aivoicei_web_server.py
```
Server runs on: `http://localhost:7860`

**Terminal 2 - Frontend (Agenty Platform):**
```bash
cd agenty-platform/apps/web
npm run dev
```
Frontend runs on: `http://localhost:3000`

### Option 2: Quick Start Script (Recommended)

```bash
# From project root
./start_aivoicei.sh
```

This script:
1. Checks if backend is running
2. Starts backend if needed
3. Starts frontend
4. Opens browser automatically

## 🔧 Common Issues & Solutions

### Issue 1: "Missing .env file" Error

**Solution:**
```bash
cp env.example .env
# Then edit .env with your API keys
```

### Issue 2: Frontend Cannot Connect to Backend (CORS errors)

**Symptoms:**
- Network errors in browser console
- "Failed to fetch" errors
- CORS policy errors

**Solution for Standard Users:**
Check `agenty-platform/apps/web/.env.local`:
```bash
NEXT_PUBLIC_API_URL=http://localhost:7860
```

**Solution for WSL2 Users:**
1. Find your WSL2 IP:
   ```bash
   hostname -I
   ```
2. Update `.env.local`:
   ```bash
   NEXT_PUBLIC_API_URL=http://172.x.x.x:7860  # Replace with your IP
   ```

### Issue 3: "Port 7860 already in use"

**Solution:**
```bash
# Find and kill the process
lsof -ti:7860 | xargs kill -9

# Or use netstat
netstat -tulpn | grep 7860
kill -9 <PID>
```

### Issue 4: "Module not found" or Import Errors

**Backend:**
```bash
# Reinstall dependencies
uv sync --group dev --all-extras --no-extra gstreamer --no-extra krisp --no-extra local
```

**Frontend:**
```bash
cd agenty-platform/apps/web
rm -rf node_modules package-lock.json
npm install
```

### Issue 5: RTVI Messages Breaking Into Pieces

**Issue:** Messages appear fragmented in the chat interface.

**Root Cause:** Gemini Multimodal Live streams responses in chunks, and RTVI may not be aggregating them properly.

**Solution:** This is currently being investigated. Temporary workaround:
- Use the basic test interface instead of RTVI
- Wait for complete message before displaying (implementation pending)

## 🌐 Environment-Specific Configuration

### Local Development (localhost)
```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:7860
```

### WSL2 (Windows Subsystem for Linux)
```bash
# .env.local
NEXT_PUBLIC_API_URL=http://172.x.x.x:7860  # Your WSL2 IP
```

### Docker/Container
```bash
# .env.local
NEXT_PUBLIC_API_URL=http://host.docker.internal:7860
```

### Network Testing (Access from other devices)
```bash
# .env.local
NEXT_PUBLIC_API_URL=http://192.168.x.x:7860  # Your network IP
```

## 📝 Environment Files Checklist

Before running the application, ensure you have:

- [ ] ✅ Root `.env` file (copied from `env.example`)
- [ ] ✅ Google API key in `.env`
- [ ] ✅ Anthropic API key in `.env` (for Build with Agenty)
- [ ] ✅ Frontend `.env.local` file with correct API URL
- [ ] ✅ Dependencies installed (both Python and Node.js)
- [ ] ✅ Ports 7860 and 3000 available

## 🔐 Security Best Practices

1. **NEVER commit `.env` files** to git
2. **NEVER share API keys** in public channels
3. **Use separate keys** for development and production
4. **Rotate keys** if accidentally exposed
5. **Keep `.env.local`** in `.gitignore`

## 🆘 Getting Help

If you encounter issues:

1. **Check this guide** for common solutions
2. **Verify all environment files** are created
3. **Check console logs** for specific error messages
4. **Test backend health**: `curl http://localhost:7860/health`
5. **Contact team lead** with error details

## 📚 Additional Resources

- **Pipecat Docs**: https://docs.pipecat.ai
- **Project Documentation**: See `CLAUDE.md` for technical details
- **Examples**: Check `examples/foundational/` directory
- **API Documentation**: Run backend and visit `/docs` endpoint

---

**Last Updated**: January 2025
**Maintained By**: Development Team
