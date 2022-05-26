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
import * as path from 'node:path'
import { MICROSERVICES_FOLDER } from '../paths'
import * as fs from 'node:fs'
import { ProcessExecutorService } from './process-executor-service'
import { debugFactory } from './debug-factory-service'

export class ComponentService {
  private static debug = debugFactory(ComponentService)

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

  public async build(name: string): Promise<any> {
    const component = this.getComponent(name)

    const { type, stack } = component

    let componentPath: string
    let buildCmd = ''
    let buildCmdArgs: string[] = []

    if (type === 'microservice' && stack === 'spring-boot') {
      componentPath = path.resolve(MICROSERVICES_FOLDER, name)
      buildCmd = 'mvn'
      buildCmdArgs = ['clean', 'test']
    } else {
      throw new CLIError(`${stack} ${type} build not implemented`)
    }

    ComponentService.debug(
      `Building ${name} using ${buildCmd} ${buildCmdArgs.join(' ').trim()}`
    )

    if (!fs.existsSync(componentPath)) {
      throw new CLIError(`Directory ${componentPath} not exists`)
    }

    return ProcessExecutorService.executeProcess({
      command: buildCmd,
      arguments: buildCmdArgs,
      outputStream: process.stdout,
      errorStream: process.stdout,
      workDir: componentPath
    })
  }

  getComponent(name: string): Component {
    const component = this.getComponents().find(comp => comp.name === name)
    if (component === undefined) {
      throw new CLIError(`Component ${name} not found`)
    }

    return component
  }

  private mapComponentType(
    type: ComponentType
  ): (compToMap: MicroFrontend | MicroService) => Component {
    return ({ name, stack }) => ({ name, stack, type })
  }
}
