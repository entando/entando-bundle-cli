export enum Stack {
  React = 'react',
  Angular = 'angular',
  Node = 'node',
  SpringBoot = 'spring-boot'
}

export enum ComponentType {
  MICROFRONTEND = 'microfrontend',
  MICROSERVICE = 'microservice'
}

export interface PartialComponent {
  name: string
  stack: string
}

export interface Component extends PartialComponent, Record<string, unknown> {
  version: string
  type: ComponentType
}
