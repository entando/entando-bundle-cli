import { spawn } from 'node:child_process'
import { EventEmitter, Writable } from 'node:stream'
import { debugFactory } from './debug-factory-service'

const PARALLELISM = 2

export type ProcessExecutionOptions = {
  command: string
  arguments?: string[]
  /** Child process working directory */
  workDir?: string
  /**
   * Writable where the child process standard output will be sent.
   * This allows to send the output to the caller process stdout/stderr or redirect it to a file.
   * If the field is not defined the output will be ignored.
   */
  outputStream?: Writable
  /**
   * Writable where the child process standard error will be sent.
   * This allows to send the output to the caller process stdout/stderr or redirect it to a file.
   * If the field is not defined the output will be ignored.
   */
  errorStream?: Writable
}

export type ProcessExecutionResult = number | Error | NodeJS.Signals

export class ExecutionError extends Error {
  readonly executionResult: ProcessExecutionResult

  constructor(executionResult: ProcessExecutionResult) {
    if (typeof executionResult === 'number') {
      super(`Process exited with code ${executionResult}`)
    } else if (executionResult instanceof Error) {
      super(`Command failed due to error: ${executionResult.message}`)
    } else {
      super(`Process killed by signal ${executionResult}`)
    }

    this.executionResult = executionResult
  }
}

export class ProcessExecutorService {
  private static debug = debugFactory(ProcessExecutorService)
  /**
   * Executes a long running child process and handles its output streams.
   * @param options parameters for underlying spawn function and output configuration
   * @returns a Promise that resolves when the process completes successfully or rejects when it fails
   */
  public static async executeProcess(
    options: ProcessExecutionOptions
  ): Promise<ProcessExecutionResult> {
    return new Promise((resolve, reject) => {
      const process = setUpProcess(options)

      process.on('exit', (code, signal) => {
        if (code !== 0) {
          reject(new ExecutionError(code === null ? signal! : code))
        }

        resolve(code!)
      })

      process.on('error', function (error) {
        reject(new ExecutionError(error))
      })
    })
  }
}

type QueuedProcessExecution = {
  options: ProcessExecutionOptions
  index: number
}

/**
 * Executes multiple long running child processes and handles their output streams.
 * A 'start' and 'done' event is emitted every time a process starts and completes (both successfully or unsuccessfully).
 */
export class ParallelProcessExecutorService extends EventEmitter {
  private static debug = debugFactory(ParallelProcessExecutorService)

  private readonly parallelism: number
  private readonly queue: QueuedProcessExecution[]
  private readonly results: ProcessExecutionResult[] = []
  private processesToWait: number

  /**
   * @param processesOptions parameters for underlying spawn functions and output configurations
   * @param parallelism maximum number of processes that are executed in parallel
   */
  constructor(
    processesOptions: ProcessExecutionOptions[],
    parallelism: number = PARALLELISM
  ) {
    super()
    this.parallelism = parallelism
    this.processesToWait = processesOptions.length
    this.queue = processesOptions
      .map((options, index) => ({ options, index }))
      // reversing queue, so that when we use pop() the first process of the list
      // passed to constructor is effectively the first process to be started
      .reverse()
  }

  public async execute(): Promise<ProcessExecutionResult[]> {
    return new Promise(resolve => {
      if (this.processesToWait === 0) {
        resolve(this.results)
      }

      this.on('done', (index: number, result: ProcessExecutionResult) => {
        this.results[index] = result
        this.processesToWait--
        if (this.processesToWait === 0) {
          resolve(this.results)
        } else {
          this.startNextProcess()
        }
      })

      for (let i = 0; i < this.parallelism; i++) {
        this.startNextProcess()
      }
    })
  }

  private startNextProcess() {
    const queuedExecution = this.queue.pop()

    if (queuedExecution) {
      ParallelProcessExecutorService.debug(
        'Started process',
        queuedExecution.index
      )
      this.emit('start', queuedExecution.index)

      const process = setUpProcess(queuedExecution.options)

      process.on('exit', (code, signal) => {
        ParallelProcessExecutorService.debug(
          `Process ${queuedExecution.index} exited with code ${code} and signal ${signal}`
        )
        this.emit('done', queuedExecution.index, code === null ? signal! : code)
      })

      process.on('error', error => {
        ParallelProcessExecutorService.debug(
          `Process ${queuedExecution.index} exited due to error`,
          error.message
        )
        this.emit('done', queuedExecution.index, error)
      })
    }
  }
}

function setUpProcess(options: ProcessExecutionOptions) {
  const process = spawn(options.command, options.arguments, {
    cwd: options.workDir
  })

  process.stdout.on('data', chunk => {
    if (options.outputStream) {
      options.outputStream.write(chunk)
    }
  })

  process.stderr.on('data', chunk => {
    if (options.errorStream) {
      options.errorStream.write(chunk)
    }
  })

  return process
}
