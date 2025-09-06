"use client"

import React, { createContext, useContext, ReactNode } from 'react'

interface LocationData {
  latitude: number
  longitude: number
  accuracy: number
  altitude?: number | null
  heading?: number | null
  speed?: number | null
  timestamp: number
}

interface LocationContextValue {
  getCurrentLocation: () => Promise<LocationData>
  isLocationAvailable: boolean
}

const LocationContext = createContext<LocationContextValue | null>(null)

interface LocationProviderProps {
  children: ReactNode
}

export function LocationProvider({ children }: LocationProviderProps) {
  const getCurrentLocation = async (): Promise<LocationData> => {
    if (!navigator.geolocation) {
      throw new Error('Geolocation is not supported by this browser')
    }

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const locationData: LocationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude,
            heading: position.coords.heading,
            speed: position.coords.speed,
            timestamp: position.timestamp
          }
          resolve(locationData)
        },
        (error) => {
          reject(error)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 30000 // Cache for 30 seconds
        }
      )
    })
  }

  const isLocationAvailable = 'geolocation' in navigator

  return (
    <LocationContext.Provider value={{ getCurrentLocation, isLocationAvailable }}>
      {children}
    </LocationContext.Provider>
  )
}

export function useLocation() {
  const context = useContext(LocationContext)
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider')
  }
  return context
}

export type { LocationData }
