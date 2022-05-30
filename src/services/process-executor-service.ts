import { spawn } from 'node:child_process'
import { EventEmitter, Writable } from 'node:stream'
import { debugFactory } from './debug-factory-service'

const DEFAULT_PARALLEL_PROCESSES_SIZE = 2

export type ProcessExecutionOptions = {
  command: string
  /** Child process working directory (same as caller process working directory if not specified) */
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

export class ProcessExecutorService {
  /**
   * Executes a long running child process and handles its output streams.
   * @param options parameters for underlying spawn function and output configuration
   * @returns a Promise that resolves when the process completes successfully or rejects when it fails
   */
  public static async executeProcess(
    options: ProcessExecutionOptions
  ): Promise<ProcessExecutionResult> {
    return new Promise(resolve => {
      const process = setUpProcess(options)

      process.on('exit', (code, signal) => {
        if (code !== 0) {
          resolve(code ?? signal!)
        }

        resolve(code!)
      })

      process.on('error', function (error) {
        resolve(error)
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
 * Processes are started in the same order their commands are provided to the service constructor.
 * If the number of processes exceed the configured parallelism limit, the exceeding processes are put in a queue.
 * A process waiting in the queue is started as soon as one of the previously running processes completes.
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
    parallelism: number = DEFAULT_PARALLEL_PROCESSES_SIZE
  ) {
    super()
    this.parallelism = parallelism
    this.processesToWait = processesOptions.length
    this.queue = processesOptions.map((options, index) => ({ options, index }))
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
    const queuedExecution = this.queue.shift()

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
        this.emit('done', queuedExecution.index, code ?? signal!)
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
  const process = spawn(options.command, {
    cwd: options.workDir,
    shell: true
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
