import { Command, Flags } from '@oclif/core'
import { BundleDescriptorService } from '../services/bundle-descriptor-service'
import {
  ConfigService,
  DOCKER_ORGANIZATION_PROPERTY,
  DOCKER_REGISTRY_PROPERTY
} from '../services/config-service'
import {
  DEFAULT_DOCKER_REGISTRY,
  DockerService
} from '../services/docker-service'
import Pack from './pack'

export default class Publish extends Command {
  static description = 'Publish bundle Docker images'

  static flags = {
    'docker-registry': Flags.string({
      char: 'r',
      description: `Docker registry (default is ${DEFAULT_DOCKER_REGISTRY})`,
      required: false
    }),
    org: Flags.string({
      char: 'o',
      description: `Docker organization name`,
      required: false
    })
  }

  public async run(): Promise<void> {
    const configService = new ConfigService()

    const { flags } = await this.parse(Publish)

    const configuredOrganization = configService.getProperty(
      DOCKER_ORGANIZATION_PROPERTY
    )

    if (!configuredOrganization && !flags.org) {
      this.error(
        'No configured Docker organization found. Please run the command with --org flag.'
      )
    }

    if (flags.org) {
      configService.addOrUpdateProperty(DOCKER_ORGANIZATION_PROPERTY, flags.org)
    }

    const bundleDescriptor = new BundleDescriptorService().getBundleDescriptor()

    let imagesExists =
      flags.org &&
      (await DockerService.bundleImagesExists(bundleDescriptor, flags.org))

    if (!imagesExists) {
      imagesExists =
        configuredOrganization &&
        (await DockerService.bundleImagesExists(
          bundleDescriptor,
          configuredOrganization
        ))
      if (imagesExists && flags.org) {
        this.warn('Docker organization changed. Updating images names.')
        // TODO: ENG-3816
      }
    }

    if (!imagesExists) {
      this.warn('One or more Docker images are missing. Running pack command.')
      await Pack.run(['--org', flags.org ?? configuredOrganization!])
    }

    let dockerRegistry = flags['docker-registry']
    if (dockerRegistry) {
      configService.addOrUpdateProperty(
        DOCKER_REGISTRY_PROPERTY,
        dockerRegistry
      )
    } else {
      dockerRegistry = configService.getProperty(DOCKER_REGISTRY_PROPERTY)
    }

    this.log(
      `Login on Docker registry ${dockerRegistry ?? DEFAULT_DOCKER_REGISTRY}`
    )
    await DockerService.login(dockerRegistry)
  }
}
