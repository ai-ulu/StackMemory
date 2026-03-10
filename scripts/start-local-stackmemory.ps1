[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"

$root = "C:\Users\sonfi\Documents\Playground"
$frontendDir = Join-Path $root "frontend"
$bridgeDir = Join-Path $root "bridge"

$frontendStateDir = Join-Path $frontendDir ".local-dev"
$bridgeStateDir = Join-Path $bridgeDir ".local-dev"

$frontendPidFile = Join-Path $frontendStateDir "frontend.pid"
$bridgePidFile = Join-Path $bridgeStateDir "bridge.pid"

$frontendLog = Join-Path $frontendStateDir "frontend.log"
$bridgeLog = Join-Path $bridgeStateDir "bridge.log"

function Ensure-StateDir {
    param([string]$Path)
    if (-not (Test-Path $Path)) {
        New-Item -ItemType Directory -Path $Path | Out-Null
    }
}

function Get-LiveProcessFromPidFile {
    param([string]$PidFile)

    if (-not (Test-Path $PidFile)) {
        return $null
    }

    $pidValue = (Get-Content $PidFile -ErrorAction SilentlyContinue | Select-Object -First 1).Trim()
    if (-not $pidValue) {
        return $null
    }

    try {
        return Get-Process -Id ([int]$pidValue) -ErrorAction Stop
    } catch {
        Remove-Item $PidFile -ErrorAction SilentlyContinue
        return $null
    }
}

function Wait-ForUrl {
    param(
        [string]$Url,
        [int]$TimeoutSeconds = 90
    )

    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    do {
        try {
            $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 5
            if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 500) {
                return $true
            }
        } catch {
            Start-Sleep -Seconds 2
        }
    } while ((Get-Date) -lt $deadline)

    return $false
}

Ensure-StateDir -Path $frontendStateDir
Ensure-StateDir -Path $bridgeStateDir

$frontendProcess = Get-LiveProcessFromPidFile -PidFile $frontendPidFile
if (-not $frontendProcess) {
    $frontendProcess = Start-Process -FilePath "powershell" `
        -ArgumentList @(
            "-NoProfile",
            "-ExecutionPolicy", "Bypass",
            "-Command", "Set-Location '$frontendDir'; npm run dev *>> '$frontendLog'"
        ) `
        -WorkingDirectory $frontendDir `
        -WindowStyle Hidden `
        -PassThru
    Set-Content -Path $frontendPidFile -Value $frontendProcess.Id
}

$bridgeProcess = Get-LiveProcessFromPidFile -PidFile $bridgePidFile
if (-not $bridgeProcess) {
    $bridgeProcess = Start-Process -FilePath "powershell" `
        -ArgumentList @(
            "-NoProfile",
            "-ExecutionPolicy", "Bypass",
            "-Command", "Set-Location '$bridgeDir'; py -3 -m uvicorn server:app --host 127.0.0.1 --port 8080 *>> '$bridgeLog'"
        ) `
        -WorkingDirectory $bridgeDir `
        -WindowStyle Hidden `
        -PassThru
    Set-Content -Path $bridgePidFile -Value $bridgeProcess.Id
}

$frontendReady = Wait-ForUrl -Url "http://localhost:3000/api/health"
$bridgeReady = Wait-ForUrl -Url "http://127.0.0.1:8080/health"

if (-not $frontendReady) {
    throw "Frontend did not become ready. Check $frontendLog"
}

if (-not $bridgeReady) {
    throw "Bridge did not become ready. Check $bridgeLog"
}

Write-Host "StackMemory local services are running."
Write-Host "Frontend: http://localhost:3000"
Write-Host "Bridge:   http://127.0.0.1:8080"
Write-Host "Frontend log: $frontendLog"
Write-Host "Bridge log:   $bridgeLog"
