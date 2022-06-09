import { CliUx, Command, Flags } from '@oclif/core'
import { ComponentType, VersionedComponent } from '../models/component'
import { BundleService } from '../services/bundle-service'
import { ComponentService } from '../services/component-service'

export default class List extends Command {
  static description = 'List the available components in the bundle'

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --ms',
    '<%= config.bin %> <%= command.id %> --ms --mfe'
  ]

  static flags = {
    ms: Flags.boolean({
      description: 'List only microservice components'
    }),
    mfe: Flags.boolean({
      description: 'List only Micro Frontend components'
    })
  }

  public async run(): Promise<void> {
    BundleService.isValidBundleProject()

    const { flags } = await this.parse(List)
    const componentService = new ComponentService()
    let components: VersionedComponent[] = []

    if (!flags.ms && !flags.mfe) {
      components = componentService.getVersionedComponents()
    } else {
      if (flags.ms) {
        components.push(
          ...componentService.getVersionedComponents(ComponentType.MICROSERVICE)
        )
      }

      if (flags.mfe) {
        components.push(
          ...componentService.getVersionedComponents(
            ComponentType.MICROFRONTEND
          )
        )
      }
    }

    const compKeys: Array<string & keyof VersionedComponent> = [
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
