// Type declarations for the Electron API exposed via contextBridge

export interface DownloadProgressData {
  id: string
  line: string
  percent?: number | null
  totalSize?: string | null
  speed?: string | null
  eta?: string | null
  filename?: string | null
  peers?: number
  error?: boolean
}

export interface DownloadCompletedData {
  id: string
  success: boolean
  code?: number
  error?: string
}

export interface VideoInfo {
  ok: boolean
  title?: string
  duration?: number
  thumbnail?: string
  uploader?: string
  extractor?: string
  error?: string
}

export interface VideoFormat {
  formatId: string
  extension: string
  resolution: string
  height?: number
  width?: number
  note: string
  filesize?: number
  fps?: number
  vcodec?: string
  acodec?: string
  isDynamic?: boolean
}

export interface StartDownloadOptions {
  id: string
  url: string
  outputDir: string
  audioOnly: boolean
  isTorrent?: boolean
  useCookies: boolean
  cookiesBrowser: string
  formatId?: string
}

declare global {
  interface Window {
    electronAPI: {
      // Window controls
      minimize: () => Promise<void>
      maximize: () => Promise<void>
      close: () => Promise<void>
      
      // Clipboard & Dialogs
      readClipboard: () => Promise<string>
      openFolderDialog: () => Promise<string | null>
      openFolder: (path: string) => Promise<void>
      showItemInFolder: (path: string) => Promise<void>
      
      // YT-DLP / Basic Downloads
      getVideoFormats: (url: string) => Promise<{ success: boolean, formats?: VideoFormat[], error?: string }>
      getVideoInfo: (url: string) => Promise<VideoInfo>
      startDownload: (options: StartDownloadOptions) => Promise<{ ok: boolean; error?: string }>
      cancelDownload: (id: string) => Promise<{ ok: boolean; error?: string }>
      pauseDownload: (id: string) => Promise<{ ok: boolean }>
      resumeDownload: (id: string) => Promise<{ ok: boolean }>
      
      // History
      loadHistory: () => Promise<any[]>
      saveHistory: (items: any[]) => Promise<void>
      clearHistory: (items: any[]) => Promise<any[]>
      
      // Search Engine
      getSuggestions: (query: string) => Promise<string[]>
      searchVideos: (query: string, limit?: number) => Promise<any[]>
      searchMusic: (query: string, limit?: number) => Promise<any[]>
      searchMovies: (query: string) => Promise<any[]>
      getMovieMagnets: (url: string) => Promise<any[]>
      expandPlaylist: (url: string) => Promise<any>
      
      // Torrent Engine
      scrapeTorrent: (url: string) => Promise<any>
      downloadTorrent: (options: any) => Promise<any>
      
      // App
      checkUpdates: () => Promise<any>
      validateLicense: (key: string) => Promise<{ valid: boolean; user?: string; error?: string }>
      getLicenseStatus: () => Promise<{ isPro: boolean; key?: string; user?: string }>
      
      // Listeners
      onDownloadProgress: (callback: (data: DownloadProgressData) => void) => () => void
      onDownloadCompleted: (callback: (data: DownloadCompletedData) => void) => () => void
    }
  }
}
