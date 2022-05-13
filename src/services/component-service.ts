import { BundleDescriptor } from '../models/bundle-descriptor'
import { Component, ComponentType } from '../models/component'
import BundleDescriptorService from './bundle-descriptor-service'
import { ComponentDescriptorService } from './component-descriptor-service'

type PartialComponent = {
  name: string
  stack: string
  type?: ComponentType
}

export class ComponentService {
  private readonly bundleDescriptorService: BundleDescriptorService
  private readonly componentDescriptorService: ComponentDescriptorService

  constructor() {
    this.bundleDescriptorService = new BundleDescriptorService(process.cwd())
    this.componentDescriptorService = new ComponentDescriptorService()
  }

  getComponents(type?: ComponentType): Array<Component> {
    const { microfrontends, microservices }: BundleDescriptor =
      this.bundleDescriptorService.getBundleDescriptor()
    let components: Array<PartialComponent>

    if (type === ComponentType.MICROFRONTEND) {
      components = microfrontends
    } else if (type === ComponentType.MICROSERVICE) {
      components = microservices
    } else {
      components = [
        ...microfrontends.map(mfe => ({
          ...mfe,
          type: ComponentType.MICROFRONTEND
        })),
        ...microservices.map(ms => ({
          ...ms,
          type: ComponentType.MICROSERVICE
        }))
      ]
    }

    return components.map(comp => {
      const { name, stack, type: ctype } = <Component>comp
      const compType: ComponentType = type || ctype

      return {
        name,
        stack,
        type: compType,
        version: this.componentDescriptorService.getComponentVersion(
          name,
          compType
        )
      }
    })
  }
}
