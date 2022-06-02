import { CliUx, Command } from '@oclif/core'
import { BundleService } from '../../services/bundle-service'
import { SvcService } from '../../services/svc-service'

export default class Start extends Command {
  static strict = false
  static description = 'Start enabled auxiliary services'

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> ext-service',
    '<%= config.bin %> <%= command.id %> ext-service1 ext-service2'
  ]

  public async run(): Promise<void> {
    BundleService.verifyBundleInitialized(process.cwd())

    const { argv } = await this.parse(Start)

    const svcService: SvcService = new SvcService(process.cwd())

    CliUx.ux.action.start(`Enabling service ${argv.length > 0 ? argv.join(', ') : svcService.getActiveServices().join(', ')}`)
    svcService.startServices(argv)
    CliUx.ux.action.stop()
  }
}
