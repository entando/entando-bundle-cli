import { CliUx, Command } from '@oclif/core'
import {
  ComponentType,
  StackFor,
  VersionedComponent
} from '../models/component'
import { BundleDescriptorService } from '../services/bundle-descriptor-service'
import { BundleService } from '../services/bundle-service'
import { ComponentService } from '../services/component-service'
import {
  ConfigService,
  DOCKER_ORGANIZATION_PROPERTY,
  DOCKER_REGISTRY_PROPERTY
} from '../services/config-service'
import { DockerService } from '../services/docker-service'

type Image = Pick<VersionedComponent, 'name' | 'version'> &
  (
    | {
        type: 'bundle'
        stack: '-'
      }
    | {
        type: ComponentType.MICROSERVICE
        stack: StackFor<ComponentType.MICROSERVICE>
      }
  )

export default class Images extends Command {
  static description =
    'List the Docker images and their corresponding tags that are included in the bundle, taking into account organization and registry previously set using the "pack" command.'

  private configuredOrganization: string | undefined
  private configuredRegistry: string | undefined

  public async run(): Promise<void> {
    BundleService.isValidBundleProject()

    const bundleDescriptorService = new BundleDescriptorService()
    const componentService = new ComponentService()
    const configService = new ConfigService()

    const bundleDescriptor = bundleDescriptorService.getBundleDescriptor()

    const microservices = componentService.getVersionedComponents(
      ComponentType.MICROSERVICE
    )
    this.configuredOrganization = configService.getProperty(
      DOCKER_ORGANIZATION_PROPERTY
    )
    this.configuredRegistry = configService.getProperty(
      DOCKER_REGISTRY_PROPERTY
    )

    const images: Image[] = microservices.map(m => {
      return {
        name: this.getImageName(m.name),
        version: m.version,
        type: ComponentType.MICROSERVICE,
        stack: m.stack
      } as Image
    })

    images.unshift({
      name: this.getImageName(bundleDescriptor.name),
      version: bundleDescriptor.version,
      type: 'bundle',
      stack: '-'
    })

    const header: Array<keyof Image> = ['name', 'version', 'type', 'stack']
    const columnMap = header.map(k => [[k], { header: k.toUpperCase() }])
    const columns = Object.fromEntries(columnMap)

    CliUx.ux.table(images, columns)
  }

  private getImageName(componentName: string): string {
    if (this.configuredOrganization) {
      const registry =
        this.configuredRegistry ?? DockerService.getDefaultDockerRegistry()
      return `${registry}/${this.configuredOrganization}/${componentName}`
    }

    return componentName
  }
}
