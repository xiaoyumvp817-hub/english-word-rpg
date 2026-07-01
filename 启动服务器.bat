@echo off
chcp 65001 >nul
title 英语单词大冒险 — English Word Quest RPG

echo.
echo ╔══════════════════════════════════════════╗
echo ║     ⚔️  英语单词大冒险  ⚔️              ║
echo ║    ENGLISH WORD QUEST RPG                ║
echo ╚══════════════════════════════════════════╝
echo.
echo 正在启动本地服务器...

:: 方法1: 尝试 Python 3
python --version >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] 使用 Python 启动服务器
    echo.
    echo 📱 请在浏览器打开: http://localhost:8080
    echo.
    echo 按 Ctrl+C 可关闭服务器
    echo ─────────────────────────────────────────
    start http://localhost:8080
    python -m http.server 8080
    goto :end
)

:: 方法2: 尝试 Python (py 启动器)
py --version >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] 使用 Python (py) 启动服务器
    echo 📱 浏览器打开: http://localhost:8080
    start http://localhost:8080
    py -m http.server 8080
    goto :end
)

:: 方法3: 尝试 Node.js (npx http-server)
npx --version >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] 使用 Node.js http-server
    echo 📱 浏览器打开: http://localhost:8080
    start http://localhost:8080
    npx http-server -p 8080 -o
    goto :end
)

:: 方法4: 尝试 PHP
php --version >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] 使用 PHP 内置服务器
    echo 📱 浏览器打开: http://localhost:8080
    start http://localhost:8080
    php -S localhost:8080
    goto :end
)

:: 全部失败
echo [FAIL] 未找到可用的服务器工具！
echo.
echo 请安装以下任一工具：
echo   1. Python 3: https://www.python.org/downloads/
echo      (安装时勾选 "Add Python to PATH")
echo   2. Node.js: https://nodejs.org/
echo.
echo 安装后重新运行本脚本即可。
echo.
pause
:end
