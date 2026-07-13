# find-available-port.ps1
# Finds the first available TCP port starting from 4000.
# Outputs the port number to stdout (no other output).
# Exit code 0 = success, 1 = no port found in range.

$StartPort = 4000
$EndPort = 4999

# Get all listening ports in the range
$listening = @()
try {
    $listening = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue |
        Where-Object { $_.LocalPort -ge $StartPort -and $_.LocalPort -le $EndPort } |
        Select-Object -ExpandProperty LocalPort
} catch {
    # Get-NetTCPConnection not available or no connections — start from $StartPort
}

for ($port = $StartPort; $port -le $EndPort; $port++) {
    if ($listening -notcontains $port) {
        Write-Output $port
        exit 0
    }
}

Write-Error "No available port in range $StartPort-$EndPort"
exit 1
