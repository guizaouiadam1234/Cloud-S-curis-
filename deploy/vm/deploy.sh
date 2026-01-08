#!/usr/bin/env bash
set -Eeuo pipefail

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

rollback_in_progress=0

rollback() {
  if [[ "$rollback_in_progress" == "1" ]]; then
    return 0
  fi
  rollback_in_progress=1

  if [[ ! -f "${ENV_FILE}.prev" ]]; then
    echo "No previous env file found; cannot rollback automatically" >&2
    return 0
  fi

  echo "Rolling back to previous deployment..." >&2
  cp -f "${ENV_FILE}.prev" "$ENV_FILE" || true
  "${DOCKER_COMPOSE[@]}" -f "$COMPOSE_FILE" --env-file "$ENV_FILE" pull || true
  "${DOCKER_COMPOSE[@]}" -f "$COMPOSE_FILE" --env-file "$ENV_FILE" down --remove-orphans || true
  "${DOCKER_COMPOSE[@]}" -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d --remove-orphans || true
}

on_error() {
  local exit_code=$?
  local line_no=${1:-?}
  echo "ERROR: deployment failed (exit=${exit_code}) at line ${line_no}" >&2
  rollback
  exit "$exit_code"
}

echo "$GHCR_TOKEN" | docker login ghcr.io -u "$GHCR_USER" --password-stdin >/dev/null

if [[ -f "$ENV_FILE" ]]; then
  cp -f "$ENV_FILE" "${ENV_FILE}.prev"
fi

# From this point onward, if anything fails we restore the previous .env and
# attempt to bring the previous images back up.
trap 'on_error $LINENO' ERR

cat > "$ENV_FILE" <<EOF
BACKEND_IMAGE_TAG=${BACKEND_IMAGE_TAG}
FRONTEND_IMAGE_TAG=${FRONTEND_IMAGE_TAG}
EOF

echo "Pulling images..."
"${DOCKER_COMPOSE[@]}" -f "$COMPOSE_FILE" --env-file "$ENV_FILE" pull

echo "Stopping previous stack (to free ports)..."
"${DOCKER_COMPOSE[@]}" -f "$COMPOSE_FILE" --env-file "$ENV_FILE" down --remove-orphans || true

LEGACY_COMPOSE_PROJECT="${LEGACY_COMPOSE_PROJECT:-projet_cloud_securise}"

# If a previous (legacy) compose project is still running (e.g. projet_cloud_securise),
# it can keep ports allocated even after bringing THIS stack down.
legacy_ids="$(docker ps -q --filter "label=com.docker.compose.project=${LEGACY_COMPOSE_PROJECT}")"
if [[ -n "$legacy_ids" ]]; then
  echo "Legacy compose project '${LEGACY_COMPOSE_PROJECT}' still running; stopping/removing its containers..."
  docker ps --format '{{.ID}} {{.Names}} {{.Ports}}' --filter "label=com.docker.compose.project=${LEGACY_COMPOSE_PROJECT}" || true
  while read -r id; do
    [[ -z "$id" ]] && continue
    docker rm -f "$id" >/dev/null || true
  done <<< "$legacy_ids"
fi

# Ensure port 8080 is free BEFORE starting (otherwise docker will fail to bind).
port_8080_ids="$(docker ps -q --filter 'publish=8080')"
if [[ -n "$port_8080_ids" ]]; then
  echo "ERROR: port 8080 is already in use by another container; cannot deploy." >&2
  echo "Container(s) currently publishing 8080:" >&2
  docker ps --format '{{.ID}} {{.Names}} {{.Ports}}' --filter 'publish=8080' >&2 || true
  exit 5
fi

echo "Starting containers..."
"${DOCKER_COMPOSE[@]}" -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d --remove-orphans

echo "Deployment OK"
