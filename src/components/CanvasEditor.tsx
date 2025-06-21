"use client"

import type React from "react"

import { useRef, useEffect, useState, useCallback } from "react"

interface CanvasEditorProps {
  processedImage: string
  originalImage: string
  tool: "brush" | "eraser"
  brushSize: number
  zoom: number
  panOffset: { x: number; y: number }
  onEditedImageChange: (editedImageUrl: string) => void
}

export default function CanvasEditor({
  processedImage,
  originalImage,
  tool,
  brushSize,
  zoom,
  panOffset,
  onEditedImageChange,
}: CanvasEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 })
  const [originalImageObj, setOriginalImageObj] = useState<HTMLImageElement | null>(null)
  const [processedImageObj, setProcessedImageObj] = useState<HTMLImageElement | null>(null)
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 })

  // Carregar as imagens
  useEffect(() => {
    const loadImages = async () => {
      try {
        // Carregar imagem original
        const originalImg = new Image()
        originalImg.crossOrigin = "anonymous"
        originalImg.onload = () => setOriginalImageObj(originalImg)
        originalImg.src = originalImage

        // Carregar imagem processada
        const processedImg = new Image()
        processedImg.crossOrigin = "anonymous"
        processedImg.onload = () => setProcessedImageObj(processedImg)
        processedImg.src = processedImage
      } catch (error) {
        console.error("Erro ao carregar imagens:", error)
      }
    }

    loadImages()
  }, [originalImage, processedImage])

  // Configurar o canvas quando as imagens estiverem carregadas
  useEffect(() => {
    if (processedImageObj && canvasRef.current && containerRef.current) {
      const canvas = canvasRef.current
      const container = containerRef.current
      const ctx = canvas.getContext("2d")

      if (!ctx) return

      // Calcular o tamanho do canvas baseado no container
      const containerRect = container.getBoundingClientRect()
      const maxWidth = containerRect.width - 20
      const maxHeight = containerRect.height - 20

      // Calcular a escala para caber no container
      const scaleX = maxWidth / processedImageObj.width
      const scaleY = maxHeight / processedImageObj.height
      const scale = Math.min(scaleX, scaleY, 1) // Não aumentar além do tamanho original

      const displayWidth = processedImageObj.width * scale
      const displayHeight = processedImageObj.height * scale

      // Configurar o canvas
      canvas.width = processedImageObj.width
      canvas.height = processedImageObj.height
      canvas.style.width = `${displayWidth}px`
      canvas.style.height = `${displayHeight}px`

      setCanvasSize({ width: displayWidth, height: displayHeight })

      // Desenhar a imagem processada inicial
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(processedImageObj, 0, 0)
    }
  }, [processedImageObj])

  // Função para obter as coordenadas do mouse/touch no canvas
  const getCanvasCoordinates = useCallback((event: MouseEvent | TouchEvent) => {
    if (!canvasRef.current) return { x: 0, y: 0 }

    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()

    let clientX: number, clientY: number

    if ("touches" in event) {
      clientX = event.touches[0].clientX
      clientY = event.touches[0].clientY
    } else {
      clientX = event.clientX
      clientY = event.clientY
    }

    // Converter coordenadas da tela para coordenadas do canvas
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    }
  }, [])

  // Função para desenhar no canvas
  const draw = useCallback(
    (x: number, y: number) => {
      if (!canvasRef.current || !originalImageObj) return

      const canvas = canvasRef.current
      const ctx = canvas.getContext("2d")
      if (!ctx) return

      ctx.save()

      // Configurar o pincel
      ctx.globalCompositeOperation = tool === "eraser" ? "destination-out" : "source-over"
      ctx.lineWidth = brushSize
      ctx.lineCap = "round"
      ctx.lineJoin = "round"

      if (tool === "brush") {
        // Para o pincel, desenhar da imagem original
        ctx.globalAlpha = 1

        // Criar um padrão circular para o pincel
        const tempCanvas = document.createElement("canvas")
        const tempCtx = tempCanvas.getContext("2d")
        if (!tempCtx) return

        tempCanvas.width = brushSize * 2
        tempCanvas.height = brushSize * 2

        // Desenhar a parte da imagem original que corresponde à área do pincel
        tempCtx.drawImage(
          originalImageObj,
          x - brushSize,
          y - brushSize,
          brushSize * 2,
          brushSize * 2,
          0,
          0,
          brushSize * 2,
          brushSize * 2,
        )

        // Criar uma máscara circular
        tempCtx.globalCompositeOperation = "destination-in"
        tempCtx.beginPath()
        tempCtx.arc(brushSize, brushSize, brushSize, 0, Math.PI * 2)
        tempCtx.fill()

        // Desenhar no canvas principal
        ctx.drawImage(tempCanvas, x - brushSize, y - brushSize)
      } else {
        // Para a borracha, simplesmente apagar
        ctx.beginPath()
        ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2)
        ctx.fill()
      }

      ctx.restore()

      // Notificar sobre a mudança
      canvas.toBlob((blob) => {
        if (blob) {
          const editedUrl = URL.createObjectURL(blob)
          onEditedImageChange(editedUrl)
        }
      }, "image/png")
    },
    [tool, brushSize, originalImageObj, onEditedImageChange],
  )

  // Event handlers para mouse
  const handleMouseDown = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault()
      setIsDrawing(true)
      const coords = getCanvasCoordinates(event.nativeEvent)
      setLastPos(coords)
      draw(coords.x, coords.y)
    },
    [getCanvasCoordinates, draw],
  )

  const handleMouseMove = useCallback(
    (event: React.MouseEvent) => {
      if (!isDrawing) return
      event.preventDefault()

      const coords = getCanvasCoordinates(event.nativeEvent)

      // Desenhar linha do último ponto até o atual
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext("2d")
        if (ctx) {
          ctx.save()
          ctx.globalCompositeOperation = tool === "eraser" ? "destination-out" : "source-over"
          ctx.lineWidth = brushSize
          ctx.lineCap = "round"
          ctx.lineJoin = "round"

          if (tool === "brush" && originalImageObj) {
            // Para o pincel, usar a imagem original como fonte
            ctx.strokeStyle = ctx.createPattern(originalImageObj, "no-repeat") || "#000"
          }

          ctx.beginPath()
          ctx.moveTo(lastPos.x, lastPos.y)
          ctx.lineTo(coords.x, coords.y)
          ctx.stroke()
          ctx.restore()
        }
      }

      setLastPos(coords)
      draw(coords.x, coords.y)
    },
    [isDrawing, lastPos, getCanvasCoordinates, draw, tool, brushSize, originalImageObj],
  )

  const handleMouseUp = useCallback(() => {
    setIsDrawing(false)
  }, [])

  // Event handlers para touch
  const handleTouchStart = useCallback(
    (event: React.TouchEvent) => {
      event.preventDefault()
      setIsDrawing(true)
      const coords = getCanvasCoordinates(event.nativeEvent)
      setLastPos(coords)
      draw(coords.x, coords.y)
    },
    [getCanvasCoordinates, draw],
  )

  const handleTouchMove = useCallback(
    (event: React.TouchEvent) => {
      if (!isDrawing) return
      event.preventDefault()

      const coords = getCanvasCoordinates(event.nativeEvent)
      setLastPos(coords)
      draw(coords.x, coords.y)
    },
    [isDrawing, getCanvasCoordinates, draw],
  )

  const handleTouchEnd = useCallback(() => {
    setIsDrawing(false)
  }, [])

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex items-center justify-center relative overflow-hidden"
      style={{ cursor: tool === "brush" ? "crosshair" : "grab" }}
    >
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="border border-gray-300 rounded"
        style={{
          transform: `scale(${zoom}) translate(${panOffset.x}px, ${panOffset.y}px)`,
          transformOrigin: "center center",
        }}
      />
    </div>
  )
}
