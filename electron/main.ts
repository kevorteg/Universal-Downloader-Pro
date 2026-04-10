import {
  app,
  BrowserWindow,
  ipcMain,
  Tray,
  Menu,
  shell,
  dialog,
  clipboard,
  Notification,
  nativeImage
} from 'electron'
import { join } from 'path'
import { spawn, ChildProcess } from 'child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'fs'
import { readFile, writeFile, unlink } from 'fs/promises'
import { homedir, hostname, userInfo } from 'os'
import { createHash } from 'crypto'
import { registerTorrentHandlers } from './ipc-handlers'

const DANGEROUS_EXTENSIONS = ['.exe', '.scr', '.msi', '.bat', '.cmd', '.vbs', '.js', '.jse', '.wsf', '.wsh']

function checkTorrentSafety(torrent: any): { safe: boolean, reason?: string } {
  for (const file of torrent.files) {
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase()
    if (DANGEROUS_EXTENSIONS.includes(ext)) {
      return { safe: false, reason: `Amenaza detectada: archivo ${ext} sospechoso.` }
    }
  }
  return { safe: true }
}

// Helper to clean torrent names - more aggressive
function cleanTorrentName(name: string): string {
  if (!name) return 'Torrent'
  
  let clean = name
    // Replace dots, underscores, dashes with spaces
    .replace(/[._-]/g, ' ')
    // Remove technical metadata / scene tags
    .replace(/\b(WEB-DL|WEBRip|HDRip|BluRay|BRRip|DVDRip|H264|x264|x265|HEVC|1080h?p|720h?p|480h?p|576p|Dual-Lat|Dual|Multi|Sub|AAC|DTS|AC3|REMUX|UNCUT|Repack|RIP|Latino|Castellano|KORSUB|WEB|DL|DVDRip|BDRip|XviD|MP3|FLAC|ALAC|WAV|320kbps|Quality|Size|Complete|S\d+E\d+|Season\s*\d+|Pack|Collection|S\d+|WEB[ \-]DL|CAMRip|TS|TELESYNC|VODRip|TVRip|PDTV|DSR|DTH|SATRip|DVB|Brip|BRip|H265|AVC|DD5\.1|DD\+5\.1|Atmos|TrueHD|DTS-HD|MA|XVID|2160p|4K|UltraHD|UHD)\b/gi, '')
    // Remove brackets and parentheses contents if they match common patterns
    .replace(/\[[^\]]*\]/g, '')
    .replace(/\([^\)]*\)/g, '')
    // Remove years like 2024
    .replace(/\b(19|20)\d{2}\b/g, '')
    // Collapse spaces
    .replace(/\s+/g, ' ')
    .trim()

  // Max 90 characters
  if (clean.length > 90) {
    clean = clean.substring(0, 87).trim() + '...'
  }
  
  return clean || 'Torrent'
}

function formatETA(ms: number): string {
  if (!ms || ms === Infinity) return '--:--'
  const seconds = Math.floor(ms / 1000)
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}


// Dynamic import of webtorrent handled below

// ─────────────────────────────────────────
// State
let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null
const activeProcesses = new Map<string, ChildProcess>()
const activeTorrents = new Map<string, any>()
const HISTORY_FILE = join(app.getPath('userData'), 'downloads.json')
const LICENSE_FILE = join(app.getPath('userData'), 'license.json')

// ─────────────────────────────────────────
// History Manager
// ─────────────────────────────────────────
class HistoryManager {
  static async load() {
    try {
      if (!existsSync(HISTORY_FILE)) {
        return []
      }
      const data = await readFile(HISTORY_FILE, 'utf-8')
      const items = JSON.parse(data)
      
      // Cleanup: all "downloading" or "queued" items from last session
      // should be marked as "paused" or "error" since the process died
      return items.map((item: any) => {
        if (item.status === 'downloading' || item.status === 'queued') {
          return { ...item, status: 'paused', progress: item.progress || 0 }
        }
        return item
      })
    } catch (error) {
      console.error('Error loading history:', error)
      return []
    }
  }

  static async save(items: any[]) {
    try {
      // Don't save logs to keep the file small, or save only last N lines
      const dataToSave = items.map(item => ({
        ...item,
        logs: [] // We don't persist full logs to prevent bloat
      }))
      await writeFile(HISTORY_FILE, JSON.stringify(dataToSave, null, 2))
    } catch (error) {
      console.error('Error saving history:', error)
    }
  }
}

