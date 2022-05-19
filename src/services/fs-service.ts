import { CLIError } from '@oclif/errors'
import * as fs from 'node:fs'
import * as path from 'node:path'
import debugFactory from './debug-factory-service'
import { RESOURCES_FOLDER } from '../paths'

const ALLOWED_BUNDLE_NAME_REGEXP = /^[\w-]+$/

export interface ServiceParams {
  name: string
  parentDirectory: string
}

export default class FSService {
  private static debug = debugFactory(FSService)

  private readonly options: ServiceParams

  constructor(options: ServiceParams) {
    this.options = options
  }

  public checkBundleName(): void {
    FSService.debug('checking bundle name if it\'s accepted')
    const { name } = this.options
    if (!ALLOWED_BUNDLE_NAME_REGEXP.test(name)) {
      throw new CLIError(
        `'${name}' is not a valid bundle name. Only alphanumeric characters, underscore and dash are allowed`
      )
    }
  }

  public checkBundleDirectory(): void {
    FSService.debug('checking bundle directory if we have access')
    const { parentDirectory } = this.options
    const bundleDir = this.getBundleDirectory()

    try {
      fs.accessSync(parentDirectory, fs.constants.W_OK)
    } catch {
      throw new CLIError(
        `Directory ${parentDirectory} is not writable`
      )
    }

    FSService.debug('checking bundle directory it exists')
    if (fs.existsSync(bundleDir)) {
      throw new CLIError(`Directory ${bundleDir} already exists`)
    }
  }

  public getBundleDirectory(): string {
    const { name, parentDirectory } = this.options
    return path.resolve(parentDirectory, name)
  }

  public getBundleFilePath(...pathSegments: string[]): string {
    return path.resolve(this.getBundleDirectory(), ...pathSegments)
  }

  public createFileFromTemplate(pathSegments: string[], templateFileName: string): void {
    const filePath = this.getBundleFilePath(...pathSegments)
    const templateFileContent = fs.readFileSync(
      path.resolve(__dirname, '..', '..', RESOURCES_FOLDER, templateFileName)
    )
    fs.writeFileSync(filePath, templateFileContent)
  }

  public createSubDirectoryIfNotExist(...subDirectories: string[]): void {
    if (!fs.existsSync(this.getBundleFilePath(...subDirectories))) {
      fs.mkdirSync(this.getBundleFilePath(...subDirectories))
    }
  }
}
