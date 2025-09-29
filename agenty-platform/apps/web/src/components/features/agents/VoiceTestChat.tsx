'use client'

import { useState, useEffect, useRef } from 'react'
import { Mic, MicOff, Phone, PhoneOff, Loader2, Video, VideoOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useVoiceStore } from '@/stores/voiceStore'
import type { Agent } from '@/services/api'

interface VoiceTestChatProps {
  agent: Agent
  isActive: boolean
  onMessage: (message: string, isUser: boolean) => void
  onTestStateChange: (isActive: boolean) => void
}


export function VoiceTestChat({ agent, isActive, onTestStateChange }: VoiceTestChatProps) {
  const {
    isConnected,
    // isCallActive,
    connectionState,
    error,
    // sessionId,
    localStream,
    // remoteStream,
    // isRecording,
    // peerConnectionState,
    // messages,
    isAssistantSpeaking,
    isVideoEnabled,
    videoStream,
    callType,
    // isCallTypeSelected,
    connect,
    disconnect,
    // setCallActive,
    setCallType,
    startRecording,
    stopRecording,
    // clearMessages,
    enableVideo,
    disableVideo
  } = useVoiceStore()

  const [isMuted, setIsMuted] = useState(false)
  const [audioLevel, setAudioLevel] = useState(0)
  const [isVoiceActive, setIsVoiceActive] = useState(false)
  const [isCallTypeSelected, setIsCallTypeSelected] = useState(false)

  // Audio elements and video ref
  const localAudioRef = useRef<HTMLAudioElement>(null)
  const remoteAudioRef = useRef<HTMLAudioElement>(null)
  const userVideoRef = useRef<HTMLVideoElement>(null)

  // Audio analysis refs
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationIdRef = useRef<number | null>(null)

  useEffect(() => {
    if (!isActive && connectionState !== 'idle') {
      handleDisconnect()
    }
  }, [isActive, connectionState])

  useEffect(() => {
    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current)
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close()
      }
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop())
      }
      if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop())
      }
    }
  }, [localStream, videoStream])

  // Update video element when videoStream changes
  useEffect(() => {
    if (userVideoRef.current && videoStream) {
      userVideoRef.current.srcObject = videoStream
    }
  }, [videoStream])

  // Setup audio analysis when localStream becomes available
  useEffect(() => {
    if (localStream) {
      setupAudioAnalysis(localStream)
    }
  }, [localStream])

  const cleanup = () => {
    if (animationIdRef.current) {
      cancelAnimationFrame(animationIdRef.current)
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close()
    }
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop())
    }
    if (videoStream) {
      videoStream.getTracks().forEach(track => track.stop())
    }
  }

  const setupAudioAnalysis = (stream: MediaStream) => {
    try {
      audioContextRef.current = new AudioContext()
      analyserRef.current = audioContextRef.current.createAnalyser()

      const source = audioContextRef.current.createMediaStreamSource(stream)
      source.connect(analyserRef.current)

      analyserRef.current.fftSize = 256
      const bufferLength = analyserRef.current.frequencyBinCount
      const dataArray = new Uint8Array(bufferLength)

      const analyzeAudio = () => {
        if (!analyserRef.current) return

        analyserRef.current.getByteFrequencyData(dataArray)
        const average = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength
        const normalizedLevel = Math.min(average / 128, 1)

        setAudioLevel(normalizedLevel)
        setIsVoiceActive(normalizedLevel > 0.1)

        animationIdRef.current = requestAnimationFrame(analyzeAudio)
      }

      analyzeAudio()
    } catch (error) {
      console.error('Failed to setup audio analysis:', error)
    }
  }

  const handleConnect = async () => {
    try {
      // First connect to the session
      if (!isConnected) {
        await connect()
      }

      // Start recording immediately after connection attempt
      await startRecording()
      onTestStateChange(true)

    } catch (error) {
      console.error('Failed to connect:', error)
      onTestStateChange(false)
    }
  }

  const handleDisconnect = () => {
    // Stop recording first
    stopRecording()
    // Disconnect the session
    disconnect()
    // Reset mute state
    setIsMuted(false)
    onTestStateChange(false)
    cleanup()
  }


  const toggleMute = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled
        setIsMuted(!audioTrack.enabled)
      }
    }
  }

  const toggleVideo = async () => {
    if (isVideoEnabled) {
      await disableVideo()
    } else {
      await enableVideo()
    }
  }

  const getStatusBadge = () => {
    const baseClasses = "px-3 py-1 rounded-full text-xs font-medium"

    switch (connectionState) {
      case 'connected':
        return (
          <Badge className={`${baseClasses} bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100`}>
            Connected
          </Badge>
        )
      case 'connecting':
        return (
          <Badge className={`${baseClasses} bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100`}>
            Connecting...
          </Badge>
        )
      case 'error':
        return (
          <Badge className={`${baseClasses} bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100`}>
            Error
          </Badge>
        )
      default:
        return (
          <Badge className={`${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100`}>
            Not Connected
          </Badge>
        )
    }
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      {/* Hidden audio elements */}
      <audio ref={localAudioRef} muted autoPlay style={{ display: 'none' }} />
      <audio ref={remoteAudioRef} autoPlay style={{ display: 'none' }} />

      {/* Status */}
      <div className="flex justify-center">
        {getStatusBadge()}
      </div>

      {/* Call Type Selection */}
      {!isActive && !isCallTypeSelected && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-center">Choose Test Type</h3>
          <div className="flex flex-col gap-3">
            <Button
              onClick={() => {
                setCallType('audio')
                setIsCallTypeSelected(true)
              }}
              variant="outline"
              className="h-16 flex items-center justify-center gap-3"
            >
              <Phone className="w-6 h-6" />
              <div className="text-center">
                <div className="font-medium">Audio Test</div>
                <div className="text-xs text-muted-foreground">Voice only</div>
              </div>
            </Button>
            <Button
              onClick={() => {
                setCallType('video')
                setIsCallTypeSelected(true)
              }}
              variant="outline"
              className="h-16 flex items-center justify-center gap-3"
            >
              <Video className="w-6 h-6" />
              <div className="text-center">
                <div className="font-medium">Video Test</div>
                <div className="text-xs text-muted-foreground">Voice and video</div>
              </div>
            </Button>
          </div>
        </div>
      )}

      {/* Call Type Selected Info */}
      {!isActive && isCallTypeSelected && (
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30">
            {callType === 'video' ? <Video className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
            <span className="text-sm font-medium">
              {callType === 'video' ? 'Video Test' : 'Audio Test'}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Click &quot;Start Test&quot; to begin
          </p>
        </div>
      )}

      {/* User Video Preview */}
      {isVideoEnabled && videoStream && (
        <div className="relative">
          <video
            ref={userVideoRef}
            autoPlay
            muted
            playsInline
            className="w-full max-w-xs mx-auto aspect-video bg-muted rounded-lg border-2 border-primary/30 object-cover"
          />
          <div className="absolute top-2 right-2">
            <Button
              onClick={toggleVideo}
              size="sm"
              variant="secondary"
              className="h-8 w-8 p-0 bg-black/50 hover:bg-black/70 border-none"
            >
              <VideoOff className="h-4 w-4 text-white" />
            </Button>
          </div>
        </div>
      )}

      {/* Video Control Button */}
      {!isVideoEnabled && callType === 'video' && isCallTypeSelected && (
        <div className="text-center">
          <Button
            onClick={toggleVideo}
            variant="outline"
            className="mb-2"
          >
            <Video className="w-4 h-4 mr-2" />
            Enable Video
          </Button>
          <p className="text-xs text-muted-foreground">Enable camera for video test</p>
        </div>
      )}

      {/* Voice Indicator */}
      <div className="relative flex justify-center">
        <button
          onClick={connectionState === 'connected' ? toggleMute : undefined}
          disabled={connectionState !== 'connected'}
          className={`w-32 h-32 rounded-full border-2 flex items-center justify-center transition-all duration-500 ease-out transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-primary/30 ${
            connectionState === 'connected'
              ? `border-primary bg-primary/10 cursor-pointer ${
                  isMuted ? 'bg-red-500/20 border-red-500' :
                  isVoiceActive ? 'shadow-lg shadow-primary/30' : 'animate-pulse'
                }`
              : 'border-border bg-card/50 hover:border-primary/50 cursor-default'
          }`}
          style={{
            transform: connectionState === 'connected' && isVoiceActive ? `scale(${1 + audioLevel * 0.15})` : 'scale(1)',
            boxShadow: connectionState === 'connected' && isVoiceActive ? `0 0 ${25 + audioLevel * 40}px rgba(59, 130, 246, ${0.3 + audioLevel * 0.4})` : 'none'
          }}
        >
          {connectionState === 'connecting' ? (
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-primary/20 animate-ping absolute"></div>
              <Mic className="w-12 h-12 text-primary relative z-10" />
            </div>
          ) : connectionState === 'connected' ? (
            isMuted ? (
              <MicOff className="w-12 h-12 text-red-500 transition-all duration-300 z-10" />
            ) : (
              <Mic className={`w-12 h-12 transition-all duration-300 z-10 ${
                isVoiceActive ? 'text-primary scale-110' : 'text-primary/70 scale-100'
              }`} />
            )
          ) : (
            <MicOff className="w-12 h-12 text-muted-foreground transition-all duration-300" />
          )}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="text-center text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Controls */}
      {isCallTypeSelected && (
        <div className="flex justify-center">
          {!isConnected ? (
            <Button
              onClick={handleConnect}
              disabled={false}
              className="px-8 py-4 text-base h-auto rounded-xl"
            >
              {callType === 'video' ? (
                <Video className="w-5 h-5 mr-3" />
              ) : (
                <Phone className="w-5 h-5 mr-3" />
              )}
              {`Start ${callType === 'video' ? 'Video' : 'Audio'} Test`}
            </Button>
          ) : (
            <Button
              onClick={handleDisconnect}
              variant="destructive"
              className="px-8 py-4 text-base h-auto rounded-xl"
            >
              <PhoneOff className="w-5 h-5 mr-3" />
              End Test
            </Button>
          )}
        </div>
      )}

      {/* Instructions */}
      <div className="text-sm text-center text-muted-foreground">
        {connectionState === 'connected' ? (
          <div className="space-y-2">
            <p className="font-medium text-primary">Test Active - Speak naturally</p>
            <div className="flex items-center justify-center gap-2 text-xs">
              <div className={`w-2 h-2 rounded-full ${isAssistantSpeaking ? 'bg-primary animate-pulse' : 'bg-muted-foreground'}`} />
              <span>Testing with {agent.name}</span>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="font-medium">Test your agent&apos;s voice interaction</p>
            <p className="text-xs">Select a test type and start interacting with your agent</p>
          </div>
        )}
      </div>
    </div>
  )
}