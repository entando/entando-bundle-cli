import { CLIError } from '@oclif/errors'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { BUNDLE_DESCRIPTOR_FILE_NAME } from '../paths'

export class BundleService {
  public static isBundleInitialized(bundleDir: string): boolean {
    return BundleService.descriptorExists(bundleDir)
  }

  public static verifyBundleInitialized(bundleDir: string): void {
    if (!BundleService.isBundleInitialized(bundleDir)) {
      throw new CLIError(`${bundleDir} is not an initialized Bundle project`)
    }
  }

  private static descriptorExists(bundleDir: string): boolean {
    const descriptorPath: string = path.resolve(bundleDir, BUNDLE_DESCRIPTOR_FILE_NAME)
    return fs.existsSync(descriptorPath)
  }
}
