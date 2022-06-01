import { CliUx, Command, Flags } from '@oclif/core'
import { BundleService } from '../../services/bundle-service'
import { SvcService } from '../../services/svc-service'

export default class List extends Command {
  static description = 'List auxiliary services'

  static examples = ['<%= config.bin %> <%= command.id %>']

  static args = []

  static flags = {
    available: Flags.boolean({ description: 'List all available services' })
  }

  public async run(): Promise<void> {
    BundleService.verifyBundleInitialized(process.cwd())

    const { flags } = await this.parse(List)

    const svcService: SvcService = new SvcService(process.cwd())
    const services: string[] = flags.available
      ? svcService.getAvailableServices()
      : svcService.getActiveServices()
    const serviceData = services.map(service => ({ service }))

    const columns = {
      service: {
        header: flags.available ? 'Available Services' : 'Active Services'
      }
    }

    CliUx.ux.table(serviceData, columns)
  }
}
