import { CliUx, Flags } from '@oclif/core'
import { BundleService } from '../services/bundle-service'
import { ComponentService } from '../services/component-service'
import { Phase } from '../services/command-factory-service'
import { ComponentType } from '../models/component'
import { color } from '@oclif/color'
import { ParallelProcessExecutorService } from '../services/process-executor-service'
import { BaseExecutionCommand } from './base-execution-command'
import { ColorizedWritable } from '../utils'

export default class Run extends BaseExecutionCommand {
  static description = 'Run bundle components'

  static examples = [
    '<%= config.bin %> <%= command.id %> my-component',
    '<%= config.bin %> <%= command.id %> --all-ms',
    '<%= config.bin %> <%= command.id %> --all-mfe',
    '<%= config.bin %> <%= command.id %> --all'
  ]

  static args = [
    {
      name: 'name',
      description: 'The name of the component to run'
    }
  ]

  static flags = {
    'all-ms': Flags.boolean({
      description: 'Run all the bundle microservices',
      exclusive: ['all-mfe', 'all']
    }),
    'all-mfe': Flags.boolean({
      description: 'Run all the bundle micro frontends',
      exclusive: ['all-ms', 'all']
    }),
    all: Flags.boolean({
      description: 'Run all the bundle components',
      exclusive: ['all-ms', 'all-mfe']
    })
  }

  public async run(): Promise<void> {
    BundleService.isValidBundleProject()
    const { args, flags } = await this.parse(Run)

    this.validateInputs(Object.keys(flags).length, args.name)

    if (flags['all-mfe']) {
      CliUx.ux.action.start(
        `Running all micro frontends. Press ctrl + c to exit.`
      )
      await this.runAllComponents(ComponentType.MICROFRONTEND)
    } else if (flags['all-ms']) {
      CliUx.ux.action.start(
        `Running all microservices. Press ctrl + c to exit.`
      )
      await this.runAllComponents(ComponentType.MICROSERVICE)
    } else if (flags.all) {
      CliUx.ux.action.start(`Running all components. Press ctrl + c to exit.`)
      await this.runAllComponents()
    } else {
      CliUx.ux.action.start(
        `Running component ${args.name}. Press ctrl + c to exit.`
      )

      const componentService = new ComponentService()
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

  public async runAllComponents(componentType?: ComponentType): Promise<void> {
    const componentService = new ComponentService()
    const components = componentService.getComponents(componentType)
    const componentsSize = components.length

    const componentsNames = components.map(comp => comp.name).join(', ')

    switch (componentType) {
      case ComponentType.MICROSERVICE:
        this.log(color.bold.blue(`Running ${componentsNames} microservices`))
        break
      case ComponentType.MICROFRONTEND:
        this.log(color.bold.blue(`Running ${componentsNames} micro frontends`))
        break
      default:
        this.log(color.bold.blue(`Running ${componentsNames} components`))
        break
    }

    let maxPrefixLength = 0
    for (const component of components) {
      const nameLength = component.name.length
      if (component.name.length > maxPrefixLength) maxPrefixLength = nameLength
    }

    const executionOptions = this.getExecutionOptions(
      components,
      Phase.Run,
      component => new ColorizedWritable(component.name, maxPrefixLength)
    )

    const executorService = new ParallelProcessExecutorService(
      executionOptions,
      componentsSize
    )

    await executorService.execute()
  }
}
