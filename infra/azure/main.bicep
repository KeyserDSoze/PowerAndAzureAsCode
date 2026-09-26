@description('Azure region for App Service, Key Vault and observability resources.')
param location string = resourceGroup().location

@description('Azure region used by the Static Web App resource. Can differ from the backend region.')
param staticWebAppLocation string = location

@description('Globally unique Azure Static Web App name.')
param staticWebAppName string

@description('Globally unique Azure App Service name.')
param apiWebAppName string

@description('App Service plan name.')
param appServicePlanName string = '${apiWebAppName}-plan'

@description('App Service plan SKU name. Keep the B1 default for low-cost development; override per environment for production sizing.')
param appServiceSkuName string = 'B1'

@description('App Service plan SKU tier matching appServiceSkuName.')
param appServiceSkuTier string = 'Basic'

@description('App Service plan instance capacity.')
@minValue(1)
param appServicePlanCapacity int = 1

@description('Globally unique Key Vault name.')
param keyVaultName string

@description('Whether Key Vault permits public network access. Disable only when the chosen topology provides a working private access path for deployment/runtime.')
@allowed([
  'Enabled'
  'Disabled'
])
param keyVaultPublicNetworkAccess string = 'Enabled'

@description('Log Analytics workspace name.')
param logAnalyticsWorkspaceName string

@description('Application Insights component name.')
param appInsightsName string

module observability './observability.bicep' = {
  name: 'observability'
  params: {
    location: location
    logAnalyticsWorkspaceName: logAnalyticsWorkspaceName
    appInsightsName: appInsightsName
  }
}

module keyVault './key-vault.bicep' = {
  name: 'keyVault'
  params: {
    location: location
    keyVaultName: keyVaultName
    publicNetworkAccess: keyVaultPublicNetworkAccess
  }
}

module appService './app-service.bicep' = {
  name: 'appService'
  params: {
    location: location
    apiWebAppName: apiWebAppName
    appServicePlanName: appServicePlanName
    appServiceSkuName: appServiceSkuName
    appServiceSkuTier: appServiceSkuTier
    appServicePlanCapacity: appServicePlanCapacity
  }
}

resource staticWebApp 'Microsoft.Web/staticSites@2023-12-01' = {
  name: staticWebAppName
  location: staticWebAppLocation
  sku: {
    name: 'Standard'
    tier: 'Standard'
  }
  properties: {}
}

resource existingKeyVault 'Microsoft.KeyVault/vaults@2026-02-01' existing = {
  name: keyVaultName
}

resource apiKeyVaultSecretsUser 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(existingKeyVault.id, apiWebAppName, 'KeyVaultSecretsUser')
  scope: existingKeyVault
  properties: {
    principalId: appService.outputs.principalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: subscriptionResourceId(
      'Microsoft.Authorization/roleDefinitions',
      '4633458b-17de-408a-b874-0445c86b69e6'
    )
  }
  dependsOn: [
    keyVault
  ]
}

output staticWebAppName string = staticWebApp.name
output apiWebAppName string = appService.outputs.apiWebAppName
output apiResourceId string = appService.outputs.apiResourceId
output keyVaultName string = keyVault.outputs.name
output appInsightsConnectionString string = observability.outputs.connectionString
