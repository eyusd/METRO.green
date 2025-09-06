"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Camera, AlertTriangle } from "lucide-react"
import { StationNotification } from "./station-notification"

interface CameraPermissionWrapperProps {
  children: React.ReactNode
}

export function CameraPermissionWrapper({ children }: CameraPermissionWrapperProps) {
  const [permissionState, setPermissionState] = useState<"pending" | "granted" | "denied" | "error">("pending")
  const [isLoading, setIsLoading] = useState(false)

  // Notification state
  const [showNotification, setShowNotification] = useState(false)
  const [notificationData, setNotificationData] = useState<{
    type: 'error' | 'warning' | 'info' | 'success'
    title: string
    message: string
    details?: {
      reason?: string
      tip?: string
    }
  } | null>(null)

  useEffect(() => {
    // Skip automatic permission check on mobile - require user interaction
    if (typeof window !== 'undefined') {
      // Check if we're on mobile
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      
      if (!isMobile) {
        checkCameraPermission()
      } else {
        // On mobile, just show the request button
        setPermissionState('pending')
      }
    }
  }, [])

  const checkCameraPermission = async () => {
    try {
      // Check if Permissions API is available
      if ('permissions' in navigator) {
        const permission = await navigator.permissions.query({ name: 'camera' as PermissionName })
        
        if (permission.state === 'granted') {
          setPermissionState('granted')
        } else if (permission.state === 'denied') {
          setPermissionState('denied')
        } else {
          setPermissionState('pending')
        }

        // Listen for permission changes
        permission.addEventListener('change', () => {
          setPermissionState(permission.state === 'granted' ? 'granted' : 'denied')
        })
      } else {
        // Permissions API not available, show request button
        setPermissionState('pending')
      }
    } catch (error) {
      console.error('Error checking camera permission:', error)
      // Fallback: show request button
      setPermissionState('pending')
    }
  }

  const requestCameraPermission = async () => {
    setIsLoading(true)
    
    // Check if we're on HTTPS (required for camera access on mobile)
    if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
      setNotificationData({
        type: 'error',
        title: 'HTTPS Required',
        message: 'Camera access requires a secure connection (HTTPS). Please access this site over HTTPS.',
        details: {
          reason: 'Browser security restrictions for camera access',
          tip: 'Access the site with HTTPS for camera functionality'
        }
      })
      setShowNotification(true)
      setPermissionState('error')
      setIsLoading(false)
      return
    }

    try {
      // Check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setNotificationData({
          type: 'error',
          title: 'Camera Not Supported',
          message: 'Camera access is not supported in this browser.',
          details: {
            reason: 'Browser does not support MediaDevices API',
            tip: 'Try using a modern browser like Chrome, Firefox, or Safari'
          }
        })
        setShowNotification(true)
        setPermissionState('error')
        setIsLoading(false)
        return
      }

      // On mobile, we need to be more explicit about the constraints
      const constraints = {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'environment' // Start with back camera
        },
        audio: false
      }

      // Request camera access to trigger permission prompt
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      
      // Stop the stream immediately as we only wanted to request permission
      stream.getTracks().forEach(track => track.stop())
      
      setPermissionState('granted')
    } catch (error: any) {
      console.error('Camera permission error:', error)
      
      // Handle specific error types
      if (error.name === 'NotAllowedError') {
        setPermissionState('denied')
      } else if (error.name === 'NotFoundError') {
        setNotificationData({
          type: 'error',
          title: 'No Camera Found',
          message: 'No camera found on this device.',
          details: {
            reason: 'Device does not have a camera or camera is not accessible',
            tip: 'Make sure your device has a working camera'
          }
        })
        setShowNotification(true)
        setPermissionState('error')
      } else if (error.name === 'NotSupportedError') {
        setNotificationData({
          type: 'error',
          title: 'Camera Not Supported',
          message: 'Camera access is not supported in this browser.',
          details: {
            reason: 'Browser does not support camera access',
            tip: 'Try using a different browser or updating your current browser'
          }
        })
        setShowNotification(true)
        setPermissionState('error')
      } else {
        // Try with simpler constraints as fallback
        try {
          const simpleStream = await navigator.mediaDevices.getUserMedia({ video: true })
          simpleStream.getTracks().forEach(track => track.stop())
          setPermissionState('granted')
        } catch (fallbackError) {
          setPermissionState('denied')
        }
      }
    } finally {
      setIsLoading(false)
    }
  }

  // If permission is granted, render the children
  if (permissionState === 'granted') {
    return <>{children}</>
  }

  // Otherwise, show permission request UI
  return (
    <main className="min-h-svh min-w-screen flex flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
            {permissionState === 'denied' ? (
              <AlertTriangle className="h-6 w-6 text-red-600" />
            ) : (
              <Camera className="h-6 w-6 text-blue-600" />
            )}
          </div>
          <CardTitle>
            {permissionState === 'denied' ? 'Camera Access Denied' : 'Camera Permission Required'}
          </CardTitle>
          <CardDescription>
            {permissionState === 'denied' 
              ? 'Camera access was denied. Please enable camera access in your browser settings to use this application.'
              : 'This application needs access to your camera to capture images. Please tap the button below to grant permission.'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          {permissionState === 'denied' ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                To enable camera access:
              </p>
              <ol className="text-sm text-left space-y-1 text-muted-foreground">
                <li>1. Tap the address/URL bar in your browser</li>
                <li>2. Look for a camera icon and tap it</li>
                <li>3. Select "Allow" for camera access</li>
                <li>4. Refresh this page</li>
              </ol>
              <Button 
                onClick={() => window.location.reload()} 
                variant="outline"
                className="w-full"
              >
                Refresh Page
              </Button>
            </div>
          ) : (
            <Button 
              onClick={requestCameraPermission}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                  Requesting Permission...
                </>
              ) : (
                <>
                  <Camera className="mr-2 h-4 w-4" />
                  Grant Camera Access
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Station Notification Component */}
      {notificationData && (
        <StationNotification
          isOpen={showNotification}
          onClose={() => {
            setShowNotification(false)
            setNotificationData(null)
          }}
          type={notificationData.type}
          title={notificationData.title}
          message={notificationData.message}
          details={notificationData.details}
        />
      )}
    </main>
  )
}
