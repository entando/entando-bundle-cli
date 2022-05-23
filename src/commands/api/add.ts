import { CliUx, Command, Flags } from '@oclif/core'
import { ApiClaim, ApiType } from '../../models/api'
import { ApiClaimService } from '../../services/api-claim-service'
import { BundleService } from '../../services/bundle-service'

export default class Add extends Command {
  static description = 'Adds an internal API claim to the specified MFE component'

  static examples = [
    '$ <%= config.bin %> <%= command.id %> mfe1 ms1-api --serviceId ms1 --serviceUrl http://localhost:8080',
  ]

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

  static flags = {
    serviceId: Flags.string({
      description: 'Micro Service ID within the Bundle',
      required: true
    }),
    serviceUrl: Flags.string({
      description: 'URL of the internal service',
      required: true
    })
  }

  public async run(): Promise<void> {
    BundleService.verifyBundleInitialized(process.cwd())

    const { args, flags } = await this.parse(Add)

    const apiClaim: ApiClaim = {
      name: args.claimName,
      type: ApiType.Internal,
      serviceId: flags.serviceId
    }
    const apiClaimService: ApiClaimService = new ApiClaimService()

    CliUx.ux.action.start(`Adding a new API claim ${args.claimName} to ${args.mfeName}`)
    apiClaimService.addInternalApiClaim(args.mfeName, apiClaim, flags.serviceUrl)
    CliUx.ux.action.stop()
  }
}
