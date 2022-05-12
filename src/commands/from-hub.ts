import {Command, Flags} from '@oclif/core'
import HubService from '../services/hub-service'

export default class FromHub extends Command {
  static description = 'describe the command here'

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --hub-url=<url>',
  ]

  static flags = {
    hubUrl: Flags.string({ description: 'bundle url' }),
  }

  static args = []

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(FromHub)

    const hubService = new HubService({
      parentDirectory: process.cwd()
    })

    hubService.start()
  }
}
