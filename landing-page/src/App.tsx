import { motion } from 'framer-motion'
import { 
  Download, 
  Crown, 
  Sparkles, 
  CheckCircle2, 
  ListMusic, 
  Zap, 
  ShieldCheck, 
  ChevronRight,
  Share2,
  ExternalLink,
  Layers,
  Globe
} from 'lucide-react'

const features = [
  {
    icon: <ListMusic className="text-fuchsia-400" />,
    title: "Playlist Expansion",
    desc: "Descarga listas de reproducción enteras de YouTube y más con un solo clic. Exclusivo para usuarios Pro."
  },
  {
    icon: <Layers className="text-fuchsia-400" />,
    title: "Importación Masiva",
    desc: "Pega docenas de enlaces y deja que la app haga el trabajo pesado por ti. Sin límites para Pro."
  },
  {
    icon: <Zap className="text-fuchsia-400" />,
    title: "Velocidad Ultra",
    desc: "Motor optimizado con soporte para múltiples conexiones simultáneas y descargas en paralelo."
  },
  {
    icon: <ShieldCheck className="text-fuchsia-400" />,
    title: "Privacidad Total",
    desc: "Tus descargas son tuyas. Sin rastreadores, sin telemetría intrusiva. Solo tú y tus archivos."
  },
  {
    icon: <Crown className="text-fuchsia-400" />,
    title: "Calidad Premium",
    desc: "Soporte completo para 4K, 8K y audio de alta fidelidad (320kbps MP3)."
  },
  {
    icon: <Globe className="text-fuchsia-400" />,
    title: "Versículos Diarios",
    desc: "Una pequeña dosis de fe y reflexión integrada en tu flujo de trabajo diario."
  }
]

