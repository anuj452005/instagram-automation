# ============================================================
#  GramFlow - Azure Full-Stack Provisioning Script (PowerShell)
#  Requirements: Azure CLI  https://aka.ms/installazurecliwindows
#                GitHub CLI https://cli.github.com/  (optional, auto-sets secrets)
#  Run from the GramFlow project root:  .\azure-setup.ps1
# ============================================================

# --------------- 1. CONFIGURATION ----------------------------
$RESOURCE_GROUP       = "gramflow-prod-rg"
$LOCATION             = "eastasia"
$SWA_LOCATION         = "eastasia"
$APP_SERVICE_PLAN     = "gramflow-plan"
$RANDOM_SUFFIX        = Get-Random -Minimum 10000 -Maximum 99999
$BACKEND_WEBAPP_NAME  = "gramflow-backend-$RANDOM_SUFFIX"
$FRONTEND_STATIC_NAME = "gramflow-frontend-$RANDOM_SUFFIX"
$NODE_RUNTIME         = "NODE:22-lts"
# -------------------------------------------------------------

Write-Host ""
Write-Host "============================================================" -ForegroundColor Magenta
Write-Host "   GramFlow - Azure Cloud Deployment" -ForegroundColor Magenta
Write-Host "   Backend : Azure App Service (Linux B1)" -ForegroundColor Magenta
Write-Host "   Frontend: Azure Static Web Apps (Free)" -ForegroundColor Magenta
Write-Host "   DB      : Neon Serverless PostgreSQL (Cloud)" -ForegroundColor Magenta
Write-Host "   Redis   : Upstash Redis (Cloud)" -ForegroundColor Magenta
Write-Host "============================================================" -ForegroundColor Magenta
Write-Host ""

# --------------- 2. PRE-FLIGHT: Read .env --------------------
Write-Host "[Pre-flight] Reading environment variables from .env..." -ForegroundColor Cyan

if (-not (Test-Path ".env")) {
  Write-Host "ERROR: .env file not found. Run this script from the GramFlow project root." -ForegroundColor Red
  exit 1
}

# Parse .env into a hashtable (ignores comments and blank lines)
$envVars = @{}
Get-Content ".env" | ForEach-Object {
  $line = $_.Trim()
  if ($line -and -not $line.StartsWith("#")) {
    $parts = $line -split "=", 2
    if ($parts.Length -eq 2) {
      $envVars[$parts[0].Trim()] = $parts[1].Trim()
    }
  }
}

# Validate critical vars are present
$requiredVars = @("DATABASE_URL", "REDIS_URL", "CLERK_SECRET_KEY", "CLERK_PUBLISHABLE_KEY", "ENCRYPTION_KEY", "GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET")
$missing = $requiredVars | Where-Object { -not $envVars.ContainsKey($_) }
if ($missing) {
  Write-Host "ERROR: Missing required .env variables: $($missing -join ', ')" -ForegroundColor Red
  exit 1
}

# Warn about placeholder encryption key
if ($envVars["ENCRYPTION_KEY"] -match "^a1b2c3") {
  Write-Host ""
  Write-Host "WARNING: ENCRYPTION_KEY looks like a placeholder. For production, generate a secure key:" -ForegroundColor Yellow
  Write-Host "  openssl rand -hex 32" -ForegroundColor Yellow
  Write-Host ""
}

# Warn about test Clerk keys
if ($envVars["CLERK_SECRET_KEY"] -match "^sk_test_") {
  Write-Host "WARNING: Using Clerk TEST keys. Switch to pk_live_ / sk_live_ keys for production." -ForegroundColor Yellow
  Write-Host ""
}

Write-Host "[Pre-flight] .env loaded. $($envVars.Count) variables found." -ForegroundColor Green

# --------------- 3. AZURE LOGIN ------------------------------
Write-Host ""
Write-Host "[Auth] Logging into Azure (a browser window will open)..." -ForegroundColor Cyan
az login
if ($LASTEXITCODE -ne 0) {
  Write-Host "Azure login failed." -ForegroundColor Red
  exit 1
}
Write-Host "[Auth] Login successful." -ForegroundColor Green

# --------------- 3b. VERIFY REGION SUPPORTS APP SERVICE ------
Write-Host ""
Write-Host "[Region] Verifying App Service B1 availability in '$LOCATION'..." -ForegroundColor Cyan
$allowedRegions = az appservice list-locations --sku B1 --query "[].name" -o tsv 2>$null
$regionMatch = $allowedRegions | Where-Object { $_ -like "*$LOCATION*" -or ($LOCATION -eq "centralindia" -and $_ -eq "Central India") }
if (-not $regionMatch) {
  Write-Host "WARNING: '$LOCATION' may not support App Service B1 on this subscription." -ForegroundColor Yellow
  Write-Host "Trying anyway - if it fails, change LOCATION in the script to one of: East US 2, West US 2, Central India, West Europe" -ForegroundColor Yellow
} else {
  Write-Host "[Region] '$LOCATION' is available for App Service B1." -ForegroundColor Green
}

