import { CliUx, Command, Flags } from '@oclif/core'
import { CLIError } from '@oclif/errors'
import { BundleService } from '../../services/bundle-service'
import { SvcService } from '../../services/svc-service'

export default class Start extends Command {
  static strict = false
  static description = 'Start enabled auxiliary services'

  static examples = [
    '<%= config.bin %> <%= command.id %> --all',
    '<%= config.bin %> <%= command.id %> ext-service',
    '<%= config.bin %> <%= command.id %> ext-service1 ext-service2'
  ]

  static flags = {
    all: Flags.boolean({
      description: 'Starts all enabled services in the bundle descriptor'
    })
  }

  public async run(): Promise<void> {
    BundleService.verifyBundleInitialized(process.cwd())

    const { argv, flags } = await this.parse(Start)

    const svcService: SvcService = new SvcService(process.cwd())

    if (flags.all) {
      const enabledServices = svcService.getEnabledServices()
      CliUx.ux.action.start(
        `Starting all enabled services: ${enabledServices.join(', ')}`
      )
      svcService.startServices(enabledServices)
      CliUx.ux.action.stop()
    } else if (argv.length > 0) {
      CliUx.ux.action.start(`Starting services: ${argv.join(', ')}`)
      svcService.startServices(argv)
      CliUx.ux.action.stop()
    } else {
      throw new CLIError(
        'At least one service name is required. You can also use `--all` flag to start all enabled services'
      )
    }
  }
}
