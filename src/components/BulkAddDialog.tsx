import React, { useState } from 'react'
import { X, ListPlus, Send, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react'
import { AppSettings } from '../types'
import { isProUser, isValidUrl, cleanUrl } from '../utils'

interface BulkAddDialogProps {
  isOpen: boolean
  onClose: () => void
  settings: AppSettings
  onAddBulk: (urls: string[]) => void
}

export default function BulkAddDialog({ isOpen, onClose, settings, onAddBulk }: BulkAddDialogProps) {
  const [input, setInput] = useState('')
  const [processedLinks, setProcessedLinks] = useState<string[]>([])
  const isPro = isProUser(settings)
  const limit = 10

  const handleProcess = (text: string) => {
    setInput(text)
    const lines = text.split('\n')
      .map(line => cleanUrl(line))
      .filter(line => isValidUrl(line) || line.startsWith('magnet:'))
    setProcessedLinks(lines)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (processedLinks.length === 0) return
    
    // Enforcement
    if (!isPro && processedLinks.length > limit) {
      // Logic handled by the modal UI state
      return
    }

    onAddBulk(processedLinks)
    onClose()
    setInput('')
    setProcessedLinks([])
  }

  if (!isOpen) return null

  const isOverLimit = !isPro && processedLinks.length > limit

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="bg-[#121212] border border-white/10 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-fuchsia-950/20 to-transparent">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-fuchsia-600/20 rounded-lg">
              <ListPlus size={20} className="text-fuchsia-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white leading-none">Importación Masiva</h2>
              <p className="text-[10px] text-white/40 uppercase tracking-widest mt-1 font-semibold">Pro Feature Suite</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors text-white/30 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex-1 flex flex-col gap-6 overflow-y-auto">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-white/50 flex justify-between">
              <span>LISTA DE ENLACES (UNO POR LÍNEA)</span>
              <span className={isOverLimit ? 'text-red-400' : 'text-fuchsia-400'}>
                {processedLinks.length} {isPro ? '' : `/ ${limit}`} detectados
              </span>
            </label>
            <textarea
              autoFocus
              value={input}
              onChange={(e) => handleProcess(e.target.value)}
              placeholder="https://youtube.com/watch?v=...&#10;https://vimeo.com/...&#10;magnet:?xt=..."
              className="w-full h-48 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-fuchsia-500/50 focus:ring-1 focus:ring-fuchsia-500/30 transition-all font-mono placeholder:text-white/10 resize-none"
            />
          </div>

          {!isPro && (
            <div className={`p-4 rounded-xl border transition-all duration-500 ${isOverLimit ? 'bg-red-500/10 border-red-500/20' : 'bg-fuchsia-500/5 border-fuchsia-500/10'}`}>
              <div className="flex gap-4">
                <div className={`mt-1 ${isOverLimit ? 'text-red-400' : 'text-fuchsia-400'}`}>
                  {isOverLimit ? <AlertCircle size={20} /> : <Sparkles size={20} />}
                </div>
                <div className="flex-1">
                  <h4 className={`text-sm font-bold ${isOverLimit ? 'text-red-400' : 'text-white'}`}>
                    {isOverLimit ? 'Límite Gratuito Excedido' : 'Modo Gratuito'}
                  </h4>
                  <p className="text-xs text-white/50 mt-1 leading-relaxed">
                    {isOverLimit 
                      ? `Has ingresado ${processedLinks.length} enlaces. La versión gratuita está limitada a ${limit} por tanda.` 
                      : `Puedes añadir hasta ${limit} enlaces simultáneamente. Actualiza a Pro para carga ilimitada.`}
                  </p>
                  {isOverLimit && (
                    <button 
                      type="button"
                      onClick={() => window.open('https://universal-downloader.lemonsqueezy.com/checkout/buy/948c454e-0a9d-4f16-b43d-5b932cd523c0', '_blank')}
                      className="mt-3 bg-fuchsia-600 hover:bg-fuchsia-500 text-white text-[11px] font-bold py-1.5 px-4 rounded-lg transition-all flex items-center gap-2"
                    >
                      <Sparkles size={12} />
                      DESBLOQUEAR PRO POR $5
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {processedLinks.length > 0 && !isOverLimit && (
            <div className="bg-white/5 rounded-xl border border-white/5 p-4 animate-in slide-in-from-bottom-2 duration-300">
              <h5 className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-3">Vista previa de carga</h5>
              <div className="space-y-2 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                {processedLinks.map((link, i) => (
                  <div key={i} className="flex items-center gap-3 text-xs text-white/60 bg-black/20 p-2 rounded-lg border border-white/5">
                    <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
                    <span className="truncate">{link}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-black/40 border-t border-white/5 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-semibold text-white/40 hover:text-white transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={processedLinks.length === 0 || isOverLimit}
            className="bg-fuchsia-600 hover:bg-fuchsia-500 disabled:opacity-30 disabled:grayscale text-white px-8 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 shadow-lg shadow-fuchsia-900/20 active:scale-95"
          >
            <Send size={16} />
            Añadir {processedLinks.length} Descargas
          </button>
        </div>
      </div>
    </div>
  )
}
