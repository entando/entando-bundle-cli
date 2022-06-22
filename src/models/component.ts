import { MicroFrontendType } from "./bundle-descriptor"

export enum MicroFrontendStack {
  React = 'react',
  Angular = 'angular'
}

export enum MicroserviceStack {
  Node = 'node',
  SpringBoot = 'spring-boot'
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
  configMfe?: T extends ComponentType.MICROFRONTEND ? string : never
  widgetType?: T extends ComponentType.MICROFRONTEND ? MicroFrontendType : never
  type: T
}

export type VersionedComponent = Component<ComponentType> & {
  version: string
}
