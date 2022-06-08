import { BundleDescriptor } from '../models/bundle-descriptor'
import * as path from 'node:path'
import * as fs from 'node:fs'
import { FSService } from './fs-service'
import { BUNDLE_DESCRIPTOR_FILE_NAME } from '../paths'
import { CLIError } from '@oclif/errors'
import { ConstraintsValidatorService } from './constraints-validator-service'
import { BUNDLE_DESCRIPTOR_CONSTRAINTS } from '../models/bundle-descriptor-constraints'
import { ComponentService } from './component-service'

export const MISSING_DESCRIPTOR_ERROR =
  'Bundle descriptor not found. Is this an initialized Bundle project?'

type MandatoryBundleFields = { name: string; version: string; type: string }

export class BundleDescriptorService {
  private readonly bundleFilePath: string

  constructor(bundleDirectory: string) {
    this.bundleFilePath = path.resolve(
      bundleDirectory,
      BUNDLE_DESCRIPTOR_FILE_NAME
    )
  }

  public createBundleDescriptor(
    fieldsToAdd: Partial<BundleDescriptor> & MandatoryBundleFields
  ): void {
    const defaultValues = {
      microservices: [],
      microfrontends: [],
      svc: []
    }
    const bundleDescriptor = { ...defaultValues, ...fieldsToAdd }
    this.writeBundleDescriptor(bundleDescriptor)
  }

  public getBundleDescriptor(): BundleDescriptor {
    return JSON.parse(
      fs.readFileSync(this.bundleFilePath, 'utf-8')
    ) as BundleDescriptor
  }

  public writeBundleDescriptor(bundleDescriptor: BundleDescriptor): void {
    FSService.writeJSON(this.bundleFilePath, bundleDescriptor)
  }

  public validateBundleDescriptor(): void {
    if (!fs.existsSync(this.bundleFilePath)) {
      throw new CLIError(MISSING_DESCRIPTOR_ERROR)
    }

    const descriptorFileContent = fs.readFileSync(this.bundleFilePath, 'utf-8')
    try {
      const parsedDescriptor: any = JSON.parse(descriptorFileContent)
      ConstraintsValidatorService.validateObjectConstraints(
        parsedDescriptor,
        BUNDLE_DESCRIPTOR_CONSTRAINTS
      )
      new ComponentService().checkDuplicatedComponentNames()
    } catch (error) {
      throw new CLIError(
        BUNDLE_DESCRIPTOR_FILE_NAME +
          ' is not valid.\n' +
          (error as Error).message
      )
    }
  }
}
