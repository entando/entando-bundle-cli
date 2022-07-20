import { CliUx, Command } from '@oclif/core'
import * as inquirer from 'inquirer'
import { WidgetMicroFrontend } from '../../models/bundle-descriptor'
import { BundleDescriptorService } from '../../services/bundle-descriptor-service'
import { BundleService } from '../../services/bundle-service'
import { MicroFrontendService } from '../../services/microfrontend-service'

export default class Rm extends Command {
  static description = 'Remove a Micro Frontend component to the bundle'

  static examples = ['<%= config.bin %> <%= command.id %> my-mfe']

  static args = [
    {
      name: 'name',
      description: 'Name of the Micro Frontend component',
      required: true
    }
  ]

  public async run(): Promise<void> {
    BundleService.isValidBundleProject()

    const { args } = await this.parse(Rm)

    const microFrontendService: MicroFrontendService =
      new MicroFrontendService()
    const mfeReferences = microFrontendService.findWidgetConfigReferences(
      args.name
    )

    if (mfeReferences.length > 0) {
      const { removeConfigs } = await inquirer.prompt([
        {
          name: 'removeConfigs',
          message: `Reference to ${args.name} will be removed from this bundle's microfrontend widgets. Do you wish to continue?`,
          default: false,
          type: 'confirm'
        }
      ])

      if (!removeConfigs) {
        this.exit()
      }

      CliUx.ux.action.start(
        `Removing Micro Frontend references to ${args.name}`
      )

      const mfeReferenceNames = new Set(mfeReferences.map(({ name }) => name))

      const bundleDescriptorService: BundleDescriptorService =
        new BundleDescriptorService()
      const bundleDescriptor = bundleDescriptorService.getBundleDescriptor()

      const microfrontends = bundleDescriptor.microfrontends.map(mfe => {
        if (mfeReferenceNames.has(mfe.name)) {
          delete (mfe as WidgetMicroFrontend).configMfe
        }

        return mfe
      })

      bundleDescriptorService.writeBundleDescriptor({
        ...bundleDescriptor,
        microfrontends
      })
      CliUx.ux.action.stop()
    }

    CliUx.ux.action.start(`Removing Micro Frontend ${args.name}`)
    microFrontendService.removeMicroFrontend(args.name)
    CliUx.ux.action.stop()
  }
}
