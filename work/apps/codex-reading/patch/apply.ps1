param(
  [Parameter(Mandatory = $true)][string]$HanaHome,
  [Parameter(Mandatory = $true)][string]$AppDir,
  [Parameter(Mandatory = $true)][string]$PayloadPath,
  [Parameter(Mandatory = $true)][string]$StatePath
)

$ErrorActionPreference = "Stop"
$OutputEncoding = New-Object System.Text.UTF8Encoding($false)
[Console]::OutputEncoding = $OutputEncoding
$rendererRoot = Join-Path $HanaHome "artifacts\renderer"
if (-not (Test-Path -LiteralPath $rendererRoot)) {
  throw "renderer root not found: $rendererRoot"
}

$dirs = @(Get-ChildItem -LiteralPath $rendererRoot -Directory | Where-Object {
  Test-Path -LiteralPath (Join-Path $_.FullName "mobile.html")
})
if ($dirs.Count -eq 0) {
  throw "no renderer directory with mobile.html under $rendererRoot"
}

$tag = '<script type="module" src="./typography.js?v=1" data-hana-codex-typography></script>'
$utf8 = New-Object System.Text.UTF8Encoding($false)

foreach ($dir in $dirs) {
  Copy-Item -LiteralPath (Join-Path $AppDir "typography.js") -Destination (Join-Path $dir.FullName "typography.js") -Force
  Copy-Item -LiteralPath (Join-Path $AppDir "typography-css.js") -Destination (Join-Path $dir.FullName "typography-css.js") -Force
  Copy-Item -LiteralPath $PayloadPath -Destination (Join-Path $dir.FullName "codex-typography.json") -Force

  foreach ($page in @("pad.html", "mobile.html")) {
    $file = Join-Path $dir.FullName $page
    if (-not (Test-Path -LiteralPath $file)) { continue }
    $html = [IO.File]::ReadAllText($file)
    if ($html.Contains("data-hana-codex-typography")) { continue }
    $index = $html.LastIndexOf("</body>")
    if ($index -lt 0) { continue }
    $html = $html.Substring(0, $index) + "    " + $tag + "`n" + $html.Substring($index)
    [IO.File]::WriteAllText($file, $html, $utf8)
  }
}

$state = [ordered]@{
  installed = $true
  at = (Get-Date).ToString("o")
  renderers = $dirs.Count
}
$state | ConvertTo-Json | Set-Content -LiteralPath $StatePath -Encoding UTF8
Write-Output ("installed " + $dirs.Count)
