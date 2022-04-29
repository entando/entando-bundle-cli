export interface MicroService {
  /** Component name. Version will be retrieved from the pom.xml, package.json */
  name: string
  /** Tech stack. It could be guessed from folder content or forced by the user */
  stack: string
  /** Docker image name. This field is computed at packaging phase */
  image: string
  dbms: string
  ingressPath: string
  healthCheckPath: string
  roles: string[]
  env: any
}

export interface MicroFrontend {
  name: string
  stack: string
  code: string
  titles: { [lang: string]: string }
  group: string
  customUiPath: string
}

export interface BundleDescriptor {
  /** Bundle project name. It will be used as default Docker image name */
  name: string
  /** Bundle version. It will be used as default Docker image tag */
  version: string
  description?: string
  microservices: MicroService[]
  microfrontends: MicroFrontend[]
}
