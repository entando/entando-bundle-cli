import { CliUx, Command, Flags } from '@oclif/core'
import { CLIError } from '@oclif/errors'
import color from '@oclif/color'
import {
  ALLOWED_BUNDLE_WITHOUT_REGISTRY_REGEXP,
  ALLOWED_BUNDLE_WITH_REGISTRY_REGEXP,
  DOCKER_PREFIX,
  VALID_BUNDLE_FORMAT
} from '../models/bundle-descriptor-constraints'
import { BundleDescriptorService } from '../services/bundle-descriptor-service'
import { BundleService } from '../services/bundle-service'
import {
  ConfigService,
  DOCKER_ORGANIZATION_PROPERTY,
  DOCKER_REGISTRY_PROPERTY
} from '../services/config-service'
import { DockerService } from '../services/docker-service'
import { CustomResourceService } from '../services/custom-resource-service'
import * as YAML from 'yaml'
import * as path from 'node:path'
import * as fs from 'node:fs'
import { animatedProgress } from '../utils'

export default class GenerateCr extends Command {
  static description =
    'Generate the Entando Custom Resource (CR) for a bundle project'

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --image=my-org/my-bundle',
    '<%= config.bin %> <%= command.id %> -i my-registry/my-org/my-bundle',
    '<%= config.bin %> <%= command.id %> --image=my-org/my-bundle --digest',
    '<%= config.bin %> <%= command.id %> -o my-cr.yml'
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
    }),
    output: Flags.string({
      char: 'o',
      description: 'Write the result to the specified output file'
    }),
    force: Flags.boolean({
      char: 'f',
      description: 'Suppress the confirmation prompt in case of file overwrite',
      dependsOn: ['output']
    })
  }

  public async run(): Promise<void> {
    const { flags } = await this.parse(GenerateCr)

    if (flags.output) {
      if (!fs.existsSync(path.dirname(flags.output))) {
        this.error(
          "Parent directory for the specified output file doesn't exist"
        )
      }

      if (fs.existsSync(flags.output) && !flags.force) {
        const overwrite = await CliUx.ux.confirm(
          color.yellow(
            `File ${flags.output} already exists. Do you want to overwrite it? [y/n]`
          )
        )
        if (!overwrite) {
          return
        }
      }
    }

    let image = flags.image

    if (image) {
      if (image.startsWith(DOCKER_PREFIX)) {
        image = image.slice(DOCKER_PREFIX.length)
      }

      if (ALLOWED_BUNDLE_WITHOUT_REGISTRY_REGEXP.test(image)) {
        image = `${DockerService.getDefaultDockerRegistry()}/${image}`
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
        DockerService.getDefaultDockerRegistry()

      const bundleDescriptorService = new BundleDescriptorService()
      const bundleDescriptor = bundleDescriptorService.getBundleDescriptor()

      image = `${registry}/${dockerOrganization}/${bundleDescriptor.name}`
    }

    CliUx.ux.action.start('Retrieving bundle image tags')
    const tags = await DockerService.listTags(image)
    let digests: Map<string, string> = new Map()
    CliUx.ux.action.stop()

    if (tags.length === 0) {
      this.error(`No tags found for the Docker image ${image}`)
    }

    if (flags.digest) {
      console.warn(color.bold.blue('Fetching bundle Docker repository tags'))

      const progress = animatedProgress()
      progress.start(tags.length, 0)

      const digestsExecutor = DockerService.getDigestsExecutor(image, tags)

      digestsExecutor.on('done', () => {
        progress.update(progress.value + 1)
      })

      try {
        digests = await digestsExecutor.getDigests()
      } finally {
        progress.stop()
      }
    }

    CliUx.ux.action.start('Generating Entando custom resource descriptor')
    const latestTag = `${image}:${tags[0]}`
    const yamlDescriptor = await DockerService.getYamlDescriptorFromImage(
      latestTag
    )
    const customResourceService = new CustomResourceService(
      image,
      tags,
      digests,
      yamlDescriptor
    )
    const crDescriptor = customResourceService.createCustomResource()
    const yamlContent = YAML.stringify(crDescriptor)
    CliUx.ux.action.stop()
    if (flags.output) {
      fs.writeFileSync(flags.output, yamlContent)
    } else {
      this.log('---')
      this.log(yamlContent)
    }
  }
}
