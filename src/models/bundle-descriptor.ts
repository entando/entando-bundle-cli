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

export type MicroService = {
  /** Component name. Version will be retrieved from the pom.xml, package.json */
  name: string
  /** Tech stack. It could be guessed from folder content or forced by the user */
  stack: string
  /** Docker image name. This field is computed at packaging phase */
  image: string
  /** Value used for defining custom pod names */
  deploymentBaseName?: string
  dbms: string
  ingressPath?: string
  healthCheckPath?: string
  roles?: string[]
  permissions?: Permission[]
  securityLevel?: 'strict' | 'lenient'
  env?: EnvironmentVariable[]
}

export type MicroFrontend = {
  name: string
  stack: string
  code: string
  titles: { [lang: string]: string }
  group: string
  customUiPath: string
  publicFolder: string
  configUi?: {
    customElement: string
    resources: string[]
  }
  apiClaims?: Array<ApiClaim | ExternalApiClaim>
}

export type BundleDescriptor = {
  /** Bundle project name. It will be used as default Docker image name */
  name: string
  /** Bundle version. It will be used as default Docker image tag */
  version: string
  type: string
  description?: string
  microservices: MicroService[]
  microfrontends: MicroFrontend[]
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
