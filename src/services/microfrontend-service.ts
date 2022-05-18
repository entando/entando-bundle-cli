import * as path from 'node:path'
import * as fs from 'node:fs'
import { CLIError } from '@oclif/errors'
import { BundleDescriptor, MicroFrontend } from '../models/bundle-descriptor'
import BundleDescriptorService from './bundle-descriptor-service'

const MICROFRONTENDS_DIRNAME = 'microfrontends'
const ALLOWED_MFE_NAME_REGEXP = /^[\w-]+$/

export class MicroFrontendService {
  private readonly microfrontendsPath: string
  private readonly bundleDescriptorService: BundleDescriptorService

  constructor() {
    this.microfrontendsPath = path.resolve(
      process.cwd(),
      MICROFRONTENDS_DIRNAME
    )
    this.bundleDescriptorService = new BundleDescriptorService(process.cwd())
  }

  public addMicroFrontend(mfe: MicroFrontend): void {
    if (!ALLOWED_MFE_NAME_REGEXP.test(mfe.name)) {
      throw new CLIError(
        `'${mfe.name}' is not a valid Micro Frontend name. Only alphanumeric characters, underscore and dash are allowed`
      )
    }

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
      this.bundleDescriptorService.getBundleDescriptor()
    const { microfrontends } = bundleDescriptor

    if (microfrontends.some(({ name }) => name === mfe.name)) {
      throw new CLIError(
        `${mfe.name} already exists in the microfrontends section of the Bundle descriptor`
      )
    }

    const updatedBundleDescriptor: BundleDescriptor = {
      ...bundleDescriptor,
      microfrontends: [...microfrontends, mfe]
    }

    this.bundleDescriptorService.writeBundleDescriptor(updatedBundleDescriptor)
  }
}