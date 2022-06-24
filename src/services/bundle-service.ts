import { BundleDescriptorService } from './bundle-descriptor-service'
import * as crypto from 'node:crypto'

export class BundleService {
  public static isValidBundleProject(): void {
    new BundleDescriptorService().validateBundleDescriptor()
  }

  public static generateBundleId(bundle: string): string {
    const sha256 = crypto.createHash('sha256').update(bundle).digest('hex')
    return sha256.slice(0, 8)
  }
}
