import * as path from 'node:path'
import * as fs from 'node:fs'
import { CLIError } from '@oclif/errors'
import { BundleDescriptor, Microservice } from '../models/bundle-descriptor'
import { BundleDescriptorService } from './bundle-descriptor-service'
import { ComponentService } from './component-service'
import {
  ComponentType,
  DEFAULT_VERSION,
  MicroserviceStack
} from '../models/component'
import {
  ALLOWED_NAME_REGEXP,
  INVALID_NAME_MESSAGE,
  MAX_NAME_LENGTH
} from '../models/bundle-descriptor-constraints'
import { MICROSERVICES_FOLDER } from '../paths'
import { FSService } from './fs-service'

const DEFAULT_HEALTH_CHECK_PATH = '/api/health'

export class MicroserviceService {
  private readonly microservicesPath: string
  private readonly bundleDescriptorService: BundleDescriptorService
  private readonly componentService: ComponentService

  constructor(bundleDirectory: string = process.cwd()) {
    this.bundleDescriptorService = new BundleDescriptorService(bundleDirectory)
    this.componentService = new ComponentService(bundleDirectory)
    this.microservicesPath = path.resolve(bundleDirectory, MICROSERVICES_FOLDER)
  }

  public addMicroservice(ms: Microservice): void {

    if (this.componentService.componentExists(ms.name)) {
      throw new CLIError(
        `A component (microservice or micro frontend) with name ${ms.name} already exists`
      )
    }

    if (!ALLOWED_NAME_REGEXP.test(ms.name)) {
      throw new CLIError(
        `'${ms.name}' is not a valid microservice name. ${INVALID_NAME_MESSAGE}`
      )
    }

    if (ms.name.length > MAX_NAME_LENGTH) {
      throw new CLIError(
        `Microservice name is too long. The maximum length is ${MAX_NAME_LENGTH}`
      )
    }

    FSService.removeGitKeepFile(this.microservicesPath)
    this.createMicroserviceDirectory(ms.name)

    this.addMicroserviceDescriptor({
      ...ms,
      healthCheckPath: ms.healthCheckPath ?? DEFAULT_HEALTH_CHECK_PATH
    })
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

    if (microservices.length === 0) {
      FSService.addGitKeepFile(this.microservicesPath)
    }

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

    if (ms.stack === MicroserviceStack.Custom) {
      ms.commands = ComponentService.getPreFilledCommands()
      ms.version = DEFAULT_VERSION
    }

    const updatedBundleDescriptor: BundleDescriptor = {
      ...bundleDescriptor,
      microservices: [...microservices, ms]
    }

    this.bundleDescriptorService.writeBundleDescriptor(updatedBundleDescriptor)
  }
}
