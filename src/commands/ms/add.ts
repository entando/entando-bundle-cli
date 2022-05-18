import { CliUx, Command, Flags } from '@oclif/core'
import { MicroService } from '../../models/bundle-descriptor'
import { BundleService } from '../../services/bundle-service'
import { MicroServiceService } from '../../services/microservice-service'

enum Stack {
  SpringBoot = 'spring-boot',
  Node = 'node'
}

export default class Add extends Command {
  static description = 'Adds a Micro Service component to the bundle'

  static examples = [
    '<%= config.bin %> <%= command.id %> my-ms',
    '<%= config.bin %> <%= command.id %> my-ms --stack spring-boot'
  ]

  static flags = {
    stack: Flags.string({
      description: 'Micro Service stack',
      options: [Stack.SpringBoot, Stack.Node],
      default: Stack.SpringBoot
    })
  }

  static args = [
    {
      name: 'name',
      description: 'Name of the Micro Service component',
      required: true
    }
  ]

  public async run(): Promise<void> {
    BundleService.verifyBundleInitialized(process.cwd())

    const { args, flags } = await this.parse(Add)

    const microService: MicroService = <MicroService>{
      name: args.name,
      stack: flags.stack
    }
    const microServiceService: MicroServiceService = new MicroServiceService()

    CliUx.ux.action.start(`Adding a new Micro Service ${args.name}`)
    microServiceService.addMicroService(microService)
    CliUx.ux.action.stop()
  }
}
