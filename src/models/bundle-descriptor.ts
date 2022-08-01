import { MicroFrontendStack, MicroserviceStack } from './component'

export type EnvironmentVariable =
  | {
      name: string
      value: string
    }
  | {
      name: string
      valueFrom: {
        secretKeyRef: {
          name: string
          key: string
        }
      }
    }

export type Permission = {
  clientId: string
  role: string
}

export enum DBMS {
  None = 'none',
  PostgreSQL = 'postgresql',
  MySQL = 'mysql',
  Embedded = 'embedded'
}

export enum SecurityLevel {
  Strict = 'strict',
  Lenient = 'lenient'
}

export type WidgetParam = {
  name: string
  description?: string
}

export type Commands = {
  build?: string
  run?: string
  pack?: string
}

export type Microservice = {
  /** Component name. Version will be retrieved from the pom.xml, package.json */
  name: string
  /** Tech stack. It could be guessed from folder content or forced by the user */
  stack: MicroserviceStack
  /** Value used for defining custom pod names */
  healthCheckPath: string
  deploymentBaseName?: string
  dbms?: DBMS
  ingressPath?: string
  roles?: string[]
  permissions?: Permission[]
  securityLevel?: SecurityLevel
  env?: EnvironmentVariable[]
  commands?: Commands
}

type BaseMicroFrontend = {
  name: string
  stack: MicroFrontendStack
  group: string
  publicFolder?: string
  buildFolder?: string
  apiClaims?: Array<ApiClaim | ExternalApiClaim>
  commands?: Commands
  nav?: Nav[]
  customElement: string
  customUi?: string
  parentName?: string
  parentCode?: string
  params?: WidgetParam[]
  paramsDefaults?: { [name: string]: string }
}

export type WidgetMicroFrontend = BaseMicroFrontend & {
  titles: { [lang: string]: string }
  type: MicroFrontendType.Widget
  contextParams?: string[]
  configMfe?: string
}

export type WidgetConfigMicroFrontend = BaseMicroFrontend & {
  type: MicroFrontendType.WidgetConfig
}

export type AppBuilderMicroFrontend = BaseMicroFrontend & {
  type: MicroFrontendType.AppBuilder
} & (
    | {
        slot: Exclude<
          MicroFrontendAppBuilderSlot,
          MicroFrontendAppBuilderSlot.Content
        >
      }
    | { slot: MicroFrontendAppBuilderSlot.Content; paths: string[] }
  )

export type MicroFrontend =
  | WidgetMicroFrontend
  | WidgetConfigMicroFrontend
  | AppBuilderMicroFrontend

export type BundleDescriptor = {
  /** Bundle project name. It will be used as default Docker image name */
  name: string
  /** Bundle version. It will be used as default Docker image tag */
  version: string
  type: string
  description?: string
  microservices: Microservice[]
  microfrontends: MicroFrontend[]
  svc?: string[]
  global?: {
    nav: Nav[]
  }
}

export type BundleGroup = {
  bundleGroupName: string
  bundleGroupVersionId: number
}

export type Bundle = {
  bundleGroupName: string
  bundleName: string
  gitSrcRepoAddress: string
  bundleGroupVersionId: number
  bundleGroupId: number
  bundleId: number
}

export enum MicroFrontendType {
  AppBuilder = 'app-builder',
  Widget = 'widget',
  WidgetConfig = 'widget-config'
}

export enum MicroFrontendAppBuilderSlot {
  PrimaryHeader = 'primary-header',
  PrimaryMenu = 'primary-menu',
  Content = 'content'
}

export enum ApiType {
  Internal = 'internal',
  External = 'external'
}

export interface ApiClaim {
  name: string
  type: ApiType
  serviceName: string
}

export interface ExternalApiClaim extends ApiClaim {
  bundle: string
}

export type Nav = {
  label: { [lang: string]: string }
  target: string
  url: string
}
