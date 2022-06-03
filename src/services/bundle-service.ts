import { CLIError } from '@oclif/errors'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { BUNDLE_DESCRIPTOR_FILE_NAME } from '../paths'
import { BundleDescriptorValidatorService } from './bundle-descriptor-validator-service'

export class BundleService {
  public static isBundleInitialized(bundleDir: string): boolean {
    return BundleService.descriptorExists(bundleDir)
  }

  public static verifyBundleInitialized(bundleDir: string): void {
    if (!BundleService.isBundleInitialized(bundleDir)) {
      throw new CLIError(`${bundleDir} is not an initialized Bundle project`)
    }

    BundleService.verifyBundleDescriptorStructure(bundleDir)
  }

  private static descriptorExists(bundleDir: string): boolean {
    const descriptorPath: string = path.resolve(
      bundleDir,
      BUNDLE_DESCRIPTOR_FILE_NAME
    )
    return fs.existsSync(descriptorPath)
  }

  private static verifyBundleDescriptorStructure(bundleDir: string): void {
    const descriptorPath = path.resolve(bundleDir, BUNDLE_DESCRIPTOR_FILE_NAME)
    const descriptorFileContent = fs.readFileSync(descriptorPath, 'utf-8')
    const parsedDescriptor: any = JSON.parse(descriptorFileContent)
    try {
      BundleDescriptorValidatorService.validateParsedBundleDescriptor(
        parsedDescriptor
      )
    } catch (error) {
      throw new CLIError(
        BUNDLE_DESCRIPTOR_FILE_NAME +
          ' is not valid.\n' +
          (error as Error).message
      )
    }
  }
}
