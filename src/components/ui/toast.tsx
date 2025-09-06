"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"
import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ToastProps {
  id: string
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
  duration?: number
  onDismiss: (id: string) => void
}

interface ToastContextType {
  addToast: (toast: Omit<ToastProps, 'id' | 'onDismiss'>) => void
  dismissToast: (id: string) => void
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined)

export function useToast() {
  const context = React.useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastProps[]>([])

  const addToast = React.useCallback((toast: Omit<ToastProps, 'id' | 'onDismiss'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast: ToastProps = {
      ...toast,
      id,
      onDismiss: dismissToast,
    }
    setToasts(prev => [...prev, newToast])
  }, [])

  const dismissToast = React.useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ addToast, dismissToast }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  )
}

function ToastContainer({ toasts, onDismiss }: { toasts: ToastProps[], onDismiss: (id: string) => void }) {
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return createPortal(
    <div className="fixed top-4 right-4 z-[100000] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map(toast => (
          <Toast key={toast.id} {...toast} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
    </div>,
    document.body
  )
}

function Toast({ id, type, title, message, details, duration = 5000, onDismiss }: ToastProps) {
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(id)
    }, duration)

    return () => clearTimeout(timer)
  }, [id, duration, onDismiss])

  const getTypeConfig = () => {
    switch (type) {
      case 'error':
        return {
          icon: AlertCircle,
          bgColor: 'bg-red-50 border-red-200',
          iconColor: 'text-red-600',
          titleColor: 'text-red-900',
          messageColor: 'text-red-800',
        }
      case 'warning':
        return {
          icon: AlertTriangle,
          bgColor: 'bg-yellow-50 border-yellow-200',
          iconColor: 'text-yellow-600',
          titleColor: 'text-yellow-900',
          messageColor: 'text-yellow-800',
        }
      case 'info':
        return {
          icon: Info,
          bgColor: 'bg-blue-50 border-blue-200',
          iconColor: 'text-blue-600',
          titleColor: 'text-blue-900',
          messageColor: 'text-blue-800',
        }
      case 'success':
        return {
          icon: CheckCircle,
          bgColor: 'bg-green-50 border-green-200',
          iconColor: 'text-green-600',
          titleColor: 'text-green-900',
          messageColor: 'text-green-800',
        }
    }
  }

  const config = getTypeConfig()
  const IconComponent = config.icon

  return (
    <motion.div
      initial={{ opacity: 0, x: 300, scale: 0.3 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 300, scale: 0.3 }}
      transition={{ type: "spring", damping: 20, stiffness: 300 }}
      className={cn(
        "pointer-events-auto w-80 rounded-lg border p-4 shadow-lg",
        config.bgColor
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <IconComponent className={cn("h-5 w-5", config.iconColor)} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className={cn("font-medium text-sm", config.titleColor)}>
            {title}
          </div>
          <div className={cn("text-sm mt-1", config.messageColor)}>
            {message}
          </div>
          
          {details && (
            <div className="mt-3 space-y-2 text-xs">
              {details.stationName && (
                <div className="bg-white/60 p-2 rounded border border-white/40">
                  <div className="font-medium">Station: {details.stationName}</div>
                  {(details.confidence || details.distanceFromStation !== undefined) && (
                    <div className="flex gap-3 mt-1 text-gray-600">
                      {details.confidence && (
                        <span>{details.confidence.toFixed(0)}% confidence</span>
                      )}
                      {details.distanceFromStation !== undefined && (
                        <span>{details.distanceFromStation}m away</span>
                      )}
                    </div>
                  )}
                </div>
              )}
              
              {details.reason && (
                <div className="bg-white/40 p-2 rounded border border-white/40">
                  <div className="font-medium">Reason:</div>
                  <div>{details.reason}</div>
                </div>
              )}
              
              {details.tip && (
                <div className="bg-white/40 p-2 rounded border border-white/40">
                  <div className="font-medium">💡 Tip:</div>
                  <div>{details.tip}</div>
                </div>
              )}
            </div>
          )}
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 hover:bg-white/50"
          onClick={() => onDismiss(id)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  )
}
