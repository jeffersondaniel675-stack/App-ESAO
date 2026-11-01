@echo off
setlocal
rem ==================================================================
rem  Cria o atalho "Sistema da 1a Cia" na area de trabalho e no menu
rem  Iniciar, abrindo o sistema numa janela propria (Chrome ou Edge)
rem  com o icone do 11o D Sup. Deixe o arquivo sistema-1cia.ico na
rem  mesma pasta deste arquivo.
rem
rem  Para nao precisar colar o link toda vez, troque a linha abaixo
rem  pelo link /exec do sistema (sem aspas).
rem ==================================================================
set "LINK=COLE_AQUI_O_LINK_EXEC"

title Atalho do Sistema da Cia
echo.
echo  ===  Atalho do Sistema da Cia  ===
echo.

if "%LINK%"=="COLE_AQUI_O_LINK_EXEC" (
  echo  Cole o link do sistema, o que termina em /exec
  echo  ^(clique com o botao direito aqui para colar^) e tecle Enter:
  echo.
  set /p "LINK=  Link: "
)

if not exist "%~dp0sistema-1cia.ico" (
  echo.
  echo  ERRO: o arquivo sistema-1cia.ico precisa estar na mesma pasta deste arquivo.
  goto fim
)

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$ErrorActionPreference = 'Stop';" ^
  "$link = ([string]$env:LINK).Trim().Trim([char]34);" ^
  "if ($link -notmatch '^https://script\.google\.com/.+/exec$') { Write-Host ''; Write-Host '  ERRO: o link precisa comecar com https://script.google.com e terminar em /exec.'; exit 1 };" ^
  "$pf = $env:ProgramFiles; $px = ${env:ProgramFiles(x86)}; $la = $env:LocalAppData;" ^
  "$navs = @(($pf + '\Google\Chrome\Application\chrome.exe'), ($px + '\Google\Chrome\Application\chrome.exe'), ($la + '\Google\Chrome\Application\chrome.exe'), ($px + '\Microsoft\Edge\Application\msedge.exe'), ($pf + '\Microsoft\Edge\Application\msedge.exe'));" ^
  "$nav = $navs | Where-Object { Test-Path $_ } | Select-Object -First 1;" ^
  "if (-not $nav) { Write-Host ''; Write-Host '  ERRO: nao encontrei o Google Chrome nem o Microsoft Edge neste computador.'; exit 1 };" ^
  "$pasta = Join-Path $env:LocalAppData 'SistemaCia'; New-Item -ItemType Directory -Force -Path $pasta | Out-Null;" ^
  "$ico = Join-Path $pasta 'sistema-1cia.ico'; Copy-Item -Force (Join-Path '%~dp0' 'sistema-1cia.ico') $ico;" ^
  "$nome = 'Sistema da 1' + [char]0x00AA + ' Cia';" ^
  "$sh = New-Object -ComObject WScript.Shell;" ^
  "$destinos = @([Environment]::GetFolderPath('Desktop'), [Environment]::GetFolderPath('Programs'));" ^
  "foreach ($d in $destinos) { $a = $sh.CreateShortcut((Join-Path $d ($nome + '.lnk'))); $a.TargetPath = $nav; $a.Arguments = '--app=' + $link; $a.IconLocation = $ico + ',0'; $a.Description = 'Sistema da Companhia'; $a.WorkingDirectory = Split-Path $nav; $a.Save() };" ^
  "Write-Host ''; Write-Host ('  Pronto! Atalho criado na area de trabalho e no menu Iniciar (' + (Split-Path $nav -Leaf) + ').');" ^
  "Write-Host '  Para fixar na barra de tarefas: abra o atalho, clique com o botao direito no icone da barra e escolha Fixar.'"

:fim
echo.
pause