// ─────────────────────────────────────────
// License Manager
// ─────────────────────────────────────────
const LICENSE_SALT = 'ud_pro_secure_signature_2024'; // In a real app, this should be more obscured

class LicenseManager {
  private static getMachineId() {
    return createHash('sha256')
      .update(hostname() + userInfo().username + process.arch)
      .digest('hex');
  }

  private static generateSignature(key: string, instanceId: string) {
    return createHash('sha256')
      .update(key + instanceId + this.getMachineId() + LICENSE_SALT)
      .digest('hex');
  }

  static async getStatus() {
    try {
      if (!existsSync(LICENSE_FILE)) return { isPro: false };
      const data = await readFile(LICENSE_FILE, 'utf-8');
      const info = JSON.parse(data);

      // Check signature to prevent manual editing
      const expectedSignature = this.generateSignature(info.key, info.instanceId);
      if (info.signature !== expectedSignature) {
        console.warn('[LICENSE] Signature mismatch - tampering detected.');
        return { isPro: false };
      }

      return { isPro: true, ...info };
    } catch (err) {
      return { isPro: false };
    }
  }

  static async save(info: { key: string, instanceId: string, user: string }) {
    try {
      const signature = this.generateSignature(info.key, info.instanceId);
      const data = { ...info, signature, isPro: true, lastVerified: Date.now() };
      await writeFile(LICENSE_FILE, JSON.stringify(data, null, 2));
      return true;
    } catch (err) {
      return false;
    }
  }

  static async verifyOnline() {
    const status = await this.getStatus();
    if (!status.isPro) return false;

    try {
      // Logic to verify with Lemon Squeezy if online
      const response = await fetch('https://api.lemonsqueezy.com/v1/licenses/validate', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          license_key: status.key,
          instance_id: status.instanceId
        })
      });

      const data: any = await response.json();
      if (data.valid) {
        // Update lastVerified timestamp
        await this.save({ key: status.key, instanceId: status.instanceId, user: status.user });
        return true;
      } else {
        // Invalid key
        rmSync(LICENSE_FILE);
        return false;
      }
    } catch (err) {
      // Offline - check grace period (e.g., 30 days)
      const lastVerified = (status as any).lastVerified || 0;
      const thirtyDays = 30 * 24 * 60 * 60 * 1000;
      if (Date.now() - lastVerified < thirtyDays) {
        return true; // Still within grace period
      }
      return false;
    }
  }
}

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged
const isPackaged = app.isPackaged
const binPath = isPackaged 
  ? join(process.resourcesPath, 'bin') 
  : join(process.cwd(), 'bin');

const YT_DLP_EXE = existsSync(join(binPath, 'yt-dlp.exe')) ? join(binPath, 'yt-dlp.exe') : 'yt-dlp';
const FFMPEG_LOCATION = existsSync(join(binPath, 'ffmpeg.exe')) ? binPath : undefined;

// Look for verses.json in multiple possible locations
let foundVersesPath = join(__dirname, 'verses.json');
if (!existsSync(foundVersesPath)) {
  foundVersesPath = join(process.cwd(), 'electron', 'verses.json');
}
const VERSES_FILE = foundVersesPath;

// --- SPIRITUAL SYSTEM ---
function showDailyVerse() {
  try {
    const raw = readFileSync(VERSES_FILE, 'utf-8');
    const verses = JSON.parse(raw);
    const verse = verses[Math.floor(Math.random() * verses.length)];
    
    if (Notification.isSupported()) {
      new Notification({
        title: '📖 Versículo del día',
        body: `"${verse.text}" — ${verse.ref}`,
        silent: true
      }).show();
    }
  } catch (err) {
    console.error('Error showing verse:', err);
  }
}

// ─────────────────────────────────────────
// Create main window
// ─────────────────────────────────────────
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    frame: false,
    backgroundColor: '#141414',
    titleBarStyle: 'hidden',
    icon: join(__dirname, '../public/icon.png'),
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    // mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(join(__dirname, '../dist/index.html'))
  }

  // Activar sistema de torrents modular
  registerTorrentHandlers(mainWindow, activeTorrents);

  // Activar sistema espiritual con delay
  setTimeout(showDailyVerse, 5000);

  // Minimize to tray instead of closing
  mainWindow.on('close', (event) => {
    event.preventDefault()
    mainWindow?.hide()
    showTrayNotification()
  })

  mainWindow.on('minimize', (event) => {
    event.preventDefault()
    mainWindow?.hide()
  })
}

