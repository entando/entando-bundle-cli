import { EnvironmentVariable, Permission } from './bundle-descriptor'

export type YamlWidgetDescriptor = {
  code: string
  titles: { [lang: string]: string }
  group: string
  customUiPath: string
  configUi?: {
    customElement: string
    resources: string[]
  }
}

export type YamlPluginDescriptor = {
  descriptorVersion: 'v4'
  image: string
  deploymentBaseName?: string
  dbms: string
  ingressPath?: string
  healthCheckPath?: string
  roles?: string[]
  permissions?: Permission[]
  securityLevel?: string
  environmentVariables?: EnvironmentVariable[]
}

export type YamlBundleDescriptor = {
  code: string
  description?: string
  components: {
    plugins: string[]
    widgets: string[]
  }
}