import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'
import { PagedResponseBody, RequestFilter } from '../models/api'
import { CmBundle, Plugin } from '../models/cm'
import { debugFactory } from '../services/debug-factory-service'

export class CmAPI {
  private static debug = debugFactory(CmAPI)

  private readonly baseUrl: string
  private readonly authToken: string

  private readonly bundlesPath: string = '/bundles'

  constructor(baseUrl: string, authToken: string) {
    this.baseUrl = baseUrl.replace(/\/+$/, '')
    this.authToken = authToken
  }

  public getBundles(
    filters?: RequestFilter[]
  ): Promise<AxiosResponse<PagedResponseBody<CmBundle>>> {
    let url = `${this.baseUrl}${this.bundlesPath}`

    if (filters) {
      url += `?${this.filtersToQueryParams(filters)}`
    }

    CmAPI.debug(`fetching bundles from ${url}`)
    return this.getWithAuth(url)
  }

  public getBundlePlugins(
    bundleId: string
  ): Promise<AxiosResponse<PagedResponseBody<Plugin>>> {
    const url = `${this.baseUrl}${this.bundlesPath}/${bundleId}/plugins`

    CmAPI.debug(`fetching microservices of bundle ${bundleId} from ${url}`)
    return this.getWithAuth(url)
  }

  public getBundlePlugin(
    bundleId: string,
    pluginName: string
  ): Promise<AxiosResponse<Plugin>> {
    const url = `${this.baseUrl}${this.bundlesPath}/${bundleId}/plugins/${pluginName}`

    CmAPI.debug(
      `fetching microservice ${pluginName} of bundle ${bundleId} from ${url}`
    )
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
