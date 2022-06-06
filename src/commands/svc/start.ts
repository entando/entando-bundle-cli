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
      description: 'Starts all enabled services listed in entando.json'
    })
  }

  public async run(): Promise<void> {
    BundleService.verifyBundleInitialized(process.cwd())

    const { argv, flags } = await this.parse(Start)

    const svcService: SvcService = new SvcService(process.cwd())

    if (flags.all) {
      CliUx.ux.action.start(`Starting all enabled services`)
      svcService.startServices([])
      CliUx.ux.action.stop()
    } else if (argv.length > 0) {
      CliUx.ux.action.start(`Starting services: ${argv.join(', ')}`)
      svcService.startServices(argv)
      CliUx.ux.action.stop()
    } else {
      throw new CLIError(
        'At least 1 service name is required. You can also use `--all` flag to start all enabled services'
      )
    }
  }
}
