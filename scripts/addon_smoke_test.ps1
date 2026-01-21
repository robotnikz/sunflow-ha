Param(
  [string]$Arch = 'amd64',
  [string]$Tag = 'sunflow-ha-addon:smoke',
  [int]$Port = 3000,
  [int]$TimeoutSeconds = 60
)

$ErrorActionPreference = 'Stop'

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$addonDir = Join-Path $repoRoot 'sunflow'
$buildYaml = Join-Path $addonDir 'build.yaml'
$dockerfile = Join-Path $addonDir 'Dockerfile'

if (!(Get-Command docker -ErrorAction SilentlyContinue)) {
  throw 'docker is not installed or not on PATH.'
}

if (!(Test-Path $buildYaml)) {
  throw "Missing build.yaml at $buildYaml"
}

# Extract BUILD_FROM for the requested arch from build.yaml (simple but robust enough).
$pattern = '^\s*' + [regex]::Escape($Arch) + ':\s*(.+)\s*$'
$buildFrom = (Get-Content $buildYaml | Select-String -Pattern $pattern -AllMatches -CaseSensitive).Matches | Select-Object -First 1 | ForEach-Object { $_.Groups[1].Value.Trim() }
if (-not $buildFrom) {
  throw "Could not find build_from for arch '$Arch' in $buildYaml"
}

Write-Host "Building add-on image '$Tag' (BUILD_FROM=$buildFrom, ARCH=$Arch)..."

docker build `
  -f $dockerfile `
  -t $Tag `
  --build-arg "BUILD_FROM=$buildFrom" `
  --build-arg "BUILD_ARCH=$Arch" `
  --build-arg "BUILD_VERSION=smoke" `
  $addonDir

if ($LASTEXITCODE -ne 0) {
  throw "Docker build failed with exit code $LASTEXITCODE"
}

# Provide bashio options.json expected by /run.sh
$tmp = Join-Path ([System.IO.Path]::GetTempPath()) ("sunflow-addon-smoke-" + [System.Guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $tmp | Out-Null

$options = @{
  log_level = 'info'
  admin_token = ''
  cors_origin = ''
} | ConvertTo-Json
Set-Content -Path (Join-Path $tmp 'options.json') -Value $options -Encoding UTF8

Write-Host "Starting container and waiting for /api/info on http://localhost:$Port ..."

$containerId = docker run -d --rm `
  -p "${Port}:3000" `
  -v "${tmp}:/data" `
  $Tag

if ($LASTEXITCODE -ne 0 -or -not $containerId) {
  throw 'Failed to start container for smoke test'
}

try {
  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  $ok = $false

  while ((Get-Date) -lt $deadline) {
    try {
      $resp = Invoke-WebRequest -Uri "http://localhost:$Port/api/info" -UseBasicParsing -TimeoutSec 5
      if ($resp.StatusCode -eq 200) {
        $ok = $true
        break
      }
    } catch {
      Start-Sleep -Seconds 2
    }
  }

  if (-not $ok) {
    Write-Host '--- container logs ---'
    if ($containerId) {
      docker logs $containerId
    }
    throw "Smoke test failed: /api/info did not become ready within ${TimeoutSeconds}s"
  }

  # Validate persistence path: DB should be created under /data
  docker exec $containerId sh -lc "test -f /data/solar_data.db" | Out-Null
  if ($LASTEXITCODE -ne 0) {
    Write-Host '--- container logs ---'
    docker logs $containerId
    throw 'Smoke test failed: expected /data/solar_data.db to exist (persistence not working)'
  }

  Write-Host 'OK: add-on started and /api/info returned 200'
} finally {
  if ($containerId) {
    docker stop $containerId | Out-Null
  }
  if (Test-Path $tmp) {
    Remove-Item -Recurse -Force $tmp
  }
}
