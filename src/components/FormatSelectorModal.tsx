import React from 'react'
import { X, Film, Music, Download, Info } from 'lucide-react'
import { VideoFormat } from '../types'
import { formatBytes } from '../utils'

interface FormatSelectorModalProps {
  isOpen: boolean
  onClose: () => void
  formats: VideoFormat[]
  onSelect: (formatId: string) => void
  isLoading: boolean
  url: string
}

const FormatSelectorModal: React.FC<FormatSelectorModalProps> = ({
  isOpen,
  onClose,
  formats,
  onSelect,
  isLoading,
  url
}) => {
  if (!isOpen) return null

  // Agrupamos por resoluciones comunes para simplificar
  const getQualityOptions = () => {
    const options = [
      { label: 'Mejor disponible (Automático)', id: 'bestvideo+bestaudio/best', icon: <Film size={18} />, note: 'Máxima calidad combinada' },
      { label: '4K / 2160p', height: 2160, icon: <Film size={18} className="text-magenta-500" /> },
      { label: '1080p Full HD', height: 1080, icon: <Film size={18} className="text-blue-500" /> },
      { label: '720p HD', height: 720, icon: <Film size={18} className="text-cyan-500" /> },
      { label: '480p SD', height: 480, icon: <Film size={18} className="text-gray-400" /> },
      { label: 'Solo Audio (MP3 320kbps)', id: 'audio-only', icon: <Music size={18} className="text-magenta-400" />, note: 'Extracción de audio de alta calidad' }
    ]

    return options.map(opt => {
      if (opt.id === 'audio-only' || opt.id === 'bestvideo+bestaudio/best') return opt

      // Buscamos si existe un formato para esta altura
      const found = formats.find(f => f.height === opt.height)
      if (!found && opt.height) return null // No disponible para este video

      // Para YouTube, si elegimos una resolución, yt-dlp necesita combinarla con audio
      // Usamos el formatId específico + bestaudio
      return {
        ...opt,
        id: found ? `${found.formatId}+bestaudio/best` : null,
        details: found ? `${found.fps}fps ${found.note ? `• ${found.note}` : ''}` : ''
      }
    }).filter(Boolean)
  }

  const qualityOptions = getQualityOptions()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-dark-800 w-full max-w-md rounded-xl border border-dark-600 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-dark-600 bg-dark-700/50">
          <div className="flex items-center gap-2">
            <Download size={20} className="text-magenta-500" />
            <h2 className="text-lg font-bold text-white">Seleccionar Calidad</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-dark-500 rounded-md transition-colors text-dark-300 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <div className="w-12 h-12 border-4 border-dark-600 border-t-magenta-500 rounded-full animate-spin"></div>
              <p className="text-dark-300 animate-pulse text-sm">Analizando formatos disponibles...</p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-dark-400 px-1 mb-3 truncate">URL: {url}</p>
              
              {qualityOptions.map((opt: any) => (
                <button
                  key={opt.id}
                  onClick={() => onSelect(opt.id)}
                  className="w-full flex items-center gap-4 p-3 rounded-lg border border-dark-600 bg-dark-700/30 hover:bg-dark-600/50 hover:border-magenta-500/50 transition-all text-left group"
                >
                  <div className="p-2 rounded-md bg-dark-800 border border-dark-600 group-hover:bg-dark-700">
                    {opt.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-white group-hover:text-magenta-400 transition-colors">
                      {opt.label}
                    </div>
                    {(opt.note || opt.details) && (
                      <div className="text-xs text-dark-400 truncate mt-0.5">
                        {opt.note || opt.details}
                      </div>
                    )}
                  </div>
                </button>
              ))}

              <div className="mt-6 flex gap-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <Info size={18} className="text-blue-400 shrink-0" />
                <p className="text-[11px] text-blue-200/80 leading-relaxed">
                  Las calidades 4K y 1080p pueden requerir que el sistema una los flujos de audio y video. 
                  Asegúrate de tener <strong>ffmpeg</strong> instalado para mejores resultados.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-dark-700/30 border-t border-dark-600 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-dark-200 hover:text-white transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}

export default FormatSelectorModal
