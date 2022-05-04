import * as path from 'node:path'
import * as fs from 'node:fs'
import { CLIError } from '@oclif/errors'
import { BundleDescriptor, MicroFrontend } from '../models/bundle-descriptor'
import BundleDescriptorManager from './bundle-descriptor-manager'

const MICROFRONTENDS_DIRNAME = 'microfrontends'

export default class MicroFrontendsManager {
  private readonly microfrontendsPath: string
  private readonly bundleDescriptorManager: BundleDescriptorManager

  constructor() {
    this.microfrontendsPath = path.resolve(
      process.cwd(),
      MICROFRONTENDS_DIRNAME
    )
    this.bundleDescriptorManager = new BundleDescriptorManager(process.cwd())
  }

  public addMicroFrontend(mfe: MicroFrontend): void {
    this.createMicroFrontendDirectory(mfe.name)

    this.addMicroFrontendDescriptor(mfe)
  }

  private createMicroFrontendDirectory(name: string) {
    const newMfeDir: string = path.resolve(this.microfrontendsPath, name)

    if (fs.existsSync(newMfeDir)) {
      throw new CLIError(`Directory ${newMfeDir} already exists`)
    }

    fs.mkdirSync(newMfeDir)
  }

  private addMicroFrontendDescriptor(mfe: MicroFrontend): void {
    const bundleDescriptor: BundleDescriptor =
      this.bundleDescriptorManager.getBundleDescriptor()
    const updatedBundleDescriptor: BundleDescriptor = {
      ...bundleDescriptor,
      microfrontends: [...bundleDescriptor.microfrontends, mfe]
    }

    this.bundleDescriptorManager.writeBundleDescriptor(updatedBundleDescriptor)
  }
}
