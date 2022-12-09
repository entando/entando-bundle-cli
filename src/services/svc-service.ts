import { CLIError } from '@oclif/errors'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { SVC_FOLDER } from '../paths'
import { BundleDescriptor } from '../models/bundle-descriptor'
import { BundleDescriptorService } from './bundle-descriptor-service'
import { DefaultSvcInitializerService } from './default-svc-initializer-service'
import {
  ProcessExecutorService,
  ProcessExecutionResult,
  ProcessExecutionOptions
} from './process-executor-service'

import { debugFactory } from './debug-factory-service'
import { EXIT_CODES } from '../utils'

enum DockerComposeCommand {
  UP = 'up --build -d',
  STOP = 'stop',
  RESTART = 'restart',
  LOGS = 'logs -f',
  RM = 'rm -f -s'
}
export class SvcService {
  private static debug = debugFactory(SvcService)
  private readonly parentDirectory: string
  private readonly configBin: string
  private readonly bundleDescriptorService: BundleDescriptorService
  private bundleDescriptor: BundleDescriptor

  private readonly serviceFileType = 'yml'

  constructor(configBin: string) {
    this.parentDirectory = process.cwd()
    this.configBin = configBin
    this.bundleDescriptorService = new BundleDescriptorService(
      this.parentDirectory
    )
    this.bundleDescriptor = this.bundleDescriptorService.getBundleDescriptor()
  }

  public getAllServices(): string[] {
    SvcService.debug('getting all services in svc folder')
    const existingServices = fs
      .readdirSync(path.resolve(this.parentDirectory, SVC_FOLDER))
      .filter(
        filename =>
          filename.slice(-1 * this.serviceFileType.length) ===
          this.serviceFileType
      )
      .map(filename => filename.slice(0, -4))
    return [
      ...new Set([
        ...DefaultSvcInitializerService.getDefaultServices(),
        ...existingServices
      ])
    ]
  }

  public getAvailableServices(): string[] {
    const activeServices = this.getEnabledServices()
    const allServices = this.getAllServices()
    return allServices.filter(service => !activeServices.includes(service))
  }

  public getEnabledServices(): string[] {
    return this.bundleDescriptor.svc || []
  }

  public enableService(service: string): void {
    SvcService.debug(`enabling service ${service}`)
    this.isServiceAvailable(service)

    const svc = this.getEnabledServices()

    if (svc.includes(service)) {
      throw new CLIError(`Service ${service} is already enabled`)
    }

    if (DefaultSvcInitializerService.getDefaultServices().includes(service)) {
      const defaultSvcService = new DefaultSvcInitializerService()
      defaultSvcService.initializeService(service)
    }

    svc.push(service)

    this.bundleDescriptor.svc = svc
    this.bundleDescriptorService.writeBundleDescriptor(this.bundleDescriptor)
  }

  public disableService(
    service: string,
    removeData: boolean
  ): Promise<ProcessExecutionResult> {
    SvcService.debug(`disabling service ${service}`)
    this.isServiceAvailable(service)

    const activeServices = this.getEnabledServices()

    if (!activeServices.includes(service)) {
      throw new CLIError(`Service ${service} is not enabled`)
    }

    if (removeData) {
      this.deleteServiceData(service)
    }

    const svc = activeServices.filter(
      currentService => currentService !== service
    )

    this.bundleDescriptor.svc = svc
    this.bundleDescriptorService.writeBundleDescriptor(this.bundleDescriptor)

    return this.executeDockerComposeCommand(DockerComposeCommand.RM, [service])
  }

  private deleteServiceData(service: string): void {
    const ymlPath = path.resolve(
      this.parentDirectory,
      SVC_FOLDER,
      `${service}.yml`
    )
    if (fs.existsSync(ymlPath)) {
      SvcService.debug(`removing svc file ${service}.yml`)
      fs.rmSync(ymlPath)
    }

    const folderPath = path.resolve(this.parentDirectory, SVC_FOLDER, service)

    if (fs.existsSync(folderPath)) {
      SvcService.debug(`removing svc folder ${service}`)
      fs.rmSync(folderPath, { recursive: true })
    }
  }

