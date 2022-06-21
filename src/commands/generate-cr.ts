import { CliUx, Command, Flags } from '@oclif/core'
import {
  ALLOWED_BUNDLE_WITHOUT_REGISTRY_REGEXP,
  ALLOWED_BUNDLE_WITH_REGISTRY_REGEXP
} from '../models/bundle-descriptor-constraints'
import { BundleDescriptorService } from '../services/bundle-descriptor-service'
import { BundleService } from '../services/bundle-service'
import {
  ConfigService,
  DOCKER_ORGANIZATION_PROPERTY,
  DOCKER_REGISTRY_PROPERTY
} from '../services/config-service'
import {
  DEFAULT_DOCKER_REGISTRY,
  DockerService
} from '../services/docker-service'

export default class GenerateCr extends Command {
  static description = 'Generate CR for a bundle project'

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --image=my-org/my-bundle',
    '<%= config.bin %> <%= command.id %> --image=my-registry/my-org/my-bundle'
  ]

  static flags = {
    image: Flags.string({
      char: 'i',
      description: 'Name of the bundle Docker image'
    })
  }

  public async run(): Promise<void> {
    const { flags } = await this.parse(GenerateCr)

    let image = flags.image

    if (image) {
      if (ALLOWED_BUNDLE_WITHOUT_REGISTRY_REGEXP.test(image)) {
        image = `${DEFAULT_DOCKER_REGISTRY}/${image}`
      } else if (!ALLOWED_BUNDLE_WITH_REGISTRY_REGEXP.test(image)) {
        this.error(
          'Invalid bundle image format. Expected <organization>/<repository> or <registry>/<organization>/<repository>'
        )
      }
    }

    if (!image) {
      BundleService.isValidBundleProject()

      const configService = new ConfigService()
      const dockerOrganization = configService.getProperty(
        DOCKER_ORGANIZATION_PROPERTY
      )

      if (!dockerOrganization) {
        this.error(
          'Docker organization not configured for the project. Bundle image must be published to generate CR.'
        )
      }

      const registry =
        configService.getProperty(DOCKER_REGISTRY_PROPERTY) ??
        DEFAULT_DOCKER_REGISTRY

      const bundleDescriptorService = new BundleDescriptorService()
      const bundleDescriptor = bundleDescriptorService.getBundleDescriptor()

      image = `${registry}/${dockerOrganization}/${bundleDescriptor.name}`
    }

    CliUx.ux.action.start('Retrieving information about bundle image')

    const res = await DockerService.getTagsWithDigests(image)

    CliUx.ux.action.stop()

    for (const [tag, digest] of res.entries()) {
      this.log(tag, digest)
    }
  }
}
