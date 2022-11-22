import { CliUx, Command, Flags } from '@oclif/core'
import { BundleService } from '../../services/bundle-service'
import { SvcService } from '../../services/svc-service'

export default class Disable extends Command {
  static description = 'Disable auxiliary services'

  static examples = [
    '<%= config.bin %> <%= command.id %> external-service',
    '<%= config.bin %> <%= command.id %> external-service --remove',
    '<%= config.bin %> <%= command.id %> external-service --no-remove'
  ]

  static args = [
    {
      name: 'serviceName',
      description: 'Name of an available service',
      required: true
    }
  ]

  static flags = {
    remove: Flags.boolean({
      char: 'r',
      description: 'Remove service configuration and data in svc folder',
      allowNo: true
    })
  }

  public async run(): Promise<void> {
    BundleService.isValidBundleProject()

    const { args, flags } = await this.parse(Disable)

    let remove = flags.remove
    if (remove === undefined) {
      remove = await CliUx.ux.confirm(
        'Do you want to remove service configuration and data in svc folder? [y/n]'
      )
    }

    CliUx.ux.action.start(`Disabling service ${args.serviceName}`)
    const svcService: SvcService = new SvcService(this.config.bin)
    await svcService.disableService(args.serviceName, remove)
    CliUx.ux.action.stop()
  }
}
