import { CLIError } from '@oclif/errors'
import * as cp from 'node:child_process'
import * as fs from 'node:fs'
import * as path from 'node:path'
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

    super.checkBundleName(this.options.name)

    this.createBundleDirectories()
    this.createBundleDescriptor()
    this.createDockerfile()
    this.createGitignore()
    this.createConfigJson()
    this.initGitRepo()
  }

  private createBundleDirectories() {
    InitializerService.debug('creating bundle directories')

    const { name } = this.options

    super.checkBundleDirectory(name)

    const bundleDir = super.getBundleDirectory(name)

    fs.mkdirSync(bundleDir)
    fs.mkdirSync(this.getBundleFilePath('.ent'))
    fs.mkdirSync(this.getBundleFilePath('.ent', 'output'))
    fs.mkdirSync(this.getBundleFilePath('microservices'))
    fs.mkdirSync(this.getBundleFilePath('microfrontends'))
    fs.mkdirSync(this.getBundleFilePath('epc'))
  }

  private createBundleDescriptor() {
    InitializerService.debug('creating bundle descriptor')

    const bundleDescriptorService = new BundleDescriptorService(
      super.getBundleDirectory(this.options.name)
    )
    bundleDescriptorService.createBundleDescriptor({
      name: this.options.name,
      version: this.options.version
    })
  }

  private createDockerfile() {
    InitializerService.debug('creating Dockerfile')
    this.createFileFromTemplate(
      this.getBundleFilePath('Dockerfile'),
      'Dockerfile-template'
    )
  }

  private createGitignore() {
    InitializerService.debug('creating .gitignore')
    this.createFileFromTemplate(
      this.getBundleFilePath('.gitignore'),
      'gitignore-template'
    )
  }

  private createConfigJson() {
    InitializerService.debug(`creating ${CONFIG_FILE}`)
    this.createFileFromTemplate(
      this.getBundleFilePath(CONFIG_FOLDER, CONFIG_FILE),
      DEFAULT_CONFIG_FILE
    )
  }

  private createFileFromTemplate(filePath: string, templateFileName: string) {
    const templateFileContent = fs.readFileSync(
      path.resolve(__dirname, '..', '..', RESOURCES_FOLDER, templateFileName)
    )
    fs.writeFileSync(filePath, templateFileContent)
  }

  private initGitRepo() {
    InitializerService.debug('initializing git repository')
    try {
      // Using stdio 'pipe' option to print stderr only through CLIError
      cp.execSync(`git -C ${this.getBundleDirectory(this.options.name)} init`, { stdio: 'pipe' })
    } catch (error) {
      throw new CLIError(error as Error)
    }
  }

  private getBundleFilePath(...pathSegments: string[]): string {
    return path.resolve(this.getBundleDirectory(this.options.name), ...pathSegments)
  }
}
