// Type declarations for the Electron API exposed via contextBridge

export interface DownloadProgressData {
  id: string
  line: string
  percent?: number | null
  totalSize?: string | null
  speed?: string | null
  eta?: string | null
  filename?: string | null
  title?: string | null
  infoHash?: string
  peers?: number
  seeds?: number
  uploadSpeed?: number
  ratio?: number
  isPaused?: boolean
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
  size?: string
  filename?: string
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
  customTrackers?: string[]
  highSpeedMode?: boolean
}

declare global {
  interface Window {
    electronAPI: {
      minimize: () => Promise<void>
      maximize: () => Promise<void>
      close: () => Promise<void>
      readClipboard: () => Promise<string>
      openFolderDialog: () => Promise<string | null>
      openFolder: (path: string) => Promise<void>
      showItemInFolder: (path: string) => Promise<void>
      getVideoFormats: (url: string) => Promise<{ success: boolean, formats?: any[], error?: string }>
      startDownload: (options: StartDownloadOptions) => Promise<{ ok: boolean; error?: string; outputDir?: string }>
      cancelDownload: (id: string, deleteFiles?: boolean) => Promise<{ ok: boolean; error?: string }>
      getVideoInfo: (url: string) => Promise<VideoInfo>
      loadHistory: () => Promise<any[]>
      saveHistory: (items: any[]) => Promise<void>
      clearHistory: (items: any[]) => Promise<any[]>
      pauseDownload: (id: string) => Promise<{ ok: boolean; error?: string }>
      resumeDownload: (id: string) => Promise<{ ok: boolean; error?: string }>
      getSuggestions: (query: string) => Promise<string[]>
      searchVideos: (query: string, limit?: number) => Promise<any[]>
      searchMusic: (query: string, limit?: number) => Promise<any[]>
      searchMovies: (query: string) => Promise<any[]>
      getMovieMagnets: (url: string) => Promise<string | null>
      scrapeTorrent: (url: string) => Promise<{ success: boolean, data?: { type: 'magnet' | 'torrent', links: any[] }, error?: string, detail?: string }>
      downloadTorrent: (options: any) => Promise<{ success: boolean, data?: any, error?: string, detail?: string }>
      onDownloadProgress: (callback: (data: DownloadProgressData) => void) => () => void
      onDownloadCompleted: (callback: (data: DownloadCompletedData) => void) => () => void
    }
  }
}
