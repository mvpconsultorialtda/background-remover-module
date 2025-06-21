"use client"
import { Paintbrush, Eraser } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"

interface ManualEditToolsProps {
  onToolChange: (tool: "brush" | "eraser") => void
  onBrushSizeChange: (size: number) => void
  brushSize: number
  tool: "brush" | "eraser"
}

export default function ManualEditTools({ onToolChange, onBrushSizeChange, brushSize, tool }: ManualEditToolsProps) {
  const handleBrushSizeChange = (value: number[]) => {
    onBrushSizeChange(value[0])
  }

  return (
    <div className="flex flex-col space-y-3 p-3 bg-gray-50 rounded-lg border">
      {/* Seleção de ferramenta */}
      <div className="flex space-x-2">
        <Button
          variant={tool === "brush" ? "default" : "outline"}
          size="sm"
          onClick={() => onToolChange("brush")}
          className="flex items-center space-x-1"
        >
          <Paintbrush size={16} />
          <span className="hidden sm:inline">Pincel</span>
        </Button>

        <Button
          variant={tool === "eraser" ? "default" : "outline"}
          size="sm"
          onClick={() => onToolChange("eraser")}
          className="flex items-center space-x-1"
        >
          <Eraser size={16} />
          <span className="hidden sm:inline">Borracha</span>
        </Button>
      </div>

      {/* Controle de tamanho */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="text-xs font-medium text-gray-700">Tamanho</label>
          <span className="text-xs text-gray-600">{brushSize}px</span>
        </div>

        <Slider
          value={[brushSize]}
          onValueChange={handleBrushSizeChange}
          max={100}
          min={5}
          step={5}
          className="w-full"
        />
      </div>

      {/* Instruções */}
      <div className="text-xs text-gray-600">
        {tool === "brush" ? (
          <span>
            <strong>Pincel:</strong> Restaura partes da imagem original
          </span>
        ) : (
          <span>
            <strong>Borracha:</strong> Cria transparência
          </span>
        )}
      </div>
    </div>
  )
}
