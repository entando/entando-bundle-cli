export enum ComponentType {
  MICROFRONTEND = 'microfrontend',
  MICROSERVICE = 'microservice'
}

export interface Component extends Record<string, unknown> {
  name: string
  version: string
  type: ComponentType
  stack: string
}
