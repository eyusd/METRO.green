"use client"

import React from "react"
import { LocationProvider } from "./location-context"

interface CombinedPermissionsWrapperProps {
  children: React.ReactNode
}

// Simple wrapper that provides location context without managing permission state
export function CombinedPermissionsWrapper({ children }: CombinedPermissionsWrapperProps) {
  return (
    <LocationProvider>
      {children}
    </LocationProvider>
  )
}
