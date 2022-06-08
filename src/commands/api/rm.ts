import { CliUx, Command } from '@oclif/core'
import { ApiClaimService } from '../../services/api-claim-service'
import { BundleService } from '../../services/bundle-service'

export default class Rm extends Command {
  static description = 'Removes an API claim from the specified MFE component'

  static examples = ['<%= config.bin %> <%= command.id %> my-mfe my-api-claim']

  static args = [
    {
      name: 'mfeName',
      description: 'Name of the Micro Frontend component',
      required: true
    },
    {
      name: 'claimName',
      description: 'Name of the API claim',
      required: true
    }
  ]

  public async run(): Promise<void> {
    BundleService.isValidBundleProject(process.cwd())

    const { args } = await this.parse(Rm)
    const apiClaimService: ApiClaimService = new ApiClaimService()

    CliUx.ux.action.start(
      `Removing API claim named ${args.claimName} from Micro Frontend ${args.mfeName}`
    )
    apiClaimService.removeApiClaim(args.mfeName, args.claimName)
    CliUx.ux.action.stop()
  }
}
