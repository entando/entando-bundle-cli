import { CliUx, Command, Flags } from '@oclif/core'
import { BundleService } from '../../services/bundle-service'
import { SvcService } from '../../services/svc-service'
import { color } from '@oclif/color'

export default class List extends Command {
  static description = 'List auxiliary services'

  static examples = ['<%= config.bin %> <%= command.id %>']

  static args = []

  static flags = {
    available: Flags.boolean({ description: 'List all available services' })
  }

  public async run(): Promise<void> {
    BundleService.isValidBundleProject(process.cwd())

    const { flags } = await this.parse(List)

    const svcService: SvcService = new SvcService(process.cwd())
    const services: string[] = flags.available
      ? svcService.getAvailableServices()
      : svcService.getEnabledServices()
    const serviceData = services.map(service => ({ service }))

    const columns = {
      service: {
        header: flags.available
          ? '\n Available Services'
          : '\n Enabled Services'
      }
    }
    CliUx.ux.table(serviceData, columns)
    if (flags.available) {
      this.log(
        color.bold.blue(
          '\nHint: you can add an auxiliary service by just dropping a Docker Compose file in the svc folder (e.g. svc/my-service.yml)\n'
        )
      )
    }
  }
}
