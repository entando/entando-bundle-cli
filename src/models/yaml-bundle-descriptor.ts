import {
  ApiType,
  DBMS,
  EnvironmentVariable,
  MicroFrontendAppBuilderSlot,
  MicroFrontendType,
  Nav,
  Permission,
  WidgetContextParam
} from './bundle-descriptor'

export type BaseYamlWidgetDescriptor<T extends MicroFrontendType> = {
  name: string
  titles: { [lang: string]: string }
  group: string
  descriptorVersion: string
  type: T
  apiClaims?: Array<YamlInternalApiClaim | YamlExternalApiClaim>
  customElement: string
}

export type YamlWidgetDescriptor =
  BaseYamlWidgetDescriptor<MicroFrontendType.AppBuilder> & {
    ext: {
      slot: MicroFrontendAppBuilderSlot
      nav?: Nav[]
      paths?: string[]
    }
  }

export type YamlAppBuilderWidgetDescriptor =
  BaseYamlWidgetDescriptor<MicroFrontendType.Widget> & {
    contextParams?: WidgetContextParam[]
    nav?: Nav[]
  }

export type YamlWidgetConfigDescriptor =
  BaseYamlWidgetDescriptor<MicroFrontendType.WidgetConfig> & {
    nav?: Nav[]
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
    'app-builder': string[]
  }
  global?: {
    nav: Nav[]
  }
}
