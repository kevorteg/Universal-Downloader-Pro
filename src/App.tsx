import React, { useState, useEffect, useCallback, useRef } from 'react'
import TopBar from './components/TopBar.tsx'
import Sidebar from './components/Sidebar.tsx'
import DownloadList from './components/DownloadList.tsx'
import DownloadDetails from './components/DownloadDetails.tsx'
import SettingsModal from './components/SettingsModal.tsx'
import ContextMenu from './components/ContextMenu.tsx'
import AddDialog from './components/AddDialog.tsx'
import SearchTab from './components/SearchTab.tsx'
import { DownloadItem, SidebarFilter, AppSettings, VideoFormat } from './types'
import { loadSettings, saveSettings, isValidUrl, cleanUrl } from './utils.ts'
import { v4 as uuidv4 } from 'uuid'

export default function App() {
  const [downloads, setDownloads] = useState<DownloadItem[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [filter, setFilter] = useState<SidebarFilter>('all')
  const [settings, setSettings] = useState<AppSettings>(loadSettings)
  const [showSettings, setShowSettings] = useState(false)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [initialAddUrl, setInitialAddUrl] = useState('')
  const [contextMenu, setContextMenu] = useState<{
    x: number; y: number; item: DownloadItem
  } | null>(null)
  const [detailsHeight, setDetailsHeight] = useState(220)
  const resizing = useRef(false)
  const isInitialMount = useRef(true)

  // ── History Loading ──
  useEffect(() => {
    if (!window.electronAPI) return
    
    window.electronAPI.loadHistory().then(history => {
      if (history && Array.isArray(history)) {
        setDownloads(history)
      }
    }).catch(err => console.error('Error loading history:', err))
  }, [])

  // ── History Auto-Saving ──
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }
    if (!window.electronAPI) return

    // Debounce save slightly to avoid too many writes during rapid progress updates
    const timer = setTimeout(() => {
      window.electronAPI.saveHistory(downloads)
    }, 1000)

    return () => clearTimeout(timer)
  }, [downloads])

  // ── Electron IPC listeners ──
  useEffect(() => {
    if (!window.electronAPI) return

    const unsubProgress = window.electronAPI.onDownloadProgress((data) => {
      setDownloads(prev => prev.map(d => {
        if (d.id !== data.id) return d
        const newLogs = [...d.logs, data.line].slice(-200)
        const updates: Partial<DownloadItem> = { logs: newLogs, status: 'downloading' }
        if (data.percent != null) updates.progress = data.percent
        if (data.speed) updates.speed = data.speed
        if (data.eta) updates.eta = data.eta
        if (data.totalSize) updates.totalSize = data.totalSize
        if (data.title) updates.title = data.title // Priority: use the clean title from backend
        if (data.filename && !d.filename) {
          const parts = data.filename.split(/[/\\]/)
          const cleanName = parts[parts.length - 1]
          updates.filename = cleanName
          // Si el título actual es solo el URL (un magnet), lo actualizamos al nombre real
          if (d.title === d.url) updates.title = data.title || cleanName
        }
        if (data.infoHash) updates.infoHash = data.infoHash
        if (data.peers != null) updates.peers = data.peers
        if (data.seeds != null) updates.seeds = data.seeds
        if (data.uploadSpeed != null) updates.uploadSpeed = data.uploadSpeed
        if (data.ratio != null) updates.ratio = data.ratio
        if (data.isPaused != null) {
          updates.isPaused = data.isPaused
          if (data.isPaused) updates.status = 'paused'
        }
        return { ...d, ...updates }
      }))
    })

    const unsubCompleted = window.electronAPI.onDownloadCompleted((data) => {
      setDownloads(prev => prev.map(d => {
        if (d.id !== data.id) return d
        return {
          ...d,
          status: data.success ? 'completed' : 'error',
          progress: data.success ? 100 : d.progress,
          completedAt: Date.now(),
          error: data.error || (data.success ? '' : 'Error desconocido')
        }
      }))
    })

    return () => {
      unsubProgress()
      unsubCompleted()
    }
  }, [])

  // ── 📥 Download Actions ──

  const handleGetFormats = async (url: string) => {
    const cleanedUrl = cleanUrl(url)
    if (!isValidUrl(cleanedUrl) && !cleanedUrl.startsWith('magnet:')) return { success: false }
    
    try {
      return await window.electronAPI.getVideoFormats(cleanedUrl)
    } catch (error: any) {
      console.error('Error fetching formats:', error)
      return { success: false, error: error.message }
    }
  }

  const handleOpenAddDialog = async (url = '') => {
    let text = url
    if (!text && navigator.clipboard) {
      try {
        const clipboardText = await navigator.clipboard.readText()
        if (isValidUrl(clipboardText) || clipboardText.startsWith('magnet:')) {
          text = clipboardText
        }
      } catch (e) {}
    }
    setInitialAddUrl(text)
    setShowAddDialog(true)
  }

  const startDownload = async (url: string, type: 'video' | 'audio' | 'torrent', formatId?: string, customDir?: string, initialTitle?: string) => {
    setShowAddDialog(false)
    const cleanedUrl = cleanUrl(url)
    const audioOnly = type === 'audio'
    const isTorrent = type === 'torrent'
    const outputDir = customDir || settings.outputDir || ''
    
    const newItem: DownloadItem = {
      id: uuidv4(),
      url: cleanedUrl,
      title: initialTitle || (isTorrent ? 'Verificando metadatos...' : cleanedUrl),
      outputDir,
      audioOnly,
      isTorrent,
      status: 'queued',
      progress: 0,
      speed: '',
      eta: '',
      totalSize: isTorrent ? 'Calculando...' : '',
      filename: '',
      addedAt: Date.now(),
      logs: []
    }
    
    setDownloads(prev => [newItem, ...prev])
    setSelectedId(newItem.id)

    // 1. Get info in background (optional, but nice) - Skip for magnets/torrents
    if (!isTorrent) {
      window.electronAPI?.getVideoInfo(cleanedUrl).then(info => {
        if (info.ok) {
          setDownloads(prev => prev.map(d => d.id === newItem.id ? {
            ...d,
            title: initialTitle || info.title || d.title,
            thumbnail: info.thumbnail,
            uploader: info.uploader,
            extractor: info.extractor,
            duration: info.duration,
            totalSize: info.size || d.totalSize,
            filename: info.filename || d.filename
          } : d))
        }
      }).catch(() => {})
    }

    // 2. Start actual download
    try {
      let result: any;
      
      if (isTorrent) {
        // Usar el nuevo motor robusto para P2P
        result = await window.electronAPI.downloadTorrent({
          id: newItem.id,
          url: cleanedUrl,
          outputDir,
          highSpeedMode: settings.highSpeedMode
        });
        
        if (!result.success) {
          setDownloads(prev => prev.map(d => d.id === newItem.id ? { 
            ...d, 
            status: 'error', 
            error: result.error || 'No se pudo iniciar el torrent',
            logs: result.detail ? [`[ERROR] ${result.detail}`] : d.logs
          } : d));
          return;
        }
      } else {
        // Usar motor estándar para descargas directas (yt-dlp)
        result = await window.electronAPI.startDownload({
          id: newItem.id,
          url: cleanedUrl,
          outputDir,
          audioOnly,
          isTorrent: false,
          useCookies: settings.useCookies,
          cookiesBrowser: settings.cookiesBrowser,
          formatId,
          customTrackers: settings.customTrackers,
          highSpeedMode: settings.highSpeedMode
        });
        
        if (result && !result.ok) {
          setDownloads(prev => prev.map(d => d.id === newItem.id ? { 
            ...d, 
            status: 'error', 
            error: result.error || 'No se pudo iniciar la descarga' 
          } : d));
          return;
        }
      }

      // Manejar éxito (outputDir puede venir en ambos formatos)
      const finalDir = result.outputDir || (result.data && result.data.path);
      if (finalDir) {
        setDownloads(prev => prev.map(d => d.id === newItem.id ? { ...d, outputDir: finalDir } : d));
      }
      
    } catch (error: any) {
      console.error('Error starting download:', error);
      setDownloads(prev => prev.map(d => d.id === newItem.id ? { 
        ...d, 
        status: 'error', 
        error: error.message || 'Error de conexión con el sistema' 
      } : d));
    }
  }

  const pauseDownload = useCallback(async (id: string) => {
    if (window.electronAPI) {
      await window.electronAPI.pauseDownload(id)
    }
    setDownloads(prev => prev.map(d =>
      d.id === id ? { ...d, status: 'paused' } : d
    ))
  }, [])

  const resumeDownload = useCallback(async (id: string) => {
    if (window.electronAPI) {
      await window.electronAPI.resumeDownload(id)
    }
    setDownloads(prev => prev.map(d =>
      d.id === id ? { ...d, status: 'downloading' } : d
    ))
  }, [])

  const cancelDownload = useCallback(async (id: string) => {
    if (window.electronAPI) {
      await window.electronAPI.cancelDownload(id)
    }
    setDownloads(prev => prev.map(d =>
      d.id === id ? { ...d, status: 'cancelled' } : d
    ))
  }, [])

  const removeDownload = useCallback(async (id: string, deleteFiles?: boolean) => {
    if (deleteFiles && window.electronAPI) {
      await window.electronAPI.cancelDownload(id, true)
    }
    setDownloads(prev => prev.filter(d => d.id !== id))
    if (selectedId === id) setSelectedId(null)
  }, [selectedId])

  const clearCompleted = useCallback(async () => {
    if (!window.electronAPI) return
    const newDownloads = await window.electronAPI.clearHistory(downloads)
    setDownloads(newDownloads)
    setSelectedId(null)
  }, [downloads])

  const handleContextMenu = useCallback((e: React.MouseEvent, item: DownloadItem) => {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY, item })
  }, [])

  const closeContextMenu = useCallback(() => setContextMenu(null), [])

  const handleSaveSettings = useCallback((s: AppSettings) => {
    setSettings(s)
    saveSettings(s)
    setShowSettings(false)
  }, [])

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!resizing.current) return
      const windowH = window.innerHeight
      const newH = windowH - e.clientY
      setDetailsHeight(Math.min(Math.max(newH, 100), 500))
    }
    const onMouseUp = () => { resizing.current = false }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    
    // Drag and drop link
    const handleDrop = (e: DragEvent) => {
      e.preventDefault()
      const dt = e.dataTransfer
      if (dt) {
        const text = dt.getData('text/plain') || dt.getData('text/uri-list')
        if (text && (isValidUrl(text) || text.startsWith('magnet:'))) {
          handleOpenAddDialog(text)
          return
        }
        
        // Handle file drop (.torrent)
        if (dt.files && dt.files.length > 0) {
          const file = dt.files[0]
          if (file.name.endsWith('.torrent')) {
            // In Electron, file.path is available
            const filePath = (file as any).path
            if (filePath) handleOpenAddDialog(filePath)
          }
        }
      }
    }
    const handleDragOver = (e: DragEvent) => e.preventDefault()
    
    window.addEventListener('drop', handleDrop)
    window.addEventListener('dragover', handleDragOver)

    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
      window.removeEventListener('drop', handleDrop)
      window.removeEventListener('dragover', handleDragOver)
    }
  }, [])

  const filteredDownloads = downloads.filter(d => {
    switch (filter) {
      case 'downloading': return d.status === 'downloading' || d.status === 'queued'
      case 'completed': return d.status === 'completed'
      case 'error': return d.status === 'error'
      case 'queued': return d.status === 'queued'
      case 'audio': return d.audioOnly && !d.isTorrent
      case 'video': return !d.audioOnly && !d.isTorrent
      case 'torrent': return !!d.isTorrent
      default: return true
    }
  })

  const selectedItem = downloads.find(d => d.id === selectedId) || null

  return (
    <div
      className="flex flex-col h-screen overflow-hidden"
      style={{ background: 'var(--bg-base)', color: 'var(--text-primary)' }}
      onClick={closeContextMenu}
    >
      <TopBar
        onAddUrlClick={() => handleOpenAddDialog()}
        onOpenSettings={() => setShowSettings(true)}
        onClearCompleted={clearCompleted}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          downloads={downloads}
          filter={filter}
          onFilterChange={setFilter}
        />

        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-hidden" style={{ minHeight: 0 }}>
            {filter === 'search' ? (
              <SearchTab 
                onAddDownload={(url, type, title) => startDownload(url, type, undefined, undefined, title)} 
              />
            ) : (
              <DownloadList
                downloads={filteredDownloads}
                selectedId={selectedId}
                onSelect={setSelectedId}
                onContextMenu={handleContextMenu}
                onDoubleClick={(item) => window.electronAPI?.openFolder(item.outputDir)}
              />
            )}
          </div>

          {selectedItem && (
            <>
              <div
                style={{
                  height: 4,
                  cursor: 'row-resize',
                  background: 'var(--border)',
                  flexShrink: 0
                }}
                onMouseDown={(e) => {
                  e.preventDefault()
                  resizing.current = true
                }}
                className="hover:bg-magenta-700 transition-colors"
              />
              <div style={{ height: detailsHeight, flexShrink: 0 }}>
                <DownloadDetails
                  item={selectedItem}
                  onCancel={cancelDownload}
                  onRemove={removeDownload}
                  onPause={pauseDownload}
                  onResume={resumeDownload}
                  onOpenFolder={(item: DownloadItem) => {
                    window.electronAPI?.openFolder(item.outputDir)
                  }}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {showSettings && (
        <SettingsModal
          settings={settings}
          onSave={handleSaveSettings}
          onClose={() => setShowSettings(false)}
        />
      )}

      {showAddDialog && (
        <AddDialog
          isOpen={showAddDialog}
          onClose={() => setShowAddDialog(false)}
          initialUrl={initialAddUrl}
          settings={settings}
          onAdd={startDownload}
          onGetFormats={handleGetFormats as any}
        />
      )}

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          item={contextMenu.item}
          onClose={closeContextMenu}
          onCancel={cancelDownload}
          onRemove={removeDownload}
          onPause={pauseDownload}
          onResume={resumeDownload}
          onOpenFolder={(item: DownloadItem) => window.electronAPI?.openFolder(item.outputDir)}
          onCopyUrl={(item: DownloadItem) => navigator.clipboard.writeText(item.url)}
        />
      )}
    </div>
  )
}
