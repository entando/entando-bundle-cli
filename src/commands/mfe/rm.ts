import { CliUx, Command } from '@oclif/core'
import { BundleService } from '../../services/bundle-service'
import { MicroFrontendService } from '../../services/microfrontend-service'

export default class Rm extends Command {
  static description = 'Removes a Micro Frontend component to the bundle'

  static examples = ['<%= config.bin %> <%= command.id %> my-mfe']

  static args = [
    {
      name: 'name',
      description: 'Name of the Micro Frontend component',
      required: true
    }
  ]

  public async run(): Promise<void> {
    BundleService.verifyBundleInitialized(process.cwd())

    const { args } = await this.parse(Rm)

    const microFrontendService: MicroFrontendService =
      new MicroFrontendService()

    CliUx.ux.action.start(`Removing Micro Frontend ${args.name}`)
    microFrontendService.removeMicroFrontend(args.name)
    CliUx.ux.action.stop()
  }
}
