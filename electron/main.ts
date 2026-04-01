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
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { readFile, writeFile } from 'fs/promises'
import { homedir } from 'os'
// Dynamic import of webtorrent handled below

// ─────────────────────────────────────────
// State
let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null
const activeProcesses = new Map<string, ChildProcess>()
const activeTorrents = new Map<string, any>()
let torrentClient: any = null
const HISTORY_FILE = join(app.getPath('userData'), 'downloads.json')

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

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

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
    const args = ['--dump-json', '--no-playlist', '--restrict-filenames', `"${url}"`]
    const proc = spawn('yt-dlp', args, { 
      shell: true,
      windowsVerbatimArguments: true
    })
    
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

ipcMain.handle('download:start', async (event, options: {
  id: string
  url: string
  outputDir: string
  audioOnly: boolean
  isTorrent?: boolean
  useCookies: boolean
  cookiesBrowser: string
  formatId?: string
}) => {
  const { id, url, outputDir, audioOnly, isTorrent, useCookies, cookiesBrowser, formatId } = options

  const finalOutputDir = outputDir || join(app.getPath('downloads'), 'UniversalDownloader');
  if (!existsSync(finalOutputDir)) {
    mkdirSync(finalOutputDir, { recursive: true });
  }

  // --- WEBTORRENT IMPLEMENTATION ---
  if (isTorrent) {
    try {
      if (!torrentClient) {
        // Dynamic import for ESM module
        const WebTorrentClass = (await import('webtorrent')).default;
        torrentClient = new WebTorrentClass();
      }
      const t = torrentClient.add(url, { path: finalOutputDir }, (torrent: any) => {
        activeTorrents.set(id, torrent)
        let lastReport = Date.now()
        
        // Initial info
        event.sender.send('download:progress', {
          id,
          line: `[SISTEMA] Iniciando Torrent: ${torrent.name || 'Descargando metadatos...'}`,
          status: 'downloading',
          filename: torrent.name,
          totalSize: `${(torrent.length / (1024 * 1024)).toFixed(2)} MB`
        })

        torrent.on('download', () => {
          const now = Date.now()
          if (now - lastReport > 1000) { // Limit updates to 1 per sec
            lastReport = now
            event.sender.send('download:progress', {
              id,
              line: `[TORRENT] Pares: ${torrent.numPeers} | Bajada: ${(torrent.downloadSpeed / (1024 * 1024)).toFixed(2)} MB/s`,
              status: 'downloading',
              percent: +(torrent.progress * 100).toFixed(2),
              speed: `${(torrent.downloadSpeed / 1024 / 1024).toFixed(2)} MB/s`,
              infoHash: torrent.infoHash,
              peers: torrent.numPeers
            })
          }
        })

        torrent.on('done', () => {
          event.sender.send('download:completed', { id, success: true })
          if (Notification.isSupported()) {
            new Notification({ title: '✅ Torrent completado', body: `Se ha descargado ${torrent.name}.` }).show()
          }
        })

        torrent.on('error', (err) => {
          activeTorrents.delete(id)
          const errMsg = typeof err === 'string' ? err : err.message || 'Error desconocido'
          event.sender.send('download:completed', { id, success: false, error: errMsg })
        })
      })
      activeTorrents.set(id, t) // Fallback in case the callback takes time
      return { ok: true }
    } catch (error: any) {
      return { ok: false, error: error.message }
    }
  }

  // --- YT-DLP IMPLEMENTATION ---
  const templateName = audioOnly ? '%(title).100s [%(id)s].mp3' : '%(title).100s [%(id)s].%(ext)s';
  const outputTemplate = join(finalOutputDir, templateName);

  // Construcción de argumentos con COMILLAS MANUALES para evitar fallos de shell en Windows
  const args: string[] = [
    `"${url}"`,
    '--newline',
    '--no-colors',
    '--no-playlist',
    '--restrict-filenames',
    '--windows-filenames',
    '--no-part',           // evita archivos .part y errores de escritura parcial
    '--no-mtime',          // no mantiene la fecha de modificación original
    '-o', `"${outputTemplate}"`,
    '--merge-output-format', 'mp4',
    '--prefer-ffmpeg',
    '--user-agent', '"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"',
    '--geo-bypass'
  ];

  if (useCookies) {
    args.push('--cookies-from-browser', cookiesBrowser || 'chrome');
  }

  if (audioOnly) {
    args.push('-f', 'ba/best', '-x', '--audio-format', 'mp3', '--audio-quality', '0');
  } else {
    // Si hay un formatId, intentamos ese primero y caemos a best si falla
    // Si no hay formatId, usamos el best por defecto
    const safeFormat = formatId 
      ? `${formatId}/bestvideo+bestaudio/best` 
      : 'bestvideo+bestaudio/best';
    args.push('-f', safeFormat);
  }

  console.log('[SISTEMA] Ejecutando:', 'yt-dlp', args.join(' '));

  const proc = spawn('yt-dlp', args, {
    shell: true,
    cwd: finalOutputDir,
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsVerbatimArguments: true // Crucial para que las comillas manuales funcionen
  });

  activeProcesses.set(id, proc);
  let lastErrorLine = '';

  const handleData = (chunk: Buffer) => {
    const lines = chunk.toString().split('\n');
    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed) {
        const parsed = parseProgress(trimmed);
        event.sender.send('download:progress', {
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
      lastErrorLine = line; // Guardar el último error para reporte
      handleData(chunk);
    }
  };

  proc.stdout.on('data', handleData);
  proc.stderr.on('data', handleErrorData);

  proc.on('close', (code) => {
    activeProcesses.delete(id)
    const success = code === 0 || code === null
    
    // Si falló, intentar extraer un mensaje de error legible
    let errorMessage = '';
    if (!success) {
      if (lastErrorLine.includes('fnd')) errorMessage = 'FFmpeg no encontrado'
      else if (lastErrorLine.includes('cookies')) errorMessage = 'Acceso denegado a cookies (cierra el navegador)'
      else if (lastErrorLine.includes('DPAPI')) errorMessage = 'Error DPAPI (Cierra el navegador y reintenta)'
      else if (lastErrorLine.includes('HTTP Error 403')) errorMessage = '403 Forbidden (Prueba activar cookies o cerrar el navegador)'
      else errorMessage = lastErrorLine.length > 50 ? lastErrorLine.substring(0, 50) + '...' : lastErrorLine;
    }

    event.sender.send('download:completed', { 
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
    event.sender.send('download:completed', { id, success: false, error: err.message })
  })

  return { ok: true, outputDir: finalOutputDir }
})

// Cancel download
ipcMain.handle('download:cancel', (_event, id: string) => {
  const proc = activeProcesses.get(id)
  if (proc) {
    proc.kill('SIGTERM')
    activeProcesses.delete(id)
    return { ok: true }
  }

  const torrent = activeTorrents.get(id)
  if (torrent) {
    torrent.destroy()
    activeTorrents.delete(id)
    return { ok: true }
  }

  return { ok: false, error: 'No se encontró el proceso' }
})

// Get video info (without downloading)
ipcMain.handle('download:getInfo', async (event, url: string) => {
  return new Promise((resolve) => {
    const args = ['--dump-json', '--no-playlist', '--restrict-filenames', `"${url}"`]
    const proc = spawn('yt-dlp', args, { 
      shell: true,
      windowsVerbatimArguments: true
    })
    let output = ''

    proc.stdout.on('data', (chunk: Buffer) => {
      output += chunk.toString()
    })

    proc.on('close', (code) => {
      if (code === 0) {
        try {
          const info = JSON.parse(output)
          resolve({
            ok: true,
            title: info.title,
            duration: info.duration,
            thumbnail: info.thumbnail,
            uploader: info.uploader,
            extractor: info.extractor
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
// App lifecycle
// ─────────────────────────────────────────
app.whenReady().then(() => {
  createWindow()
  createTray()
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