export default function App() {
  return (
    <div className="min-h-screen">
      <div className="bg-mesh" />
      <div className="bg-grid" />

      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 glass border-b border-white/5">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/icon.png" alt="UD Pro" className="w-10 h-10 object-contain shadow-lg shadow-fuchsia-500/10" />
            <span className="font-bold text-2xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">Universal Downloader Pro</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-white/70">
            <a href="#features" className="hover:text-fuchsia-400 transition-colors">Características</a>
            <a href="#pricing" className="hover:text-fuchsia-400 transition-colors">Precios</a>
            <a 
              href="https://github.com/kevorteg/Universal-Downloader-Pro" 
              target="_blank" 
              rel="noreferrer" 
              className="hover:text-fuchsia-400 transition-all flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/10 hover:bg-white/10 hover:border-fuchsia-500/30 font-medium"
            >
              <Globe size={16} /> <span>Open Source</span>
            </a>
          </div>

          <a href="#download" className="btn-primary py-2.5 px-8 text-sm transform transition-all hover:scale-105 active:scale-95 shadow-lg shadow-fuchsia-500/20">
            Descargar Gratis
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20">
        <div className="container grid lg:grid-cols-2 gap-12 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="h-12" /> {/* More breathing room after removing banner */}
            <h1 className="text-5xl lg:text-7xl font-bold leading-tight mb-6">
              Descarga sin <br />
              <span className="text-gradient">Límites.</span>
            </h1>
            <p className="text-lg text-white/60 mb-8 max-w-lg leading-relaxed">
              La herramienta definitiva para descargar videos, audio y torrents. 
              Ahora con funciones Pro que transformarán tu biblioteca digital.
            </p>
            <div className="flex flex-wrap gap-4">
              <a href="#download" className="btn-primary">
                Descargar Ahora
                <ChevronRight size={18} />
              </a>
              <a href="#pricing" className="btn-secondary">
                Ver Planes Pro
              </a>
            </div>
            <div className="mt-8 flex items-center gap-3 text-white/40 text-sm">
              <CheckCircle2 size={14} className="text-emerald-500" />
              <span>Soporta 1000+ sitios web</span>
              <span className="opacity-20">|</span>
              <CheckCircle2 size={14} className="text-emerald-500" />
              <span>Sin publicidad</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9, rotateY: 10 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            transition={{ duration: 1 }}
            className="relative lg:ml-auto"
          >
            <div className="absolute -inset-4 bg-fuchsia-500/20 blur-3xl rounded-full" />
            <div className="relative glass rounded-2xl p-2 shadow-2xl shadow-black/50 float">
              <img 
                src="/mockup.png" 
                alt="UD Pro Interface" 
                className="rounded-xl w-full h-auto object-cover"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="bg-white/5 py-24">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">Todo lo que necesitas en una sola App</h2>
            <p className="text-white/50">Diseñado para ser rápido, ligero y extremadamente potente.</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-8 rounded-2xl glass hover:border-fuchsia-500/30 transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-fuchsia-500/10 flex items-center justify-center mb-6 group-hover:bg-fuchsia-500/20 transition-colors">
                  {f.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{f.title}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">Mantenlo Simple. Mantenlo Pro.</h2>
            <p className="text-white/50">Apoya el desarrollo y desbloquea el potencial máximo.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Plan */}
            <div className="p-10 rounded-3xl glass border-white/5 flex flex-col items-center">
              <span className="text-[11px] font-bold text-white/40 uppercase tracking-widest mb-2">Comunitario</span>
              <h3 className="text-3xl font-bold mb-6">Gratis</h3>
              <ul className="space-y-4 mb-10 text-sm text-white/60 w-full">
                <li className="flex items-center gap-3">
                  <CheckCircle2 size={16} className="text-white/20" />
                  Descargas individuales ilimitadas
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 size={16} className="text-white/20" />
                  Calidad hasta 1080p
                </li>
                <li className="flex items-center gap-3 opacity-30">
                  <CheckCircle2 size={16} />
                  Listas de reproducción
                </li>
                <li className="flex items-center gap-3 opacity-30">
                  <CheckCircle2 size={16} />
                  Importación masiva (&gt;10 links)
                </li>
              </ul>
              <a href="#download" className="btn-secondary w-full justify-center">Descargar</a>
            </div>

            {/* Pro Plan */}
            <div className="p-1 root rounded-3xl bg-gradient-to-tr from-fuchsia-600 to-purple-600 shadow-2xl shadow-fuchsia-500/20">
              <div className="p-10 rounded-[22px] bg-zinc-950 flex flex-col items-center h-full">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-fuchsia-500/10 text-fuchsia-400 text-[10px] font-bold mb-2">
                  <Sparkles size={10} /> RECOMENDADO
                </div>
                <h3 className="text-3xl font-bold mb-6">$5 <span className="text-sm font-normal text-white/40">/ De por vida</span></h3>
                <ul className="space-y-4 mb-10 text-sm text-white/80 w-full">
                  <li className="flex items-center gap-3">
                    <CheckCircle2 size={16} className="text-fuchsia-400" />
                    Todo lo de la versión Gratis
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 size={16} className="text-fuchsia-400" />
                    Expansión de Playlists Ilimitada
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 size={16} className="text-fuchsia-400" />
                    Importación Masiva Ilimitada
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 size={16} className="text-fuchsia-400" />
                    Soporte para 4K / 8K / HDR
                  </li>
                </ul>
                <button 
                  onClick={() => window.open('https://github.com/sponsors/kevorteg', '_blank')}
                  className="btn-primary w-full justify-center"
                >
                  Obtener Licencia Pro
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Download Section */}
      <section id="download" className="py-24 relative overflow-hidden">
        <div className="container relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="glass p-16 rounded-[3rem] border-fuchsia-500/20"
          >
            <h2 className="text-4xl lg:text-5xl font-bold mb-6">¿Listo para empezar?</h2>
            <p className="text-lg text-white/60 mb-10 max-w-xl mx-auto leading-relaxed">
              Únete a miles de usuarios que ya disfrutan de la libertad de descargar 
              contenido sin complicaciones.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <button className="btn-primary px-10 py-4 text-lg">
                <Download size={20} />
                Descargar para Windows
              </button>
              <div className="w-full mt-4 text-xs text-white/30">
                Próximamente para macOS y Linux.
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/5">
        <div className="container">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-12">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded bg-white/10 flex items-center justify-center">
                <Download size={14} />
              </div>
              <span className="font-bold text-sm">Universal Downloader Pro</span>
            </div>
            
            <div className="flex items-center gap-6">
              <a href="#" className="text-white/40 hover:text-white transition-colors"><Globe size={18} /></a>
              <a href="#" className="text-white/40 hover:text-white transition-colors"><Share2 size={18} /></a>
              <a href="#" className="text-white/40 hover:text-white transition-colors"><ExternalLink size={18} /></a>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 text-[11px] text-white/20 uppercase tracking-widest font-bold">
            <div>© 2024 UD Pro. Todos los derechos reservados.</div>
            <div className="flex gap-8">
              <a href="#" className="hover:text-white transition-colors">Términos</a>
              <a href="#" className="hover:text-white transition-colors">Privacidad</a>
              <a href="#" className="hover:text-white transition-colors">Contacto</a>
            </div>
          </div>

          <div className="mt-12 text-center p-6 bg-fuchsia-600/5 rounded-2xl border border-fuchsia-500/10">
            <div className="text-fuchsia-400 text-xs font-bold mb-2">PENSAMIENTO DEL DÍA</div>
            <p className="text-sm text-white/50 italic font-medium">
              "Todo lo puedo en Cristo que me fortalece." - Filipenses 4:13
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
