import { CliUx, Flags } from '@oclif/core'
import { BundleDescriptorConverterService } from '../services/bundle-descriptor-converter-service'
import { BundleDescriptorService } from '../services/bundle-descriptor-service'
import { BundleService } from '../services/bundle-service'
import {
  ConfigService,
  DOCKER_ORGANIZATION_PROPERTY
} from '../services/config-service'
import { DockerService } from '../services/docker-service'
import { BaseBuildCommand } from './base-build'

export default class Package extends BaseBuildCommand {
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

    const needsBuild = process.stdout.isTTY
      ? await CliUx.ux.confirm('Rebuild components?')
      : true

    if (needsBuild) {
      await this.buildAllComponents()
    }

    const dockerOrganization = await this.getDockerOrganization(flags.org)

    await this.buildBundleDockerImage(bundleDir, dockerOrganization)
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

  private async buildBundleDockerImage(
    bundleDir: string,
    dockerOrganization: string
  ) {
    const bundleDescriptorService = new BundleDescriptorService(bundleDir)
    const bundleDescriptor = bundleDescriptorService.getBundleDescriptor()

    CliUx.ux.action.start('Creating bundle package')

    const bundleDescriptorConverterService =
      new BundleDescriptorConverterService(bundleDir)
    bundleDescriptorConverterService.generateYamlDescriptors()

    const result = await DockerService.buildDockerImage({
      name: bundleDescriptor.name,
      organization: dockerOrganization,
      path: '.',
      tag: bundleDescriptor.version
    })

    if (result !== 0) {
      if (typeof result === 'number') {
        this.error(
          `Docker build failed with exit code ${result}. Enable debug mode to see docker build output`,
          { exit: false }
        )
        this.exit(result as number)
      } else {
        this.error(
          `Docker build failed with cause: ${this.getErrorMessage(result)}`
        )
      }
    }
  }
}
