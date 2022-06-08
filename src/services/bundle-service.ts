import { BundleDescriptorService } from './bundle-descriptor-service'

export class BundleService {
  public static isValidBundleProject(bundleDir: string): void {
    new BundleDescriptorService(bundleDir).validateBundleDescriptor()
  }
}
