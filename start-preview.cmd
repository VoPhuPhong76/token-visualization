@echo off
cd /d "%~dp0"
echo Open http://localhost:8000 in your browser.
echo Keep this window open while viewing the website.
"%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe" -m http.server 8000 --bind 127.0.0.1
pause
