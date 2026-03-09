param(
  [string]$AppUrl = $env:APP_URL,
  [string]$FrontendHealthPath = '/api/health',
  [string]$BridgeHealthUrl = $env:BRIDGE_HEALTH_URL,
  [switch]$SkipBridge,
  [switch]$RequireStripe
)

$ErrorActionPreference = 'Stop'

function Test-RequiredEnv {
  param(
    [string[]]$Names
  )

  $missing = @()
  foreach ($name in $Names) {
    if ([string]::IsNullOrWhiteSpace((Get-Item "Env:$name" -ErrorAction SilentlyContinue).Value)) {
      $missing += $name
    }
  }

  return $missing
}

function Invoke-Check {
  param(
    [string]$Label,
    [string]$Url
  )

  Write-Host ""
  Write-Host "==> $Label"
  Write-Host "URL: $Url"

  try {
    $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 20
    Write-Host "Status: $($response.StatusCode)"

    if ($response.Content) {
      $trimmed = $response.Content.Trim()
      if ($trimmed.Length -gt 500) {
        $trimmed = $trimmed.Substring(0, 500) + '...'
      }
      Write-Host "Body: $trimmed"
    }

    return $true
  } catch {
    Write-Host "FAILED: $($_.Exception.Message)" -ForegroundColor Red
    return $false
  }
}

if ([string]::IsNullOrWhiteSpace($AppUrl)) {
  throw 'APP_URL is not set. Provide -AppUrl or set APP_URL in the environment.'
}

$required = @(
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY'
)

if ($RequireStripe) {
  $required += @(
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET'
  )
}

$missing = Test-RequiredEnv -Names $required
if ($missing.Count -gt 0) {
  throw "Missing required env vars for smoke test: $($missing -join ', ')"
}

$checks = @(
  @{ Label = 'Frontend health'; Url = ($AppUrl.TrimEnd('/') + $FrontendHealthPath) },
  @{ Label = 'Landing page'; Url = ($AppUrl.TrimEnd('/') + '/') },
  @{ Label = 'Pricing page'; Url = ($AppUrl.TrimEnd('/') + '/pricing') },
  @{ Label = 'Signup page'; Url = ($AppUrl.TrimEnd('/') + '/signup?workflow=custom_app') },
  @{ Label = 'Login page'; Url = ($AppUrl.TrimEnd('/') + '/login?workflow=cursor') },
  @{ Label = 'Integrations page'; Url = ($AppUrl.TrimEnd('/') + '/integrations') }
)

if (-not $SkipBridge -and -not [string]::IsNullOrWhiteSpace($BridgeHealthUrl)) {
  $checks += @{ Label = 'Bridge health'; Url = $BridgeHealthUrl }
}

$failures = 0
foreach ($check in $checks) {
  $ok = Invoke-Check -Label $check.Label -Url $check.Url
  if (-not $ok) {
    $failures++
  }
}

Write-Host ""
if ($failures -gt 0) {
  Write-Host "Smoke test completed with $failures failure(s)." -ForegroundColor Red
  exit 1
}

Write-Host "Smoke test completed successfully." -ForegroundColor Green
