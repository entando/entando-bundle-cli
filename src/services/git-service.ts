import * as path from 'node:path'
import * as fs from 'node:fs'
import { CLIError } from '@oclif/errors'
import { debugFactory } from './debug-factory-service'
import { FSService } from './fs-service'
import { ProcessExecutorService } from './process-executor-service'
import { InMemoryWritable } from '../utils'

export class GitService {
  private static debug = debugFactory(GitService)
  private readonly bundleName: string
  private readonly parentDirectory: string
  private readonly fsService: FSService

  constructor(name: string, parentDirectory: string) {
    this.bundleName = name
    this.parentDirectory = parentDirectory
    this.fsService = new FSService(name, parentDirectory)
  }

  public async initRepo(): Promise<void> {
    GitService.debug(`initializing git repository with name ${this.bundleName}`)
    const errorStream = new InMemoryWritable()
    const result = await ProcessExecutorService.executeProcess({
      command: `git -C ${this.fsService.getBundleDirectory()} init`,
      outputStream: GitService.debug.outputStream,
      errorStream
    })
    if (result !== 0) {
      throw new CLIError(
        errorStream.data.trim() ||
          'Initialization of git repository failed. Enable debug mode to see more details.'
      )
    }
  }

  public async cloneRepo(gitUrl: string): Promise<void> {
    GitService.debug(`cloning bundle ${this.bundleName}`)
    const errorStream = new InMemoryWritable()
    const result = await ProcessExecutorService.executeProcess({
      command: `git clone --depth 1 ${gitUrl} ./${this.bundleName}`,
      outputStream: GitService.debug.outputStream,
      errorStream
    })
    if (result !== 0) {
      throw new CLIError(
        errorStream.data.trim() ||
          'Cloning of git repository failed. Enable debug mode to see more details.'
      )
    }
  }

  public degit(): void {
    GitService.debug(
      `removing origin git info directory (./.git) in bundle ${this.bundleName}`
    )
    fs.rmSync(path.resolve(this.parentDirectory, `${this.bundleName}/.git`), {
      recursive: true,
      force: true
    })
  }
}
