// Type declarations for the Electron API exposed via contextBridge

export interface DownloadProgressData {
  id: string
  line: string
  percent?: number | null
  totalSize?: string | null
  speed?: string | null
  eta?: string | null
  filename?: string | null
  infoHash?: string
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
      minimize: () => Promise<void>
      maximize: () => Promise<void>
      close: () => Promise<void>
      readClipboard: () => Promise<string>
      openFolderDialog: () => Promise<string | null>
      openFolder: (path: string) => Promise<void>
      showItemInFolder: (path: string) => Promise<void>
      getVideoFormats: (url: string) => Promise<{ success: boolean, formats?: any[], error?: string }>
      startDownload: (options: StartDownloadOptions) => Promise<{ ok: boolean; error?: string }>
      cancelDownload: (id: string) => Promise<{ ok: boolean; error?: string }>
      getVideoInfo: (url: string) => Promise<VideoInfo>
      loadHistory: () => Promise<any[]>
      saveHistory: (items: any[]) => Promise<void>
      clearHistory: (items: any[]) => Promise<any[]>
      onDownloadProgress: (callback: (data: DownloadProgressData) => void) => () => void
      onDownloadCompleted: (callback: (data: DownloadCompletedData) => void) => () => void
    }
  }
}
