"use client";

import { useState, useRef, useEffect } from "react";
import { useGameStore } from "@/lib/store";
import type { NotificationData, CelebrationData } from "@/components/main-content";
import {
  createCameraConstraints,
  getAvailableCameras,
  captureImage as captureImageUtil,
} from "./capture-utils";
import { processCaptureWithApi } from "./api-utils";

interface UseCaptureProps {
  showNotification: (data: NotificationData) => void;
  showCelebration: (data: CelebrationData) => void;
  onOpenChange: (open: boolean) => void;
  isOpen: boolean;
}

export function useCapture({
  showNotification,
  showCelebration,
  onOpenChange,
  isOpen,
}: UseCaptureProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { addStation, hasVisitedStation } = useGameStore();

  // Start camera when dialog opens
  useEffect(() => {
    if (isOpen) {
      checkAvailableCameras();
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  const checkAvailableCameras = async () => {
    try {
      const cameras = await getAvailableCameras();
      setAvailableCameras(cameras);
    } catch (error) {
      console.error("Error enumerating devices:", error);
    }
  };

  const startCamera = async () => {
    try {
      const constraints = createCameraConstraints(facingMode);
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      showNotification({
        type: "error",
        title: "Camera Access Failed",
        message:
          "Unable to access camera. Please ensure camera permissions are granted.",
        details: {
          reason: error instanceof Error ? error.message : "Unknown error",
          tip: "Try refreshing the page or checking your browser settings",
        },
      });
    }
  };

  const switchCamera = () => {
    const newFacingMode = facingMode === "user" ? "environment" : "user";
    setFacingMode(newFacingMode);
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const captureImage = async () => {
    if (!videoRef.current || !canvasRef.current || isProcessing) return;

    setIsProcessing(true);

    try {
      // Capture image using optimized utilities
      const blob = await captureImageUtil(
        videoRef.current,
        canvasRef.current,
        stream
      );

      // Process capture with API utilities
      await processCaptureWithApi(blob, {
        showNotification,
        showCelebration,
        addStation,
        hasVisitedStation,
        onOpenChange,
      });
      
    } catch (error) {
      console.error("Error in captureImage:", error);
      showNotification({
        type: "error",
        title: "Image Capture Failed",
        message: "Failed to capture image from camera.",
        details: {
          reason: error instanceof Error ? error.message : "Unknown error",
          tip: "Try adjusting camera position or tapping capture again",
        },
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    // State
    stream,
    facingMode,
    availableCameras,
    isProcessing,
    
    // Refs
    videoRef,
    canvasRef,
    
    // Actions
    switchCamera,
    captureImage,
  };
}
