"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { MapPin, AlertTriangle, Info } from "lucide-react"
import { StationNotification } from "./station-notification"

interface LocationPermissionWrapperProps {
  children: React.ReactNode
  onLocationChange?: (position: GeolocationPosition) => void
}

interface LocationData {
  latitude: number
  longitude: number
  accuracy: number
  timestamp: number
}

export function LocationPermissionWrapper({ children, onLocationChange }: LocationPermissionWrapperProps) {
  const [permissionState, setPermissionState] = useState<"pending" | "granted" | "denied" | "error">("pending")
  const [isLoading, setIsLoading] = useState(false)
  const [watchId, setWatchId] = useState<number | null>(null)

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
    checkLocationPermission()
    
    return () => {
      // Cleanup location watching when component unmounts
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId)
      }
    }
  }, [watchId])

  const checkLocationPermission = async () => {
    try {
      // Check if Geolocation API is available
      if (!navigator.geolocation) {
        setPermissionState('error')
        return
      }

      // Check if Permissions API is available for location
      if ('permissions' in navigator) {
        try {
          const permission = await navigator.permissions.query({ name: 'geolocation' as PermissionName })
          
          if (permission.state === 'granted') {
            setPermissionState('granted')
            startLocationTracking()
          } else if (permission.state === 'denied') {
            setPermissionState('denied')
          } else {
            setPermissionState('pending')
          }

          // Listen for permission changes
          permission.addEventListener('change', () => {
            if (permission.state === 'granted') {
              setPermissionState('granted')
              startLocationTracking()
            } else {
              setPermissionState('denied')
              stopLocationTracking()
            }
          })
        } catch {
          // Permissions API might not support geolocation query on all browsers
          setPermissionState('pending')
        }
      } else {
        // Permissions API not available, show request button
        setPermissionState('pending')
      }
    } catch (error) {
      console.error('Error checking location permission:', error)
      setPermissionState('pending')
    }
  }

  const requestLocationPermission = async () => {
    setIsLoading(true)
    
    // Check if we're on HTTPS (required for location access on many mobile browsers)
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      setNotificationData({
        type: 'warning',
        title: 'HTTPS Required',
        message: 'Precise location access may require a secure connection (HTTPS) on some devices.',
        details: {
          reason: 'Browser security restrictions for location access',
          tip: 'Try accessing the site with HTTPS for more reliable location features'
        }
      })
      setShowNotification(true)
    }

    try {
      // Check if Geolocation API is available
      if (!navigator.geolocation) {
        setNotificationData({
          type: 'error',
          title: 'Geolocation Not Supported',
          message: 'Geolocation is not supported in this browser.',
          details: {
            reason: 'Browser does not support geolocation API',
            tip: 'Try using a modern browser like Chrome, Firefox, or Safari'
          }
        })
        setShowNotification(true)
        setPermissionState('error')
        setIsLoading(false)
        return
      }

      // Request high-accuracy location
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const locationData: LocationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp
          }
          setPermissionState('granted')
          setIsLoading(false)
          
          if (onLocationChange) {
            onLocationChange(position)
          }
          
          // Start continuous location tracking
          startLocationTracking()
        },
        (error) => {
          console.error('Location permission error:', error)
          setIsLoading(false)
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              setPermissionState('denied')
              break
            case error.POSITION_UNAVAILABLE:
              setNotificationData({
                type: 'error',
                title: 'Location Unavailable',
                message: 'Location information is unavailable. Please ensure location services are enabled.',
                details: {
                  reason: 'GPS or network location services are disabled',
                  tip: 'Check your device settings to enable location services'
                }
              })
              setShowNotification(true)
              setPermissionState('error')
              break
            case error.TIMEOUT:
              setNotificationData({
                type: 'warning',
                title: 'Location Timeout',
                message: 'Location request timed out. Please try again.',
                details: {
                  reason: 'GPS signal is weak or unavailable',
                  tip: 'Try moving to an area with better GPS reception'
                }
              })
              setShowNotification(true)
              setPermissionState('pending')
              break
            default:
              setNotificationData({
                type: 'error',
                title: 'Location Error',
                message: 'An unknown error occurred while requesting location.',
                details: {
                  reason: `Error code: ${error.code}`,
                  tip: 'Try refreshing the page or checking your browser settings'
                }
              })
              setShowNotification(true)
              setPermissionState('error')
              break
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      )
    } catch (error) {
      console.error('Unexpected error requesting location:', error)
      setPermissionState('error')
      setIsLoading(false)
    }
  }

  const startLocationTracking = () => {
    if (!navigator.geolocation || watchId !== null) return

    const id = navigator.geolocation.watchPosition(
      (position) => {
        if (onLocationChange) {
          onLocationChange(position)
        }
      },
      (error) => {
        console.error('Location tracking error:', error)
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 30000 // Cache position for 30 seconds
      }
    )

    setWatchId(id)
  }

  const stopLocationTracking = () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId)
      setWatchId(null)
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
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
            {permissionState === 'denied' || permissionState === 'error' ? (
              <AlertTriangle className="h-6 w-6 text-red-600" />
            ) : (
              <MapPin className="h-6 w-6 text-green-600" />
            )}
          </div>
          <CardTitle>
            {permissionState === 'denied' 
              ? 'Location Access Denied'
              : permissionState === 'error'
              ? 'Location Unavailable'
              : 'Precise Location Required'
            }
          </CardTitle>
          <CardDescription>
            {permissionState === 'denied' 
              ? 'Please enable location access in your browser settings to use location-based features.'
              : permissionState === 'error'
              ? 'Location services are not available on this device or browser.'
              : 'This application uses your precise location to provide better metro station recommendations and capture location data with images.'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          {permissionState === 'error' ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Info className="h-4 w-4" />
                <span>Location services required for optimal experience</span>
              </div>
              <Button 
                onClick={() => window.location.reload()} 
                variant="outline"
                className="w-full"
              >
                Reload Page
              </Button>
            </div>
          ) : permissionState === 'denied' ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                To enable location access:
              </p>
              <ol className="text-sm text-left space-y-1 text-muted-foreground">
                <li>1. Tap the address/URL bar in your browser</li>
                <li>2. Look for a location icon and tap it</li>
                <li>3. Select &quot;Allow&quot; for location access</li>
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
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg text-sm">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-left">
                    <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">Why we need location:</p>
                    <ul className="text-blue-700 dark:text-blue-200 space-y-1">
                      <li>• Find nearby metro stations</li>
                      <li>• Add location data to captured images</li>
                      <li>• Provide personalized recommendations</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <Button 
                onClick={requestLocationPermission}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                    Getting Location...
                  </>
                ) : (
                  <>
                    <MapPin className="mr-2 h-4 w-4" />
                    Allow Precise Location
                  </>
                )}
              </Button>
              
              <p className="text-xs text-muted-foreground">
                Your location data is only used locally and not shared with third parties.
              </p>
            </div>
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

export type { LocationData }