# --------------- 4. RESOURCE GROUP --------------------------
Write-Host ""
Write-Host "[RG] Creating Resource Group: $RESOURCE_GROUP in $LOCATION..." -ForegroundColor Cyan
az group create --name $RESOURCE_GROUP --location $LOCATION --output table
if ($LASTEXITCODE -ne 0) {
  Write-Host "Failed to create resource group." -ForegroundColor Red
  exit 1
}

# --------------- 5. APP SERVICE PLAN (Linux B1) --------------
Write-Host ""
Write-Host "[Plan] Creating App Service Plan: $APP_SERVICE_PLAN (Linux B1 ~`$13/mo)..." -ForegroundColor Cyan
az appservice plan create `
  --name $APP_SERVICE_PLAN `
  --resource-group $RESOURCE_GROUP `
  --location $LOCATION `
  --sku B1 `
  --is-linux `
  --output table
if ($LASTEXITCODE -ne 0) {
  Write-Host "Failed to create App Service Plan." -ForegroundColor Red
  exit 1
}

# --------------- 6. BACKEND WEB APP --------------------------
Write-Host ""
Write-Host "[App] Creating Backend Web App: $BACKEND_WEBAPP_NAME (Node 20 LTS)..." -ForegroundColor Cyan
az webapp create `
  --name $BACKEND_WEBAPP_NAME `
  --resource-group $RESOURCE_GROUP `
  --plan $APP_SERVICE_PLAN `
  --runtime $NODE_RUNTIME `
  --output table
if ($LASTEXITCODE -ne 0) {
  Write-Host "Failed to create Web App. The name '$BACKEND_WEBAPP_NAME' may be taken - try a unique name in the script." -ForegroundColor Red
  exit 1
}

# Enable SCM Basic Auth (required to fetch unredacted publishing profiles)
Write-Host "[Config] Enabling SCM Basic Auth for Web App..." -ForegroundColor Cyan
az resource update `
  --resource-group $RESOURCE_GROUP `
  --name scm `
  --namespace Microsoft.Web `
  --resource-type basicPublishingCredentialsPolicies `
  --parent sites/$BACKEND_WEBAPP_NAME `
  --set properties.allow=true `
  --output none

# Configure startup command (npm start runs: node dist/backend/src/index.js)
Write-Host "[Config] Setting startup command: npm start..." -ForegroundColor Cyan
az webapp config set `
  --name $BACKEND_WEBAPP_NAME `
  --resource-group $RESOURCE_GROUP `
  --startup-file "npm start" `
  --output none

# Enable WebSockets (for BullMQ / Socket.io streams)
az webapp config set `
  --name $BACKEND_WEBAPP_NAME `
  --resource-group $RESOURCE_GROUP `
  --web-sockets-enabled true `
  --output none

# Enable Always On (prevents cold starts on B1 tier)
az webapp config set `
  --name $BACKEND_WEBAPP_NAME `
  --resource-group $RESOURCE_GROUP `
  --always-on true `
  --output none

Write-Host "[App] Web App configured." -ForegroundColor Green

# --------------- 7. STATIC WEB APP (Frontend) ----------------
Write-Host ""
Write-Host "[SWA] Creating Static Web App: $FRONTEND_STATIC_NAME (Free tier)..." -ForegroundColor Cyan
az staticwebapp create `
  --name $FRONTEND_STATIC_NAME `
  --resource-group $RESOURCE_GROUP `
  --location $SWA_LOCATION `
  --output table
if ($LASTEXITCODE -ne 0) {
  Write-Host "Failed to create Static Web App." -ForegroundColor Red
  exit 1
}

# --------------- 8. DERIVE PRODUCTION URLS -------------------
$BACKEND_URL  = "https://$BACKEND_WEBAPP_NAME.azurewebsites.net"
$FRONTEND_URL = "https://$FRONTEND_STATIC_NAME.azurestaticapps.net"

Write-Host ""
Write-Host "[URLs] Backend  : $BACKEND_URL" -ForegroundColor Green
Write-Host "[URLs] Frontend : $FRONTEND_URL" -ForegroundColor Green

