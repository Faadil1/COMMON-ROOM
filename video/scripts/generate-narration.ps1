$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Speech

$outDir = Join-Path $PSScriptRoot "..\..\public\video-audio"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null
$outFile = Join-Path $outDir "narration.wav"

$text = @"
Most library cards prove access. Common Room asks a different question: can a card reveal belonging?

No quiz. No profile. What you do inside the library leaves the evidence: a margin, a registration mark, a reference path, a street.

Those traces do not decorate the card. They build it, layer by layer, until a Member Record exists.

The card can leave the screen, carry a short code and Q R, renew, wear, and remember return.

Its accession aperture is not decoration. The same cut becomes a lens into the memory the library keeps.

And if a member chooses to publish it, one record becomes part of a living collection.

Pull back far enough, and individual traces begin to draw the quarter itself.

You do not receive a card. You accumulate one.
"@

$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$synth.Rate = 1
$synth.Volume = 92

$preferred = $synth.GetInstalledVoices() |
  ForEach-Object { $_.VoiceInfo } |
  Where-Object { $_.Culture.Name -like "en-*" } |
  Sort-Object @{Expression={ if ($_.Gender -eq "Male") {0} else {1} }}, Name |
  Select-Object -First 1

if ($preferred) {
  $synth.SelectVoice($preferred.Name)
  Write-Host "Using local voice:" $preferred.Name
} else {
  Write-Host "Using Windows default speech voice."
}

$synth.SetOutputToWaveFile($outFile)
$synth.Speak($text)
$synth.Dispose()

Write-Host "Narration written to $outFile"
