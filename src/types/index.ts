export interface BackgroundRemovalOptions {
  tolerance?: number
  method?: "canvas" | "edge" | "color" | "hybrid"
  enhanceQuality?: boolean
}

export interface ProcessedImageResult {
  url: string
  blob: Blob
  wasEnhanced?: boolean
}

export interface BackgroundRemovalModalProps {
  isOpen: boolean
  onClose: () => void
  originalImage: string
  originalFile?: File
  onConfirm: (imageUrl: string, blob: Blob) => void
  options?: BackgroundRemovalOptions
  className?: string
}

export interface ManualEditTool {
  type: "brush" | "eraser"
  size: number
}

export interface ZoomPanState {
  zoom: number
  panOffset: { x: number; y: number }
}

export type RemovalMethod = "canvas" | "edge" | "color" | "hybrid"

export interface QualityAnalysis {
  needsEnhancement: boolean
  isLowResolution: boolean
  isBlurry: boolean
  isLowContrast: boolean
  isNoisy: boolean
  sharpness: number
  contrast: number
  noise: number
  originalWidth: number
  originalHeight: number
}
