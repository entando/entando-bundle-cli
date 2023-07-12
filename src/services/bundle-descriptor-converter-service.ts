import {
  ApiClaim,
  ApiType,
  BundleDescriptor,
  DBMS,
  EnvironmentVariable,
  ExternalApiClaim,
  MicroFrontend,
  MicroFrontendType,
  Microservice,
  SecretEnvironmentVariable
} from '../models/bundle-descriptor'
import {
  BaseYamlWidgetDescriptor,
  SupportedComponents,
  YamlAppBuilderWidgetDescriptor,
  YamlBundleDescriptor,
  YamlEnvironmentVariable,
  YamlExternalApiClaim,
  YamlInternalApiClaim,
  YamlPluginDescriptor,
  YamlSecretEnvironmentVariable,
  YamlWidgetConfigDescriptor,
  YamlWidgetDescriptor
} from '../models/yaml-bundle-descriptor'
import { BundleDescriptorService } from './bundle-descriptor-service'
import * as YAML from 'yaml'
import * as fs from 'node:fs'
import * as path from 'node:path'
import {
  BUNDLE_DESCRIPTOR_NAME,
  CUSTOM_WIDGET_TEMPLATE_EXTENSION,
  DESCRIPTORS_OUTPUT_FOLDER,
  DESCRIPTOR_EXTENSION,
  MICROFRONTENDS_FOLDER,
  PLUGINS_FOLDER,
  WIDGETS_FOLDER
} from '../paths'
import { ComponentService } from './component-service'
import { ComponentType } from '../models/component'
import { DockerService } from './docker-service'
import { BundleThumbnailInfo } from './bundle-thumbnail-service'
import { BundleService } from './bundle-service'
import { PSCDescriptors } from './psc-service'
import { CLIError } from '@oclif/errors'

