import { CLIError } from '@oclif/errors'
import { ApiClaim } from '../models/bundle-descriptor'
import BundleDescriptorService from './bundle-descriptor-service'
import { BundleDescriptor } from '../models/bundle-descriptor'
import { MfeConfigService } from './mfe-config-service'
import { MfeConfig } from '../models/mfe-config'

export class ApiClaimService {
  private readonly bundleDescriptorService: BundleDescriptorService
  private readonly mfeConfigService: MfeConfigService

  constructor() {
    this.bundleDescriptorService = new BundleDescriptorService(process.cwd())
    this.mfeConfigService = new MfeConfigService()
  }

  public addInternalApiClaim(mfeName: string, apiClaim: ApiClaim, serviceUrl: string): void {
    if (!this.isValidUrl(serviceUrl)) {
      throw new CLIError(`${serviceUrl} is not a valid URL`)
    }

    this.addApiClaim(mfeName, apiClaim)

    this.updateMfeConfigApi(mfeName, apiClaim.name, serviceUrl)
  }

  private addApiClaim(mfeName: string, apiClaim: ApiClaim): void {
    const bundleDescriptor: BundleDescriptor = this.bundleDescriptorService.getBundleDescriptor()
    const { microfrontends, microservices } = bundleDescriptor
    const mfeIdx: number = microfrontends.findIndex(({ name }) => mfeName === name)
    const msIdx: number = microservices.findIndex(({ name }) => apiClaim.serviceId === name)

    if (mfeIdx === -1) {
      throw new CLIError(`Micro Frontend ${mfeName} does not exist`)
    }

    if (msIdx === -1) {
      throw new CLIError(`Micro Service ${apiClaim.serviceId} does not exist`)
    }

    if (!microfrontends[mfeIdx].apiClaims) {
      microfrontends[mfeIdx].apiClaims = []
    } else if (microfrontends[mfeIdx].apiClaims?.some(({ name }) => name === apiClaim.name)) {
      throw new CLIError(`API claim ${apiClaim.name} already exists in the Bundle descriptor`)
    }

    microfrontends[mfeIdx].apiClaims?.push(apiClaim)
    const updatedBundleDescriptor: BundleDescriptor = {
      ...bundleDescriptor,
      microfrontends
    }
    this.bundleDescriptorService.writeBundleDescriptor(updatedBundleDescriptor)
  }

  private updateMfeConfigApi(mfeName: string, apiClaimName: string, url: string) {
    if (!this.mfeConfigService.mfeConfigExists(mfeName)) {
      this.mfeConfigService.writeMfeConfig(mfeName, {})
    }

    const mfeConfig: MfeConfig = this.mfeConfigService.getMfeConfig(mfeName)
    const updatedMfeConfig: MfeConfig = {
      ...mfeConfig,
      api: {
        ...mfeConfig.api,
        [apiClaimName]: { url }
      }
    }
    this.mfeConfigService.writeMfeConfig(mfeName, updatedMfeConfig)
  }

  private isValidUrl(url: string): boolean {
    try {
      // eslint-disable-next-line no-new
      new URL(url)
      return true
    } catch {
      return false
    }
  }
}
