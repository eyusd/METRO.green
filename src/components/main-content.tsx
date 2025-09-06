"use client"

import { useState } from "react";
import { motion } from "framer-motion";
import { MapStations } from "@/components/map-stations";
import stations from "@/lib/stations";
import { Statistics } from "./statistics";
import { Capture } from "@/components/capture";
import { Settings } from "./settings";
import { StationCelebration } from "./station-celebration";
import { StationNotification } from "./station-notification";
import { AppTitle } from "./app-title";
import { useGameStore } from "@/lib/store";

// Shared notification data type
export interface NotificationData {
  type: 'error' | 'warning' | 'info' | 'success'
  title: string
  message: string
  details?: {
    stationName?: string
    confidence?: number
    distanceFromStation?: number
    reason?: string
    tip?: string
  }
}

// Shared celebration data type
export interface CelebrationData {
  stationName: string
  lines: Array<{
    lineName: string
    lineColor: string
    rescom: string
  }>
  confidence?: number
  distanceFromStation?: number
  isNewStation?: boolean
}

export function MainContent() {
  // Get station count for celebration
  const { getStationCount } = useGameStore()
  
  // Centralized celebration state
  const [showCelebration, setShowCelebration] = useState(false)
  const [celebrationData, setCelebrationData] = useState<CelebrationData | null>(null)
  
  // Centralized notification state
  const [showNotification, setShowNotification] = useState(false)
  const [notificationData, setNotificationData] = useState<NotificationData | null>(null)

  // Helper functions to show notifications and celebrations
  const showNotificationHelper = (data: NotificationData) => {
    setNotificationData(data)
    setShowNotification(true)
  }

  const showCelebrationHelper = (data: CelebrationData) => {
    setCelebrationData(data)
    setShowCelebration(true)
  }

  return (
    <>
    {/* Global Station Celebration Component */}
      {celebrationData && (
        <StationCelebration
          isOpen={showCelebration}
          onClose={() => {
            setShowCelebration(false)
            setCelebrationData(null)
          }}
          stationName={celebrationData.stationName}
          lines={celebrationData.lines}
          confidence={celebrationData.confidence}
          distanceFromStation={celebrationData.distanceFromStation}
          totalStationsCollected={getStationCount()}
          isNewStation={celebrationData.isNewStation}
        />
      )}

      {/* Global Station Notification Component */}
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
      <main className="h-dvh w-screen flex flex-col items-center bg-black">
        <div className="h-dvh w-screen max-w-xl relative">
          {/* App Title */}
          <AppTitle />
          
          <MapStations
            stations={stations}
            className="h-dvh w-screen max-w-xl"
          />
          {/* Modern Mobile Bottom Bar */}
          <motion.div 
            className="absolute bottom-0 left-0 w-full bg-gray-950 backdrop-blur-xl rounded-t-lg shadow-2xl shadow-black/5 z-10"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ 
              type: "spring", 
              stiffness: 300, 
              damping: 30,
              delay: 0.2 
            }}
          >
            <motion.div 
              className="flex items-center justify-between px-6 py-3 max-w-xl mx-auto"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ 
                type: "spring", 
                stiffness: 400, 
                damping: 25,
                delay: 0.4 
              }}
            >
              {/* Statistics Button */}
              <motion.div 
                className="flex-1 flex justify-start"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.3 }}
              >
                <Statistics showNotification={showNotificationHelper} />
              </motion.div>
              
              {/* Capture Button - Emphasized */}
              <motion.div 
                className="relative flex-shrink-0 mx-4"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ 
                  type: "spring", 
                  stiffness: 500, 
                  damping: 20,
                  delay: 0.5 
                }}
              >
                <Capture 
                  showNotification={showNotificationHelper}
                  showCelebration={showCelebrationHelper}
                />
              </motion.div>
              
              {/* Settings Button */}
              <motion.div 
                className="flex-1 flex justify-end"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.3 }}
              >
                <Settings showNotification={showNotificationHelper} />
              </motion.div>
            </motion.div>
            {/* Safe area spacing for iOS devices */}
            <div className="h-safe-area-inset-bottom" />
          </motion.div>
        </div>
      </main>
    </>
  )
}
