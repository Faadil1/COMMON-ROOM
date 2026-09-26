$ErrorActionPreference = "Stop"

if (-not $env:AI33_API_KEY) {
  $env:AI33_API_KEY = [Environment]::GetEnvironmentVariable("AI33_API_KEY", "User")
}
if (-not $env:AI33_API_KEY) {
  throw "AI33_API_KEY is not available in this terminal or the Windows USER environment."
}

$mode = if ($args.Count -gt 0) { $args[0] } else { "probe" }
node video/scripts/ai33-media-pack.mjs $mode
