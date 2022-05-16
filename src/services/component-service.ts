import { BundleDescriptor } from '../models/bundle-descriptor'
import { Component, ComponentType, PartialComponent } from '../models/component'
import BundleDescriptorService from './bundle-descriptor-service'
import { ComponentDescriptorService } from './component-descriptor-service'

export class ComponentService {
  private readonly bundleDescriptorService: BundleDescriptorService
  private readonly componentDescriptorService: ComponentDescriptorService

  constructor() {
    this.bundleDescriptorService = new BundleDescriptorService(process.cwd())
    this.componentDescriptorService = new ComponentDescriptorService()
  }

  public getComponents(type?: ComponentType): Array<Component> {
    const { microfrontends, microservices }: BundleDescriptor =
      this.bundleDescriptorService.getBundleDescriptor()

    const compTypeMap: { [index: number]: ComponentType } = {}
    let components: Array<PartialComponent>

    if (type === ComponentType.MICROFRONTEND) {
      components = microfrontends
    } else if (type === ComponentType.MICROSERVICE) {
      components = microservices
    } else {
      components = [
        ...microfrontends.map((mfe, idx) => {
          compTypeMap[idx] = ComponentType.MICROFRONTEND
          return mfe
        }),
        ...microservices.map((ms, idx) => {
          compTypeMap[microfrontends.length + idx] = ComponentType.MICROSERVICE
          return ms
        })
      ]
    }

    return components.map((comp, idx) => {
      const { name, stack } = comp
      const compType: ComponentType = type || compTypeMap[idx]

      return {
        name,
        stack,
        type: compType,
        version: this.componentDescriptorService.getComponentVersion(
          comp,
          compType
        )
      }
    })
  }
}
