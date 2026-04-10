# Automatic Binary Downloader for Universal Downloader Pro
# This script downloads yt-dlp and FFmpeg to the bin/ folder for zero-dependency distribution.

$binDir = Join-Path (Get-Location) "bin"
if (!(Test-Path $binDir)) {
    New-Item -ItemType Directory -Path $binDir -Force
}

Write-Host "Downloading yt-dlp.exe..." -ForegroundColor Cyan
$ytDlpUrl = "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe"
Invoke-WebRequest -Uri $ytDlpUrl -OutFile (Join-Path $binDir "yt-dlp.exe")

Write-Host "Downloading FFmpeg (Essentials)..." -ForegroundColor Cyan
# Using a stable mirror for FFmpeg essentials
$ffmpegUrl = "https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip"
$zipFile = Join-Path $binDir "ffmpeg.zip"
$tempExtract = Join-Path $binDir "temp_ffmpeg"

Invoke-WebRequest -Uri $ffmpegUrl -OutFile $zipFile

Write-Host "Extracting FFmpeg..." -ForegroundColor Cyan
Expand-Archive -Path $zipFile -DestinationPath $tempExtract -Force

# Move executables from the nested bin folder to the project bin folder
Get-ChildItem -Path "$tempExtract\*\bin\*.exe" | Move-Item -Destination $binDir -Force

Write-Host "Cleaning up temporary files..." -ForegroundColor Cyan
Remove-Item $zipFile -Force
Remove-Item $tempExtract -Recurse -Force

Write-Host "Done! Binaries are ready in the bin/ folder." -ForegroundColor Green
Write-Host "Now you can run: npm run dist" -ForegroundColor Yellow