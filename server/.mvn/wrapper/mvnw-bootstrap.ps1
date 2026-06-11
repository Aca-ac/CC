param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]] $MavenArgs
)

$ErrorActionPreference = "Stop"

$WrapperDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ServerDir = Resolve-Path (Join-Path $WrapperDir "..\..")
$MavenVersion = "3.9.9"
$MavenHome = Join-Path $WrapperDir "apache-maven-$MavenVersion"
$MavenZip = Join-Path $WrapperDir "apache-maven-$MavenVersion-bin.zip"
$MavenUrl = "https://archive.apache.org/dist/maven/maven-3/$MavenVersion/binaries/apache-maven-$MavenVersion-bin.zip"
$MavenCommand = Join-Path $MavenHome "bin\mvn.cmd"
$MavenSettings = Join-Path $ServerDir ".mvn\settings.xml"

if (-not (Test-Path $MavenCommand)) {
    if (-not (Test-Path $MavenZip)) {
        Write-Host "Downloading Maven $MavenVersion ..."
        Invoke-WebRequest -Uri $MavenUrl -OutFile $MavenZip -UseBasicParsing
    }

    Write-Host "Extracting Maven $MavenVersion ..."
    Expand-Archive -Path $MavenZip -DestinationPath $WrapperDir -Force
}

& $MavenCommand -s $MavenSettings -f (Join-Path $ServerDir "pom.xml") @MavenArgs
exit $LASTEXITCODE
