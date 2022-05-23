import { CLIError } from '@oclif/errors'
import * as fs from 'node:fs'
import * as path from 'node:path'
import debugFactory from './debug-factory-service'
import { RESOURCES_FOLDER } from '../paths'

const ALLOWED_BUNDLE_NAME_REGEXP = /^[\w-]+$/
const JSON_INDENTATION_SPACES = 4

export class FSService {
  private static debug = debugFactory(FSService)

  private readonly bundleName: string
  private readonly parentDirectory: string

  constructor(name: string, parentDirectory: string) {
    this.bundleName = name
    this.parentDirectory = parentDirectory
  }

  public checkBundleName(): void {
    FSService.debug('checking bundle name if it\'s accepted')
    if (!ALLOWED_BUNDLE_NAME_REGEXP.test(this.bundleName)) {
      throw new CLIError(
        `'${this.bundleName}' is not a valid bundle name. Only alphanumeric characters, underscore and dash are allowed`
      )
    }
  }

  public checkBundleDirectory(): void {
    FSService.debug('checking bundle directory if we have access')
    const bundleDir = this.getBundleDirectory()

    try {
      fs.accessSync(this.parentDirectory, fs.constants.W_OK)
    } catch {
      throw new CLIError(
        `Directory ${this.parentDirectory} is not writable`
      )
    }

    FSService.debug('checking bundle directory it exists')
    if (fs.existsSync(bundleDir)) {
      throw new CLIError(`Directory ${bundleDir} already exists`)
    }
  }

  public getBundleDirectory(): string {
    return path.resolve(this.parentDirectory, this.bundleName)
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

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  public static writeJSON(filePath: string, data: any): void {
    fs.writeFileSync(
      filePath,
      JSON.stringify(data, null, JSON_INDENTATION_SPACES))
  }
}
