export type DownloadStatus =
  | 'queued'
  | 'downloading'
  | 'completed'
  | 'error'
  | 'cancelled'
  | 'paused'

export interface DownloadItem {
  id: string
  url: string // Can be a URL, Magnet, or file path
  title: string
  outputDir: string
  audioOnly: boolean
  isTorrent?: boolean // For torrents
  status: DownloadStatus
  progress: number           // 0–100
  speed: string              // e.g. "2.5MiB/s"
  eta: string                // e.g. "00:30"
  totalSize: string          // e.g. "123.45MiB"
  filename: string
  addedAt: number            // timestamp
  completedAt?: number
  logs: string[]             // raw yt-dlp output lines or torrent events
  thumbnail?: string
  uploader?: string
  extractor?: string
  duration?: number
  error?: string
  infoHash?: string          // Torrent infoHash
  peers?: number             // Number of connected peers
  seeds?: number             // Number of seeds
  downloadSpeed?: number     // Raw bytes/s
  uploadSpeed?: number       // Raw bytes/s
  ratio?: number             // Upload / Download ratio
  totalDownloaded?: number   // Raw bytes
  totalUploaded?: number     // Raw bytes
  timeRemaining?: number     // Raw ms
  isPaused?: boolean         // Torrent pause state
}

export type SidebarFilter =
  | 'all'
  | 'downloading'
  | 'completed'
  | 'error'
  | 'queued'
  | 'audio'
  | 'video'
  | 'torrent'
  | 'search'

export interface SearchResult {
  title: string
  url: string
  thumbnail?: string
  year?: string
  uploader?: string    // For YouTube/General
  duration?: string    // For YouTube/General
  type: 'video' | 'audio' | 'movie'
  quality?: string
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

export interface AppSettings {
  outputDir: string
  useCookies: boolean
  cookiesBrowser: 'chrome' | 'firefox' | 'edge' | 'safari' | 'chromium'
  preferredQuality: string // 'best' | '2160' | '1080' | '720' | '480'
  defaultAudioOnly: boolean
  autoStartOnBoot: boolean
  customTrackers: string[]
  highSpeedMode: boolean
  licenseKey: string
  showDailyVerse: boolean
}
