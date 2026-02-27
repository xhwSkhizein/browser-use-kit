#!/usr/bin/env bash
#
# Browser Control Server startup script
# Usage: ./scripts/start.sh [--config PATH] [--host HOST] [--port PORT] [--token TOKEN]
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

CONFIG_PATH=""
HOST="127.0.0.1"
PORT="18791"
TOKEN=""

while [[ $# -gt 0 ]]; do
  case $1 in
    --config)
      CONFIG_PATH="$2"
      shift 2
      ;;
    --host)
      HOST="$2"
      shift 2
      ;;
    --port)
      PORT="$2"
      shift 2
      ;;
    --token)
      TOKEN="$2"
      shift 2
      ;;
    --help|-h)
      echo "Usage: $0 [options]"
      echo ""
      echo "Options:"
      echo "  --config PATH   Path to config JSON file"
      echo "  --host HOST     Bind host (default: 127.0.0.1)"
      echo "  --port PORT     Bind port (default: 18791)"
      echo "  --token TOKEN   Authentication token"
      echo "  --help, -h      Show this help"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

if [[ ! -d "$PROJECT_ROOT/dist" ]] || [[ ! -f "$PROJECT_ROOT/dist/cli.js" ]]; then
  echo "Building project..."
  npm run build
fi

ARGS=("--host" "$HOST" "--port" "$PORT")
[[ -n "$CONFIG_PATH" ]] && ARGS+=("--config" "$CONFIG_PATH")
[[ -n "$TOKEN" ]] && ARGS+=("--token" "$TOKEN")

exec bun run dist/cli.js "${ARGS[@]}"
