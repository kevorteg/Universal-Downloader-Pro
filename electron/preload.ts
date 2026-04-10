import { contextBridge, ipcRenderer } from 'electron'

// ─────────────────────────────────────────
// Expose safe Electron APIs to renderer
// ─────────────────────────────────────────
contextBridge.exposeInMainWorld('electronAPI', {
  // Window controls
  minimize: () => ipcRenderer.invoke('window:minimize'),
  maximize: () => ipcRenderer.invoke('window:maximize'),
  close: () => ipcRenderer.invoke('window:close'),

  // Clipboard
  readClipboard: () => ipcRenderer.invoke('clipboard:read'),

  // Dialogs
  openFolderDialog: () => ipcRenderer.invoke('dialog:openFolder'),

  // Shell
  openFolder: (path: string) => ipcRenderer.invoke('shell:openFolder', path),
  showItemInFolder: (path: string) => ipcRenderer.invoke('shell:showItemInFolder', path),

  // Downloads
  startDownload: (options: {
    id: string
    url: string
    outputDir: string
    audioOnly: boolean
    isTorrent?: boolean
    useCookies: boolean
    cookiesBrowser: string
    format?: string
  }) => ipcRenderer.invoke('download:start', options),

  getVideoFormats: (url: string) => ipcRenderer.invoke('video:getFormats', url),

  cancelDownload: (id: string) => ipcRenderer.invoke('download:cancel', id),
  pauseDownload: (id: string) => ipcRenderer.invoke('download:pause', id),
  resumeDownload: (id: string) => ipcRenderer.invoke('download:resume', id),

  getVideoInfo: (url: string) => ipcRenderer.invoke('download:getInfo', url),
  
  loadHistory: () => ipcRenderer.invoke('history:load'),
  saveHistory: (items: any[]) => ipcRenderer.invoke('history:save', items),
  clearHistory: (items: any[]) => ipcRenderer.invoke('history:clearCompleted', items),

  // Search (Premium Search Engine)
  getSuggestions: (query: string) => ipcRenderer.invoke('video:getSuggestions', query),
  searchVideos: (query: string, limit?: number) => ipcRenderer.invoke('video:searchVideos', query, limit),
  searchMusic: (query: string, limit?: number) => ipcRenderer.invoke('video:searchMusic', query, limit),
  searchMovies: (query: string) => ipcRenderer.invoke('video:searchMovies', query),
  getMovieMagnets: (url: string) => ipcRenderer.invoke('video:getMovieMagnets', url),
  
  // Robust Torrents
  scrapeTorrent: (url: string) => ipcRenderer.invoke('torrent:scrape', url),
  downloadTorrent: (options: any) => ipcRenderer.invoke('torrent:download', options),

  // Listeners for download progress
  onDownloadProgress: (
    callback: (data: {
      id: string
      line: string
      percent?: number | null
      totalSize?: string | null
      speed?: string | null
      eta?: string | null
      filename?: string | null
      error?: boolean
    }) => void
  ) => {
    const listener = (_event: Electron.IpcRendererEvent, data: any) => callback(data)
    ipcRenderer.on('download:progress', listener)
    return () => ipcRenderer.removeListener('download:progress', listener)
  },

  onDownloadCompleted: (
    callback: (data: { id: string; success: boolean; code?: number; error?: string }) => void
  ) => {
    const listener = (_event: Electron.IpcRendererEvent, data: any) => callback(data)
    ipcRenderer.on('download:completed', listener)
    return () => ipcRenderer.removeListener('download:completed', listener)
  }
})

// Type declarations are in src/electron.d.ts