  public startServices(services: string[]): Promise<ProcessExecutionResult> {
    this.precheckEnabledServices(services)

    SvcService.debug(`starting service ${services.join(', ')}`)

    return this.executeDockerComposeCommand(DockerComposeCommand.UP, services)
  }

  public stopServices(services: string[]): Promise<ProcessExecutionResult> {
    this.precheckEnabledServices(services)

    SvcService.debug(`stopping service ${services.join(', ')}`)

    return this.executeDockerComposeCommand(DockerComposeCommand.STOP, services)
  }

  public restartServices(services: string[]): Promise<ProcessExecutionResult> {
    this.precheckEnabledServices(services)

    SvcService.debug(`restarting service ${services.join(', ')}`)

    return this.executeDockerComposeCommand(
      DockerComposeCommand.RESTART,
      services
    )
  }

  public logServices(services: string[]): Promise<ProcessExecutionResult> {
    this.precheckEnabledServices(services)

    SvcService.debug(`logging service ${services.join(', ')}`)

    return this.executeDockerComposeCommand(DockerComposeCommand.LOGS, services)
  }

  private async executeDockerComposeCommand(
    serviceType: DockerComposeCommand,
    services: string[]
  ): Promise<ProcessExecutionResult> {
    let COMPOSE_COMMAND = `docker compose > /dev/null 2>&1`
    const COMPOSE_OPTIONS = ` -p ${this.bundleDescriptor.name} ${services
      .map(service => `-f ${SVC_FOLDER}/${service}.yml`)
      .join(' ')} ${serviceType} ${services
      .map(service => `${service}`)
      .join(' ')}`

    const options: ProcessExecutionOptions = {
      command: COMPOSE_COMMAND,
      outputStream:
        serviceType === DockerComposeCommand.LOGS
          ? process.stdout
          : SvcService.debug.outputStream,
      errorStream:
        serviceType === DockerComposeCommand.LOGS
          ? process.stdout
          : SvcService.debug.outputStream,
      workDir: this.parentDirectory
    }

    // detects the presence docker-compose-plugin
    SvcService.debug(`detecting the presence of docker-compose-plugin`)
    const code = await ProcessExecutorService.executeProcess(options)
    let foundcomposeplugin

    code === EXIT_CODES.GENERIC_ERROR
      ? ((COMPOSE_COMMAND = `docker-compose`), (foundcomposeplugin = false))
      : ((COMPOSE_COMMAND = `docker compose`), (foundcomposeplugin = true))

    SvcService.debug(`docker-compose-plugin found: ${foundcomposeplugin}`)

    const cmd = `${COMPOSE_COMMAND}${COMPOSE_OPTIONS}`

    return ProcessExecutorService.executeProcess({ ...options, command: cmd })
  }

  private precheckEnabledServices(services: string[]): void {
    const activeServices = this.getEnabledServices()

    if (services.length === 0) {
      throw new CLIError(
        `There are no enabled services. Please enable a service using the command: ${this.configBin} svc enable <your_service_yml>`
      )
    }

    const serviceNotFound = services.filter(
      service => !activeServices.includes(service)
    )
    if (serviceNotFound.length > 0) {
      const addS = serviceNotFound.length > 1
      throw new CLIError(
        `Service${addS ? 's' : ''} ${serviceNotFound.join(', ')} ${
          addS ? 'are' : 'is'
        } not enabled. Please check the enabled services with command: ${
          this.configBin
        } svc list`
      )
    }
  }

  private isServiceAvailable(service: string): void {
    if (!this.getAllServices().includes(service)) {
      throw new CLIError(
        `Service ${service} does not exist. Please check the list available services with command: ${this.configBin} svc list --available`
      )
    }
  }
}
