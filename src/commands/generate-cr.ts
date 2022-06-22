import { CliUx, Command, Flags } from '@oclif/core'
import { CLIError } from '@oclif/errors'
import color from '@oclif/color'
import {
  ALLOWED_BUNDLE_WITHOUT_REGISTRY_REGEXP,
  ALLOWED_BUNDLE_WITH_REGISTRY_REGEXP,
  VALID_BUNDLE_FORMAT
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
  static description =
    'Generate the Entando Custom Resource (CR) for a bundle project'

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --image=my-org/my-bundle',
    '<%= config.bin %> <%= command.id %> --image=my-registry/my-org/my-bundle',
    '<%= config.bin %> <%= command.id %> --image=my-org/my-bundle --digest'
  ]

  static flags = {
    image: Flags.string({
      char: 'i',
      description:
        'Name of the bundle Docker image with the format ' + VALID_BUNDLE_FORMAT
    }),
    digest: Flags.boolean({
      char: 'd',
      description: 'Include Docker images digests'
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
          'Invalid bundle image format. Expected ' + VALID_BUNDLE_FORMAT
        )
      }
    }

    if (!image) {
      try {
        BundleService.isValidBundleProject()
      } catch {
        throw new CLIError(
          'Current directory is not an initialized bundle project. Use the --image flag to specify the bundle image name or execute the command inside a valid bundle project.'
        )
      }

      const configService = new ConfigService()
      const dockerOrganization = configService.getProperty(
        DOCKER_ORGANIZATION_PROPERTY
      )

      if (!dockerOrganization) {
        this.error(
          'Docker organization not configured for the project. Bundle image must be published to generate the CR.'
        )
      }

      const registry =
        configService.getProperty(DOCKER_REGISTRY_PROPERTY) ??
        DEFAULT_DOCKER_REGISTRY

      const bundleDescriptorService = new BundleDescriptorService()
      const bundleDescriptor = bundleDescriptorService.getBundleDescriptor()

      image = `${registry}/${dockerOrganization}/${bundleDescriptor.name}`
    }

    CliUx.ux.action.start('Retrieving bundle image tags')
    const tags = await DockerService.listTags(image)
    CliUx.ux.action.stop()

    if (tags.length === 0) {
      this.error(`No tag found for Docker image ${image}`)
    }

    if (flags.digest) {
      this.log(color.bold.blue('Fetching bundle Docker repository tags'))

      const progress = CliUx.ux.progress()
      progress.start(tags.length, 0)

      const digestsExecutor = DockerService.getDigestsExecutor(image, tags)

      digestsExecutor.on('done', () => {
        progress.update(progress.value + 1)
      })

      let digests: Map<string, string>
      try {
        digests = await digestsExecutor.getDigests()
      } finally {
        progress.stop()
      }

      for (const [tag, digest] of digests.entries()) {
        this.log(tag, digest)
      }
    } else {
      for (const tag of tags) {
        this.log(tag)
      }
    }

    CliUx.ux.action.start('Retrieving bundle image descriptor')
    const latestImage = `${image}:${tags[0]}`
    const yamlDescriptor = await DockerService.getYamlDescriptorFromImage(
      latestImage
    )
    CliUx.ux.action.stop()
    console.log(yamlDescriptor)
  }
}
