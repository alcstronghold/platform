#!/bin/bash
# Generate TLS certificates for ALC Stronghold Platform
# Requires: mkcert (https://github.com/FiloSottile/mkcert)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TRAEFIK_CERTS_PATH="${1:-$SCRIPT_DIR/../../../../pikachumetal/traefik-proxy/certs}"

# Resolve path
TRAEFIK_CERTS_PATH="$(cd "$TRAEFIK_CERTS_PATH" 2>/dev/null && pwd)" || {
    echo "Error: Traefik certs folder not found: $TRAEFIK_CERTS_PATH"
    echo "Make sure traefik-proxy is cloned at the expected location"
    exit 1
}

# Check if mkcert is installed
if ! command -v mkcert &> /dev/null; then
    echo "Error: mkcert is not installed"
    echo "Install it with: brew install mkcert (macOS) or see https://github.com/FiloSottile/mkcert"
    exit 1
fi

echo "Generating certificates for ALC Stronghold..."
echo "Output folder: $TRAEFIK_CERTS_PATH"

# Generate wildcard certificate for *.alcstronghold.local
mkcert -cert-file "$TRAEFIK_CERTS_PATH/alcstronghold.local.pem" \
       -key-file "$TRAEFIK_CERTS_PATH/alcstronghold.local-key.pem" \
       "*.alcstronghold.local" "alcstronghold.local"

echo ""
echo "Certificates generated successfully!"
echo "  - $TRAEFIK_CERTS_PATH/alcstronghold.local.pem"
echo "  - $TRAEFIK_CERTS_PATH/alcstronghold.local-key.pem"
echo ""
echo "Domains covered:"
echo "  - *.alcstronghold.local (backend.alcstronghold.local, etc.)"
echo "  - alcstronghold.local"
