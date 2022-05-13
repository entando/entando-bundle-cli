import { CLIError } from '@oclif/errors'
import * as cp from 'node:child_process'
import * as fs from 'node:fs'
import * as path from 'node:path'
import debugFactory from './debug-factory-service'

const ALLOWED_BUNDLE_NAME_REGEXP = /^[\w-]+$/

export default class FSService {
  private static debugOut = debugFactory(FSService)

  private readonly parentDirectory: string

  constructor(parentDirectory: string) {
    this.parentDirectory = parentDirectory
  }

  protected checkBundleName(bundleName: string): void {
    FSService.debugOut('checking bundle name if it\'s accepted')
    if (!ALLOWED_BUNDLE_NAME_REGEXP.test(bundleName)) {
      throw new CLIError(
        `'${bundleName}' is not a valid bundle name. Only alphanumeric characters, underscore and dash are allowed`
      )
    }
  }

  protected checkBundleDirectory(bundleName: string): void {
    FSService.debugOut('checking bundle directory if we have access')
    const bundleDir = this.getBundleDirectory(bundleName)

    try {
      fs.accessSync(this.parentDirectory, fs.constants.W_OK)
    } catch {
      throw new CLIError(
        `Directory ${this.parentDirectory} is not writable`
      )
    }

    FSService.debugOut('checking bundle directory it exists')
    if (fs.existsSync(bundleDir)) {
      throw new CLIError(`Directory ${bundleDir} already exists`)
    }
  }

  protected initGitRepo(name: string): void {
    FSService.debugOut(`initializing git repository with name ${name}`)
    try {
      // Using stdio 'pipe' option to print stderr only through CLIError
      cp.execSync(`git -C ${this.getBundleDirectory(name)} init`, { stdio: 'pipe' })
    } catch (error) {
      throw new CLIError(error as Error)
    }
  }

  protected removeGitInfo(name: string): void {
    FSService.debugOut(`removing origin git info directory (./.git) in bundle ${name}`)
    fs.rmSync(
      path.resolve(this.parentDirectory, `${name}/.git`),
      { recursive: true, force: true },
    );
  }

  protected getBundleDirectory(bundleName: string): string {
    return path.resolve(this.parentDirectory, bundleName)
  }

  protected getBundleFilePath(name: string, ...pathSegments: string[]): string {
    return path.resolve(this.getBundleDirectory(name), ...pathSegments)
  }

  protected createGitignore(bundleName: string): void {
    FSService.debugOut('creating .gitignore')
    this.createFileFromTemplate(
      this.getBundleFilePath(bundleName, '.gitignore'),
      'gitignore-template'
    )
  }

  protected createFileFromTemplate(filePath: string, templateFileName: string): void {
    const templateFileContent = fs.readFileSync(
      path.resolve(__dirname, '..', '..', 'resources', templateFileName)
    )
    fs.writeFileSync(filePath, templateFileContent)
  }

  protected createSubDirectoryIfNotExist(bundleName: string, ...subDirectories: string[]): void {
    if (!fs.existsSync(this.getBundleFilePath(bundleName, ...subDirectories))) {
      fs.mkdirSync(this.getBundleFilePath(bundleName, ...subDirectories))
    }
  }
}
