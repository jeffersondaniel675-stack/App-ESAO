#!/usr/bin/env bash
# Inicia o sistema em Linux/macOS (equivalente ao INICIAR.bat do Windows).
set -euo pipefail

cd "$(dirname "$0")"

echo "============================================================"
echo "  Intendência - ESAO 2026"
echo "============================================================"
echo

if ! command -v node >/dev/null 2>&1; then
  echo "[ERRO] Node.js não encontrado. Instale o Node.js 20 ou superior: https://nodejs.org"
  exit 1
fi

echo "Node.js encontrado: $(node -v)"
echo

if [ ! -d node_modules ]; then
  echo "Primeira execução: instalando dependências..."
  npm install
  echo
fi

echo "Iniciando o sistema em http://localhost:${PORT:-3000}"
echo "Para encerrar, pressione Ctrl+C."
echo
exec npm run dev
