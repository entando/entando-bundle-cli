import {
  BundleDescriptor, BundleDescriptorVersion,
  Commands,
  MicroFrontend,
  MicroFrontendType,
  Microservice
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
import { PREFIX_GLOBAL_WIDGET } from './microfrontend-service'

const COMPTYPE_OUTPUT_FOLDER_MAP = {
  [ComponentType.MICROFRONTEND]: WIDGETS_FOLDER,
  [ComponentType.MICROSERVICE]: PLUGINS_FOLDER
}

export class ComponentService {
  private static debug = debugFactory(ComponentService)

  private readonly bundleDescriptorService: BundleDescriptorService
  private readonly componentDescriptorService: ComponentDescriptorService

  constructor(bundleDirectory?: string) {
    this.bundleDescriptorService = new BundleDescriptorService(bundleDirectory ?? undefined)
    this.componentDescriptorService = new ComponentDescriptorService()
  }

  public getComponents(type?: ComponentType): Array<Component<ComponentType>> {
    const {microfrontends, microservices}: BundleDescriptor =
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
    return this.getComponents(type).map(comp => {
      if ((comp as VersionedComponent).version) {
        return comp as VersionedComponent
      }

      return {
        ...comp,
        version: this.componentDescriptorService.getComponentVersion(comp)
      }
    })
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

  public async run(name: string): Promise<ProcessExecutionResult> {
    const component = this.getComponent(name)

    const componentPath = ComponentService.getComponentPath(component)

    if (!fs.existsSync(componentPath)) {
      throw new CLIError(`Directory ${componentPath} not exists`)
    }

    const runCmd = CommandFactoryService.getCommand(component, Phase.Run)

    ComponentService.debug(`Run ${name} using ${runCmd}`)

    return ProcessExecutorService.executeProcess({
      command: runCmd,
      outputStream: process.stdout,
      errorStream: process.stdout,
      workDir: componentPath
    })
  }

  public componentExists(name: string): boolean {
    return this.getComponents().some(comp => comp.name === name)
  }

  public checkDuplicatedComponentNames(): void {
    const allNames = this.getComponents().map(c => c.name)

    const duplicates = allNames.filter(
      (item, index) => allNames.indexOf(item) !== index
    )

    if (duplicates.length > 0) {
      throw new Error(
        'Components names should be unique. Duplicates found: ' +
          [...new Set(duplicates)].join(', ')
      )
    }
  }

  public checkConfigMfes(): void {
    const allMfes = this.getComponents(ComponentType.MICROFRONTEND)
    const allMfesWithTypes = allMfes.map(({ name, mfeType }) => ({
      name,
      type: mfeType
    }))
    for (const mfe of allMfes) {
      if (
        mfe.configMfe &&
        !mfe.configMfe.startsWith(PREFIX_GLOBAL_WIDGET) &&
        allMfesWithTypes.findIndex(
          ({ name, type }) =>
            mfe.configMfe === name && type === MicroFrontendType.WidgetConfig
        ) === -1
      ) {
        throw new CLIError(
          `configMfe value ${mfe.configMfe} for MFE ${mfe.name} must be an existing widget-config MFE in the project or a platform provided config MFE, defined with the ${PREFIX_GLOBAL_WIDGET}<name> syntax`
        )
      }
    }
  }

  public checkDescriptorFieldsCompatibility(): void {
    const bundleDescriptor = this.bundleDescriptorService.getBundleDescriptor()
    const bundleDescriptorVersion = bundleDescriptor.bundleDescriptorVersion;

    for (const ms of bundleDescriptor.microservices) {
      // Microservice Resources has been added starting from v6 bundles
      if (ms.resources && bundleDescriptorVersion === BundleDescriptorVersion.v5) {
        throw new CLIError(
          `Incompatible "resources" field for the microservice ${ms.name}, this field can't be set in v5 bundle version`
        )
      }
    }
  }

  public getComponent(name: string): Component<ComponentType> {
    const component = this.getComponents().find(comp => comp.name === name)
    if (component === undefined) {
      throw new CLIError(`Component ${name} not found`)
    }

    return component
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
    return ({ name, stack, ...others }) => {
      const component = {
        name,
        stack,
        type,
        ...('type' in others ? { mfeType: others.type } : {}),
        ...('configMfe' in others ? { configMfe: others.configMfe } : {})
      }
      if (others.version) {
        ;(component as VersionedComponent).version = others.version
      }

      return component
    }
  }

  public static getPreFilledCommands(): Commands {
    return {
      build: getPreFilledCommand('build'),
      run: getPreFilledCommand('run'),
      pack: getPreFilledCommand('pack')
    }
  }
}

function getPreFilledCommand(phase: string): string {
  return `echo 'Please edit this command to customize the ${phase} phase' && exit 1`
}
