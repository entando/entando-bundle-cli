import { CliUx, Flags } from '@oclif/core'
import { BundleService } from '../services/bundle-service'
import { ComponentService } from '../services/component-service'
import { Phase } from '../services/command-factory-service'
import { ComponentType } from '../models/component'
import { color } from '@oclif/color'
import { ParallelProcessExecutorService } from '../services/process-executor-service'
import { BaseExecutionCommand } from './base-execution-command'
import { OutputColorWritable } from '../utils'

export default class Run extends BaseExecutionCommand {
  static description = 'Run bundle components'

  static examples = ['<%= config.bin %> <%= command.id %> my-component']

  static args = [
    {
      name: 'name',
      description: 'The name of the component to run'
    }
  ]

  static flags = {
    'all-ms': Flags.boolean({
      description: 'Run all the bundle microservices'
    }),
  }

  public async run(): Promise<void> {
    BundleService.isValidBundleProject()
    const { args, flags } = await this.parse(Run)
    const componentService = new ComponentService()

    if (Object.keys(flags).length > 0 && args.name !== undefined) {
      this.error(
        `Run failed, please use one flag or write the component name as argument`,
        { exit: 1 }
      )
    }

    if (flags['all-ms']) {
      CliUx.ux.action.start(
        `Running all microservices. Press ctrl + c to exit.`
      )
      await this.runAllComponents(Phase.Run, ComponentType.MICROSERVICE)
    }else {
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

    }
  }

  public async runAllComponents(
    commandPhase: Phase,
    componentType?: ComponentType
  ): Promise<void> {
    this.log(color.bold.blue('Run components...'))

    const componentService = new ComponentService()
    const components = componentService.getComponents(componentType)
    let maxPrefixLength =0
    for (const component of components) {
      const nameLength = component.name.length
      if (component.name.length>maxPrefixLength) maxPrefixLength=nameLength
    }

    const executionOptions = this.getExecutionOptions(
      components,
      commandPhase,
      component => new OutputColorWritable(component.name, maxPrefixLength)
    )

    const executorService = new ParallelProcessExecutorService(executionOptions)

    await executorService.execute()
  }

}
