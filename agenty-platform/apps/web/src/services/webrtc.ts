import SimplePeer from 'simple-peer'

/**
 * WebRTC Service Interface
 * Handles direct peer-to-peer connection with Gemini backend
 */
export interface WebRTCService {
  connect(existingStream?: MediaStream): Promise<void>
  disconnect(): void
  sendAudio(stream: MediaStream): void
  enableVideo(): Promise<MediaStream>
  disableVideo(): void
  onAudioReceived(callback: (stream: MediaStream) => void): void
  onTranscript(callback: (text: string, isUser: boolean) => void): void
  onConnectionStateChange(callback: (state: RTCPeerConnectionState) => void): void
  onError(callback: (error: Error) => void): void
  getConnectionState(): RTCPeerConnectionState
}

/**
 * WebRTC Connection Events
 */
interface WebRTCEvents {
  onConnectionStateChange: (state: RTCPeerConnectionState) => void
  onError: (error: Error) => void
  onTranscript: (text: string, isUser: boolean) => void
  onAudioReceived: (stream: MediaStream) => void
}

/**
 * WebRTC Service Implementation
 * Direct peer connection to AI Voicei backend without Daily.co
 */
export class DirectWebRTCService implements WebRTCService {
  private peer: SimplePeer.Instance | null = null
  private localStream: MediaStream | null = null
  private remoteStream: MediaStream | null = null
  private sessionId: string | null = null
  private websocket: WebSocket | null = null
  private isDisconnecting: boolean = false
  private agentId: string | null = null

  // Event callbacks
  private events: Partial<WebRTCEvents> = {}

  // Configuration - Use environment variable for production deployment
  private readonly BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:7860'

