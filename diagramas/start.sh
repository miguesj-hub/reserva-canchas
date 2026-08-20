#!/bin/bash
# Levanta el visor de diagramas con Structurizr Lite (el WAR local).
#
#   ./start.sh          -> http://localhost:8090
#   ./start.sh 9000     -> http://localhost:9000
#
# Alternativa en contenedor: docker compose up -d
# Ambas sirven exactamente la misma interfaz; esta evita depender de Docker.

set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WAR="$HOME/structurizr-lite/structurizr-lite.war"
PORT="${1:-8090}"

if [ ! -f "$WAR" ]; then
    echo "No se encontró $WAR" >&2
    echo "Usa el contenedor en su lugar:  docker compose up -d" >&2
    exit 1
fi

# Lite busca Graphviz "dot" al arrancar para el auto-layout; sin él recurre al
# Dagre del navegador. Homebrew no está en un PATH mínimo.
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"

pkill -f "structurizr-lite.war.*$DIR" 2>/dev/null || true
sleep 1

echo "Visor:     http://localhost:$PORT"
echo "Workspace: $DIR/workspace.dsl"

# El directorio del workspace debe ser el primer argumento: Lite lee args[0]
# como la ruta, así que un --server.port por delante se tomaría como tal.
exec java -jar "$WAR" "$DIR" --server.port="$PORT"
