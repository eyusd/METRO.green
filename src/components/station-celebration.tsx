"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"
import { X, Users } from "lucide-react"
import { Button } from "@/components/ui/button"

interface StationCelebrationProps {
  isOpen: boolean
  onClose: () => void
  stationName: string
  lines: Array<{
    lineName: string
    lineColor: string
    rescom: string
  }>
  totalStationsCollected?: number
  isNewStation?: boolean
}

// Confetti particle component
const ConfettiParticle = ({ color, delay }: { color: string; delay: number }) => {
  return (
    <motion.div
      className="absolute w-2 h-2 rounded-full"
      style={{ backgroundColor: color }}
      initial={{ 
        x: Math.random() * window.innerWidth,
        y: -10,
        rotate: 0,
        scale: 0
      }}
      animate={{
        y: window.innerHeight + 10,
        rotate: 360,
        scale: [0, 1, 0.8, 0],
        x: Math.random() * window.innerWidth
      }}
      transition={{
        duration: 3 + Math.random() * 2,
        delay: delay,
        ease: "easeOut"
      }}
    />
  )
}

// Metro ticket component
const MetroTicket = ({ 
  stationName, 
  lines, 
  totalStationsCollected 
}: {
  stationName: string
  lines: Array<{
    lineName: string
    lineColor: string
    rescom: string
  }>
  totalStationsCollected?: number
}) => {
  const primaryLine = lines[0] // Use first line for primary theming
  
  return (
    <motion.div
      initial={{ y: -100, rotateX: -90, scale: 0.8 }}
      animate={{ y: 0, rotateX: 0, scale: 1 }}
      transition={{ 
        type: "spring", 
        damping: 15, 
        stiffness: 100,
        delay: 0.2 
      }}
      className="bg-white rounded-lg shadow-2xl p-6 mx-4 max-w-md w-full"
      style={{ 
        background: primaryLine ? 
          `linear-gradient(135deg, #${primaryLine.lineColor}20 0%, white 30%, white 70%, #${primaryLine.lineColor}20 100%)` : 
          'white'
      }}
    >
      {/* Ticket Header */}
      <div className="text-center border-b border-gray-300 pb-4 mb-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5, type: "spring" }}
          className="text-2xl font-bold text-gray-800"
        >
          🎉 STATION CAPTURED!
        </motion.div>
        <div className="text-sm text-gray-600 mt-1">Metro Game Collection</div>
      </div>

      {/* Station Info */}
      <div className="space-y-3">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.7 }}
          className="text-center"
        >
          <div className="text-xl font-bold text-gray-900 mb-2">
            {stationName}
          </div>
          
          {/* Multiple Lines Display */}
          {lines.length > 0 && (
            <div className="space-y-2">
              {lines.length === 1 ? (
                // Single line display
                <div className="flex items-center justify-center gap-2">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: `#${lines[0].lineColor}` }}
                  />
                  <span className="text-sm font-medium" style={{ color: `#${lines[0].lineColor}` }}>
                    {lines[0].rescom}
                  </span>
                </div>
              ) : (
                // Multiple lines display
                <div className="space-y-1">
                  <div className="text-xs text-gray-600 mb-1">Available on {lines.length} lines:</div>
                  <div className="flex flex-wrap justify-center gap-1">
                    {lines.map((line, index) => (
                      <div 
                        key={index}
                        className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded text-xs"
                      >
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: `#${line.lineColor}` }}
                        />
                        <span className="font-medium" style={{ color: `#${line.lineColor}` }}>
                          {line.lineName}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="text-xs"
        >
          {totalStationsCollected && (
            <div className="flex items-center gap-1 bg-purple-50 p-2 rounded">
              <Users className="w-3 h-3 text-purple-600" />
              <span className="text-purple-800">
                Total Collection: {totalStationsCollected} stations
              </span>
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  )
}

export function StationCelebration({
  isOpen,
  onClose,
  stationName,
  lines,
  totalStationsCollected,
  isNewStation = true
}: StationCelebrationProps) {
  const [showConfetti, setShowConfetti] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Generate confetti colors based on all line colors or default Paris metro colors
  const confettiColors = lines.length > 0 ? 
    lines.flatMap(line => [`#${line.lineColor}`, `#${line.lineColor}88`]).concat(['#FFD700', '#FF6B6B', '#4ECDC4']) :
    ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD']

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (isOpen && isNewStation) {
      setShowConfetti(true)
      // Stop confetti after 3 seconds
      const timer = setTimeout(() => setShowConfetti(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [isOpen, isNewStation])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = 'unset'
      }
    }
  }, [isOpen])

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  if (!mounted) return null

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[999999] flex items-center justify-center p-4"
          style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0,
            zIndex: 999999
          }}
        >
          {/* Backdrop with blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Confetti particles */}
          {showConfetti && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {Array.from({ length: 50 }).map((_, i) => (
                <ConfettiParticle
                  key={i}
                  color={confettiColors[i % confettiColors.length]}
                  delay={i * 0.1}
                />
              ))}
            </div>
          )}

          {/* Success content - properly centered */}
          <div className="relative z-10 flex flex-col items-center justify-center min-h-0 w-full max-w-md">
            {/* Close button */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 1.5 }}
              className="mb-4"
            >
              <Button
                onClick={onClose}
                variant="secondary"
                size="icon"
                className="rounded-full bg-white/90 hover:bg-white shadow-lg"
              >
                <X className="h-4 w-4" />
              </Button>
            </motion.div>

            {/* Main ticket */}
            <MetroTicket
              stationName={stationName}
              lines={lines}
              totalStationsCollected={totalStationsCollected}
            />

            {/* Continue button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.3 }}
              className="mt-6"
            >
              <Button
                onClick={onClose}
                className="px-8 py-2 text-white font-medium"
                style={{ backgroundColor: '#22c55e' }}
              >
                Continue Exploring! 🚇
              </Button>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )

  return createPortal(modalContent, document.body)
}
