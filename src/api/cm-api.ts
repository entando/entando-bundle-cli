import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'
import { PagedResponseBody, RequestFilter } from '../models/api'

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

  public getBundles(
    filters?: RequestFilter[]
  ): Promise<AxiosResponse<PagedResponseBody<Bundle>>> {
    let url = `${this.baseUrl}${this.bundlesPath}`

    if (filters) {
      url += `?${this.filtersToQueryParams(filters)}`
    }

    return this.getWithAuth(url)
  }

  public getBundlePlugins(
    bundleId: string
  ): Promise<AxiosResponse<PagedResponseBody<Plugin>>> {
    const url = `${this.baseUrl}${this.bundlesPath}/${bundleId}/plugins`

    return this.getWithAuth(url)
  }

  public getBundlePlugin(
    bundleId: string,
    pluginName: string
  ): Promise<AxiosResponse<Plugin>> {
    const url = `${this.baseUrl}${this.bundlesPath}/${bundleId}/plugins/${pluginName}`

    return this.getWithAuth(url)
  }

  private filtersToQueryParams(filters: RequestFilter[]): string {
    let queryParams = ''
    for (const [idx, { attribute, operator, value }] of filters.entries()) {
      queryParams += `filters[${idx}].attribute=${attribute}&filters[${idx}].operator=${operator}&filters[${idx}].value=${value}`
    }

    return queryParams
  }

  private getWithAuth(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<any>> {
    return axios.get(url, {
      headers: {
        Authorization: `Bearer ${this.authToken}`
      },
      ...config
    })
  }
}
