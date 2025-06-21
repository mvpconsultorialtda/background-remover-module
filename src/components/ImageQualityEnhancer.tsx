"use client"

import { useEffect, useRef } from "react"

export default function ImageQualityEnhancer({ imageUrl, onEnhanced, onProgress }) {
  const processedRef = useRef(false)
  const currentImageRef = useRef(null)

  useEffect(() => {
    // Resetar se a imagem mudou
    if (currentImageRef.current !== imageUrl) {
      processedRef.current = false
      currentImageRef.current = imageUrl
    }

    if (imageUrl && !processedRef.current) {
      processedRef.current = true
      analyzeAndEnhanceImage(imageUrl)
    }
  }, [imageUrl])

  const analyzeAndEnhanceImage = async (imageUrl) => {
    try {
      onProgress?.("Analisando qualidade da imagem...", 10)

      const img = new Image()
      img.crossOrigin = "anonymous"

      img.onload = async () => {
        const quality = analyzeImageQuality(img)

        if (quality.needsEnhancement) {
          onProgress?.("Melhorando qualidade da imagem...", 30)

          const enhancedResult = await enhanceImage(img, quality)
          onEnhanced(enhancedResult.url, enhancedResult.blob, null, true)
        } else {
          // Imagem já tem boa qualidade, usar original
          const canvas = document.createElement("canvas")
          const ctx = canvas.getContext("2d")
          canvas.width = img.width
          canvas.height = img.height
          ctx.drawImage(img, 0, 0)

          canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob)
            onEnhanced(url, blob, null, false)
          }, "image/png")
        }
      }

      img.onerror = (err) => {
        console.error("Erro ao carregar imagem:", err)
        onEnhanced(null, null, new Error("Erro ao carregar a imagem"), false)
      }

      img.src = imageUrl
    } catch (error) {
      console.error("Erro ao analisar imagem:", error)
      onEnhanced(null, null, error, false)
    }
  }

  const analyzeImageQuality = (img) => {
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    canvas.width = img.width
    canvas.height = img.height
    ctx.drawImage(img, 0, 0)

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data

    // Análise de resolução
    const totalPixels = img.width * img.height
    const isLowResolution = totalPixels < 300000 // Menos que ~550x550

    // Análise de nitidez usando detecção de bordas
    const sharpness = calculateSharpness(data, img.width, img.height)
    const isBlurry = sharpness < 0.1

    // Análise de contraste
    const contrast = calculateContrast(data)
    const isLowContrast = contrast < 30

    // Análise de ruído
    const noise = calculateNoise(data, img.width, img.height)
    const isNoisy = noise > 0.15

    return {
      needsEnhancement: isLowResolution || isBlurry || isLowContrast || isNoisy,
      isLowResolution,
      isBlurry,
      isLowContrast,
      isNoisy,
      sharpness,
      contrast,
      noise,
      originalWidth: img.width,
      originalHeight: img.height,
    }
  }

  const calculateSharpness = (data, width, height) => {
    let sharpness = 0
    let count = 0

    // Aplicar filtro Laplaciano para detectar bordas
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4

        // Converter para escala de cinza
        const gray = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2]

        // Aplicar kernel Laplaciano
        const neighbors = [
          0.299 * data[((y - 1) * width + x) * 4] +
            0.587 * data[((y - 1) * width + x) * 4 + 1] +
            0.114 * data[((y - 1) * width + x) * 4 + 2],
          0.299 * data[(y * width + (x - 1)) * 4] +
            0.587 * data[(y * width + (x - 1)) * 4 + 1] +
            0.114 * data[(y * width + (x - 1)) * 4 + 2],
          0.299 * data[(y * width + (x + 1)) * 4] +
            0.587 * data[(y * width + (x + 1)) * 4 + 1] +
            0.114 * data[(y * width + (x + 1)) * 4 + 2],
          0.299 * data[((y + 1) * width + x) * 4] +
            0.587 * data[((y + 1) * width + x) * 4 + 1] +
            0.114 * data[((y + 1) * width + x) * 4 + 2],
        ]

        const laplacian = Math.abs(-4 * gray + neighbors.reduce((a, b) => a + b, 0))
        sharpness += laplacian
        count++
      }
    }

    return count > 0 ? sharpness / count / 255 : 0
  }

  const calculateContrast = (data) => {
    let min = 255,
      max = 0

    for (let i = 0; i < data.length; i += 4) {
      const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
      min = Math.min(min, gray)
      max = Math.max(max, gray)
    }

    return max - min
  }

  const calculateNoise = (data, width, height) => {
    let noise = 0
    let count = 0

    // Calcular variação local para detectar ruído
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4
        const gray = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2]

        // Calcular média dos vizinhos
        let neighborSum = 0
        let neighborCount = 0

        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue
            const nIdx = ((y + dy) * width + (x + dx)) * 4
            const nGray = 0.299 * data[nIdx] + 0.587 * data[nIdx + 1] + 0.114 * data[nIdx + 2]
            neighborSum += nGray
            neighborCount++
          }
        }

        const neighborAvg = neighborSum / neighborCount
        const variation = Math.abs(gray - neighborAvg)
        noise += variation
        count++
      }
    }

    return count > 0 ? noise / count / 255 : 0
  }

  const enhanceImage = async (img, quality) => {
    onProgress?.("Aplicando melhorias...", 50)

    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")

    // Determinar novo tamanho se precisar de upscaling
    let newWidth = img.width
    let newHeight = img.height

    if (quality.isLowResolution) {
      const scaleFactor = Math.min(2, Math.sqrt(800000 / (img.width * img.height)))
      newWidth = Math.round(img.width * scaleFactor)
      newHeight = Math.round(img.height * scaleFactor)
      onProgress?.("Aumentando resolução...", 60)
    }

    canvas.width = newWidth
    canvas.height = newHeight

    // Aplicar upscaling suave se necessário
    if (newWidth !== img.width || newHeight !== img.height) {
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = "high"
    }

    ctx.drawImage(img, 0, 0, newWidth, newHeight)

    // Obter dados da imagem para processamento
    const imageData = ctx.getImageData(0, 0, newWidth, newHeight)
    const data = imageData.data

    onProgress?.("Melhorando contraste e nitidez...", 70)

    // Aplicar melhorias
    if (quality.isLowContrast) {
      enhanceContrast(data, 1.2)
    }

    if (quality.isBlurry) {
      applySharpeningFilter(data, newWidth, newHeight)
    }

    if (quality.isNoisy) {
      applyNoiseReduction(data, newWidth, newHeight)
    }

    onProgress?.("Finalizando melhorias...", 90)

    // Aplicar os dados processados de volta ao canvas
    ctx.putImageData(imageData, 0, 0)

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        const enhancedUrl = URL.createObjectURL(blob)
        resolve({ url: enhancedUrl, blob })
      }, "image/png")
    })
  }

  const enhanceContrast = (data, factor) => {
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.min(255, Math.max(0, (data[i] - 128) * factor + 128)) // R
      data[i + 1] = Math.min(255, Math.max(0, (data[i + 1] - 128) * factor + 128)) // G
      data[i + 2] = Math.min(255, Math.max(0, (data[i + 2] - 128) * factor + 128)) // B
    }
  }

  const applySharpeningFilter = (data, width, height) => {
    const original = new Uint8ClampedArray(data)

    // Kernel de sharpening
    const kernel = [0, -1, 0, -1, 5, -1, 0, -1, 0]

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        for (let c = 0; c < 3; c++) {
          // RGB channels
          let sum = 0

          for (let ky = -1; ky <= 1; ky++) {
            for (let kx = -1; kx <= 1; kx++) {
              const idx = ((y + ky) * width + (x + kx)) * 4 + c
              const kernelIdx = (ky + 1) * 3 + (kx + 1)
              sum += original[idx] * kernel[kernelIdx]
            }
          }

          const idx = (y * width + x) * 4 + c
          data[idx] = Math.min(255, Math.max(0, sum))
        }
      }
    }
  }

  const applyNoiseReduction = (data, width, height) => {
    const original = new Uint8ClampedArray(data)

    // Filtro de média ponderada para redução de ruído
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        for (let c = 0; c < 3; c++) {
          // RGB channels
          let sum = 0
          let weightSum = 0

          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              const idx = ((y + dy) * width + (x + dx)) * 4 + c
              const weight = dx === 0 && dy === 0 ? 4 : 1
              sum += original[idx] * weight
              weightSum += weight
            }
          }

          const idx = (y * width + x) * 4 + c
          data[idx] = Math.round(sum / weightSum)
        }
      }
    }
  }

  // Este componente não renderiza nada visível
  return null
}
