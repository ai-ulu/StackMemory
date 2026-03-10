[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"

$root = "C:\Users\sonfi\Documents\Playground"
$frontendPidFile = Join-Path $root "frontend\.local-dev\frontend.pid"
$bridgePidFile = Join-Path $root "bridge\.local-dev\bridge.pid"

function Stop-FromPidFile {
    param(
        [string]$PidFile,
        [string]$Name
    )

    if (-not (Test-Path $PidFile)) {
        Write-Host "$Name is not running."
        return
    }

    $pidValue = (Get-Content $PidFile -ErrorAction SilentlyContinue | Select-Object -First 1).Trim()
    if (-not $pidValue) {
        Remove-Item $PidFile -ErrorAction SilentlyContinue
        Write-Host "$Name pid file was empty."
        return
    }

    try {
        Stop-Process -Id ([int]$pidValue) -Force -ErrorAction Stop
        Write-Host "$Name stopped."
    } catch {
        Write-Host "$Name process was already gone."
    }

    Remove-Item $PidFile -ErrorAction SilentlyContinue
}

Stop-FromPidFile -PidFile $frontendPidFile -Name "Frontend"
Stop-FromPidFile -PidFile $bridgePidFile -Name "Bridge"
