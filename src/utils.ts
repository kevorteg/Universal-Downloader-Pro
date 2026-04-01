import { AppSettings } from './types'
import { homedir } from 'os'

const STORAGE_KEY = 'ud_settings'
const DOWNLOADS_KEY = 'ud_downloads'

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return {
    outputDir: '',
    useCookies: false,
    cookiesBrowser: 'chrome',
    preferredQuality: 'best',
  defaultAudioOnly: false,
    autoStartOnBoot: false
  }
}

export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {}
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
  return `${m}:${String(s).padStart(2,'0')}`
}

export function cleanUrl(url: string): string {
  return url.trim().replace(/\s+/g, '')
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

export function getDomainFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '')
  } catch {
    return url
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'downloading': return '#c026d3'
    case 'completed': return '#22c55e'
    case 'error': return '#ef4444'
    case 'queued': return '#eab308'
    case 'cancelled': return '#666'
    case 'paused': return '#3b82f6'
    default: return '#666'
  }
}

export function getStatusLabel(status: string): string {
  switch (status) {
    case 'downloading': return 'Descargando'
    case 'completed': return 'Completado'
    case 'error': return 'Error'
    case 'queued': return 'En cola'
    case 'cancelled': return 'Cancelado'
    case 'paused': return 'Pausado'
    default: return status
  }
}
