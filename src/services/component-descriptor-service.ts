import { BundleDescriptor } from '../models/bundle-descriptor'
import { Component, ComponentType } from '../models/component'
import BundleDescriptorService from './bundle-descriptor-service'

export class ComponentDescriptorService {
  private readonly bundleDescriptorService: BundleDescriptorService

  constructor() {
    this.bundleDescriptorService = new BundleDescriptorService(process.cwd())
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
      version: this.getComponentVersion(ms.name, type)
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
      version: this.getComponentVersion(mfe.name, type)
    }))
  }

  // TODO: implement proper way of getting a component's version
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getComponentVersion(name: string, type: ComponentType): string {
    return '0.0.1'
  }
}
