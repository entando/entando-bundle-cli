import { BundleDescriptor } from '../models/bundle-descriptor'
import * as path from 'node:path'
import * as fs from 'node:fs'
import { FileHelper } from '../helpers/file-helper'

const BUNDLE_DESCRIPTOR_FILE_NAME = 'bundle.json'

type MandatoryBundleFields = { name: string; version: string }

export default class BundleDescriptorService {
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
      microfrontends: []
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
    FileHelper.writeJSON(this.bundleFilePath, bundleDescriptor)
  }
}
