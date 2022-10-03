import { MicroFrontendType } from './bundle-descriptor'

export enum MicroFrontendStack {
  React = 'react',
  Angular = 'angular',
  Custom = 'custom'
}

export enum MicroserviceStack {
  Node = 'node',
  SpringBoot = 'spring-boot',
  Custom = 'custom'
}

export enum ComponentType {
  MICROFRONTEND = 'microfrontend',
  MICROSERVICE = 'microservice'
}

export type StackFor<T extends ComponentType> =
  T extends ComponentType.MICROFRONTEND
    ? MicroFrontendStack
    : T extends ComponentType.MICROSERVICE
    ? MicroserviceStack
    : never

export type Component<T extends ComponentType> = {
  name: string
  stack: StackFor<T>
  type: T
  configMfe?: T extends ComponentType.MICROFRONTEND ? string : never
  mfeType?: T extends ComponentType.MICROFRONTEND ? MicroFrontendType : never
}

export type VersionedComponent = Component<ComponentType> & {
  version: string
}
