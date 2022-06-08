import {
  BundleDescriptor,
  MicroFrontend,
  Microservice
} from '../models/bundle-descriptor'
import {
  Component,
  ComponentType,
  MicroFrontendStack,
  MicroserviceStack,
  VersionedComponent
} from '../models/component'
import { BundleDescriptorService } from './bundle-descriptor-service'
import { ComponentDescriptorService } from './component-descriptor-service'
import { CLIError } from '@oclif/errors'
import * as path from 'node:path'
import {
  DESCRIPTORS_OUTPUT_FOLDER,
  MICROSERVICES_FOLDER,
  MICROFRONTENDS_FOLDER,
  PLUGINS_FOLDER,
  WIDGETS_FOLDER,
  DESCRIPTOR_EXTENSION
} from '../paths'
import * as fs from 'node:fs'
import {
  ProcessExecutionResult,
  ProcessExecutorService
} from './process-executor-service'
import { debugFactory } from './debug-factory-service'
import { CommandFactoryService, Phase } from './command-factory-service'

const COMPTYPE_OUTPUT_FOLDER_MAP = {
  [ComponentType.MICROFRONTEND]: WIDGETS_FOLDER,
  [ComponentType.MICROSERVICE]: PLUGINS_FOLDER
}

export class ComponentService {
  private static debug = debugFactory(ComponentService)

  private readonly bundleDescriptorService: BundleDescriptorService
  private readonly componentDescriptorService: ComponentDescriptorService

  constructor() {
    this.bundleDescriptorService = new BundleDescriptorService(process.cwd())
    this.componentDescriptorService = new ComponentDescriptorService()
  }

  public getComponents(type?: ComponentType): Array<Component<ComponentType>> {
    const { microfrontends, microservices }: BundleDescriptor =
      this.bundleDescriptorService.getBundleDescriptor()

    let components: Array<Component<ComponentType>>

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

  public getVersionedComponents(type?: ComponentType): VersionedComponent[] {
    return this.getComponents(type).map(comp => ({
      ...comp,
      version: this.componentDescriptorService.getComponentVersion(comp)
    }))
  }

  public static getComponentPath(component: Component<ComponentType>): string {
    const { name, type } = component
    let componentPath

    switch (type) {
      case ComponentType.MICROSERVICE:
        componentPath = path.resolve(MICROSERVICES_FOLDER, name)
        break
      case ComponentType.MICROFRONTEND:
        componentPath = path.resolve(MICROFRONTENDS_FOLDER, name)
        break
    }

    return componentPath
  }

  public async build(name: string): Promise<ProcessExecutionResult> {
    const component = this.getComponent(name)

    this.validateComponent(component)

    const componentPath = ComponentService.getComponentPath(component)

    if (!fs.existsSync(componentPath)) {
      throw new CLIError(`Directory ${componentPath} not exists`)
    }

    const buildCmd = CommandFactoryService.getCommand(component, Phase.Build)

    ComponentService.debug(`Building ${name} using ${buildCmd}`)

    return ProcessExecutorService.executeProcess({
      command: buildCmd,
      outputStream: process.stdout,
      errorStream: process.stdout,
      workDir: componentPath
    })
  }

  public componentExists(name: string): boolean {
    return this.getComponents().some(comp => comp.name === name)
  }

  public getComponent(name: string): Component<ComponentType> {
    const component = this.getComponents().find(comp => comp.name === name)
    if (component === undefined) {
      throw new CLIError(`Component ${name} not found`)
    }

    return component
  }

  // eslint-disable-next-line no-warning-comments
  // TODO: ENG-3788 Move the component validation to the Bundle validator
  validateComponent(component: Component<ComponentType>): void {
    const { type, stack, name } = component
    if (type === ComponentType.MICROFRONTEND) {
      if (
        !Object.values(MicroFrontendStack).includes(stack as MicroFrontendStack)
      ) {
        throw new CLIError(
          `Component ${name} of type ${type} has an invalid stack ${stack}`
        )
      }
    } else if (type === ComponentType.MICROSERVICE) {
      if (
        !Object.values(MicroserviceStack).includes(stack as MicroserviceStack)
      ) {
        throw new CLIError(
          `Component ${name} of type ${type} has an invalid stack ${stack}`
        )
      }
    } else {
      throw new CLIError(`Invalid component type ${type}`)
    }
  }

  public removeOutputDescriptor(component: Component<ComponentType>): void {
    const outputPath = path.resolve(
      ...DESCRIPTORS_OUTPUT_FOLDER,
      COMPTYPE_OUTPUT_FOLDER_MAP[component.type],
      component.name + DESCRIPTOR_EXTENSION
    )

    fs.rmSync(outputPath, { recursive: true, force: true })
  }

  private mapComponentType(
    type: ComponentType
  ): (compToMap: MicroFrontend | Microservice) => Component<ComponentType> {
    return ({ name, stack }) => ({ name, stack, type })
  }
}
