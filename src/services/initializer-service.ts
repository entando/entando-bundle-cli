import * as fs from 'node:fs'
import BundleDescriptorService from './bundle-descriptor-service'
import debugFactory from './debug-factory-service'
import {
  CONFIG_FILE,
  CONFIG_FOLDER,
  DEFAULT_CONFIG_FILE
} from '../paths'

import ServiceParams, { ServiceTools } from '../models/service-params'

export interface InitializerOptions extends ServiceParams {
  version: string
}

/** Handles the scaffolding of a project bundle */
export default class InitializerService {
  private static debug = debugFactory(InitializerService)

  private readonly options: InitializerOptions
  private readonly serviceTools: ServiceTools

  constructor(options: InitializerOptions, serviceTools: ServiceTools) {
    this.options = options
    this.serviceTools = serviceTools
  }

  public async performScaffolding(): Promise<void> {
    const { git, filesys } = this.serviceTools
    InitializerService.debug('project scaffolding started')

    filesys.checkBundleName()
    this.createBundleDirectories()
    this.createBundleDescriptor()
    this.createDockerfile()
    git.createGitignore()
    this.createConfigJson()
    git.initRepo()
  }

  private createBundleDirectories() {
    InitializerService.debug('creating bundle directories')

    const { filesys } = this.serviceTools

    filesys.checkBundleDirectory()

    const bundleDir = filesys.getBundleDirectory()

    fs.mkdirSync(bundleDir)
    fs.mkdirSync(filesys.getBundleFilePath('.ent'))
    fs.mkdirSync(filesys.getBundleFilePath('.ent', 'output'))
    fs.mkdirSync(filesys.getBundleFilePath('microservices'))
    fs.mkdirSync(filesys.getBundleFilePath('microfrontends'))
    fs.mkdirSync(filesys.getBundleFilePath('epc'))
  }

  private createBundleDescriptor() {
    InitializerService.debug('creating bundle descriptor')

    const { name, version } = this.options
    const { filesys } = this.serviceTools

    const bundleDescriptorService = new BundleDescriptorService(
      filesys.getBundleDirectory()
    )
    bundleDescriptorService.createBundleDescriptor({ name, version })
  }

  private createDockerfile() {
    InitializerService.debug('creating Dockerfile')
    const { filesys } = this.serviceTools
    filesys.createFileFromTemplate(
      filesys.getBundleFilePath('Dockerfile'),
      'Dockerfile-template'
    )
  }

  private createConfigJson() {
    InitializerService.debug(`creating ${CONFIG_FILE}`)
    const { filesys } = this.serviceTools
    filesys.createFileFromTemplate(
      filesys.getBundleFilePath(CONFIG_FOLDER, CONFIG_FILE),
      DEFAULT_CONFIG_FILE
    )
  }
}
