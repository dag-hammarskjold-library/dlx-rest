# Deactivate anything that's already active
Write-Host "Deactivating existing environments"
if ($env:VIRTUAL_ENV) {
    Remove-Item env:VIRTUAL_ENV -ErrorAction SilentlyContinue
}
if ($function:deactivate) {
    Remove-Item function:deactivate
    Remove-Item function:pydoc
}

# Unset everything
if (Test-Path DLX_REST_TESTING) {
    Remove-Item DLX_REST_TESTING
}
if (Test-Path DLX_REST_DEV) {
    Remove-Item DLX_REST_DEV
}
if (Test-Path DLX_REST_UAT) {
    Remove-Item DLX_REST_UAT
}
if (Test-Path DLX_REST_QAT) {
    Remove-Item DLX_REST_QAT
}
if (Test-Path DLX_REST_PRODUCTION) {
    Remove-Item DLX_REST_PRODUCTION
}

# Figure out if we have environment arguments, and if not, default to DEV
if ($Args[0]) {
    $TargetEnv = $args[0] 
} else {
    $TargetEnv = "DEV"
}

# Set the environment variables
Write-Host "Setting environment to $TargetEnv"
[environment]::SetEnvironmentVariable("DLX_REST_" + $TargetEnv, "True", "User")
[environment]::SetEnvironmentVariable("FLASK_APP", "dlx_rest.app", "User")

# Activate the virtual environment
invoke-expression -Command "$PSScriptRoot\venv\Scripts\activate.ps1"

# Now run the application
invoke-expression -Command "flask shell"