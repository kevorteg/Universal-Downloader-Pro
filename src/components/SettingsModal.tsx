import React, { useState } from 'react'
import { AppSettings } from '../types'
import { Settings, Folder, Save, X, Globe, UserCheck, HardDrive } from 'lucide-react'

interface SettingsModalProps {
  settings: AppSettings
  onSave: (settings: AppSettings) => void
  onClose: () => void
}

export default function SettingsModal({ settings, onSave, onClose }: SettingsModalProps) {
  const [form, setForm] = useState<AppSettings>({ ...settings })

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

          {/* General options */}
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
