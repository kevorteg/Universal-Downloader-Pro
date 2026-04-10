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
  Layers,
  Globe
} from 'lucide-react'

const features = [
  {
    icon: <ListMusic className="w-6 h-6 text-fuchsia-400" />,
    title: "Playlist Expansion",
    desc: "Descarga listas de reproducción enteras con un solo clic. Exclusivo para usuarios Pro."
  },
  {
    icon: <Layers className="w-6 h-6 text-fuchsia-400" />,
    title: "Importación Masiva",
    desc: "Pega docenas de enlaces y deja que la app haga el trabajo pesado por ti."
  },
  {
    icon: <Zap className="w-6 h-6 text-fuchsia-400" />,
    title: "Velocidad Ultra",
    desc: "Motor optimizado con soporte para múltiples conexiones y descargas en paralelo."
  },
  {
    icon: <ShieldCheck className="w-6 h-6 text-fuchsia-400" />,
    title: "Privacidad Total",
    desc: "Sin rastreadores ni telemetría. Tus descargas son privadas por defecto."
  },
  {
    icon: <Crown className="w-6 h-6 text-fuchsia-400" />,
    title: "Calidad Premium",
    desc: "Soporte completo para 4K, 8K y audio de alta fidelidad (320kbps MP3)."
  },
  {
    icon: <Globe className="w-6 h-6 text-fuchsia-400" />,
    title: "Multi-sitio",
    desc: "Soporte para más de 1000 sitios web, incluyendo YouTube, Vimeo y más."
  }
]

const CHECKOUT_URL = 'https://niversal-downloader.lemonsqueezy.com/checkout/buy/948c454e-0a9d-4f16-b43d-5b932cd523c0'

