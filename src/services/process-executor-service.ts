import { CLIError } from '@oclif/errors'
import { spawn } from 'node:child_process'
import { Writable } from 'node:stream'

export type ProcessExecutionOptions = {
  command: string
  arguments?: string[]
  /** Child process working directory */
  cwd?: string
  /**
   * Writable where the child process output (both stdout and stderr) will be sent.
   * This allows to send the output to the caller process stdout/stderr or redirect it to a file.
   * If the field is not defined the output will be ignored.
   */
  outputStream?: Writable
}

export default class ProcessExecutorService {
  /**
   * Executes a long running child process and handles its output streams.
   * @param options parameters for underlying spawn function and output configuration
   * @returns a Promise that resolves when the process completes successfully or rejects when it fails
   */
  public static async executeProcess(
    options: ProcessExecutionOptions
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const process = spawn(options.command, options.arguments, {
        cwd: options.cwd
      })

      process.stdout.on('data', chunk => {
        if (options.outputStream) {
          options.outputStream.write(chunk)
        }
      })

      process.stderr.on('data', chunk => {
        if (options.outputStream) {
          options.outputStream.write(chunk)
        }
      })

      process.on('exit', (code, signal) => {
        if (code !== 0) {
          reject(
            new CLIError(
              `Command exited with code ${code} and signal ${signal}`
            )
          )
        }

        resolve()
      })

      process.on('error', function (error) {
        reject(new CLIError(`Command failed due to error: ${error}`))
      })
    })
  }
}
