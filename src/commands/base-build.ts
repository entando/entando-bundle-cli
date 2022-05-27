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
  public async buildAllComponents(): Promise<void> {
    this.log('Building packages...')

    const componentService = new ComponentService()
    const components = componentService.getComponents()

    const executionOptions = this.buildExecutionOptions(components)

    const executorService = new ParallelProcessExecutorService(executionOptions)

    const progress = CliUx.ux.progress()
    progress.start(executionOptions.length, 0)

    executorService.on('done', () => {
      progress.update(progress.value + 1)
    })

    const results = await executorService.execute()
    progress.stop()

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

  private buildExecutionOptions(components: Array<Component<ComponentType>>) {
    const executionOptions: ProcessExecutionOptions[] = []

    for (const component of components) {
      const commandOptions = CommandFactoryService.getCommand(
        component,
        Phase.Package
      )

      const componentTypeFolder =
        component.type === ComponentType.MICROFRONTEND
          ? MICROFRONTENDS_FOLDER
          : MICROSERVICES_FOLDER

      const workDir = path.resolve(componentTypeFolder, component.name)

      const logDir = path.resolve(...OUTPUT_FOLDER, componentTypeFolder)
      mkdirSync(logDir, { recursive: true })
      const logFilePath = path.resolve(logDir, component.name + '.log')
      const logFile = fs.createWriteStream(logFilePath)

      this.log(
        `- Build output for ${component.name} will be available in ${logFilePath}`
      )

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
