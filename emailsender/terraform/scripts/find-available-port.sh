#!/usr/bin/env bash
# find-available-port.sh
# Finds the first available TCP port starting from 4000.
# Outputs the port number to stdout (no other output).
# Exit code 0 = success, 1 = no port found in range.

set -euo pipefail

START_PORT=4000
END_PORT=4999

# Collect listening ports in the range
get_listening_ports() {
    if command -v ss &>/dev/null; then
        # Linux: ss is modern and reliable
        ss -tlnH 2>/dev/null | awk '{print $4}' | grep -oE '[0-9]+$' | sort -n
    elif command -v lsof &>/dev/null; then
        # Mac: lsof is always available
        lsof -iTCP -sTCP:LISTEN -P -n 2>/dev/null | awk '{print $9}' | grep -oE '[0-9]+$' | sort -n
    elif command -v netstat &>/dev/null; then
        # Fallback: netstat (older systems)
        netstat -tln 2>/dev/null | awk '{print $4}' | grep -oE '[0-9]+$' | sort -n
    else
        # No tool available — assume all ports are free
        return 0
    fi
}

listening=$(get_listening_ports || true)

for port in $(seq $START_PORT $END_PORT); do
    if ! echo "$listening" | grep -qx "$port"; then
        echo "$port"
        exit 0
    fi
done

echo "No available port in range $START_PORT-$END_PORT" >&2
exit 1
