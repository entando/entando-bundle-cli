import * as path from 'node:path'
import * as fs from 'node:fs'
import { CLIError } from '@oclif/errors'
import { BundleDescriptor, Microservice } from '../models/bundle-descriptor'
import { BundleDescriptorService } from './bundle-descriptor-service'
import { ComponentService } from './component-service'
import { ComponentType } from '../models/component'

const MICROSERVICES_DIRNAME = 'microservices'
const ALLOWED_MS_NAME_REGEXP = /^[\w-]+$/

export class MicroserviceService {
  private readonly microservicesPath: string
  private readonly bundleDescriptorService: BundleDescriptorService
  private readonly componentService: ComponentService

  constructor() {
    this.microservicesPath = path.resolve(process.cwd(), MICROSERVICES_DIRNAME)
    this.bundleDescriptorService = new BundleDescriptorService(process.cwd())
    this.componentService = new ComponentService()
  }

  public addMicroservice(ms: Microservice): void {
    const componentService = new ComponentService()

    if (componentService.componentExists(ms.name)) {
      throw new CLIError(
        `A component (microservice or micro frontend) with name ${ms.name} already exists`
      )
    }

    if (!ALLOWED_MS_NAME_REGEXP.test(ms.name)) {
      throw new CLIError(
        `'${ms.name}' is not a valid microservice name. Only alphanumeric characters, underscore and dash are allowed`
      )
    }

    this.createMicroserviceDirectory(ms.name)

    this.addMicroserviceDescriptor(ms)
  }

  public removeMicroservice(name: string): void {
    const bundleDescriptor: BundleDescriptor =
      this.bundleDescriptorService.getBundleDescriptor()

    const { microservices } = bundleDescriptor
    const msIndex = microservices.findIndex(ms => ms.name === name)

    if (msIndex === -1) {
      throw new CLIError(`Microservice ${name} not found in Bundle descriptor`)
    }

    const ms = microservices[msIndex]
    const msDir = path.resolve(this.microservicesPath, name)
    fs.rmSync(msDir, { recursive: true, force: true })

    microservices.splice(msIndex, 1)

    this.bundleDescriptorService.writeBundleDescriptor(bundleDescriptor)

    this.componentService.removeOutputDescriptor({
      ...ms,
      type: ComponentType.MICROSERVICE
    })
  }

  private createMicroserviceDirectory(name: string) {
    const newMsDir: string = path.resolve(this.microservicesPath, name)

    if (fs.existsSync(newMsDir)) {
      throw new CLIError(`Directory ${newMsDir} already exists`)
    }

    fs.mkdirSync(newMsDir)
  }

  private addMicroserviceDescriptor(ms: Microservice): void {
    const bundleDescriptor: BundleDescriptor =
      this.bundleDescriptorService.getBundleDescriptor()
    const { microservices } = bundleDescriptor

    const updatedBundleDescriptor: BundleDescriptor = {
      ...bundleDescriptor,
      microservices: [...microservices, ms]
    }

    this.bundleDescriptorService.writeBundleDescriptor(updatedBundleDescriptor)
  }
}
