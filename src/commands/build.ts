import { CliUx, Command } from '@oclif/core'
import { BundleService } from '../services/bundle-service'
import { ComponentService } from '../services/component-service'

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
    BundleService.verifyBundleInitialized(process.cwd())
    const { args } = await this.parse(Build)

    CliUx.ux.action.start(`Building component ${args.name}`)
    const componentService = new ComponentService()
    await componentService.build(args.name)
    CliUx.ux.action.stop()
  }
}
