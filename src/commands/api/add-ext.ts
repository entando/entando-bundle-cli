import { CliUx, Command, Flags } from '@oclif/core'
import * as inquirer from 'inquirer'
import { ApiType, ExternalApiClaim } from '../../models/bundle-descriptor'
import {
  ALLOWED_BUNDLE_WITH_REGISTRY_REGEXP,
  ALLOWED_BUNDLE_WITHOUT_REGISTRY_REGEXP,
  VALID_BUNDLE_FORMAT,
  TARBALL_PREFIX
} from '../../models/bundle-descriptor-constraints'
import { ApiClaimService } from '../../services/api-claim-service'
import { BundleService } from '../../services/bundle-service'
import { CmService } from '../../services/cm-service'
import { DEFAULT_DOCKER_REGISTRY } from '../../services/docker-service'

export default class AddExt extends Command {
  static description =
    'Add an external API claim to the specified MFE component'

  static examples = [
    '<%= config.bin %> <%= command.id %> mfe1 ms1-api --bundle docker://registry.hub.docker.com/my-org/my-bundle --serviceName ms1'
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
      description:
        'Target Bundle Docker repository with the format ' + VALID_BUNDLE_FORMAT
    }),
    serviceName: Flags.string({
      description: 'Microservice name within the target Bundle',
      dependsOn: ['bundle']
    })
  }

  public async run(): Promise<void> {
    BundleService.isValidBundleProject()

    const { args, flags } = await this.parse(AddExt)

    let { bundle, serviceName } = flags

    if (serviceName) {
      bundle = this.formatBundle(bundle!)
    } else {
      const cmService = new CmService()

      if (bundle) {
        bundle = this.formatBundle(bundle)
      } else {
        const bundles = (await cmService.getBundles()).map(
          b => b.publicationUrl
        )
        bundle = await this.promptSelectBundle(bundles)
      }

      const bundleId = BundleService.generateBundleId(bundle)
      const bundleMicroservices = (
        await cmService.getBundleMicroservices(bundleId)
      ).map(ms => ms.pluginName)
      serviceName = await this.promptSelectBundleMicroservice(
        bundleMicroservices
      )
    }

    const apiClaim: ExternalApiClaim = {
      name: args.claimName,
      type: ApiType.External,
      serviceName,
      bundle
    }
    const apiClaimService: ApiClaimService = new ApiClaimService()

    CliUx.ux.action.start(
      `Adding a new external API claim named ${args.claimName} to Micro Frontend ${args.mfeName}`
    )
    await apiClaimService.addExternalApiClaim(args.mfeName, apiClaim)
    CliUx.ux.action.stop()
  }

  private async promptSelectBundle(bundles: string[]): Promise<string> {
    const choices = bundles.map(bundle => ({
      name: bundle,
      value: bundle
    }))
    const response = await inquirer.prompt([
      {
        name: 'bundle',
        message: `Select a bundle:`,
        type: 'list',
        choices
      }
    ])

    return response.bundle
  }

  private async promptSelectBundleMicroservice(
    bundleMicroservices: string[]
  ): Promise<string> {
    const choices = bundleMicroservices.map(bundleMicroservice => ({
      name: bundleMicroservice,
      value: bundleMicroservice
    }))
    const response = await inquirer.prompt([
      {
        name: 'microservice',
        message: `Select a microservice:`,
        type: 'list',
        choices
      }
    ])
    return response.microservice
  }

  private formatBundle(bundle: string): string {
    if (bundle.startsWith(TARBALL_PREFIX)) {
      bundle = bundle.slice(TARBALL_PREFIX.length)
    }

    if (bundle.match(ALLOWED_BUNDLE_WITHOUT_REGISTRY_REGEXP) !== null) {
      return TARBALL_PREFIX + DEFAULT_DOCKER_REGISTRY + '/' + bundle
    }

    if (bundle.match(ALLOWED_BUNDLE_WITH_REGISTRY_REGEXP) !== null) {
      return TARBALL_PREFIX + bundle
    }

    this.error('Invalid bundle format. Please use ' + VALID_BUNDLE_FORMAT)
  }
}
