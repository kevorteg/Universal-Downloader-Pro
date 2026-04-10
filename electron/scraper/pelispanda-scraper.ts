import { app } from 'electron';
import puppeteer from 'puppeteer-core';
import { URL } from 'url';

/**
 * Obtiene la ruta del ejecutable de Chromium embebido en Electron.
 * En desarrollo suele ser el binario de Electron; en producción el exe de la app.
 */
function getElectronChromiumPath(): string {
  try {
    // @ts-ignore - Algunos entornos de electron-vite/custom builds exponen esto
    if (app && (app as any).__chromium) return (app as any).__chromium;
    return process.execPath;
  } catch {
    return process.execPath;
  }
}

export interface ScrapedLink {
  href: string;
  label: string;
}

export interface ScrapeResult {
  success: boolean;
  type?: 'magnet' | 'torrent';
  links?: ScrapedLink[];
  error?: string;
  detail?: string;
}

/**
 * Usa Puppeteer-Core para navegar a una URL y extraer magnet links.
 * Esto permite bypass de protecciones cloudflare/bot detection básicas.
 */
export async function extractMagnetsFromUrl(url: string): Promise<ScrapeResult> {
  let browser: any = null;

  try {
    console.log(`[Scraper] Iniciando navegación a: ${url}`);
    
    browser = await puppeteer.launch({
      executablePath: getElectronChromiumPath(),
      headless: true, // Cambiar a 'false' para debuggear visualmente si falla mucho
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-blink-features=AutomationControlled',
        '--window-size=1280,800',
      ],
    });

    const page = await browser.newPage();

    // Simular un navegador real
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    // Ocultar huellas de automatización
    await page.evaluateOnNewDocument(() => {
      // @ts-ignore
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
    });

    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    // Esperar un poco a que aparezcan los links (PelisPanda a veces carga magnets vía JS)
    try {
      await page.waitForSelector('a[href^="magnet:"]', { timeout: 8000 });
    } catch (e) {
      console.warn('[Scraper] No se encontró el selector de magnet links en el tiempo esperado.');
    }

    // Extraer magnets
    const magnets = await page.evaluate(() => {
      const anchors = Array.from(document.querySelectorAll('a[href^="magnet:"]'));
      return anchors.map(a => ({
        href: (a as HTMLAnchorElement).href,
        label: (a as HTMLAnchorElement).textContent?.trim() || (a as HTMLAnchorElement).title || 'Magnet Link',
      }));
    });

    if (magnets.length > 0) {
      return { success: true, type: 'magnet', links: magnets };
    }

    // Fallback: Buscar links .torrent
    const torrents = await page.evaluate(() => {
      const anchors = Array.from(document.querySelectorAll('a[href$=".torrent"]'));
      return anchors.map(a => ({
        href: (a as HTMLAnchorElement).href,
        label: (a as HTMLAnchorElement).textContent?.trim() || 'Link Torrent',
      }));
    });

    if (torrents.length > 0) {
      return { success: true, type: 'torrent', links: torrents };
    }

    throw new Error('No se encontraron enlaces de descarga válidos (magnet o .torrent) en esta página.');

  } catch (err: any) {
    console.error('[Scraper] Error:', err.message);
    return {
      success: false,
      error: err.message,
      detail: err.stack,
    };
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
  }
}
