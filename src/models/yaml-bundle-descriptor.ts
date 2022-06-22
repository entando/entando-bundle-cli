import {
  ApiType,
  DBMS,
  EnvironmentVariable,
  MicroFrontendAppBuilderSlot,
  MicroFrontendType,
  Nav,
  Permission
} from './bundle-descriptor'

export type YamlWidgetDescriptor = {
  name: string
  titles?: { [lang: string]: string }
  group: string
  descriptorVersion: string
  type: MicroFrontendType
  apiClaims?: Array<YamlInternalApiClaim | YamlExternalApiClaim>
  nav?: Nav[]
  slot?: MicroFrontendAppBuilderSlot
  paths?: string[]
  customElement: string
  configMfe?: string
}

type YamlApiClaim<T extends ApiType> = {
  name: string
  type: T
  pluginName: string
}

export type YamlInternalApiClaim = YamlApiClaim<ApiType.Internal>

export type YamlExternalApiClaim = YamlApiClaim<ApiType.External> & {
  bundleId: string
}

export type YamlPluginDescriptor = {
  name: string
  descriptorVersion: string
  image: string
  healthCheckPath: string
  deploymentBaseName?: string
  dbms: DBMS
  ingressPath?: string
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
