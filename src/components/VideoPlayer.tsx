import React, { useEffect, useRef } from 'react'
import videojs from 'video.js'
import 'video.js/dist/video-js.css'
import { X } from 'lucide-react'

interface VideoPlayerProps {
  url: string;
  title: string;
  onClose?: () => void;
}

function getMimeType(url: string): string {
  const ext = url.split('?')[0].split('.').pop()?.toLowerCase() || ''
  const map: Record<string, string> = {
    mp4: 'video/mp4',
    webm: 'video/webm',
    mkv: 'video/x-matroska',
    mov: 'video/quicktime',
    avi: 'video/x-msvideo',
    m4v: 'video/mp4',
    ogv: 'video/ogg',
    ts: 'video/mp2t',
    flv: 'video/x-flv',
  }
  return map[ext] || 'video/mp4'
}

export default function VideoPlayer({ url, title, onClose }: VideoPlayerProps) {
  const videoRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<any>(null)

  useEffect(() => {
    // Dispose any existing player before creating a new one for the new URL
    if (playerRef.current) {
      playerRef.current.dispose()
      playerRef.current = null
    }

    if (videoRef.current) {
      // Clear the container first
      videoRef.current.innerHTML = ''

      const videoElement = document.createElement('video-js')
      videoElement.classList.add('vjs-big-play-centered', 'vjs-premium-theme')
      videoRef.current.appendChild(videoElement)

      playerRef.current = videojs(videoElement, {
        autoplay: true,
        controls: true,
        responsive: true,
        fluid: true,
        playbackRates: [0.25, 0.5, 1, 1.25, 1.5, 2, 4],
        sources: [{ src: url, type: getMimeType(url) }],
        userActions: { hotkeys: true },
        controlBar: {
          children: [
            'playToggle',
            'volumePanel',
            'currentTimeDisplay',
            'timeDivider',
            'durationDisplay',
            'progressControl',
            'playbackRateMenuButton',
            'subsCapsButton',
            'audioTrackButton',
            'fullscreenToggle',
          ]
        }
      }, () => {
        videojs.log('[VideoPlayer] Ready:', url)
      })
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.dispose()
        playerRef.current = null
      }
    }
  }, [url])

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Player Header */}
      <div className="flex items-center justify-between px-5 py-3 bg-gradient-to-b from-black/80 to-transparent border-b border-white/5 flex-shrink-0">
        <div className="flex flex-col min-w-0">
          <span className="text-[9px] text-amber-400 font-black uppercase tracking-widest font-mono">
            🎬 Pro Integrated Player
          </span>
          <h2 className="text-[13px] font-bold text-white/90 truncate leading-tight mt-0.5">
            {title}
          </h2>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-all text-white/40 hover:text-white group flex-shrink-0 ml-4"
          >
            <X size={18} className="group-hover:rotate-90 transition-transform duration-300" />
          </button>
        )}
      </div>

      {/* Video Surface */}
      <div className="flex-1 relative bg-black" style={{ minHeight: 0 }}>
        <div data-vjs-player ref={videoRef} className="w-full h-full" />
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .vjs-premium-theme.video-js {
          width: 100% !important;
          height: 100% !important;
          background-color: #000;
          font-family: inherit;
        }
        .vjs-premium-theme .vjs-control-bar {
          background: linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 100%) !important;
          height: 56px;
          padding: 0 12px;
          align-items: center;
        }
        .vjs-premium-theme .vjs-big-play-button {
          background: rgba(192, 38, 211, 0.25) !important;
          backdrop-filter: blur(12px);
          border: 2px solid rgba(245, 158, 11, 0.5) !important;
          width: 72px;
          height: 72px;
          border-radius: 50%;
          line-height: 72px;
          transition: all 0.2s !important;
          top: 50% !important;
          left: 50% !important;
          transform: translate(-50%, -50%) !important;
          margin: 0 !important;
        }
        .vjs-premium-theme .vjs-big-play-button:hover {
          background: rgba(245, 158, 11, 0.35) !important;
          border-color: rgba(245, 158, 11, 0.8) !important;
          transform: translate(-50%, -50%) scale(1.08) !important;
        }
        .vjs-premium-theme .vjs-play-progress {
          background-color: rgb(245, 158, 11) !important;
        }
        .vjs-premium-theme .vjs-play-progress:before {
          color: rgb(245, 158, 11) !important;
        }
        .vjs-premium-theme .vjs-slider {
          background-color: rgba(255,255,255,0.15) !important;
          border-radius: 2px;
        }
        .vjs-premium-theme .vjs-volume-level {
          background-color: rgb(245, 158, 11) !important;
        }
        .vjs-premium-theme .vjs-load-progress,
        .vjs-premium-theme .vjs-load-progress div {
          background: rgba(255,255,255,0.1) !important;
        }
      `}} />
    </div>
  )
}
