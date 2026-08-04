#!/bin/bash
# Start all ecom services locally with auto-restart on crash

set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "Starting ecom platform..."

# Start Docker services (backend + DB)
docker compose up -d
echo "✓ Backend services started"

# Wait for API gateway to be healthy
echo "Waiting for API gateway..."
until curl -s http://localhost:4000/health > /dev/null 2>&1; do sleep 1; done
echo "✓ API gateway healthy"

# Function to run a Next.js dev server with auto-restart
run_with_restart() {
  local name=$1
  local dir=$2
  local port=$3
  local extra_args=$4

  while true; do
    echo "[$name] Starting on port $port..."
    cd "$SCRIPT_DIR/$dir" && npm run dev -- --port "$port" $extra_args 2>&1 | while IFS= read -r line; do
      echo "[$name] $line"
    done
    echo "[$name] Crashed or exited — restarting in 2s..."
    sleep 2
  done
}

# Start both frontends in background with auto-restart
run_with_restart "platform-ui" "platform-ui" "3100" "" &
PID_UI=$!

run_with_restart "storefront" "storefront" "3200" "--webpack" &
PID_SF=$!

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║         ecom platform is running         ║"
echo "╠══════════════════════════════════════════╣"
echo "║  Admin Dashboard  → http://localhost:3100 ║"
echo "║  Storefront (PWA) → http://localhost:3200 ║"
echo "║  API Gateway      → http://localhost:4000 ║"
echo "╠══════════════════════════════════════════╣"
echo "║  Press Ctrl+C to stop all services       ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# On Ctrl+C, kill everything
cleanup() {
  echo ""
  echo "Stopping all services..."
  kill $PID_UI $PID_SF 2>/dev/null
  docker compose stop
  echo "Done."
  exit 0
}
trap cleanup INT TERM

# Keep alive
wait
