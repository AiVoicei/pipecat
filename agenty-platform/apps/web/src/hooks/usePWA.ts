'use client'

import { useEffect, useState } from 'react'

interface PWAInstallPrompt extends Event {
  prompt(): Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

interface PWAState {
  isInstallable: boolean
  isInstalled: boolean
  isOffline: boolean
  isUpdateAvailable: boolean
  installPrompt: PWAInstallPrompt | null
}

export function usePWA() {
  const [pwaState, setPWAState] = useState<PWAState>({
    isInstallable: false,
    isInstalled: false,
    isOffline: false,
    isUpdateAvailable: false,
    installPrompt: null
  })

  const [serviceWorker, setServiceWorker] = useState<ServiceWorkerRegistration | null>(null)

  useEffect(() => {
    // Check if PWA is already installed
    const checkInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      const isIOSStandalone = (window.navigator as any).standalone === true
      const isInstalled = isStandalone || isIOSStandalone

      setPWAState(prev => ({ ...prev, isInstalled }))
    }

    // Register service worker
    const registerServiceWorker = async () => {
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/'
          })

          setServiceWorker(registration)

          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setPWAState(prev => ({ ...prev, isUpdateAvailable: true }))
                }
              })
            }
          })

          // Listen for waiting service worker
          if (registration.waiting) {
            setPWAState(prev => ({ ...prev, isUpdateAvailable: true }))
          }

          console.log('Service Worker registered successfully')
        } catch (error) {
          console.error('Service Worker registration failed:', error)
        }
      }
    }

    // Handle install prompt
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      const installEvent = event as PWAInstallPrompt
      setPWAState(prev => ({
        ...prev,
        isInstallable: true,
        installPrompt: installEvent
      }))
    }

    // Handle app installation
    const handleAppInstalled = () => {
      setPWAState(prev => ({
        ...prev,
        isInstalled: true,
        isInstallable: false,
        installPrompt: null
      }))
    }

    // Handle online/offline status
    const handleOnline = () => {
      setPWAState(prev => ({ ...prev, isOffline: false }))
    }

    const handleOffline = () => {
      setPWAState(prev => ({ ...prev, isOffline: true }))
    }

    // Initial checks
    checkInstalled()
    registerServiceWorker()
    setPWAState(prev => ({ ...prev, isOffline: !navigator.onLine }))

    // Event listeners
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // iOS Safari install detection
    const mediaQuery = window.matchMedia('(display-mode: standalone)')
    const handleDisplayModeChange = () => checkInstalled()
    mediaQuery.addEventListener('change', handleDisplayModeChange)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      mediaQuery.removeEventListener('change', handleDisplayModeChange)
    }
  }, [])

  const installPWA = async (): Promise<boolean> => {
    if (!pwaState.installPrompt) {
      return false
    }

    try {
      const result = await pwaState.installPrompt.prompt()
      const { outcome } = await pwaState.installPrompt.userChoice

      setPWAState(prev => ({
        ...prev,
        installPrompt: null,
        isInstallable: false
      }))

      return outcome === 'accepted'
    } catch (error) {
      console.error('PWA installation failed:', error)
      return false
    }
  }

  const updatePWA = async (): Promise<boolean> => {
    if (!serviceWorker?.waiting) {
      return false
    }

    try {
      // Tell the waiting service worker to skip waiting
      serviceWorker.waiting.postMessage({ type: 'SKIP_WAITING' })

      // Wait for the new service worker to take control
      await new Promise<void>((resolve) => {
        const handleControllerChange = () => {
          navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange)
          resolve()
        }
        navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange)
      })

      setPWAState(prev => ({ ...prev, isUpdateAvailable: false }))

      // Reload the page to get the latest version
      window.location.reload()

      return true
    } catch (error) {
      console.error('PWA update failed:', error)
      return false
    }
  }

  const sharePWA = async (data: {
    title?: string
    text?: string
    url?: string
    files?: File[]
  }): Promise<boolean> => {
    if (!navigator.share) {
      // Fallback to clipboard or other sharing methods
      if (data.url && navigator.clipboard) {
        try {
          await navigator.clipboard.writeText(data.url)
          return true
        } catch (error) {
          console.error('Failed to copy to clipboard:', error)
          return false
        }
      }
      return false
    }

    try {
      await navigator.share(data)
      return true
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        // User cancelled the share
        return false
      }
      console.error('Sharing failed:', error)
      return false
    }
  }

  const requestNotificationPermission = async (): Promise<NotificationPermission> => {
    if (!('Notification' in window)) {
      throw new Error('Notifications not supported')
    }

    if (Notification.permission === 'granted') {
      return 'granted'
    }

    if (Notification.permission === 'denied') {
      return 'denied'
    }

    const permission = await Notification.requestPermission()
    return permission
  }

  const showNotification = async (
    title: string,
    options?: NotificationOptions
  ): Promise<boolean> => {
    try {
      const permission = await requestNotificationPermission()
      if (permission !== 'granted') {
        return false
      }

      if (serviceWorker) {
        // Use service worker for notifications (better for PWA)
        await serviceWorker.showNotification(title, {
          icon: '/icons/icon-192x192.png',
          badge: '/icons/badge-72x72.png',
          ...options
        })
      } else {
        // Fallback to regular notification
        new Notification(title, {
          icon: '/icons/icon-192x192.png',
          ...options
        })
      }

      return true
    } catch (error) {
      console.error('Failed to show notification:', error)
      return false
    }
  }

  const cacheResource = async (url: string): Promise<boolean> => {
    if (!('caches' in window)) {
      return false
    }

    try {
      const cache = await caches.open('agenty-dynamic-v1.0.0')
      await cache.add(url)
      return true
    } catch (error) {
      console.error('Failed to cache resource:', error)
      return false
    }
  }

  const clearCache = async (): Promise<boolean> => {
    if (!('caches' in window)) {
      return false
    }

    try {
      const cacheNames = await caches.keys()
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      )
      return true
    } catch (error) {
      console.error('Failed to clear cache:', error)
      return false
    }
  }

  const getNetworkStatus = () => {
    return {
      online: navigator.onLine,
      effectiveType: (navigator as any).connection?.effectiveType || 'unknown',
      downlink: (navigator as any).connection?.downlink || 0,
      rtt: (navigator as any).connection?.rtt || 0
    }
  }

  return {
    ...pwaState,
    installPWA,
    updatePWA,
    sharePWA,
    showNotification,
    requestNotificationPermission,
    cacheResource,
    clearCache,
    getNetworkStatus,
    serviceWorker
  }
}