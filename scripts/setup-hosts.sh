#!/bin/bash
# Setup hosts file for ALC Stronghold Platform
# Requires: sudo

set -e

HOSTS_FILE="/etc/hosts"
DOMAINS=(
    "alcstronghold.local"
    "backend.alcstronghold.local"
)

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
GRAY='\033[0;90m'
NC='\033[0m'

remove_domains() {
    echo -e "${YELLOW}Removing ALC Stronghold domains from hosts file...${NC}"

    for domain in "${DOMAINS[@]}"; do
        if grep -q "127.0.0.1.*$domain" "$HOSTS_FILE"; then
            sudo sed -i.bak "/127\.0\.0\.1.*$domain/d" "$HOSTS_FILE"
            echo -e "  ${RED}- $domain${NC}"
        fi
    done

    sudo sed -i.bak '/# ALC Stronghold domains/d' "$HOSTS_FILE"
    sudo rm -f "${HOSTS_FILE}.bak"

    echo -e "${GREEN}Domains removed successfully!${NC}"
}

add_domains() {
    echo -e "${CYAN}Adding ALC Stronghold domains to hosts file...${NC}"

    local added=0
    local needs_header=true

    # Check if header already exists
    if grep -q "# ALC Stronghold domains" "$HOSTS_FILE"; then
        needs_header=false
    fi

    for domain in "${DOMAINS[@]}"; do
        if ! grep -q "127.0.0.1.*$domain" "$HOSTS_FILE"; then
            if $needs_header; then
                echo "" | sudo tee -a "$HOSTS_FILE" > /dev/null
                echo "# ALC Stronghold domains" | sudo tee -a "$HOSTS_FILE" > /dev/null
                needs_header=false
            fi
            echo -e "127.0.0.1\t$domain" | sudo tee -a "$HOSTS_FILE" > /dev/null
            echo -e "  ${GREEN}+ $domain${NC}"
            ((added++))
        else
            echo -e "  ${GRAY}= $domain (already exists)${NC}"
        fi
    done

    if [[ $added -gt 0 ]]; then
        echo ""
        echo -e "${GREEN}Hosts file updated successfully!${NC}"
    else
        echo ""
        echo -e "${YELLOW}All domains already configured.${NC}"
    fi
}

show_current() {
    echo ""
    echo -e "${CYAN}Current ALC Stronghold entries in hosts:${NC}"
    grep "alcstronghold\.local" "$HOSTS_FILE" 2>/dev/null | while read line; do
        echo "  $line"
    done
}

case "${1:-}" in
    --remove|-r)
        remove_domains
        ;;
    *)
        add_domains
        ;;
esac

show_current
