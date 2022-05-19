import * as cp from 'node:child_process'
import * as path from 'node:path'
import * as fs from 'node:fs'

import { CLIError } from '@oclif/errors'

import debugFactory from './debug-factory-service'
import FSService, { ServiceParams } from './fs-service'

export class GitService {
  private static debug = debugFactory(GitService)
  private readonly options: ServiceParams
  private readonly fsService: FSService

  constructor(options: ServiceParams, fsService: FSService) {
    this.options = options
    this.fsService = fsService
  }

  public createGitignore(): void {
    GitService.debug('creating .gitignore')
    this.fsService.createFileFromTemplate(['.gitignore'], 'gitignore-template')
  }

  public initRepo(): void {
    GitService.debug(`initializing git repository with name ${this.options.name}`)
    try {
      // Using stdio 'pipe' option to print stderr only through CLIError
      cp.execSync(`git -C ${this.fsService.getBundleDirectory()} init`, { stdio: 'pipe' })
    } catch (error) {
      throw new CLIError(error as Error)
    }
  }

  public cloneRepo(gitUrl: string): void {
    GitService.debug(`cloning bundle ${this.options.name}`)
    try {
      cp.execSync(`git clone --depth 1 ${gitUrl} ./${this.options.name}`, { stdio: 'pipe' })
    } catch (error) {
      throw new CLIError(error as Error)
    }
  }

  public degit(): void {
    GitService.debug(`removing origin git info directory (./.git) in bundle ${this.options.name}`)
    fs.rmSync(
      path.resolve(this.options.parentDirectory, `${this.options.name}/.git`),
      { recursive: true, force: true },
    );
  }
}
