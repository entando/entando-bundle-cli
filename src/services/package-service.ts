import { BundleService } from './bundle-service'
import ConfigService from './config-service'

export const DOCKER_ORGANIZATION_PROPERTY = 'docker-organization'

export default class PackageService {
  public async getOrInitDockerOrganization(
    organizationProvider: () => Promise<string>
  ): Promise<string> {
    BundleService.verifyBundleInitialized(process.cwd())
    const configService = new ConfigService()

    if (configService.hasProperty(DOCKER_ORGANIZATION_PROPERTY)) {
      return configService.getProperty(DOCKER_ORGANIZATION_PROPERTY)
    }

    const dockerOrganization = await organizationProvider()
    configService.addProperty(DOCKER_ORGANIZATION_PROPERTY, dockerOrganization)
    return dockerOrganization
  }
}
