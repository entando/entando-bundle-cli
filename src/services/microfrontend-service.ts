import * as path from 'node:path'
import * as fs from 'node:fs'
import { CLIError } from '@oclif/errors'
import { BundleDescriptor, MicroFrontend } from '../models/bundle-descriptor'
import { BundleDescriptorService } from './bundle-descriptor-service'
import { MICROFRONTENDS_FOLDER } from '../paths'

const ALLOWED_MFE_NAME_REGEXP = /^[\w-]+$/
const DEFAULT_PUBLIC_FOLDER = 'public'

export class MicroFrontendService {
  private readonly microfrontendsPath: string
  private readonly bundleDescriptorService: BundleDescriptorService

  constructor() {
    this.microfrontendsPath = path.resolve(process.cwd(), MICROFRONTENDS_FOLDER)
    this.bundleDescriptorService = new BundleDescriptorService(process.cwd())
  }

  public addMicroFrontend(mfe: MicroFrontend): void {
    if (!ALLOWED_MFE_NAME_REGEXP.test(mfe.name)) {
      throw new CLIError(
        `'${mfe.name}' is not a valid Micro Frontend name. Only alphanumeric characters, underscore and dash are allowed`
      )
    }

    this.createMicroFrontendDirectory(mfe.name)

    this.addMicroFrontendDescriptor({
      ...mfe,
      publicFolder: DEFAULT_PUBLIC_FOLDER
    })
  }

  public getMicroFrontend(mfeName: string): MicroFrontend {
    const mfe = this.findMicroFrontend(mfeName)

    if (!mfe) {
      throw new CLIError(
        `${mfeName} does not exist in the microfrontends section of the Bundle descriptor`
      )
    }

    return mfe
  }

  public findMicroFrontend(mfeName: string): MicroFrontend | undefined {
    const bundleDescriptor: BundleDescriptor =
      this.bundleDescriptorService.getBundleDescriptor()
    const { microfrontends } = bundleDescriptor

    return microfrontends.find(({ name }) => name === mfeName)
  }

  public removeMicroFrontend(mfeName: string): void {
    const mfe: MicroFrontend = this.getMicroFrontend(mfeName)

    const bundleDescriptor: BundleDescriptor =
      this.bundleDescriptorService.getBundleDescriptor()

    const updatedBundleDescriptor: BundleDescriptor = {
      ...bundleDescriptor,
      microfrontends: bundleDescriptor.microfrontends.filter(
        ({ name }) => name !== mfe.name
      )
    }

    this.removeMicroFrontendDirectory(mfeName)

    this.bundleDescriptorService.writeBundleDescriptor(updatedBundleDescriptor)
  }

  public getPublicFolderPath(mfeName: string): string {
    const mfe: MicroFrontend = this.getMicroFrontend(mfeName)

    return path.resolve(this.microfrontendsPath, mfeName, mfe.publicFolder)
  }

  private createMicroFrontendDirectory(name: string) {
    const newMfeDir: string = path.resolve(this.microfrontendsPath, name)

    if (fs.existsSync(newMfeDir)) {
      throw new CLIError(`Directory ${newMfeDir} already exists`)
    }

    fs.mkdirSync(newMfeDir)
  }

  private removeMicroFrontendDirectory(name: string) {
    const mfedir: string = path.resolve(this.microfrontendsPath, name)

    if (!fs.existsSync(mfedir)) {
      throw new CLIError(`Directory ${mfedir} does not exist`)
    }

    fs.rmSync(mfedir, { recursive: true, force: true })
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
