import { CLIError } from '@oclif/errors'
import { ApiClaim, ExternalApiClaim } from '../models/bundle-descriptor'
import { BundleDescriptorService } from './bundle-descriptor-service'
import { BundleDescriptor } from '../models/bundle-descriptor'
import { MfeConfigService } from './mfe-config-service'
import { MfeConfig } from '../models/mfe-config'
import { CMService } from './cm-service'

export class ApiClaimService {
  private readonly bundleDescriptorService: BundleDescriptorService
  private readonly mfeConfigService: MfeConfigService
  private readonly cmService: CMService

  constructor() {
    this.bundleDescriptorService = new BundleDescriptorService()
    this.mfeConfigService = new MfeConfigService()
    this.cmService = new CMService()
  }

  public addInternalApiClaim(
    mfeName: string,
    apiClaim: ApiClaim,
    serviceUrl: string
  ): void {
    if (!this.isValidUrl(serviceUrl)) {
      throw new CLIError(`${serviceUrl} is not a valid URL`)
    }

    if (!this.internalMicroserviceExists(apiClaim.serviceName)) {
      throw new CLIError(`Microservice ${apiClaim.serviceName} does not exist`)
    }

    this.addApiClaim(mfeName, apiClaim)
    this.updateMfeConfigApiClaim(mfeName, apiClaim.name, serviceUrl)
  }

  public addExternalApiClaim(
    mfeName: string,
    apiClaim: ExternalApiClaim
  ): void {
    const url = this.cmService.getBundleMicroserviceUrl(
      apiClaim.bundle,
      apiClaim.serviceName
    )

    if (!url) {
      throw new CLIError('Failed to get microservice URL')
    }

    this.addApiClaim(mfeName, apiClaim)
    this.updateMfeConfigApiClaim(mfeName, apiClaim.name, url)
  }

  public removeApiClaim(mfeName: string, claimName: string): void {
    const bundleDescriptor: BundleDescriptor =
      this.bundleDescriptorService.getBundleDescriptor()
    const { microfrontends } = bundleDescriptor
    const mfeIdx: number = microfrontends.findIndex(
      ({ name }) => mfeName === name
    )

    if (mfeIdx === -1) {
      throw new CLIError(`Micro Frontend ${mfeName} does not exist`)
    }

    const apiClaimIdx: number = (
      microfrontends[mfeIdx].apiClaims || []
    ).findIndex(({ name }) => name === claimName)

    if (apiClaimIdx === -1) {
      throw new CLIError(`API claim named ${claimName} does not exist`)
    }

    microfrontends[mfeIdx].apiClaims!.splice(apiClaimIdx, 1)
    this.bundleDescriptorService.writeBundleDescriptor(bundleDescriptor)

    const mfeConfig: MfeConfig = this.mfeConfigService.getMfeConfig(mfeName)
    delete (mfeConfig.systemParams?.api || {})[claimName]
    this.mfeConfigService.writeMfeConfig(mfeName, mfeConfig)
  }

  private addApiClaim(
    mfeName: string,
    apiClaim: ApiClaim | ExternalApiClaim
  ): void {
    const bundleDescriptor: BundleDescriptor =
      this.bundleDescriptorService.getBundleDescriptor()
    const { microfrontends } = bundleDescriptor
    const mfeIdx: number = microfrontends.findIndex(
      ({ name }) => mfeName === name
    )

    if (mfeIdx === -1) {
      throw new CLIError(`Micro Frontend ${mfeName} does not exist`)
    }

    if (!microfrontends[mfeIdx].apiClaims) {
      microfrontends[mfeIdx].apiClaims = []
    } else if (
      microfrontends[mfeIdx].apiClaims!.some(
        ({ name }) => name === apiClaim.name
      )
    ) {
      throw new CLIError(
        `API claim ${apiClaim.name} already exists in the Bundle descriptor`
      )
    }

    microfrontends[mfeIdx].apiClaims!.push(apiClaim)
    this.bundleDescriptorService.writeBundleDescriptor(bundleDescriptor)
  }

  private updateMfeConfigApiClaim(
    mfeName: string,
    apiClaimName: string,
    url: string
  ) {
    if (!this.mfeConfigService.mfeConfigExists(mfeName)) {
      this.mfeConfigService.writeMfeConfig(mfeName, {})
    }

    const mfeConfig: MfeConfig = this.mfeConfigService.getMfeConfig(mfeName)
    const updatedMfeConfig: MfeConfig = {
      ...mfeConfig,
      systemParams: {
        api: {
          ...mfeConfig.systemParams?.api,
          [apiClaimName]: { url }
        }
      }
    }
    this.mfeConfigService.writeMfeConfig(mfeName, updatedMfeConfig)
  }

  private internalMicroserviceExists(msName: string): boolean {
    const { microservices } = this.bundleDescriptorService.getBundleDescriptor()

    return microservices.some(({ name }) => name === msName)
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
