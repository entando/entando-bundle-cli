import { Command } from '@oclif/core'
import { ProcessExecutionResult } from '../../services/process-executor-service'

export enum ServiceTypes {
  START = 'Starting',
  STOP = 'Stopping',
  RESTART = 'Restarting',
  LOGS = 'Logs display'
}

export abstract class SvcProcessResult extends Command {
  static get hidden(): boolean {
    return this.name === SvcProcessResult.name
  }

  protected checkResult(
    result: ProcessExecutionResult,
    serviceType: ServiceTypes,
    services: string[]
  ): void {
    if (result !== 0) {
      if (typeof result === 'number') {
        this.error(
          `${serviceType} service(s) ${services.join(
            ', '
          )} failed, exited with code ${result}`,
          {
            exit: result as number
          }
        )
      } else {
        this.error(
          `${serviceType} service failed, exited with code 1 and message ${this.getErrorMessage(
            result
          )}`,
          { exit: 1 }
        )
      }
    }
  }

  protected getErrorMessage(executionResult: ProcessExecutionResult): string {
    if (executionResult instanceof Error) {
      return `Command failed due to error: ${executionResult.message}`
    }

    return `Process killed by signal ${executionResult}`
  }
}
