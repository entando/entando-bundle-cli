import { CliUx, Command, Flags } from "@oclif/core"
import BundleGroupCaller from '../api/hub'
import { BundleGroup, BundleGroupId } from "../models/bundle-descriptor"

export default class HubGroupApi extends Command {
  static description =
    "Performs demo on executing Hub Group API. Remove this once QE is done"

  static examples = [
    "$ <%= config.bin %> <%= command.id %> list",
    "$ <%= config.bin %> <%= command.id %> bundle --name=Test Germano 1",
    "$ <%= config.bin %> <%= command.id %> bundle --versionId=51"
  ]

  static args = [{ name: "action", description: "action for hub group api", required: true }]

  static flags = {
    name: Flags.string({ description: "name of hub group" }),
    versionId: Flags.string({ description: "hub group version id" }),
  }

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(HubGroupApi)

    const hubGroupCaller = new BundleGroupCaller()

    switch (args.action) {
      case 'bundle': {
        if (flags.versionId) {
          CliUx.ux.action.start(`Retrieving hub group with version id ${flags.versionId}`)
          const data: BundleGroup[] = await hubGroupCaller.getBundleGroupById(Number(flags.versionId))

          CliUx.ux.table(data, {
            bundleGroupName: { header: 'Bundle Group' },
            bundleName: { header: 'Bundle Name' },
            bundleGroupVersionId: { header: 'Group Version ID' },
            bundleGroupId: { header: 'Group ID' },
            bundleId: { header: 'Bundle ID' },
          })
          CliUx.ux.action.stop()
        } else {
          console.log('Please provide either --name or --versionId value. Bye.')
        }

        break
      }

      case 'list':
      default: {
        CliUx.ux.action.start('Retrieving existing hub groups')
        const data: BundleGroupId[] = await hubGroupCaller.getBundleGroups(flags.name || undefined)
        CliUx.ux.table(data, {
          bundleGroupName: { header: 'Bundle Group' },
          bundleGroupVersionId: { header: 'Group Version ID' },
        })
        CliUx.ux.action.stop()
        break
      }
    }
  }
}
