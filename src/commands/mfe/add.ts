import { CliUx, Command, Flags } from '@oclif/core'
import { MicroFrontend } from '../../models/bundle-descriptor'
import MicroFrontendsManager from '../../services/microfrontends-manager'

enum Stack {
  React = 'react',
  Angular = 'angular'
}

export default class Add extends Command {
  static description = 'Adds a microfrontend component to the current bundle'

  static examples = [
    '$ entando-bundle-cli mfe add my-mfe',
    '$ entando-bundle-cli mfe add my-mfe --stack react'
  ]

  static flags = {
    stack: Flags.string({
      description: 'frontend stack',
      options: [Stack.React, Stack.Angular],
      default: Stack.React
    })
  }

  static args = [
    {
      name: 'name',
      description: 'name of the microfrontend component',
      required: true
    }
  ]

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(Add)

    const microFrontend: MicroFrontend = <MicroFrontend>{
      name: args.name,
      stack: flags.stack
    }
    const microFrontendsManager: MicroFrontendsManager =
      new MicroFrontendsManager()

    CliUx.ux.action.start(`Adding a new microfrontend ${args.name}`)
    microFrontendsManager.addMicroFrontend(microFrontend)
    CliUx.ux.action.stop()
  }
}
