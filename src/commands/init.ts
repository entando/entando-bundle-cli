import { CliUx, Command, Flags } from '@oclif/core'
import FSService from '../services/fs-service'
import { GitService } from '../services/git-service'
import HubService from '../services/hub-service'
import InitializerService from '../services/initializer-service'

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
    version: Flags.string({ description: 'project version' }),
    'from-hub': Flags.boolean({ description: 'clone a bundle from Entando hub' }),
    'hub-url': Flags.string({ description: 'custom hub url' }),
  }

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(Init)

    const parentDirectory = process.cwd()
    const name = args.name as string
    const version = flags.version ?? DEFAULT_VERSION

    const options = { parentDirectory, name, version }

    const filesys = new FSService({ parentDirectory, name })
    const git = new GitService({ parentDirectory, name }, filesys)

    const serviceTools = { git, filesys }

    const initializer = new InitializerService(options, serviceTools)

    if (flags['from-hub']) {
      CliUx.ux.action.start(`Initializing hub service for your new bundle project ${args.name}`)
      const hubService = new HubService({ ...options, hubUrl: flags['hub-url'] }, serviceTools)
      hubService.precheck()
      await hubService.loadBundleGroups()
      CliUx.ux.action.stop()

      const { selectedBundle } = await hubService.bundleSelection()

      CliUx.ux.action.start(`Gathering selected bundle ${selectedBundle.bundleName} to new project ${args.name}`)
      await hubService.initCloneBundle(selectedBundle)
      CliUx.ux.action.stop()
    } else {
      CliUx.ux.action.start(`Initializing a new bundle project ${args.name}`)
      await initializer.performScaffolding()
      CliUx.ux.action.stop()
    }
  }
}
