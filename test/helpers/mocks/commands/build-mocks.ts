import {
  Component,
  ComponentType,
  MicroFrontendStack,
  MicroserviceStack
} from '../../../../src/models/component'
export const msNameSpringBoot = 'test-ms-spring-boot'
export const mfeNameReact = 'test-mfe-react'

export const msSpringBoot: Component<ComponentType> = {
  name: msNameSpringBoot,
  stack: MicroserviceStack.SpringBoot,
  type: ComponentType.MICROSERVICE
}

export const mfeReact: Component<ComponentType> = {
  name: mfeNameReact,
  stack: MicroFrontendStack.React,
  type: ComponentType.MICROFRONTEND
}

export const msListSpringBoot: Array<Component<ComponentType>> = [
  {
    name: 'test-ms-spring-boot-1',
    stack: MicroserviceStack.SpringBoot,
    type: ComponentType.MICROSERVICE
  },
  {
    name: 'test-ms-spring-boot-2',
    stack: MicroserviceStack.SpringBoot,
    type: ComponentType.MICROSERVICE
  }
]

export const mfeListReact: Array<Component<ComponentType>> = [
  {
    name: 'test-mfe-react-1',
    stack: MicroFrontendStack.React,
    type: ComponentType.MICROFRONTEND
  },
  {
    name: 'test-mfe-react-2',
    stack: MicroFrontendStack.React,
    type: ComponentType.MICROFRONTEND
  }
]
