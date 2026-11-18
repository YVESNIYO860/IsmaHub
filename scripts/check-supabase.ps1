$ErrorActionPreference = "Stop"

if (-not $env:SUPABASE_URL -or -not $env:SUPABASE_PUBLISHABLE_KEY) {
  exit 2
}

try {
  $uri = $env:SUPABASE_URL.TrimEnd("/") + "/auth/v1/settings"
  $response = Invoke-RestMethod `
    -Method Get `
    -Uri $uri `
    -Headers @{
      apikey = $env:SUPABASE_PUBLISHABLE_KEY
      Authorization = "Bearer " + $env:SUPABASE_PUBLISHABLE_KEY
    } `
    -TimeoutSec 8

  if ($null -ne $response) {
    try {
      Invoke-WebRequest `
        -Method Get `
        -Uri ($env:SUPABASE_URL.TrimEnd("/") + "/rest/v1/") `
        -Headers @{
          apikey = $env:SUPABASE_PUBLISHABLE_KEY
          Authorization = "Bearer " + $env:SUPABASE_PUBLISHABLE_KEY
        } `
        -TimeoutSec 8 `
        -UseBasicParsing `
        -ErrorAction Stop | Out-Null
    } catch {
      $statusCode = [int]$_.Exception.Response.StatusCode
      if ($statusCode -lt 200 -or $statusCode -ge 500) {
        exit 1
      }
    }
    Write-Output "reachable"
  } else {
    exit 1
  }
} catch {
  exit 1
}
