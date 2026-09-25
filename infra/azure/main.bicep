@description('Azure region for App Service, Key Vault and observability resources.')
param location string = resourceGroup().location

@description('Globally unique Azure Static Web App name.')
param staticWebAppName string

@description('Globally unique Azure App Service name.')
param apiWebAppName string

@description('App Service plan name.')
param appServicePlanName string = '${apiWebAppName}-plan'

@description('Globally unique Key Vault name.')
param keyVaultName string

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
  }
}

module appService './app-service.bicep' = {
  name: 'appService'
  params: {
    location: location
    apiWebAppName: apiWebAppName
    appServicePlanName: appServicePlanName
  }
}

resource staticWebApp 'Microsoft.Web/staticSites@2023-12-01' = {
  name: staticWebAppName
  location: location
  sku: {
    name: 'Standard'
    tier: 'Standard'
  }
  properties: {}
}

resource existingKeyVault 'Microsoft.KeyVault/vaults@2023-07-01' existing = {
  name: keyVaultName
}

resource apiKeyVaultSecretsUser 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(existingKeyVault.id, appService.outputs.apiResourceId, 'KeyVaultSecretsUser')
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
