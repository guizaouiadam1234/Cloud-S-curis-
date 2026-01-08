#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/cloud-securise}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
ENV_FILE="${ENV_FILE:-.env}"

BACKEND_IMAGE_TAG="${BACKEND_IMAGE_TAG:-}"
FRONTEND_IMAGE_TAG="${FRONTEND_IMAGE_TAG:-}"
GHCR_USER="${GHCR_USER:-}"
GHCR_TOKEN="${GHCR_TOKEN:-}"

if [[ -z "$BACKEND_IMAGE_TAG" || -z "$FRONTEND_IMAGE_TAG" ]]; then
  echo "ERROR: BACKEND_IMAGE_TAG and FRONTEND_IMAGE_TAG must be set" >&2
  exit 2
fi
if [[ -z "$GHCR_USER" || -z "$GHCR_TOKEN" ]]; then
  echo "ERROR: GHCR_USER and GHCR_TOKEN must be set (PAT with read:packages)" >&2
  exit 2
fi

mkdir -p "$APP_DIR"
cd "$APP_DIR"

if ! command -v curl >/dev/null 2>&1; then
  echo "ERROR: curl not installed (required for health check). Install it, e.g.: sudo apt-get update && sudo apt-get install -y curl" >&2
  exit 3
fi

if [[ ! -f "$COMPOSE_FILE" ]]; then
  echo "ERROR: compose file '$COMPOSE_FILE' not found in $APP_DIR" >&2
  echo "Tip: CI should upload it to $APP_DIR/$COMPOSE_FILE" >&2
  ls -la >&2 || true
  exit 4
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "ERROR: docker not installed" >&2
  exit 3
fi

if docker compose version >/dev/null 2>&1; then
  DOCKER_COMPOSE=(docker compose)
elif command -v docker-compose >/dev/null 2>&1; then
  DOCKER_COMPOSE=(docker-compose)
else
  echo "ERROR: docker compose not installed (need docker compose v2 or docker-compose)" >&2
  exit 3
fi

echo "$GHCR_TOKEN" | docker login ghcr.io -u "$GHCR_USER" --password-stdin >/dev/null

if [[ -f "$ENV_FILE" ]]; then
  cp -f "$ENV_FILE" "${ENV_FILE}.prev"
fi

cat > "$ENV_FILE" <<EOF
BACKEND_IMAGE_TAG=${BACKEND_IMAGE_TAG}
FRONTEND_IMAGE_TAG=${FRONTEND_IMAGE_TAG}
EOF

echo "Pulling images..."
"${DOCKER_COMPOSE[@]}" -f "$COMPOSE_FILE" --env-file "$ENV_FILE" pull

echo "Starting containers..."
"${DOCKER_COMPOSE[@]}" -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d --remove-orphans

echo "Waiting for backend health..."
ok=0
for i in {1..30}; do
  if curl -fsS "http://localhost:8080/actuator/health" | grep -q '"status"\s*:\s*"UP"'; then
    ok=1
    break
  fi
  sleep 2
done

if [[ "$ok" != "1" ]]; then
  echo "ERROR: health check failed; rolling back..." >&2

  if [[ -f "${ENV_FILE}.prev" ]]; then
    mv -f "${ENV_FILE}.prev" "$ENV_FILE"
    "${DOCKER_COMPOSE[@]}" -f "$COMPOSE_FILE" --env-file "$ENV_FILE" pull
    "${DOCKER_COMPOSE[@]}" -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d --remove-orphans
  else
    echo "No previous env file found; cannot rollback automatically" >&2
  fi

  echo "Backend logs (last 200 lines):" >&2
  "${DOCKER_COMPOSE[@]}" -f "$COMPOSE_FILE" --env-file "$ENV_FILE" logs --no-color --tail=200 backend >&2 || true
  exit 1
fi

echo "Deployment OK"
