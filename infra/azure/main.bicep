@description('Azure region for App Service resources.')
param location string = resourceGroup().location

@description('Globally unique Azure Static Web App name.')
param staticWebAppName string

@description('Globally unique Azure App Service name.')
param apiWebAppName string

@description('App Service plan name.')
param appServicePlanName string = '${apiWebAppName}-plan'

resource staticWebApp 'Microsoft.Web/staticSites@2023-12-01' = {
  name: staticWebAppName
  location: location
  sku: {
    name: 'Standard'
    tier: 'Standard'
  }
  properties: {}
}

resource plan 'Microsoft.Web/serverfarms@2024-04-01' = {
  name: appServicePlanName
  location: location
  sku: {
    name: 'B1'
    tier: 'Basic'
  }
  kind: 'linux'
  properties: {
    reserved: true
  }
}

resource api 'Microsoft.Web/sites@2024-04-01' = {
  name: apiWebAppName
  location: location
  kind: 'app,linux'
  properties: {
    serverFarmId: plan.id
    httpsOnly: true
    siteConfig: {
      linuxFxVersion: 'DOTNETCORE|10.0'
      alwaysOn: true
      minTlsVersion: '1.2'
      ftpsState: 'Disabled'
    }
  }
}

output staticWebAppName string = staticWebApp.name
output apiWebAppName string = api.name
output apiResourceId string = api.id
