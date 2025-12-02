@echo off
chcp 65001 >nul
echo.
echo ╔══════════════════════════════════════════════════════════╗
echo ║     MIND CUBE 心理测评管理平台 - 一键部署脚本          ║
echo ╚══════════════════════════════════════════════════════════╝
echo.

REM 检查 PowerShell 是否可用
where powershell >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ 未找到 PowerShell，请使用 Node.js 脚本部署:
    echo    npm run deploy
    pause
    exit /b 1
)

REM 运行 PowerShell 部署脚本
powershell -ExecutionPolicy Bypass -File "%~dp0scripts\deploy.ps1"

pause

