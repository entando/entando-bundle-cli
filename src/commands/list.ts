import { CliUx, Command, Flags } from '@oclif/core'
import { Component } from '../models/component'
import { BundleService } from '../services/bundle-service'
import { ComponentDescriptorService } from '../services/component-descriptor-service'

export default class List extends Command {
  static description = 'Lists the available components in the bundle'

  static examples = [
    '$ entando-bundle-cli list',
    '$ entando-bundle-cli list --ms',
    '$ entando-bundle-cli list --ms --mfe'
  ]

  static flags = {
    ms: Flags.boolean({
      description: 'List all Micro Service components'
    }),
    mfe: Flags.boolean({
      description: 'List all Micro Frontend components'
    })
  }

  public async run(): Promise<void> {
    BundleService.verifyBundleInitialized(process.cwd())

    const { flags } = await this.parse(List)
    const components: Array<Component> = []
    const componentDescriptorService = new ComponentDescriptorService()

    if (!flags.ms && !flags.mfe) {
      components.push(...componentDescriptorService.getComponents())
    } else {
      if (flags.ms) {
        components.push(...componentDescriptorService.getMsComponents())
      }

      if (flags.mfe) {
        components.push(...componentDescriptorService.getMfeComponents())
      }
    }

    const compKeys: Array<string & keyof Component> = [
      'name',
      'type',
      'version',
      'stack'
    ]
    const columnMap = compKeys.map(k => [[k], { header: k }])
    const columns = Object.fromEntries(columnMap)

    CliUx.ux.table(components, columns)
  }
}
