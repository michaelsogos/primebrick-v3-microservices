#!/usr/bin/env bash
# deploy.sh
# Phase 3B — RELEASE: deploys the microservice container.
# 1. Finds an available host port (4000+)
# 2. Constructs SERVICE_BASE_URL from the port
# 3. Runs terraform apply with the port as a variable

set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
port=$(bash "$script_dir/find-available-port.sh")
if [ $? -ne 0 ]; then
    echo "Failed to find an available port" >&2
    exit 1
fi

echo "Deploying microservice on host port $port..."
echo "SERVICE_BASE_URL will be http://localhost:$port"

# The host port is the EXPOSED port (reachable from the BE on the host).
terraform -chdir="$script_dir/.." apply \
    -var="host_port=$port" \
    -var="service_base_url=http://localhost:$port" \
    -auto-approve
