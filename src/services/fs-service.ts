import { CLIError } from '@oclif/errors'
import * as fs from 'node:fs'
import * as path from 'node:path'

const ALLOWED_BUNDLE_NAME_REGEXP = /^[\w-]+$/

export default class FSService {
  private readonly parentDirectory: string

  constructor(parentDirectory: string) {
    this.parentDirectory = parentDirectory
  }

  protected checkBundleName(bundleName: string): void {
    if (!ALLOWED_BUNDLE_NAME_REGEXP.test(bundleName)) {
      throw new CLIError(
        `'${bundleName}' is not a valid bundle name. Only alphanumeric characters, underscore and dash are allowed`
      )
    }
  }

  protected checkBundleDirectory(bundleName: string): void {
    const bundleDir = this.getBundleDirectory(bundleName)

    try {
      fs.accessSync(this.parentDirectory, fs.constants.W_OK)
    } catch {
      throw new CLIError(
        `Directory ${this.parentDirectory} is not writable`
      )
    }

    if (fs.existsSync(bundleDir)) {
      throw new CLIError(`Directory ${bundleDir} already exists`)
    }
  }

  protected getBundleDirectory(bundleName: string): string {
    return path.resolve(this.parentDirectory, bundleName)
  }
}
