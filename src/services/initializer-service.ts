import * as fs from 'node:fs'
import * as path from 'node:path'
import { BundleDescriptorService } from './bundle-descriptor-service'
import { debugFactory } from './debug-factory-service'
import {
  SVC_FOLDER,
  CONFIG_FILE,
  CONFIG_FOLDER,
  RESOURCES_FOLDER,
  DEFAULT_CONFIG_FILE,
  OUTPUT_FOLDER,
  MICROFRONTENDS_FOLDER,
  MICROSERVICES_FOLDER,
  EPC_FOLDER,
  KEYCLOAK_REALM_CONFIG_FOLDER,
  KEYCLOAK_DB_FOLDER,
  KEYCLOAK_REALM_FILE,
  KEYCLOAK_USERS_FILE,
  KEYCLOAK_FOLDER
} from '../paths'

import { FSService } from './fs-service'
import { GitService } from './git-service'

export interface InitializerOptions {
  name: string
  parentDirectory: string
  version: string
}

/** Handles the scaffolding of a project bundle */
export class InitializerService {
  private static debug = debugFactory(InitializerService)

  private readonly options: InitializerOptions
  private readonly filesys: FSService
  private readonly git: GitService
  private templateVariables: { [key: string]: string } = {}

  constructor(options: InitializerOptions) {
    this.options = options

    const { parentDirectory, name } = options

    this.filesys = new FSService(name, parentDirectory)
    this.git = new GitService(name, parentDirectory)
    this.initializeTemplateVariables()
  }

  private initializeTemplateVariables() {
    const dockerImages = require('../../package.json').org_entando_dependencies

    this.templateVariables = {
      '%BUNDLENAME%': this.options.name
    }

    for (const [key, value] of Object.entries(dockerImages)) {
      const k = `%${key.toUpperCase()}_DOCKER_IMAGE%`
      this.templateVariables[k] = value as string
    }
  }

  public async performBundleInit(): Promise<void> {
    InitializerService.debug('project scaffolding started')

    this.filesys.checkBundleName()
    this.createBundleDirectories()
    this.createBundleDescriptor()
    this.createDockerfile()
    this.createGitignore()
    this.createConfigJson()
    this.createDefaultSvcFiles()
    await this.git.initRepo()
  }

  private createBundleDirectories() {
    InitializerService.debug('creating bundle directories')

    this.filesys.checkBundleDirectory()

    const bundleDir = this.filesys.getBundleDirectory()

    fs.mkdirSync(bundleDir)
    fs.mkdirSync(this.filesys.getBundleFilePath(...OUTPUT_FOLDER), {
      recursive: true
    })
    fs.mkdirSync(this.filesys.getBundleFilePath(MICROSERVICES_FOLDER))
    fs.mkdirSync(this.filesys.getBundleFilePath(MICROFRONTENDS_FOLDER))
    fs.mkdirSync(this.filesys.getBundleFilePath(EPC_FOLDER))
    fs.mkdirSync(this.filesys.getBundleFilePath(SVC_FOLDER))
    fs.mkdirSync(this.filesys.getBundleFilePath(...KEYCLOAK_FOLDER))
    fs.mkdirSync(
      this.filesys.getBundleFilePath(...KEYCLOAK_REALM_CONFIG_FOLDER)
    )
    fs.mkdirSync(this.filesys.getBundleFilePath(...KEYCLOAK_DB_FOLDER))
  }

  public async performBundleInitFromGit(
    gitSrcRepoAddress: string
  ): Promise<void> {
    InitializerService.debug('cloning from bundle and creating new project')
    const { name, version } = this.options

    this.filesys.checkBundleName()
    await this.git.cloneRepo(gitSrcRepoAddress)
    this.git.degit()
    await this.git.initRepo()

    this.createDefaultDirectories()

    const bundleDescriptorService = new BundleDescriptorService(
      this.filesys.getBundleDirectory()
    )
    const descriptor = bundleDescriptorService.getBundleDescriptor()
    bundleDescriptorService.writeBundleDescriptor({
      ...descriptor,
      name,
      version
    })
  }

