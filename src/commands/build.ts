import { CliUx, Command } from '@oclif/core'
import { BuildService } from '../services/build-service'

export default class Build extends Command {
  static description = 'Build the component'

  static examples = ['<%= config.bin %> <%= command.id %> my-component']

  static args = [
    {
      name: 'name',
      description: 'The name of the component to build',
      required: true
    }
  ]

  public async run(): Promise<void> {
    const { args } = await this.parse(Build)
    CliUx.ux.action.start(`Building Component ${args.name}`)
    await BuildService.build(args.name)
    CliUx.ux.action.stop()
  }
}
