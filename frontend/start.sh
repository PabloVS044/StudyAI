#!/bin/bash
set -e
cd "$(dirname "$0")"

if [ ! -d "node_modules" ]; then
  echo "Instalando dependencias de Node..."
  npm install
fi

echo ""
echo "🚀 Iniciando frontend en http://localhost:5173"
echo ""
npm run dev
