import React, { useState } from 'react'
import { Search, Download, Loader2, Film, Calendar, Youtube, User } from 'lucide-react'
import { SearchResult } from '../types'

interface SearchTabProps {
  onAddDownload: (url: string, type: 'video' | 'audio' | 'torrent', title?: string) => void
}

export default function SearchTab({ onAddDownload }: SearchTabProps) {
  const [query, setQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'video' | 'movie'>('video')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!query.trim()) return

    setIsLoading(true)
    setError(null)
    try {
      let data: SearchResult[] = []
      if (activeTab === 'video') {
        data = await window.electronAPI.searchVideos(query)
      } else {
        data = await window.electronAPI.searchMovies(query)
      }
      setResults(data)
      if (data.length === 0) setError('No se encontraron resultados.')
    } catch (err) {
      setError('Error al conectar con el servidor de búsqueda.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownload = async (item: SearchResult) => {
    try {
      if (item.type === 'video') {
        // Direct video download
        onAddDownload(item.url, 'video', item.title)
      } else {
        // Scrape magnet for movies
        const magnet = await window.electronAPI.getMovieMagnets(item.url)
        if (magnet) {
          onAddDownload(magnet, 'torrent', item.title)
        } else {
          alert('No se encontró enlace de descarga para este título.')
        }
      }
    } catch (err) {
      console.error('Error getting magnet:', err)
    }
  }

  return (
    <div className="flex flex-col h-full bg-black/10 overflow-hidden">
      {/* Search Header */}
      <div className="p-6 bg-gradient-to-b from-fuchsia-950/20 to-transparent flex flex-col gap-4">
        <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                {activeTab === 'video' ? <Youtube className="text-red-500" /> : <Film className="text-fuchsia-500" />}
                {activeTab === 'video' ? 'Buscador de Videos' : 'Buscador de Películas'}
            </h2>

            {/* Tab Selector */}
            <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                <button 
                  onClick={() => { setActiveTab('video'); setResults([]); setError(null); }}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeTab === 'video' ? 'bg-fuchsia-600 text-white shadow-lg' : 'text-white/40 hover:text-white/70'}`}
                >
                    Videos / YT
                </button>
                <button 
                  onClick={() => { setActiveTab('movie'); setResults([]); setError(null); }}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeTab === 'movie' ? 'bg-fuchsia-600 text-white shadow-lg' : 'text-white/40 hover:text-white/70'}`}
                >
                    Películas / Torrents
                </button>
            </div>
        </div>

        <p className="text-sm text-white/50 -mt-2">
          {activeTab === 'video' 
            ? 'Encuentra videos en YouTube y otras plataformas de streaming.' 
            : 'Busca películas en servidores premium y redes P2P.'}
        </p>

        <form onSubmit={handleSearch} className="relative mt-2">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={activeTab === 'video' ? "Busca videos, canales, música..." : "Escribe el nombre de la película..."}
            className="w-full bg-white/5 border border-white/10 rounded-full py-3.5 pl-12 pr-32 text-white text-sm focus:outline-none focus:border-fuchsia-500/50 focus:ring-1 focus:ring-fuchsia-500/30 transition-all placeholder:text-white/20"
          />
          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="absolute right-2 top-1.5 bottom-1.5 bg-fuchsia-600 hover:bg-fuchsia-500 disabled:opacity-50 disabled:hover:bg-fuchsia-600 text-white rounded-full px-6 text-sm font-semibold transition-all flex items-center gap-2"
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : 'Buscar'}
          </button>
        </form>
      </div>

      {/* Results Grid */}
      <div className="flex-1 overflow-y-auto px-6 pb-6 custom-scrollbar">
        {isLoading && results.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 text-white/40 gap-4">
            <Loader2 size={48} className="animate-spin text-fuchsia-500/50" />
            <p className="animate-pulse">Consultando servidores...</p>
          </div>
        )}

        {error && !isLoading && (
          <div className="flex flex-col items-center justify-center h-64 text-white/30 italic">
            {error}
          </div>
        )}

        {!isLoading && !error && results.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 opacity-20 grayscale">
             <Search size={64} />
             <p className="mt-4 font-medium">Busca algo para empezar</p>
          </div>
        )}

        <div className={`grid gap-6 ${activeTab === 'video' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'}`}>
          {results.map((item, idx) => (
            <div 
              key={idx}
              className="group bg-white/5 border border-white/5 rounded-xl overflow-hidden hover:border-fuchsia-500/30 transition-all hover:bg-white/10 flex flex-col"
            >
              {/* Thumbnail Container */}
              <div className={`${activeTab === 'video' ? 'aspect-video' : 'aspect-[2/3]'} relative overflow-hidden bg-black/40`}>
                {item.thumbnail ? (
                  <img 
                    src={item.thumbnail} 
                    alt={item.title} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/5">
                    <Film size={48} />
                  </div>
                )}
                
                {/* Duration Overlay for Videos */}
                {activeTab === 'video' && item.duration && (
                    <div className="absolute bottom-2 right-2 bg-black/80 px-1.5 py-0.5 rounded text-[10px] font-bold text-white border border-white/5">
                        {item.duration}
                    </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                  <button 
                    onClick={() => handleDownload(item)}
                    className="w-full bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold py-2 rounded-lg text-xs flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
                  >
                    <Download size={14} />
                    {activeTab === 'video' ? 'Descargar Video' : 'Descargar Película'}
                  </button>
                </div>
              </div>

              {/* Info Container */}
              <div className="p-3 flex-1 flex flex-col gap-1">
                <h3 className="text-sm font-semibold text-white/90 line-clamp-2 leading-tight min-h-[2.5rem]">
                  {item.title}
                </h3>
                <div className="flex items-center justify-between mt-auto">
                    {activeTab === 'video' ? (
                        <span className="text-[10px] text-white/40 flex items-center gap-1">
                            <User size={10} className="text-fuchsia-500/60" />
                            {item.uploader || 'YouTube'}
                        </span>
                    ) : (
                        <span className="text-[10px] text-white/40 flex items-center gap-1">
                            <Calendar size={10} />
                            {item.year || '2024'}
                        </span>
                    )}
                    
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${activeTab === 'video' ? 'bg-red-500/10 text-red-400' : 'bg-fuchsia-500/10 text-fuchsia-400'}`}>
                        {activeTab === 'video' ? 'Full HD+' : 'HD 1080p'}
                    </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
