"use client"

import { useEffect, useRef } from "react"

export default function SafeBackgroundRemover({ imageUrl, imageFile, onProcessed }) {
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
      processImage(imageUrl)
    }
  }, [imageUrl])

  const processImage = async (imageUrl) => {
    try {
      // Usar o método canvas como processamento principal
      const result = await processWithCanvas(imageUrl, 30)
      onProcessed(result.url, result.blob, null)
    } catch (error) {
      console.error("Erro ao processar imagem:", error)
      onProcessed(null, null, error)
    }
  }

  const processWithCanvas = async (imageUrl, tolerance = 30) => {
    return new Promise((resolve, reject) => {
      try {
        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d")

        const img = new Image()
        img.crossOrigin = "anonymous"

        img.onload = () => {
          // Redimensionar o canvas para o tamanho da imagem
          canvas.width = img.width
          canvas.height = img.height

          // Desenhar a imagem original
          ctx.drawImage(img, 0, 0)

          // Obter os dados de pixels da imagem
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
          const data = imageData.data

          // Detectar a cor de fundo usando os cantos da imagem
          const corners = [
            { x: 0, y: 0 }, // Canto superior esquerdo
            { x: canvas.width - 1, y: 0 }, // Canto superior direito
            { x: 0, y: canvas.height - 1 }, // Canto inferior esquerdo
            { x: canvas.width - 1, y: canvas.height - 1 }, // Canto inferior direito
          ]

          // Coletar amostras de cor dos cantos
          const backgroundSamples = corners.map((corner) => {
            const index = (corner.y * canvas.width + corner.x) * 4
            return {
              r: data[index],
              g: data[index + 1],
              b: data[index + 2],
            }
          })

          // Calcular a cor média do fundo
          const avgBackground = {
            r: backgroundSamples.reduce((sum, sample) => sum + sample.r, 0) / backgroundSamples.length,
            g: backgroundSamples.reduce((sum, sample) => sum + sample.g, 0) / backgroundSamples.length,
            b: backgroundSamples.reduce((sum, sample) => sum + sample.b, 0) / backgroundSamples.length,
          }

          // Percorrer todos os pixels
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i]
            const g = data[i + 1]
            const b = data[i + 2]

            // Calcular a diferença de cor usando distância euclidiana
            const colorDiff = Math.sqrt(
              Math.pow(r - avgBackground.r, 2) + Math.pow(g - avgBackground.g, 2) + Math.pow(b - avgBackground.b, 2),
            )

            // Se a diferença for menor que a tolerância, tornar o pixel transparente
            if (colorDiff < tolerance) {
              data[i + 3] = 0 // Canal alfa (transparência)
            }
          }

          // Atualizar o canvas com os novos dados
          ctx.putImageData(imageData, 0, 0)

          // Converter para blob e resolver a promessa
          canvas.toBlob((blob) => {
            const processedUrl = URL.createObjectURL(blob)
            resolve({ url: processedUrl, blob })
          }, "image/png")
        }

        img.onerror = (err) => {
          console.error("Erro ao carregar imagem:", err)
          reject(new Error("Erro ao carregar a imagem original"))
        }

        img.src = imageUrl
      } catch (err) {
        console.error("Erro ao processar imagem com canvas:", err)
        reject(err)
      }
    })
  }

  // Este componente não renderiza nada visível
  return null
}
