import React, { useState, useEffect, useRef } from 'react'
import { Search, Download, Loader2, Film, Calendar, Youtube, User, ChevronDown, ListPlus, Music, Crown } from 'lucide-react'
import { SearchResult } from '../types'

interface SearchTabProps {
  onAddDownload: (url: string, type: 'video' | 'audio' | 'torrent', title?: string) => void
  isPro: boolean
}

export default function SearchTab({ onAddDownload, isPro }: SearchTabProps) {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [activeTab, setActiveTab] = useState<'video' | 'audio' | 'movie'>('video')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchLimit, setSearchLimit] = useState(12)
  const suggestionRef = useRef<HTMLDivElement>(null)

  // Autocomplete logic
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim().length > 2 && activeTab === 'video') {
        const data = await window.electronAPI.getSuggestions(query)
        setSuggestions(data)
        setShowSuggestions(true)
      } else {
        setSuggestions([])
        setShowSuggestions(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [query, activeTab])

  // Click outside to hide suggestions
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (suggestionRef.current && !suggestionRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearch = async (e?: React.FormEvent, isLoadMore = false) => {
    e?.preventDefault()
    if (!query.trim()) return

    setShowSuggestions(false)
    if (isLoadMore) {
        setIsLoadingMore(true)
    } else {
        setIsLoading(true)
        setSearchLimit(12)
        setError(null)
    }

    try {
      let data: SearchResult[] = []
      const limit = isLoadMore ? searchLimit + 12 : 12
      
      if (activeTab === 'video') {
        data = await window.electronAPI.searchVideos(query, limit)
      } else if (activeTab === 'audio') {
        data = await window.electronAPI.searchMusic(query, limit)
        data = data.map(r => ({ ...r, type: 'audio' }))
      } else {
        data = await window.electronAPI.searchMovies(query)
      }

      setResults(data)
      if (isLoadMore) setSearchLimit(limit)
      
      if (data.length === 0) setError('No se encontraron resultados.')
    } catch (err) {
      setError('Error al conectar con el servidor de búsqueda.')
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }

  const handleDownload = async (item: SearchResult) => {
    try {
      if (item.type === 'video') {
        onAddDownload(item.url, 'video', item.title)
      } else if (item.type === 'audio') {
        onAddDownload(item.url, 'audio', item.title)
      } else {
        // En lugar de resolver el magnet aquí, lo enviamos como torrent 
        // y dejamos que el backend lo resuelva automáticamente.
        onAddDownload(item.url, 'torrent', item.title)
      }
    } catch (err) {
      console.error('Error in search download flow:', err)
    }
  }

  return (
    <div className="flex flex-col h-full bg-black/10 overflow-hidden">
      {/* Search Header */}
      <div className="p-6 bg-gradient-to-b from-fuchsia-950/20 to-transparent flex flex-col gap-4 relative z-50">
        <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                {activeTab === 'video' ? <Youtube className="text-red-500" size={28} /> : activeTab === 'audio' ? <Music className="text-emerald-500" size={28} /> : <Film className="text-fuchsia-500" size={28} />}
                {activeTab === 'video' ? 'Buscador de Videos' : activeTab === 'audio' ? 'Buscador de Música' : 'Buscador de Películas'}
            </h2>

            {/* Tab Selector */}
            <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
              <button
                onClick={() => { setActiveTab('video'); setResults([]); setError(null); setQuery(''); }}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg transition-all ${activeTab === 'video' ? 'bg-fuchsia-600 text-white shadow-lg' : 'text-white/40 hover:text-white/70'}`}
              >
                <Youtube size={14} />
                <span className="text-xs font-semibold">Vídeos</span>
              </button>
              
              <button
                onClick={() => { setActiveTab('audio'); setResults([]); setError(null); setQuery(''); }}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg transition-all ${activeTab === 'audio' ? 'bg-fuchsia-600 text-white shadow-lg' : 'text-white/40 hover:text-white/70'}`}
              >
                <Music size={14} />
                <span className="text-xs font-semibold">Música</span>
              </button>

              <button
                onClick={() => { setActiveTab('movie'); setResults([]); setError(null); setQuery(''); }}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg transition-all ${activeTab === 'movie' ? 'bg-fuchsia-600 text-white shadow-lg' : 'text-white/40 hover:text-white/70'}`}
              >
                <Film size={14} />
                <span className="text-xs font-semibold">Películas</span>
              </button>
            </div>
        </div>

        <p className="text-sm text-white/50 -mt-2">
          {activeTab === 'video' 
            ? 'Encuentra videos en YouTube con autocompletado y carga infinita.' 
            : activeTab === 'audio'
            ? 'Busca música y descarga en alta calidad.'
            : 'Busca películas en servidores premium (PelisPanda y más).'}
        </p>

        <div className="relative mt-2" ref={suggestionRef}>
          <form onSubmit={(e) => handleSearch(e)} className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => query.trim().length > 2 && setShowSuggestions(true)}
              placeholder={activeTab === 'video' ? "Explora videos, música, canales..." : "Escribe el nombre de la película..."}
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

          {/* Autocomplete Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
                {suggestions.map((s, idx) => (
                    <button
                        key={idx}
                        onClick={() => { setQuery(s); handleSearch(undefined); }}
                        className="w-full text-left px-5 py-3 text-sm text-white/70 hover:bg-fuchsia-600 hover:text-white transition-colors flex items-center gap-3 border-b border-white/5 last:border-0"
                    >
                        <Search size={14} className="opacity-40" />
                        {s}
                    </button>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Results Grid */}
      <div className="flex-1 overflow-y-auto px-6 pb-6 custom-scrollbar relative">
        {!isPro && (
          <div className="absolute inset-0 z-[60] flex items-center justify-center p-6 backdrop-blur-[2px] bg-black/40">
            <div className="max-w-md w-full bg-[#1a1a1a] border border-fuchsia-500/20 rounded-3xl p-8 text-center shadow-2xl animate-in zoom-in-95 duration-300">
              <div className="w-16 h-16 bg-fuchsia-600/20 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-fuchsia-500/30">
                <Crown size={32} className="text-fuchsia-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Buscador Interno Pro</h3>
              <p className="text-white/60 text-sm mb-8 leading-relaxed">
                El buscador de películas, música y autocompletado es una función exclusiva de **Universal Pro**. 
                Activa tu licencia para disfrutar de descargas ilimitadas sin salir de la app.
              </p>
              <button 
                onClick={() => {
                  // This is tricky since we don't have onOpenSettings here, 
                  // but we can assume the user will go to settings via the sidebar.
                  // For now, let's just show a tip.
                  alert("Ve a Ajustes -> Sección Pro para activar tu licencia.")
                }}
                className="w-full bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-fuchsia-900/20"
              >
                Activar Ahora
              </button>
            </div>
          </div>
        )}

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
              className="group bg-white/5 border border-white/5 rounded-xl overflow-hidden hover:border-fuchsia-500/30 transition-all hover:bg-white/10 flex flex-col animate-in fade-in zoom-in duration-300"
            >
              <div className={`${activeTab === 'video' ? 'aspect-video' : 'aspect-[2/3]'} relative overflow-hidden bg-black/40`}>
                {item.thumbnail ? (
                  <img 
                    src={item.thumbnail} 
                    alt={item.title} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                    onError={(e) => (e.currentTarget.src = 'https://placehold.co/400x600/1a1a1a/fuchsia?text=Sin+Imagen')}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/5">
                    <Film size={48} />
                  </div>
                )}
                
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

        {/* Load More Button */}
        {results.length > 0 && activeTab === 'video' && (
            <div className="mt-8 flex justify-center">
                <button
                    onClick={() => handleSearch(undefined, true)}
                    disabled={isLoadingMore}
                    className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white px-8 py-3 rounded-full border border-white/10 transition-all font-semibold text-sm active:scale-95 disabled:opacity-50"
                >
                    {isLoadingMore ? (
                        <>
                            <Loader2 size={16} className="animate-spin" />
                            Cargando más...
                        </>
                    ) : (
                        <>
                            <ListPlus size={16} />
                            Ver más resultados
                        </>
                    )}
                </button>
            </div>
        )}
      </div>
    </div>
  )
}
