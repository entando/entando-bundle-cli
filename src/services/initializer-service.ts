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

const ALLOWED_BUNDLE_NAME_REGEXP = /^[\w-]+$/

export interface InitializerOptions {
  parentDirectory: string
  name: string
  version: string
}

/** Handles the scaffolding of a project bundle */
export default class InitializerService {
  private static debug = debugFactory(InitializerService)

  private readonly options: InitializerOptions

  constructor(options: InitializerOptions) {
    this.options = options
  }

  public async performScaffolding(): Promise<void> {
    InitializerService.debug('project scaffolding started')

    if (!ALLOWED_BUNDLE_NAME_REGEXP.test(this.options.name)) {
      throw new CLIError(
        `'${this.options.name}' is not a valid bundle name. Only alphanumeric characters, underscore and dash are allowed`
      )
    }

    this.createBundleDirectories()
    this.createBundleDescriptor()
    this.createDockerfile()
    this.createGitignore()
    this.createConfigJson()
    this.initGitRepo()
  }

  private createBundleDirectories() {
    InitializerService.debug('creating bundle directories')

    const bundleDir = this.getBundleDirectory()

    try {
      fs.accessSync(this.options.parentDirectory, fs.constants.W_OK)
    } catch {
      throw new CLIError(
        `Directory ${this.options.parentDirectory} is not writable`
      )
    }

    if (fs.existsSync(bundleDir)) {
      throw new CLIError(`Directory ${bundleDir} already exists`)
    }

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
      this.getBundleDirectory()
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
      cp.execSync(`git -C ${this.getBundleDirectory()} init`, { stdio: 'pipe' })
    } catch (error) {
      throw new CLIError(error as Error)
    }
  }

  private getBundleDirectory(): string {
    return path.resolve(this.options.parentDirectory, this.options.name)
  }

  private getBundleFilePath(...pathSegments: string[]): string {
    return path.resolve(this.getBundleDirectory(), ...pathSegments)
  }
}
