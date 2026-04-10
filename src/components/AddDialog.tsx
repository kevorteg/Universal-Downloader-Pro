import React, { useState, useEffect } from 'react'
import { X, FolderOpen, Download, Music, Film, Share2, Sparkles } from 'lucide-react'
import { VideoFormat, AppSettings } from '../types'

interface AddDialogProps {
  isOpen: boolean
  onClose: () => void
  initialUrl?: string
  settings: AppSettings
  onAdd: (url: string, type: 'video' | 'audio' | 'torrent', formatId?: string, customDir?: string) => void
  onExpand: (url: string) => void
  onGetFormats: (url: string) => Promise<{ success: boolean; formats?: VideoFormat[]; error?: string }>
}

export default function AddDialog({ 
  isOpen, 
  onClose, 
  initialUrl = '', 
  settings, 
  onAdd, 
  onExpand,
  onGetFormats 
}: AddDialogProps) {
  const [url, setUrl] = useState(initialUrl)
  const [type, setType] = useState<'video' | 'audio' | 'torrent'>('video')
  const [formatId, setFormatId] = useState<string>('best')
  const [customDir, setCustomDir] = useState<string>(settings.outputDir)
  const [formats, setFormats] = useState<VideoFormat[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  useEffect(() => {
    setUrl(initialUrl)
    setCustomDir(settings.outputDir)
    
    // Auto-detect torrent
    if (initialUrl.startsWith('magnet:') || initialUrl.endsWith('.torrent')) {
      setType('torrent')
    } else {
      setType('video')
      if (initialUrl) handleAnalyze(initialUrl)
    }
  }, [initialUrl, isOpen])

  const handleAnalyze = async (analyzeUrl: string) => {
    if (!analyzeUrl || analyzeUrl.startsWith('magnet:') || analyzeUrl.endsWith('.torrent')) return
    setIsAnalyzing(true)
    const res = await onGetFormats(analyzeUrl)
    if (res.success && res.formats) {
      setFormats(res.formats)
      setFormatId(res.formats.find(f => f.formatId === settings.preferredQuality)?.formatId || 'best')
    }
    setIsAnalyzing(false)
  }

  const handleBrowse = async () => {
    if (window.electronAPI) {
      const dir = await window.electronAPI.openFolderDialog()
      if (dir) setCustomDir(dir)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!url) return
    onAdd(url, type, formatId, customDir)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[#1e1e1e] border border-white/10 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/10 flex justify-between items-center bg-black/20">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Download size={18} className="text-fuchsia-500" />
            Nueva Descarga
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-md transition-colors text-white/60 hover:text-white">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* URL Input */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-white/50 uppercase tracking-wider">
              Enlace / Magnet / .torrent
            </label>
            <input
              type="text"
              autoFocus
              value={url}
              onChange={(e) => {
                setUrl(e.target.value)
                if (e.target.value.startsWith('magnet:') || e.target.value.endsWith('.torrent')) {
                  setType('torrent')
                }
              }}
              onBlur={() => {
                if (type === 'video' && url && url !== initialUrl) handleAnalyze(url)
              }}
              className="w-full bg-black/40 border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-fuchsia-500/50 focus:ring-1 focus:ring-fuchsia-500/50 transition-all font-mono placeholder:text-white/20 placeholder:font-sans"
              placeholder="https://..."
            />
            {url && url.includes('list=') && (
              <div className="mt-2 p-3 bg-fuchsia-600/10 border border-fuchsia-500/20 rounded-lg flex items-center justify-between animate-in slide-in-from-top-1">
                <div className="flex items-center gap-2">
                  <Sparkles size={14} className="text-fuchsia-400" />
                  <span className="text-[10px] font-bold text-white/70">LISTA DE REPRODUCCIÓN</span>
                </div>
                <button
                  type="button"
                  onClick={() => onExpand?.(url)}
                  className="bg-fuchsia-600 hover:bg-fuchsia-500 text-white text-[9px] font-bold px-3 py-1 rounded transition-all"
                >
                  EXPANDIR PRO
                </button>
              </div>
            )}
          </div>

          {/* Type Selection */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-white/50 uppercase tracking-wider">
              Tipo de Descarga
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setType('video')}
                className={`py-3 px-2 flex flex-col items-center justify-center gap-2 rounded-md border transition-all ${
                  type === 'video' 
                    ? 'bg-fuchsia-500/20 border-fuchsia-500 text-fuchsia-300' 
                    : 'bg-black/20 border-white/5 text-white/50 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Film size={20} />
                <span className="text-[11px] font-medium">Video (YT/Web)</span>
              </button>
              <button
                type="button"
                onClick={() => setType('audio')}
                className={`py-3 px-2 flex flex-col items-center justify-center gap-2 rounded-md border transition-all ${
                  type === 'audio' 
                    ? 'bg-fuchsia-500/20 border-fuchsia-500 text-fuchsia-300' 
                    : 'bg-black/20 border-white/5 text-white/50 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Music size={20} />
                <span className="text-[11px] font-medium">Solo Audio</span>
              </button>
              <button
                type="button"
                onClick={() => setType('torrent')}
                className={`py-3 px-2 flex flex-col items-center justify-center gap-2 rounded-md border transition-all ${
                  type === 'torrent' 
                    ? 'bg-fuchsia-500/20 border-fuchsia-500 text-fuchsia-300' 
                    : 'bg-black/20 border-white/5 text-white/50 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Share2 size={20} />
                <span className="text-[11px] font-medium">Torrent / P2P</span>
              </button>
            </div>
          </div>

          {/* Video Formats */}
          {type === 'video' && (
            <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-200">
              <label className="text-[11px] font-semibold text-white/50 uppercase tracking-wider flex justify-between">
                <span>Calidad</span>
                {isAnalyzing && <span className="text-fuchsia-400 normal-case font-normal animate-pulse flex items-center gap-1">Analizando...</span>}
              </label>
              <select
                value={formatId}
                onChange={(e) => setFormatId(e.target.value)}
                disabled={isAnalyzing || formats.length === 0}
                className="w-full bg-black/40 border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-fuchsia-500 disabled:opacity-50"
              >
                {formats.length === 0 && <option value="best">Automático (Mejor Calidad)</option>}
                {formats.map((f, i) => {
                  const label = f.resolution === 'Lo mejor disponible' 
                    ? f.resolution 
                    : (f.height ? `${f.height}p` : 'Audio');
                  
                  return (
                    <option key={i} value={f.formatId}>
                      {label} - {f.extension} {f.vcodec && f.vcodec !== 'none' ? `[${f.vcodec}]` : ''} {f.filesize ? `(~${(f.filesize / 1024 / 1024).toFixed(1)}MB)` : ''}
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          {/* Output Directory */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-white/50 uppercase tracking-wider">
              Carpeta Destino
            </label>
            <div className="flex gap-2">
              <div className="flex-1 bg-black/40 border border-white/10 rounded-md px-3 py-2 flex items-center overflow-hidden">
                <span className="text-xs text-white/80 truncate font-mono" title={customDir || 'Carpeta por defecto'}>
                  {customDir || 'Carpeta Descargas por Defecto'}
                </span>
              </div>
              <button
                type="button"
                onClick={handleBrowse}
                className="btn btn-secondary flex items-center px-3 h-10"
                title="Examinar"
              >
                <FolderOpen size={16} />
              </button>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-white/10 bg-black/20 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-md hover:bg-white/5 text-sm font-medium transition-colors text-white/70 hover:text-white"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={!url || isAnalyzing}
            className="px-6 py-2 bg-fuchsia-600 hover:bg-fuchsia-500 text-white rounded-md text-sm font-semibold shadow-[0_0_15px_rgba(232,121,249,0.3)] transition-all flex items-center gap-2 disabled:opacity-50 disabled:shadow-none"
          >
            Añadir a la lista
          </button>
        </div>
      </div>
    </div>
  )
}
