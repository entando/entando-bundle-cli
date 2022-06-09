import { CliUx, Flags } from '@oclif/core'
import { BundleService } from '../services/bundle-service'
import { ComponentService } from '../services/component-service'
import { BaseBuildCommand } from './base-build'
import { Phase } from '../services/command-factory-service'
import { ComponentType } from '../models/component'

export default class Build extends BaseBuildCommand {
  static description = 'Build bundle components'

  static examples = [
    '<%= config.bin %> <%= command.id %> my-component',
    '<%= config.bin %> <%= command.id %> --all-ms',
    '<%= config.bin %> <%= command.id %> --all-mfe'
  ]

  static args = [
    {
      name: 'name',
      description: 'The name of the component to build'
    }
  ]

  static flags = {
    'all-ms': Flags.boolean({
      description: 'Build all the bundle microservices'
    }),
    'all-mfe': Flags.boolean({
      description: 'Build all the bundle micro frontends'
    })
  }

  public async run(): Promise<void> {
    BundleService.isValidBundleProject(process.cwd())
    const { args, flags } = await this.parse(Build)
    const componentService = new ComponentService()

    if (Object.keys(flags).length > 1) {
      this.error(`Build failed, please use only one flag`, { exit: 1 })
    }

    if (Object.keys(flags).length > 0 && args.name !== undefined) {
      this.error(
        `Build failed, please use one flag or write the component name as argument`,
        { exit: 1 }
      )
    }

    if (flags['all-mfe']) {
      await this.buildAllComponents(Phase.Build, ComponentType.MICROFRONTEND)
    } else if (flags['all-ms']) {
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