// ─────────────────────────────────────────
// System Tray
// ─────────────────────────────────────────
function createTray() {
  // Use a simple colored icon if file doesn't exist
  const iconPath = join(__dirname, '../public/icon.png')
  let trayIcon: Electron.NativeImage

  if (existsSync(iconPath)) {
    trayIcon = nativeImage.createFromPath(iconPath)
    trayIcon = trayIcon.resize({ width: 16, height: 16 })
  } else {
    // Create a simple 16x16 magenta pixel icon from base64
    const base64Icon =
      'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAdgAAAHYBTnsmCAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAABSSURBVDiNY/z//z8DJYCJgUIw8A0YNYDRAFIHjBpAaQCpA0YNoNQBpA4YNYBKBzA8+P8fAJ18igFgNGDUAEYDSB0wagClAaQOGDWAzAEA78EHFWXsVFEAAAAASUVORK5CYII='
    trayIcon = nativeImage.createFromDataURL(`data:image/png;base64,${base64Icon}`)
  }

  tray = new Tray(trayIcon)

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Mostrar aplicación',
      click: () => {
        mainWindow?.show()
        mainWindow?.focus()
      }
    },
    { type: 'separator' },
    {
      label: 'Salir',
      click: () => {
        app.quit()
      }
    }
  ])

  tray.setContextMenu(contextMenu)
  tray.setToolTip('Universal Downloader')

  tray.on('double-click', () => {
    mainWindow?.show()
    mainWindow?.focus()
  })
}

function showTrayNotification() {
  if (Notification.isSupported()) {
    const notification = new Notification({
      title: 'Universal Downloader',
      body: 'La aplicación sigue ejecutándose en la bandeja del sistema.',
      silent: true
    })
    notification.show()
  }
}

// ─────────────────────────────────────────
// Helper: parse yt-dlp progress line
// ─────────────────────────────────────────
function parseProgress(line: string) {
  // Example: [download]  45.2% of 123.45MiB at 2.50MiB/s ETA 00:30
  const pctMatch = line.match(/(\d+\.?\d*)%/)
  const sizeMatch = line.match(/of\s+([\d.]+\s*\w+iB)/)
  const speedMatch = line.match(/at\s+([\d.]+\s*\w+iB\/s)/)
  const etaMatch = line.match(/ETA\s+(\d+:\d+)/)
  const fileMatch = line.match(/\[download\] Destination: (.+)/)

  return {
    percent: pctMatch ? parseFloat(pctMatch[1]) : null,
    totalSize: sizeMatch ? sizeMatch[1] : null,
    speed: speedMatch ? speedMatch[1] : null,
    eta: etaMatch ? etaMatch[1] : null,
    filename: fileMatch ? fileMatch[1].trim() : null
  }
}

// ─────────────────────────────────────────
// IPC Handlers
// ─────────────────────────────────────────

// Window controls
ipcMain.handle('window:minimize', () => mainWindow?.hide())
ipcMain.handle('window:maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize()
  } else {
    mainWindow?.maximize()
  }
})
ipcMain.handle('window:close', () => {
  mainWindow?.hide()
})

// Clipboard
ipcMain.handle('clipboard:read', () => clipboard.readText())

// Open folder dialog
ipcMain.handle('dialog:openFolder', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openDirectory'],
    title: 'Seleccionar carpeta de descarga'
  })
  return result.canceled ? null : result.filePaths[0]
})

// Open file or folder in explorer
ipcMain.handle('shell:openFolder', async (_event, folderPath: string) => {
  if (!folderPath) {
    const defaultPath = join(app.getPath('downloads'), 'UniversalDownloader');
    if (existsSync(defaultPath)) await shell.openPath(defaultPath);
    return;
  }
  if (existsSync(folderPath)) {
    await shell.openPath(folderPath)
  }
})

ipcMain.handle('shell:showItemInFolder', (_event, filePath: string) => {
  shell.showItemInFolder(filePath)
})

