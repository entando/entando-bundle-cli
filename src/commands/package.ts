import { CliUx, Command, Flags } from '@oclif/core'
import { BundleService } from '../services/bundle-service'
import ConfigService, {
  DOCKER_ORGANIZATION_PROPERTY
} from '../services/config-service'

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
    })
  }

  configService = new ConfigService()

  public async run(): Promise<void> {
    BundleService.verifyBundleInitialized(process.cwd())
    const { flags } = await this.parse(Package)
    await this.getDockerOrganization(flags.org)
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
