"use client"

import { useState, useEffect } from "react"
import { Slider } from "@/components/ui/slider"

interface BackgroundRemovalControlsProps {
  onToleranceChange: (tolerance: number) => void
  defaultTolerance?: number
}

export default function BackgroundRemovalControls({
  onToleranceChange,
  defaultTolerance = 30,
}: BackgroundRemovalControlsProps) {
  const [tolerance, setTolerance] = useState(defaultTolerance)

  useEffect(() => {
    setTolerance(defaultTolerance)
  }, [defaultTolerance])

  const handleToleranceChange = (value: number[]) => {
    const newTolerance = value[0]
    setTolerance(newTolerance)
    onToleranceChange(newTolerance)
  }

  const getSensitivityLabel = (value: number) => {
    if (value <= 20) return "Baixa"
    if (value <= 40) return "Média"
    if (value <= 60) return "Alta"
    return "Muito Alta"
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-gray-700">Sensibilidade de Remoção</label>
        <span className="text-sm text-blue-600 font-medium">{getSensitivityLabel(tolerance)}</span>
      </div>

      <div className="space-y-2">
        <Slider
          value={[tolerance]}
          onValueChange={handleToleranceChange}
          max={100}
          min={1}
          step={1}
          className="w-full"
        />

        <div className="flex justify-between text-xs text-gray-500">
          <span>Menos sensível</span>
          <span className="font-medium">{tolerance}</span>
          <span>Mais sensível</span>
        </div>
      </div>

      <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
        <strong>Dica:</strong> Valores baixos removem menos fundo (mais conservador). Valores altos removem mais fundo
        (mais agressivo).
      </div>
    </div>
  )
}
