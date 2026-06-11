# GramFlow Azure Provisioning Script (PowerShell)
# Requirements: Install Azure CLI (https://aka.ms/installazurecliwindows)
# Execute this script to set up your Azure resources.

# 1. Configuration variables
$RESOURCE_GROUP = "gramflow-rg"
$LOCATION = "eastus"
$APP_SERVICE_PLAN = "gramflow-plan"
$BACKEND_WEBAPP_NAME = "gramflow-backend-app" # MUST BE UNIQUE globally
$FRONTEND_STATIC_NAME = "gramflow-frontend-app" # MUST BE UNIQUE globally

Write-Host "🚀 Starting GramFlow Azure infrastructure setup..." -ForegroundColor Green

# 2. Login to Azure
Write-Host "🔑 Logging into Azure account..." -ForegroundColor Cyan
az login

# 3. Create Resource Group
Write-Host "📦 Creating Resource Group: $RESOURCE_GROUP in $LOCATION..." -ForegroundColor Cyan
az group create --name $RESOURCE_GROUP --location $LOCATION

# 4. Create App Service Plan (B1 Linux plan for minimum cost Node.js environment)
Write-Host "🖥️ Creating App Service Plan (Linux B1 Basic)..." -ForegroundColor Cyan
az appservice plan create `
  --name $APP_SERVICE_PLAN `
  --resource-group $RESOURCE_GROUP `
  --location $LOCATION `
  --sku B1 `
  --is-linux

# 5. Create Web App (Backend API + Workers running on Node 20 LTS)
Write-Host "🌐 Creating Web App: $BACKEND_WEBAPP_NAME..." -ForegroundColor Cyan
az webapp create `
  --name $BACKEND_WEBAPP_NAME `
  --resource-group $RESOURCE_GROUP `
  --plan $APP_SERVICE_PLAN `
  --runtime "NODE|20-lts"

# Configure Web App startup file
Write-Host "⚙️ Configuring Web App startup file..." -ForegroundColor Cyan
az webapp config set `
  --name $BACKEND_WEBAPP_NAME `
  --resource-group $RESOURCE_GROUP `
  --startup-file "node backend/dist/backend/src/index.js"

# Enable WebSockets (needed for Socket.io / persistent streams if any)
az webapp config set `
  --name $BACKEND_WEBAPP_NAME `
  --resource-group $RESOURCE_GROUP `
  --web-sockets-enabled true

# 6. Create Static Web App (React Frontend SPA)
Write-Host "⚡ Creating Static Web App: $FRONTEND_STATIC_NAME..." -ForegroundColor Cyan
az staticwebapp create `
  --name $FRONTEND_STATIC_NAME `
  --resource-group $RESOURCE_GROUP `
  --location $LOCATION

# 7. Print GitHub Credentials & Deployment Secrets Info
Write-Host "🎉 Infrastructure provisioned successfully!" -ForegroundColor Green
Write-Host "--------------------------------------------------------" -ForegroundColor Yellow
Write-Host "Action Required: Retrieve Deployment Secrets for GitHub" -ForegroundColor Yellow
Write-Host "--------------------------------------------------------" -ForegroundColor Yellow

# Get Static Web App Deployment Token
$SWA_TOKEN = az staticwebapp secrets list --name $FRONTEND_STATIC_NAME --query "properties.apiKey" -o tsv
Write-Host "1. Frontend SWA API Token (Save to GitHub Secret: AZURE_STATIC_WEB_APPS_API_TOKEN):" -ForegroundColor Cyan
Write-Host $SWA_TOKEN -ForegroundColor White

# Get Web App Publishing Profile
Write-Host "`n2. Backend Publishing Profile (Save to GitHub Secret: AZURE_WEBAPP_PUBLISH_PROFILE):" -ForegroundColor Cyan
az webapp deployment list-publishing-profiles --name $BACKEND_WEBAPP_NAME --resource-group $RESOURCE_GROUP --xml

Write-Host "`nUse these tokens in your GitHub Repository Secrets to automate your CI/CD pipeline." -ForegroundColor Green
