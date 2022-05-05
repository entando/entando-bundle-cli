import { CLIError } from '@oclif/errors'
import * as fs from 'node:fs'
import * as path from 'node:path'

export default class BundleService {
  public static isBundleInitialized(bundleDir: string): boolean {
    return BundleService.descriptorExists(bundleDir)
  }

  public static verifyBundleInitialized(bundleDir: string): void {
    if (!BundleService.isBundleInitialized(bundleDir)) {
      throw new CLIError(`${bundleDir} is not an initialized bundle project`)
    }
  }

  private static descriptorExists(bundleDir: string): boolean {
    const descriptorPath: string = path.resolve(bundleDir, 'bundle.json')
    return fs.existsSync(descriptorPath)
  }
}
