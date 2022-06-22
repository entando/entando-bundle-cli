import { CliUx } from '@oclif/core'
import { BundleService } from '../services/bundle-service'
import { ComponentService } from '../services/component-service'
import { BaseBuildCommand } from './base-build'

export default class Run extends BaseBuildCommand {
  static description = 'Run bundle components'

  static examples = ['<%= config.bin %> <%= command.id %> my-component']

  static args = [
    {
      name: 'name',
      description: 'The name of the component to run'
    }
  ]

  public async run(): Promise<void> {
    BundleService.isValidBundleProject()
    const { args } = await this.parse(Run)
    const componentService = new ComponentService()

    if (args.name === undefined) {
      this.error(`Run failed, missing required arg name`, { exit: 1 })
    }

    CliUx.ux.action.start(
      `Running component ${args.name}. Press ctrl + c to exit.`
    )

    const result = await componentService.run(args.name)

    if (result !== 0) {
      if (typeof result === 'number') {
        this.error(`Run failed, exit with code ${result}`, {
          exit: result as number
        })
      } else {
        this.error(
          `Run failed, exit with code 1 and message ${this.getErrorMessage(
            result
          )}`,
          { exit: 1 }
        )
      }
    }

    CliUx.ux.action.stop()
  }
}
