import { ChildProcess } from 'node:child_process'
import { EventEmitter, PassThrough } from 'node:stream'
import * as sinon from 'sinon'
import {
  ParallelProcessExecutorService,
  ProcessExecutionResult
} from '../../../src/services/process-executor-service'

/**
 * Helper class used to easily simulate the execution of a set of processes.
 * This class simply emits the fake results passed to the constructor.
 * If you need to stub also process stdout and stderr, stub directly the child_process.spawn()
 * function with the getStubProcess() function below.
 */
export class StubParallelProcessExecutorService extends ParallelProcessExecutorService {
  private readonly stubResults: ProcessExecutionResult[]

  constructor(stubResults: ProcessExecutionResult[]) {
    super([])
    this.stubResults = stubResults
  }

  public async execute(): Promise<ProcessExecutionResult[]> {
    for (const [i, result] of this.stubResults.entries()) {
      this.emit('done', i, result)
    }

    return this.stubResults
  }
}

/**
 * Helper function that can be used to stub child_process.spawn()
 * @returns a fake process with writable stdout and stderr
 */
export function getStubProcess(): ChildProcess {
  const stubProcess = sinon.createStubInstance(ChildProcess)

  stubProcess.stdout = new PassThrough()
  stubProcess.stderr = new PassThrough()

  // setting real EventEmitter to stub on and emit methods
  const stubProcessAsEventEmitter = stubProcess as EventEmitter
  const eventEmitter = new EventEmitter()
  stubProcessAsEventEmitter.on = eventEmitter.on
  stubProcessAsEventEmitter.emit = eventEmitter.emit

  return stubProcess
}
