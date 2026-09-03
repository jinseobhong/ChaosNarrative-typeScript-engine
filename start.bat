@echo off
chcp 65001 >nul
title Abyss Engine - Fantasy Text RPG & Character Studio
cls
echo ====================================================================
echo   ABYSS ENGINE v2.5 Enterprise Master Architecture
echo   PC Fantasy Dating Sim Text RPG & Multi-Model Cascade Server
echo ====================================================================
echo.
echo [1] .env 환경 변수 확인 중...
if not exist .env (
    echo [주의] .env 파일이 없습니다. .env.example을 복사하여 .env를 생성합니다.
    copy .env.example .env >nul
    echo .env 파일이 생성되었습니다. API 키(GEMINI_API_KEY, ANTHROPIC_API_KEY)를 입력해 주세요.
)

echo [2] 백엔드 프록시 서버(Port 3001) 및 웹 프론트엔드(Port 3000) 동시 실행...
echo.
echo --------------------------------------------------------------------
echo   브라우저 접속 주소: http://localhost:3000/
echo   종료하려면 이 창에서 Ctrl + C를 누르세요.
echo --------------------------------------------------------------------
echo.

npm run dev
pause