// Start download
ipcMain.handle('video:getFormats', async (event, url: string) => {
  return new Promise((resolve) => {
    // Usamos -J para obtener el JSON completo sin descargar
    const args = ['--dump-json', '--no-playlist', '--restrict-filenames', url]
    const proc = spawn(YT_DLP_EXE, args)
    
    let output = ''
    proc.stdout.on('data', (data) => {
      output += data.toString()
    })

    proc.on('close', (code) => {
      if (code === 0) {
        try {
          const info = JSON.parse(output)
          const rawFormats = info.formats || []
          
          // Filtrar y agrupar formatos útiles
          const formats = rawFormats
            .filter((f: any) => {
              // Filtrar formatos que no son útiles (sin video y sin audio real)
              const hasVideo = f.vcodec !== 'none' && f.vcodec !== undefined;
              const hasAudio = f.acodec !== 'none' && f.acodec !== undefined;
              return hasVideo || hasAudio;
            })
            .map((f: any) => {
              const isCombined = f.vcodec !== 'none' && f.acodec !== 'none' && f.vcodec !== undefined && f.acodec !== undefined;
              return {
                formatId: f.format_id,
                extension: f.ext,
                resolution: f.resolution || (f.height ? `${f.width}x${f.height}` : 'audio only'),
                height: f.height,
                width: f.width,
                note: f.format_note || '',
                filesize: f.filesize || f.filesize_approx,
                fps: f.fps,
                vcodec: f.vcodec,
                acodec: f.acodec,
                isCombined
              };
            })
            .sort((a: any, b: any) => {
              // Priorizar formatos combinados
              if (a.isCombined && !b.isCombined) return -1;
              if (!a.isCombined && b.isCombined) return 1;
              // Luego por altura (resolución)
              return (b.height || 0) - (a.height || 0);
            });

          // Siempre añadir una opción de 'Lo mejor disponible' como fallback seguro al inicio
          formats.unshift({
            formatId: 'bestvideo+bestaudio/best',
            extension: 'mp4/mkv',
            resolution: 'Lo mejor disponible',
            note: 'Selección automática (Recomendado)',
            isCombined: true
          });

          resolve({ success: true, formats })
        } catch (e) {
          resolve({ success: false, error: 'Error al parsear formatos' })
        }
      } else {
        resolve({ success: false, error: 'Error al obtener formatos' })
      }
    })

    proc.on('error', (err) => {
      resolve({ success: false, error: err.message })
    })
  })
})
async function performSearch(query: string, limit: number = 12) {
  console.log(`[SEARCH] Query: ${query} (limit: ${limit})`);
  return new Promise<any[]>((resolve) => {
    // Avoid shell:true to prevent argument parsing issues with spaces
    // yt-dlp arguments should be separate
    const args = ['-J', '--no-playlist', '--flat-playlist', `ytsearch${limit}:${query}`]
    const proc = spawn(YT_DLP_EXE, args)
    
    let output = ''
    let errOutput = ''
    proc.stdout.on('data', (data) => { output += data.toString() })
    proc.stderr.on('data', (data) => { errOutput += data.toString() })

    proc.on('close', (code) => {
      if (code === 0) {
        try {
          const info = JSON.parse(output)
          const entries = info.entries || []
          console.log(`[SEARCH] Results found: ${entries.length}`);
          resolve(entries.map((e: any) => ({
            title: e.title,
            url: e.url || e.webpage_url,
            thumbnail: e.thumbnail || (e.thumbnails && e.thumbnails[0]?.url),
            uploader: e.uploader || e.channel,
            duration: e.duration_string || (e.duration ? `${Math.floor(e.duration / 60)}:${String(e.duration % 60).padStart(2, '0')}` : ''),
            type: 'video'
          })))
        } catch (e) { 
          console.error('[SEARCH] Parse error:', e);
          resolve([]) 
        }
      } else { 
        console.error(`[SEARCH] Proc exit code ${code}. Error: ${errOutput}`);
        resolve([]) 
      }
    })
    proc.on('error', (err) => { 
      console.error('[SEARCH] Critical spawn error:', err);
      resolve([]) 
    })
  })
}

ipcMain.handle('video:searchVideos', async (_event, query: string, limit?: number) => {
  return await performSearch(query, limit || 12);
})

ipcMain.handle('video:searchMusic', async (_event, query: string, limit?: number) => {
  // Optimizamos la búsqueda para música añadiendo palabras clave
  const musicQuery = `${query} official audio`;
  return await performSearch(musicQuery, limit || 12);
})

