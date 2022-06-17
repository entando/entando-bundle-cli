import {
  ApiClaim,
  DBMS,
  EnvironmentVariable,
  ExternalApiClaim,
  MicroFrontendAppBuilderSlot,
  MicroFrontendType,
  Nav,
  Permission
} from './bundle-descriptor'

export type YamlWidgetDescriptor = {
  name: string
  titles: { [lang: string]: string }
  group: string
  descriptorVersion: string
  type: MicroFrontendType
  apiClaims?: Array<ApiClaim | ExternalApiClaim>
  nav?: Nav[]
  slot?: MicroFrontendAppBuilderSlot
  paths?: string[]
}

export type YamlPluginDescriptor = {
  name: string
  descriptorVersion: string
  image: string
  deploymentBaseName?: string
  dbms: DBMS
  ingressPath?: string
  healthCheckPath?: string
  roles?: string[]
  permissions?: Permission[]
  securityLevel?: string
  environmentVariables?: EnvironmentVariable[]
}

export type YamlBundleDescriptor = {
  name: string
  descriptorVersion: string
  description?: string
  thumbnail?: string
  components: {
    plugins: string[]
    widgets: string[]
  }
  global?: {
    nav: Nav[]
  }
}
