# Universal Downloader Pro

[![License: MIT](https://img.shields.io/badge/License-MIT-fuchsia.svg)](https://opensource.org/licenses/MIT)
[![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Electron](https://img.shields.io/badge/Electron-47848F?logo=electron&logoColor=white)](https://www.electronjs.org/)

Universal Downloader Pro is a professional-grade desktop application for high-performance media acquisition. Built with Electron, React, and Vite, it leverages the industry-standard yt-dlp engine to provide a seamless, high-speed downloading experience for video and audio content from over 1000 supported platforms.

---

## Key Features

| Category               | Description                                                                 |
|-----------------------|-----------------------------------------------------------------------------|
| **Broad Platform Support** | Native integration with yt-dlp for YouTube, VK, X (Twitter), and thousands more. |
| **HD Stream Merging** | Automated processing of high-definition video and audio streams via embedded FFmpeg. |
| **Zero-Dependency**   | Standalone distribution: FFmpeg and yt-dlp binaries are bundled within the application. |
| **Secure Authentication** | Support for browser cookie synchronization to access private or restricted content. |
| **Pro Dashboard**     | Minimalist, high-contrast UI with real-time progress, speed, and ETA monitoring. |
| **Windows Optimized** | Specifically tuned for NTFS path management and DPAPI (Data Protection API) handling. |

---

## Technical Architecture

Universal Downloader Pro operates on a decoupled architecture to ensure stability and performance:

1.  **Frontend (React/Vite)**: A reactive UI that manages the download state, user configurations, and real-time logging. It communicates with the backend via a secure IPC (Inter-Process Communication) bridge.
2.  **Orchestrator (Electron Main)**: The central logic hub that manages child processes (yt-dlp), file system operations, and native Windows API calls (like DPAPI).
3.  **Worker Engines (yt-dlp & FFmpeg)**: Local CLI binaries that handle the heavy lifting of stream extraction and media muxing.

---

## Installation and Deployment

### Prerequisites

*   **Node.js** (v18.0+)
*   **Git**

### Local Development

```bash
# 1. Clone the repository
git clone https://github.com/kevorteg/Universal-Downloader-Pro
cd Universal-Downloader-Pro

# 2. Install dependencies
npm install

# 3. Secure Binaries (Automated Script)
# This downloads the required yt-dlp and FFmpeg executables into the /bin folder
./download-binaries.ps1

# 4. Start Development Server
npm run dev
```

> [!TIP]
> Use the ./download-binaries.ps1 script to ensure you always have the latest validated versions of the worker engines.

### Production Build (Release)

To generate a standalone Windows installer (.exe):

```bash
npm run dist
```

---

## Operational Troubleshooting

### DPAPI Decryption Failures
> [!IMPORTANT]
> Windows security protocols lock browser cookie databases while the browser is active.
>
> **Resolution**: Close all browser instances (Chrome, Brave, etc.) before initiating a download that requires authenticated cookies.

### HTTP 403 Forbidden Errors
> [!WARNING]
> If a site blocks access, it usually means your session cookies are required or the User-Agent is being restricted.
>
> 1.  Navigate to the Settings section.
2.  Select the corresponding browser for Cookie Sync.
3.  Ensure the browser is fully closed to allow access to the database.

---

## Contributing

We welcome contributions! Please refer to our CONTRIBUTING.md for guidelines on how to submit pull requests and maintain high code quality.

---

## Support the Project

If you find Universal Downloader Pro useful, consider supporting its development. You can find the Sponsor button at the top of the repository to contribute via GitHub Sponsors, Patreon, or Ko-fi.

---

## License

Distributed under the MIT License. The MIT license is a permissive license that is short and to the point. It lets people do anything they want with your code as long as they provide attribution back to you and don’t hold you liable.

> [!NOTE]
> To ensure license compliance, all forks and redistributions must maintain the original copyright notice found in the LICENSE file.

---

*Developed and maintained by [KevOrteg](https://github.com/kevorteg)*