export default function App() {
  return (
    <div className="min-h-screen selection:bg-fuchsia-500/30">
      <div className="bg-mesh" />
      <div className="bg-grid" />

      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 glass border-b border-white/5">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-fuchsia-600 to-purple-600 flex items-center justify-center shadow-lg shadow-fuchsia-500/20 animate-pulse">
              <Download className="text-white w-6 h-6" />
            </div>
            <span className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">UD Pro</span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-white/50">
            <a href="#features" className="hover:text-white transition-colors">Características</a>
            <a href="#pricing" className="hover:text-white transition-colors">Precios</a>
            <a href="#download" className="hover:text-white transition-colors">Descargar</a>
          </div>

          <a href={CHECKOUT_URL} target="_blank" rel="noreferrer" className="btn-primary py-2 px-6 text-sm">
            Comprar Pro
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-20 overflow-hidden">
        <div className="container relative">
          <div className="absolute -top-20 -left-20 w-64 h-64 bg-fuchsia-600/20 blur-[100px] rounded-full" />
          <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-purple-600/20 blur-[100px] rounded-full" />

          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="relative z-10"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-fuchsia-500/10 border border-fuchsia-500/20 text-fuchsia-400 text-xs font-bold mb-6">
                <Sparkles size={14} /> NUEVA VERSIÓN 2.0 DISPONIBLE
              </div>
              <h1 className="text-6xl lg:text-8xl font-bold leading-[1.1] mb-8 tracking-tighter">
                Descarga sin <br />
                <span className="text-gradient">Límites.</span>
              </h1>
              <p className="text-xl text-white/50 mb-10 max-w-lg leading-relaxed font-medium">
                La herramienta definitiva para coleccionistas de medios.
                Rápida, privada y ridículamente potente.
              </p>
              <div className="flex flex-wrap gap-5">
                <a href="#download" className="btn-primary px-10">
                  Descargar Gratis
                  <ChevronRight size={18} />
                </a>
                <a href="#pricing" className="btn-secondary px-10">
                  Explorar Pro
                </a>
              </div>

              <div className="mt-12 flex items-center gap-6">
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-zinc-950 bg-zinc-800 flex items-center justify-center overflow-hidden">
                      <img src={`https://i.pravatar.cc/100?u=${i}`} alt="User" />
                    </div>
                  ))}
                </div>
                <div className="text-sm font-medium">
                  <span className="text-white">2,000+</span> <span className="text-white/40">usuarios activos</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="relative"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-fuchsia-500/20 to-transparent blur-3xl rounded-full" />
              <div className="relative glass-premium rounded-[2.5rem] p-4 animate-float">
                <img
                  src="/mockup.png"
                  alt="UD Pro Interface"
                  className="rounded-[1.5rem] w-full h-auto shadow-2xl"
                />

                {/* Floating elements */}
                <div className="absolute -top-6 -right-6 glass p-4 rounded-2xl shadow-xl animate-float [animation-delay:-2s]">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                      <CheckCircle2 size={18} className="text-emerald-500" />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-white/40 uppercase">Completado</div>
                      <div className="text-xs font-bold">Video 4K Descargado</div>
                    </div>
                  </div>
                </div>

                <div className="absolute -bottom-10 -left-6 glass p-5 rounded-3xl shadow-xl animate-float [animation-delay:-4s]">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-fuchsia-500/20 flex items-center justify-center">
                      <Zap size={20} className="text-fuchsia-400" />
                    </div>
                    <div className="w-32 h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div className="w-3/4 h-full bg-fuchsia-500" />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 border-y border-white/5 bg-white/[0.01]">
        <div className="container grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
          <div>
            <div className="text-4xl font-bold mb-2">1M+</div>
            <div className="text-xs font-bold text-white/30 uppercase tracking-widest">Descargas</div>
          </div>
          <div>
            <div className="text-4xl font-bold mb-2">1000+</div>
            <div className="text-xs font-bold text-white/30 uppercase tracking-widest">Sitios</div>
          </div>
          <div>
            <div className="text-4xl font-bold mb-2">4.9/5</div>
            <div className="text-xs font-bold text-white/30 uppercase tracking-widest">Rating</div>
          </div>
          <div>
            <div className="text-4xl font-bold mb-2">24/7</div>
            <div className="text-xs font-bold text-white/30 uppercase tracking-widest">Soporte</div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-32">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto mb-20">
            <h2 className="text-4xl lg:text-5xl font-bold mb-6 tracking-tight">Potencia sin complicaciones</h2>
            <p className="text-lg text-white/40 font-medium">Todo lo que necesitas para gestionar tu contenido multimedia en un solo lugar.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-10 rounded-[2rem] glass-premium hover:border-fuchsia-500/30 transition-all group cursor-default"
              >
                <div className="w-14 h-14 rounded-2xl bg-fuchsia-500/10 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500">
                  {f.icon}
                </div>
                <h3 className="text-2xl font-bold mb-4">{f.title}</h3>
                <p className="text-white/40 leading-relaxed font-medium">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-32 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-fuchsia-500/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="container relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-20">
            <h2 className="text-4xl lg:text-5xl font-bold mb-6 tracking-tight">Planes Simples</h2>
            <p className="text-lg text-white/40 font-medium">Elige la versión que mejor se adapte a tus necesidades.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-10 max-w-5xl mx-auto">
            {/* Free Plan */}
            <div className="p-12 rounded-[2.5rem] glass border-white/5 flex flex-col">
              <div className="mb-8">
                <span className="text-xs font-bold text-white/30 uppercase tracking-widest mb-4 block">COMUNITARIO</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-bold">$0</span>
                </div>
              </div>
              <ul className="space-y-5 mb-12 flex-grow">
                {[
                  "Descargas ilimitadas (1 a 1)",
                  "Calidad hasta 1080p HD",
                  "Soporte para audio MP3",
                  "Buscador integrado",
                  "Historial de descargas"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-white/50 font-medium">
                    <CheckCircle2 size={18} className="text-white/20" />
                    {item}
                  </li>
                ))}
              </ul>
              <a href="#download" className="btn-secondary w-full justify-center py-4">
                Empezar Gratis
              </a>
            </div>

            {/* Pro Plan */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-fuchsia-600 to-purple-600 rounded-[2.5rem] blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
              <div className="relative p-12 rounded-[2.5rem] bg-zinc-950 border border-white/10 flex flex-col h-full overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <Crown size={120} className="text-fuchsia-500" />
                </div>

                <div className="mb-8">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-fuchsia-500/10 text-fuchsia-400 text-[11px] font-bold mb-4 border border-fuchsia-500/20">
                    <Sparkles size={12} /> RECOMENDADO
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-bold">$5</span>
                    <span className="text-white/30 font-medium text-lg">/ pago único</span>
                  </div>
                </div>

                <ul className="space-y-5 mb-12 flex-grow relative z-10">
                  {[
                    "Todo lo de la versión Gratis",
                    "Descarga de Playlists completas",
                    "Importación Masiva (>10 enlaces)",
                    "Calidad 4K / 8K / HDR 60fps",
                    "Conversión rápida a MP3 (320kbps)",
                    "Soporte prioritario 24/7"
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-white/90 font-medium">
                      <CheckCircle2 size={18} className="text-fuchsia-500" />
                      {item}
                    </li>
                  ))}
                </ul>

                <a href={CHECKOUT_URL} target="_blank" rel="noreferrer" className="btn-primary w-full justify-center py-5 text-lg group">
                  Obtener UD Pro
                  <Crown className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                </a>

                <p className="text-center mt-6 text-xs text-white/30 font-bold uppercase tracking-widest">
                  Licencia de por vida para 2 dispositivos
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="download" className="py-24">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative p-20 rounded-[3.5rem] bg-gradient-to-br from-fuchsia-600/10 to-purple-600/10 border border-fuchsia-500/20 overflow-hidden text-center"
          >
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_transparent_0%,_#050506_100%)] opacity-40" />

            <div className="relative z-10">
              <h2 className="text-5xl lg:text-6xl font-bold mb-8 tracking-tighter">¿Listo para subir de nivel?</h2>
              <p className="text-xl text-white/40 mb-12 max-w-2xl mx-auto font-medium leading-relaxed">
                Descarga UD Pro hoy y empieza a construir tu biblioteca digital
                con la máxima calidad y velocidad.
              </p>
              <div className="flex flex-wrap justify-center gap-6">
                <button className="btn-primary px-12 py-5 text-xl">
                  <Download size={24} />
                  Descargar para Windows
                </button>
              </div>
              <p className="mt-8 text-sm font-bold text-white/20 uppercase tracking-widest">
                Versión 2.0.4 • 64-bit • Compatible con Win 10/11
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t border-white/5 relative bg-zinc-950/50">
        <div className="container">
          <div className="grid md:grid-cols-4 gap-12 mb-20">
            <div className="col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                  <Download size={24} className="text-white" />
                </div>
                <span className="font-bold text-2xl tracking-tight">UD Pro</span>
              </div>
              <p className="text-white/40 max-w-sm font-medium leading-relaxed">
                Potenciando la libertad digital con herramientas sencillas y potentes.
                Desarrollado con ❤️ para la comunidad Pro.
              </p>
            </div>

            <div>
              <h4 className="text-sm font-bold uppercase tracking-widest mb-6 text-white/20">Producto</h4>
              <ul className="space-y-4 text-sm font-medium text-white/50">
                <li><a href="#features" className="hover:text-fuchsia-400 transition-colors">Características</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Precios</a></li>
                <li><a href="#download" className="hover:text-white transition-colors">Descargas</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-bold uppercase tracking-widest mb-6 text-white/20">Comunidad</h4>
              <ul className="space-y-4 text-sm font-medium text-white/50">
                <li><a href="https://github.com/kevorteg/Universal-Downloader-Pro" className="hover:text-white transition-colors">GitHub</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Documentación</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Soporte</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 text-[11px] text-white/20 uppercase tracking-widest font-bold">
            <div>© 2024 UD Pro. Todos los derechos reservados.</div>
            <div className="flex gap-10">
              <a href="#" className="hover:text-white transition-colors">Términos</a>
              <a href="#" className="hover:text-white transition-colors">Privacidad</a>
              <a href="#" className="hover:text-white transition-colors">Cookies</a>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="mt-20 p-10 glass-premium rounded-[2.5rem] border border-fuchsia-500/10 text-center relative overflow-hidden group"
          >
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-fuchsia-500/10 blur-3xl rounded-full transition-transform duration-1000 group-hover:scale-150" />
            <div className="text-fuchsia-400 text-xs font-bold mb-4 tracking-[0.2em] uppercase">PENSAMIENTO DEL DÍA</div>
            <p className="text-2xl text-white/70 italic font-serif leading-relaxed max-w-2xl mx-auto">
              "Todo lo puedo en Cristo que me fortalece."
            </p>
            <div className="mt-4 text-white/30 text-sm font-bold tracking-widest">— FILIPENSES 4:13</div>
          </motion.div>
        </div>
      </footer>
    </div>
  )
}
