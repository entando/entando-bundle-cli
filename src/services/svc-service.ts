import { CLIError } from '@oclif/errors'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { SVC_FOLDER } from '../paths'
import { BundleDescriptor } from '../models/bundle-descriptor'
import { BundleDescriptorService } from './bundle-descriptor-service'
import { FSService } from './fs-service'

export class SvcService {
  private readonly parentDirectory: string
  private readonly bundleDescriptorService: BundleDescriptorService
  private readonly bundleDescriptor: BundleDescriptor
  private readonly filesys: FSService

  constructor(parentDirectory: string) {
    this.parentDirectory = parentDirectory
    this.bundleDescriptorService = new BundleDescriptorService(parentDirectory)
    this.bundleDescriptor = this.bundleDescriptorService.getBundleDescriptor()
    this.filesys = new FSService(this.bundleDescriptor.name, parentDirectory)
  }

  public getAvailableServices(): string[] {
    return fs
      .readdirSync(path.resolve(this.parentDirectory, SVC_FOLDER))
      .filter(filename => filename.slice(-3) === 'yml')
      .map(filename => filename.slice(0, -4))
  }

  public enableService(service: string): void {
    if (!this.isServiceAvailable(service)) {
      throw new CLIError(`Service ${service} does not exist`)
    }

    const svc = this.bundleDescriptor.svc || []

    if (svc.includes(service)) {
      throw new CLIError(`Service ${service} is already enabled`)
    }

    svc.push(service)

    this.bundleDescriptorService.writeBundleDescriptor({
      ...this.bundleDescriptor,
      svc
    })
  }

  private isServiceAvailable(service: string): boolean {
    return this.getAvailableServices().includes(service)
  }
}
