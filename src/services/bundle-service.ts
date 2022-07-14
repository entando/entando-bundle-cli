import { BundleDescriptorService } from './bundle-descriptor-service'
import * as crypto from 'node:crypto'
import * as path from 'node:path'
import { FSService } from './fs-service'

export class BundleService {
  public static isValidBundleProject(): void {
    new BundleDescriptorService().validateBundleDescriptor()

    const fsService = new FSService(
      path.basename(process.cwd()),
      path.dirname(process.cwd())
    )

    fsService.createEmptySubdirectoriesForGitIfNotExist()
  }

  public static generateBundleId(bundle: string): string {
    const sha256 = crypto.createHash('sha256').update(bundle).digest('hex')
    return sha256.slice(0, 8)
  }
}
