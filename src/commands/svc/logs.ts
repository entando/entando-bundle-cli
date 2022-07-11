import { CliUx, Flags } from '@oclif/core'
import { BundleService } from '../../services/bundle-service'
import { SvcService } from '../../services/svc-service'
import { SvcProcessResult, ServiceTypes } from './svc-process-result'

export default class Logs extends SvcProcessResult {
  static strict = false
  static description = 'Display running auxiliary services logs'

  static examples = [
    '<%= config.bin %> <%= command.id %> --all',
    '<%= config.bin %> <%= command.id %> ext-service',
    '<%= config.bin %> <%= command.id %> ext-service1 ext-service2'
  ]

  static usage = 'svc logs [service...] [--all]'

  static flags = {
    all: Flags.boolean({
      description:
        'Display logs of all enabled services in the bundle descriptor'
    })
  }

  public async run(): Promise<void> {
    BundleService.isValidBundleProject()

    const { argv, flags } = await this.parse(Logs)

    const svcService: SvcService = new SvcService(this.config.bin)

    if (!flags.all && argv.length === 0) {
      this.error(
        'At least one service name is required. You can also use `--all` flag to display logs of all enabled services',
        { exit: 1 }
      )
    }

    const services = flags.all ? svcService.getEnabledServices() : argv
    const actionStartMsg = flags.all
      ? `Displaying logs of all enabled services: (${services.join(', ')})`
      : `Display logs of services: ${services.join(', ')}`

    CliUx.ux.action.start(`${actionStartMsg}. Press ctrl + c to exit.`)
    const result = await svcService.logServices(services)
    this.checkResult(result, ServiceTypes.LOGS, services)
    CliUx.ux.action.stop()
  }
}
