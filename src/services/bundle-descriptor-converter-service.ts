import {
  BundleDescriptor,
  DBMS,
  MicroFrontend,
  Microservice
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
import {
  DESCRIPTORS_OUTPUT_FOLDER,
  DESCRIPTOR_EXTENSION,
  PLUGINS_FOLDER,
  WIDGETS_FOLDER
} from '../paths'
import { ComponentService } from './component-service'
import { ComponentType } from '../models/component'
import { DockerService } from './docker-service'

const PLUGIN_DESCRIPTOR_VERSION = 'v4'
const WIDGET_DESCRIPTOR_VERSION = 'v2'
const BUNDLE_DESCRIPTOR_VERSION = 'v2'
const BUNDLE_DESCRIPTOR_NAME = 'descriptor' + DESCRIPTOR_EXTENSION

export enum ThumbnailStatusMessage {
  NONE = '',
  FILESIZE_EXCEED = 'Thumbnail filesize is too big. Make sure the thumbnail filesize is 100 KB or below.',
  OK = 'passed',
  NO_THUMBNAIL = 'No thumbnail found. Please provide a thumbnail in PNG or JPEG format (e.g. `thumbnail.png`) and place it under the root of your bundle directory'
}

export type BundleThumbnailInfo = {
  path: string
  size: number
  status: ThumbnailStatusMessage
  base64?: string
}

export class BundleDescriptorConverterService {
  private readonly bundleDirectory: string
  private readonly bundleDescriptorService: BundleDescriptorService
  private readonly componentService: ComponentService
  private readonly dockerOrganization: string
  private thumbnail: BundleThumbnailInfo

  constructor(dockerOrganization: string) {
    this.bundleDirectory = process.cwd()
    this.bundleDescriptorService = new BundleDescriptorService()
    this.componentService = new ComponentService()
    this.dockerOrganization = dockerOrganization
    this.thumbnail = { path: '', size: 0, status: ThumbnailStatusMessage.NONE }
  }

  public generateYamlDescriptors(): void {
    const bundleDescriptor = this.bundleDescriptorService.getBundleDescriptor()

    for (const microFrontend of bundleDescriptor.microfrontends) {
      this.generateMicroFrontendYamlDescriptor(microFrontend)
    }

    const versionedMicroservices = this.componentService.getVersionedComponents(
      ComponentType.MICROSERVICE
    )

    for (const microservice of bundleDescriptor.microservices) {
      const versionedMicroservice = versionedMicroservices.find(
        ms => ms.name === microservice.name
      )!
      this.generateMicroserviceYamlDescriptor(
        microservice,
        versionedMicroservice.version
      )
    }

    this.generateBundleYamlDescriptor(bundleDescriptor)
  }

  public processThumbnail(): BundleThumbnailInfo {
    const thumbnail = this.findThumbnail()
    const thumbInfo = { path: thumbnail, size: 0 }
    if (thumbnail === '') {
      this.thumbnail = {
        ...thumbInfo,
        status: ThumbnailStatusMessage.NO_THUMBNAIL
      }
      return this.thumbnail
    }

    const stats = fs.statSync(thumbnail)
    const size = stats.size / 1024
    const base64 = Buffer.from(fs.readFileSync(thumbnail)).toString('base64')

    this.thumbnail = {
      ...thumbInfo,
      size,
      base64,
      status:
        size > 100
          ? ThumbnailStatusMessage.FILESIZE_EXCEED
          : ThumbnailStatusMessage.OK
    }

    return this.thumbnail
  }

  private findThumbnail(): string {
    for (const ext of ['png', 'jpg', 'jpeg']) {
      const thumb = path.resolve(this.bundleDirectory, `thumbnail.${ext}`)
      if (fs.existsSync(thumb)) {
        return thumb
      }
    }

    return ''
  }

  private generateMicroFrontendYamlDescriptor(microFrontend: MicroFrontend) {
    const widgetDescriptor: YamlWidgetDescriptor = {
      code: microFrontend.code ?? microFrontend.name,
      titles: microFrontend.titles,
      group: microFrontend.group,
      version: WIDGET_DESCRIPTOR_VERSION,
      apiClaims: microFrontend.apiClaims,
      nav: microFrontend.nav,
      type: microFrontend.type,
      ...('slot' in microFrontend && { slot: microFrontend.slot }),
      ...('paths' in microFrontend && { paths: microFrontend.paths })
    }
    const filePath = path.join(
      ...DESCRIPTORS_OUTPUT_FOLDER,
      this.getMicroFrontendDescriptorRelativePath(microFrontend)
    )
    this.writeYamlFile(filePath, widgetDescriptor)
  }

  private generateMicroserviceYamlDescriptor(
    microservice: Microservice,
    version: string
  ) {
    const pluginDescriptor: YamlPluginDescriptor = {
      descriptorVersion: PLUGIN_DESCRIPTOR_VERSION,
      dbms: microservice.dbms ?? DBMS.None,
      image: DockerService.getDockerImageName(
        this.dockerOrganization,
        microservice.name,
        version
      ),
      deploymentBaseName: microservice.deploymentBaseName,
      ingressPath: microservice.ingressPath,
      healthCheckPath: microservice.healthCheckPath,
      roles: microservice.roles,
      permissions: microservice.permissions,
      securityLevel: microservice.securityLevel,
      environmentVariables: microservice.env
    }
    const filePath = path.join(
      ...DESCRIPTORS_OUTPUT_FOLDER,
      this.getMicroserviceDescriptorRelativePath(microservice)
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
      },
      global: bundleDescriptor.global,
      version: BUNDLE_DESCRIPTOR_VERSION
    }
    if (this.thumbnail.path !== '') {
      yamlBundleDescriptor.thumbnail = this.thumbnail.base64
    }

    for (const microFrontend of bundleDescriptor.microfrontends) {
      const mfeDescriptorPath =
        this.getMicroFrontendDescriptorRelativePath(microFrontend)
      yamlBundleDescriptor.components.widgets.push(mfeDescriptorPath)
    }

    for (const microservice of bundleDescriptor.microservices) {
      const msDescriptorPath =
        this.getMicroserviceDescriptorRelativePath(microservice)
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
      WIDGETS_FOLDER,
      microFrontend.name + DESCRIPTOR_EXTENSION
    )
  }

  private getMicroserviceDescriptorRelativePath(microservice: Microservice) {
    return path.posix.join(
      PLUGINS_FOLDER,
      microservice.name + DESCRIPTOR_EXTENSION
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
