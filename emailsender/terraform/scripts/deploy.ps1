# deploy.ps1
# Phase 3B — RELEASE: deploys the microservice container.
# 1. Finds an available host port (4000+)
# 2. Constructs SERVICE_BASE_URL from the port
# 3. Runs terraform apply with the port as a variable

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$port = & "$scriptDir\find-available-port.ps1"
if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to find an available port"
    exit 1
}

Write-Host "Deploying microservice on host port $port..."
Write-Host "SERVICE_BASE_URL will be http://localhost:$port"

# The host port is the EXPOSED port (reachable from the BE on the host).
# The internal port is always 3003 (container-internal).
# SERVICE_BASE_URL must be the exposed URL because the BE proxy runs on
# the host and routes to the microservice via localhost:{host_port}.
terraform -chdir="$scriptDir\.." apply `
    -var="host_port=$port" `
    -var="service_base_url=http://localhost:$port" `
    -auto-approve
