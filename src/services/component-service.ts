import {
  BundleDescriptor,
  MicroFrontend,
  MicroService
} from '../models/bundle-descriptor'
import {
  Component,
  ComponentType,
  VersionedComponent
} from '../models/component'
import { BundleDescriptorService } from './bundle-descriptor-service'
import { ComponentDescriptorService } from './component-descriptor-service'
import { CLIError } from '@oclif/errors'

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

    let components: Array<Component>

    if (type === ComponentType.MICROFRONTEND) {
      components = microfrontends.map(
        this.mapComponentType(ComponentType.MICROFRONTEND)
      )
    } else if (type === ComponentType.MICROSERVICE) {
      components = microservices.map(
        this.mapComponentType(ComponentType.MICROSERVICE)
      )
    } else {
      components = [
        ...microfrontends.map(
          this.mapComponentType(ComponentType.MICROFRONTEND)
        ),
        ...microservices.map(this.mapComponentType(ComponentType.MICROSERVICE))
      ]
    }

    return components
  }

  public getVersionedComponents(
    type?: ComponentType
  ): Array<VersionedComponent> {
    return this.getComponents(type).map(comp => ({
      ...comp,
      version: this.componentDescriptorService.getComponentVersion(comp)
    }))
  }

  getComponent(name: string): Component {
    const allComponents = this.getAllComponents()
    const component = allComponents.find(comp => comp.name === name)
    if (component === undefined) {
      throw new CLIError(`Component ${name} not found`)
    }

    return component
  }

  getAllComponents(): Component[] {
    const mfe = this.getComponents(ComponentType.MICROFRONTEND)
    const ms = this.getComponents(ComponentType.MICROSERVICE)
    return [...mfe, ...ms]
  }

  private mapComponentType(
    type: ComponentType
  ): (compToMap: MicroFrontend | MicroService) => Component {
    return ({ name, stack }) => ({ name, stack, type })
  }
}
