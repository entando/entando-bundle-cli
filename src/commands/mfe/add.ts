import { CliUx, Command, Flags } from '@oclif/core'
import { MicroFrontend } from '../../models/bundle-descriptor'
import { MicroFrontendStack } from '../../models/component'
import { BundleService } from '../../services/bundle-service'
import { MicroFrontendService } from '../../services/microfrontend-service'

export default class Add extends Command {
  static description = 'Add a Micro Frontend component to the bundle'

  static examples = [
    '<%= config.bin %> <%= command.id %> my-mfe',
    '<%= config.bin %> <%= command.id %> my-mfe --stack react'
  ]

  static flags = {
    stack: Flags.string({
      description: 'Micro Frontend stack',
      options: Object.values(MicroFrontendStack),
      default: MicroFrontendStack.React
    })
  }

  static args = [
    {
      name: 'name',
      description: 'Name of the Micro Frontend component',
      required: true
    }
  ]

  public async run(): Promise<void> {
    BundleService.isValidBundleProject()

    const { args, flags } = await this.parse(Add)

    const microFrontend: MicroFrontend = <MicroFrontend>{
      name: args.name,
      stack: flags.stack
    }
    const microFrontendService: MicroFrontendService =
      new MicroFrontendService()

    CliUx.ux.action.start(`Adding a new Micro Frontend ${args.name}`)
    microFrontendService.addMicroFrontend(microFrontend)
    CliUx.ux.action.stop()
  }
}
