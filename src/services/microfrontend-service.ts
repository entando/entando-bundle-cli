import * as path from 'node:path'
import * as fs from 'node:fs'
import { CLIError } from '@oclif/errors'
import { BundleDescriptor, MicroFrontend } from '../models/bundle-descriptor'
import { BundleDescriptorService } from './bundle-descriptor-service'
import { DockerService } from './docker-service'

const MICROFRONTENDS_DIRNAME = 'microfrontends'
const ALLOWED_MFE_NAME_REGEXP = /^[\w-]+$/

export class MicroFrontendService {
  private readonly bundleDir: string
  private readonly microfrontendsPath: string
  private readonly bundleDescriptorService: BundleDescriptorService

  constructor() {
    this.bundleDir = process.cwd()
    this.microfrontendsPath = path.resolve(
      this.bundleDir,
      MICROFRONTENDS_DIRNAME
    )
    this.bundleDescriptorService = new BundleDescriptorService(this.bundleDir)
  }

  public addMicroFrontend(mfe: MicroFrontend): void {
    if (!ALLOWED_MFE_NAME_REGEXP.test(mfe.name)) {
      throw new CLIError(
        `'${mfe.name}' is not a valid Micro Frontend name. Only alphanumeric characters, underscore and dash are allowed`
      )
    }

    this.createMicroFrontendDirectory(mfe.name)

    DockerService.addMicroFrontEndToDockerfile(this.bundleDir, mfe.name)

    this.addMicroFrontendDescriptor(mfe)
  }

  public findMicroFrontend(mfeName: string): MicroFrontend {
    const bundleDescriptor: BundleDescriptor =
      this.bundleDescriptorService.getBundleDescriptor()
    const { microfrontends } = bundleDescriptor

    const mfe = microfrontends.find(({ name }) => name === mfeName)

    if (!mfe) {
      throw new CLIError(
        `${mfeName} does not exist in the microfrontends section of the Bundle descriptor`
      )
    }

    return mfe
  }

  public removeMicroFrontend(mfeName: string): void {
    const bundleDescriptor: BundleDescriptor =
      this.bundleDescriptorService.getBundleDescriptor()
    const { microfrontends } = bundleDescriptor

    const updatedBundleDescriptor: BundleDescriptor = {
      ...bundleDescriptor,
      microfrontends: microfrontends.filter(({ name }) => name !== mfeName)
    }

    this.removeMicroFrontendDirectory(mfeName)

    DockerService.removeMicroFrontendFromDockerfile(this.bundleDir, mfeName)

    this.bundleDescriptorService.writeBundleDescriptor(updatedBundleDescriptor)
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

    fs.rmSync(mfedir, { recursive: true })
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
