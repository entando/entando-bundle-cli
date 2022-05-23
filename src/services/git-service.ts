import * as cp from 'node:child_process'
import * as path from 'node:path'
import * as fs from 'node:fs'

import { CLIError } from '@oclif/errors'

import debugFactory from './debug-factory-service'
import { FSService } from './fs-service'
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

  public initRepo(): void {
    GitService.debug(`initializing git repository with name ${this.bundleName}`)
    try {
      // Using stdio 'pipe' option to print stderr only through CLIError
      cp.execSync(`git -C ${this.fsService.getBundleDirectory()} init`, { stdio: 'pipe' })
    } catch (error) {
      throw new CLIError(error as Error)
    }
  }

  public cloneRepo(gitUrl: string): void {
    GitService.debug(`cloning bundle ${this.bundleName}`)
    try {
      cp.execSync(`git clone --depth 1 ${gitUrl} ./${this.bundleName}`, { stdio: 'pipe' })
    } catch (error) {
      throw new CLIError(error as Error)
    }
  }

  public degit(): void {
    GitService.debug(`removing origin git info directory (./.git) in bundle ${this.bundleName}`)
    fs.rmSync(
      path.resolve(this.parentDirectory, `${this.bundleName}/.git`),
      { recursive: true, force: true },
    );
  }
}
