import SimplePeer from 'simple-peer'

/**
 * WebRTC Service Interface
 * Handles direct peer-to-peer connection with Gemini backend
 */
export interface WebRTCService {
  connect(): Promise<void>
  disconnect(): void
  sendAudio(stream: MediaStream): void
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

  // Event callbacks
  private events: Partial<WebRTCEvents> = {}

  // Configuration
  private readonly BACKEND_URL = 'http://localhost:7860'

  // STUN servers for NAT traversal
  private readonly ICE_SERVERS = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]

  constructor() {
    console.log('[WebRTC] DirectWebRTCService initialized - HTTP API SIGNALING - SmallWebRTC Transport - Port 7860')
  }

  /**
   * Establish WebRTC connection to backend
   */
  async connect(): Promise<void> {
    try {
      console.log('[WebRTC] Starting connection process...')

      // Step 1: Initialize WebSocket for signaling
      await this.initializeSignaling()

      // Step 2: Get user media (microphone)
      await this.getUserMedia()

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
   * Initialize HTTP-based signaling with /api/offer endpoint
   */
  private async initializeSignaling(): Promise<void> {
    console.log('[WebRTC] Using HTTP API signaling...')
    // No WebSocket needed - we'll use HTTP API for signaling
    return Promise.resolve()
  }

  /**
   * Get user media (microphone access)
   */
  private async getUserMedia(): Promise<void> {
    try {
      console.log('[WebRTC] Requesting microphone access...')

      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000 // Optimize for speech
        },
        video: false
      })

      console.log('[WebRTC] Microphone access granted')
    } catch (error) {
      console.error('[WebRTC] Microphone access denied:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      throw new Error(`Microphone access denied: ${errorMessage}`)
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
   */
  private async sendOfferToBackend(offer: any): Promise<void> {
    try {
      const response = await fetch(`${this.BACKEND_URL}/api/offer`, {
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
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const answer = await response.json()
      console.log('[WebRTC] Received answer from backend:', answer)

      // Store session ID from response
      if (answer.session_id) {
        this.sessionId = answer.session_id
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
    const pc = (this.peer as any)._pc as RTCPeerConnection

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

    const pc = (this.peer as any)._pc as RTCPeerConnection
    return pc.connectionState
  }

  /**
   * Disconnect and cleanup
   */
  disconnect(): void {
    console.log('[WebRTC] Disconnecting...')

    try {
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

      console.log('[WebRTC] Disconnected successfully')
    } catch (error) {
      console.error('[WebRTC] Error during disconnect:', error)
    }
  }
}

/**
 * Create WebRTC service instance
 */
export function createWebRTCService(): WebRTCService {
  return new DirectWebRTCService()
}

/**
 * WebRTC service singleton
 */
let webrtcServiceInstance: WebRTCService | null = null

export function getWebRTCService(): WebRTCService {
  if (!webrtcServiceInstance) {
    webrtcServiceInstance = createWebRTCService()
  }
  return webrtcServiceInstance
}