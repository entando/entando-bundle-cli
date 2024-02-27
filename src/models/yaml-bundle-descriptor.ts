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
  customElement?: string
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
  bundleId?: string
  bundleReference?: string
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

export const SUPPORTED_PSC_V1_TO_V5_TYPES = [
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
  'resources'
] as const

export type SupportedPSC = typeof SUPPORTED_PSC_TYPES[number]
export type SupportedComponents = SupportedPSC | 'plugins'
export type SupportedPSCToConvert = typeof SUPPORTED_PSC_V1_TO_V5_TYPES[number]

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

export enum DescriptorVersion {
  V1 = 'v1',
  V5 = 'v5'
}

export enum BundleType {
  STANDARD_BUNDLE = 'standard-bundle',
  SYSTEM_LEVEL_BUNDLE = 'system-level-bundle'
}

export type YamlBundleDescriptorV1 = {
  code: string
  components: {
    [key in SupportedComponents]?: string[]
  }
  description?: string
  'bundle-type'?: BundleType
  descriptorVersion?: DescriptorVersion.V1
  thumbnail?: string
  ext?: {
    nav: Nav[]
  }
}

export type YamlPluginDescriptorV1 = {
  name?: string
  descriptorVersion?: string
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

export type BaseYamlWidgetDescriptorV1<T extends MicroFrontendType> = {
  code: string
  group: string
  descriptorVersion?: string
  type?: T
  customUiPath?: string
  parentName?: string
  parentCode?: string
  params?: WidgetParam[]
  paramsDefaults?: { [name: string]: string }
  configMfe?: string
  contextParams?: string[]
  nav?: Nav[]
}

export type YamlWidgetDescriptorV1 =
  BaseYamlWidgetDescriptorV1<MicroFrontendType.Widget> & {
    titles: { [lang: string]: string }
    widgetCategory?: string
  }

export type YamlWidgetConfigDescriptorV1 =
  BaseYamlWidgetDescriptorV1<MicroFrontendType.WidgetConfig>
