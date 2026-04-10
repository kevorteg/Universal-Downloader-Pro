import React from 'react'
import { DownloadItem } from '../types'
import { getStatusLabel, getDomainFromUrl, formatSpeed, cleanTorrentName } from '../utils'
import { Music, Video, Loader2, CheckCircle2, XCircle, Clock, AlertTriangle, Share2, Play } from 'lucide-react'

interface DownloadListProps {
  downloads: DownloadItem[]
  selectedId: string | null
  onSelect: (id: string) => void
  onContextMenu: (e: React.MouseEvent, item: DownloadItem) => void
  onDoubleClick?: (item: DownloadItem) => void
  onPlay?: (item: DownloadItem) => void
}

export default function DownloadList({
  downloads,
  selectedId,
  onSelect,
  onContextMenu,
  onDoubleClick,
  onPlay
}: DownloadListProps) {
  const [sortKey, setSortKey] = React.useState<string>('addedAt')
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('desc')

  if (downloads.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center h-full"
        style={{ color: 'var(--text-muted)', gap: 12 }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 16,
            background: 'var(--bg-elevated)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid var(--border)'
          }}
        >
          <Video size={28} style={{ color: 'var(--text-muted)' }} />
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 4 }}>
            No hay descargas
          </div>
          <div style={{ fontSize: 12 }}>
            Pega una URL arriba para empezar
          </div>
        </div>
      </div>
    )
  }

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortOrder('desc')
    }
  }

  const sortedDownloads = [...downloads].sort((a, b) => {
    let valA: any = (a as any)[sortKey]
    let valB: any = (b as any)[sortKey]

    // Special cases
    if (sortKey === 'name') {
      valA = (a.title || a.filename || a.url).toLowerCase()
      valB = (b.title || b.filename || b.url).toLowerCase()
    } else if (sortKey === 'size') {
      // Very basic parsing for sorting purposes
      const parseSize = (s: string) => {
        if (!s || s === '—' || s === 'Calculando...') return 0
        const multi = s.includes('GB') ? 1024 * 1024 * 1024 : s.includes('MB') ? 1024 * 1024 : 1024
        return parseFloat(s) * multi
      }
      valA = parseSize(a.totalSize)
      valB = parseSize(b.totalSize)
    } else if (sortKey === 'speedDown') {
      valA = a.downloadSpeed || 0
      valB = b.downloadSpeed || 0
    } else if (sortKey === 'speedUp') {
      valA = a.uploadSpeed || 0
      valB = b.uploadSpeed || 0
    }

    if (valA < valB) return sortOrder === 'asc' ? -1 : 1
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1
    return 0
  })

  // Column settings
  const cols = {
    name: 'flex-1',
    size: 80,
    progress: 130,
    status: 95,
    speedDown: 85,
    speedUp: 85,
    peersSeeds: 90,
    eta: 70
  }

  const renderSortIcon = (key: string) => {
    if (sortKey !== key) return null
    return <span style={{ marginLeft: 4, fontSize: 8 }}>{sortOrder === 'asc' ? '▲' : '▼'}</span>
  }

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: 'var(--bg-base)' }}>
      {/* Header */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `1fr ${cols.size}px ${cols.progress}px ${cols.status}px ${cols.speedDown}px ${cols.speedUp}px ${cols.peersSeeds}px ${cols.eta}px`,
          padding: '0 12px',
          height: 30,
          alignItems: 'center',
          background: 'var(--bg-panel)',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
          fontSize: 10.5,
          fontWeight: 700,
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: 0.8
        }}
      >
        <div className="cursor-pointer hover:text-white transition-colors flex items-center" onClick={() => handleSort('name')}>
          Nombre {renderSortIcon('name')}
        </div>
        <div className="cursor-pointer hover:text-white transition-colors flex items-center justify-end" onClick={() => handleSort('size')}>
          Tamaño {renderSortIcon('size')}
        </div>
        <div className="cursor-pointer hover:text-white transition-colors flex items-center pl-3" onClick={() => handleSort('progress')}>
          Progreso {renderSortIcon('progress')}
        </div>
        <div className="cursor-pointer hover:text-white transition-colors flex items-center" onClick={() => handleSort('status')}>
          Estado {renderSortIcon('status')}
        </div>
        <div className="cursor-pointer hover:text-white transition-colors flex items-center justify-end" onClick={() => handleSort('speedDown')}>
          Bajada {renderSortIcon('speedDown')}
        </div>
        <div className="cursor-pointer hover:text-white transition-colors flex items-center justify-end" onClick={() => handleSort('speedUp')}>
          Subida {renderSortIcon('speedUp')}
        </div>
        <div className="cursor-pointer hover:text-white transition-colors flex items-center justify-center font-mono text-[9px]" onClick={() => handleSort('peers')}>
          P (S) {renderSortIcon('peers')}
        </div>
        <div className="cursor-pointer hover:text-white transition-colors flex items-center justify-end" onClick={() => handleSort('timeRemaining')}>
          ETA {renderSortIcon('timeRemaining')}
        </div>
      </div>

      {/* Rows */}
      <div style={{ overflowY: 'auto', flex: 1 }} className="custom-scrollbar">
        {sortedDownloads.map(item => (
          <DownloadRow
            key={item.id}
            item={item}
            isSelected={selectedId === item.id}
            onSelect={() => onSelect(item.id)}
            onContextMenu={onContextMenu}
            onDoubleClick={onDoubleClick}
            onPlay={onPlay}
          />
        ))}
      </div>
    </div>
  )
}

