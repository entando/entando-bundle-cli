import * as path from 'node:path'
import * as fs from 'node:fs'
import { CLIError } from '@oclif/errors'
import { BundleDescriptor, MicroService } from '../models/bundle-descriptor'
import BundleDescriptorService from './bundle-descriptor-service'

const MICROSERVICES_DIRNAME = 'microservices'
const ALLOWED_MS_NAME_REGEXP = /^[\w-]+$/

export class MicroServiceService {
  private readonly microservicesPath: string
  private readonly bundleDescriptorService: BundleDescriptorService

  constructor() {
    this.microservicesPath = path.resolve(process.cwd(), MICROSERVICES_DIRNAME)
    this.bundleDescriptorService = new BundleDescriptorService(process.cwd())
  }

  public addMicroService(ms: MicroService): void {
    if (!ALLOWED_MS_NAME_REGEXP.test(ms.name)) {
      throw new CLIError(
        `'${ms.name}' is not a valid Micro Service name. Only alphanumeric characters, underscore and dash are allowed`
      )
    }

    this.createMicroServiceDirectory(ms.name)

    this.addMicroServiceDescriptor(ms)
  }

  private createMicroServiceDirectory(name: string) {
    const newMfeDir: string = path.resolve(this.microservicesPath, name)

    if (fs.existsSync(newMfeDir)) {
      throw new CLIError(`Directory ${newMfeDir} already exists`)
    }

    fs.mkdirSync(newMfeDir)
  }

  private addMicroServiceDescriptor(ms: MicroService): void {
    const bundleDescriptor: BundleDescriptor =
      this.bundleDescriptorService.getBundleDescriptor()
    const { microservices } = bundleDescriptor

    if (microservices.some(({ name }) => name === ms.name)) {
      throw new CLIError(
        `${ms.name} already exists in the microservices section of the Bundle descriptor`
      )
    }

    const updatedBundleDescriptor: BundleDescriptor = {
      ...bundleDescriptor,
      microservices: [...microservices, ms]
    }

    this.bundleDescriptorService.writeBundleDescriptor(updatedBundleDescriptor)
  }
}
