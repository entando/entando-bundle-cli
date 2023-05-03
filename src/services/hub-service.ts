import { CLIError } from '@oclif/errors'
import { HubAPI } from '../api/hub-api'
import { Bundle, BundleGroup } from '../api/hub-api'
import { debugFactory } from './debug-factory-service'

export class HubService {
  private static debug = debugFactory(HubService)
  private readonly defaultHubUrl = 'https://www.entando.com/entando-hub-api'
  private hubApi: HubAPI

  constructor(hubUrl?: string, apiKey?: string) {
    this.hubApi = new HubAPI(hubUrl || this.defaultHubUrl, apiKey)
  }

  public async loadBundleGroups(): Promise<BundleGroup[]> {
    try {
      return await this.hubApi.getBundleGroups()
    } catch (error) {
      throw new CLIError((error as Error).message)
    }
  }

  public async loadBundlesFromBundleGroup(
    bundleGroup: BundleGroup
  ): Promise<Bundle[]> {
    try {
      return await this.hubApi.getBundlesByBundleGroupId(
        bundleGroup.bundleGroupVersionId
      )
    } catch (error) {
      throw new CLIError((error as Error).message)
    }
  }
}
