#!/usr/bin/env bash
# =============================================================================
# deploy.sh — One-command VPS deployment for image-gen-mvp
#
# Usage (first time):
#   export POSTGRES_PASSWORD="strongpassword123"
#   bash deploy.sh
#
# Usage (subsequent deploys):
#   bash deploy.sh          # pulls latest, rebuilds, restarts
#   bash deploy.sh --logs   # tail container logs after deploy
#   bash deploy.sh --reset  # wipe DB volumes and start fresh (DESTRUCTIVE)
# =============================================================================

set -euo pipefail

# ── Config ────────────────────────────────────────────────────────────────────
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE="docker compose"   # Docker Compose v2
ENV_FILE="$APP_DIR/backend/.env"

# ── Helpers ───────────────────────────────────────────────────────────────────
log()  { echo -e "\033[1;32m[deploy]\033[0m $*"; }
warn() { echo -e "\033[1;33m[warn]\033[0m $*"; }
die()  { echo -e "\033[1;31m[error]\033[0m $*" >&2; exit 1; }

# ── Guards ────────────────────────────────────────────────────────────────────
command -v docker >/dev/null 2>&1 || die "Docker not found. Install Docker Engine first."
docker compose version >/dev/null 2>&1 || die "Docker Compose v2 not found."

[[ -z "${POSTGRES_PASSWORD:-}" ]] && \
  die "POSTGRES_PASSWORD env var is not set. Run: export POSTGRES_PASSWORD=yourpassword"

[[ -f "$ENV_FILE" ]] || \
  die "Backend env file not found at $ENV_FILE. Copy backend/.env.production → backend/.env and fill in secrets."

# ── Handle flags ──────────────────────────────────────────────────────────────
SHOW_LOGS=false
RESET_VOLUMES=false
for arg in "$@"; do
  case "$arg" in
    --logs)  SHOW_LOGS=true ;;
    --reset) RESET_VOLUMES=true ;;
    *) warn "Unknown argument: $arg" ;;
  esac
done

cd "$APP_DIR"

# ── Optional: reset volumes (DESTRUCTIVE) ─────────────────────────────────────
if [[ "$RESET_VOLUMES" == "true" ]]; then
  warn "RESET mode: stopping containers and removing volumes..."
  $COMPOSE down -v --remove-orphans
  log "Volumes cleared."
fi

# ── Pull latest code (skip if not a git repo) ─────────────────────────────────
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  log "Pulling latest code..."
  git pull --rebase
else
  warn "Not a git repository — skipping git pull."
fi

# ── Build & (re)start ─────────────────────────────────────────────────────────
log "Building images..."
POSTGRES_PASSWORD="$POSTGRES_PASSWORD" $COMPOSE build --pull

log "Starting services..."
POSTGRES_PASSWORD="$POSTGRES_PASSWORD" $COMPOSE up -d --remove-orphans

# ── Wait for backend health ────────────────────────────────────────────────────
log "Waiting for backend to become healthy..."
for i in $(seq 1 30); do
  STATUS=$($COMPOSE ps backend --format json 2>/dev/null | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('Health',''))" 2>/dev/null || echo "")
  if [[ "$STATUS" == "healthy" ]]; then
    log "Backend is healthy."
    break
  fi
  [[ $i -eq 30 ]] && warn "Backend health check timed out — check logs with: docker compose logs backend"
  sleep 5
done

# ── Summary ───────────────────────────────────────────────────────────────────
log "Deploy complete."
echo ""
echo "  Containers:"
$COMPOSE ps
echo ""
echo "  Useful commands:"
echo "    docker compose logs -f              # stream all logs"
echo "    docker compose logs -f backend      # backend only"
echo "    docker compose exec backend bash    # shell into backend"
echo "    docker compose down                 # stop everything"
echo ""

if [[ "$SHOW_LOGS" == "true" ]]; then
  $COMPOSE logs -f
fi
