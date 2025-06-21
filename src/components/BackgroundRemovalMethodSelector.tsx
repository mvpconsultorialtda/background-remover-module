"use client"

import { useState } from "react"
import { ChevronDown, Zap, Palette, Layers } from "lucide-react"

export default function BackgroundRemovalMethodSelector({ onMethodChange, currentMethod = "canvas" }) {
  const [isOpen, setIsOpen] = useState(false)

  const methods = [
    {
      id: "canvas",
      name: "Método Padrão",
      description: "Remoção baseada em cor dos cantos",
      icon: Palette,
      bestFor: "Fundos uniformes",
    },
    {
      id: "edge",
      name: "Detecção de Bordas",
      description: "Usa detecção de bordas + flood fill",
      icon: Zap,
      bestFor: "Imagens com contornos definidos",
    },
    {
      id: "color",
      name: "Segmentação por Cor",
      description: "Análise avançada de clusters de cor",
      icon: Palette,
      bestFor: "Fundos com múltiplas cores",
    },
    {
      id: "hybrid",
      name: "Método Híbrido",
      description: "Combina detecção de bordas e cor",
      icon: Layers,
      bestFor: "Imagens complexas e baixa resolução",
    },
  ]

  const currentMethodData = methods.find((m) => m.id === currentMethod) || methods[0]

  const handleMethodSelect = (methodId) => {
    onMethodChange(methodId)
    setIsOpen(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center">
          <currentMethodData.icon className="w-5 h-5 text-blue-600 mr-3" />
          <div className="text-left">
            <div className="font-medium text-gray-900">{currentMethodData.name}</div>
            <div className="text-sm text-gray-500">{currentMethodData.bestFor}</div>
          </div>
        </div>
        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10">
          {methods.map((method) => (
            <button
              key={method.id}
              onClick={() => handleMethodSelect(method.id)}
              className={`w-full flex items-center p-3 hover:bg-gray-50 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                method.id === currentMethod ? "bg-blue-50 border-l-4 border-l-blue-500" : ""
              }`}
            >
              <method.icon
                className={`w-5 h-5 mr-3 ${method.id === currentMethod ? "text-blue-600" : "text-gray-400"}`}
              />
              <div className="text-left flex-1">
                <div className={`font-medium ${method.id === currentMethod ? "text-blue-900" : "text-gray-900"}`}>
                  {method.name}
                </div>
                <div className="text-sm text-gray-500">{method.description}</div>
                <div className="text-xs text-gray-400 mt-1">Melhor para: {method.bestFor}</div>
              </div>
              {method.id === currentMethod && <div className="w-2 h-2 bg-blue-500 rounded-full"></div>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
