# Universal Downloader Pro

[![License: MIT](https://img.shields.io/badge/License-MIT-fuchsia.svg)](https://opensource.org/licenses/MIT)
[![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Electron](https://img.shields.io/badge/Electron-47848F?logo=electron&logoColor=white)](https://www.electronjs.org/)

Universal Downloader Pro is a high-performance desktop application designed for seamless media acquisition from virtually any source. Built with a modern tech stack (Electron + React + Vite), it leverages the power of yt-dlp and WebTorrent to provide a robust and versatile downloading experience.

---

## Features

| Category               | Description                                                                 |
|-----------------------|-----------------------------------------------------------------------------|
| **Broad Support**     | Native support for YouTube, VK, PornHub, X (Twitter), and 1000+ other sites via yt-dlp integration. |
| **P2P Capability**    | Built-in WebTorrent client for magnet link and .torrent file management and downloading. |
| **Advanced Merging**  | Automated high-definition video and audio stream merging using FFmpeg.       |
| **OS Optimization**   | Specifically tuned for Windows environment, including DPAPI handling and path length management. |
| **Professional UI**   | Minimalist, high-contrast dashboard with comprehensive download monitoring. |
| **Cookie Management** | Native support for browser session persistence to access restricted or private content. |

---

## Architecture and Core Technologies

- **Frontend Environment**: React 18 with Tailwind CSS for high-fidelity UI rendering.
- **Backend Framework**: Electron 28 utilizing IPC-based communication for secure and efficient process handling.
- **Download Engine**: Integrated yt-dlp and FFmpeg CLI for media processing.
- **P2P Protocol**: WebTorrent implementation (v2+) with dynamic ESM bridge.
- **Build Pipeline**: Optimized Vite configuration with electron-builder for production distribution.

---

## Installation and Deployment

### Prerequisites

- Node.js (v18+)
- FFmpeg (Must be available in the system PATH)
- yt-dlp (Must be available in the system PATH)

### Development Setup

```bash
# Clone the repository
git clone https://github.com/kevorteg/Universal-Downloader-Pro
cd Universal-Downloader-Pro

# Install project dependencies
npm install

# Start development server
npm run dev
```

### Production Build

```bash
# Generate the distribution package for Windows
npm run dist
```

---

## Operational Troubleshooting

### DPAPI Decryption Failures (Windows Specific)
Windows DPAPI security inhibits access to Chromium-based browser cookie databases while the browser is active.
- **Resolution**: Ensure the source browser is fully terminated before initiating a download that requires cookie authentication.

### HTTP 403 Forbidden Errors
In cases of access denial on specific domains:
1. Navigate to the **Global Configuration** section.
2. Enable the **Cookie Synchronization** option.
3. Verify that the correct browser profile is selected.
4. Confirm the browser instance is not running to avoid file locking issues.

---

## License

Distributed under the **MIT License**. Refer to the `LICENSE` document for complete legal terms.

---

Developed and maintained by [KevOrteg](https://github.com/kevorteg)
