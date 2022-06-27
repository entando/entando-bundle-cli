import { CLIError } from '@oclif/errors';
import axios from 'axios';
import { CmAPI } from '../api/cm-api';
import { CmBundle, Plugin } from '../models/cm';

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
      let errorMsg = 'Failed to get bundles\n'

      if (axios.isAxiosError(error) && error.response) {
          errorMsg += `Server responded with status code: ${error.response.status}`
          throw new CLIError(errorMsg)
      }

      throw new CLIError(errorMsg + (error as Error).message)
    }
  }

  public async getBundleMicroservices(bundleId: string): Promise<Plugin[]> {
    try {
      const response = await this.cmApi.getBundlePlugins(bundleId)
      return response.data.payload
    } catch (error) {
      let errorMsg = 'Failed to get bundle microservices\n'

      if (axios.isAxiosError(error) && error.response) {
          errorMsg += `Server responded with status code: ${error.response.status}`
          throw new CLIError(errorMsg)
      }

      throw new CLIError(errorMsg + (error as Error).message)
    }
  }

public async getBundleMicroservice(bundleId: string, serviceName: string): Promise<Plugin> {
  try {
    const response = await this.cmApi.getBundlePlugin(bundleId, serviceName)
    return response.data
  } catch (error) {
    let errorMsg = `Failed to get bundle microservice ${serviceName}\n`

    if (axios.isAxiosError(error) && error.response) {
        errorMsg += `Server responded with status code: ${error.response.status}`
        throw new CLIError(errorMsg)
    }

    throw new CLIError(errorMsg + (error as Error).message)
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