const PLUGIN_DESCRIPTOR_VERSION = 'v5'
const WIDGET_DESCRIPTOR_VERSION = 'v5'
export const BUNDLE_DESCRIPTOR_VERSION = 'v5'
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

  public generateYamlDescriptors(
    pscDescriptors: PSCDescriptors,
    thumbnail?: BundleThumbnailInfo
  ): void {
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

    this.generateBundleYamlDescriptor(
      bundleDescriptor,
      pscDescriptors,
      thumbnail
    )
  }

  private generateMicroFrontendYamlDescriptor(microFrontend: MicroFrontend) {
    const customUiFile = path.resolve(
      MICROFRONTENDS_FOLDER,
      microFrontend.name,
      `${microFrontend.name}${CUSTOM_WIDGET_TEMPLATE_EXTENSION}`
    )
    const customUiFileExists = fs.existsSync(customUiFile)

    const widgetDescriptor:
      | YamlWidgetDescriptor
      | YamlWidgetConfigDescriptor
      | YamlAppBuilderWidgetDescriptor = this.mapMicroFrontendToYamlDescriptor(
      microFrontend,
      customUiFileExists
    )

    if (customUiFileExists) {
      console.info(
        `Custom widget template FTL found for MFE ${microFrontend.name}, including it`
      )

      fs.copyFileSync(
        customUiFile,
        path.resolve(
          ...DESCRIPTORS_OUTPUT_FOLDER,
          WIDGETS_FOLDER,
          path.basename(customUiFile)
        )
      )
    }

    const filePath = path.join(
      ...DESCRIPTORS_OUTPUT_FOLDER,
      this.getMicroFrontendDescriptorRelativePath(microFrontend)
    )

    if (fs.existsSync(filePath)) {
      throw new CLIError(
        `Widget descriptor ${path.basename(
          filePath
        )} already exists. Have you added a widget descriptor in the platform folder with the same name of a microfrontend?`
      )
    }

    this.writeYamlFile(filePath, widgetDescriptor)
  }

  private mapMicroFrontendToYamlDescriptor(
    microFrontend: MicroFrontend,
    customUiFileExists: boolean
  ):
    | YamlWidgetDescriptor
    | YamlWidgetConfigDescriptor
    | YamlAppBuilderWidgetDescriptor {
    const commonProperties: BaseYamlWidgetDescriptor<
      typeof microFrontend.type
    > = {
      name: microFrontend.name,
      type: microFrontend.type,
      ...('titles' in microFrontend && { titles: microFrontend.titles }),
      group: microFrontend.group,
      descriptorVersion: WIDGET_DESCRIPTOR_VERSION,
      ...(microFrontend.customElement
        ? { customElement: microFrontend.customElement }
        : {}),
      apiClaims: microFrontend.apiClaims
        ? this.generateYamlApiClaims(microFrontend.apiClaims)
        : undefined,
      ...(customUiFileExists
        ? {
            customUiPath: `${microFrontend.name}${CUSTOM_WIDGET_TEMPLATE_EXTENSION}`
          }
        : {}),
      parentName: microFrontend.parentName,
      parentCode: microFrontend.parentCode,
      params: microFrontend.params || [],
      paramsDefaults: microFrontend.paramsDefaults
    }

    let result:
      | YamlWidgetDescriptor
      | YamlWidgetConfigDescriptor
      | YamlAppBuilderWidgetDescriptor

    if (microFrontend.type === MicroFrontendType.AppBuilder) {
      result = {
        ...(commonProperties as BaseYamlWidgetDescriptor<MicroFrontendType.AppBuilder>),
        ext: {
          appBuilder: {
            slot: microFrontend.slot,
            nav: microFrontend.nav,
            ...('paths' in microFrontend && { paths: microFrontend.paths })
          }
        }
      }
    } else if (microFrontend.type === MicroFrontendType.WidgetConfig) {
      result = {
        ...(commonProperties as BaseYamlWidgetDescriptor<MicroFrontendType.WidgetConfig>),
        nav: microFrontend.nav
      }
    } else {
      result = {
        ...(commonProperties as BaseYamlWidgetDescriptor<MicroFrontendType.Widget>),
        titles: microFrontend.titles,
        nav: microFrontend.nav,
        configMfe: microFrontend.configMfe,
        contextParams: microFrontend.contextParams,
        widgetCategory: microFrontend.category
      }
    }

    return result
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
          bundleId: BundleService.generateBundleId(
            (apiClaim as ExternalApiClaim).bundle
          )
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
      environmentVariables: this.generateYamlEnvVar(microservice.env)
    }
    const filePath = path.join(
      ...DESCRIPTORS_OUTPUT_FOLDER,
      this.getMicroserviceDescriptorRelativePath(microservice)
    )
    this.writeYamlFile(filePath, pluginDescriptor)
  }

  private isSecretEnvironmentVariable(
    env: EnvironmentVariable
  ): env is SecretEnvironmentVariable {
    return (env as SecretEnvironmentVariable).secretKeyRef !== undefined
  }

  private generateYamlEnvVar(envVars: EnvironmentVariable[] | undefined) {
    if (envVars === undefined) return envVars
    const yamlEnvVars: YamlEnvironmentVariable[] = []
    for (const envVar of envVars) {
      if (this.isSecretEnvironmentVariable(envVar)) {
        const secretEnvVar: YamlSecretEnvironmentVariable = {
          name: envVar.name,
          valueFrom: {
            secretKeyRef: {
              name: envVar.secretKeyRef.name,
              key: envVar.secretKeyRef.key
            }
          }
        }
        yamlEnvVars.push(secretEnvVar)
      } else {
        yamlEnvVars.push(envVar)
      }
    }

    return yamlEnvVars
  }

  private generateBundleYamlDescriptor(
    bundleDescriptor: BundleDescriptor,
    pscDescriptors: PSCDescriptors,
    thumbnail?: BundleThumbnailInfo
  ) {
    const yamlBundleDescriptor: YamlBundleDescriptor = {
      name: bundleDescriptor.name,
      description: bundleDescriptor.description,
      components: {},
      ext: bundleDescriptor.global,
      descriptorVersion: BUNDLE_DESCRIPTOR_VERSION
    }
    if (thumbnail?.base64) {
      yamlBundleDescriptor.thumbnail = thumbnail.base64
    }

    for (const microFrontend of bundleDescriptor.microfrontends) {
      const mfeDescriptorPath =
        this.getMicroFrontendDescriptorRelativePath(microFrontend)
      this.addDescriptor(yamlBundleDescriptor, 'widgets', mfeDescriptorPath)
    }

    for (const microservice of bundleDescriptor.microservices) {
      const msDescriptorPath =
        this.getMicroserviceDescriptorRelativePath(microservice)
      this.addDescriptor(yamlBundleDescriptor, 'plugins', msDescriptorPath)
    }

    for (const [key, values] of Object.entries(pscDescriptors)) {
      for (const value of values) {
        this.addDescriptor(
          yamlBundleDescriptor,
          key as SupportedComponents,
          value
        )
      }
    }

    const filePath = path.join(
      ...DESCRIPTORS_OUTPUT_FOLDER,
      BUNDLE_DESCRIPTOR_NAME
    )
    this.writeYamlFile(filePath, yamlBundleDescriptor)
  }

  private addDescriptor(
    yamlBundleDescriptor: YamlBundleDescriptor,
    componentType: SupportedComponents,
    descriptorPath: string
  ) {
    const descriptors = yamlBundleDescriptor.components[componentType] || []
    descriptors.push(descriptorPath)
    yamlBundleDescriptor.components[componentType] = descriptors
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
