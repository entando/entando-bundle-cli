import * as fs from 'node:fs'
import * as path from 'node:path'
import { FSService } from './fs-service'
import { RESOURCES_FOLDER, SVC_FOLDER } from '../paths'
import { debugFactory } from './debug-factory-service'
import { BundleDescriptor } from '../models/bundle-descriptor'
import { BundleDescriptorService } from './bundle-descriptor-service'

const defaultSvcPrefix = 'default-'

export class DefaultSvcInitializerService {
  private static debug = debugFactory(DefaultSvcInitializerService)
  public static getDefaultServices(): string[] {
    return fs
      .readdirSync(path.resolve(__dirname, '..', RESOURCES_FOLDER, SVC_FOLDER))
      .filter(filename => filename.slice(-3) === 'yml')
      .map(filename => filename.replace(defaultSvcPrefix, '').slice(0, -4))
  }

  private readonly parentDirectory: string
  private readonly filesys: FSService
  private readonly bundleDescriptorService: BundleDescriptorService
  private readonly bundleDescriptor: BundleDescriptor
  private templateVariables: { [key: string]: string } = {}

  constructor() {
    this.parentDirectory = process.cwd()
    this.bundleDescriptorService = new BundleDescriptorService(
      this.parentDirectory
    )
    this.bundleDescriptor = this.bundleDescriptorService.getBundleDescriptor()
    this.filesys = new FSService(
      path.basename(process.cwd()),
      path.dirname(process.cwd())
    )
    this.initializeTemplateVariables()
  }

  private initializeTemplateVariables() {
    const dockerImages = require('../../package.json').org_entando_dependencies

    this.templateVariables = {
      '%BUNDLENAME%': this.bundleDescriptor.name
    }

    for (const [key, value] of Object.entries(dockerImages)) {
      const k = `%${key.toUpperCase()}_DOCKER_IMAGE%`
      this.templateVariables[k] = value as string
    }
  }

  public createYamlFile(service: string): void {
    DefaultSvcInitializerService.debug(`creating svc file ${service}`)
    this.filesys.createFileFromTemplate(
      [this.parentDirectory, SVC_FOLDER, `${service}.yml`],
      path.join(
        __dirname,
        '..',
        RESOURCES_FOLDER,
        SVC_FOLDER,
        `${defaultSvcPrefix}${service}.yml`
      ),
      this.templateVariables
    )
    const supportSourceFolderPath = path.join(
      __dirname,
      '..',
      RESOURCES_FOLDER,
      SVC_FOLDER,
      service
    )
    const supportDestFolderPath = path.join(
      this.parentDirectory,
      SVC_FOLDER,
      service
    )

    if (fs.existsSync(supportSourceFolderPath)) {
      FSService.copyFolderRecursiveSync(
        supportSourceFolderPath,
        supportDestFolderPath
      )
    }
  }

  public deleteYamlFile(service: string): void {
    DefaultSvcInitializerService.debug(`removing svc file ${service}`)
    const ymlPath = path.resolve(
      this.parentDirectory,
      SVC_FOLDER,
      `${service}.yml`
    )
    if (fs.existsSync(ymlPath)) {
      fs.rmSync(ymlPath)
    }

    const folderPath = path.resolve(this.parentDirectory, SVC_FOLDER, service)

    if (fs.existsSync(folderPath)) {
      fs.rmSync(folderPath, { recursive: true })
    }
  }
}