  private async createDefaultDirectories() {
    this.filesys.createSubDirectoryIfNotExist(MICROSERVICES_FOLDER)
    this.filesys.createSubDirectoryIfNotExist(MICROFRONTENDS_FOLDER)
    this.filesys.createSubDirectoryIfNotExist(CONFIG_FOLDER)
    this.filesys.createSubDirectoryIfNotExist(...OUTPUT_FOLDER)
    this.filesys.createSubDirectoryIfNotExist(SVC_FOLDER)
    this.createKeyCloakFoldersIfNotExist()
  }

  private createKeyCloakFoldersIfNotExist() {
    this.filesys.createSubDirectoryIfNotExist(...KEYCLOAK_FOLDER)
    this.filesys.createSubDirectoryIfNotExist(...KEYCLOAK_REALM_CONFIG_FOLDER)
    this.filesys.createSubDirectoryIfNotExist(...KEYCLOAK_DB_FOLDER)
  }

  private createBundleDescriptor() {
    InitializerService.debug('creating bundle descriptor')

    const { name, version } = this.options

    const bundleDescriptorService = new BundleDescriptorService(
      this.filesys.getBundleDirectory()
    )
    bundleDescriptorService.createBundleDescriptor({
      name,
      version,
      description: `${name} description`,
      type: 'bundle'
    })
  }

  public createGitignore(): void {
    InitializerService.debug('creating .gitignore')
    this.filesys.createFileFromTemplate(['.gitignore'], 'default-gitignore')
  }

  private createDockerfile() {
    InitializerService.debug('creating Dockerfile')
    this.filesys.createFileFromTemplate(
      ['Dockerfile'],
      'default-Dockerfile',
      this.templateVariables
    )
  }

  public createDefaultSvcFiles(): void {
    InitializerService.debug('creating svc files')

    const defaultPrefix = 'default-'

    const defaultYamls = fs
      .readdirSync(
        path.resolve(__dirname, '..', '..', RESOURCES_FOLDER, SVC_FOLDER)
      )
      .filter(filename => filename.slice(-3) === 'yml')
      .map(filename => filename.replace(defaultPrefix, ''))

    for (const defaultYaml of defaultYamls) {
      this.filesys.createFileFromTemplate(
        [SVC_FOLDER, defaultYaml],
        path.join(SVC_FOLDER, `${defaultPrefix}${defaultYaml}`),
        this.templateVariables
      )
    }

    this.createKeycloakFilesFromTemplate()
  }

  private createKeycloakFilesFromTemplate() {
    const keycloakRealm = path.join(
      __dirname,
      '..',
      '..',
      RESOURCES_FOLDER,
      ...KEYCLOAK_REALM_CONFIG_FOLDER,
      KEYCLOAK_REALM_FILE
    )
    const keycloakUsers = path.join(
      __dirname,
      '..',
      '..',
      RESOURCES_FOLDER,
      ...KEYCLOAK_REALM_CONFIG_FOLDER,
      KEYCLOAK_USERS_FILE
    )

    this.filesys.createFileFromTemplate(
      [...KEYCLOAK_REALM_CONFIG_FOLDER, KEYCLOAK_REALM_FILE],
      keycloakRealm
    )

    this.filesys.createFileFromTemplate(
      [...KEYCLOAK_REALM_CONFIG_FOLDER, KEYCLOAK_USERS_FILE],
      keycloakUsers
    )
  }

  private createConfigJson() {
    InitializerService.debug(`creating ${CONFIG_FILE}`)
    this.filesys.createFileFromTemplate(
      [CONFIG_FOLDER, CONFIG_FILE],
      DEFAULT_CONFIG_FILE
    )
  }
}
