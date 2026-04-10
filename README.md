# Universal Downloader Pro

[![License: MIT](https://img.shields.io/badge/License-MIT-fuchsia.svg)](https://opensource.org/licenses/MIT)
[![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Electron](https://img.shields.io/badge/Electron-47848F?logo=electron&logoColor=white)](https://www.electronjs.org/)

Universal Downloader Pro is a professional-grade desktop application for high-performance media acquisition. Built with Electron, React, and Vite, it leverages the industry-standard yt-dlp engine to provide a seamless, high-speed downloading experience for video and audio content from over 1000 supported platforms.

🌐 **Product Website**: [universal-downloader-pro.vercel.app](https://universal-downloader-pro.vercel.app)

---

## 💎 Pro Features

Unlock the full potential of your media library with our **Pro Suite**:

| Feature | Community | Pro |
|---------|-----------|-----|
| **Individual Downloads** | ✅ Ilimitado | ✅ Ilimitado |
| **HD & 4K Streams** | ✅ 1080p | ✅ 4K / 8K / HDR |
| **Playlist Expansion** | ❌ Manual | ✅ Automática (Un-clic) |
| **Bulk Import** | ❌ Hasta 10 links | ✅ Ilimitado (Arreglos Masivos) |
| **Buscador Integrado** | ✅ Básico | ✅ Avanzado + MP3 High Fidelity |
| **Actualizaciones Auto** | ❌ Manual | ✅ Notificaciones en tiempo real |

---

## Technical Architecture

Universal Downloader Pro operates on a decoupled architecture to ensure stability and performance:

1.  **Frontend (React/Vite)**: A reactive UI that manages the download state, user configurations, and real-time logging.
2.  **Orchestrator (Electron Main)**: The central logic hub that manages child processes (yt-dlp), file system operations, and Pro license validation.
3.  **Worker Engines (yt-dlp & FFmpeg)**: Local CLI binaries that handle the heavy lifting of stream extraction and media muxing.

---

## Installation and Deployment

### Getting Started

1.  **Download**: Visit the [Official Landing Page](https://universal-downloader-pro.vercel.app) or check the [Latest Releases](https://github.com/kevorteg/Universal-Downloader-Pro/releases).
2.  **Install**: Run the generated `.exe` installer.
3.  **Go Pro**: Support the project and enter your License Key in the Settings panel to unlock premium features.

### Local Development

```bash
# 1. Clone & Install
git clone https://github.com/kevorteg/Universal-Downloader-Pro
npm install

# 2. Secure Binaries
./download-binaries.ps1

# 3. Development
npm run dev

# 4. Build Production
npm run dist
```

---

## Operational Troubleshooting

### DPAPI Decryption Failures
> [!IMPORTANT]
> Windows security protocols lock browser cookie databases while the browser is active.
>
> **Resolution**: Close all browser instances (Chrome, Edge, etc.) before initiating a download that requires authenticated cookies.

### HTTP 403 Forbidden
If a site blocks access, ensure:
1.  **Cookie Sync** is enabled in Settings.
2.  **Pro Mode** is active for sites requiring high-bandwidth or 4K streams.
3.  The browser is fully closed.

---

## Support & Monetization

This project is maintained by the community and supported by users like you. 

*   **Become a Sponsor**: Help us keep the servers running and the code updated.
*   **Pro License ($5)**: Get a lifetime license to all premium features by sponsoring the developer.

---

## License

Distributed under the MIT License. To ensure license compliance, all forks and redistributions must maintain the original copyright notice found in the LICENSE file.

---

*Developed and maintained by [KevOrteg](https://github.com/kevorteg)*
