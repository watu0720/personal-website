# PowerShell script: Start development server
$ConfirmPreference = 'None'
$ErrorActionPreference = 'Continue'
$env:CI = 'true'
$env:FORCE_COLOR = '0'

# Execute pnpm run dev
pnpm run dev