  // STUN servers for NAT traversal
  private readonly ICE_SERVERS = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]

  constructor(agentId?: string) {
    this.agentId = agentId || null
    const endpointType = agentId ? `Agent-specific (${agentId})` : 'Default Gemini Live'
    console.log(`[WebRTC] DirectWebRTCService initialized - ${endpointType} - HTTP API SIGNALING - SmallWebRTC Transport - Port 7860`)
  }

  /**
   * Establish WebRTC connection to backend
   */
  async connect(existingStream?: MediaStream): Promise<void> {
    try {
      console.log('[WebRTC] Starting connection process...')

      // Step 1: Initialize WebSocket for signaling
      await this.initializeSignaling()

      // Step 2: Use existing stream or get user media
      if (existingStream) {
        console.log('[WebRTC] Using pre-obtained media stream')
        this.localStream = existingStream
      } else {
        await this.getUserMedia()
      }

      // Step 3: Initialize peer connection
      await this.initializePeer()

      console.log('[WebRTC] Connection process initiated')
    } catch (error) {
      console.error('[WebRTC] Connection failed:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      this.handleError(new Error(`Connection failed: ${errorMessage}`))
      throw error
    }
  }

  /**
   * Initialize HTTP-based signaling with WebSocket for transcript events
   */
  private async initializeSignaling(): Promise<void> {
    console.log('[WebRTC] Initializing signaling with WebSocket for transcripts...')

    // Connect to WebSocket for real-time transcript events
    await this.connectWebSocket()

    return Promise.resolve()
  }

  /**
   * Connect to WebSocket for real-time transcript events
   */
  private async connectWebSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Automatically use wss:// for https:// and ws:// for http://
        const wsProtocol = this.BACKEND_URL.startsWith('https') ? 'wss' : 'ws'
        const wsUrl = this.BACKEND_URL.replace(/^https?/, wsProtocol) + '/websocket'
        console.log('[WebRTC] Connecting to WebSocket:', wsUrl)

        const ws = new WebSocket(wsUrl)

        ws.onopen = () => {
          console.log('[WebRTC] WebSocket connected for transcripts')
          this.websocket = ws

          // Send join message to establish session with backend
          const joinMessage = {
            type: "join",
            session_id: this.sessionId // Will be null initially, backend will assign one
          }

          ws.send(JSON.stringify(joinMessage))
          console.log('[WebRTC] Sent join message to establish session')

          resolve()
        }

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            console.log('[WebRTC] WebSocket message received:', data)

            // Handle transcript events
            if (data.type === 'transcript' && data.text) {
              const isUser = data.speaker === 'user'
              console.log(`[WebRTC] Transcript - ${isUser ? 'User' : 'AI'}: ${data.text}`)
              this.events.onTranscript?.(data.text, isUser)
            }

            // Handle session events
            if (data.type === 'session_start') {
              this.sessionId = data.session_id
              console.log('[WebRTC] Session started:', this.sessionId)
            }

            // Handle join confirmation
            if (data.type === 'joined') {
              this.sessionId = data.session_id
              console.log('[WebRTC] Successfully joined session:', this.sessionId)
            }

          } catch (error) {
            console.error('[WebRTC] Failed to parse WebSocket message:', error)
          }
        }

        ws.onerror = (error) => {
          console.error('[WebRTC] WebSocket error:', error)
          this.handleError(new Error('WebSocket connection failed'))
          reject(error)
        }

        ws.onclose = (event) => {
          console.log('[WebRTC] WebSocket closed:', event.code, event.reason)
          this.websocket = null

          // Only treat as error if we didn't expect the closure
          if (!this.isDisconnecting) {
            this.handleError(new Error('WebSocket connection lost'))
          }
        }

      } catch (error) {
        console.error('[WebRTC] Failed to connect WebSocket:', error)
        reject(error)
      }
    })
  }

  /**
   * Get user media (microphone and camera access for multimodal AI)
   */
  private async getUserMedia(): Promise<void> {
    try {
      console.log('[WebRTC] Requesting microphone access only (video will be added when user enables it)...')

      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000 // Optimize for speech
        },
        video: false // Start with audio only
      })

      console.log('[WebRTC] Microphone and camera access granted')
    } catch (error) {
      console.error('[WebRTC] Microphone and camera access denied:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      throw new Error(`Microphone and camera access denied: ${errorMessage}`)
    }
  }

  /**
   * Initialize direct WebRTC connection with HTTP API
   */
  private async initializePeer(): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log('[WebRTC] Initializing direct WebRTC connection...')

      this.peer = new SimplePeer({
        initiator: true, // Frontend initiates connection
        trickle: false,  // Disable trickle ICE for HTTP API approach
        stream: this.localStream!, // Send microphone audio
        config: {
          iceServers: this.ICE_SERVERS
        }
      })

      // Handle offer generation
      this.peer.on('signal', async (data) => {
        if (data.type === 'offer') {
          console.log('[WebRTC] Generated offer, sending to backend...')
          try {
            await this.sendOfferToBackend(data)
            resolve()
          } catch (error) {
            reject(error)
          }
        }
      })

      this.peer.on('connect', () => {
        console.log('[WebRTC] Peer connection established')
        this.updateConnectionState('connected')
      })

      this.peer.on('stream', (stream) => {
        console.log('[WebRTC] Received remote audio stream')
        this.remoteStream = stream
        this.events.onAudioReceived?.(stream)
      })

      this.peer.on('error', (error) => {
        console.error('[WebRTC] Peer connection error:', error)
        this.handleError(error)
        reject(error)
      })

      this.peer.on('close', () => {
        console.log('[WebRTC] Peer connection closed')
        this.updateConnectionState('closed')
      })

      // Setup connection state monitoring
      this.setupConnectionStateMonitoring()
    })
  }

  /**
   * Send WebRTC offer to backend via HTTP API
   * Uses dynamic agent endpoint if agentId is provided, otherwise uses default Gemini endpoint
   */
  private async sendOfferToBackend(offer: RTCSessionDescriptionInit): Promise<void> {
    try {
      // Determine endpoint based on whether we have an agentId
      const endpoint = this.agentId
        ? `${this.BACKEND_URL}/api/agents/${this.agentId}/offer`
        : `${this.BACKEND_URL}/api/offer`

      console.log(`[WebRTC] Sending offer to endpoint: ${endpoint}`)

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: offer.type,
          sdp: offer.sdp,
          session_id: this.sessionId
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`)
      }

      const answer = await response.json()
      console.log('[WebRTC] Received answer from backend:', answer)

      // Store session ID from response
      if (answer.session_id) {
        this.sessionId = answer.session_id
      }

      // Log agent name if testing specific agent
      if (answer.agent_name) {
        console.log(`[WebRTC] Testing agent: ${answer.agent_name}`)
      }

      // Apply answer to peer connection
      if (this.peer && answer.type === 'answer') {
        this.peer.signal(answer)
      }

    } catch (error) {
      console.error('[WebRTC] Failed to send offer to backend:', error)
      throw error
    }
  }

  /**
   * Get session ID (if available)
   */
  getSessionId(): string | null {
    return this.sessionId
  }

  /**
   * Monitor peer connection state changes
   */
  private setupConnectionStateMonitoring(): void {
    if (!this.peer) return

    // Access underlying RTCPeerConnection for state monitoring
    const pc = (this.peer as unknown as { _pc: RTCPeerConnection })._pc

    pc.onconnectionstatechange = () => {
      const state = pc.connectionState
      console.log(`[WebRTC] Connection state: ${state}`)
      this.updateConnectionState(state)
    }
  }

  /**
   * Update connection state and notify listeners
   */
  private updateConnectionState(state: RTCPeerConnectionState): void {
    this.events.onConnectionStateChange?.(state)
  }

  /**
   * Handle WebRTC errors
   */
  private handleError(error: Error): void {
    console.error('[WebRTC] Error:', error)
    this.events.onError?.(error)
  }

  /**
   * Send audio stream to backend
   */
  sendAudio(stream: MediaStream): void {
    if (!this.peer) {
      console.warn('[WebRTC] Cannot send audio - no peer connection')
      return
    }

    try {
      // Replace audio track in existing stream
      const audioTrack = stream.getAudioTracks()[0]
      if (audioTrack && this.peer) {
        console.log('[WebRTC] Updating audio stream')
        this.peer.replaceTrack(
          this.localStream!.getAudioTracks()[0],
          audioTrack,
          this.localStream!
        )
      }
    } catch (error) {
      console.error('[WebRTC] Failed to send audio:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      this.handleError(new Error(`Failed to send audio: ${errorMessage}`))
    }
  }

  /**
   * Register callback for incoming audio
   */
  onAudioReceived(callback: (stream: MediaStream) => void): void {
    this.events.onAudioReceived = callback
  }

  /**
   * Register callback for transcript events
   */
  onTranscript(callback: (text: string, isUser: boolean) => void): void {
    this.events.onTranscript = callback
  }

  /**
   * Register callback for connection state changes
   */
  onConnectionStateChange(callback: (state: RTCPeerConnectionState) => void): void {
    this.events.onConnectionStateChange = callback
  }

  /**
   * Register callback for errors
   */
  onError(callback: (error: Error) => void): void {
    this.events.onError = callback
  }

  /**
   * Get current connection state
   */
  getConnectionState(): RTCPeerConnectionState {
    if (!this.peer) return 'closed'

    const pc = (this.peer as unknown as { _pc: RTCPeerConnection })._pc
    return pc.connectionState
  }

  /**
   * Enable video with proper configuration
   */
  async enableVideo(): Promise<MediaStream> {
    try {
      console.log('[WebRTC] Enabling video with proper configuration...')

      // Get video stream with the proper configuration
      const videoStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 15 }, // Optimize for AI processing
          facingMode: 'user' // Front-facing camera
        },
        audio: false // Only get video, audio is already handled
      })

      // Add video track to existing peer connection
      if (this.peer && this.localStream) {
        const videoTrack = videoStream.getVideoTracks()[0]
        if (videoTrack) {
          console.log('[WebRTC] Adding video track to peer connection')
          this.peer.addTrack(videoTrack, this.localStream)

          // Add video track to local stream
          this.localStream.addTrack(videoTrack)
        }
      }

      console.log('[WebRTC] Video enabled successfully')
      return videoStream

    } catch (error) {
      console.error('[WebRTC] Failed to enable video:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      throw new Error(`Failed to enable video: ${errorMessage}`)
    }
  }

  /**
   * Disable video and remove video tracks
   */
  disableVideo(): void {
    try {
      console.log('[WebRTC] Disabling video...')

      if (this.localStream) {
        // Remove and stop all video tracks
        const videoTracks = this.localStream.getVideoTracks()
        videoTracks.forEach(track => {
          console.log('[WebRTC] Removing video track')
          this.localStream!.removeTrack(track)
          track.stop()
        })
      }

      console.log('[WebRTC] Video disabled successfully')
    } catch (error) {
      console.error('[WebRTC] Failed to disable video:', error)
    }
  }

  /**
   * Disconnect and cleanup
   */
  disconnect(): void {
    console.log('[WebRTC] Disconnecting...')

    try {
      // Set disconnecting flag
      this.isDisconnecting = true

      // Close WebSocket connection
      if (this.websocket) {
        this.websocket.close()
        this.websocket = null
      }

      // Stop local media streams
      if (this.localStream) {
        this.localStream.getTracks().forEach(track => track.stop())
        this.localStream = null
      }

      // Stop remote media streams
      if (this.remoteStream) {
        this.remoteStream.getTracks().forEach(track => track.stop())
        this.remoteStream = null
      }

      // Close peer connection
      if (this.peer) {
        this.peer.destroy()
        this.peer = null
      }

      // Clear session
      this.sessionId = null

      // Clear event handlers
      this.events = {}

      // Reset disconnecting flag
      this.isDisconnecting = false

      console.log('[WebRTC] Disconnected successfully')
    } catch (error) {
      console.error('[WebRTC] Error during disconnect:', error)
    }
  }
}

/**
 * Create WebRTC service instance
 */
export function createWebRTCService(agentId?: string): WebRTCService {
  return new DirectWebRTCService(agentId)
}

/**
 * WebRTC service singleton (per agent)
 */
const webrtcServiceInstances: Map<string, WebRTCService> = new Map()

export function getWebRTCService(agentId?: string): WebRTCService {
  const key = agentId || 'default'

  if (!webrtcServiceInstances.has(key)) {
    webrtcServiceInstances.set(key, createWebRTCService(agentId))
  }
  return webrtcServiceInstances.get(key)!
}

/**
 * Clear WebRTC service instance (useful when switching agents)
 */
export function clearWebRTCService(agentId?: string): void {
  const key = agentId || 'default'
  const service = webrtcServiceInstances.get(key)

  if (service) {
    service.disconnect()
    webrtcServiceInstances.delete(key)
  }
}