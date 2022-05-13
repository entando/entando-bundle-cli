import { BundleDescriptor } from '../models/bundle-descriptor'
import { Component, ComponentType } from '../models/component'
import BundleDescriptorService from './bundle-descriptor-service'
import { ComponentDescriptorService } from './component-descriptor-service'

export class ComponentService {
  private readonly bundleDescriptorService: BundleDescriptorService
  private readonly componentDescriptorService: ComponentDescriptorService

  constructor() {
    this.bundleDescriptorService = new BundleDescriptorService(process.cwd())
    this.componentDescriptorService = new ComponentDescriptorService()
  }

  getComponents(): Array<Component> {
    return [...this.getMsComponents(), ...this.getMfeComponents()]
  }

  getMsComponents(): Array<Component> {
    const { microservices }: BundleDescriptor =
      this.bundleDescriptorService.getBundleDescriptor()
    const type = ComponentType.MICROSERVICE
    return microservices.map(ms => ({
      name: ms.name,
      stack: ms.stack,
      type,
      version: this.componentDescriptorService.getComponentVersion(ms.name, type)
    }))
  }

  getMfeComponents(): Array<Component> {
    const { microfrontends }: BundleDescriptor =
      this.bundleDescriptorService.getBundleDescriptor()
    const type = ComponentType.MICROFRONTEND
    return microfrontends.map(mfe => ({
      name: mfe.name,
      stack: mfe.stack,
      type,
      version: this.componentDescriptorService.getComponentVersion(mfe.name, type)
    }))
  }
}
