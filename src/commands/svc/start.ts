import { CliUx, Flags } from '@oclif/core'
import { BundleService } from '../../services/bundle-service'
import { SvcService } from '../../services/svc-service'
import { SvcProcessResult, ServiceTypes } from './svc-process'

export default class Start extends SvcProcessResult {
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

    const svcService: SvcService = new SvcService(
      process.cwd(),
      this.config.bin
    )

    if (!flags.all && argv.length === 0) {
      this.error(
        'At least one service name is required. You can also use `--all` flag to start all running enabled services',
        { exit: 1 }
      )
    }

    const services = flags.all ? svcService.getEnabledServices() : argv
    const actionStartMsg = flags.all
      ? `Starting all enabled services: (${services.join(', ')})`
      : `Starting services: ${services.join(', ')}`

    CliUx.ux.action.start(actionStartMsg)
    const result = await svcService.startServices(services)
    this.checkResult(result, ServiceTypes.START, services)
    CliUx.ux.action.stop()
  }
}
