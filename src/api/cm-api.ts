import axios, { AxiosResponse } from 'axios'
import { PagedResponseBody } from '../models/api'

type Plugin = {
  bundleId: string
  pluginId: string
  pluginName: string
  pluginCode: string
  ingressPath: string
  roles: string[]
}

export class CmAPI {
  private readonly baseUrl: string
  private readonly authToken: string

  private readonly bundlePath: string = '/bundle'

  constructor(baseUrl: string, authToken: string) {
    this.baseUrl = baseUrl
    this.authToken = authToken
  }

  public getBundlePlugins(
    bundleId: string
  ): Promise<AxiosResponse<PagedResponseBody<Plugin>>> {
    const url = `${this.baseUrl}${this.bundlePath}/${bundleId}/plugins`

    return axios.get(url, {
      headers: {
        Authorization: `Bearer ${this.authToken}`
      }
    })
  }

  public getBundlePlugin(
    bundleId: string,
    pluginName: string
  ): Promise<AxiosResponse<Plugin>> {
    const url = `${this.baseUrl}${this.bundlePath}/${bundleId}/plugins/${pluginName}`

    return axios.get(url, {
      headers: {
        Authorization: `Bearer ${this.authToken}`
      }
    })
  }
}
