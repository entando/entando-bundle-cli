import { CLIError } from '@oclif/errors'
import { HubAPI } from '../api/hub-api'
import { Bundle, BundleGroup } from '../api/hub-api'

export class HubService {
  private readonly defaultHubUrl = 'https://www.entando.com/entando-hub-api'
  private hubApi: HubAPI

  constructor(hubUrl?: string, apiKey?: string) {
    const parsedUrl = new URL(hubUrl || this.defaultHubUrl)
    const catalogId = parsedUrl.searchParams.get('catalogId')

    if (apiKey && !catalogId) {
      throw new CLIError('catalogId is required when apiKey is provided')
    }

    if (catalogId && !apiKey) {
      throw new CLIError('apiKey is required when catalogId is provided')
    }

    const privateCatalogCredentials =
      apiKey && catalogId ? { apiKey, catalogId: Number(catalogId) } : undefined

    this.hubApi = new HubAPI(
      `${parsedUrl.origin}${parsedUrl.pathname}`,
      privateCatalogCredentials
    )
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
