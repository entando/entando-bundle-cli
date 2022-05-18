import { CliUx, Command, Flags } from '@oclif/core'
import PackageService from '../services/package-service'

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

  public async run(): Promise<void> {
    const { flags } = await this.parse(Package)

    const packageService = new PackageService()

    let dockerOrganization = flags.organization
    if (!dockerOrganization) {
      dockerOrganization = await packageService.getOrInitDockerOrganization(
        () => CliUx.ux.prompt('Enter Docker organization')
      )
    }
  }
}
