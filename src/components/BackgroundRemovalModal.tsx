"use client"

import type React from "react"
import { useState, useEffect, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Check, ArrowLeft, ArrowRight, AlertTriangle, RefreshCw, ZoomOut, ZoomIn, Sparkles } from "lucide-react"
import type { BackgroundRemovalModalProps, RemovalMethod, ManualEditTool, ZoomPanState } from "../types"
import { useIsMobile } from "../hooks/useIsMobile"
import SafeBackgroundRemover from "./SafeBackgroundRemover"
import BackgroundRemovalControls from "./BackgroundRemovalControls"
import ManualEditTools from "./ManualEditTools"
import CanvasEditor from "./CanvasEditor"
import ImageQualityEnhancer from "./ImageQualityEnhancer"
import AdvancedBackgroundRemover from "./AdvancedBackgroundRemover"
import BackgroundRemovalMethodSelector from "./BackgroundRemovalMethodSelector"

const BackgroundRemovalModal: React.FC<BackgroundRemovalModalProps> = ({
  isOpen,
  onClose,
  originalImage,
  originalFile,
  onConfirm,
  options = {},
  className = "",
}) => {
  const isMobile = useIsMobile()
  const [processedImage, setProcessedImage] = useState<string | null>(null)
  const [editedImage, setEditedImage] = useState<string | null>(null)
  const [enhancedImage, setEnhancedImage] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(true)
  const [isEnhancing, setIsEnhancing] = useState(false)
  const [enhancementApplied, setEnhancementApplied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [progressMessage, setProgressMessage] = useState("Iniciando processamento...")
  const [useOriginalAsFallback, setUseOriginalAsFallback] = useState(false)
  const [tolerance, setTolerance] = useState(options.tolerance || 30)
  const [removalMethod, setRemovalMethod] = useState<RemovalMethod>(options.method || "canvas")

  // Estados para a edição manual
  const [tool, setTool] = useState<ManualEditTool["type"]>("brush")
  const [brushSize, setBrushSize] = useState(isMobile ? 30 : 20)
  const [zoomPan, setZoomPan] = useState<ZoomPanState>({
    zoom: 1,
    panOffset: { x: 0, y: 0 },
  })

  // Refs
  const canvasContainerRef = useRef<HTMLDivElement>(null)

  // Funções para controle de zoom e panning
  const decreaseZoom = useCallback(() => {
    setZoomPan((prev) => ({
      ...prev,
      zoom: Math.max(prev.zoom - 0.1, 0.1),
    }))
  }, [])

  const increaseZoom = useCallback(() => {
    setZoomPan((prev) => ({
      ...prev,
      zoom: prev.zoom + 0.1,
    }))
  }, [])

  const resetZoomAndPan = useCallback(() => {
    setZoomPan({
      zoom: 1,
      panOffset: { x: 0, y: 0 },
    })
  }, [])

  // Resetar o estado e iniciar o processamento sempre que o modal for aberto
  useEffect(() => {
    if (isOpen && originalImage) {
      // Resetar estados
      setProcessedImage(null)
      setEditedImage(null)
      setEnhancedImage(null)
      setIsProcessing(true)
      setIsEnhancing(false)
      setEnhancementApplied(false)
      setError(null)
      setProgress(0)
      setProgressMessage("Iniciando processamento...")
      setUseOriginalAsFallback(false)
      setRemovalMethod(options.method || "canvas")
      setTool("brush")
      setBrushSize(isMobile ? 30 : 20)
      setZoomPan({
        zoom: 1,
        panOffset: { x: 0, y: 0 },
      })
    }
  }, [isOpen, originalImage, isMobile, options.method])

  const handleConfirm = useCallback(() => {
    // Priorizar a imagem editada manualmente, se existir
    const finalImage = editedImage || processedImage

    if (finalImage) {
      // Converter URL para Blob novamente para enviar ao componente pai
      fetch(finalImage)
        .then((res) => res.blob())
        .then((blob) => {
          onConfirm(finalImage, blob)
        })
    } else if (useOriginalAsFallback && originalImage) {
      // Usar a imagem original como fallback
      fetch(originalImage)
        .then((res) => res.blob())
        .then((blob) => {
          onConfirm(originalImage, blob)
        })
    }
  }, [editedImage, processedImage, useOriginalAsFallback, originalImage, onConfirm])

  const handleUseFallback = useCallback(() => {
    setUseOriginalAsFallback(true)
    setIsProcessing(false)
  }, [])

  const handleEnhancedImage = useCallback(
    (enhancedUrl: string | null, blob: Blob | null, err: Error | null, wasEnhanced: boolean) => {
      if (err) {
        console.error("Erro no enhancement:", err)
        setError(err.message || "Erro ao melhorar a qualidade da imagem")
        setIsProcessing(false)
        setIsEnhancing(false)
        return
      }

      if (enhancedUrl) {
        setEnhancedImage(enhancedUrl)
        setEnhancementApplied(wasEnhanced)
        setIsEnhancing(false)

        if (wasEnhanced) {
          setProgressMessage("Removendo fundo da imagem melhorada...")
        } else {
          setProgressMessage("Removendo fundo da imagem...")
        }
      }
    },
    [],
  )

  const handleProcessedImage = useCallback((processedUrl: string | null, blob: Blob | null, err: Error | null) => {
    if (err) {
      console.error("Erro no processamento:", err)
      setError(err.message || "Erro ao processar a imagem")
      setIsProcessing(false)
      return
    }

    if (processedUrl) {
      setProcessedImage(processedUrl)
      setProgress(100)
      setProgressMessage("Processamento concluído!")
      setIsProcessing(false)
    }
  }, [])

  const handleEnhancementProgress = useCallback((message: string, progressValue: number) => {
    setIsEnhancing(true)
    setProgressMessage(message)
    setProgress(progressValue)
  }, [])

  const handleMethodChange = useCallback(
    (newMethod: RemovalMethod) => {
      setRemovalMethod(newMethod)
      // Reprocessar com o novo método se já temos uma imagem processada
      if (processedImage && !isProcessing) {
        handleReprocess()
      }
    },
    [processedImage, isProcessing],
  )

  const handleToleranceChange = useCallback((newTolerance: number) => {
    setTolerance(newTolerance)
    // Implementar reprocessamento com nova tolerância
  }, [])

  const handleReprocess = useCallback(() => {
    // Implementar reprocessamento
  }, [])

  const handleEditedImageChange = useCallback((editedImageUrl: string) => {
    setEditedImage(editedImageUrl)
  }, [])

  const handleToolChange = useCallback((newTool: ManualEditTool["type"]) => {
    setTool(newTool)
  }, [])

  const handleBrushSizeChange = useCallback((newBrushSize: number) => {
    setBrushSize(newBrushSize)
  }, [])

  if (!isOpen) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={`fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 ${className}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-auto"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 border-b flex justify-between items-center sticky top-0 bg-white z-10">
              <h3 className="text-xl font-bold text-gray-800">Processamento de Imagem</h3>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 focus:outline-none"
                aria-label="Fechar"
                disabled={isProcessing}
              >
                <X size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 md:p-6">
              {isProcessing ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-24 h-24 border-t-4 border-red-500 border-solid rounded-full animate-spin mb-6"></div>

                  {/* Indicador especial para melhoria de qualidade */}
                  {isEnhancing && (
                    <div className="flex items-center mb-4 px-4 py-2 bg-blue-100 border border-blue-300 rounded-lg">
                      <Sparkles className="w-5 h-5 text-blue-600 mr-2" />
                      <span className="text-blue-800 font-medium">Melhorando qualidade da imagem</span>
                    </div>
                  )}

                  <p className="text-lg font-medium text-gray-700">{progressMessage}</p>
                  <div className="w-full max-w-md bg-gray-200 rounded-full h-2.5 mt-4">
                    <div
                      className="bg-red-500 h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">{progress}% concluído</p>

                  {enhancementApplied && !isEnhancing && (
                    <div className="mt-4 px-3 py-1 bg-green-100 border border-green-300 rounded-full">
                      <span className="text-green-800 text-sm font-medium">✓ Qualidade melhorada</span>
                    </div>
                  )}
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg mb-6 max-w-md">
                    <div className="flex items-center mb-2">
                      <AlertTriangle className="w-5 h-5 mr-2" />
                      <span className="font-bold">Erro no processamento</span>
                    </div>
                    <p>{error}</p>
                  </div>

                  <div className="flex flex-col gap-4 items-center">
                    <button
                      onClick={handleReprocess}
                      className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center"
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Tentar novamente
                    </button>
                    <button
                      onClick={handleUseFallback}
                      className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
                    >
                      Usar imagem original
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Indicador de melhoria aplicada */}
                  {enhancementApplied && (
                    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center">
                        <Sparkles className="w-5 h-5 text-green-600 mr-2" />
                        <span className="text-green-800 font-medium">
                          Qualidade da imagem foi melhorada automaticamente para melhor remoção de fundo
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Seletor de método de remoção */}
                  <div className="mb-6">
                    <BackgroundRemovalMethodSelector
                      currentMethod={removalMethod}
                      onMethodChange={handleMethodChange}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    {/* Coluna da esquerda - Imagem original e controles */}
                    <div>
                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                          <ArrowLeft className="w-4 h-4 mr-1" /> Imagem Original
                          {enhancementApplied && (
                            <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                              Melhorada
                            </span>
                          )}
                        </p>
                        <div className="bg-gray-100 rounded-lg overflow-hidden h-48 md:h-64 flex items-center justify-center">
                          {originalImage && (
                            <img
                              src={enhancedImage || originalImage}
                              alt="Imagem original"
                              className="max-h-full max-w-full object-contain"
                            />
                          )}
                        </div>
                      </div>

                      {/* Controles de ajuste */}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                        <h4 className="text-base font-medium text-blue-700 mb-3 flex items-center">
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Ajuste de Sensibilidade
                        </h4>
                        <BackgroundRemovalControls
                          onToleranceChange={handleToleranceChange}
                          defaultTolerance={tolerance}
                        />

                        <div className="mt-4 flex justify-end">
                          <button
                            onClick={handleReprocess}
                            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center text-sm"
                          >
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Reprocessar imagem
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Coluna da direita - Imagem processada e ferramentas de edição */}
                    <div>
                      <div className="mb-4">
                        <div className="flex justify-between items-center mb-2">
                          <p className="text-sm font-medium text-gray-700 flex items-center">
                            Imagem Processada <ArrowRight className="w-4 h-4 ml-1" />
                          </p>

                          {/* Ferramentas de edição */}
                          <ManualEditTools
                            onToolChange={handleToolChange}
                            onBrushSizeChange={handleBrushSizeChange}
                            brushSize={brushSize}
                            tool={tool}
                          />
                        </div>

                        {/* Controles de zoom */}
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center space-x-2">
                            <button onClick={decreaseZoom} className="p-2 bg-gray-200 rounded-lg" title="Diminuir zoom">
                              <ZoomOut size={isMobile ? 20 : 16} />
                            </button>
                            <span className="text-xs font-medium">{Math.round(zoomPan.zoom * 100)}%</span>
                            <button onClick={increaseZoom} className="p-2 bg-gray-200 rounded-lg" title="Aumentar zoom">
                              <ZoomIn size={isMobile ? 20 : 16} />
                            </button>
                            <button
                              onClick={resetZoomAndPan}
                              className="p-2 bg-gray-200 rounded-lg text-xs"
                              title="Resetar zoom"
                            >
                              Reset
                            </button>
                          </div>
                        </div>

                        {/* Canvas para edição */}
                        <div
                          ref={canvasContainerRef}
                          className="bg-grid-pattern rounded-lg overflow-hidden h-48 md:h-64 flex items-center justify-center relative"
                        >
                          {processedImage && (
                            <CanvasEditor
                              processedImage={processedImage}
                              originalImage={enhancedImage || originalImage}
                              tool={tool}
                              brushSize={brushSize}
                              zoom={zoomPan.zoom}
                              panOffset={zoomPan.panOffset}
                              onEditedImageChange={handleEditedImageChange}
                            />
                          )}
                        </div>
                      </div>

                      {/* Instruções de edição */}
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <h4 className="text-base font-medium text-green-700 mb-2">Instruções de Edição</h4>
                        <ul className="text-sm text-green-800 space-y-1 list-disc pl-5">
                          <li>
                            Use o <strong>pincel</strong> para restaurar partes da imagem original
                          </li>
                          <li>
                            Use a <strong>borracha</strong> para criar transparência
                          </li>
                          <li>
                            Ajuste o <strong>tamanho</strong> das ferramentas conforme necessário
                          </li>
                          {isMobile && (
                            <>
                              <li>
                                Use <strong>dois dedos</strong> para mover a imagem
                              </li>
                              <li>
                                Use <strong>pinça</strong> para aumentar/diminuir o zoom
                              </li>
                            </>
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t flex justify-end gap-3 sticky bottom-0 bg-white">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-colors"
                disabled={isProcessing}
              >
                Cancelar
              </button>
              {(!isProcessing && (editedImage || processedImage)) || useOriginalAsFallback ? (
                <motion.button
                  onClick={handleConfirm}
                  className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg flex items-center transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Check className="mr-2 h-5 w-5" />
                  Confirmar Imagem
                </motion.button>
              ) : null}
            </div>

            {/* Processadores de imagem */}
            {originalImage && options.enhanceQuality !== false && (
              <ImageQualityEnhancer
                imageUrl={originalImage}
                onEnhanced={handleEnhancedImage}
                onProgress={handleEnhancementProgress}
              />
            )}

            {enhancedImage && removalMethod !== "canvas" && (
              <AdvancedBackgroundRemover
                imageUrl={enhancedImage}
                method={removalMethod}
                tolerance={tolerance}
                onProcessed={handleProcessedImage}
              />
            )}

            {enhancedImage && removalMethod === "canvas" && (
              <SafeBackgroundRemover
                imageUrl={enhancedImage}
                imageFile={originalFile}
                onProcessed={handleProcessedImage}
              />
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default BackgroundRemovalModal
