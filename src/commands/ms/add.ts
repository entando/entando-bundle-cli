import { CliUx, Command, Flags } from '@oclif/core'
import { MicroService } from '../../models/bundle-descriptor'
import { BundleService } from '../../services/bundle-service'
import { MicroServiceService } from '../../services/microservice-service'

enum Stack {
  SpringBoot = 'spring-boot',
  Node = 'node'
}

export default class Add extends Command {
  static description = 'Adds a microservice component to the bundle'

  static examples = [
    '<%= config.bin %> <%= command.id %> my-ms',
    '<%= config.bin %> <%= command.id %> my-ms --stack spring-boot'
  ]

  static flags = {
    stack: Flags.string({
      description: 'Microservice stack',
      options: [Stack.SpringBoot, Stack.Node],
      default: Stack.SpringBoot
    })
  }

  static args = [
    {
      name: 'name',
      description: 'Name of the microservice component',
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

    CliUx.ux.action.start(`Adding a new microservice ${args.name}`)
    microServiceService.addMicroService(microService)
    CliUx.ux.action.stop()
  }
}
