import React, { useState, useEffect, useCallback, useRef } from 'react'
import TopBar from './components/TopBar.tsx'
import Sidebar from './components/Sidebar.tsx'
import DownloadList from './components/DownloadList.tsx'
import SearchTab from './components/SearchTab.tsx'
import DownloadDetails from './components/DownloadDetails.tsx'
import SettingsModal from './components/SettingsModal.tsx'
import ContextMenu from './components/ContextMenu.tsx'
import AddDialog from './components/AddDialog.tsx'
import VideoPlayer from './components/VideoPlayer.tsx'
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
  const [isPro, setIsPro] = useState(false)
  const [nowPlaying, setNowPlaying] = useState<{ path: string; title: string } | null>(null)
  const [playNotification, setPlayNotification] = useState<{ id: string; title: string } | null>(null)
  const resizing = useRef(false)
  const isInitialMount = useRef(true)

  // ── History Loading ──
  useEffect(() => {
    if (!window.electronAPI) return
    
    // Load downloads history
    window.electronAPI.loadHistory().then(history => {
      if (history && Array.isArray(history)) {
        setDownloads(history)
      }
    }).catch(err => console.error('Error loading history:', err))

    // Load license status
    window.electronAPI.getLicenseStatus().then(status => {
      setIsPro(status.isPro)
    })
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
        if (data.filename) {
          const parts = data.filename.split(/[/\\]/)
          updates.filename = parts[parts.length - 1]
        }
        return { ...d, ...updates }
      }))
    })

    const unsubCompleted = window.electronAPI.onDownloadCompleted((data) => {
      setDownloads(prev => prev.map(d => {
        if (d.id !== data.id) return d
        const updated = {
          ...d,
          status: data.success ? 'completed' : 'error',
          progress: data.success ? 100 : d.progress,
          completedAt: Date.now(),
          error: data.error || (data.success ? '' : 'Error desconocido')
        } as DownloadItem
        // Show play notification for completed video downloads
        if (data.success && !d.audioOnly && !d.isTorrent) {
          setPlayNotification({ id: d.id, title: d.title || d.url })
          setTimeout(() => setPlayNotification(null), 8000)
        }
        return updated
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
      title: initialTitle || cleanedUrl,
      outputDir,
      audioOnly,
      isTorrent,
      status: 'queued',
      progress: 0,
      speed: '',
      eta: '',
      totalSize: '',
      filename: '',
      addedAt: Date.now(),
      logs: []
    }
    
    setDownloads(prev => [newItem, ...prev])
    setSelectedId(newItem.id)

    // 1. Get info in background (optional, but nice)
    window.electronAPI?.getVideoInfo(cleanedUrl).then(info => {
      if (info.ok) {
        setDownloads(prev => prev.map(d => d.id === newItem.id ? {
          ...d,
          title: info.title || d.title,
          thumbnail: info.thumbnail,
          uploader: info.uploader,
          extractor: info.extractor,
          duration: info.duration
        } : d))
      }
    }).catch(() => {})

    // 2. Start actual download
    try {
      await window.electronAPI.startDownload({
        id: newItem.id,
        url: cleanedUrl,
        outputDir,
        audioOnly,
        isTorrent,
        useCookies: settings.useCookies,
        cookiesBrowser: settings.cookiesBrowser,
        formatId
      })
    } catch (error) {
      console.error('Error starting download:', error)
    }
  }

  const cancelDownload = useCallback(async (id: string) => {
    if (window.electronAPI) {
      await window.electronAPI.cancelDownload(id)
    }
    setDownloads(prev => prev.map(d =>
      d.id === id ? { ...d, status: 'cancelled' } : d
    ))
  }, [])

  const removeDownload = useCallback((id: string) => {
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

  const handlePauseDownload = useCallback(async (id: string) => {
    if (window.electronAPI) {
      await window.electronAPI.pauseDownload(id)
      setDownloads(prev => prev.map(d => 
        d.id === id ? { ...d, status: 'paused' } : d
      ))
    }
  }, [])

  const handleResumeDownload = useCallback(async (id: string) => {
    if (window.electronAPI) {
      await window.electronAPI.resumeDownload(id)
      setDownloads(prev => prev.map(d => 
        d.id === id ? { ...d, status: 'downloading' } : d
      ))
    }
  }, [])

  const handleOpenBulk = useCallback(() => {
    setInitialAddUrl('')
    setShowAddDialog(true)
  }, [])

  const handleExpandPlaylist = useCallback(async (url: string) => {
    if (window.electronAPI) {
      try {
        const result = await window.electronAPI.expandPlaylist(url)
        console.log('Expanded playlist:', result)
      } catch (e) {
        console.error('Error expanding playlist:', e)
      }
    }
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
      case 'player': return d.status === 'completed' && !d.audioOnly && !d.isTorrent
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
          onOpenSettings={() => setShowSettings(true)}
          onOpenBulk={handleOpenBulk}
          isPro={isPro}
        />

        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-hidden" style={{ minHeight: 0 }}>
            {filter === 'search' ? (
              <SearchTab onAddDownload={startDownload} isPro={isPro} />
            ) : filter === 'player' ? (
              <PlayerTab
                downloads={filteredDownloads}
                nowPlaying={nowPlaying}
                onPlay={(item) => {
                  const filePath = [item.outputDir, item.filename]
                    .join('/').replace(/\\/g, '/').replace(/\/\//g, '/')
                  setNowPlaying({ path: filePath, title: item.title || item.filename })
                }}
              />
            ) : (
              <DownloadList
                downloads={filteredDownloads}
                selectedId={selectedId}
                onSelect={setSelectedId}
                onContextMenu={handleContextMenu}
                onDoubleClick={(item) => window.electronAPI?.openFolder(item.outputDir)}
                onPlay={(item) => {
                  const filePath = [item.outputDir, item.filename]
                    .join('/').replace(/\\/g, '/').replace(/\/\//g, '/')
                  setNowPlaying({ path: filePath, title: item.title || item.filename })
                  setFilter('player')
                }}
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
                  onOpenFolder={(item: DownloadItem) => {
                    window.electronAPI?.openFolder(item.outputDir)
                  }}
                  onPause={handlePauseDownload}
                  onResume={handleResumeDownload}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {showSettings && (
        <SettingsModal
          isOpen={showSettings}
          settings={settings}
          onSave={handleSaveSettings}
          onClose={() => setShowSettings(false)}
          onLicenseVerified={() => setIsPro(true)}
        />
      )}

      {showAddDialog && (
        <AddDialog
          isOpen={showAddDialog}
          onClose={() => setShowAddDialog(false)}
          initialUrl={initialAddUrl}
          settings={settings}
          onAdd={startDownload}
          onExpand={handleExpandPlaylist}
          onGetFormats={handleGetFormats}
          isPro={isPro}
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
          onOpenFolder={(item: DownloadItem) => window.electronAPI?.openFolder(item.outputDir)}
          onCopyUrl={(item: DownloadItem) => navigator.clipboard.writeText(item.url)}
          onPause={handlePauseDownload}
          onResume={handleResumeDownload}
        />
      )}

      {/* 🎬 Download Complete Play Notification Toast */}
      {playNotification && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-4 fade-in duration-500">
          <div className="bg-gray-900/95 backdrop-blur-xl border border-amber-500/30 rounded-2xl p-4 shadow-2xl shadow-amber-500/10 max-w-xs">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-amber-400 text-lg">🎬</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-black text-amber-400 uppercase tracking-widest mb-0.5">¡Descarga lista!</p>
                <p className="text-[12px] text-white/80 truncate font-medium">{playNotification.title}</p>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => {
                      const item = downloads.find(d => d.id === playNotification.id)
                      if (item) {
                        const filePath = item.outputDir + '/' + item.filename
                        setNowPlaying({ path: filePath, title: item.title || item.filename })
                        setFilter('player')
                      }
                      setPlayNotification(null)
                    }}
                    className="flex-1 bg-amber-500 hover:bg-amber-400 text-black text-[10px] font-black py-1.5 px-3 rounded-lg transition-all"
                  >
                    ▶ Reproducir
                  </button>
                  <button
                    onClick={() => setPlayNotification(null)}
                    className="text-[10px] text-white/40 hover:text-white/70 px-2 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── PlayerTab Helper Component ───
function PlayerTab({ downloads, nowPlaying, onPlay }: {
  downloads: DownloadItem[]
  nowPlaying: { path: string; title: string } | null
  onPlay: (item: DownloadItem) => void
}) {
  return (
    <div className="flex h-full">
      {/* Playlist sidebar */}
      <div className="w-64 flex-shrink-0 border-r border-white/5 flex flex-col bg-black/20">
        <div className="px-4 py-3 border-b border-white/5">
          <h3 className="text-[11px] font-black uppercase tracking-widest text-amber-400 flex items-center gap-2">
            <span>🎬</span> Mis Videos
          </h3>
          <p className="text-[9px] text-white/30 mt-0.5">{downloads.length} video{downloads.length !== 1 ? 's' : ''} disponible{downloads.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          {downloads.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3 text-white/20">
              <span className="text-3xl">📂</span>
              <p className="text-[11px] text-center px-4">Descarga un video para verlo aquí</p>
            </div>
          ) : (
            downloads.map(item => (
              <button
                key={item.id}
                onClick={() => onPlay(item)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-all text-left group ${
                  nowPlaying?.title === (item.title || item.filename) ? 'bg-amber-500/10 border-r-2 border-amber-500' : ''
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {item.thumbnail ? (
                    <img src={item.thumbnail} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm">🎞️</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold text-white/80 truncate group-hover:text-white transition-colors">
                    {item.title || item.filename || 'Video sin título'}
                  </p>
                  <p className="text-[9px] text-white/30">{item.filename?.split('.').pop()?.toUpperCase() || 'VIDEO'}</p>
                </div>
                <span className="text-white/20 group-hover:text-amber-400 transition-colors text-sm">▶</span>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Video Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {nowPlaying ? (() => {
          // Pass the fully URL-encoded raw path to the custom protocol
          const mediaUrl = `media://${encodeURIComponent(nowPlaying.path)}`
          console.log('[Player] media URL:', mediaUrl)
          return (
            <VideoPlayer
              url={mediaUrl}
              title={nowPlaying.title}
            />
          )
        })() : (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-white/20">
            <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center">
              <span className="text-5xl">🎬</span>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-white/40">Reproductor Pro</p>
              <p className="text-[12px] text-white/20 mt-1">Selecciona un video de la lista para reproducirlo</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
