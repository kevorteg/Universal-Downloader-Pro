import React from 'react'
import { DownloadItem } from '../types'
import {
  Play, Pause, XCircle, Trash2, FolderOpen,
  Copy, ExternalLink, RefreshCw
} from 'lucide-react'

interface ContextMenuProps {
  x: number
  y: number
  item: DownloadItem
  onClose: () => void
  onCancel: (id: string) => void
  onRemove: (id: string, deleteFiles?: boolean) => void
  onOpenFolder: (item: DownloadItem) => void
  onCopyUrl: (item: DownloadItem) => void
  onPause: (id: string) => void
  onResume: (id: string) => void
}

export default function ContextMenu({
  x, y, item, onClose, onCancel, onRemove, onOpenFolder, onCopyUrl, onPause, onResume
}: ContextMenuProps) {
  const isDownloading = item.status === 'downloading'
  const isPaused = item.status === 'paused'
  const canPause = isDownloading || item.status === 'queued'

  const style: React.CSSProperties = {
    top: y,
    left: x,
  }

  const handleDelete = (deleteFiles = false) => {
    if (deleteFiles) {
      if (window.confirm('¿Estás seguro de que deseas eliminar este torrent Y TODOS sus archivos del disco?')) {
        onRemove(item.id, true)
      }
    } else {
      onRemove(item.id, false)
    }
    onClose()
  }

  return (
    <div className="context-menu" style={style} onClick={e => e.stopPropagation()}>
      <div className="context-menu-item" onClick={() => { onOpenFolder(item); onClose(); }}>
        <FolderOpen size={14} className="text-white/60" />
        Abrir Carpeta
      </div>
      <div className="context-menu-item" onClick={() => { onCopyUrl(item); onClose(); }}>
        <Copy size={14} className="text-white/60" />
        Copiar Magnet / Enlace
      </div>

      <div className="context-menu-separator" />

      {item.isTorrent && (
        <>
          {isPaused ? (
            <div className="context-menu-item text-green-400" onClick={() => { onResume(item.id); onClose(); }}>
              <Play size={14} fill="currentColor" />
              Reanudar descarga
            </div>
          ) : (
            <div 
              className={`context-menu-item ${canPause ? 'text-blue-400' : 'opacity-30 cursor-not-allowed'}`} 
              onClick={() => { if (canPause) { onPause(item.id); onClose(); } }}
            >
              <Pause size={14} fill="currentColor" />
              Pausar descarga
            </div>
          )}
        </>
      )}

      <div className="context-menu-item text-orange-400" onClick={() => { onCancel(item.id); onClose(); }}>
        <XCircle size={14} />
        Detener descarga
      </div>

      <div className="context-menu-separator" />

      <div className="context-menu-item text-white/50" onClick={() => handleDelete(false)}>
        <Trash2 size={14} />
        Quitar de la lista
      </div>

      <div className="context-menu-item text-red-500 font-bold" onClick={() => handleDelete(true)}>
        <Trash2 size={14} />
        Eliminar de la lista Y del disco
      </div>
    </div>
  )
}
