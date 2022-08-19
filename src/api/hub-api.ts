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

  private readonly apiPath = '/ent/api/templates/bundlegroups'

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/+$/, '')
  }

  private async callApi(
    endpoint: string,
    params?: BundleGroupAPIParam
  ): Promise<any[]> {
    const url = `${this.baseUrl}${endpoint}`
    HubAPI.debug(`Calling ${url}`)
    const response = await axios(url, params ? { params } : {})
    return response.data
  }

  getBundleGroups(name?: string): Promise<BundleGroup[]> {
    return this.callApi(this.apiPath, name ? { name } : undefined)
  }

  getBundlesByBundleGroupId(versionId: number): Promise<Bundle[]> {
    return this.callApi(`${this.apiPath}/${versionId}`)
  }
}
