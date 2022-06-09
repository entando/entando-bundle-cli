import { CliUx, Command } from '@oclif/core'
import { BundleService } from '../../services/bundle-service'
import { SvcService } from '../../services/svc-service'

export default class Disable extends Command {
  static description = 'Disable auxiliary services'

  static examples = ['<%= config.bin %> <%= command.id %> external-service']

  static args = [
    {
      name: 'serviceName',
      description: 'Name of an available service',
      required: true
    }
  ]

  static flags = {}

  public async run(): Promise<void> {
    BundleService.isValidBundleProject()

    const { args } = await this.parse(Disable)

    const svcService: SvcService = new SvcService(
      process.cwd(),
      this.config.bin
    )

    CliUx.ux.action.start(`Disabling service ${args.serviceName}`)
    svcService.disableService(args.serviceName)
    CliUx.ux.action.stop()
  }
}