// ── Row ──
function DownloadRow({
  item,
  isSelected,
  onSelect,
  onContextMenu,
  onDoubleClick,
  onPlay
}: {
  item: DownloadItem
  isSelected: boolean
  onSelect: () => void
  onContextMenu: (e: React.MouseEvent, item: DownloadItem) => void
  onDoubleClick?: (item: DownloadItem) => void
  onPlay?: (item: DownloadItem) => void
}) {
  const displayName = item.title && item.title !== item.url
    ? item.title
    : (item.filename 
        ? item.filename 
        : (item.url.startsWith('magnet:') ? 'Iniciando torrent...' : getDomainFromUrl(item.url))
      )

  const isDownloading = item.status === 'downloading'

  return (
    <div
      className={`download-row ${isSelected ? 'selected' : ''}`}
      style={{
        gridTemplateColumns: `1fr 80px 130px 95px 85px 85px 90px 70px`,
        display: 'grid',
        padding: '0 12px',
        height: 36,
        alignItems: 'center',
        fontSize: 11.5,
        borderLeft: isSelected ? '2px solid #c026d3' : '2px solid transparent',
        transition: 'background 0.1s ease'
      }}
      onClick={onSelect}
      onDoubleClick={() => onDoubleClick?.(item)}
      onContextMenu={e => onContextMenu(e, item)}
    >
      {/* Name with icon */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          overflow: 'hidden',
          paddingRight: 8
        }}
      >
        <div style={{ flexShrink: 0, width: 44, height: 28, borderRadius: 6, overflow: 'hidden', background: '#000', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {item.thumbnail ? (
            <img 
              src={item.thumbnail} 
              className="w-full h-full object-cover transition-opacity duration-300"
              alt=""
              onError={(e) => (e.currentTarget.style.display = 'none')}
            />
          ) : (
            item.isTorrent 
              ? <Share2 size={12} style={{ color: '#c026d3' }} /> 
              : item.audioOnly 
                ? <Music size={12} style={{ color: '#e879f9' }} /> 
                : <Video size={12} style={{ color: '#3b82f6' }} />
          )}
        </div>
        <span
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            color: 'var(--text-primary)',
            fontWeight: 450
          }}
          title={displayName}
        >
          {displayName}
        </span>
      </div>

      {/* Size */}
      <div style={{ color: 'var(--text-secondary)', textAlign: 'right', fontSize: 11 }}>
        {item.totalSize || '—'}
      </div>

      {/* Progress bar */}
      <div style={{ paddingLeft: 12, paddingRight: 8 }}>
        <div
          style={{
            background: 'var(--bg-elevated)',
            borderRadius: 2,
            height: 12,
            overflow: 'hidden',
            position: 'relative',
            border: '1px solid rgba(255,255,255,0.05)'
          }}
        >
          <div
            className="progress-bar-fill"
            style={{
              height: '100%',
              width: `${item.progress}%`,
              background: item.status === 'completed'
                ? '#22c55e'
                : item.status === 'error'
                ? '#ef4444'
                : item.status === 'paused'
                ? '#4b5563'
                : 'linear-gradient(270deg, #c026d3, #a21caf)'
            }}
          />
          {item.progress > 0 && (
            <div 
              style={{ 
                position: 'absolute', 
                inset: 0, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                fontSize: 8,
                fontWeight: 800,
                color: item.progress > 50 ? 'white' : 'var(--text-muted)',
                textShadow: item.progress > 50 ? '0 0 2px rgba(0,0,0,0.5)' : 'none'
              }}
            >
              {item.progress.toFixed(0)}%
            </div>
          )}
        </div>
      </div>

      {/* Status + Play */}
      <div className="flex items-center gap-1.5">
        <StatusBadge status={item.status} />
        {item.status === 'completed' && !item.audioOnly && !item.isTorrent && onPlay && (
          <button
            onClick={(e) => { e.stopPropagation(); onPlay(item) }}
            className="flex items-center gap-1 text-[9px] font-black bg-amber-500/20 hover:bg-amber-500/40 text-amber-400 px-1.5 py-0.5 rounded-md transition-all border border-amber-500/20"
            title="Reproducir en el reproductor integrado"
          >
            <Play size={8} className="fill-amber-400" />
            Ver
          </button>
        )}
      </div>

      {/* Down Speed */}
      <div style={{ color: 'var(--text-secondary)', textAlign: 'right', fontSize: 11 }}>
        {isDownloading ? (item.speed || '—') : '—'}
      </div>

      {/* Up Speed */}
      <div style={{ color: '#a21caf', textAlign: 'right', fontSize: 11, opacity: 0.8 }}>
        {isDownloading && item.isTorrent ? (item.uploadSpeed ? formatSpeed(item.uploadSpeed) : '0 B/s') : '—'}
      </div>

      {/* Peers (Seeds) */}
      <div style={{ color: 'var(--text-muted)', textAlign: 'center', fontSize: 10.5 }}>
        {item.isTorrent ? `${item.peers || 0} (${item.seeds || 0})` : '—'}
      </div>

      {/* ETA */}
      <div style={{ color: 'var(--text-secondary)', textAlign: 'right', fontSize: 11 }}>
        {isDownloading ? (item.eta || '—') : '—'}
      </div>
    </div>
  )
}

// ── Status badge ──
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { icon: React.ReactNode; label: string; cls: string }> = {
    downloading: { icon: <Loader2 size={10} className="spin-slow" />, label: 'Descargando', cls: 'badge-downloading' },
    completed: { icon: <CheckCircle2 size={10} />, label: 'Completado', cls: 'badge-completed' },
    error: { icon: <XCircle size={10} />, label: 'Error', cls: 'badge-error' },
    queued: { icon: <Clock size={10} />, label: 'En cola', cls: 'badge-queued' },
    cancelled: { icon: <XCircle size={10} />, label: 'Cancelado', cls: 'badge-cancelled' },
    paused: { icon: <AlertTriangle size={10} />, label: 'Pausado', cls: 'badge-queued' }
  }
  const s = map[status] || map['cancelled']
  return (
    <span className={`badge ${s.cls}`} style={{ fontSize: 10.5 }}>
      {s.icon}
      {s.label}
    </span>
  )
}
