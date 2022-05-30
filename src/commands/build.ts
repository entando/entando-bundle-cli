import { CliUx } from '@oclif/core'
import { BundleService } from '../services/bundle-service'
import { ComponentService } from '../services/component-service'
import { BaseBuildCommand } from './base-build'

export default class Build extends BaseBuildCommand {
  static description = 'Build bundle components'

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
    const result = await componentService.build(args.name)
    if (result !== 0) {
      if (typeof result === 'number') {
        this.error(`Build failed, exit with code ${result}`, {
          exit: result as number
        })
      } else {
        this.error(
          `Build failed, exit with code 1 and message ${this.getErrorMessage(
            result
          )}`,
          { exit: 1 }
        )
      }
    }

    CliUx.ux.action.stop()
  }
}
