import React, { useState } from 'react'
import { DownloadItem } from '../types'
import {
  FileText, Info, HardDrive, Clock, ExternalLink,
  Trash2, XCircle, Play, Pause, ChevronUp, ChevronDown, Share2
} from 'lucide-react'
import { formatDuration, getStatusColor } from '../utils'

interface DetailsProps {
  item: DownloadItem
  onCancel: (id: string) => void
  onRemove: (id: string) => void
  onOpenFolder: (item: DownloadItem) => void
}

export default function DownloadDetails({ item, onCancel, onRemove, onOpenFolder }: DetailsProps) {
  const [activeTab, setActiveTab] = useState<'general' | 'logs' | 'peers'>('general')
  const canCancel = item.status === 'downloading' || item.status === 'queued'
  const isError = item.status === 'error'
  const logContainerRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (activeTab === 'logs' && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight
    }
  }, [item.logs, activeTab])

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: 'var(--bg-surface)', borderTop: '1px solid var(--border)' }}>
      {/* Tabs Header */}
      <div className="flex items-center px-4 bg-black/20" style={{ height: 32, flexShrink: 0 }}>
        <div
          className={`tab flex items-center gap-2 ${activeTab === 'general' ? 'active' : ''}`}
          onClick={() => setActiveTab('general')}
        >
          <Info size={12} />
          General
        </div>
        <div
          className={`tab flex items-center gap-2 ${activeTab === 'logs' ? 'active' : ''}`}
          onClick={() => setActiveTab('logs')}
        >
          <FileText size={12} />
          Reg. ({item.logs.length})
        </div>

        {item.isTorrent && (
          <div
            className={`tab flex items-center gap-2 ${activeTab === 'peers' ? 'active' : ''}`}
            onClick={() => setActiveTab('peers' as any)}
          >
            <Share2 size={12} />
            Pares ({item.peers || 0})
          </div>
        )}

        <div className="flex-1" />

        {/* Action Buttons */}
        <div className="flex items-center gap-2 py-1">
          {canCancel ? (
            <button
              className="btn btn-secondary"
              style={{ padding: '2px 8px', fontSize: 11, height: 24 }}
              onClick={() => onCancel(item.id)}
            >
              <XCircle size={12} className="text-red-500" />
              Cancelar
            </button>
          ) : (
            <button
              className="btn btn-secondary"
              style={{ padding: '2px 8px', fontSize: 11, height: 24 }}
              onClick={() => onRemove(item.id)}
            >
              <Trash2 size={12} />
              Eliminar
            </button>
          )}

          <button
            className="btn btn-primary"
            style={{ padding: '2px 8px', fontSize: 11, height: 24 }}
            onClick={() => onOpenFolder(item)}
          >
            <ExternalLink size={12} />
            Abrir carpeta
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden p-4">
        {activeTab === 'general' ? (
          <div className="grid grid-cols-12 gap-6 h-full overflow-y-auto pr-2 custom-scrollbar">
            {/* Thumbnail Column */}
            <div className="col-span-3 flex flex-col gap-3">
              <div
                className="aspect-video bg-black/40 rounded-lg flex items-center justify-center overflow-hidden border border-white/5"
                style={{ position: 'relative' }}
              >
                {item.thumbnail ? (
                  <img src={item.thumbnail} className="object-cover w-full h-full" alt="Preview" />
                ) : (
                  <Info size={32} className="text-white/10" />
                )}
                <div
                  className="absolute bottom-2 right-2 bg-black/80 px-2 py-0.5 rounded text-[10px] text-white"
                >
                  {item.duration ? formatDuration(item.duration) : '--:--'}
                </div>
              </div>
              <div className="text-[11px] text-muted space-y-1">
                {!item.isTorrent && <p><span className="text-white/40">Extractor:</span> {item.extractor || 'yt-dlp'}</p>}
                {item.isTorrent && <p><span className="text-white/40">Tipo:</span> Cliente WebTorrent</p>}
                <p><span className="text-white/40">Añadido:</span> {new Date(item.addedAt).toLocaleString()}</p>
              </div>
            </div>

            {/* Info Column */}
            <div className="col-span-9 space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-white leading-tight mb-1">{item.title}</h3>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-fuchsia-400 hover:underline text-[12px] flex items-center gap-1"
                >
                  {item.url} <ExternalLink size={10} />
                </a>
              </div>

              {/* Huge progress bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-medium">
                  <span style={{ color: getStatusColor(item.status) }}>
                    {item.status === 'downloading' ? `Descargando a ${item.speed || '...'}` : 'Estado: ' + item.status}
                  </span>
                  <span className="text-white">{(item.progress || 0).toFixed(1)}%</span>
                </div>
                <div className="h-4 bg-black/40 rounded-sm overflow-hidden border border-white/5">
                  <div
                    className="progress-bar-fill h-full transition-all duration-300"
                    style={{
                      width: `${item.progress || 0}%`,
                      background: item.status === 'completed' ? 'var(--green)' : 'linear-gradient(90deg, #c026d3, #e879f9)'
                    }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>{item.totalSize || (item.status === 'downloading' ? 'Cargando...' : item.status === 'queued' ? 'Esperando...' : 'Analizando...')}</span>
                  <span>{item.status === 'downloading' ? `ETA: ${item.eta || '--:--'}` : ''}</span>
                </div>
              </div>

              {/* Data Grid */}
              <div className="grid grid-cols-2 gap-y-1 gap-x-8 pt-2">
                <div className="detail-row">
                  <span className="detail-label">Destino:</span>
                  <span className="detail-value truncate" title={item.outputDir}>{item.outputDir}</span>
                </div>
                {!item.isTorrent && (
                  <div className="detail-row">
                    <span className="detail-label">Usuario/Canal:</span>
                    <span className="detail-value">{item.uploader || 'N/A'}</span>
                  </div>
                )}
                {item.isTorrent && (
                  <div className="detail-row">
                    <span className="detail-label">InfoHash:</span>
                    <span className="detail-value font-mono opacity-80">{item.infoHash || 'Calculando...'}</span>
                  </div>
                )}
                <div className="detail-row">
                  <span className="detail-label">Formato:</span>
                  <span className="detail-value">{item.isTorrent ? 'P2P / Torrent' : item.audioOnly ? 'MP3 (Audio)' : 'MP4 (Video)'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Archivo:</span>
                  <span className="detail-value truncate" title={item.filename}>{item.filename || 'Pendiente...'}</span>
                </div>
              </div>

              {isError && (
                <div className="bg-red-950/30 border border-red-500/20 p-3 rounded text-red-300 text-[11px] flex flex-col gap-1">
                  <strong>⚠️ Error en la descarga:</strong>
                  <p className="opacity-90">{item.error || 'Ocurrió un error desconocido. Revisa los logs para más detalles.'}</p>
                </div>
              )}
            </div>
          </div>
        ) : activeTab === 'peers' ? (
          <div className="h-full bg-black/30 rounded border border-white/5 font-mono text-[11px] p-4 overflow-y-auto">
            <h3 className="text-fuchsia-400 mb-2 font-bold mb-4">Conectado a {item.peers || 0} pares</h3>
            <div className="text-white/60">
              {item.peers && item.peers > 0 
                ? 'El motor P2P está sincronizando los fragmentos de archivo con la red BitTorrent. (Vista detallada de pares en desarrollo)'
                : 'Buscando pares en los trackers...'}
            </div>
          </div>
        ) : (
          <div 
            ref={logContainerRef}
            className="h-full bg-black/30 rounded border border-white/5 font-mono text-[11px] p-2 overflow-y-auto overflow-x-hidden selection:bg-fuchsia-900 custom-scrollbar"
          >
            {item.logs.map((log, i) => (
              <div key={i} className="py-0.5 border-b border-white/5 last:border-0 opacity-80 hover:opacity-100 flex gap-2">
                <span className="text-fuchsia-600/50 flex-shrink-0 w-8">{i + 1}</span>
                <span className="break-all">{log}</span>
              </div>
            ))}
            {item.logs.length === 0 && <div className="text-white/20 italic">No hay registros disponibles aún...</div>}
          </div>
        )}
      </div>
    </div>
  )
}
