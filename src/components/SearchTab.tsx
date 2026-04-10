import React, { useState } from 'react'
import { Search, Download, Loader2, Film, Calendar } from 'lucide-react'
import { MovieSearchResult } from '../types'

interface SearchTabProps {
  onAddDownload: (url: string, type: 'video' | 'audio' | 'torrent', title?: string) => void
}

export default function SearchTab({ onAddDownload }: SearchTabProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<MovieSearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!query.trim()) return

    setIsLoading(true)
    setError(null)
    try {
      const data = await window.electronAPI.searchMovies(query)
      setResults(data)
      if (data.length === 0) setError('No se encontraron resultados.')
    } catch (err) {
      setError('Error al conectar con el servidor de búsqueda.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownload = async (item: MovieSearchResult) => {
    try {
      // Show some loading or just let the app handle it
      const magnet = await window.electronAPI.getMovieMagnets(item.url)
      if (magnet) {
        onAddDownload(magnet, 'torrent', item.title)
      } else {
        alert('No se encontró enlace de descarga para este título.')
      }
    } catch (err) {
      console.error('Error getting magnet:', err)
    }
  }

  return (
    <div className="flex flex-col h-full bg-black/10 overflow-hidden">
      {/* Search Header */}
      <div className="p-6 bg-gradient-to-b from-fuchsia-950/20 to-transparent flex flex-col gap-4">
        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
          <Film className="text-fuchsia-500" />
          Buscador de Películas
        </h2>
        <p className="text-sm text-white/50 -mt-2">
          Busca contenido en PelisPanda y otros servidores premium.
        </p>

        <form onSubmit={handleSearch} className="relative mt-2">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Escribe el nombre de la película o serie..."
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

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {results.map((item, idx) => (
            <div 
              key={idx}
              className="group bg-white/5 border border-white/5 rounded-xl overflow-hidden hover:border-fuchsia-500/30 transition-all hover:bg-white/10 flex flex-col"
            >
              <div className="aspect-[2/3] relative overflow-hidden bg-black/40">
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
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                  <button 
                    onClick={() => handleDownload(item)}
                    className="w-full bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold py-2 rounded-lg text-xs flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
                  >
                    <Download size={14} />
                    Descargar
                  </button>
                </div>
              </div>
              <div className="p-3 flex-1 flex flex-col gap-1">
                <h3 className="text-sm font-semibold text-white/90 line-clamp-2 leading-tight min-h-[2.5rem]">
                  {item.title}
                </h3>
                <div className="flex items-center justify-between mt-auto">
                    <span className="text-[10px] text-white/40 flex items-center gap-1">
                        <Calendar size={10} />
                        {item.year || '2024'}
                    </span>
                    <span className="text-[10px] bg-white/5 px-1.5 py-0.5 rounded text-fuchsia-400">
                        HD 1080p
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
