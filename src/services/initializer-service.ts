import * as fs from 'node:fs'
import { Bundle } from "../models/bundle-descriptor"
import BundleDescriptorService from './bundle-descriptor-service'
import debugFactory from './debug-factory-service'
import {
  CONFIG_FILE,
  CONFIG_FOLDER,
  DEFAULT_CONFIG_FILE
} from '../paths'

import FSService, { ServiceParams } from './fs-service'
import { GitService } from './git-service'

export interface InitializerOptions extends ServiceParams {
  version: string
}

/** Handles the scaffolding of a project bundle */
export default class InitializerService {
  private static debug = debugFactory(InitializerService)

  private readonly options: InitializerOptions
  private readonly filesys: FSService
  private readonly git: GitService

  constructor(options: InitializerOptions) {
    this.options = options

    const { parentDirectory, name } = options
    const serviceParams = { parentDirectory, name }

    this.filesys = new FSService(serviceParams)
    this.git = new GitService(serviceParams)
  }

  public async performScaffolding(): Promise<void> {
    InitializerService.debug('project scaffolding started')

    this.filesys.checkBundleName()
    this.createBundleDirectories()
    this.createBundleDescriptor()
    this.createDockerfile()
    this.git.createGitignore()
    this.createConfigJson()
    this.git.initRepo()
  }

  private createBundleDirectories() {
    InitializerService.debug('creating bundle directories')

    this.filesys.checkBundleDirectory()

    const bundleDir = this.filesys.getBundleDirectory()

    fs.mkdirSync(bundleDir)
    fs.mkdirSync(this.filesys.getBundleFilePath('.ent'))
    fs.mkdirSync(this.filesys.getBundleFilePath('.ent', 'output'))
    fs.mkdirSync(this.filesys.getBundleFilePath('microservices'))
    fs.mkdirSync(this.filesys.getBundleFilePath('microfrontends'))
    fs.mkdirSync(this.filesys.getBundleFilePath('epc'))
  }

  public async performCloneBundle(bundle: Bundle): Promise<void> {
    InitializerService.debug('cloning from bundle and creating new project')
    const { name, version } = this.options

    this.filesys.checkBundleName()
    this.git.cloneRepo(bundle.gitSrcRepoAddress)
    this.git.degit()
    this.git.initRepo()

    this.checkMissingDirectories()

    const bundleDescriptorService = new BundleDescriptorService(this.filesys.getBundleDirectory())
    const descriptor = bundleDescriptorService.getBundleDescriptor()
    bundleDescriptorService.writeBundleDescriptor({ ...descriptor, name, version })
  }

  private async checkMissingDirectories() {
    this.filesys.createSubDirectoryIfNotExist('microservices')
    this.filesys.createSubDirectoryIfNotExist('microfrontends')
    this.filesys.createSubDirectoryIfNotExist('.ent')
    this.filesys.createSubDirectoryIfNotExist('.ent', 'output')
    this.filesys.createSubDirectoryIfNotExist('epc')
  }

  private createBundleDescriptor() {
    InitializerService.debug('creating bundle descriptor')

    const { name, version } = this.options

    const bundleDescriptorService = new BundleDescriptorService(
      this.filesys.getBundleDirectory()
    )
    bundleDescriptorService.createBundleDescriptor({ name, version })
  }

  private createDockerfile() {
    InitializerService.debug('creating Dockerfile')
    this.filesys.createFileFromTemplate(['Dockerfile'], 'Dockerfile-template')
  }

  private createConfigJson() {
    InitializerService.debug(`creating ${CONFIG_FILE}`)
    this.filesys.createFileFromTemplate([CONFIG_FOLDER, CONFIG_FILE], DEFAULT_CONFIG_FILE)
  }
}
