import { CliUx, Command } from '@oclif/core'
import {
  CommandFactoryService,
  Phase
} from '../services/command-factory-service'
import { ComponentService } from '../services/component-service'
import {
  ParallelProcessExecutorService,
  ProcessExecutionOptions,
  ProcessExecutionResult
} from '../services/process-executor-service'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { Component, ComponentType } from '../models/component'
import {
  MICROFRONTENDS_FOLDER,
  MICROSERVICES_FOLDER,
  OUTPUT_FOLDER
} from '../paths'
import { mkdirSync } from 'node:fs'

export abstract class BaseBuildCommand extends Command {
  public async buildAllComponents(commandPhase: Phase): Promise<void> {
    this.log('Building packages...')

    const componentService = new ComponentService()
    const components = componentService.getComponents()

    const executionOptions = this.buildExecutionOptions(
      components,
      commandPhase
    )

    const executorService = new ParallelProcessExecutorService(executionOptions)

    await this.parallelBuild(executorService, components)
  }

  private buildExecutionOptions(
    components: Array<Component<ComponentType>>,
    commandPhase: Phase
  ) {
    const executionOptions: ProcessExecutionOptions[] = []

    for (const component of components) {
      const commandOptions = CommandFactoryService.getCommand(
        component,
        commandPhase
      )

      const componentTypeFolder =
        component.type === ComponentType.MICROFRONTEND
          ? MICROFRONTENDS_FOLDER
          : MICROSERVICES_FOLDER

      const workDir = path.resolve(componentTypeFolder, component.name)
      const logFile = this.getBuildOutputLogFile(component, componentTypeFolder)

      executionOptions.push({
        command: commandOptions.command,
        arguments: commandOptions.arguments,
        workDir,
        outputStream: logFile,
        errorStream: logFile
      })
    }

    return executionOptions
  }

  public getBuildOutputLogFile(
    component: Component<ComponentType>,
    componentFolder: string
  ): fs.WriteStream {
    const logDir = path.resolve(...OUTPUT_FOLDER, componentFolder)
    mkdirSync(logDir, { recursive: true })
    const logFilePath = path.resolve(logDir, component.name + '.log')
    const logFile = fs.createWriteStream(logFilePath)

    this.log(
      `- Build output for ${component.name} will be available in ${logFilePath}`
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

  public checkBuildResults(
    results: ProcessExecutionResult[],
    components: Array<Component<ComponentType>>
  ): void {
    if (results.some(result => result !== 0)) {
      let errorMessage = 'Following components failed to build:\n'

      for (const [i, result] of results
        .filter(result => result !== 0)
        .entries()) {
        errorMessage += `- ${components[i].name}: ${this.getErrorMessage(
          result
        )}\n`
      }

      errorMessage += 'See log files for more information'
      this.error(errorMessage)
    }
  }

  public getErrorMessage(executionResult: ProcessExecutionResult): string {
    if (typeof executionResult === 'number') {
      return `Process exited with code ${executionResult}`
    }

    if (executionResult instanceof Error) {
      return `Command failed due to error: ${executionResult.message}`
    }

    return `Process killed by signal ${executionResult}`
  }
}
