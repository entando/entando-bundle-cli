import { CLIError } from '@oclif/errors';
import axios, { AxiosError } from 'axios';
import { CmAPI } from '../api/cm-api';
import { CmBundle, Plugin } from '../models/cm';

class ApiError extends CLIError {
  constructor(message: string, error?: AxiosError | Error) {
    if (error) {
      if (axios.isAxiosError(error) && error.response) {
        super(message + `\nServer responded with status code: ${error.response.status}`)
      } else {
        super(message + error.message)
      }
    } else {
      super(message)
    }
  }
}

export class CmService {
  private readonly cmApi: CmAPI

  constructor() {
    const cmUrl = process.env.ENTANDO_CLI_ECR_URL
    const cmToken = process.env.ENTANDO_CLI_ECR_TOKEN

    if (!cmUrl || !cmToken) {
      throw new CLIError('Both "process.env.ENTANDO_CLI_ECR_URL" and "process.env.ENTANDO_CLI_ECR_TOKEN" should have values')
    }

    this.cmApi = new CmAPI(cmUrl, cmToken)
  }

  public async getBundles(): Promise<CmBundle[]> {
    try {
      const response = await this.cmApi.getBundles()
      return response.data.payload
    } catch (error) {
      const errorMsg = 'Failed to get bundles'
      throw new ApiError(errorMsg, error as AxiosError | Error)
    }
  }

  public async getBundleMicroservices(bundleId: string): Promise<Plugin[]> {
    try {
      const response = await this.cmApi.getBundlePlugins(bundleId)
      return response.data.payload
    } catch (error) {
      const errorMsg = 'Failed to get bundle microservices'
      throw new ApiError(errorMsg, error as AxiosError | Error)
    }
  }

public async getBundleMicroservice(bundleId: string, serviceName: string): Promise<Plugin> {
  try {
    const response = await this.cmApi.getBundlePlugin(bundleId, serviceName)
    return response.data
  } catch (error) {
    const errorMsg = `Failed to get bundle microservice ${serviceName}`
    throw new ApiError(errorMsg, error as AxiosError | Error)
  }
}

  public getBundleMicroserviceUrl(
    bundleId: string,
    serviceName: string
  ): string {
    // eslint-disable-next-line no-warning-comments
    // TODO: ENG-3788
    return `http://mock-${bundleId}-${serviceName}`
  }
}
