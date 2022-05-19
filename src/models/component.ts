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

export interface Component {
  name: string
  stack: string
  type: ComponentType
}

export interface VersionedComponent extends Component, Record<string, unknown> {
  version?: string
}
