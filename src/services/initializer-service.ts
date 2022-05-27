import * as fs from 'node:fs'
import * as path from 'node:path'
import { BundleDescriptorService } from './bundle-descriptor-service'
import { debugFactory } from './debug-factory-service'
import {
  AUX_FOLDER,
  CONFIG_FILE,
  CONFIG_FOLDER,
  RESOURCES_FOLDER,
  DEFAULT_CONFIG_FILE
} from '../paths'

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

    this.filesys.checkBundleName()
    this.createBundleDirectories()
    this.createBundleDescriptor()
    this.createDockerfile()
    this.createGitignore()
    this.createConfigJson()
    this.createDefaultAuxFiles()
    this.git.initRepo()
  }

  private createBundleDirectories() {
    InitializerService.debug('creating bundle directories')

    this.filesys.checkBundleDirectory()

    const bundleDir = this.filesys.getBundleDirectory()

    fs.mkdirSync(bundleDir)
    fs.mkdirSync(this.filesys.getBundleFilePath(CONFIG_FOLDER, 'output'), {
      recursive: true
    })
    fs.mkdirSync(this.filesys.getBundleFilePath('microservices'))
    fs.mkdirSync(this.filesys.getBundleFilePath('microfrontends'))
    fs.mkdirSync(this.filesys.getBundleFilePath('epc'))
    fs.mkdirSync(this.filesys.getBundleFilePath(AUX_FOLDER))
  }

  public async performBundleInitFromGit(
    gitSrcRepoAddress: string
  ): Promise<void> {
    InitializerService.debug('cloning from bundle and creating new project')
    const { name, version } = this.options

    this.filesys.checkBundleName()
    this.git.cloneRepo(gitSrcRepoAddress)
    this.git.degit()
    this.git.initRepo()

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
    this.filesys.createSubDirectoryIfNotExist('microservices')
    this.filesys.createSubDirectoryIfNotExist('microfrontends')
    this.filesys.createSubDirectoryIfNotExist(CONFIG_FOLDER)
    this.filesys.createSubDirectoryIfNotExist(CONFIG_FOLDER, 'output')
    this.filesys.createSubDirectoryIfNotExist(AUX_FOLDER)
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
      type: 'bundle'
    })
  }

  public createGitignore(): void {
    InitializerService.debug('creating .gitignore')
    this.filesys.createFileFromTemplate(['.gitignore'], 'gitignore-template')
  }

  private createDockerfile() {
    InitializerService.debug('creating Dockerfile')
    this.filesys.createFileFromTemplate(['Dockerfile'], 'Dockerfile-template')
  }

  public createDefaultAuxFiles(): void {
    InitializerService.debug('creating aux files')

    const replaceDict = { '%BUNDLENAME%': this.options.name }
    const defaultYamls = fs
      .readdirSync(
        path.resolve(__dirname, '..', '..', RESOURCES_FOLDER, AUX_FOLDER)
      )
      .filter(filename => filename.slice(-3) === 'yml')
      .map(filename => filename.slice(8))

    for (const defaultYaml of defaultYamls) {
      this.filesys.createFileFromTemplate(
        [AUX_FOLDER, defaultYaml],
        path.join(AUX_FOLDER, `default-${defaultYaml}`),
        replaceDict
      )
    }
  }

  private createConfigJson() {
    InitializerService.debug(`creating ${CONFIG_FILE}`)
    this.filesys.createFileFromTemplate(
      [CONFIG_FOLDER, CONFIG_FILE],
      DEFAULT_CONFIG_FILE
    )
  }
}
