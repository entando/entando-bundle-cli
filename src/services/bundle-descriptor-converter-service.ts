import {
  BundleDescriptor,
  MicroFrontend,
  MicroService
} from '../models/bundle-descriptor'
import {
  YamlBundleDescriptor,
  YamlPluginDescriptor,
  YamlWidgetDescriptor
} from '../models/yaml-bundle-descriptor'
import { BundleDescriptorService } from './bundle-descriptor-service'
import * as YAML from 'yaml'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { DESCRIPTORS_OUTPUT_FOLDER } from '../paths'
import { ComponentService } from './component-service'
import { ComponentType } from '../models/component'
import { DockerService } from './docker-service'

const PLUGIN_DESCRIPTOR_VERSION = 'v4'
const WIDGET_DESCRIPTOR_VERSION = 'v2'
const DESCRIPTOR_EXTENSION = '.yaml'
const BUNDLE_DESCRIPTOR_NAME = 'descriptor' + DESCRIPTOR_EXTENSION
const WIDGETS_DESCRIPTORS_FOLDER = 'widgets'
const PLUGINS_DESCRIPTORS_FOLDER = 'plugins'

export class BundleDescriptorConverterService {
  private readonly bundleDirectory: string
  private readonly bundleDescriptorService: BundleDescriptorService
  private readonly componentService: ComponentService
  private readonly dockerOrganization: string

  constructor(bundleDirectory: string, dockerOrganization: string) {
    this.bundleDirectory = bundleDirectory
    this.bundleDescriptorService = new BundleDescriptorService(bundleDirectory)
    this.componentService = new ComponentService()
    this.dockerOrganization = dockerOrganization
  }

  public generateYamlDescriptors(): void {
    const bundleDescriptor = this.bundleDescriptorService.getBundleDescriptor()

    for (const microFrontend of bundleDescriptor.microfrontends) {
      this.generateMicroFrontendYamlDescriptor(microFrontend)
    }

    const versionedMicroServices = this.componentService.getVersionedComponents(
      ComponentType.MICROSERVICE
    )

    for (const microService of bundleDescriptor.microservices) {
      const versionedMicroService = versionedMicroServices.find(
        ms => ms.name === microService.name
      )!
      this.generateMicroServiceYamlDescriptor(
        microService,
        versionedMicroService.version!
      )
    }

    this.generateBundleYamlDescriptor(bundleDescriptor)
  }

  private generateMicroFrontendYamlDescriptor(microFrontend: MicroFrontend) {
    const widgetDescriptor: YamlWidgetDescriptor = {
      code: microFrontend.code ?? microFrontend.name,
      titles: microFrontend.titles,
      group: microFrontend.group,
      version: WIDGET_DESCRIPTOR_VERSION,
      apiClaims: microFrontend.apiClaims
    }
    const filePath = path.join(
      ...DESCRIPTORS_OUTPUT_FOLDER,
      this.getMicroFrontendDescriptorRelativePath(microFrontend)
    )
    this.writeYamlFile(filePath, widgetDescriptor)
  }

  private generateMicroServiceYamlDescriptor(
    microService: MicroService,
    version: string
  ) {
    const pluginDescriptor: YamlPluginDescriptor = {
      descriptorVersion: PLUGIN_DESCRIPTOR_VERSION,
      dbms: microService.dbms,
      image: DockerService.getDockerImageName(
        this.dockerOrganization,
        microService.name,
        version
      ),
      deploymentBaseName: microService.deploymentBaseName,
      ingressPath: microService.ingressPath,
      healthCheckPath: microService.healthCheckPath,
      roles: microService.roles,
      permissions: microService.permissions,
      securityLevel: microService.securityLevel,
      environmentVariables: microService.env
    }
    const filePath = path.join(
      ...DESCRIPTORS_OUTPUT_FOLDER,
      this.getMicroServiceDescriptorRelativePath(microService)
    )
    this.writeYamlFile(filePath, pluginDescriptor)
  }

  private generateBundleYamlDescriptor(bundleDescriptor: BundleDescriptor) {
    const yamlBundleDescriptor: YamlBundleDescriptor = {
      code: bundleDescriptor.name,
      description: bundleDescriptor.description,
      components: {
        plugins: [],
        widgets: []
      }
    }
    for (const microFrontend of bundleDescriptor.microfrontends) {
      const mfeDescriptorPath =
        this.getMicroFrontendDescriptorRelativePath(microFrontend)
      yamlBundleDescriptor.components.widgets.push(mfeDescriptorPath)
    }

    for (const microService of bundleDescriptor.microservices) {
      const msDescriptorPath =
        this.getMicroServiceDescriptorRelativePath(microService)
      yamlBundleDescriptor.components.plugins.push(msDescriptorPath)
    }

    const filePath = path.join(
      ...DESCRIPTORS_OUTPUT_FOLDER,
      BUNDLE_DESCRIPTOR_NAME
    )
    this.writeYamlFile(filePath, yamlBundleDescriptor)
  }

  private getMicroFrontendDescriptorRelativePath(microFrontend: MicroFrontend) {
    return path.posix.join(
      WIDGETS_DESCRIPTORS_FOLDER,
      microFrontend.name + DESCRIPTOR_EXTENSION
    )
  }

  private getMicroServiceDescriptorRelativePath(microService: MicroService) {
    return path.posix.join(
      PLUGINS_DESCRIPTORS_FOLDER,
      microService.name + DESCRIPTOR_EXTENSION
    )
  }

  private writeYamlFile(filePath: string, content: any) {
    filePath = path.resolve(this.bundleDirectory, filePath)
    const parentDir = path.dirname(filePath)
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true })
    }

    const yamlData = YAML.stringify(content)
    fs.writeFileSync(filePath, yamlData)
  }
}
