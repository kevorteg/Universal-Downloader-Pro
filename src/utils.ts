import { AppSettings } from './types'
import { homedir } from 'os'

const STORAGE_KEY = 'ud_settings'
const DOWNLOADS_KEY = 'ud_downloads'

export function isProUser(settings: AppSettings): boolean {
  // Simple validation for Phase 1
  return settings.licenseKey.toUpperCase() === 'PRO_USER_2024' || settings.licenseKey.length > 15
}

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
    autoStartOnBoot: false,
    customTrackers: [],
    highSpeedMode: false,
    licenseKey: '',
    showDailyVerse: true
  }
}

export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {}
}

export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 B'
  if (!bytes) return '—'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

export function formatSpeed(bytesPerSec: number | undefined): string {
  if (bytesPerSec === undefined || bytesPerSec === 0) return '0 B/s'
  return formatBytes(bytesPerSec) + '/s'
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

export function cleanTorrentName(name: string): string {
  if (!name) return 'Torrent'
  
  let clean = name
    .replace(/[._-]/g, ' ')
    .replace(/\b(WEB-DL|WEBRip|HDRip|BluRay|BRRip|DVDRip|H264|x264|x265|HEVC|1080h?p|720h?p|480h?p|576p|Dual-Lat|Dual|Multi|Sub|AAC|DTS|AC3|REMUX|UNCUT|Repack|RIP|Latino|Castellano|KORSUB|WEB|DL|DVDRip|BDRip|XviD|MP3|FLAC|ALAC|WAV|320kbps|Quality|Size|Complete|S\d+E\d+|Season\s*\d+|Pack|Collection|S\d+|WEB[ \-]DL|CAMRip|TS|TELESYNC|VODRip|TVRip|PDTV|DSR|DTH|SATRip|DVB|Brip|BRip|H265|AVC|DD5\.1|DD\+5\.1|Atmos|TrueHD|DTS-HD|MA|XVID|2160p|4K|UltraHD|UHD)\b/gi, '')
    .replace(/\[[^\]]*\]/g, '')
    .replace(/\([^\)]*\)/g, '')
    .replace(/\b(19|20)\d{2}\b/g, '')
    .replace(/\s+/g, ' ')
    .trim()

  if (clean.length > 90) {
    clean = clean.substring(0, 87).trim() + '...'
  }
  
  return clean || 'Torrent'
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
