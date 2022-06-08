import { CliUx, Flags } from '@oclif/core'
import { BundleService } from '../services/bundle-service'
import { ComponentService } from '../services/component-service'
import { BaseBuildCommand } from './base-build'
import { Phase } from '../services/command-factory-service'
import { ComponentType } from '../models/component'

export default class Build extends BaseBuildCommand {
  static description = 'Build bundle components'

  static examples = ['<%= config.bin %> <%= command.id %> my-component']

  static args = [
    {
      name: 'name',
      description: 'The name of the component to build'
    }
  ]

  static flags = {
    'all-ms': Flags.boolean({
      description: 'Builds all the bundle microservices'
    })
  }

  public async run(): Promise<void> {
    BundleService.isValidBundleProject(process.cwd())
    const { args, flags } = await this.parse(Build)

    const componentService = new ComponentService()
    if (flags['all-ms']) {
      CliUx.ux.action.start(`Building all microservices`)
      await this.buildAllComponents(Phase.Build, ComponentType.MICROSERVICE)
    } else {
      if (args.name === undefined) {
        this.error(`Build failed, missing required arg name`, { exit: 1 })
      }

      CliUx.ux.action.start(`Building component ${args.name}`)

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
    }

    CliUx.ux.action.stop()
  }
}
