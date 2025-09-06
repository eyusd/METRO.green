"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Camera, RotateCcw, Loader2, Focus, X } from "lucide-react";
import { useCapture } from "@/hooks";
import type { NotificationData, CelebrationData } from "./main-content";

interface CaptureProps {
  showNotification: (data: NotificationData) => void;
  showCelebration: (data: CelebrationData) => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function Capture({ showNotification, showCelebration, isOpen, onOpenChange }: CaptureProps) {
  const {
    stream,
    availableCameras,
    isProcessing,
    videoRef,
    canvasRef,
    switchCamera,
    captureImage,
  } = useCapture({
    showNotification,
    showCelebration,
    isOpen,
    onOpenChange,
  });

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange} modal={false}>
      <DialogTrigger asChild>
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
          className="relative"
        >
          {/* Outer glow ring */}
          <motion.div
            className="absolute inset-0 rounded-full bg-gradient-to-r from-emerald-400/30 to-cyan-400/30 blur-sm"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.2, 0, 0.2],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          {/* Pulsing ring effect */}
          <motion.div
            className="absolute inset-0 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.4, 0, 0.4],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          <Button
            size="lg"
            className="h-16 w-16 rounded-full bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-600 border-2 border-white/20 shadow-xl hover:shadow-2xl transition-all duration-200 relative z-10 backdrop-blur-sm"
          >
            <motion.div
              animate={{
                rotate: isProcessing ? 360 : 0,
                scale: isOpen ? 1.1 : 1,
              }}
              transition={{
                rotate: {
                  duration: 1,
                  repeat: isProcessing ? Infinity : 0,
                  ease: "linear",
                },
                scale: { duration: 0.2, ease: "easeInOut" },
              }}
            >
              {isProcessing ? (
                <Loader2 className="size-8 text-white" />
              ) : (
                <Focus className="size-8 text-white drop-shadow-sm" />
              )}
            </motion.div>
          </Button>
        </motion.div>
      </DialogTrigger>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-xl border-0 bg-black/95 backdrop-blur-xl p-0 gap-0 max-h-[calc(90dvh-150px)]"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="relative overflow-hidden rounded-lg"
        >
          {/* Header with Close Button */}
          <motion.div
            className="relative z-10 p-4 bg-gradient-to-b from-black/80 to-transparent"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <DialogHeader className="text-center relative">
              <DialogTitle className="text-white text-lg font-semibold">
                Capture Station
              </DialogTitle>
              <DialogDescription className="text-gray-300 text-sm">
                Align the station name clearly in the frame
              </DialogDescription>

              {/* Close Button */}
              <motion.button
                onClick={() => onOpenChange(false)}
                className="absolute -top-1 -right-1 h-8 w-8 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 hover:bg-black/80 transition-all duration-200 flex items-center justify-center"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <X className="size-4 text-white" />
              </motion.button>
            </DialogHeader>
          </motion.div>

          {/* Camera View with Padding */}
          <motion.div
            className="relative w-full aspect-[4/3] bg-gray-900 mx-4 rounded-lg overflow-hidden"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.3 }}
            style={{ width: "calc(100% - 2rem)" }}
          >
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />

            {/* Loading Overlay */}
            {!stream && (
              <motion.div
                className="absolute inset-0 flex items-center justify-center bg-gray-900 rounded-lg"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="text-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full mx-auto mb-2"
                  />
                  <p className="text-gray-400 text-sm">Loading camera...</p>
                </div>
              </motion.div>
            )}

            {/* Camera Frame Overlay */}
            <div className="absolute inset-0 pointer-events-none">
              {/* Corner guides */}
              <div className="absolute top-4 left-4 w-6 h-6 border-l-2 border-t-2 border-white/60 rounded-tl-sm" />
              <div className="absolute top-4 right-4 w-6 h-6 border-r-2 border-t-2 border-white/60 rounded-tr-sm" />
              <div className="absolute bottom-4 left-4 w-6 h-6 border-l-2 border-b-2 border-white/60 rounded-bl-sm" />
              <div className="absolute bottom-4 right-4 w-6 h-6 border-r-2 border-b-2 border-white/60 rounded-br-sm" />

              {/* Center focus indicator */}
              <motion.div
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                animate={{ scale: [1, 1.1, 1], opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <div className="w-16 h-16 border border-white/80 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white/80 rounded-full" />
                </div>
              </motion.div>
            </div>

            {/* Camera Switch Button */}
            {availableCameras.length > 1 && (
              <motion.div
                className="absolute top-4 right-4"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-10 w-10 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 hover:bg-black/80 transition-all duration-200"
                  onClick={switchCamera}
                  disabled={!stream}
                >
                  <RotateCcw className="size-5 text-white" />
                </Button>
              </motion.div>
            )}

            {/* Processing Overlay */}
            {isProcessing && (
              <motion.div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center rounded-lg"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="text-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="w-12 h-12 border-3 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4"
                  />
                  <p className="text-white font-medium">Processing image...</p>
                  <p className="text-gray-300 text-sm mt-1">Please wait</p>
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Bottom Controls */}
          <motion.div
            className="relative z-10 p-6 bg-gradient-to-t from-black/90 to-transparent"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center justify-center">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <Button
                  onClick={captureImage}
                  disabled={!stream || isProcessing}
                  size="lg"
                  className="h-16 w-16 rounded-full bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-600 border-2 border-white/20 shadow-xl hover:shadow-2xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <motion.div
                    animate={{
                      scale: isProcessing ? [1, 1.2, 1] : 1,
                    }}
                    transition={{
                      duration: 1,
                      repeat: isProcessing ? Infinity : 0,
                      ease: "easeInOut",
                    }}
                  >
                    {isProcessing ? (
                      <Loader2 className="size-6 text-white" />
                    ) : (
                      <Camera className="size-6 text-white" />
                    )}
                  </motion.div>
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>

        {/* Hidden canvas for image capture */}
        <canvas ref={canvasRef} className="hidden" />
      </DialogContent>
    </Dialog>
  );
}
