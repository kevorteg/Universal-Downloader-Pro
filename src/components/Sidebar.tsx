import React from 'react'
import {
  LayoutList,
  Download,
  CheckCircle,
  XCircle,
  Clock,
  Music,
  Video,
  AlertTriangle,
  ChevronRight,
  Layers,
  Search,
  Crown
} from 'lucide-react'
import { DownloadItem, SidebarFilter } from '../types'

interface SidebarProps {
  downloads: DownloadItem[]
  filter: SidebarFilter
  onFilterChange: (f: SidebarFilter) => void
  onOpenSettings: () => void
  onOpenBulk: () => void
  isPro: boolean
}

export default function Sidebar({ downloads, filter, onFilterChange, onOpenSettings, onOpenBulk, isPro }: SidebarProps) {
  const counts = {
    all: downloads.length,
    downloading: downloads.filter(d => d.status === 'downloading' || d.status === 'queued').length,
    completed: downloads.filter(d => d.status === 'completed').length,
    error: downloads.filter(d => d.status === 'error').length,
    queued: downloads.filter(d => d.status === 'queued' || d.status === 'paused').length, // Count paused as queued for now
    audio: downloads.filter(d => d.audioOnly && !d.isTorrent).length,
    video: downloads.filter(d => !d.audioOnly && !d.isTorrent).length,
    torrent: downloads.filter(d => d.isTorrent).length
  }

  type SectionItem = {
    id: SidebarFilter
    label: string
    icon: React.ReactNode
    count: number
    color?: string
  }

  const statusItems: SectionItem[] = [
    { id: 'all', label: 'Todas', icon: <LayoutList size={14} />, count: counts.all },
    { id: 'downloading', label: 'Descargando', icon: <Download size={14} />, count: counts.downloading, color: '#c026d3' },
    { id: 'completed', label: 'Completadas', icon: <CheckCircle size={14} />, count: counts.completed, color: '#22c55e' },
    { id: 'error', label: 'Con error', icon: <AlertTriangle size={14} />, count: counts.error, color: '#ef4444' },
    { id: 'queued', label: 'En cola', icon: <Clock size={14} />, count: counts.queued, color: '#eab308' },
  ]

  const categoryItems: SectionItem[] = [
    { id: 'video', label: 'Videos', icon: <Video size={14} />, count: counts.video },
    { id: 'audio', label: 'Audio / MP3', icon: <Music size={14} />, count: counts.audio, color: '#e879f9' },
    { id: 'torrent', label: 'Torrents', icon: <Layers size={14} />, count: counts.torrent, color: '#0ea5e9' },
    { id: 'search', label: 'Buscador', icon: <div className="flex items-center gap-1.5"><Search size={14} />{!isPro && <Crown size={9} className="text-yellow-500 fill-yellow-500" />}</div>, count: 0, color: '#c026d3' },
  ]

  function renderItem(item: SectionItem) {
    const isActive = filter === item.id
    return (
      <div
        key={item.id}
        className={`sidebar-item ${isActive ? 'active' : ''}`}
        onClick={() => onFilterChange(item.id)}
      >
        <span style={{ color: isActive ? (item.color || '#e879f9') : (item.color || 'var(--text-muted)') }}>
          {item.icon}
        </span>
        <span>{item.label}</span>
        {item.count > 0 && (
          <span className="count ml-auto">{item.count}</span>
        )}
        {isActive && <ChevronRight size={11} style={{ marginLeft: 'auto', color: 'var(--accent-light)', flexShrink: 0 }} />}
      </div>
    )
  }

  return (
    <div
      style={{
        width: 190,
        flexShrink: 0,
        background: 'var(--bg-panel)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        padding: '10px 6px',
        overflowY: 'auto',
        gap: 4
      }}
    >
      {/* ESTADO section */}
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: 1,
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          padding: '4px 10px 6px'
        }}
      >
        Estado
      </div>
      {statusItems.map(renderItem)}

      <div style={{ height: 1, background: 'var(--border)', margin: '8px 4px' }} />

      {/* CATEGORÍAS section */}
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: 1,
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          padding: '4px 10px 6px'
        }}
      >
        Categorías
      </div>
      {categoryItems.map(renderItem)}

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      <div
        onClick={onOpenSettings}
        className="group"
        style={{
          margin: '8px 4px',
          padding: '12px 10px',
          borderRadius: 12,
          background: isPro 
            ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(21, 128, 61, 0.05) 100%)'
            : 'linear-gradient(135deg, rgba(192, 38, 211, 0.15) 0%, rgba(147, 51, 234, 0.05) 100%)',
          border: isPro 
            ? '1px solid rgba(34, 197, 94, 0.2)'
            : '1px solid rgba(192, 38, 211, 0.2)',
          cursor: 'pointer',
          transition: 'all 0.2s'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <Crown size={14} className={isPro ? "text-green-400" : "text-fuchsia-400 group-hover:scale-110 transition-transform"} />
          <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', letterSpacing: 0.5 }}>
            {isPro ? 'Sección Pro' : 'Universal Pro'}
          </span>
          {isPro && <span className="ml-auto text-[8px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider border border-green-500/30">Activa</span>}
        </div>
        <div style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.4)', lineHeight: 1.3 }}>
          {isPro 
            ? 'Gracias por tu apoyo. Disfruta de todas las ventajas.'
            : 'Listas de reproducción, descargas masivas y 4K.'}
        </div>
      </div>

      {/* Bulk Add Action */}
      <button
        onClick={onOpenBulk}
        className="mx-1 mb-2 flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all text-[11px] font-bold"
      >
        <Layers size={13} className="text-fuchsia-400" />
        Importación Masiva
      </button>

      {/* Footer info */}
      <div
        style={{
          padding: '8px 10px',
          fontSize: 10.5,
          color: 'var(--text-muted)',
          borderTop: '1px solid var(--border-subtle)'
        }}
      >
        <div style={{ marginBottom: 4, display: 'flex', alignItems: 'center', gap: 5 }}>
          <Layers size={11} />
          <span>yt-dlp integrado</span>
        </div>
        <div style={{ color: 'var(--text-muted)', fontSize: 10 }}>
          1000+ sitios soportados
        </div>
      </div>
    </div>
  )
}
