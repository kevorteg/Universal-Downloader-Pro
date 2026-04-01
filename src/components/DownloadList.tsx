import React from 'react'
import { DownloadItem } from '../types'
import { getStatusLabel, getDomainFromUrl } from '../utils'
import { Music, Video, Loader2, CheckCircle2, XCircle, Clock, AlertTriangle } from 'lucide-react'

interface DownloadListProps {
  downloads: DownloadItem[]
  selectedId: string | null
  onSelect: (id: string) => void
  onContextMenu: (e: React.MouseEvent, item: DownloadItem) => void
  onDoubleClick?: (item: DownloadItem) => void
}

export default function DownloadList({
  downloads,
  selectedId,
  onSelect,
  onContextMenu,
  onDoubleClick
}: DownloadListProps) {
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

  // Column widths
  const cols = {
    icon: 32,
    name: 'flex-1',
    site: 100,
    size: 90,
    speed: 90,
    eta: 75,
    status: 110,
    progress: 140
  }

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: 'var(--bg-base)' }}>
      {/* Header */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `${cols.icon}px 1fr ${cols.site}px ${cols.size}px ${cols.progress}px ${cols.status}px ${cols.speed}px ${cols.eta}px`,
          padding: '0 8px',
          height: 28,
          alignItems: 'center',
          background: 'var(--bg-panel)',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
          fontSize: 11,
          fontWeight: 600,
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: 0.5
        }}
      >
        <div />
        <div>Nombre</div>
        <div>Sitio</div>
        <div style={{ textAlign: 'right' }}>Tamaño</div>
        <div style={{ paddingLeft: 8 }}>Progreso</div>
        <div>Estado</div>
        <div style={{ textAlign: 'right' }}>Velocidad</div>
        <div style={{ textAlign: 'right' }}>Tiempo</div>
      </div>

      {/* Rows */}
      <div style={{ overflowY: 'auto', flex: 1 }}>
        {downloads.map(item => (
          <DownloadRow
            key={item.id}
            item={item}
            isSelected={selectedId === item.id}
            onSelect={() => onSelect(item.id)}
            onContextMenu={onContextMenu}
            onDoubleClick={onDoubleClick}
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
  onDoubleClick
}: {
  item: DownloadItem
  isSelected: boolean
  onSelect: () => void
  onContextMenu: (e: React.MouseEvent, item: DownloadItem) => void
  onDoubleClick?: (item: DownloadItem) => void
}) {
  const displayName = item.title && item.title !== item.url
    ? item.title
    : (item.filename || getDomainFromUrl(item.url))

  const site = getDomainFromUrl(item.url)

  return (
    <div
      className={`download-row ${isSelected ? 'selected' : ''}`}
      style={{
        gridTemplateColumns: `32px 1fr 100px 90px 140px 110px 90px 75px`,
        display: 'grid',
        padding: '0 8px',
        height: 38,
        alignItems: 'center',
        fontSize: 12,
        borderLeft: isSelected ? '2px solid #c026d3' : '2px solid transparent'
      }}
      onClick={onSelect}
      onDoubleClick={() => onDoubleClick?.(item)}
      onContextMenu={e => onContextMenu(e, item)}
    >
      {/* Type icon */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        {item.audioOnly
          ? <Music size={14} style={{ color: '#e879f9' }} />
          : <Video size={14} style={{ color: '#3b82f6' }} />
        }
      </div>

      {/* Name */}
      <div
        style={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          color: 'var(--text-primary)',
          paddingRight: 8
        }}
        title={displayName}
      >
        {displayName}
      </div>

      {/* Site */}
      <div
        style={{
          color: 'var(--text-muted)',
          fontSize: 11,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}
      >
        {site}
      </div>

      {/* Size */}
      <div style={{ color: 'var(--text-secondary)', textAlign: 'right', fontSize: 11 }}>
        {item.totalSize || '—'}
      </div>

      {/* Progress bar */}
      <div style={{ paddingLeft: 8, paddingRight: 8 }}>
        <div
          style={{
            background: 'var(--bg-elevated)',
            borderRadius: 3,
            height: 7,
            overflow: 'hidden'
          }}
        >
          <div
            className="progress-bar-fill"
            style={{
              height: '100%',
              width: `${item.progress}%`,
              background: item.status === 'completed'
                ? 'var(--green)'
                : item.status === 'error'
                ? 'var(--red)'
                : 'linear-gradient(90deg, #a21caf, #c026d3, #e879f9)'
            }}
          />
        </div>
        <div style={{ fontSize: 9.5, color: 'var(--text-muted)', marginTop: 1, textAlign: 'right' }}>
          {item.progress > 0 ? `${item.progress.toFixed(1)}%` : ''}
        </div>
      </div>

      {/* Status */}
      <div>
        <StatusBadge status={item.status} />
      </div>

      {/* Speed */}
      <div style={{ color: 'var(--text-secondary)', textAlign: 'right', fontSize: 11 }}>
        {item.status === 'downloading' ? (item.speed || '—') : '—'}
      </div>

      {/* ETA */}
      <div style={{ color: 'var(--text-secondary)', textAlign: 'right', fontSize: 11 }}>
        {item.status === 'downloading' ? (item.eta || '—') : '—'}
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
