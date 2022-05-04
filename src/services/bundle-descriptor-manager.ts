import { BundleDescriptor } from "../models/bundle-descriptor"
import * as path from "node:path"
import * as fs from "node:fs"

const BUNDLE_DESCRIPTOR_FILE_NAME = "bundle.json"
const BUNDLE_DESCRIPTOR_INDENTATION_SPACES = 4

type MandatoryBundleFields = { name: string; version: string }

export default class BundleDescriptorManager {
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
      fs.readFileSync(this.bundleFilePath, "utf-8")
    ) as BundleDescriptor
  }

  public writeBundleDescriptor(bundleDescriptor: BundleDescriptor): void {
    fs.writeFileSync(
      this.bundleFilePath,
      JSON.stringify(
        bundleDescriptor,
        null,
        BUNDLE_DESCRIPTOR_INDENTATION_SPACES
      )
    )
  }
}