# --------------- 9. INJECT ENV VARS INTO AZURE APP SETTINGS --
Write-Host ""
Write-Host "[EnvVars] Injecting environment variables into Azure App Settings..." -ForegroundColor Cyan
Write-Host "          Neon PostgreSQL + Upstash Redis URLs loaded from .env" -ForegroundColor Cyan

$settings = @(
  @{ name = "NODE_ENV"; value = "production" },
  @{ name = "PORT"; value = "8080" },
  @{ name = "WEBSITE_PORT"; value = "8080" },
  @{ name = "FRONTEND_URL"; value = $FRONTEND_URL },
  @{ name = "DATABASE_URL"; value = $envVars['DATABASE_URL'] },
  @{ name = "REDIS_URL"; value = $envVars['REDIS_URL'] },
  @{ name = "CLERK_PUBLISHABLE_KEY"; value = $envVars['CLERK_PUBLISHABLE_KEY'] },
  @{ name = "CLERK_SECRET_KEY"; value = $envVars['CLERK_SECRET_KEY'] },
  @{ name = "ENCRYPTION_KEY"; value = $envVars['ENCRYPTION_KEY'] },
  @{ name = "GOOGLE_CLIENT_ID"; value = $envVars['GOOGLE_CLIENT_ID'] },
  @{ name = "GOOGLE_CLIENT_SECRET"; value = $envVars['GOOGLE_CLIENT_SECRET'] },
  @{ name = "GOOGLE_REDIRECT_URI"; value = "$FRONTEND_URL/dashboard/youtube" },
  @{ name = "META_APP_ID"; value = $envVars['META_APP_ID'] },
  @{ name = "META_APP_SECRET"; value = $envVars['META_APP_SECRET'] },
  @{ name = "META_VERIFY_TOKEN"; value = $envVars['META_VERIFY_TOKEN'] },
  @{ name = "MOCK_META_API"; value = "false" },
  @{ name = "SCM_DO_BUILD_DURING_DEPLOYMENT"; value = "true" },
  @{ name = "WEBSITE_NODE_DEFAULT_VERSION"; value = "~22" }
)

$settingsJson = ConvertTo-Json -InputObject $settings -Depth 100
$settingsJson | Out-File -FilePath "settings.json" -Encoding utf8

az webapp config appsettings set `
  --name $BACKEND_WEBAPP_NAME `
  --resource-group $RESOURCE_GROUP `
  --settings "@settings.json" `
  --output table

if (Test-Path "settings.json") {
  Remove-Item "settings.json"
}

if ($LASTEXITCODE -ne 0) {
  Write-Host "Failed to set App Settings." -ForegroundColor Red
  exit 1
}
Write-Host "[EnvVars] All environment variables configured on Azure!" -ForegroundColor Green

# --------------- 10. RETRIEVE DEPLOYMENT SECRETS -------------
Write-Host ""
Write-Host "[Secrets] Retrieving deployment credentials..." -ForegroundColor Cyan

$SWA_TOKEN   = az staticwebapp secrets list --name $FRONTEND_STATIC_NAME --resource-group $RESOURCE_GROUP --query "properties.apiKey" -o tsv
$PUB_PROFILE = az webapp deployment list-publishing-profiles --name $BACKEND_WEBAPP_NAME --resource-group $RESOURCE_GROUP --xml

