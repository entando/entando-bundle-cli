import { CliUx, Command, Flags } from '@oclif/core'
import * as inquirer from 'inquirer'
import { HubService } from '../services/hub-service'
import { InitializerService } from '../services/initializer-service'
import { Bundle, BundleGroup } from '../api/hub-api'
import { DEFAULT_VERSION } from '../models/component'

export default class Init extends Command {
  static description = 'Perform the scaffolding of a bundle project'

  static examples = [
    '<%= config.bin %> <%= command.id %> my-bundle',
    '<%= config.bin %> <%= command.id %> my-bundle --version=0.0.1',
    '<%= config.bin %> <%= command.id %> my-bundle --from-hub',
    '<%= config.bin %> <%= command.id %> my-bundle --from-hub --hub-url=https://www.entando.com/entando-hub-api?catalogId=1 --hub-api-key=1234567890'
  ]

  static args = [
    { name: 'name', description: 'Bundle project name', required: true }
  ]

  static flags = {
    version: Flags.string({ description: 'Project version' }),
    'from-hub': Flags.boolean({
      description: 'Initializes a bundle project from the Entando Hub'
    }),
    'hub-url': Flags.string({
      description: 'Custom Entando Hub url',
      dependsOn: ['from-hub']
    }),
    'hub-api-key': Flags.string({
      description: 'Private Entando Hub API key',
      dependsOn: ['hub-url']
    })
  }

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(Init)

    const parentDirectory = process.cwd()
    const name = args.name as string
    const version = flags.version ?? DEFAULT_VERSION

    const options = { parentDirectory, name, version }

    const initializer = new InitializerService(options)

    if (flags['from-hub']) {
      CliUx.ux.action.start(
        `Initializing a new bundle project named ${args.name} from an Entando Hub bundle template`
      )
      const hubService = new HubService(
        flags['hub-url'] || process.env.ENTANDO_CLI_DEFAULT_HUB,
        flags['hub-api-key']
      )
      const bundleGroups = await hubService.loadBundleGroups()
      CliUx.ux.action.stop()
      const selectedBundleGroup = await this.promptSelectBundleGroup(
        bundleGroups
      )
      const bundles: Bundle[] = await hubService.loadBundlesFromBundleGroup(
        selectedBundleGroup
      )
      const selectedBundle: Bundle = await this.promptSelectBundle(
        bundles,
        selectedBundleGroup
      )

      CliUx.ux.action.start(
        `Fetching the selected bundle ${selectedBundle.bundleName} from PBC ${selectedBundleGroup.bundleGroupName} into a new project named ${args.name}`
      )
      await initializer.performBundleInitFromGit(
        selectedBundle.gitSrcRepoAddress
      )
      CliUx.ux.action.stop()
    } else {
      CliUx.ux.action.start(
        `Initializing an empty bundle project named ${args.name}`
      )
      await initializer.performBundleInit()
      CliUx.ux.action.stop()
    }
  }

  private async promptSelectBundleGroup(
    loadedBundleGroups: BundleGroup[]
  ): Promise<BundleGroup> {
    const choices = loadedBundleGroups.map(bundleGroup => ({
      name: bundleGroup.bundleGroupName,
      value: bundleGroup
    }))
    const response: any = await inquirer.prompt([
      {
        name: 'bundlegroup',
        message: 'Select a PBC:',
        type: 'list',
        choices
      }
    ])
    return response.bundlegroup
  }

  private async promptSelectBundle(
    bundleChoices: Bundle[],
    selectedBundleGroup: BundleGroup
  ): Promise<Bundle> {
    const choices = bundleChoices.map(bundle => ({
      name: bundle.bundleName,
      value: bundle
    }))
    const response: any = await inquirer.prompt([
      {
        name: 'bundle',
        message: `Select a bundle from ${selectedBundleGroup.bundleGroupName}:`,
        type: 'list',
        choices
      }
    ])
    return response.bundle
  }
}
