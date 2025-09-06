/**
 * Image capture utilities for optimized camera operations
 */

export interface CameraDimensions {
  width: number;
  height: number;
}

export interface CaptureOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

/**
 * Calculate optimal dimensions to fit within constraints while maintaining aspect ratio
 */
export function calculateOptimalDimensions(
  videoWidth: number,
  videoHeight: number,
  maxWidth: number = 720,
  maxHeight: number = 480
): CameraDimensions {
  // If already within bounds, return as-is
  if (videoWidth <= maxWidth && videoHeight <= maxHeight) {
    return { width: videoWidth, height: videoHeight };
  }

  // Use single calculation for aspect ratio scaling
  const aspectRatio = videoWidth / videoHeight;
  const targetByWidth = { width: maxWidth, height: Math.round(maxWidth / aspectRatio) };
  const targetByHeight = { width: Math.round(maxHeight * aspectRatio), height: maxHeight };

  // Choose the scaling that fits within both constraints
  return targetByHeight.width <= maxWidth ? targetByHeight : targetByWidth;
}

/**
 * Create optimized camera constraints for better performance
 */
export function createCameraConstraints(facingMode: "user" | "environment"): MediaStreamConstraints {
  return {
    video: {
      width: { ideal: 720, max: 1280 },
      height: { ideal: 480, max: 720 },
      facingMode: facingMode,
      frameRate: { ideal: 30, max: 30 },
    },
    audio: false,
  };
}

/**
 * Check available camera devices
 */
export async function getAvailableCameras(): Promise<MediaDeviceInfo[]> {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter((device) => device.kind === "videoinput");
  } catch (error) {
    console.error("Error enumerating devices:", error);
    return [];
  }
}

/**
 * Capture image using hardware-accelerated ImageCapture API
 */
export async function captureWithImageCapture(
  stream: MediaStream,
  options: CaptureOptions = {}
): Promise<Blob> {
  const { maxWidth = 720, maxHeight = 480 } = options;
  
  if (!('ImageCapture' in window)) {
    throw new Error("ImageCapture API not supported");
  }

  const track = stream.getVideoTracks()[0];
  if (!track) {
    throw new Error("No video track available");
  }

  const imageCapture = new window.ImageCapture(track);
  return await imageCapture.takePhoto({
    imageWidth: maxWidth,
    imageHeight: maxHeight,
  });
}

/**
 * Fast canvas-based image capture with optimizations
 */
export async function captureWithCanvas(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  options: CaptureOptions = {}
): Promise<Blob> {
  const { maxWidth = 720, maxHeight = 480, quality = 0.7 } = options;

  return new Promise((resolve, reject) => {
    const context = canvas.getContext("2d", {
      alpha: false, // No alpha channel for JPEG
      desynchronized: true, // Faster rendering
    });

    if (!context) {
      reject(new Error("Canvas context not available"));
      return;
    }

    // Get optimal dimensions efficiently
    const { width: targetWidth, height: targetHeight } = calculateOptimalDimensions(
      video.videoWidth,
      video.videoHeight,
      maxWidth,
      maxHeight
    );

    // Set canvas dimensions once
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    // Optimize canvas rendering for speed
    context.imageSmoothingEnabled = false;
    context.imageSmoothingQuality = 'low';

    // Use requestVideoFrameCallback for better timing if available
    if ('requestVideoFrameCallback' in video) {
      video.requestVideoFrameCallback(() => {
        context.drawImage(video, 0, 0, targetWidth, targetHeight);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error("Failed to create blob from canvas"));
            }
          },
          "image/jpeg",
          quality
        );
      });
    } else {
      // Fallback for browsers without requestVideoFrameCallback
      context.drawImage(video, 0, 0, targetWidth, targetHeight);
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Failed to create blob from canvas"));
          }
        },
        "image/jpeg",
        quality
      );
    }
  });
}

/**
 * Capture image with automatic fallback between ImageCapture API and Canvas
 */
export async function captureImage(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  stream: MediaStream | null,
  options: CaptureOptions = {}
): Promise<Blob> {
  // Try using ImageCapture API for hardware acceleration (if available)
  if (stream && 'ImageCapture' in window) {
    try {
      return await captureWithImageCapture(stream, options);
    } catch (error) {
      console.warn("ImageCapture API failed, falling back to canvas:", error);
    }
  }

  // Use optimized canvas approach as fallback
  return await captureWithCanvas(video, canvas, options);
}
