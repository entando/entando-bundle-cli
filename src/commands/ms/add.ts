import { CliUx, Command, Flags } from '@oclif/core'
import { Microservice } from '../../models/bundle-descriptor'
import { MicroserviceStack } from '../../models/component'
import { BundleService } from '../../services/bundle-service'
import { MicroserviceService } from '../../services/microservice-service'

export default class Add extends Command {
  static description = 'Adds a microservice component to the bundle'

  static examples = [
    '<%= config.bin %> <%= command.id %> my-ms',
    '<%= config.bin %> <%= command.id %> my-ms --stack spring-boot'
  ]

  static flags = {
    stack: Flags.string({
      description: 'Microservice stack',
      options: Object.values(MicroserviceStack),
      default: MicroserviceStack.SpringBoot
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
    BundleService.isValidBundleProject(process.cwd())

    const { args, flags } = await this.parse(Add)

    const microservice: Microservice = <Microservice>{
      name: args.name,
      stack: flags.stack
    }
    const microserviceService: MicroserviceService = new MicroserviceService()

    CliUx.ux.action.start(`Adding a new microservice ${args.name}`)
    microserviceService.addMicroservice(microservice)
    CliUx.ux.action.stop()
  }
}
