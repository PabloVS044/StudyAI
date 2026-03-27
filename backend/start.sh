#!/bin/bash
set -e
cd "$(dirname "$0")"

# Create virtualenv if it doesn't exist
if [ ! -d "venv" ]; then
  echo "Creando entorno virtual..."
  python3 -m venv venv
fi

source venv/bin/activate

echo "Instalando dependencias..."
pip install -q -r requirements.txt

# Check .env
if [ ! -f ".env" ]; then
  echo ""
  echo "⚠️  No existe el archivo .env"
  echo "Copia .env.example a .env y configura tus claves API:"
  echo "  cp .env.example .env"
  echo ""
  exit 1
fi

echo ""
echo "🚀 Iniciando backend en http://localhost:8000"
echo "   Docs: http://localhost:8000/api/docs"
echo ""
python run.py
