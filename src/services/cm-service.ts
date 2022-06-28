import * as crypto from 'node:crypto'
import { CLIError } from '@oclif/errors'
import axios, { AxiosError } from 'axios'
import { CmAPI } from '../api/cm-api'
import { CmBundle, Plugin } from '../models/cm'

class ApiError extends CLIError {
  constructor(message: string, error?: AxiosError | Error) {
    if (error) {
      if (axios.isAxiosError(error) && error.response) {
        super(
          `${message}\nServer responded with status code: ${error.response.status}`
        )
      } else {
        super(`${message}\n${error.message}`)
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
      throw new CLIError(
        'Environment variables "ENTANDO_CLI_ECR_URL" and "ENTANDO_CLI_ECR_TOKEN" should have values'
      )
    }

    this.cmApi = new CmAPI(cmUrl, cmToken)
  }

  public async getBundles(): Promise<CmBundle[]> {
    try {
      const response = await this.cmApi.getBundles()
      return response.data.payload
    } catch (error) {
      throw new ApiError('Failed to get bundles', error as AxiosError | Error)
    }
  }

  public async getBundleMicroservices(bundleId: string): Promise<Plugin[]> {
    try {
      const response = await this.cmApi.getBundlePlugins(bundleId)
      return response.data.payload
    } catch (error) {
      if (
        axios.isAxiosError(error) &&
        error.response &&
        error.response.status === 404
      ) {
        throw new ApiError(`Bundle with bundleId ${bundleId} cannot be found`)
      }

      throw new ApiError(
        'Failed to get bundle microservices',
        error as AxiosError | Error
      )
    }
  }

  public async getBundleMicroservice(
    bundleId: string,
    serviceName: string
  ): Promise<Plugin> {
    try {
      const response = await this.cmApi.getBundlePlugin(bundleId, serviceName)
      return response.data
    } catch (error) {
      if (
        axios.isAxiosError(error) &&
        error.response &&
        error.response.status === 404
      ) {
        const responseMsg = (error.response.data as { message: string }).message
        if (responseMsg.includes(serviceName)) {
          throw new ApiError(
            `Microservice ${serviceName} with bundleId ${bundleId} cannot be found`
          )
        }

        throw new ApiError(`Bundle with bundleId ${bundleId} cannot be found`)
      }

      throw new ApiError(
        `Failed to get bundle microservice ${serviceName}`,
        error as AxiosError | Error
      )
    }
  }
}