// Unified WebTorrent error listener
function setupTorrentClient(client: any) {
  client.on('error', (err: any) => {
    console.error('[TORRENT CLIENT GLOBAL ERROR]', err);
  });
}

ipcMain.handle('video:searchMovies', async (_event, query: string) => {
  // Call PelisPanda search directly (extracted logic)
  const results = await fetchPelisPandaResults(query);
  return results.map(r => ({ ...r, type: 'movie' }));
})

ipcMain.handle('video:getSuggestions', async (_event, query: string) => {
  try {
    const response = await fetch(`https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=${encodeURIComponent(query)}`);
    const data = await response.json();
    return data[1] || []; // Index 1 has the array of strings
  } catch (e) {
    return [];
  }
})

async function fetchPelisPandaResults(query: string) {
  try {
    const searchUrl = `https://pelispanda.org/wp-json/wpreact/v1/search?query=${encodeURIComponent(query)}&posts_per_page=36&page=1`
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': `https://pelispanda.org/search/?query=${encodeURIComponent(query)}`,
        'Accept': 'application/json'
      }
    })
    const data = await response.json()
    if (!data.results || !Array.isArray(data.results)) return []
    return data.results.map((item: any) => ({
      url: `https://pelispanda.org/${item.type || 'pelicula'}/${item.slug}`,
      thumbnail: item.featured || item.background_image,
      title: item.title,
      year: item.year
    }))
  } catch (error) {
    console.error('Search error:', error)
    return []
  }
}


ipcMain.handle('download:start', async (event, options: {
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
}) => {
  const { id, url, outputDir, audioOnly, isTorrent, useCookies, cookiesBrowser, formatId, highSpeedMode } = options

  const finalOutputDir = outputDir || join(app.getPath('downloads'), 'UniversalDownloader');
  if (!existsSync(finalOutputDir)) {
    mkdirSync(finalOutputDir, { recursive: true });
  }

  // --- WEBTORRENT IMPLEMENTATION (DELEGATED) ---
  if (isTorrent) {
    // Note: The actual initialization is now handled in ipc-handlers via torrent:download
    // We just return success here as the renderer will handle the call subsequently
    return { ok: true, outputDir: finalOutputDir }
  }

  // --- YT-DLP IMPLEMENTATION ---
  const templateName = audioOnly ? '%(title).100s [%(id)s].mp3' : '%(title).100s [%(id)s].%(ext)s';
  const outputTemplate = join(finalOutputDir, templateName);

  const availableBrowsers = [cookiesBrowser || 'firefox', 'chrome', 'edge', 'brave'];
  let currentBrowserIndex = 0;

  const startProcess = (browserIndex: number) => {
    const browser = availableBrowsers[browserIndex];
    
    // Construcción de argumentos SIN comillas manuales (Node.js las añade automáticamente si hay espacios)
    const args: string[] = [
      url,
      '--newline',
      '--no-colors',
      '--no-playlist',
      '--restrict-filenames',
      '--windows-filenames',
      '--no-part',
      '--no-mtime',
      '-o', outputTemplate,
      '--merge-output-format', 'mp4',
      '--prefer-ffmpeg',
      '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      '--geo-bypass'
    ];

    if (useCookies) {
      args.push('--cookies-from-browser', browser);
    }

    if (FFMPEG_LOCATION) {
      args.push('--ffmpeg-location', FFMPEG_LOCATION);
    }

    if (audioOnly) {
      // Optimizamos para MP3 con metadatos y carátula
      args.push(
        '-f', 'ba/best', 
        '-x', 
        '--audio-format', 'mp3', 
        '--audio-quality', '0',
        '--add-metadata',
        '--embed-thumbnail'
      );
    } else {
      const safeFormat = formatId 
        ? `${formatId}/bestvideo+bestaudio/best` 
        : 'bestvideo+bestaudio/best';
      args.push('-f', safeFormat);
    }

    console.log(`[SISTEMA] Intentando descarga (${browser}):`, YT_DLP_EXE, args.join(' '));

    const proc = spawn(YT_DLP_EXE, args, {
      cwd: finalOutputDir,
      stdio: ['ignore', 'pipe', 'pipe']
    });

    activeProcesses.set(id, proc);
    let lastErrorLine = '';

    const handleData = (chunk: Buffer) => {
      const lines = chunk.toString().split('\n');
      lines.forEach(line => {
        const trimmed = line.trim();
        if (trimmed) {
          const parsed = parseProgress(trimmed);
          (event as any).sender.send('download:progress', {
            id,
            line: trimmed,
            ...parsed,
            status: 'downloading'
          });
        }
      });
    };

    const handleErrorData = (chunk: Buffer) => {
      const line = chunk.toString().trim();
      if (line) {
        lastErrorLine = line;
        handleData(chunk);
      }
    };

    proc.stdout.on('data', handleData);
    proc.stderr.on('data', handleErrorData);

    proc.on('close', (code) => {
      activeProcesses.delete(id)
      const success = code === 0 || code === null

      if (!success && browserIndex < availableBrowsers.length - 1) {
        console.warn(`[AVISO] Falló con ${browser}, intentando con ${availableBrowsers[browserIndex + 1]}...`);
        startProcess(browserIndex + 1);
        return;
      }

      // Si falló definitivamente, intentar extraer un mensaje de error legible
      let errorMessage = '';
      if (!success) {
        if (lastErrorLine.includes('fnd')) errorMessage = 'FFmpeg no encontrado'
        else if (lastErrorLine.includes('cookies')) errorMessage = 'Acceso denegado a cookies (cierra el navegador)'
        else if (lastErrorLine.includes('DPAPI')) errorMessage = 'Error DPAPI (Cierra el navegador y reintenta)'
        else if (lastErrorLine.includes('HTTP Error 403')) errorMessage = '403 Forbidden (Prueba activar cookies o cerrar el navegador)'
        else errorMessage = lastErrorLine.length > 50 ? lastErrorLine.substring(0, 50) + '...' : lastErrorLine;
      }

      (event as any).sender.send('download:completed', { 
        id, 
        success, 
        code, 
        error: success ? undefined : (errorMessage || `Error ${code}`)
      })

      if (Notification.isSupported()) {
        const n = new Notification({
          title: success ? '✅ Descarga completada' : '❌ Error en descarga',
          body: success
            ? 'Tu descarga ha finalizado correctamente.'
            : (errorMessage || `La descarga falló con código ${code}.`)
        })
        n.show()
      }
    })

    proc.on('error', (err) => {
      activeProcesses.delete(id)
      if (browserIndex < availableBrowsers.length - 1) {
          startProcess(browserIndex + 1);
      } else {
          (event as any).sender.send('download:completed', { id, success: false, error: err.message })
      }
    })
  };

  startProcess(0);
  return { ok: true, outputDir: finalOutputDir }
})

