import { ipcMain, app, Notification } from 'electron';
import { join } from 'path';
import { extractMagnetsFromUrl } from './scraper/pelispanda-scraper';
import { 
  getTorrentClient, 
  enrichMagnet,
  cleanName,
  startDownload
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

    try {
      console.log(`[IPC] Iniciando descarga P2P: ${id}`);
      
      // El helper startDownload maneja el timeout y los eventos
      const torrentInfo = await startDownload(url, finalPath, (progress: any) => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          // Mapeamos al evento global de progreso que la UI ya escucha
          mainWindow.webContents.send('download:progress', {
            ...progress,
            id, // Usamos el ID de la UI para mantener el seguimiento
            title: cleanName(progress.name),
            speed: progress.downloadSpeed,
            percent: parseFloat(progress.progress),
            eta: progress.timeRemaining,
            peers: progress.numPeers
          });

          // Si terminó, enviar completado
          if (progress.status === 'completed') {
            mainWindow.webContents.send('download:completed', { id, success: true });
            if (Notification.isSupported()) {
              new Notification({ title: '✅ Descarga completada', body: progress.name }).show();
            }
          }
        }
      });

      return ok({ status: 'iniciado', torrentId: torrentInfo.id, name: torrentInfo.name });
    } catch (err: any) {
      console.error('[IPC] Fallo al iniciar torrent:', err);
      return fail('Error al iniciar el torrent', err.message);
    }
  });

  console.log('[IPC] Handlers de Scraper (Puppeteer) y Torrent registrados.');
}
