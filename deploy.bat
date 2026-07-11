@echo off
echo ================================
echo   wordJP 部署到手机 (PWA)
echo ================================
echo.
echo 这将把 wordJP 部署到免费的互联网服务器，
echo 然后你的 iPhone/Android 手机可以独立打开使用。
echo 电脑关闭后也能用。
echo.
echo 接下来会提示你输入邮箱和密码来创建账号（免费）。
echo.
cd /d "D:\Ricardo\Documents\apps\wordJP"
set PATH=C:\Program Files\nodejs;%PATH%
npx surge dist/
pause