// Cancel download
ipcMain.handle('download:cancel', async (_event, id: string, deleteFiles: boolean = false) => {
  const proc = activeProcesses.get(id)
  if (proc) {
    proc.kill('SIGTERM')
    activeProcesses.delete(id)
    return { ok: true }
  }

  const torrent = activeTorrents.get(id)
  if (torrent) {
    const path = torrent.path
    const name = torrent.name
    
    torrent.destroy()
    activeTorrents.delete(id)

    if (deleteFiles && path && name) {
      try {
        const fullPath = join(path, name)
        if (existsSync(fullPath)) {
          rmSync(fullPath, { recursive: true, force: true })
        }
      } catch (err) {
        console.error('Error deleting torrent files:', err)
      }
    }
    return { ok: true }
  }

  return { ok: false, error: 'No se encontró el proceso' }
})

// Pause/Resume (Mainly for Torrents)
ipcMain.handle('download:pause', (_event, id: string) => {
  const torrent = activeTorrents.get(id)
  if (torrent) {
    torrent.pause()
    return { ok: true }
  }
  return { ok: false, error: 'No se puede pausar' }
})

ipcMain.handle('download:resume', (_event, id: string) => {
  const torrent = activeTorrents.get(id)
  if (torrent) {
    torrent.resume()
    return { ok: true }
  }
  return { ok: false, error: 'No se puede reanudar' }
})

