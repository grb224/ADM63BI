@echo off
echo ========================================================
echo   Rotina Automatica: SAG - Banco e Controles
echo   Data: %date% %time%
echo ========================================================

cd /d "C:\Users\guilh\Desktop\PROJETOS\ADM63BI\script_gestao_orcamentaria"

echo [1/5] Iniciando atualizar_banco.py...
"%LOCALAPPDATA%\Programs\Python\Python312\python.exe" atualizar_banco.py
if %ERRORLEVEL% neq 0 (
    echo Erro ao rodar atualizar_banco.py
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [2/5] Iniciando atualizar_controles.py...
"%LOCALAPPDATA%\Programs\Python\Python312\python.exe" atualizar_controles.py
if %ERRORLEVEL% neq 0 (
    echo Erro ao rodar atualizar_controles.py
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [3/5] Iniciando atualizar_creditos.py...
"%LOCALAPPDATA%\Programs\Python\Python312\python.exe" atualizar_creditos.py
if %ERRORLEVEL% neq 0 (
    echo Erro ao rodar atualizar_creditos.py
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [4/7] Iniciando gerar_projecao.py...
"%LOCALAPPDATA%\Programs\Python\Python312\python.exe" gerar_projecao.py
if %ERRORLEVEL% neq 0 (
    echo Aviso: gerar_projecao.py retornou erro - continuando rotina...
)

echo.
echo [SITE] Atualizando dados do site Netlify...
"%LOCALAPPDATA%\Programs\Python\Python312\python.exe" gerar_dados.py
if %ERRORLEVEL% neq 0 (
    echo Aviso: gerar_dados.py retornou erro - continuando rotina...
)

echo.
echo [5/6] Iniciando atualizar_logs.py...
"%LOCALAPPDATA%\Programs\Python\Python312\python.exe" atualizar_logs.py
if %ERRORLEVEL% neq 0 (
    echo Erro ao rodar atualizar_logs.py
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [6/6] Iniciando relatorio_diario.py...
"%LOCALAPPDATA%\Programs\Python\Python312\python.exe" relatorio_diario.py
if %ERRORLEVEL% neq 0 (
    echo Erro ao rodar relatorio_diario.py
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [GIT] Verificando e enviando atualizacoes para o GitHub...
cd /d "C:\Users\guilh\Desktop\PROJETOS\ADM63BI"
where git >nul 2>nul
if %ERRORLEVEL% equ 0 (
    git add .
    git commit -m "Auto-update: %date% %time%"
    git push origin main
) else (
    echo [Aviso] Executavel do Git nao encontrado no PATH. Pulei o envio ao GitHub.
)

echo.
echo ========================================================
echo   Todas as atualizacoes foram concluidas com sucesso!
echo ========================================================
timeout /t 5 >nul

