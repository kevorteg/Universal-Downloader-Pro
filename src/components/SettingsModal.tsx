import React, { useState, useEffect } from 'react'
import { AppSettings } from '../types'
import { Settings, Folder, Save, X, Globe, UserCheck, HardDrive, Share2, Crown, Sparkles } from 'lucide-react'

interface SettingsModalProps {
  settings: AppSettings
  onSave: (settings: AppSettings) => void
  onClose: () => void
  isOpen: boolean
  onLicenseVerified?: (user: string) => void
}

export default function SettingsModal({ settings, onSave, onClose, isOpen, onLicenseVerified }: SettingsModalProps) {
  const [form, setForm] = useState<AppSettings>({ ...settings })

  useEffect(() => {
    const loadLicense = async () => {
      if (window.electronAPI && isOpen) {
        const status = await window.electronAPI.getLicenseStatus();
        if (status.isPro) {
          setForm(prev => ({ ...prev, licenseKey: status.key || '' }));
        }
      }
    };
    loadLicense();
  }, [isOpen]);

  const handlePickFolder = async () => {
    if (window.electronAPI) {
      const path = await window.electronAPI.openFolderDialog()
      if (path) {
        setForm(prev => ({ ...prev, outputDir: path }))
      }
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 text-fuchsia-500">
            <Settings size={20} />
            <h2 className="text-lg font-bold text-white">Configuración Global</h2>
          </div>
          <button className="btn-ghost p-1" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="space-y-6">
          {/* Output Directory */}
          <div className="space-y-2">
            <label className="text-[11px] uppercase tracking-wider font-bold text-muted flex items-center gap-2">
              <HardDrive size={12} />
              Carpeta de Descargas
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                className="input-url flex-1 text-[12px]"
                value={form.outputDir}
                readOnly
                placeholder="Selecciona una carpeta..."
              />
              <button className="btn btn-secondary" onClick={handlePickFolder}>
                <Folder size={14} />
                Explorar
              </button>
            </div>
            <p className="text-[10px] text-muted">Aquí se guardarán todos los videos y audios descargados.</p>
          </div>

          {/* Cookies from Browser */}
          <div className="space-y-3 bg-black/20 p-4 rounded-lg border border-white/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe size={16} className="text-blue-400" />
                <div>
                  <div className="text-[13px] font-medium text-white">Usar Cookies del Navegador</div>
                  <div className="text-[11px] text-muted">Permite descargar videos privados o con restricción de edad.</div>
                </div>
              </div>
              <input
                type="checkbox"
                className="accent-fuchsia-500 w-4 h-4"
                checked={form.useCookies}
                onChange={e => setForm(prev => ({ ...prev, useCookies: e.target.checked }))}
              />
            </div>

            {form.useCookies && (
              <div className="pt-2 flex items-center gap-3 fade-in">
                <label className="text-[11px] text-white/60">Navegador:</label>
                <select
                  className="bg-zinc-800 border border-zinc-700 text-white text-[11px] rounded px-2 py-1 outline-none focus:border-fuchsia-500"
                  value={form.cookiesBrowser}
                  onChange={e => setForm(prev => ({ ...prev, cookiesBrowser: e.target.value as any }))}
                >
                  <option value="chrome">Google Chrome</option>
                  <option value="firefox">Mozilla Firefox</option>
                  <option value="edge">Microsoft Edge</option>
                  <option value="safari">Safari</option>
                  <option value="chromium">Chromium</option>
                </select>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-white/80">Predeterminar "Solo Audio"</span>
              <input
                type="checkbox"
                className="accent-fuchsia-500 w-4 h-4"
                checked={form.defaultAudioOnly}
                onChange={e => setForm(prev => ({ ...prev, defaultAudioOnly: e.target.checked }))}
              />
            </div>
          </div>

          {/* High Speed Mode */}
          <div className="space-y-3 bg-fuchsia-500/5 p-4 rounded-lg border border-fuchsia-500/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Share2 size={16} className="text-fuchsia-400" />
                <div>
                  <div className="text-[13px] font-medium text-white">Modo Alta Velocidad (Torrent)</div>
                  <div className="text-[11px] text-muted">Aumenta conexiones y habilita DHT/PEX para descargas más rápidas.</div>
                </div>
              </div>
              <div 
                className={`w-10 h-5 rounded-full p-1 transition-colors duration-200 cursor-pointer ${form.highSpeedMode ? 'bg-fuchsia-600' : 'bg-zinc-700'}`}
                onClick={() => setForm(prev => ({ ...prev, highSpeedMode: !prev.highSpeedMode }))}
              >
                <div className={`w-3 h-3 bg-white rounded-full transition-transform duration-200 ${form.highSpeedMode ? 'translate-x-5' : 'translate-x-0'}`} />
              </div>
            </div>
          </div>

          {/* Custom Trackers */}
          <div className="space-y-2 bg-black/20 p-4 rounded-lg border border-white/5">
            <label className="text-[11px] uppercase tracking-wider font-bold text-muted flex items-center gap-2">
              <Share2 size={12} />
              Trackers Personalizados (Torrents)
            </label>
            <textarea
              className="w-full h-20 bg-black/40 border border-white/5 rounded p-2 text-[11px] text-white/70 focus:border-fuchsia-500/50 outline-none resize-none placeholder:text-white/10"
              placeholder="Pega aquí tus trackers (uno por línea)..."
              value={(form.customTrackers || []).join('\n')}
              onChange={e => {
                const list = e.target.value.split('\n').map(t => t.trim()).filter(Boolean)
                setForm(prev => ({ ...prev, customTrackers: list }))
              }}
            />
            <p className="text-[9px] text-muted">Añade más enlaces para mejorar la velocidad y disponibilidad de tus Torrents.</p>
          </div>

          <div style={{ height: 1, background: 'var(--border)', margin: '16px 0' }} />

          {/* PRO & SPIRITUAL SECTION */}
          <div className="space-y-4">
            <label className="text-[11px] uppercase tracking-wider font-bold text-fuchsia-400 flex items-center gap-2">
              <Crown size={12} />
              Sección Pro
            </label>
            
            <div className="space-y-3 p-4 bg-fuchsia-600/5 rounded-xl border border-fuchsia-500/10 transition-all">
              <div className="flex justify-between items-center">
                <span className="text-[12px] font-bold text-white">Estado de Licencia</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${form.licenseKey ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-white/40'}`}>
                  {form.licenseKey ? 'ACTIVADA' : 'VERSIÓN GRATUITA'}
                </span>
              </div>
              
              <div className="flex gap-2">
                <input
                  type="text"
                  className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-[12px] text-white focus:border-fuchsia-500 outline-none font-mono"
                  placeholder="XXXX-XXXX-XXXX-XXXX"
                  value={form.licenseKey}
                  onChange={e => setForm(prev => ({ ...prev, licenseKey: e.target.value }))}
                />
                <button 
                  className="btn btn-secondary px-4 text-[11px] font-bold"
                  onClick={async () => {
                    try {
                      if (window.electronAPI) {
                         const res = await window.electronAPI.validateLicense(form.licenseKey)
                         if (res.valid) {
                           alert(`¡Licencia válida! Bienvenido, ${res.user || 'Usuario'}`)
                           if (onLicenseVerified) onLicenseVerified(res.user || 'Usuario')
                         } else {
                           alert(`Error: ${res.error || 'Clave de licencia inválida'}`)
                         }
                      }
                    } catch (err) {
                      console.error("Error validating license:", err)
                      alert("Hubo un problema al validar la licencia. Verifica tu conexión.")
                    }
                  }}
                >
                  Verificar
                </button>
              </div>

              {!form.licenseKey && (
                <div className="pt-2">
                  <button 
                    onClick={() => window.open('https://github.com/sponsors/kevorteg', '_blank')}
                    className="w-full bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white text-[11px] font-bold py-2 rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-fuchsia-900/20"
                  >
                    <Sparkles size={12} />
                    ACTUALIZAR A PRO POR $5
                  </button>
                  <p className="text-[9px] text-center text-muted mt-2">
                    Desbloquea listas de reproducción ilimitadas e importación masiva.
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between bg-fuchsia-950/20 p-3 rounded border border-fuchsia-500/10">
              <div className="flex items-center gap-2">
                <Globe size={14} className="text-fuchsia-400" />
                <div>
                  <div className="text-[12px] font-medium text-white">Versículo del día</div>
                  <div className="text-[10px] text-muted">Recibe una bendición cada vez que abras la app.</div>
                </div>
              </div>
              <input
                type="checkbox"
                className="accent-fuchsia-500 w-4 h-4"
                checked={form.showDailyVerse}
                onChange={e => setForm(prev => ({ ...prev, showDailyVerse: e.target.checked }))}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 mt-8">
          <button className="btn btn-ghost" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn btn-primary px-6" onClick={() => onSave(form)}>
            <Save size={14} />
            Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  )
}
