import axios, { AxiosResponse } from 'axios'
import { PagedResponseBody } from '../models/api'

type Bundle = {
  bundleId: string
  bundleName: string
  componentTypes: string[]
  installed: boolean
  publicationUrl: string
}

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

  private readonly bundlesPath: string = '/bundles'

  constructor(baseUrl: string, authToken: string) {
    this.baseUrl = baseUrl
    this.authToken = authToken
  }

  public getBundles(): Promise<AxiosResponse<PagedResponseBody<Bundle>>> {
    const url = `${this.baseUrl}${this.bundlesPath}`

    return axios.get(url, {
      headers: {
        Authorization: `Bearer ${this.authToken}`
      }
    })
  }

  public getBundlePlugins(
    bundleId: string
  ): Promise<AxiosResponse<PagedResponseBody<Plugin>>> {
    const url = `${this.baseUrl}${this.bundlesPath}/${bundleId}/plugins`

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
    const url = `${this.baseUrl}${this.bundlesPath}/${bundleId}/plugins/${pluginName}`

    return axios.get(url, {
      headers: {
        Authorization: `Bearer ${this.authToken}`
      }
    })
  }
}
