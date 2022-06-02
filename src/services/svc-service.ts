import { CLIError } from '@oclif/errors'
import * as cp from 'node:child_process'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { SVC_FOLDER } from '../paths'
import { BundleDescriptor } from '../models/bundle-descriptor'
import { BundleDescriptorService } from './bundle-descriptor-service'

import { debugFactory } from './debug-factory-service'

export class SvcService {
  private static debug = debugFactory(SvcService)
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
    SvcService.debug('getting all services in svc folder')
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
    SvcService.debug(`enabling service ${service}`)
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
    SvcService.debug(`disabling service ${service}`)
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

  public startServices(services: string[]): void {
    const activeServices = this.getActiveServices()
    const servicesToRun = services.length > 0 ? services : activeServices

    if (servicesToRun.length === 0) {
      throw new CLIError(
        'There are no enabled services. Please activate a service using the command: <%= config.bin %> enable <your_service_yml>'
      )
    }

    const serviceNotFound = servicesToRun.filter(service => !activeServices.includes(service))
    if (serviceNotFound.length > 0) {
      const addS = serviceNotFound.length > 1
      throw new CLIError(
        `Service${addS ? 's' : ''} ${serviceNotFound.join(', ')} ${addS ? 'are' : 'is'} not enabled. Please check the enabled services with command: <%= config.bin %> list`
      )
    }

    SvcService.debug(`starting service ${servicesToRun.join(', ')}`)

    try {
      cp.execSync(`docker-compose -p ${this.bundleDescriptor.name} ${servicesToRun.map(service => `-f ${path.resolve(this.parentDirectory, SVC_FOLDER, `${service}.yml`)}`).join(' ')} up --build -d`, {
        stdio: 'pipe'
      })
    } catch (error) {
      throw new CLIError(error as Error)
    }
  }

  private isServiceAvailable(service: string): void {
    if (!this.getAllServices().includes(service)) {
      throw new CLIError(
        `Service ${service} does not exist. Please check the list available services with command: <%= config.bin %> list --available`
      )
    }
  }
}
