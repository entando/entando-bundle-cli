import { CLIError } from '@oclif/errors'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { SVC_FOLDER } from '../paths'
import { BundleDescriptor } from '../models/bundle-descriptor'
import { BundleDescriptorService } from './bundle-descriptor-service'

export class SvcService {
  private readonly parentDirectory: string
  private readonly bundleDescriptorService: BundleDescriptorService
  private readonly bundleDescriptor: BundleDescriptor

  private readonly serviceFileType = 'yml'

  constructor(parentDirectory: string) {
    this.parentDirectory = parentDirectory
    this.bundleDescriptorService = new BundleDescriptorService(parentDirectory)
    this.bundleDescriptor = this.bundleDescriptorService.getBundleDescriptor()
  }

  public getAllServices(): string[] {
    return fs
      .readdirSync(path.resolve(this.parentDirectory, SVC_FOLDER))
      .filter(
        filename =>
          filename.slice(-1 * this.serviceFileType.length) ===
          this.serviceFileType
      )
      .map(filename => filename.slice(0, -4))
  }

  public getAvailableServices(): string[] {
    const activeServices = this.getActiveServices()
    const allServices = this.getAllServices()
    return allServices.filter(service => !activeServices.includes(service))
  }

  public getActiveServices(): string[] {
    return this.bundleDescriptor.svc || []
  }

  public enableService(service: string): void {
    this.isServiceAvailable(service)

    const svc = this.getActiveServices()

    if (svc.includes(service)) {
      throw new CLIError(`Service ${service} is already enabled`)
    }

    svc.push(service)

    this.bundleDescriptorService.writeBundleDescriptor({
      ...this.bundleDescriptor,
      svc
    })
  }

  public disableService(service: string): void {
    this.isServiceAvailable(service)

    const activeServices = this.getActiveServices()

    if (!activeServices.includes(service)) {
      throw new CLIError(`Service ${service} is not enabled`)
    }

    const svc = activeServices.filter(
      currentService => currentService !== service
    )

    this.bundleDescriptorService.writeBundleDescriptor({
      ...this.bundleDescriptor,
      svc
    })
  }

  private isServiceAvailable(service: string): void {
    if (!this.getAllServices().includes(service)) {
      throw new CLIError(
        `Service ${service} does not exist. Please check the list available services with command: <%= config.bin %> list --available`
      )
    }
  }
}
