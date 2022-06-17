import { CliUx, Command, Flags } from '@oclif/core'
import { ApiType, ExternalApiClaim } from '../../models/bundle-descriptor'
import { ApiClaimService } from '../../services/api-claim-service'
import { BundleService } from '../../services/bundle-service'

export default class AddExt extends Command {
  static description =
    'Add an external API claim to the specified MFE component'

  static examples = [
    '<%= config.bin %> <%= command.id %> mfe1 ms1-api --bundle registry.hub.docker.com/my-org/my-bundle --serviceName ms1'
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
    bundle: Flags.string({
      description: 'Target Bundle ID',
      required: true
    }),
    serviceName: Flags.string({
      description: 'Microservice name within the target Bundle',
      required: true
    })
  }

  public async run(): Promise<void> {
    BundleService.isValidBundleProject()

    const { args, flags } = await this.parse(AddExt)

    const apiClaim: ExternalApiClaim = {
      name: args.claimName,
      type: ApiType.External,
      serviceName: flags.serviceName,
      bundle: flags.bundle
    }
    const apiClaimService: ApiClaimService = new ApiClaimService()

    CliUx.ux.action.start(
      `Adding a new external API claim named ${args.claimName} to Micro Frontend ${args.mfeName}`
    )
    apiClaimService.addExternalApiClaim(args.mfeName, apiClaim)
    CliUx.ux.action.stop()
  }
}
