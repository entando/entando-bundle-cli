import { CliUx, Flags } from '@oclif/core'
import { BundleService } from '../../services/bundle-service'
import { SvcService } from '../../services/svc-service'
import { SvcProcessResult, ServiceTypes } from './svc-process-result'

export default class Restart extends SvcProcessResult {
  static strict = false
  static description = 'Restart running auxiliary services'

  static examples = [
    '<%= config.bin %> <%= command.id %> --all',
    '<%= config.bin %> <%= command.id %> ext-service',
    '<%= config.bin %> <%= command.id %> ext-service1 ext-service2'
  ]

  static usage = '<%= command.id %> [service...] [--all]'

  static flags = {
    all: Flags.boolean({
      description: 'Restarts all enabled services in the bundle descriptor'
    })
  }

  public async run(): Promise<void> {
    BundleService.isValidBundleProject()

    const { argv, flags } = await this.parse(Restart)

    const svcService: SvcService = new SvcService(this.config.bin)

    if (!flags.all && argv.length === 0) {
      this.error(
        'At least one service name is required. You can also use `--all` flag to restart all enabled services',
        { exit: 1 }
      )
    }

    const services = flags.all ? svcService.getEnabledServices() : argv
    const actionStartMsg = flags.all
      ? `Restarting all enabled services: (${services.join(', ')})`
      : `Restarting services: ${services.join(', ')}`

    CliUx.ux.action.start(actionStartMsg)
    const result = await svcService.restartServices(services)
    this.checkResult(result, ServiceTypes.RESTART, services)
    CliUx.ux.action.stop()
  }
}
