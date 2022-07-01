import { CliUx } from '@oclif/core'
import { Phase } from '../services/command-factory-service'
import { ComponentService } from '../services/component-service'
import {
  ParallelProcessExecutorService,
  ProcessExecutionResult
} from '../services/process-executor-service'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { Component, ComponentType } from '../models/component'
import { LOGS_FOLDER, OUTPUT_FOLDER } from '../paths'
import { mkdirSync } from 'node:fs'
import { color } from '@oclif/color'
import { BaseExecutionCommand } from './base-execution-command'
import { FSService } from '../services/fs-service'

export abstract class BaseBuildCommand extends BaseExecutionCommand {
  static get hidden(): boolean {
    return this.name === BaseBuildCommand.name
  }

  public async buildAllComponents(
    commandPhase: Phase,
    componentType?: ComponentType
  ): Promise<void> {
    const componentService = new ComponentService()
    const components = componentService.getComponents(componentType)

    const componentsNames = components.map(comp => comp.name).join(', ')

    switch (componentType) {
      case ComponentType.MICROSERVICE:
        this.log(
          color.bold.blue(`Building ${componentsNames} microservices...`)
        )
        break
      case ComponentType.MICROFRONTEND:
        this.log(
          color.bold.blue(`Building ${componentsNames} micro frontends...`)
        )
        break
      default:
        this.log(color.bold.blue(`Building ${componentsNames} components...`))
        break
    }

    // Output and logs directories cleanup
    const outputFolder = path.resolve(...OUTPUT_FOLDER)
    const logsFolder = path.resolve(...LOGS_FOLDER)

    if (fs.existsSync(logsFolder)) {
      fs.rmSync(logsFolder, { recursive: true })
    }

    if (fs.existsSync(outputFolder)) {
      fs.rmSync(outputFolder, { recursive: true })
    }

    const executionOptions = this.getExecutionOptions(
      components,
      commandPhase,
      component => this.getBuildOutputLogFile(component)
    )

    const executorService = new ParallelProcessExecutorService(executionOptions)

    await this.parallelBuild(executorService, components)
  }

  public getBuildOutputLogFile(
    component: Component<ComponentType>
  ): fs.WriteStream {
    const logDir = path.resolve(...LOGS_FOLDER)
    mkdirSync(logDir, { recursive: true })
    const logFilePath = path.resolve(logDir, component.name + '.log')
    const logFile = fs.createWriteStream(logFilePath)

    this.log(
      `- Build output for ${
        component.name
      } will be available in ${FSService.toPosix(logFilePath)}`
    )

    return logFile
  }

  public async parallelBuild(
    executorService: ParallelProcessExecutorService,
    components: Array<Component<ComponentType>>
  ): Promise<void> {
    const progress = CliUx.ux.progress()
    progress.start(components.length, 0)

    executorService.on('done', () => {
      progress.update(progress.value + 1)
    })

    const results = await executorService.execute()
    progress.stop()

    this.checkBuildResults(results, components)
  }

  private checkBuildResults(
    results: ProcessExecutionResult[],
    components: Array<Component<ComponentType>>
  ): void {
    if (results.some(result => result !== 0)) {
      let errorMessage = 'The following components failed to build:\n'

      for (const [i, result] of results.entries()) {
        if (result !== 0) {
          errorMessage += `- ${components[i].name}: ${this.getErrorMessage(
            result
          )}\n`
        }
      }

      errorMessage += 'See log files for more information'
      this.error(errorMessage)
    }
  }
}
