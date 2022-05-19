import { CliUx, Command, Flags } from '@oclif/core'
import * as inquirer from 'inquirer'
import HubService from '../services/hub-service'
import InitializerService from '../services/initializer-service'
import { Bundle, BundleGroup } from "../models/bundle-descriptor"

const DEFAULT_VERSION = '0.0.1'

export default class Init extends Command {
  static description =
    "Performs the scaffolding of a Bundle project (we'll add the possibility to init from hub later)"

  static examples = [
    '<%= config.bin %> <%= command.id %> my-bundle',
    '<%= config.bin %> <%= command.id %> my-bundle --version=0.0.1'
  ]

  static args = [
    { name: 'name', description: 'Bundle project name', required: true }
  ]

  static flags = {
    version: Flags.string({ description: 'Project version' }),
    'from-hub': Flags.boolean({ description: 'Clones a bundle from Entando Hub' }),
    'hub-url': Flags.string({ description: 'Custom Entando Hub url' }),
  }

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(Init)

    const parentDirectory = process.cwd()
    const name = args.name as string
    const version = flags.version ?? DEFAULT_VERSION

    const options = { parentDirectory, name, version }

    const initializer = new InitializerService(options)

    if (flags['from-hub']) {
      CliUx.ux.action.start(`Initializing hub service for your new bundle project ${args.name}`)
      const hubService = new HubService(flags['hub-url'])
      const bundleGroups = await hubService.loadBundleGroups()
      CliUx.ux.action.stop()
      const selectedBundleGroup = await this.promptSelectBundleGroup(bundleGroups)
      const bundles: Bundle[] = await hubService.loadBundlesFromBundleGroup(selectedBundleGroup)
      const selectedBundle: Bundle = await this.promptSelectBundle(bundles, selectedBundleGroup)

      CliUx.ux.action.start(`Gathering selected bundle ${selectedBundle.bundleName} to new project ${args.name}`)
      await initializer.performCloneBundle(selectedBundle)
      CliUx.ux.action.stop()
    } else {
      CliUx.ux.action.start(`Initializing a new bundle project ${args.name}`)
      await initializer.performScaffolding()
      CliUx.ux.action.stop()
    }
  }

  private async promptSelectBundleGroup(loadedBundleGroups: BundleGroup[]): Promise<BundleGroup> {
    const choices = loadedBundleGroups.map(bundleGroup => ({ name: bundleGroup.bundleGroupName, value: bundleGroup }))
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
