'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { X, Download, Smartphone, Monitor, Wifi, WifiOff, RefreshCw } from 'lucide-react'
import { usePWA } from '@/hooks/usePWA'

export function PWAInstallBanner() {
  const {
    isInstallable,
    isInstalled,
    isOffline,
    isUpdateAvailable,
    installPWA,
    updatePWA
  } = usePWA()

  const [isDismissed, setIsDismissed] = useState(false)
  const [isInstalling, setIsInstalling] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  // Don't show banner if already installed, dismissed, or not installable
  const shouldShowInstallBanner = isInstallable && !isInstalled && !isDismissed
  const shouldShowOfflineBanner = isOffline
  const shouldShowUpdateBanner = isUpdateAvailable && isInstalled

  useEffect(() => {
    // Reset dismissed state when PWA becomes installable
    if (isInstallable) {
      setIsDismissed(false)
    }
  }, [isInstallable])

  const handleInstall = async () => {
    setIsInstalling(true)
    try {
      const success = await installPWA()
      if (success) {
        setIsDismissed(true)
      }
    } catch (error) {
      console.error('Installation failed:', error)
    } finally {
      setIsInstalling(false)
    }
  }

  const handleUpdate = async () => {
    setIsUpdating(true)
    try {
      await updatePWA()
    } catch (error) {
      console.error('Update failed:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDismiss = () => {
    setIsDismissed(true)
  }

  // Install Banner
  if (shouldShowInstallBanner) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96"
        >
          <Card className="border-primary/50 bg-gradient-to-r from-primary/10 to-purple-500/10 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                    <Smartphone className="w-5 h-5 text-primary-foreground" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="text-sm font-semibold text-foreground">Install Agenty</h3>
                    <Badge variant="secondary" className="text-xs">PWA</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    Install Agenty as an app for faster access, offline capabilities, and native experience.
                  </p>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      onClick={handleInstall}
                      disabled={isInstalling}
                      className="h-8 text-xs"
                    >
                      <Download className="w-3 h-3 mr-1" />
                      {isInstalling ? 'Installing...' : 'Install'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleDismiss}
                      className="h-8 text-xs"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    )
  }

  // Update Banner
  if (shouldShowUpdateBanner) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="fixed top-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96"
        >
          <Card className="border-blue-500/50 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                    <RefreshCw className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="text-sm font-semibold text-foreground">Update Available</h3>
                    <Badge variant="outline" className="text-xs border-blue-500 text-blue-600">
                      New
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    A new version of Agenty is available with improvements and bug fixes.
                  </p>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      onClick={handleUpdate}
                      disabled={isUpdating}
                      className="h-8 text-xs bg-blue-500 hover:bg-blue-600"
                    >
                      <RefreshCw className={`w-3 h-3 mr-1 ${isUpdating ? 'animate-spin' : ''}`} />
                      {isUpdating ? 'Updating...' : 'Update'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsDismissed(true)}
                      className="h-8 text-xs"
                    >
                      Later
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    )
  }

  // Offline Banner
  if (shouldShowOfflineBanner) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="fixed top-4 left-4 right-4 z-50"
        >
          <Card className="border-orange-500/50 bg-gradient-to-r from-orange-500/10 to-red-500/10 backdrop-blur-sm">
            <CardContent className="p-3">
              <div className="flex items-center justify-center space-x-3">
                <WifiOff className="w-5 h-5 text-orange-500" />
                <div className="text-sm font-medium text-foreground">
                  You're offline - Some features may be limited
                </div>
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    )
  }

  return null
}

// Network Status Indicator Component
export function NetworkStatusIndicator() {
  const { isOffline, getNetworkStatus } = usePWA()
  const [networkInfo, setNetworkInfo] = useState(getNetworkStatus())

  useEffect(() => {
    const updateNetworkInfo = () => {
      setNetworkInfo(getNetworkStatus())
    }

    window.addEventListener('online', updateNetworkInfo)
    window.addEventListener('offline', updateNetworkInfo)

    // Update network info periodically
    const interval = setInterval(updateNetworkInfo, 5000)

    return () => {
      window.removeEventListener('online', updateNetworkInfo)
      window.removeEventListener('offline', updateNetworkInfo)
      clearInterval(interval)
    }
  }, [getNetworkStatus])

  return (
    <div className="flex items-center space-x-2 text-xs text-muted-foreground">
      {isOffline ? (
        <WifiOff className="w-3 h-3 text-red-500" />
      ) : (
        <Wifi className="w-3 h-3 text-green-500" />
      )}
      <span>
        {isOffline ? 'Offline' : `Online (${networkInfo.effectiveType})`}
      </span>
      {!isOffline && networkInfo.downlink > 0 && (
        <span className="text-muted-foreground/70">
          {networkInfo.downlink.toFixed(1)} Mbps
        </span>
      )}
    </div>
  )
}

// PWA Features Panel for Settings
export function PWAFeaturesPanel() {
  const {
    isInstalled,
    isInstallable,
    installPWA,
    showNotification,
    requestNotificationPermission,
    cacheResource,
    clearCache
  } = usePWA()

  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default')

  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission)
    }
  }, [])

  const handleTestNotification = async () => {
    const success = await showNotification('Test Notification', {
      body: 'This is a test notification from Agenty Platform',
      tag: 'test-notification'
    })

    if (success) {
      console.log('Test notification sent')
    }
  }

  const handleRequestNotifications = async () => {
    const permission = await requestNotificationPermission()
    setNotificationPermission(permission)
  }

  const handleClearCache = async () => {
    const success = await clearCache()
    if (success) {
      console.log('Cache cleared successfully')
      // Show success message
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-3">Progressive Web App Features</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Manage PWA capabilities and offline features
        </p>
      </div>

      {/* Installation Status */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">App Installation</h4>
              <p className="text-sm text-muted-foreground">
                {isInstalled
                  ? 'Agenty is installed as a PWA'
                  : isInstallable
                  ? 'Install Agenty for better experience'
                  : 'Installation not available'}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              {isInstalled && <Badge variant="default">Installed</Badge>}
              {isInstallable && !isInstalled && (
                <Button size="sm" onClick={installPWA}>
                  <Download className="w-4 h-4 mr-2" />
                  Install
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Notifications</h4>
              <p className="text-sm text-muted-foreground">
                Status: {notificationPermission}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              {notificationPermission === 'granted' && (
                <Button size="sm" variant="outline" onClick={handleTestNotification}>
                  Test
                </Button>
              )}
              {notificationPermission === 'default' && (
                <Button size="sm" onClick={handleRequestNotifications}>
                  Enable
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cache Management */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Cache Management</h4>
              <p className="text-sm text-muted-foreground">
                Manage offline data and cached resources
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={handleClearCache}>
              Clear Cache
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Network Status */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Network Status</h4>
              <NetworkStatusIndicator />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}