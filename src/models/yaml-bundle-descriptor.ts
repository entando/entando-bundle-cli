import {
  ApiType,
  DBMS,
  MicroFrontendAppBuilderSlot,
  MicroFrontendType,
  Nav,
  Permission,
  Resources,
  SimpleEnvironmentVariable,
  WidgetParam
} from './bundle-descriptor'

export type BaseYamlWidgetDescriptor<T extends MicroFrontendType> = {
  name: string
  group: string
  descriptorVersion: string
  type: T
  apiClaims?: Array<YamlInternalApiClaim | YamlExternalApiClaim>
  customElement: string
  customUiPath?: string
  parentName?: string
  parentCode?: string
  params: WidgetParam[]
  paramsDefaults?: { [name: string]: string }
}

export type YamlSecretEnvironmentVariable = {
  name: string
  valueFrom: {
    secretKeyRef: {
      name: string
      key: string
    }
  }
}

export type YamlEnvironmentVariable =
  | SimpleEnvironmentVariable
  | YamlSecretEnvironmentVariable

export type YamlAppBuilderWidgetDescriptor =
  BaseYamlWidgetDescriptor<MicroFrontendType.AppBuilder> & {
    ext: {
      appBuilder: {
        slot: MicroFrontendAppBuilderSlot
        nav?: Nav[]
        paths?: string[]
      }
    }
  }

export type YamlWidgetDescriptor =
  BaseYamlWidgetDescriptor<MicroFrontendType.Widget> & {
    titles: { [lang: string]: string }
    configMfe?: string
    contextParams?: string[]
    nav?: Nav[]
    widgetCategory?: string
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
  environmentVariables?: YamlEnvironmentVariable[]
  resources?: Resources
}

export const SUPPORTED_PSC_TYPES = [
  'fragments',
  'categories',
  'pages',
  'pageTemplates',
  'contentTypes',
  'contentTemplates',
  'contents',
  'assets',
  'groups',
  'labels',
  'languages',
  'pageModels',
  'contentModels',
  'widgets',
  'resources'
] as const

export type SupportedPSC = typeof SUPPORTED_PSC_TYPES[number]
export type SupportedComponents = SupportedPSC | 'plugins'

export type YamlBundleDescriptor = {
  name: string
  descriptorVersion: string
  description?: string
  thumbnail?: string
  components: {
    [key in SupportedComponents]?: string[]
  }
  ext?: {
    nav: Nav[]
  }
}
