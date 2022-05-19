import { CLIError } from '@oclif/errors'
import HubAPI from "../api/hub-api"
import { Bundle, BundleGroup } from "../models/bundle-descriptor"

export default class HubService {
  private hubApi: HubAPI

  constructor(hubUrl?: string) {
    this.hubApi = new HubAPI(hubUrl)
  }

  public async loadBundleGroups(): Promise<BundleGroup[]> {
    try {
      return await this.hubApi.getBundleGroups()
    } catch {
      throw new CLIError('Hub is not accessible')
    }
  }

  public async loadBundlesFromBundleGroup(bundleGroup: BundleGroup): Promise<Bundle[]> {
    try {
      return await this.hubApi.getBundlesByBundleGroupId(bundleGroup.bundleGroupVersionId)
    } catch {
      throw new CLIError('Hub is not accessible')
    }
  }
}
