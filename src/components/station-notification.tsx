"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"
import { 
  X, 
  AlertCircle, 
  CheckCircle, 
  Info, 
  AlertTriangle
} from "lucide-react"
import { Button } from "@/components/ui/button"

interface StationNotificationProps {
  isOpen: boolean
  onClose: () => void
  type: 'error' | 'warning' | 'info' | 'success'
  title: string
  message: string
  details?: {
    stationName?: string
    reason?: string
    tip?: string
  }
}

// Notification card component
const NotificationCard = ({ 
  type,
  title,
  message,
  details,
  onClose
}: {
  type: 'error' | 'warning' | 'info' | 'success'
  title: string
  message: string
  details?: {
    stationName?: string
    reason?: string
    tip?: string
  }
  onClose: () => void
}) => {
  const getTypeConfig = () => {
    switch (type) {
      case 'error':
        return {
          icon: AlertCircle,
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          iconColor: 'text-red-600',
          titleColor: 'text-red-900',
          messageColor: 'text-red-800',
          buttonColor: 'bg-red-600 hover:bg-red-700'
        }
      case 'warning':
        return {
          icon: AlertTriangle,
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          iconColor: 'text-yellow-600',
          titleColor: 'text-yellow-900',
          messageColor: 'text-yellow-800',
          buttonColor: 'bg-yellow-600 hover:bg-yellow-700'
        }
      case 'info':
        return {
          icon: Info,
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          iconColor: 'text-blue-600',
          titleColor: 'text-blue-900',
          messageColor: 'text-blue-800',
          buttonColor: 'bg-blue-600 hover:bg-blue-700'
        }
      case 'success':
        return {
          icon: CheckCircle,
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          iconColor: 'text-green-600',
          titleColor: 'text-green-900',
          messageColor: 'text-green-800',
          buttonColor: 'bg-green-600 hover:bg-green-700'
        }
    }
  }

  const config = getTypeConfig()
  const IconComponent = config.icon

  return (
    <motion.div
      initial={{ y: -50, opacity: 0, scale: 0.9 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      exit={{ y: -50, opacity: 0, scale: 0.9 }}
      transition={{ 
        type: "spring", 
        damping: 20, 
        stiffness: 300,
        duration: 0.4
      }}
      className={`${config.bgColor} ${config.borderColor} border rounded-lg shadow-lg p-6 mx-4 max-w-md w-full`}
    >
      {/* Header with icon and title */}
      <div className="flex items-start gap-3 mb-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
          className="flex-shrink-0"
        >
          <IconComponent className={`h-6 w-6 ${config.iconColor}`} />
        </motion.div>
        
        <div className="flex-1">
          <motion.h3
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className={`font-semibold text-lg ${config.titleColor}`}
          >
            {title}
          </motion.h3>
          
          <motion.p
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className={`text-sm mt-1 ${config.messageColor}`}
          >
            {message}
          </motion.p>
        </div>
      </div>

      {/* Details section */}
      {details && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-3"
        >
          {details.stationName && (
            <div className="bg-white/60 p-3 rounded border border-white/40">
              <div className="text-sm font-medium text-gray-900">
                Station: {details.stationName}
              </div>
            </div>
          )}

          {details.reason && (
            <div className="bg-white/40 p-3 rounded border border-white/40">
              <div className="text-sm font-medium text-gray-700 mb-1">Reason:</div>
              <div className="text-sm text-gray-600">{details.reason}</div>
            </div>
          )}

          {details.tip && (
            <div className="bg-white/40 p-3 rounded border border-white/40">
              <div className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                💡 Tip:
              </div>
              <div className="text-sm text-gray-600">{details.tip}</div>
            </div>
          )}
        </motion.div>
      )}

      {/* Close button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-6 flex justify-center"
      >
        <Button
          onClick={onClose}
          className={`px-6 py-2 text-white font-medium ${config.buttonColor}`}
        >
          Got it
        </Button>
      </motion.div>
    </motion.div>
  )
}

export function StationNotification({
  isOpen,
  onClose,
  type,
  title,
  message,
  details
}: StationNotificationProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Auto-close after 10 seconds for info/success, longer for errors
  useEffect(() => {
    if (isOpen) {
      const timeout = type === 'error' || type === 'warning' ? 15000 : 8000
      const timer = setTimeout(onClose, timeout)
      return () => clearTimeout(timer)
    }
  }, [isOpen, type, onClose])

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
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4"
          style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0,
            zIndex: 99999
          }}
        >
          {/* Backdrop - less intense than celebration */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Notification content */}
          <div className="relative z-10 flex flex-col items-center justify-center min-h-0 w-full max-w-md">
            {/* Close button */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.7 }}
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

            {/* Main notification */}
            <NotificationCard
              type={type}
              title={title}
              message={message}
              details={details}
              onClose={onClose}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )

  return createPortal(modalContent, document.body)
}
