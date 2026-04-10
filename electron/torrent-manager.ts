import http from 'http';
import https from 'https';
import { URL } from 'url';

// --- Trackers públicos de respaldo ---
export const FALLBACK_TRACKERS = [
  'udp://tracker.opentrackr.org:1337/announce',
  'udp://open.demonii.com:1337/announce',
  'udp://tracker.openbittorrent.com:80/announce',
  'udp://tracker.leechers-paradise.org:6969/announce',
  'udp://exodus.desync.com:6969/announce',
  'udp://9.rarbg.com:2810/announce',
  'wss://tracker.btorrent.xyz',
  'wss://tracker.openwebtorrent.com',
];

let client: any = null;

/**
 * Singleton for WebTorrent client
 */
export async function getTorrentClient(options: any = {}) {
  if (!client) {
    const mod = await import('webtorrent');
    const WebTorrentClass = (mod.default || mod) as any;
    client = new WebTorrentClass({
      maxConns: options.highSpeedMode ? 200 : 100,
      dht: true,
      tracker: true,
      lsd: true,
      utp: true,
      pex: true,
      ...options
    });

    client.on('error', (err: any) => {
      console.error('[WebTorrent] Error global:', err.message);
    });
  }
  return client;
}

/**
 * Sigue redirecciones y extrae contenido HTML para buscar el magnet link real.
 */
export function resolveRedirects(url: string, maxRedirects = 5): Promise<{ finalUrl: string, body: string, statusCode?: number }> {
  return new Promise((resolve, reject) => {
    if (maxRedirects === 0) {
      return reject(new Error('Demasiadas redirecciones, posible loop'));
    }

    const protocol = url.startsWith('https') ? https : http;

    const req = protocol.get(url, { 
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    }, (res) => {
      // Manejar Redirecciones (301, 302, etc)
      if (res.statusCode && [301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
        const nextUrl = new URL(res.headers.location, url).href;
        console.log(`[RESOLVER] Redirección detectada: ${url} -> ${nextUrl}`);
        return resolve(resolveRedirects(nextUrl, maxRedirects - 1));
      }

      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => resolve({ finalUrl: url, body, statusCode: res.statusCode }));
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Timeout al acceder a: ${url}`));
    });

    req.on('error', (err) => {
      reject(new Error(`Error de red en ${url}: ${err.message}`));
    });
  });
}

/**
 * Extrae un magnet link de un string (URL o HTML)
 */
export function extractMagnet(input: string): string | null {
  if (input.startsWith('magnet:')) return input;
  
  // Regex para buscar magnets en texto
  const match = input.match(/magnet:\?[^\s"'<>]+/i);
  if (match) return match[0];
  
  return null;
}

/**
 * Añade trackers de respaldo a un magnet link
 */
export function enrichMagnet(magnetUrl: string): string {
  if (!magnetUrl.startsWith('magnet:')) return magnetUrl;
  
  const trackerParams = FALLBACK_TRACKERS.map(
    (t) => `&tr=${encodeURIComponent(t)}`
  ).join('');
  
  // Evitar duplicar trackers si ya los tiene
  let result = magnetUrl;
  if (!result.includes('&tr=')) {
    result += trackerParams;
  }
  return result;
}

/**
 * Inicia la descarga de un magnet/torrent con callbacks de progreso.
 */
export async function startDownload(
  torrentId: string, 
  savePath: string, 
  onProgress: (data: any) => void
): Promise<{ id: string; name: string }> {
  const wt = await getTorrentClient();

  return new Promise((resolve, reject) => {
    // Evitar duplicados (si ya se está bajando el mismo torrentId)
    const existing = wt.get(torrentId);
    if (existing) {
      return reject(new Error('Este torrent ya se encuentra en la lista de descargas.'));
    }

    const t = wt.add(torrentId, { path: savePath });

    let metadataTimeout = setTimeout(() => {
      if (!(t as any).metadata) {
        t.destroy();
        reject(new Error('Sin semillas: No se pudieron obtener los metadatos del torrent (Timeout 30s).'));
      }
    }, 30000);

    t.on('metadata', () => {
      clearTimeout(metadataTimeout);
      console.log(`[Torrent] Metadatos recibidos para: ${t.name}`);
      resolve({ id: t.infoHash, name: t.name });
    });

    t.on('download', () => {
      onProgress({
        id: t.infoHash,
        name: t.name,
        progress: (t.progress * 100).toFixed(2),
        downloadSpeed: (t.downloadSpeed / (1024 * 1024)).toFixed(2) + ' MB/s',
        uploadSpeed: (t.uploadSpeed / (1024 * 1024)).toFixed(2) + ' MB/s',
        numPeers: t.numPeers,
        status: 'downloading',
        timeRemaining: formatTime(t.timeRemaining)
      });
    });

    t.on('done', () => {
      onProgress({
        id: t.infoHash,
        name: t.name,
        progress: '100',
        status: 'completed'
      });
    });

    t.on('error', (err: any) => {
      console.error(`[Torrent Error] ${t.name || 'Unknown'}:`, err);
      reject(err);
    });
  });
}

function formatTime(ms: number): string {
  if (!ms || ms === Infinity) return 'Calculando...';
  const seconds = Math.floor(ms / 1000);
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return h > 0 ? `${h}h ${m}m ${s}s` : `${m}m ${s}s`;
}

/**
 * Lógica secundaria para limpiar nombres
 */
export function cleanName(name: string): string {
  if (!name) return 'Torrent';
  return name
    .replace(/[._-]/g, ' ')
    .replace(/\s\s+/g, ' ')
    .trim();
}
