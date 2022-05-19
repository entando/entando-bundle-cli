import { CLIError } from '@oclif/errors'
import * as inquirer from 'inquirer'
import HubAPI from "../api/hub-api"
import { Bundle, BundleGroup } from "../models/bundle-descriptor"
import { ServiceTools } from '../models/service-params'
import BundleDescriptorService from './bundle-descriptor-service'
import { InitializerOptions } from './initializer-service'

export interface HubOptions extends InitializerOptions {
  hubUrl?: string
}

export default class HubService {
  private readonly options: HubOptions
  private hubApi: HubAPI
  private loadedBundleGroups: BundleGroup[] = []
  private readonly serviceTools: ServiceTools

  constructor(options: HubOptions, serviceTools: ServiceTools) {
    this.options = options
    this.serviceTools = serviceTools
    this.hubApi = new HubAPI(options.hubUrl)
  }

  public precheck(): void {
    const { filesys } = this.serviceTools
    filesys.checkBundleName()
    filesys.checkBundleDirectory()
  }

  public async loadBundleGroups(): Promise<void> {
    try {
      this.loadedBundleGroups = await this.hubApi.getBundleGroups()
    } catch {
      throw new CLIError('Hub is not accessible')
    }
  }

  public async bundleSelection(): Promise<{ selectedBundleGroup: BundleGroup, selectedBundle: Bundle }> {
    const selectedBundleGroup = await this.promptSelectBundleGroup()
    const bundles: Bundle[] = await this.hubApi.getBundlesByBundleGroupId(selectedBundleGroup.bundleGroupVersionId)
    const selectedBundle: Bundle = await this.promptSelectBundle(bundles, selectedBundleGroup)

    return { selectedBundleGroup, selectedBundle }
  }

  public async initCloneBundle(selectedBundle: Bundle): Promise<void> {
    const { name, version } = this.options
    const { git, filesys } = this.serviceTools

    git.cloneRepo(selectedBundle.gitSrcRepoAddress)
    git.degit()
    git.initRepo()

    this.checkMissingDirectories()

    const bundleDescriptorService = new BundleDescriptorService(filesys.getBundleDirectory())
    const descriptor = bundleDescriptorService.getBundleDescriptor()
    bundleDescriptorService.writeBundleDescriptor({ ...descriptor, name, version })
  }

  private async checkMissingDirectories() {
    const { filesys } = this.serviceTools

    filesys.createSubDirectoryIfNotExist('microservices')
    filesys.createSubDirectoryIfNotExist('microfrontends')
    filesys.createSubDirectoryIfNotExist('.ent')
    filesys.createSubDirectoryIfNotExist('.ent', 'output')
    filesys.createSubDirectoryIfNotExist('epc')
  }

  private async promptSelectBundleGroup(): Promise<BundleGroup> {
    const choices = this.loadedBundleGroups.map(bundleGroup => ({ name: bundleGroup.bundleGroupName, value: bundleGroup }))
    const response: any = await inquirer.prompt([{
      name: 'bundlegroup',
      message: 'Select a bundle group',
      type: 'list',
      choices,
    }])
    return response.bundlegroup;
  }

  private async promptSelectBundle(bundleChoices: Bundle[], selectedBundleGroup: BundleGroup): Promise<Bundle> {
    const choices = bundleChoices.map(bundle => ({ name: bundle.bundleName, value: bundle  }))
    const response: any = await inquirer.prompt([{
      name: 'bundle',
      message: `Select a bundle from ${selectedBundleGroup.bundleGroupName}`,
      type: 'list',
      choices,
    }])
    return response.bundle;
  }
}
