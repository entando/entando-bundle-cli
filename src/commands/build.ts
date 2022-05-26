import { CliUx, Command } from '@oclif/core'
import { BundleService } from '../services/bundle-service'
import { ComponentService } from '../services/component-service'
import { ExecutionError } from '../services/process-executor-service'

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
    try {
      await componentService.build(args.name)
    } catch (error) {
      if (error instanceof ExecutionError) {
        if (typeof error.executionResult === 'number') {
          console.error(`Build failed, exit with code ${error.executionResult}`)
          this.exit(error.executionResult as number)
        } else {
          console.error(
            `Build failed, exit with code 1 and message ${error.message}`
          )
          this.exit(1)
        }
      } else {
        throw error
      }
    }

    CliUx.ux.action.stop()
  }
}
