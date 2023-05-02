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
      headers['Entando-hub-api-key'] = this.apiKey
    }

    const config = {
      params: params || {},
      headers: headers
    }

      const response = await axios(url, config)
      return response.data
    }

  getBundleGroups(name?: string): Promise<BundleGroup[]> {
    return this.callApi(this.apiPath, name ? { name } : undefined)
  }

  getBundlesByBundleGroupId(versionId: number): Promise<Bundle[]> {
    return this.callApi(`${this.apiPath}/${versionId}`)
  }
}
