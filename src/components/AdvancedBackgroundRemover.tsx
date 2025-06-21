"use client"

import { useEffect, useRef } from "react"

export default function AdvancedBackgroundRemover({ imageUrl, imageFile, onProcessed, method = "edge" }) {
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
      processImage(imageUrl, method)
    }
  }, [imageUrl, method])

  const processImage = async (imageUrl, method) => {
    try {
      let result

      switch (method) {
        case "edge":
          result = await processWithEdgeDetection(imageUrl)
          break
        case "color":
          result = await processWithColorSegmentation(imageUrl)
          break
        case "hybrid":
          result = await processWithHybridMethod(imageUrl)
          break
        default:
          result = await processWithEdgeDetection(imageUrl)
      }

      onProcessed(result.url, result.blob, null)
    } catch (error) {
      console.error("Erro ao processar imagem:", error)
      onProcessed(null, null, error)
    }
  }

  // Método 1: Detecção de bordas + Flood fill
  const processWithEdgeDetection = async (imageUrl) => {
    return new Promise((resolve, reject) => {
      try {
        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d")

        const img = new Image()
        img.crossOrigin = "anonymous"

        img.onload = () => {
          canvas.width = img.width
          canvas.height = img.height
          ctx.drawImage(img, 0, 0)

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
          const data = imageData.data

          // 1. Aplicar filtro de detecção de bordas (Sobel)
          const edges = detectEdges(data, canvas.width, canvas.height)

          // 2. Criar máscara de fundo usando flood fill das bordas
          const backgroundMask = createBackgroundMask(data, edges, canvas.width, canvas.height)

          // 3. Aplicar a máscara
          for (let i = 0; i < data.length; i += 4) {
            const pixelIndex = Math.floor(i / 4)
            if (backgroundMask[pixelIndex]) {
              data[i + 3] = 0 // Tornar transparente
            }
          }

          ctx.putImageData(imageData, 0, 0)

          canvas.toBlob((blob) => {
            const processedUrl = URL.createObjectURL(blob)
            resolve({ url: processedUrl, blob })
          }, "image/png")
        }

        img.onerror = (err) => {
          reject(new Error("Erro ao carregar a imagem"))
        }

        img.src = imageUrl
      } catch (err) {
        reject(err)
      }
    })
  }

  // Método 2: Segmentação por cor avançada
  const processWithColorSegmentation = async (imageUrl) => {
    return new Promise((resolve, reject) => {
      try {
        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d")

        const img = new Image()
        img.crossOrigin = "anonymous"

        img.onload = () => {
          canvas.width = img.width
          canvas.height = img.height
          ctx.drawImage(img, 0, 0)

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
          const data = imageData.data

          // 1. Análise de histograma de cores
          const colorClusters = analyzeColorClusters(data, canvas.width, canvas.height)

          // 2. Identificar cores de fundo (bordas + frequência)
          const backgroundColors = identifyBackgroundColors(data, colorClusters, canvas.width, canvas.height)

          // 3. Segmentação baseada em similaridade de cor
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i]
            const g = data[i + 1]
            const b = data[i + 2]

            const isBackground = backgroundColors.some((bgColor) => {
              const colorDistance = Math.sqrt(
                Math.pow(r - bgColor.r, 2) + Math.pow(g - bgColor.g, 2) + Math.pow(b - bgColor.b, 2),
              )
              return colorDistance < bgColor.tolerance
            })

            if (isBackground) {
              data[i + 3] = 0 // Tornar transparente
            }
          }

          ctx.putImageData(imageData, 0, 0)

          canvas.toBlob((blob) => {
            const processedUrl = URL.createObjectURL(blob)
            resolve({ url: processedUrl, blob })
          }, "image/png")
        }

        img.onerror = (err) => {
          reject(new Error("Erro ao carregar a imagem"))
        }

        img.src = imageUrl
      } catch (err) {
        reject(err)
      }
    })
  }

  // Método 3: Híbrido (combina detecção de bordas + segmentação por cor)
  const processWithHybridMethod = async (imageUrl) => {
    return new Promise((resolve, reject) => {
      try {
        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d")

        const img = new Image()
        img.crossOrigin = "anonymous"

        img.onload = () => {
          canvas.width = img.width
          canvas.height = img.height
          ctx.drawImage(img, 0, 0)

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
          const data = imageData.data

          // 1. Detecção de bordas
          const edges = detectEdges(data, canvas.width, canvas.height)

          // 2. Análise de cores
          const colorClusters = analyzeColorClusters(data, canvas.width, canvas.height)
          const backgroundColors = identifyBackgroundColors(data, colorClusters, canvas.width, canvas.height)

          // 3. Combinar ambos os métodos
          for (let i = 0; i < data.length; i += 4) {
            const pixelIndex = Math.floor(i / 4)
            const x = pixelIndex % canvas.width
            const y = Math.floor(pixelIndex / canvas.width)

            const r = data[i]
            const g = data[i + 1]
            const b = data[i + 2]

            // Verificar se é borda (menos provável de ser fundo)
            const isNearEdge = edges[pixelIndex] > 0.3

            // Verificar similaridade de cor com fundo
            const colorSimilarity = backgroundColors.reduce((min, bgColor) => {
              const distance = Math.sqrt(
                Math.pow(r - bgColor.r, 2) + Math.pow(g - bgColor.g, 2) + Math.pow(b - bgColor.b, 2),
              )
              return Math.min(min, distance / bgColor.tolerance)
            }, Number.POSITIVE_INFINITY)

            // Decisão híbrida: considerar bordas e cor
            const isBackground = !isNearEdge && colorSimilarity < 1.2

            if (isBackground) {
              data[i + 3] = 0 // Tornar transparente
            }
          }

          ctx.putImageData(imageData, 0, 0)

          canvas.toBlob((blob) => {
            const processedUrl = URL.createObjectURL(blob)
            resolve({ url: processedUrl, blob })
          }, "image/png")
        }

        img.onerror = (err) => {
          reject(new Error("Erro ao carregar a imagem"))
        }

        img.src = imageUrl
      } catch (err) {
        reject(err)
      }
    })
  }

  // Função auxiliar: Detecção de bordas usando filtro Sobel
  const detectEdges = (data, width, height) => {
    const edges = new Float32Array(width * height)

    // Kernels Sobel
    const sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1]
    const sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1]

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let gx = 0,
          gy = 0

        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const idx = ((y + ky) * width + (x + kx)) * 4
            const gray = (data[idx] + data[idx + 1] + data[idx + 2]) / 3

            const kernelIdx = (ky + 1) * 3 + (kx + 1)
            gx += gray * sobelX[kernelIdx]
            gy += gray * sobelY[kernelIdx]
          }
        }

        const magnitude = Math.sqrt(gx * gx + gy * gy) / 255
        edges[y * width + x] = magnitude
      }
    }

    return edges
  }

  // Função auxiliar: Análise de clusters de cor
  const analyzeColorClusters = (data, width, height) => {
    const colorMap = new Map()

    // Amostragem de cores (reduzir precisão para clustering)
    for (let i = 0; i < data.length; i += 16) {
      // Amostragem esparsa
      const r = Math.floor(data[i] / 32) * 32
      const g = Math.floor(data[i + 1] / 32) * 32
      const b = Math.floor(data[i + 2] / 32) * 32

      const colorKey = `${r},${g},${b}`
      colorMap.set(colorKey, (colorMap.get(colorKey) || 0) + 1)
    }

    // Converter para array e ordenar por frequência
    return Array.from(colorMap.entries())
      .map(([color, count]) => {
        const [r, g, b] = color.split(",").map(Number)
        return { r, g, b, count }
      })
      .sort((a, b) => b.count - a.count)
  }

  // Função auxiliar: Identificar cores de fundo
  const identifyBackgroundColors = (data, colorClusters, width, height) => {
    const backgroundColors = []

    // Analisar bordas da imagem para identificar cores de fundo
    const borderPixels = []

    // Coletar pixels das bordas
    for (let x = 0; x < width; x++) {
      // Borda superior
      const topIdx = x * 4
      borderPixels.push({ r: data[topIdx], g: data[topIdx + 1], b: data[topIdx + 2] })

      // Borda inferior
      const bottomIdx = ((height - 1) * width + x) * 4
      borderPixels.push({ r: data[bottomIdx], g: data[bottomIdx + 1], b: data[bottomIdx + 2] })
    }

    for (let y = 0; y < height; y++) {
      // Borda esquerda
      const leftIdx = y * width * 4
      borderPixels.push({ r: data[leftIdx], g: data[leftIdx + 1], b: data[leftIdx + 2] })

      // Borda direita
      const rightIdx = (y * width + width - 1) * 4
      borderPixels.push({ r: data[rightIdx], g: data[rightIdx + 1], b: data[rightIdx + 2] })
    }

    // Encontrar cores mais comuns nas bordas
    const borderColorMap = new Map()
    borderPixels.forEach((pixel) => {
      const r = Math.floor(pixel.r / 16) * 16
      const g = Math.floor(pixel.g / 16) * 16
      const b = Math.floor(pixel.b / 16) * 16
      const key = `${r},${g},${b}`
      borderColorMap.set(key, (borderColorMap.get(key) || 0) + 1)
    })

    // Selecionar as cores de fundo mais prováveis
    const sortedBorderColors = Array.from(borderColorMap.entries())
      .map(([color, count]) => {
        const [r, g, b] = color.split(",").map(Number)
        return { r, g, b, count }
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 3) // Top 3 cores de borda

    // Adicionar tolerância baseada na variação de cor
    sortedBorderColors.forEach((color) => {
      backgroundColors.push({
        r: color.r,
        g: color.g,
        b: color.b,
        tolerance: Math.max(40, Math.min(80, color.count / 10)), // Tolerância adaptativa
      })
    })

    return backgroundColors
  }

  // Função auxiliar: Criar máscara de fundo usando flood fill
  const createBackgroundMask = (data, edges, width, height) => {
    const mask = new Uint8Array(width * height)
    const visited = new Uint8Array(width * height)

    // Começar flood fill das bordas
    const queue = []

    // Adicionar pixels das bordas à queue se não forem bordas detectadas
    for (let x = 0; x < width; x++) {
      // Borda superior
      if (edges[x] < 0.2) queue.push({ x, y: 0 })
      // Borda inferior
      if (edges[(height - 1) * width + x] < 0.2) queue.push({ x, y: height - 1 })
    }

    for (let y = 0; y < height; y++) {
      // Borda esquerda
      if (edges[y * width] < 0.2) queue.push({ x: 0, y })
      // Borda direita
      if (edges[y * width + width - 1] < 0.2) queue.push({ x: width - 1, y })
    }

    // Flood fill
    while (queue.length > 0) {
      const { x, y } = queue.shift()
      const idx = y * width + x

      if (visited[idx] || x < 0 || x >= width || y < 0 || y >= height) continue

      visited[idx] = 1
      mask[idx] = 1 // Marcar como fundo

      // Adicionar vizinhos se a diferença de cor for pequena e não for uma borda forte
      const currentPixel = {
        r: data[idx * 4],
        g: data[idx * 4 + 1],
        b: data[idx * 4 + 2],
      }

      const neighbors = [
        { x: x - 1, y },
        { x: x + 1, y },
        { x, y: y - 1 },
        { x, y: y + 1 },
      ]

      neighbors.forEach((neighbor) => {
        const nIdx = neighbor.y * width + neighbor.x
        if (neighbor.x >= 0 && neighbor.x < width && neighbor.y >= 0 && neighbor.y < height && !visited[nIdx]) {
          const neighborPixel = {
            r: data[nIdx * 4],
            g: data[nIdx * 4 + 1],
            b: data[nIdx * 4 + 2],
          }

          const colorDiff = Math.sqrt(
            Math.pow(currentPixel.r - neighborPixel.r, 2) +
              Math.pow(currentPixel.g - neighborPixel.g, 2) +
              Math.pow(currentPixel.b - neighborPixel.b, 2),
          )

          // Se a diferença de cor é pequena e não é uma borda forte
          if (colorDiff < 50 && edges[nIdx] < 0.3) {
            queue.push(neighbor)
          }
        }
      })
    }

    return mask
  }

  return null
}
