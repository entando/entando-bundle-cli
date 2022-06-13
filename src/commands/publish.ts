import { Command, Flags } from '@oclif/core'
import { BundleDescriptorService } from '../services/bundle-descriptor-service'
import {
  ConfigService,
  DOCKER_ORGANIZATION_PROPERTY
} from '../services/config-service'
import { DockerService } from '../services/docker-service'

export default class Publish extends Command {
  static description = 'Publish bundle Docker images'

  static flags = {
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
      console.warn(
        'No configured Docker organization found. Please run the command with --org flag.'
      )
      return
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
        console.warn('Docker organization changed. Updating images names.')
        // TODO: ENG-3816
      }
    }

    if (!imagesExists) {
      console.warn(
        'One or more Docker images are missing. Running pack command.'
      )
    }
  }
}
