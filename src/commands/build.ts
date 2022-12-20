import { CliUx, Flags } from '@oclif/core'
import { BundleService } from '../services/bundle-service'
import { ComponentService } from '../services/component-service'
import { BaseBuildCommand, BuildOptions } from './base-build'
import { Phase } from '../services/command-factory-service'
import { Component, ComponentType } from '../models/component'
import { DEFAULT_PARALLEL_PROCESSES_SIZE } from '../services/process-executor-service'

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
    }),
    stdout: Flags.boolean({
      description: 'Print build output to stdout instead of files'
    }),
    'max-parallel': Flags.integer({
      description:
        'Maximum number of processes running at the same time. Default value is ' +
        DEFAULT_PARALLEL_PROCESSES_SIZE
    }),
    'fail-fast': Flags.boolean({
      description:
        'Allow to fail the build command as soon as one of the sub-tasks fails'
    })
  }

  public async run(): Promise<void> {
    BundleService.isValidBundleProject()
    const { argv, flags } = await this.parse(Build)

    this.validateInputs(argv, flags)

    const buildOptions = {
      stdout: flags.stdout,
      parallelism: flags['max-parallel'],
      failFast: flags['fail-fast']
    }

    if (argv.length > 1) {
      await this.buildMultipleComponents(argv, buildOptions)
    } else if (flags['all-mfe']) {
      await this.buildAllComponents(
        Phase.Build,
        buildOptions,
        ComponentType.MICROFRONTEND
      )
    } else if (flags['all-ms']) {
      await this.buildAllComponents(
        Phase.Build,
        buildOptions,
        ComponentType.MICROSERVICE
      )
    } else if (flags.all) {
      await this.buildAllComponents(Phase.Build, buildOptions)
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
            )}`
          )
        }
      }

      CliUx.ux.action.stop()
    }
  }

  public async buildMultipleComponents(
    componentList: string[],
    buildOptions: BuildOptions
  ): Promise<void> {
    const componentService = new ComponentService()
    const components: Array<Component<ComponentType>> = []
    for (const component of componentList) {
      components.push(componentService.getComponent(component))
    }

    await this.buildComponents(components, Phase.Build, buildOptions)
  }
}
