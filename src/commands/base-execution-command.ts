import { Command } from '@oclif/core'
import {
  CommandFactoryService,
  Phase
} from '../services/command-factory-service'
import { ComponentService } from '../services/component-service'
import {
  ProcessExecutionOptions,
  ProcessExecutionResult
} from '../services/process-executor-service'
import { Component, ComponentType } from '../models/component'
import { Writable } from 'node:stream'

export abstract class BaseExecutionCommand extends Command {
  static get hidden(): boolean {
    return this.name === BaseExecutionCommand.name
  }

  public validateInputs(flagsLength: number, name?: string): void {
    if (
      (flagsLength > 0 && name !== undefined) ||
      (flagsLength === 0 && name === undefined)
    ) {
      this.error(
        'Bad arguments. Please use the component name as argument or one of the available flags',
        { exit: 1 }
      )
    }
  }

  public getExecutionOptions(
    components: Array<Component<ComponentType>>,
    commandPhase: Phase,
    outputStreamFactory: (component: Component<ComponentType>) => Writable
  ): ProcessExecutionOptions[] {
    const executionOptions: ProcessExecutionOptions[] = []

    for (const component of components) {
      const command = CommandFactoryService.getCommand(component, commandPhase)
      const workDir = ComponentService.getComponentPath(component)
      const outputStream = outputStreamFactory(component)
      executionOptions.push({
        command: command,
        workDir,
        outputStream,
        errorStream: outputStream
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
