@echo off
echo ==========================================================
echo INICIANDO REHAPP v1.0
echo ==========================================================
echo.
echo No cierres esta ventana negra. Mantenla minimizada.
echo Se abrira tu navegador automaticamente en unos segundos...
echo.

:: Navegar al directorio de la aplicación
cd /d "%~dp0"

:: Iniciar el servidor local de Vite
start "Servidor RehAPP" cmd /c "npm run dev"

:: Esperar 3 segundos para que el servidor levante
timeout /t 3 /nobreak >nul

:: Abrir el navegador en la ruta local
start http://localhost:5173

exit
