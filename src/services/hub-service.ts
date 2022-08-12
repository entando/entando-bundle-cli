import { CLIError } from '@oclif/errors'
import { HubAPI } from '../api/hub-api'
import { Bundle, BundleGroup } from '../api/hub-api'

export class HubService {
  private readonly defaultHubUrl = 'https://www.entando.com/entando-hub-api'
  private hubApi: HubAPI

  constructor(hubUrl?: string) {
    this.hubApi = new HubAPI(hubUrl || this.defaultHubUrl)
  }

  public async loadBundleGroups(): Promise<BundleGroup[]> {
    try {
      return await this.hubApi.getBundleGroups()
    } catch {
      throw new CLIError('Error while contacting the Entando Hub')
    }
  }

  public async loadBundlesFromBundleGroup(
    bundleGroup: BundleGroup
  ): Promise<Bundle[]> {
    try {
      return await this.hubApi.getBundlesByBundleGroupId(
        bundleGroup.bundleGroupVersionId
      )
    } catch {
      throw new CLIError('Error while contacting the Entando Hub')
    }
  }
}
