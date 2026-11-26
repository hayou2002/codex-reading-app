param(
  [Parameter(Mandatory = $true)][string]$HanaHome,
  [Parameter(Mandatory = $true)][string]$StatePath
)

$ErrorActionPreference = "Stop"
$OutputEncoding = New-Object System.Text.UTF8Encoding($false)
[Console]::OutputEncoding = $OutputEncoding
$rendererRoot = Join-Path $HanaHome "artifacts\renderer"
$dirs = @()
if (Test-Path -LiteralPath $rendererRoot) {
  $dirs = @(Get-ChildItem -LiteralPath $rendererRoot -Directory | Where-Object {
    Test-Path -LiteralPath (Join-Path $_.FullName "mobile.html")
  })
}

$utf8 = New-Object System.Text.UTF8Encoding($false)
foreach ($dir in $dirs) {
  $json = Join-Path $dir.FullName "codex-typography.json"
  if (Test-Path -LiteralPath $json) {
    [IO.File]::WriteAllText($json, '{"v":1,"enabled":false}', $utf8)
  }
}

Start-Sleep -Milliseconds 1600

foreach ($dir in $dirs) {
  foreach ($page in @("pad.html", "mobile.html")) {
    $file = Join-Path $dir.FullName $page
    if (-not (Test-Path -LiteralPath $file)) { continue }
    $html = [IO.File]::ReadAllText($file)
    if (-not $html.Contains("data-hana-codex-typography")) { continue }
    $html = [Text.RegularExpressions.Regex]::Replace(
      $html,
      '\s*<script[^>]*data-hana-codex-typography[^>]*></script>',
      ""
    )
    [IO.File]::WriteAllText($file, $html, $utf8)
  }
  foreach ($name in @("codex-typography.json", "typography.js", "typography-css.js", "_codex_probe.txt")) {
    $file = Join-Path $dir.FullName $name
    if (Test-Path -LiteralPath $file) { Remove-Item -LiteralPath $file -Force }
  }
}

$state = [ordered]@{
  installed = $false
  at = (Get-Date).ToString("o")
  renderers = $dirs.Count
}
$state | ConvertTo-Json | Set-Content -LiteralPath $StatePath -Encoding UTF8
Write-Output ("restored " + $dirs.Count)
