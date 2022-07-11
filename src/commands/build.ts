import { CliUx, Flags } from '@oclif/core'
import { BundleService } from '../services/bundle-service'
import { ComponentService } from '../services/component-service'
import { BaseBuildCommand } from './base-build'
import { Phase } from '../services/command-factory-service'
import { Component, ComponentType } from '../models/component'

export default class Build extends BaseBuildCommand {
  static description = 'Build bundle components'
  // Disable argument validation for variable length arguments (list of components)
  static strict = false

  static examples = [
    '<%= config.bin %> <%= command.id %> my-component',
    '<%= config.bin %> <%= command.id %> my-component-1 my-component-2',
    '<%= config.bin %> <%= command.id %> --all-ms',
    '<%= config.bin %> <%= command.id %> --all-mfe',
    '<%= config.bin %> <%= command.id %> --all'
  ]

  static usage =
    '<%= command.id %> [component...] [--all-ms | --all-mfe | --all]'

  static flags = {
    'all-ms': Flags.boolean({
      description: 'Build all the bundle microservices',
      exclusive: ['all-mfe', 'all']
    }),
    'all-mfe': Flags.boolean({
      description: 'Build all the bundle micro frontends',
      exclusive: ['all-ms', 'all']
    }),
    all: Flags.boolean({
      description: 'Build all the bundle components',
      exclusive: ['all-ms', 'all-mfe']
    })
  }

  public async run(): Promise<void> {
    BundleService.isValidBundleProject()
    const { argv, flags } = await this.parse(Build)

    this.validateInputs(Object.keys(flags).length, argv.length)

    if (argv.length > 1) {
      await this.buildMultipleComponents(argv)
    } else if (flags['all-mfe']) {
      await this.buildAllComponents(Phase.Build, ComponentType.MICROFRONTEND)
    } else if (flags['all-ms']) {
      await this.buildAllComponents(Phase.Build, ComponentType.MICROSERVICE)
    } else if (flags.all) {
      await this.buildAllComponents(Phase.Build)
    } else {
      CliUx.ux.action.start(`Building component ${argv[0]}...`)

      const componentService = new ComponentService()
      const result = await componentService.build(argv[0])

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

  public async buildMultipleComponents(componentList: string[]): Promise<void> {
    const componentService = new ComponentService()
    const components: Array<Component<ComponentType>> = []
    for (const component of componentList) {
      components.push(componentService.getComponent(component))
    }

    await this.buildComponents(components, Phase.Build)
  }
}
