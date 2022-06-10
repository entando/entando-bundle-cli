import { Command } from '@oclif/core'
import { BundleDescriptorService } from '../services/bundle-descriptor-service'
import {
  ConfigService,
  DOCKER_ORGANIZATION_PROPERTY
} from '../services/config-service'
import { DockerService } from '../services/docker-service'

export default class Publish extends Command {
  static description = 'Publish bundle Docker images'

  public async run(): Promise<void> {
    const configService = new ConfigService()

    const configuredOrganization = configService.getProperty(
      DOCKER_ORGANIZATION_PROPERTY
    )

    if (configuredOrganization) {
      const bundleDescriptor =
        new BundleDescriptorService().getBundleDescriptor()
      if (
        !(await DockerService.bundleImagesExists(
          bundleDescriptor,
          configuredOrganization
        ))
      ) {
        console.warn(
          'One or more Docker images are missing. Running pack command.'
        )
        // TODO: ENG-3826
      }
    } else {
      console.warn(
        'No configured Docker organization found. Running pack command.'
      )
      // TODO: ENG-3826
    }
  }
}
