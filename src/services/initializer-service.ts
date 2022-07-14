import * as fs from 'node:fs'
import { CLIError } from '@oclif/errors'
import { BundleDescriptorService } from './bundle-descriptor-service'
import { debugFactory } from './debug-factory-service'
import {
  CONFIG_FILE,
  CONFIG_FOLDER,
  DEFAULT_CONFIG_FILE,
  OUTPUT_FOLDER
} from '../paths'
import {
  ALLOWED_NAME_REGEXP,
  INVALID_NAME_MESSAGE,
  MAX_NAME_LENGTH
} from '../models/bundle-descriptor-constraints'

import { FSService } from './fs-service'
import { GitService } from './git-service'

export interface InitializerOptions {
  name: string
  parentDirectory: string
  version: string
}

/** Handles the scaffolding of a project bundle */
export class InitializerService {
  private static debug = debugFactory(InitializerService)

  private readonly options: InitializerOptions
  private readonly filesys: FSService
  private readonly git: GitService

  constructor(options: InitializerOptions) {
    this.options = options

    const { parentDirectory, name } = options

    this.filesys = new FSService(name, parentDirectory)
    this.git = new GitService(name, parentDirectory)
  }

  public async performBundleInit(): Promise<void> {
    InitializerService.debug('project scaffolding started')

    this.checkBundleName()
    this.createBundleDirectories()
    this.createBundleDescriptor()
    this.createGitignore()
    this.createConfigJson()
    await this.git.initRepo()
  }

  public checkBundleName(): void {
    InitializerService.debug('checking if bundle name is valid')
    const { name } = this.options
    if (!ALLOWED_NAME_REGEXP.test(name)) {
      throw new CLIError(
        `'${name}' is not a valid bundle name. ${INVALID_NAME_MESSAGE}`
      )
    }

    if (name.length > MAX_NAME_LENGTH) {
      throw new CLIError(
        `Bundle name is too long. The maximum length is ${MAX_NAME_LENGTH}`
      )
    }
  }

  public checkBundleDirectory(): void {
    InitializerService.debug('checking bundle directory if we have access')

    const { parentDirectory } = this.options
    const bundleDir = this.filesys.getBundleDirectory()

    try {
      fs.accessSync(parentDirectory, fs.constants.W_OK)
    } catch {
      throw new CLIError(`Directory ${parentDirectory} is not writable`)
    }

    InitializerService.debug('checking bundle directory it exists')
    if (fs.existsSync(bundleDir)) {
      throw new CLIError(`Directory ${bundleDir} already exists`)
    }
  }

  private createBundleDirectories() {
    InitializerService.debug('creating bundle directories')

    this.checkBundleDirectory()

    const bundleDir = this.filesys.getBundleDirectory()

    fs.mkdirSync(bundleDir)
    fs.mkdirSync(this.filesys.getBundleFilePath(...OUTPUT_FOLDER), {
      recursive: true
    })
    this.filesys.createEmptySubdirectoriesForGitIfNotExist()
  }

  public async performBundleInitFromGit(
    gitSrcRepoAddress: string
  ): Promise<void> {
    InitializerService.debug('cloning from bundle and creating new project')
    const { name, version } = this.options

    this.checkBundleName()
    await this.git.cloneRepo(gitSrcRepoAddress)
    this.git.degit()
    await this.git.initRepo()

    this.createDefaultDirectories()

    const bundleDescriptorService = new BundleDescriptorService(
      this.filesys.getBundleDirectory()
    )
    const descriptor = bundleDescriptorService.getBundleDescriptor()
    bundleDescriptorService.writeBundleDescriptor({
      ...descriptor,
      name,
      version
    })
  }

  private async createDefaultDirectories() {
    this.filesys.createEmptySubdirectoriesForGitIfNotExist()
    this.filesys.createSubDirectoryIfNotExist(CONFIG_FOLDER)
    this.filesys.createSubDirectoryIfNotExist(...OUTPUT_FOLDER)
  }

  private createBundleDescriptor() {
    InitializerService.debug('creating bundle descriptor')

    const { name, version } = this.options

    const bundleDescriptorService = new BundleDescriptorService(
      this.filesys.getBundleDirectory()
    )
    bundleDescriptorService.createBundleDescriptor({
      name,
      version,
      description: `${name} description`,
      type: 'bundle'
    })
  }

  public createGitignore(): void {
    InitializerService.debug('creating .gitignore')
    this.filesys.createFileFromTemplate(['.gitignore'], 'default-gitignore')
  }

  private createConfigJson() {
    InitializerService.debug(`creating ${CONFIG_FILE}`)
    this.filesys.createFileFromTemplate(
      [CONFIG_FOLDER, CONFIG_FILE],
      DEFAULT_CONFIG_FILE
    )
  }
}
