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

export type Microservice = {
  /** Component name. Version will be retrieved from the pom.xml, package.json */
  name: string
  /** Tech stack. It could be guessed from folder content or forced by the user */
  stack: MicroserviceStack
  /** Value used for defining custom pod names */
  deploymentBaseName?: string
  dbms?: DBMS
  ingressPath?: string
  healthCheckPath?: string
  roles?: string[]
  permissions?: Permission[]
  securityLevel?: SecurityLevel
  env?: EnvironmentVariable[]
  commands?: {
    build?: string
  }
}

export type MicroFrontend = {
  name: string
  stack: MicroFrontendStack
  code?: string
  titles: { [lang: string]: string }
  group: string
  publicFolder?: string
  apiClaims?: Array<ApiClaim | ExternalApiClaim>
  nav?: Nav[]
  commands?: {
    build?: string
  }
}

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

export enum ApiType {
  Internal = 'internal',
  External = 'external'
}

export interface ApiClaim {
  name: string
  type: ApiType
  serviceId: string
}

export interface ExternalApiClaim extends ApiClaim {
  bundleId: string
}

export type Nav = {
  label: { [lang: string]: string }
  target: string
  url: string
}
