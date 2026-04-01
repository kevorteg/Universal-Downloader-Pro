import React, { useState, useRef } from 'react'
import {
  Download, Music, Clipboard, Settings, Minus, Square, X,
  Link, ChevronRight, Zap, Globe, ClipboardPaste, List, XCircle, Plus, FilePlus
} from 'lucide-react'

interface TopBarProps {
  onAddUrlClick: () => void
  onAddTorrentClick?: () => void
  onOpenSettings: () => void
  onClearCompleted: () => void
}

export default function TopBar({
  onAddUrlClick,
  onAddTorrentClick,
  onOpenSettings,
  onClearCompleted
}: TopBarProps) {

  // Draggable title bar area
  const dragStyle: React.CSSProperties & { WebkitAppRegion?: 'drag' | 'no-drag' } = {
    WebkitAppRegion: 'drag'
  }
  const noDragStyle: React.CSSProperties & { WebkitAppRegion?: 'drag' | 'no-drag' } = {
    WebkitAppRegion: 'no-drag'
  }

  return (
    <div
      style={{
        background: 'var(--bg-panel)',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0
      }}
    >
      {/* Title bar row */}
      <div
        className="flex items-center px-3 py-2"
        style={{ ...dragStyle, height: 36 }}
      >
        {/* App icon + name */}
        <div className="flex items-center gap-2 mr-4" style={noDragStyle}>
          <div
            style={{
              width: 22,
              height: 22,
              borderRadius: 5,
              background: 'linear-gradient(135deg, #a21caf, #c026d3, #e879f9)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Download size={12} color="white" />
          </div>
          <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)' }}>
            Universal Downloader Pro
          </span>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Window controls */}
        <div className="flex items-center gap-1" style={noDragStyle}>
          <button
            className="btn-ghost"
            style={{ padding: '3px 8px', borderRadius: 3 }}
            onClick={() => window.electronAPI?.minimize()}
            title="Minimizar"
          >
            <Minus size={13} />
          </button>
          <button
            className="btn-ghost"
            style={{ padding: '3px 8px', borderRadius: 3 }}
            onClick={() => window.electronAPI?.maximize()}
            title="Maximizar"
          >
            <Square size={11} />
          </button>
          <button
            className="btn-ghost"
            style={{ padding: '3px 8px', borderRadius: 3 }}
            onClick={() => window.electronAPI?.close()}
            title="Cerrar (ocultar a bandeja)"
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {/* Toolbar row */}
      <div
        className="flex items-center gap-2 px-3 pb-2"
        style={noDragStyle}
      >
        <button
          className="btn btn-secondary tooltip"
          data-tip="Añadir Enlace (YT/Magnet/URL)"
          style={{ height: 32, padding: '0 12px', gap: 6 }}
          onClick={onAddUrlClick}
        >
          <Link size={16} className="text-fuchsia-400" />
          <span className="font-medium text-sm">Añadir Enlace</span>
        </button>

        {/* Divider */}
        <div style={{ width: 1, height: 24, background: 'var(--border)', flexShrink: 0, margin: '0 4px' }} />

        {/* Clear Completed */}
        <button
          className="btn btn-ghost tooltip"
          data-tip="Limpiar completadas"
          style={{ height: 32, padding: '0 8px' }}
          onClick={onClearCompleted}
        >
          <XCircle size={15} className="text-red-400" />
        </button>

        <div className="flex-1" />

        {/* Settings */}
        <button
          className="btn btn-ghost tooltip"
          data-tip="Configuración"
          style={{ height: 32, padding: '0 8px' }}
          onClick={onOpenSettings}
        >
          <Settings size={15} />
        </button>
      </div>
    </div>
  )
}
