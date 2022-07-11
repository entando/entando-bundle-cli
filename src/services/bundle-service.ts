import { BundleDescriptorService } from './bundle-descriptor-service'
import * as crypto from 'node:crypto'
import * as path from 'node:path'
import {
  MICROFRONTENDS_FOLDER,
  MICROSERVICES_FOLDER,
  PSC_FOLDER
} from '../paths'
import { FSService } from './fs-service'

export class BundleService {
  public static isValidBundleProject(): void {
    const bundleDescriptor =
      new BundleDescriptorService().validateBundleDescriptor()

    const fsService = new FSService(
      bundleDescriptor.name,
      path.dirname(process.cwd())
    )

    fsService.createEmptySubDirectoryForGitIfNotExist(PSC_FOLDER)
    fsService.createEmptySubDirectoryForGitIfNotExist(MICROFRONTENDS_FOLDER)
    fsService.createEmptySubDirectoryForGitIfNotExist(MICROSERVICES_FOLDER)
  }

  public static generateBundleId(bundle: string): string {
    const sha256 = crypto.createHash('sha256').update(bundle).digest('hex')
    return sha256.slice(0, 8)
  }
}
