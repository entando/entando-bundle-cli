import * as fs from 'node:fs'
import BundleDescriptorService from './bundle-descriptor-service'
import debugFactory from './debug-factory-service'
import {
  CONFIG_FILE,
  CONFIG_FOLDER,
  DEFAULT_CONFIG_FILE,
  RESOURCES_FOLDER
} from '../paths'

import FSService from './fs-service'

export interface InitializerOptions {
  parentDirectory: string
  name: string
  version: string
}

/** Handles the scaffolding of a project bundle */
export default class InitializerService extends FSService {
  private static debug = debugFactory(InitializerService)

  private readonly options: InitializerOptions

  constructor(options: InitializerOptions) {
    super(options.parentDirectory)
    this.options = options
  }

  public async performScaffolding(): Promise<void> {
    InitializerService.debug('project scaffolding started')

    const { name } = this.options

    this.checkBundleName(name)

    this.createBundleDirectories()
    this.createBundleDescriptor()
    this.createDockerfile()
    this.createGitignore(name)
    this.createConfigJson()
    this.initGitRepo(name)
  }

  private createBundleDirectories() {
    InitializerService.debug('creating bundle directories')

    const { name } = this.options

    this.checkBundleDirectory(name)

    const bundleDir = this.getBundleDirectory(name)

    fs.mkdirSync(bundleDir)
    fs.mkdirSync(this.getBundleFilePath(name, '.ent'))
    fs.mkdirSync(this.getBundleFilePath(name, '.ent', 'output'))
    fs.mkdirSync(this.getBundleFilePath(name, 'microservices'))
    fs.mkdirSync(this.getBundleFilePath(name, 'microfrontends'))
    fs.mkdirSync(this.getBundleFilePath(name, 'epc'))
  }

  private createBundleDescriptor() {
    InitializerService.debug('creating bundle descriptor')

    const { name, version } = this.options

    const bundleDescriptorService = new BundleDescriptorService(
      this.getBundleDirectory(name)
    )
    bundleDescriptorService.createBundleDescriptor({ name, version })
  }

  private createDockerfile() {
    InitializerService.debug('creating Dockerfile')
    this.createFileFromTemplate(
      this.getBundleFilePath(this.options.name, 'Dockerfile'),
      'Dockerfile-template'
    )
  }

  private createConfigJson() {
    InitializerService.debug(`creating ${CONFIG_FILE}`)
    this.createFileFromTemplate(
      this.getBundleFilePath(CONFIG_FOLDER, CONFIG_FILE),
      DEFAULT_CONFIG_FILE
    )
  }
}
