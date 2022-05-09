import axios from 'axios'
import { BundleGroup, BundleGroupId } from '../models/bundle-descriptor'

interface BundleGroupAPIParam {
  name: string
}

export default class HubAPI {
  private readonly defaultBaseUrl = 'https://63d6be0e-bd49-4c76-8fe5-195bb7cf88a5.mock.pstmn.io'
  private readonly baseUrl: string

  private readonly apiPath = '/ent/api/templates/bundlegroups'

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || this.defaultBaseUrl
  }

  async callApi(uri: string, params?: BundleGroupAPIParam): Promise<any[]> {
    const response = await axios(`${this.baseUrl}${uri}`, params ? { params } : {})
    const { data } = response

    return data
  }

  getBundleGroups(name?: string): Promise<BundleGroupId[]> {
    return this.callApi(this.apiPath, name ? { name } : undefined)
  }

  getBundleGroupById(versionId: number): Promise<BundleGroup[]> {
    return this.callApi(`${this.apiPath}/${versionId}`)
  }
}
