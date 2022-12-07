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

const componentsSelectorFlags = new Set(['all-ms', 'all-mfe', 'all'])

export abstract class BaseExecutionCommand extends Command {
  static get hidden(): boolean {
    return this.name === BaseExecutionCommand.name
  }

  public validateInputs(argv: string[], flags: Record<string, unknown>): void {
    const hasComponentsSelector = Object.keys(flags).some(f =>
      componentsSelectorFlags.has(f)
    )
    if (
      (hasComponentsSelector && argv.length > 0) ||
      (!hasComponentsSelector && argv.length === 0)
    ) {
      this.error(
        'Bad arguments. Please use the component name as argument or one of the available flags'
      )
    }
  }

  public getMaxPrefixLength(
    components: Array<Component<ComponentType>>
  ): number {
    let maxPrefixLength = 0
    for (const component of components) {
      const nameLength = component.name.length
      if (component.name.length > maxPrefixLength) maxPrefixLength = nameLength
    }

    return maxPrefixLength
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