// Get video info (without downloading)
ipcMain.handle('download:getInfo', async (event, url: string) => {
  return new Promise((resolve) => {
    const args = ['--dump-json', '--no-playlist', '--restrict-filenames', url]
    const proc = spawn(YT_DLP_EXE, args)
    let output = ''

    proc.stdout.on('data', (chunk: Buffer) => {
      output += chunk.toString()
    })

    proc.on('close', (code) => {
      if (code === 0) {
        try {
          const info = JSON.parse(output)
          const sizeRaw = info.filesize || info.filesize_approx
          const sizeFormatted = sizeRaw ? `${(sizeRaw / (1024 * 1024)).toFixed(2)} MB` : null
          
          resolve({
            ok: true,
            title: info.title,
            duration: info.duration,
            thumbnail: info.thumbnail,
            uploader: info.uploader,
            extractor: info.extractor,
            size: sizeFormatted,
            filename: info._filename || info.filename
          })
        } catch {
          resolve({ ok: false, error: 'Error al parsear info' })
        }
      } else {
        resolve({ ok: false, error: `yt-dlp salió con código ${code}` })
      }
    })

    proc.on('error', (err) => {
      resolve({ ok: false, error: err.message })
    })
  })
})

// History Handlers
ipcMain.handle('history:load', async () => {
  return await HistoryManager.load()
})

ipcMain.handle('history:save', async (_event, items: any[]) => {
  await HistoryManager.save(items)
})

ipcMain.handle('history:clearCompleted', async (_event, items: any[]) => {
  const filtered = items.filter(item => item.status !== 'completed' && item.status !== 'cancelled')
  await HistoryManager.save(filtered)
  return filtered
})

// ─────────────────────────────────────────
// SEARCH: PelisPanda Scraper
// ─────────────────────────────────────────
ipcMain.handle('pelis:search', async (_event, query: string) => {
  try {
    const searchUrl = `https://pelispanda.org/wp-json/wpreact/v1/search?query=${encodeURIComponent(query)}&posts_per_page=36&page=1`
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': `https://pelispanda.org/search/?query=${encodeURIComponent(query)}`,
        'Accept': 'application/json'
      }
    })
    const data = await response.json()
    
    if (!data.results || !Array.isArray(data.results)) return []

    return data.results.map((item: any) => ({
      url: `https://pelispanda.org/${item.type || 'pelicula'}/${item.slug}`,
      thumbnail: item.featured || item.background_image,
      title: item.title,
      year: item.year
    }))
  } catch (error) {
    console.error('Search error:', error)
    return []
  }
})

// License Handlers
ipcMain.handle('app:validateLicense', async (_event, key: string) => {
  // Developer Bypass Key
  if (key === 'UNIVERSAL-PRO-DEV-2024') {
    const info = {
      key,
      instanceId: 'dev_instance_' + Math.random().toString(36).substring(7),
      user: 'Developer Master'
    };
    await LicenseManager.save(info);
    if (mainWindow) {
      mainWindow.webContents.send('app:licenseUpdated', { isPro: true, user: info.user });
    }
    return { valid: true, user: info.user };
  }

  try {
    const response = await fetch('https://api.lemonsqueezy.com/v1/licenses/activate', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        license_key: key,
        instance_name: hostname()
      })
    });

    const data: any = await response.json();

    if (data.activated) {
      const info = {
        key,
        instanceId: data.instance.id,
        user: data.meta?.customer_name || 'Usuario Pro'
      };
      await LicenseManager.save(info);
      if (mainWindow) {
        mainWindow.webContents.send('app:licenseUpdated', { isPro: true, user: info.user });
      }
      return { valid: true, user: info.user };
    } else {
      return { valid: false, error: data.error || 'La clave no pudo ser activada.' };
    }
  } catch (err) {
    console.error('License validation error:', err);
    return { valid: false, error: 'Error de red. Verifica tu conexión.' };
  }
});

ipcMain.handle('app:getLicenseStatus', async () => {
  return await LicenseManager.getStatus();
});

