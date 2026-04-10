import { ipcMain, app, Notification } from 'electron';
import { join } from 'path';
import { extractMagnetsFromUrl } from './scraper/pelispanda-scraper';
import { 
  getTorrentClient, 
  enrichMagnet,
  cleanName
} from './torrent-manager';

// Standard response helpers
const ok = (data: any) => ({ success: true, data });
const fail = (error: string, detail: any = null) => ({ 
  success: false, 
  error, 
  detail: detail ? String(detail) : null 
});

/**
 * Registers torrent-related IPC handlers.
 * @param mainWindow The main application window for sending events.
 * @param activeTorrents A map to track active torrent objects.
 */
export function registerTorrentHandlers(mainWindow: any, activeTorrents: Map<string, any>) {
  
  /**
   * CANAL: Scrapear una URL (PelisPanda) para encontrar magnets.
   * Devuelve la lista de enlaces encontrados.
   */
  ipcMain.handle('torrent:scrape', async (_event, url: string) => {
    if (!url || typeof url !== 'string') return fail('URL inválida');
    
    try {
      console.log(`[IPC] Scrapeando con Puppeteer: ${url}`);
      const result = await extractMagnetsFromUrl(url.trim());
      
      if (!result.success || !result.links) {
        return fail(result.error || 'No se encontraron enlaces en esta página.', result.detail);
      }
      
      // Enriquecer magnets con trackers
      const links = result.links.map(link => ({
        ...link,
        href: result.type === 'magnet' ? enrichMagnet(link.href) : link.href,
        isMagnet: result.type === 'magnet'
      }));
      
      return ok({ type: result.type, links });
    } catch (err: any) {
      return fail('Error crítico en el scraper', err.message);
    }
  });

  /**
   * CANAL: Iniciar descarga de torrent.
   * Se comunica con la UI mediante eventos de progreso.
   */
  ipcMain.handle('torrent:download', async (_event, options: any) => {
    const { id, url, outputDir, highSpeedMode } = options;
    const finalPath = outputDir || app.getPath('downloads');

    if (!url || !id) return fail('Faltan parámetros: id y url son requeridos');

    try {
      console.log(`[IPC] Iniciando torrent P2P: ${url}`);
      
      const wt = await getTorrentClient({ highSpeedMode });

      // Evitar duplicados
      const existing = wt.get(url);
      if (existing) {
        activeTorrents.set(id, existing);
        return ok({ status: 'ya_activo', torrentId: existing.infoHash, name: existing.name });
      }

      return new Promise((resolve) => {
        const t = wt.add(url, { path: finalPath });

        // Guardar en activeTorrents inmediatamente para que pause/cancel funcionen
        activeTorrents.set(id, t);

        // Timeout si no hay metadatos en 45s
        const metadataTimeout = setTimeout(() => {
          if (!t.name) {
            console.error(`[Torrent] Timeout de metadatos para id: ${id}`);
            t.destroy();
            activeTorrents.delete(id);
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.send('download:completed', { 
                id, 
                success: false, 
                error: 'Sin semillas: No se pudieron obtener metadatos (timeout 45s). El torrent puede estar muerto.' 
              });
            }
            resolve(fail('Timeout de metadatos', 'Sin semillas después de 45s'));
          }
        }, 45000);

        t.on('metadata', () => {
          clearTimeout(metadataTimeout);
          console.log(`[Torrent] Metadatos OK: ${t.name}`);
          resolve(ok({ status: 'iniciado', torrentId: t.infoHash, name: t.name }));
        });

        t.on('download', () => {
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('download:progress', {
              id,
              title: cleanName(t.name),
              name: t.name,
              progress: parseFloat((t.progress * 100).toFixed(2)),
              percent: parseFloat((t.progress * 100).toFixed(2)),
              speed: `${(t.downloadSpeed / (1024 * 1024)).toFixed(2)} MB/s`,
              downloadSpeed: `${(t.downloadSpeed / (1024 * 1024)).toFixed(2)} MB/s`,
              uploadSpeed: `${(t.uploadSpeed / (1024 * 1024)).toFixed(2)} MB/s`,
              peers: t.numPeers,
              numPeers: t.numPeers,
              eta: formatTime(t.timeRemaining),
              timeRemaining: formatTime(t.timeRemaining),
              status: 'downloading',
            });
          }
        });

        t.on('done', () => {
          clearTimeout(metadataTimeout);
          activeTorrents.delete(id);
          
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('download:progress', {
              id, title: cleanName(t.name), progress: 100, percent: 100, status: 'completed'
            });
            mainWindow.webContents.send('download:completed', { id, success: true });
          }

          if (Notification.isSupported()) {
            new Notification({ 
              title: '✅ Descarga completada', 
              body: cleanName(t.name) 
            }).show();
          }
        });

        t.on('error', (err: any) => {
          clearTimeout(metadataTimeout);
          activeTorrents.delete(id);
          console.error(`[Torrent Error] ${id}:`, err.message);
          
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('download:completed', { 
              id, 
              success: false, 
              error: err.message 
            });
          }
          
          // Solo resolvemos el promise con error si aún no se resolvió
          resolve(fail('Error en torrent', err.message));
        });
      });

    } catch (err: any) {
      console.error('[IPC] Fallo crítico al iniciar torrent:', err);
      return fail('Error al iniciar el torrent', err.message);
    }
  });

  console.log('[IPC] Handlers de Scraper (Puppeteer) y Torrent registrados.');
}

function formatTime(ms: number): string {
  if (!ms || ms === Infinity) return 'Calculando...';
  const seconds = Math.floor(ms / 1000);
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return h > 0 ? `${h}h ${m}m ${s}s` : `${m}m ${s}s`;
}
