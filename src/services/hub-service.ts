import { CLIError } from '@oclif/errors'
import { HubAPI } from '../api/hub-api'
import { Bundle, BundleGroup } from '../api/hub-api'
import { debugFactory } from './debug-factory-service'

const DEFAULT_HUB_URL = 'https://auth.entando.com/entando-hub-api'

// Former default Hub URLs, no longer served. Released ent versions still export
// one of them as ENTANDO_CLI_DEFAULT_HUB, so they are replaced with the default.
const LEGACY_HUB_URLS = new Set([
  'https://entando.com/entando-hub-api',
  'https://www.entando.com/entando-hub-api'
])

export class HubService {
  private static debug = debugFactory(HubService)
  private hubApi: HubAPI

  constructor(hubUrl?: string, apiKey?: string) {
    const parsedUrl = HubService.resolveHubUrl(hubUrl)
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

  private static resolveHubUrl(hubUrl?: string): URL {
    const parsedUrl = new URL(hubUrl || DEFAULT_HUB_URL)
    const baseUrl = `${parsedUrl.origin}${parsedUrl.pathname}`.replace(
      /\/+$/,
      ''
    )

    if (LEGACY_HUB_URLS.has(baseUrl)) {
      HubService.debug(
        `Replacing legacy Hub URL ${baseUrl} with ${DEFAULT_HUB_URL}`
      )
      const resolvedUrl = new URL(DEFAULT_HUB_URL)
      resolvedUrl.search = parsedUrl.search
      return resolvedUrl
    }

    return parsedUrl
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
