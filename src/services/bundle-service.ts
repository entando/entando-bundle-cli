import { CLIError } from '@oclif/errors'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { BundleDescriptor } from '../models/bundle-descriptor'
import { BUNDLE_DESCRIPTOR_CONSTRAINTS } from '../models/bundle-descriptor-constraints'
import { BUNDLE_DESCRIPTOR_FILE_NAME } from '../paths'
import { ConstraintsValidatorService } from './constraints-validator-service'

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
    try {
      const parsedDescriptor: any = JSON.parse(descriptorFileContent)
      const bundleDescriptor =
        ConstraintsValidatorService.validateObjectConstraints(
          parsedDescriptor,
          BUNDLE_DESCRIPTOR_CONSTRAINTS
        )
      BundleService.checkDuplicatedComponentNames(bundleDescriptor)
    } catch (error) {
      throw new CLIError(
        BUNDLE_DESCRIPTOR_FILE_NAME +
          ' is not valid.\n' +
          (error as Error).message
      )
    }
  }

  private static checkDuplicatedComponentNames(
    bundleDescriptor: BundleDescriptor
  ) {
    const allNames = [
      ...bundleDescriptor.microfrontends.map(mfe => mfe.name),
      ...bundleDescriptor.microservices.map(ms => ms.name)
    ]

    const duplicates = allNames.filter(
      (item, index) => allNames.indexOf(item) !== index
    )

    if (duplicates.length > 0) {
      throw new Error(
        'Components names should be unique. Duplicates found: ' +
          [...new Set(duplicates)].join(', ')
      )
    }
  }
}
