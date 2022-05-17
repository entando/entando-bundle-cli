import { CliUx, Command, Flags } from '@oclif/core'
import { Component, ComponentType } from '../models/component'
import { BundleService } from '../services/bundle-service'
import { ComponentService } from '../services/component-service'

export default class List extends Command {
  static description = 'Lists the available components in the bundle'

  static examples = [
    '$ entando-bundle-cli list',
    '$ entando-bundle-cli list --ms',
    '$ entando-bundle-cli list --ms --mfe'
  ]

  static flags = {
    ms: Flags.boolean({
      description: 'List only Micro Service components'
    }),
    mfe: Flags.boolean({
      description: 'List only Micro Frontend components'
    })
  }

  public async run(): Promise<void> {
    BundleService.verifyBundleInitialized(process.cwd())

    const { flags } = await this.parse(List)
    const componentService = new ComponentService()
    let components: Array<Component> = []

    if (!flags.ms && !flags.mfe) {
      components = componentService.getComponents()
    } else {
      if (flags.ms) {
        components.push(
          ...componentService.getComponents(ComponentType.MICROSERVICE)
        )
      }

      if (flags.mfe) {
        components.push(
          ...componentService.getComponents(ComponentType.MICROFRONTEND)
        )
      }
    }

    const compKeys: Array<string & keyof Component> = [
      'name',
      'type',
      'version',
      'stack'
    ]
    const columnMap = compKeys.map(k => [[k], { header: k.toUpperCase() }])
    const columns = Object.fromEntries(columnMap)

    CliUx.ux.table(components, columns)
  }
}
