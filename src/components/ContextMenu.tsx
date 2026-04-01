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
  onRemove: (id: string) => void
  onOpenFolder: (item: DownloadItem) => void
  onCopyUrl: (item: DownloadItem) => void
}

export default function ContextMenu({
  x, y, item, onClose, onCancel, onRemove, onOpenFolder, onCopyUrl
}: ContextMenuProps) {
  const canCancel = item.status === 'downloading' || item.status === 'queued'

  const style: React.CSSProperties = {
    top: y,
    left: x,
  }

  return (
    <div className="context-menu" style={style} onClick={e => e.stopPropagation()}>
      <div className="context-menu-item" onClick={() => { onOpenFolder(item); onClose(); }}>
        <FolderOpen size={14} />
        Abrir Carpeta
      </div>
      <div className="context-menu-item" onClick={() => { onCopyUrl(item); onClose(); }}>
        <Copy size={14} />
        Copiar enlace original
      </div>

      <div className="context-menu-separator" />

      {canCancel ? (
        <div className="context-menu-item text-red-400" onClick={() => { onCancel(item.id); onClose(); }}>
          <XCircle size={14} />
          Cancelar descarga
        </div>
      ) : (
        <div className="context-menu-item text-red-500 font-medium" onClick={() => { onRemove(item.id); onClose(); }}>
          <Trash2 size={14} />
          Eliminar de la lista
        </div>
      )}

      <div className="context-menu-separator" />

      <div className="context-menu-item opacity-50 cursor-not-allowed">
        <RefreshCw size={14} />
        Reintentar descarga
      </div>
    </div>
  )
}
