import { CliUx, Command, Flags } from '@oclif/core'
import { BundleDescriptorConverterService } from '../services/bundle-descriptor-converter-service'
import { BundleDescriptorService } from '../services/bundle-descriptor-service'
import { BundleService } from '../services/bundle-service'
import {
  ConfigService,
  DOCKER_ORGANIZATION_PROPERTY
} from '../services/config-service'
import { DockerService } from '../services/docker-service'

export default class Package extends Command {
  static description = 'Generates the bundle Docker image'

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --org=my-org'
  ]

  static flags = {
    org: Flags.string({
      char: 'o',
      description: 'Docker organization name'
    }),
    file: Flags.string({
      char: 'f',
      description: 'Name of the Dockerfile (default is Dockerfile)',
      required: false
    })
  }

  configService = new ConfigService()

  public async run(): Promise<void> {
    const bundleDir = process.cwd()
    BundleService.verifyBundleInitialized(bundleDir)

    const { flags } = await this.parse(Package)

    const dockerOrganization = await this.getDockerOrganization(flags.org)

    CliUx.ux.action.start('Creating bundle package')

    // TODO: build all components

    const bundleDescriptorService = new BundleDescriptorService(bundleDir)
    const bundleDescriptor = bundleDescriptorService.getBundleDescriptor()

    const bundleDescriptorConverterService =
      new BundleDescriptorConverterService(bundleDir)
    bundleDescriptorConverterService.generateYamlDescriptors()

    DockerService.buildDockerImage({
      name: bundleDescriptor.name,
      organization: dockerOrganization,
      path: '.',
      tag: bundleDescriptor.version
    })

    CliUx.ux.action.stop()
  }

  private async getDockerOrganization(flagOrganization: string | undefined) {
    const configuredOrganization = this.configService.getProperty(
      DOCKER_ORGANIZATION_PROPERTY
    )

    if (flagOrganization) {
      this.configService.addOrUpdateProperty(
        DOCKER_ORGANIZATION_PROPERTY,
        flagOrganization
      )
      return flagOrganization
    }

    if (configuredOrganization) {
      return configuredOrganization
    }

    const newOrganization: string = await CliUx.ux.prompt(
      'Enter Docker organization'
    )
    this.configService.addProperty(
      DOCKER_ORGANIZATION_PROPERTY,
      newOrganization
    )
    return newOrganization
  }
}