# --------------- 11. AUTO-SET GITHUB SECRETS -----------------
Write-Host ""
if (Get-Command gh -ErrorAction SilentlyContinue) {
  Write-Host "[GitHub] GitHub CLI detected! Checking authentication..." -ForegroundColor Green

  gh auth status 2>$null
  if ($LASTEXITCODE -ne 0) {
    Write-Host "WARNING: GitHub CLI not logged in. Run 'gh auth login' and re-run to auto-set secrets." -ForegroundColor Yellow
  } else {
    Write-Host "[GitHub] Uploading GitHub Actions secrets to your repository..." -ForegroundColor Cyan

    gh secret set AZURE_STATIC_WEB_APPS_API_TOKEN --body "$SWA_TOKEN"
    Write-Host "  [OK] AZURE_STATIC_WEB_APPS_API_TOKEN" -ForegroundColor Green

    gh secret set AZURE_WEBAPP_NAME --body "$BACKEND_WEBAPP_NAME"
    Write-Host "  [OK] AZURE_WEBAPP_NAME" -ForegroundColor Green

    $PUB_PROFILE | gh secret set AZURE_WEBAPP_PUBLISH_PROFILE
    Write-Host "  [OK] AZURE_WEBAPP_PUBLISH_PROFILE" -ForegroundColor Green

    gh secret set VITE_API_URL --body "$BACKEND_URL"
    Write-Host "  [OK] VITE_API_URL" -ForegroundColor Green

    # Set Clerk publishable key for frontend Vite build
    $VITE_CLERK_KEY = $envVars["VITE_CLERK_PUBLISHABLE_KEY"]
    if (-not $VITE_CLERK_KEY) {
      $VITE_CLERK_KEY = $envVars["CLERK_PUBLISHABLE_KEY"]
    }
    if ($VITE_CLERK_KEY) {
      gh secret set VITE_CLERK_PUBLISHABLE_KEY --body "$VITE_CLERK_KEY"
      Write-Host "  [OK] VITE_CLERK_PUBLISHABLE_KEY" -ForegroundColor Green
    }

    Write-Host ""
    Write-Host "[GitHub] All secrets configured!" -ForegroundColor Green
  }
} else {
  Write-Host "--------------------------------------------------------" -ForegroundColor Yellow
  Write-Host " ACTION REQUIRED - Add GitHub Actions Secrets manually" -ForegroundColor Yellow
  Write-Host "--------------------------------------------------------" -ForegroundColor Yellow
  Write-Host "Repo -> Settings -> Secrets and variables -> Actions" -ForegroundColor Cyan
  Write-Host ""
  Write-Host "1. AZURE_STATIC_WEB_APPS_API_TOKEN:" -ForegroundColor White
  Write-Host $SWA_TOKEN -ForegroundColor Gray
  Write-Host ""
  Write-Host "2. AZURE_WEBAPP_NAME:" -ForegroundColor White
  Write-Host $BACKEND_WEBAPP_NAME -ForegroundColor Gray
  Write-Host ""
  Write-Host "3. AZURE_WEBAPP_PUBLISH_PROFILE:" -ForegroundColor White
  Write-Host $PUB_PROFILE -ForegroundColor Gray
  Write-Host ""
  Write-Host "4. VITE_API_URL:" -ForegroundColor White
  Write-Host $BACKEND_URL -ForegroundColor Gray
  Write-Host ""
  Write-Host "5. VITE_CLERK_PUBLISHABLE_KEY:" -ForegroundColor White
  Write-Host "   (Copy pk_live_ or pk_test_ key from Clerk Dashboard)" -ForegroundColor Gray
  Write-Host ""
  Write-Host "Install GitHub CLI (https://cli.github.com/) to set secrets automatically." -ForegroundColor Yellow
}

# --------------- 12. FINAL SUMMARY --------------------------
Write-Host ""
Write-Host "============================================================" -ForegroundColor Magenta
Write-Host "   DEPLOYMENT SUMMARY" -ForegroundColor Magenta
Write-Host "============================================================" -ForegroundColor Magenta
Write-Host "  Resource Group : $RESOURCE_GROUP" -ForegroundColor White
Write-Host "  Backend URL    : $BACKEND_URL" -ForegroundColor Green
Write-Host "  Frontend URL   : $FRONTEND_URL" -ForegroundColor Green
Write-Host "  Database       : Neon PostgreSQL (Cloud - from .env)" -ForegroundColor Cyan
Write-Host "  Redis          : Upstash Redis   (Cloud - from .env)" -ForegroundColor Cyan
Write-Host "  Node Runtime   : $NODE_RUNTIME" -ForegroundColor Cyan
Write-Host "  App Service    : Linux B1 (Always On enabled)" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Magenta
Write-Host ""
Write-Host "NEXT STEPS:" -ForegroundColor Yellow
Write-Host "  1. Push your code to trigger GitHub Actions CI/CD:" -ForegroundColor White
Write-Host "     git add ." -ForegroundColor Cyan
Write-Host "     git commit -m 'feat: configure Azure production deployment'" -ForegroundColor Cyan
Write-Host "     git push origin main" -ForegroundColor Cyan
Write-Host ""
Write-Host "  2. After backend deploys, run DB migrations:" -ForegroundColor White
Write-Host "     az webapp ssh --name $BACKEND_WEBAPP_NAME --resource-group $RESOURCE_GROUP" -ForegroundColor Cyan
Write-Host "     (then inside the SSH session): npm run db:migrate" -ForegroundColor Cyan
Write-Host ""
Write-Host "  3. Verify the backend health check:" -ForegroundColor White
Write-Host "     curl $BACKEND_URL/health" -ForegroundColor Cyan
Write-Host ""
Write-Host "  4. Visit the frontend to complete verification:" -ForegroundColor White
Write-Host "     $FRONTEND_URL" -ForegroundColor Cyan
Write-Host ""
Write-Host "[Done] GramFlow Azure infrastructure is ready!" -ForegroundColor Green
