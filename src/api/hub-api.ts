import axios from 'axios'
import { debugFactory } from '../services/debug-factory-service'

export type BundleGroup = {
  bundleGroupName: string
  bundleGroupVersionId: number
}

export type Bundle = {
  bundleGroupName: string
  bundleName: string
  gitSrcRepoAddress: string
  bundleGroupVersionId: number
  bundleGroupId: number
  bundleId: number
}

interface BundleGroupAPIParam {
  name: string
}

export class HubAPI {
  private static debug = debugFactory(HubAPI)
  private static readonly ENTANDO_HUB_API_KEY_HEADER = 'Entando-hub-api-key'
  private readonly baseUrl: string
  private readonly apiKey?: string

  private readonly apiPath = '/ent/api/templates/bundlegroups'

  constructor(baseUrl: string, apiKey?: string) {
    this.baseUrl = baseUrl.replace(/\/+$/, '')
    this.apiKey = apiKey
  }

  private async callApi(
    endpoint: string,
    params?: BundleGroupAPIParam
  ): Promise<any[]> {
    const url = `${this.baseUrl}${endpoint}`
    HubAPI.debug(`Calling ${url}`)

    const headers: Record<string, string> = {}

    if (this.apiKey) {
      headers[HubAPI.ENTANDO_HUB_API_KEY_HEADER] = this.apiKey
    }

    const config = {
      params: params || {},
      headers: headers
    }

    try {
      const response = await axios(url, config)
      return response.data
    } catch (error) {
      if (
        axios.isAxiosError(error) &&
        error.response &&
        (error.response?.data as { message: string }).message
      ) {
        const errorData = error.response.data as { message: string }
        HubAPI.debug(
          `Error while calling ${url}: ${error.response.status} ${errorData.message}`
        )
        throw new Error(errorData.message)
      }

      HubAPI.debug(`Error while calling ${url}: ${(error as Error).message}`)
      throw new Error('Error while contacting the Entando Hub')
    }
  }

  getBundleGroups(name?: string): Promise<BundleGroup[]> {
    return this.callApi(this.apiPath, name ? { name } : undefined)
  }

  getBundlesByBundleGroupId(versionId: number): Promise<Bundle[]> {
    return this.callApi(`${this.apiPath}/${versionId}`)
  }
}
