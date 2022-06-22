import {
  ApiClaim,
  ApiType,
  BundleDescriptor,
  DBMS,
  ExternalApiClaim,
  MicroFrontend,
  Microservice
} from '../models/bundle-descriptor'
import {
  YamlBundleDescriptor,
  YamlExternalApiClaim,
  YamlInternalApiClaim,
  YamlPluginDescriptor,
  YamlWidgetDescriptor
} from '../models/yaml-bundle-descriptor'
import { BundleDescriptorService } from './bundle-descriptor-service'
import * as YAML from 'yaml'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as crypto from 'node:crypto'
import {
  DESCRIPTORS_OUTPUT_FOLDER,
  DESCRIPTOR_EXTENSION,
  PLUGINS_FOLDER,
  WIDGETS_FOLDER
} from '../paths'
import { ComponentService } from './component-service'
import { ComponentType } from '../models/component'
import { DockerService } from './docker-service'
import { BundleThumbnailInfo } from './bundle-thumbnail-service'

const PLUGIN_DESCRIPTOR_VERSION = 'v5'
const WIDGET_DESCRIPTOR_VERSION = 'v5'
const BUNDLE_DESCRIPTOR_VERSION = 'v5'
const BUNDLE_DESCRIPTOR_NAME = 'descriptor' + DESCRIPTOR_EXTENSION
export class BundleDescriptorConverterService {
  private readonly bundleDirectory: string
  private readonly bundleDescriptorService: BundleDescriptorService
  private readonly componentService: ComponentService
  private readonly dockerOrganization: string

  constructor(dockerOrganization: string) {
    this.bundleDirectory = process.cwd()
    this.bundleDescriptorService = new BundleDescriptorService()
    this.componentService = new ComponentService()
    this.dockerOrganization = dockerOrganization
  }

  public generateYamlDescriptors(thumbnail?: BundleThumbnailInfo): void {
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

    this.generateBundleYamlDescriptor(bundleDescriptor, thumbnail)
  }

  private generateMicroFrontendYamlDescriptor(microFrontend: MicroFrontend) {
    const widgetDescriptor: YamlWidgetDescriptor = {
      name: microFrontend.name,
      ...('titles' in microFrontend && { titles: microFrontend.titles }),
      group: microFrontend.group,
      descriptorVersion: WIDGET_DESCRIPTOR_VERSION,
      apiClaims: microFrontend.apiClaims
        ? this.generateYamlApiClaims(microFrontend.apiClaims)
        : undefined,
      nav: microFrontend.nav,
      type: microFrontend.type,
      customElement: microFrontend.customElement,
      ...('slot' in microFrontend && { slot: microFrontend.slot }),
      ...('paths' in microFrontend && { paths: microFrontend.paths }),
      ...('configMfe' in microFrontend && {
        configMfe: microFrontend.configMfe
      }),
      ...('contextParams' in microFrontend && {
        contextParams: microFrontend.contextParams
      })
    }
    const filePath = path.join(
      ...DESCRIPTORS_OUTPUT_FOLDER,
      this.getMicroFrontendDescriptorRelativePath(microFrontend)
    )
    this.writeYamlFile(filePath, widgetDescriptor)
  }

  private generateYamlApiClaims(
    apiClaims: Array<ApiClaim | ExternalApiClaim>
  ): Array<YamlInternalApiClaim | YamlExternalApiClaim> {
    const yamlApiClaims: Array<YamlInternalApiClaim | YamlExternalApiClaim> = []
    for (const apiClaim of apiClaims) {
      if (apiClaim.type === ApiType.External) {
        yamlApiClaims.push({
          type: ApiType.External,
          name: apiClaim.name,
          pluginName: apiClaim.serviceName,
          bundleId: this.generateBundleId((apiClaim as ExternalApiClaim).bundle)
        })
      } else {
        yamlApiClaims.push({
          type: ApiType.Internal,
          name: apiClaim.name,
          pluginName: apiClaim.serviceName
        })
      }
    }

    return yamlApiClaims
  }

  private generateBundleId(bundle: string): string {
    const sha256 = crypto.createHash('sha256').update(bundle).digest('hex')
    return sha256.slice(0, 8)
  }

  private generateMicroserviceYamlDescriptor(
    microservice: Microservice,
    version: string
  ) {
    const pluginDescriptor: YamlPluginDescriptor = {
      name: microservice.name,
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

  private generateBundleYamlDescriptor(
    bundleDescriptor: BundleDescriptor,
    thumbnail?: BundleThumbnailInfo
  ) {
    const yamlBundleDescriptor: YamlBundleDescriptor = {
      name: bundleDescriptor.name,
      description: bundleDescriptor.description,
      components: {
        plugins: [],
        widgets: []
      },
      global: bundleDescriptor.global,
      descriptorVersion: BUNDLE_DESCRIPTOR_VERSION
    }
    if (thumbnail?.base64 !== '') {
      yamlBundleDescriptor.thumbnail = thumbnail?.base64
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
