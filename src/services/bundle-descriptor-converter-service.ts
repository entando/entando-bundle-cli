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

const DESCRIPTOR_VERSION = 'v4'
const DESCRIPTOR_EXTENSION = '.yaml'
const BUNDLE_DESCRIPTOR_NAME = 'descriptor' + DESCRIPTOR_EXTENSION
const WIDGETS_DESCRIPTORS_FOLDER = 'widgets'
const PLUGINS_DESCRIPTORS_FOLDER = 'plugins'

export default class BundleDescriptorConverterService {
  private readonly bundleDirectory: string
  private readonly bundleDescriptorService: BundleDescriptorService

  constructor(bundleDirectory: string) {
    this.bundleDirectory = bundleDirectory
    this.bundleDescriptorService = new BundleDescriptorService(bundleDirectory)
  }

  public generateYamlDescriptors(): void {
    const bundleDescriptor = this.bundleDescriptorService.getBundleDescriptor()

    for (const microFrontend of bundleDescriptor.microfrontends) {
      this.generateMicroFrontendYamlDescriptor(microFrontend)
    }

    for (const microService of bundleDescriptor.microservices) {
      this.generateMicroServiceYamlDescriptor(microService)
    }

    this.generateBundleYamlDescriptor(bundleDescriptor)
  }

  private generateMicroFrontendYamlDescriptor(microFrontend: MicroFrontend) {
    const widgetDescriptor: YamlWidgetDescriptor = {
      code: microFrontend.code,
      titles: microFrontend.titles,
      group: microFrontend.group,
      customUiPath: microFrontend.customUiPath,
      configUi: microFrontend.configUi
    }
    const filePath = path.join(
      DESCRIPTORS_OUTPUT_FOLDER,
      this.getMicroFrontendDescriptorRelativePath(microFrontend)
    )
    this.writeYamlFile(filePath, widgetDescriptor)
  }

  private generateMicroServiceYamlDescriptor(microService: MicroService) {
    const pluginDescriptor: YamlPluginDescriptor = {
      descriptorVersion: DESCRIPTOR_VERSION,
      dbms: microService.dbms,
      image: microService.image,
      deploymentBaseName: microService.deploymentBaseName,
      ingressPath: microService.ingressPath,
      healthCheckPath: microService.healthCheckPath,
      roles: microService.roles,
      permissions: microService.permissions,
      securityLevel: microService.securityLevel,
      environmentVariables: microService.env
    }
    const filePath = path.join(
      DESCRIPTORS_OUTPUT_FOLDER,
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
      DESCRIPTORS_OUTPUT_FOLDER,
      BUNDLE_DESCRIPTOR_NAME
    )
    this.writeYamlFile(filePath, yamlBundleDescriptor)
  }

  private getMicroFrontendDescriptorRelativePath(microFrontend: MicroFrontend) {
    return path.posix.join(
      WIDGETS_DESCRIPTORS_FOLDER,
      microFrontend.name,
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
