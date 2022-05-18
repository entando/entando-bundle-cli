import { CliUx, Command, Flags } from '@oclif/core'
import { BundleService } from '../services/bundle-service'
import ConfigService, {
  DOCKER_ORGANIZATION_PROPERTY
} from '../services/config-service'

export default class Package extends Command {
  static description = 'Generates the Docker image for the bundle'

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --organization=my-org'
  ]

  static flags = {
    organization: Flags.string({
      char: 'o',
      description: 'Docker organization name'
    })
  }

  configService = new ConfigService()

  public async run(): Promise<void> {
    BundleService.verifyBundleInitialized(process.cwd())
    const { flags } = await this.parse(Package)
    await this.getDockerOrganization(flags.organization)
  }

  private async getDockerOrganization(flagOrganization: string | undefined) {
    if (flagOrganization) {
      return flagOrganization
    }

    const configuredOrganization = this.configService.getProperty(
      DOCKER_ORGANIZATION_PROPERTY
    )
    if (!configuredOrganization) {
      const newOrganization: string = await CliUx.ux.prompt(
        'Enter Docker organization'
      )
      this.configService.addProperty(
        DOCKER_ORGANIZATION_PROPERTY,
        newOrganization
      )
      return newOrganization
    }

    return configuredOrganization
  }
}
