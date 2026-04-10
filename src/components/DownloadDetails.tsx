import React, { useState } from 'react'
import { DownloadItem } from '../types'
import {
  FileText, Info, HardDrive, Clock, ExternalLink,
  Trash2, XCircle, Play, Pause, ChevronUp, ChevronDown, Share2, AlertTriangle
} from 'lucide-react'
import { formatDuration, getStatusColor, getStatusLabel, cleanTorrentName, formatBytes, formatSpeed } from '../utils'

interface DetailsProps {
  item: DownloadItem
  onCancel: (id: string) => void
  onRemove: (id: string, deleteFiles?: boolean) => void // Updated to support physical deletion
  onOpenFolder: (item: DownloadItem) => void
  onPause: (id: string) => void
  onResume: (id: string) => void
}

export default function DownloadDetails({ 
  item, 
  onCancel, 
  onRemove, 
  onOpenFolder,
  onPause,
  onResume
}: DetailsProps) {
  const [activeTab, setActiveTab] = useState<'general' | 'logs' | 'peers'>('general')
  const isDownloading = item.status === 'downloading'
  const isPaused = item.status === 'paused'
  const isError = item.status === 'error'
  const logContainerRef = React.useRef<HTMLDivElement>(null)

  const cleanedTitle = cleanTorrentName(item.title || item.filename || 'Torrent')

  React.useEffect(() => {
    if (activeTab === 'logs' && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight
    }
  }, [item.logs, activeTab])

  const handleCopyMagnet = () => {
    if (item.url.startsWith('magnet:')) {
      navigator.clipboard.writeText(item.url)
    }
  }

  const handleDelete = () => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este torrent Y TODOS sus archivos del disco?')) {
      onRemove(item.id, true)
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: 'var(--bg-surface)', borderTop: '1px solid var(--border)' }}>
      {/* Tabs Header */}
      <div className="flex items-center px-4 bg-black/20" style={{ height: 36, flexShrink: 0, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="flex gap-1 h-full items-end mr-6">
          <div
            className={`tab-item ${activeTab === 'general' ? 'active' : ''}`}
            onClick={() => setActiveTab('general')}
          >
            General
          </div>
          <div
            className={`tab-item ${activeTab === 'logs' ? 'active' : ''}`}
            onClick={() => setActiveTab('logs')}
          >
            Registro ({item.logs.length})
          </div>
          {item.isTorrent && (
            <div
              className={`tab-item ${activeTab === 'peers' ? 'active' : ''}`}
              onClick={() => setActiveTab('peers')}
            >
              Pares ({item.peers || 0})
            </div>
          )}
        </div>

        <div className="flex-1" />

        {/* Action Buttons Toolbar */}
        <div className="flex items-center gap-1.5 py-1">
          {item.isTorrent && (
            <>
              {isPaused ? (
                <button className="toolbar-btn text-green-400" onClick={() => onResume(item.id)} title="Reanudar">
                  <Play size={14} fill="currentColor" />
                </button>
              ) : (
                <button 
                  className="toolbar-btn text-blue-400" 
                  onClick={() => onPause(item.id)} 
                  title="Pausar"
                  disabled={!isDownloading && item.status !== 'queued'}
                >
                  <Pause size={14} fill="currentColor" />
                </button>
              )}
            </>
          )}

          <button className="toolbar-btn text-orange-400" onClick={() => onCancel(item.id)} title="Detener">
            <XCircle size={14} />
          </button>

          <button className="toolbar-btn text-red-500 hover:bg-red-500/20" onClick={handleDelete} title="Eliminar del disco">
            <Trash2 size={14} />
          </button>

          <div className="w-px h-4 bg-white/10 mx-1" />

          <button className="toolbar-btn text-white/80" onClick={() => onOpenFolder(item)} title="Abrir Carpeta">
            <ExternalLink size={14} />
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'general' ? (
          <div className="flex flex-col h-full p-4 gap-4 overflow-y-auto custom-scrollbar">
            {/* Title Section */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-white truncate mb-1" title={cleanedTitle}>
                  {cleanedTitle}
                </h2>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-[11px] text-fuchsia-400/80 font-medium bg-fuchsia-500/5 px-2 py-0.5 rounded border border-fuchsia-500/10">
                    <Share2 size={10} />
                    {item.isTorrent ? 'P2P / WebTorrent' : 'Direct Download'}
                  </div>
                  {item.url.startsWith('magnet:') && (
                    <button 
                      onClick={handleCopyMagnet}
                      className="text-[10px] text-white/40 hover:text-white flex items-center gap-1 transition-colors"
                    >
                      <Share2 size={10} />
                      Copiar Magnet
                    </button>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-[10px] text-white/30 uppercase tracking-widest font-bold">Estado</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ background: getStatusColor(item.status) + '20', color: getStatusColor(item.status) }}>
                  {getStatusLabel(item.status).toUpperCase()}
                </span>
              </div>
            </div>

            {/* Progress Section */}
            <div className="space-y-1.5 bg-black/20 p-3 rounded-lg border border-white/5">
              <div className="flex justify-between items-end mb-1">
                <div className="text-[10px] text-white/50 font-bold uppercase tracking-tighter">Progreso de transferencia</div>
                <div className="text-lg font-black text-fuchsia-400">{(item.progress || 0).toFixed(1)}%</div>
              </div>
              <div className="h-4 bg-black/40 rounded-sm overflow-hidden border border-white/5 p-0.5">
                <div
                  className="progress-bar-fill h-full rounded-sm"
                  style={{
                    width: `${item.progress || 0}%`,
                    background: item.status === 'completed' ? '#22c55e' : 'linear-gradient(270deg, #c026d3, #701a75)'
                  }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-white/40 font-medium">
                <span>Descargado: {item.isTorrent ? formatBytes(item.totalDownloaded || 0) : '—'}</span>
                <span>Restante: {item.eta || '--:--'}</span>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-4 gap-3">
              <StatBox label="Bajada" value={isDownloading ? (item.speed || '0 B/s') : '0 B/s'} color="#c026d3" />
              <StatBox label="Subida" value={isDownloading && item.isTorrent ? formatSpeed(item.uploadSpeed) : '0 B/s'} color="#a21caf" />
              <StatBox label="Semillas" value={item.isTorrent ? `${item.seeds || 0}` : '—'} />
              <StatBox label="Pares" value={item.isTorrent ? `${item.peers || 0}` : '—'} />
              <StatBox label="Ratio" value={item.isTorrent ? (item.ratio || 0).toFixed(2) : '—'} />
              <StatBox label="Tamaño" value={item.totalSize || '—'} />
              <StatBox label="Hash" value={item.infoHash ? item.infoHash.substring(0, 12) + '...' : '—'} truncate />
              <StatBox label="Añadido" value={new Date(item.addedAt).toLocaleDateString()} />
            </div>

            {/* Path Section */}
            <div className="mt-auto pt-2 border-t border-white/5 flex items-center gap-2 text-[11px] text-white/30">
              <HardDrive size={10} />
              <span className="truncate">Ruta: {item.outputDir}</span>
            </div>
            
            {isError && (
              <div className="bg-red-500/10 border border-red-500/20 p-3 rounded flex gap-3 text-red-200 text-xs items-start">
                <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
                <div className="flex flex-col gap-1">
                  <span className="font-bold">Error detectado</span>
                  <p className="opacity-80">{item.error || 'Contacta al soporte o revisa los logs.'}</p>
                </div>
              </div>
            )}
          </div>
        ) : activeTab === 'peers' ? (
          <div className="h-full bg-black/30 p-4 overflow-y-auto font-mono text-[11px]">
             <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                  <span className="text-fuchsia-400 font-bold">Transferencia P2P Detallada</span>
                  <span className="text-white/40">{item.peers || 0} pares activos</span>
                </div>
                <div className="space-y-2 opacity-70">
                  <p>• El cliente WebTorrent está gestionando fragmentos de 16KB.</p>
                  <p>• Priorizando fragmentos aleatorios para optimizar disponibilidad.</p>
                  <p>• {item.seeds || 0} semillas proporcionando el archivo completo.</p>
                </div>
                <div className="mt-4 p-3 bg-fuchsia-500/5 rounded border border-fuchsia-500/10 italic text-[10px] text-fuchsia-300/60">
                   En la red BitTorrent, el "envenenamiento" de pares es raro. Este motor filtra IPs maliciosas automáticamente.
                </div>
             </div>
          </div>
        ) : (
          <div 
            ref={logContainerRef}
            className="h-full bg-black/40 font-mono text-[11px] p-3 overflow-y-auto custom-scrollbar"
          >
            {item.logs.map((log, i) => (
              <div key={i} className="py-0.5 flex gap-3 border-b border-white/5 last:border-0">
                <span className="text-white/10 w-6 flex-shrink-0">{i+1}</span>
                <span className="text-white/70 break-all">{log}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StatBox({ label, value, color, truncate }: { label: string, value: string, color?: string, truncate?: boolean }) {
  return (
    <div className="bg-black/30 p-2 rounded border border-white/5 flex flex-col gap-0.5">
      <span className="text-[9px] text-white/30 uppercase font-bold tracking-wider">{label}</span>
      <span 
        className={`text-xs font-medium ${truncate ? 'truncate' : ''}`}
        style={{ color: color || 'var(--text-primary)' }}
        title={truncate ? value : undefined}
      >
        {value}
      </span>
    </div>
  )
}