async function getPelisMagnet(url: string) {
  try {
    const parts = url.split('/').filter(p => !!p);
    const slug = parts[parts.length - 1];
    if (!slug) return null;

    console.log(`[SCRAPER] Iniciando búsqueda para: ${slug}`);

    const apiUrl = `https://pelispanda.org/wp-json/wpreact/v1/movie/${slug}`;
    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': url,
        'Accept': 'application/json'
      }
    })
    const movieData = await response.json()

    if (!movieData.downloads || !Array.isArray(movieData.downloads) || movieData.downloads.length === 0) {
      console.log('[SCRAPER] No hay enlaces en API. Intentando scraping directo...');
      const htmlResponse = await fetch(url)
      const html = await htmlResponse.text()
      
      // Intentar varios patrones de magnet
      const patterns = [
        /magnet:\?xt=urn:btih:[a-zA-Z0-9%&=._-]+/i,
        /data-magnet="([^"]+)"/,
        /href="magnet:([^"]+)"/
      ];

      for (const pattern of patterns) {
        const match = html.match(pattern);
        if (match) {
          const magnet = match[0].startsWith('magnet') ? match[0] : (match[1]?.startsWith('magnet') ? match[1] : `magnet:${match[1]}`);
          console.log('[SCRAPER] Magnet encontrado en HTML!');
          return magnet;
        }
      }
      return null
    }

    let magnet = movieData.downloads[0].download_link
    if (magnet && magnet.includes(' ')) {
      const links = magnet.split(' ').filter((l: string) => l.startsWith('magnet:'))
      magnet = links[links.length - 1]
    }
    console.log('[SCRAPER] Magnet obtenido de API.');
    return magnet
  } catch (error) {
    console.error('[SCRAPER ERROR]', error);
    return null
  }
}

ipcMain.handle('pelis:getMagnet', async (_event, url: string) => {
  return await getPelisMagnet(url);
})

// ─────────────────────────────────────────
// PRO FEATURES: Playlists, Updates, License
// ─────────────────────────────────────────

ipcMain.handle('video:expandPlaylist', async (_event, url: string) => {
  return new Promise((resolve) => {
    // --flat-playlist: extract only metadata, don't download
    // -J: output JSON
    const args = ['--flat-playlist', '-J', '--no-warnings', url];
    const proc = spawn(YT_DLP_EXE, args);
    let output = '';

    proc.stdout.on('data', (chunk) => { output += chunk.toString(); });
    proc.on('close', (code) => {
      if (code === 0) {
        try {
          const data = JSON.parse(output);
          const entries = data.entries || [];
          resolve({
            success: true,
            entries: entries.map((e: any) => ({
              title: e.title || 'Video sin título',
              url: e.url || e.webpage_url || e.id,
              thumbnail: e.thumbnail || (e.thumbnails && e.thumbnails[0]?.url),
              duration: e.duration_string || (e.duration ? `${Math.floor(e.duration/60)}:${String(e.duration%60).padStart(2,'0')}` : '')
            }))
          });
        } catch (err) {
          resolve({ success: false, error: 'Error al procesar la lista de reproducción.' });
        }
      } else {
        resolve({ success: false, error: `yt-dlp falló con código ${code}` });
      }
    });
  });
});

// ─────────────────────────────────────────
// App lifecycle
// ─────────────────────────────────────────
app.whenReady().then(async () => {
  createWindow()
  createTray()
  
  // Verify license on startup
  const status = await LicenseManager.getStatus();
  if (status.isPro) {
    console.log('[LICENSE] Validating Pro status...');
    await LicenseManager.verifyOnline();
  }
})

app.on('window-all-closed', () => {
  // Do NOT quit — stay in tray
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  } else {
    mainWindow.show()
  }
})

app.on('before-quit', () => {
  // Kill all active downloads on quit
  activeProcesses.forEach((proc) => proc.kill('SIGTERM'))
  tray?.destroy()
})

// ─────────────────────────────────────────
// TODO: Torrent support (future implementation)
// ─────────────────────────────────────────
// import WebTorrent from 'webtorrent'
// const torrentClient = new WebTorrent()
//
// ipcMain.handle('torrent:add', async (event, magnetOrFile: string, outputDir: string) => {
//   return new Promise((resolve, reject) => {
//     torrentClient.add(magnetOrFile, { path: outputDir }, (torrent) => {
//       torrent.on('download', () => {
//         event.sender.send('torrent:progress', {
//           infoHash: torrent.infoHash,
//           progress: torrent.progress * 100,
//           downloadSpeed: torrent.downloadSpeed,
//           timeRemaining: torrent.timeRemaining
//         })
//       })
//       torrent.on('done', () => {
//         event.sender.send('torrent:completed', { infoHash: torrent.infoHash })
//         resolve({ ok: true })
//       })
//       torrent.on('error', (err) => reject(err))
//     })
//   })
// })
