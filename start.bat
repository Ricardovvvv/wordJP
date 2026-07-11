@echo off
echo ================================
echo   wordJP 日语单词学习 App
echo ================================
echo.
echo 正在启动服务器...
echo.

cd /d "D:\Ricardo\Documents\apps\wordJP"

:: Set Node.js path
set PATH=C:\Program Files\nodejs;%PATH%

:: Start Expo web server
npx expo start --web --port 8081

pause
