import { CliUx } from '@oclif/core'
import { CLIError } from '@oclif/errors'
import * as cp from 'node:child_process'
import * as inquirer from 'inquirer'
import HubAPI from "../api/hub-api"
import { BundleDescriptor, Bundle, BundleGroup } from "../models/bundle-descriptor"
import BundleDescriptorService from './bundle-descriptor-service'
import FSService from './fs-service'

export interface HubOptions {
  parentDirectory: string
  hubUrl?: string
}

export default class HubService extends FSService {
  private readonly options: HubOptions
  private hubApi: HubAPI
  private loadedBundleGroups: BundleGroup[] = []

  constructor(options: HubOptions) {
    super(options.parentDirectory)
    this.options = options
    this.hubApi = new HubAPI(this.options.hubUrl)
  }

  public async start(): Promise<void> {
    const { selectedBundle } = await this.bundleSelection()
    const newBundleName = await this.initCloneBundle(selectedBundle)
    this.checkMissingDirectories(newBundleName)
  }

  private async bundleSelection(): Promise<{ selectedBundleGroup: BundleGroup, selectedBundle: Bundle }> {
    CliUx.ux.action.start('Gathering bundle groups')
    try {
      this.loadedBundleGroups = await this.hubApi.getBundleGroups()
    } catch {
      throw new CLIError('Hub is not accessible')
    }

    CliUx.ux.action.stop()

    const selectedBundleGroup = await this.promptSelectBundleGroup()
    console.log(`You have selected bundle group "${selectedBundleGroup?.bundleGroupName}".`)

    CliUx.ux.action.start(`Opening bundle group "${selectedBundleGroup.bundleGroupName}"`)
    const bundles: Bundle[] = await this.hubApi.getBundlesByBundleGroupId(selectedBundleGroup.bundleGroupVersionId)
    CliUx.ux.action.stop()

    const selectedBundle: Bundle = await this.promptBundleSelect(bundles, selectedBundleGroup)

    return { selectedBundleGroup, selectedBundle }
  }

  private async initCloneBundle(selectedBundle: Bundle): Promise<string> {
    const newBundleName = await CliUx.ux.prompt('New bundle name')

    this.checkBundleName(newBundleName)
    this.checkBundleDirectory(newBundleName)

    CliUx.ux.action.start(`Downloading bundle ${selectedBundle.bundleName}`)
    try {
      // Using stdio 'pipe' option to print stderr only through CLIError
      cp.execSync(`git clone ${selectedBundle.gitSrcRepoAddress} ./${newBundleName}`, { stdio: 'pipe' })
    } catch (error) {
      throw new CLIError(error as Error)
    }

    CliUx.ux.action.stop()

    const newBundleVersion = await CliUx.ux.prompt('What\'s the version number of this bundle?')

    CliUx.ux.action.start('Making changes to the bundle descriptor')
    this.renameBundleDescriptor(newBundleName, newBundleVersion)
    CliUx.ux.action.stop()

    this.removeGitInfo(newBundleName)
    this.initGitRepo(newBundleName)

    return newBundleName
  }

  private async checkMissingDirectories(bundleName: string) {
    this.createSubDirectoryIfNotExist(bundleName, 'microservices')
    this.createSubDirectoryIfNotExist(bundleName, 'microfrontends')
    this.createSubDirectoryIfNotExist(bundleName, '.ent')
    this.createSubDirectoryIfNotExist(bundleName, '.ent', 'output')
    this.createSubDirectoryIfNotExist(bundleName, 'epc')
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

  private async promptBundleSelect(bundleChoices: Bundle[], selectedBundleGroup: BundleGroup): Promise<Bundle> {
    const choices = bundleChoices.map(bundle => ({ name: bundle.bundleName, value: bundle  }))
    const response: any = await inquirer.prompt([{
      name: 'bundle',
      message: `Select a bundle from ${selectedBundleGroup.bundleGroupName}`,
      type: 'list',
      choices,
    }])
    return response.bundle;
  }

  private renameBundleDescriptor(name: string, version: string): void {
    const bundleDescriptorService = new BundleDescriptorService(this.getBundleDirectory(name))
    const bundleDescriptor: BundleDescriptor = bundleDescriptorService.getBundleDescriptor()

    const updatedBundleDescriptor: BundleDescriptor = {
      ...bundleDescriptor,
      name,
      version,
    }

    bundleDescriptorService.writeBundleDescriptor(updatedBundleDescriptor)
  }
}
