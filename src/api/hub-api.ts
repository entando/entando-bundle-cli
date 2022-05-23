import axios from 'axios'

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
  private readonly baseUrl: string

  private readonly apiPath = '/ent/api/templates/bundlegroups'

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  async callApi(uri: string, params?: BundleGroupAPIParam): Promise<any[]> {
    const response = await axios(`${this.baseUrl}${uri}`, params ? { params } : {})
    const { data } = response

    return data
  }

  getBundleGroups(name?: string): Promise<BundleGroup[]> {
    return this.callApi(this.apiPath, name ? { name } : undefined)
  }

  getBundlesByBundleGroupId(versionId: number): Promise<Bundle[]> {
    return this.callApi(`${this.apiPath}/${versionId}`)
  }
}
