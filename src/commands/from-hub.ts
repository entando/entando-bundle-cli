import {Command, Flags} from '@oclif/core'
import HubService from '../services/hub-service'

export default class FromHub extends Command {
  static description = 'describe the command here'

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --hub-url=<url>',
  ]

  static flags = {
    'hub-url': Flags.string({ description: 'bundle url' }),
  }

  static args = []

  public async run(): Promise<void> {
    const {flags} = await this.parse(FromHub)

    const hubService = new HubService({
      parentDirectory: process.cwd(),
      hubUrl: flags['hub-url'],
    })
    try {
      hubService.start()
    } catch {}
  }
}
